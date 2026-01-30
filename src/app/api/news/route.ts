/**
 * Enhanced News API Route v2
 * - Multi-source aggregation (Official, GitHub, HN, RSS, Product Hunt)
 * - Smart scheduling to minimize API calls
 * - Serves from cache when appropriate
 * - Full refresh only when data is stale
 */

import { NextResponse } from 'next/server';
import { fetchAllSources, getSourcesHealth } from '@/lib/sources';
import { batchAnalyze, getAnalysisStats } from '@/lib/groq';
import { scheduler } from '@/lib/scheduler';
import { getCachedNews, setCachedNews, cleanupAllCaches } from '@/lib/advanced-cache';
import { NewsItem, NewsCategory, NewsResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 26; // Netlify Pro max (free tier is 10s, but we'll use 26s for safety)

// Timeout wrapper to prevent 502s
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
    ]);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const statusOnly = searchParams.get('status') === 'true';
    const cleanupCache = searchParams.get('cleanup_cache') === 'true';

    try {
        // Initialize scheduler with timeout
        await withTimeout(scheduler.init(), 2000, undefined);

        // Cleanup cache if requested
        if (cleanupCache) {
            await cleanupAllCaches().catch(() => {});
            return NextResponse.json({ success: true, message: 'Cache cleaned' });
        }

        // If status only, return scheduler and cache status
        if (statusOnly) {
            const analysisStats = await withTimeout(getAnalysisStats(), 2000, {
                cache: { 
                    totalEntries: 0, 
                    validEntries: 0, 
                    expiredEntries: 0,
                    oldestEntry: null,
                    newestEntry: null,
                    cacheHits: 0,
                    cacheMisses: 0,
                },
                apiPool: { totalRequests: 0, totalErrors: 0, keysInCooldown: 0, healthyKeys: 10 },
                knownModels: 122,
                knownIDEs: 61,
                knownCompanies: 63,
            });

            return NextResponse.json({
                scheduler: scheduler.getStatus(),
                analysis: analysisStats,
            });
        }

        // Always try to get cached data first for quick response
        const quickCache = await getCachedNews();
        if (quickCache && quickCache.length > 0 && !forceRefresh) {
            // Check if cache is fresh enough (less than 30 minutes old)
            // Use pubDate of first item as proxy for cache age
            const cacheAge = Date.now() - (quickCache[0]?.pubDate ? new Date(quickCache[0].pubDate).getTime() : 0);
            if (cacheAge < 30 * 60 * 1000) {
                console.log(`[API] Serving fresh cache (${quickCache.length} items)`);
                return createResponse(quickCache, true, 'quick_cache');
            }
        }

        // Determine action based on scheduler
        const action = forceRefresh ? 'fetch_and_analyze' : await withTimeout(scheduler.getNextAction(), 1000, 'serve_cache');

        console.log(`[API] Action: ${action}, Force: ${forceRefresh}`);

        // Handle different actions
        switch (action) {
            case 'wait':
                // Another process is running, return cached data
                const waitCache = await getCachedNews();
                if (waitCache) {
                    return createResponse(waitCache, true, 'wait');
                }
                return NextResponse.json(
                    { error: 'Processing in progress, please wait', status: 'processing' },
                    { status: 202 }
                );

            case 'serve_cache':
                // Serve from cache
                const cached = await getCachedNews();
                if (cached && cached.length > 0) {
                    console.log(`[API] Serving ${cached.length} items from cache`);
                    return createResponse(cached, true, 'cache');
                }
                // Cache empty, fall through to fetch
                console.log('[API] Cache empty, falling through to fetch');
                // Fall through to fetch_and_analyze

            case 'fetch_only':
            case 'fetch_and_analyze':
                // Mark as processing
                await scheduler.startAnalysis().catch(() => {});

                try {
                    // Fetch from ALL sources with timeout (20s max)
                    console.log('[API] Fetching from all sources (last 3 days)...');
                    const fetchResult = await withTimeout(
                        fetchAllSources(3),
                        20000, // 20 second timeout for fetching
                        { items: [], sourceStats: [] }
                    );
                    
                    const { items: rawNews, sourceStats } = fetchResult;
                    await scheduler.completeRSSFetch().catch(() => {});

                    const sourcesHealth = getSourcesHealth(sourceStats);
                    console.log(`[API] Sources health: ${sourcesHealth.healthy}/${sourcesHealth.total} healthy`);

                    if (rawNews.length === 0) {
                        await scheduler.failProcessing().catch(() => {});
                        // Return cached if available
                        const fallbackCache = await getCachedNews();
                        if (fallbackCache && fallbackCache.length > 0) {
                            return createResponse(fallbackCache, true, 'fallback');
                        }
                        return NextResponse.json(
                            { error: 'No news available', items: [] },
                            { status: 200 }
                        );
                    }

                    // Analyze with AI - process top 15 items (reduced from 25) to avoid timeouts
                    // Groq free tier is very strict, so we limit to avoid hitting limits
                    console.log(`[API] Analyzing ${rawNews.length} articles (top 15)...`);
                    const topNews = rawNews.slice(0, 15);
                    
                    // Analyze with timeout (15s max)
                    const analyzedNews = await withTimeout(
                        batchAnalyze(topNews),
                        15000, // 15 second timeout for analysis
                        topNews // Fallback to unanalyzed news if timeout
                    );

                    // Save to cache
                    await setCachedNews(analyzedNews).catch(() => {});
                    await scheduler.completeAnalysis().catch(() => {});

                    // Cleanup old cache entries periodically (non-blocking)
                    cleanupAllCaches().catch(() => {});

                    console.log(`[API] Returning ${analyzedNews.length} analyzed items`);
                    return createResponse(analyzedNews, false, 'fresh');

                } catch (processingError) {
                    console.error('[API] Processing error:', processingError);
                    await scheduler.failProcessing().catch(() => {});
                    
                    // Always return cached data on error
                    const errorCache = await getCachedNews();
                    if (errorCache && errorCache.length > 0) {
                        console.log('[API] Returning cached data after processing error');
                        return createResponse(errorCache, true, 'error_fallback');
                    }
                    
                    // If no cache, return partial data
                    throw processingError;
                }

            default:
                // Fallback to cache
                const defaultCache = await getCachedNews();
                if (defaultCache) {
                    return createResponse(defaultCache, true, 'default');
                }
                return NextResponse.json({ error: 'No data available', items: [] });
        }

    } catch (error) {
        console.error('[API] Error:', error);

        // Always try to return cached data on error (with timeout)
        try {
            const errorCache = await withTimeout(getCachedNews(), 2000, null);
            if (errorCache && errorCache.length > 0) {
                console.log('[API] Returning cached data after error');
                return createResponse(errorCache, true, 'error_fallback');
            }
        } catch (cacheError) {
            console.error('[API] Cache retrieval error:', cacheError);
        }

        // Last resort: return empty response with error info
        return NextResponse.json(
            { 
                error: 'Failed to fetch news', 
                details: error instanceof Error ? error.message : 'Unknown error',
                items: [],
                stats: {
                    totalArticles: 0,
                    newArticles: 0,
                    sources: 0,
                    categories: {} as Record<NewsCategory, number>,
                },
                scheduler: {
                    nextRefresh: 0,
                    isProcessing: false,
                },
            },
            { status: 200 } // Return 200 instead of 500 to prevent frontend errors
        );
    }
}

