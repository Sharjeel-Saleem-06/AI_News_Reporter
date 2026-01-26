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
export const maxDuration = 120; // Allow up to 120 seconds for full refresh

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const statusOnly = searchParams.get('status') === 'true';

    try {
        // Initialize scheduler
        await scheduler.init();

        // If status only, return scheduler and cache status
        if (statusOnly) {
            const analysisStats = await getAnalysisStats();

            return NextResponse.json({
                scheduler: scheduler.getStatus(),
                analysis: analysisStats,
            });
        }

        // Determine action based on scheduler
        const action = forceRefresh ? 'fetch_and_analyze' : await scheduler.getNextAction();

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
                await scheduler.startAnalysis();

                try {
                    // Fetch from ALL sources - 3 day lookback for fresh content
                    console.log('[API] Fetching from all sources (last 3 days)...');
                    const { items: rawNews, sourceStats } = await fetchAllSources(3);
                    await scheduler.completeRSSFetch();

                    const sourcesHealth = getSourcesHealth(sourceStats);
                    console.log(`[API] Sources health: ${sourcesHealth.healthy}/${sourcesHealth.total} healthy`);

                    if (rawNews.length === 0) {
                        await scheduler.failProcessing();
                        // Return cached if available
                        const fallbackCache = await getCachedNews();
                        if (fallbackCache) {
                            return createResponse(fallbackCache, true, 'fallback');
                        }
                        return NextResponse.json(
                            { error: 'No news available', items: [] },
                            { status: 200 }
                        );
                    }

                    // Analyze with AI - process top 25 items to avoid rate limits
                    // Groq free tier is very strict, so we limit to avoid hitting limits
                    console.log(`[API] Analyzing ${rawNews.length} articles (top 25)...`);
                    const topNews = rawNews.slice(0, 25);
                    const analyzedNews = await batchAnalyze(topNews);

                    // Save to cache
                    await setCachedNews(analyzedNews);
                    await scheduler.completeAnalysis();

                    // Cleanup old cache entries periodically
                    await cleanupAllCaches();

                    console.log(`[API] Returning ${analyzedNews.length} analyzed items`);
                    return createResponse(analyzedNews, false, 'fresh');

                } catch (processingError) {
                    await scheduler.failProcessing();
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

        // Try to return cached data on error
        try {
            const errorCache = await getCachedNews();
            if (errorCache && errorCache.length > 0) {
                console.log('[API] Returning cached data after error');
                return createResponse(errorCache, true, 'error_fallback');
            }
        } catch {
            // Ignore cache errors
        }

        return NextResponse.json(
            { error: 'Failed to fetch news', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * Create standardized API response
 */
function createResponse(items: NewsItem[], fromCache: boolean, source: string): NextResponse {
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

    items.forEach(item => {
        if (item.category && item.category in categories) {
            categories[item.category]++;
        }
    });

    // Count unique sources
    const sources = new Set(items.map(item => item.source)).size;

    // Get breaking/new items count
    const newItems = items.filter(item => item.isBreaking || item.priority === 'high').length;

    const response: NewsResponse = {
        items,
        lastUpdated: new Date().toISOString(),
        fromCache,
        stats: {
            totalArticles: items.length,
            newArticles: newItems,
            sources,
            categories,
        },
        scheduler: {
            nextRefresh: scheduler.getTimeUntilNextAnalysis(),
            isProcessing: scheduler.isCurrentlyProcessing(),
        },
    };

    console.log(`[API] Response: ${items.length} items, fromCache: ${fromCache}, source: ${source}`);

    return NextResponse.json(response);
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
