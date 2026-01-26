/**
 * Multi-Source News Aggregation System
 * - Official Changelogs (Cursor, VS Code, Claude, OpenAI)
 * - GitHub Releases API
 * - Hacker News API
 * - Enhanced RSS Feeds
 * - Real-time tech news APIs
 */

import { NewsItem, SourceTier } from '../types';
import { fetchHackerNewsAI } from './hacker-news';
import { fetchGitHubReleases } from './github-releases';
import { fetchOfficialChangelogs } from './official-changelogs';
import { fetchEnhancedRSS } from './enhanced-rss';
import { fetchProductHuntAI } from './product-hunt';
import { subDays, isAfter } from 'date-fns';

export interface SourceResult {
    source: string;
    items: NewsItem[];
    success: boolean;
    error?: string;
}

/**
 * Fetch news from all sources with parallel execution
 */
export async function fetchAllSources(lookbackDays: number = 3): Promise<{
    items: NewsItem[];
    sourceStats: SourceResult[];
}> {
    const cutoffDate = subDays(new Date(), lookbackDays);
    
    console.log(`[Sources] Fetching from all sources (${lookbackDays} day lookback)...`);
    
    // Fetch from all sources in parallel
    const results = await Promise.allSettled([
        fetchOfficialChangelogs(lookbackDays),
        fetchGitHubReleases(lookbackDays),
        fetchHackerNewsAI(lookbackDays),
        fetchEnhancedRSS(lookbackDays),
        fetchProductHuntAI(lookbackDays),
    ]);
    
    const sourceStats: SourceResult[] = [];
    const allItems: NewsItem[] = [];
    
    const sourceNames = [
        'Official Changelogs',
        'GitHub Releases',
        'Hacker News',
        'RSS Feeds',
        'Product Hunt',
    ];
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const items = result.value;
            sourceStats.push({
                source: sourceNames[index],
                items,
                success: true,
            });
            allItems.push(...items);
            console.log(`[Sources] ${sourceNames[index]}: ${items.length} items`);
        } else {
            sourceStats.push({
                source: sourceNames[index],
                items: [],
                success: false,
                error: result.reason?.message || 'Unknown error',
            });
            console.warn(`[Sources] ${sourceNames[index]} failed:`, result.reason?.message);
        }
    });
    
    // Deduplicate and filter
    const filtered = deduplicateAndFilter(allItems, cutoffDate);
    
    console.log(`[Sources] Total: ${allItems.length} raw, ${filtered.length} after dedup/filter`);
    
    return {
        items: filtered,
        sourceStats,
    };
}

/**
 * Deduplicate news items by URL and title similarity
 */
function deduplicateAndFilter(items: NewsItem[], cutoffDate: Date): NewsItem[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    
    // Sort by tier priority first (official > trusted > community > aggregator)
    const tierOrder: Record<SourceTier, number> = {
        official: 0,
        trusted: 1,
        community: 2,
        aggregator: 3,
    };
    
    const sorted = [...items].sort((a, b) => {
        const tierA = tierOrder[a.sourceTier || 'aggregator'];
        const tierB = tierOrder[b.sourceTier || 'aggregator'];
        if (tierA !== tierB) return tierA - tierB;
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
    
    return sorted.filter(item => {
        // Filter by date
        const date = new Date(item.pubDate);
        if (isNaN(date.getTime()) || !isAfter(date, cutoffDate)) return false;
        
        // Normalize URL
        const normalizedUrl = item.link.toLowerCase()
            .replace(/https?:\/\//, '')
            .replace(/www\./, '')
            .replace(/\/$/, '');
        
        if (seenUrls.has(normalizedUrl)) return false;
        seenUrls.add(normalizedUrl);
        
        // Normalize title (remove special chars, lowercase)
        const normalizedTitle = item.title.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 50);
        
        if (normalizedTitle.length > 10 && seenTitles.has(normalizedTitle)) return false;
        seenTitles.add(normalizedTitle);
        
        return true;
    }).slice(0, 100); // Limit to top 100 items
}

/**
 * Get source health status
 */
export function getSourcesHealth(stats: SourceResult[]) {
    const healthy = stats.filter(s => s.success).length;
    const total = stats.length;
    
    return {
        healthy,
        total,
        percentage: Math.round((healthy / total) * 100),
        sources: stats.map(s => ({
            name: s.source,
            status: s.success ? 'healthy' : 'error',
            itemCount: s.items.length,
            error: s.error,
        })),
    };
}