/**
 * Create standardized API response
 */
function createResponse(items: NewsItem[], fromCache: boolean, source: string): NextResponse {
    try {
        // Ensure items is an array
        const safeItems = Array.isArray(items) ? items : [];

        // Calculate category counts
        const categories: Record<NewsCategory, number> = {
            model_launch: 0,
            ide_update: 0,
            ide_launch: 0,
            video_ai: 0,
            image_ai: 0,
            agent: 0,
            api: 0,
            feature: 0,
            research: 0,
            tutorial: 0,
            market: 0,
            other: 0,
        };

        safeItems.forEach(item => {
            if (item?.category && item.category in categories) {
                categories[item.category]++;
            }
        });

        // Count unique sources
        const sources = new Set(safeItems.map(item => item?.source).filter(Boolean)).size;

        // Get breaking/new items count
        const newItems = safeItems.filter(item => item?.isBreaking || item?.priority === 'high').length;

        const response: NewsResponse = {
            items: safeItems,
            lastUpdated: new Date().toISOString(),
            fromCache,
            stats: {
                totalArticles: safeItems.length,
                newArticles: newItems,
                sources,
                categories,
            },
            scheduler: {
                nextRefresh: scheduler.getTimeUntilNextAnalysis(),
                isProcessing: scheduler.isCurrentlyProcessing(),
            },
        };

        console.log(`[API] Response: ${safeItems.length} items, fromCache: ${fromCache}, source: ${source}`);

        return NextResponse.json(response);
    } catch (error) {
        console.error('[API] Error creating response:', error);
        // Fallback response
        return NextResponse.json({
            items: [],
            lastUpdated: new Date().toISOString(),
            fromCache: false,
            stats: {
                totalArticles: 0,
                newArticles: 0,
                sources: 0,
                categories: {} as Record<NewsCategory, number>,
            },
            scheduler: {
                nextRefresh: 0,
                isProcessing: false,
            },
        });
    }
}

/**
 * POST endpoint for manual operations
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'reset_scheduler':
                await scheduler.reset();
                return NextResponse.json({ success: true, message: 'Scheduler reset' });

            case 'cleanup_cache':
                await cleanupAllCaches();
                return NextResponse.json({ success: true, message: 'Cache cleaned' });

            case 'get_stats':
                const stats = await getAnalysisStats();
                return NextResponse.json({ success: true, stats });

            default:
                return NextResponse.json(
                    { error: 'Unknown action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to process action' },
            { status: 500 }
        );
    }
}
