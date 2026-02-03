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
 * Deduplicate and filter news items
 * CRITICAL: Filter out low-value content for AI/Prompt Engineers
 */
function deduplicateAndFilter(items: NewsItem[], cutoffDate: Date): NewsItem[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    
    // STEP 1: Filter out noise/low-value content
    const filtered = items.filter(item => {
        const title = item.title.toLowerCase();
        const content = (item.contentSnippet || '').toLowerCase();
        const fullText = `${title} ${content}`;
        
        // SKIP: Minor version releases (v1.2.3, b7917, etc.)
        if (title.match(/\bv?\d+\.\d+\.\d+\b/) && !title.match(/\bv?\d+\.0\.0\b/)) {
            // Allow if it has significant keywords
            if (!fullText.includes('major') && !fullText.includes('breaking') && 
                !fullText.includes('new feature') && !fullText.includes('introducing')) {
                return false;
            }
        }
        
        // SKIP: GitHub commit-style titles (b7917, just hash numbers)
        if (title.match(/^[a-z\s\-]+\s*b\d{4,}/i)) return false;
        if (title.match(/^[a-z\s\-]+\s*[a-f0-9]{7,}\s*-?\s*[a-f0-9]{7,}$/i)) return false;
        
        // SKIP: Boring/useless content
        const skipPatterns = [
            'chore:', 'chore(', 'deps:', 'ci:', 'test:', 'docs:',
            'bump version', 'bump to', 'dependency update',
            'refactor:', 'cleanup', 'typo', 'lint',
            'merge pull request', 'merge branch'
        ];
        if (skipPatterns.some(p => title.includes(p))) return false;
        
        // SKIP: Items without meaningful content
        if (title.length < 15) return false;
        if (!item.link) return false;
        
        return true;
    });
    
    // STEP 2: Sort by value (official sources first, then by date)
    const tierOrder: Record<SourceTier, number> = {
        official: 0,
        trusted: 1,
        community: 2,
        aggregator: 3,
    };
    
    // Score items for relevance
    const scored = filtered.map(item => {
        let score = 0;
        const title = item.title.toLowerCase();
        const content = (item.contentSnippet || '').toLowerCase();
        const fullText = `${title} ${content}`;
        
        // Source tier bonus
        score += (3 - tierOrder[item.sourceTier || 'aggregator']) * 20;
        
        // HIGH VALUE: Official announcements from big AI companies
        const officialSources = ['openai', 'anthropic', 'google ai', 'deepmind', 'meta ai', 'mistral'];
        if (officialSources.some(s => item.source.toLowerCase().includes(s))) score += 50;
        
        // HIGH VALUE: Model launches
        const modelKeywords = ['gpt-5', 'claude 4', 'gemini 3', 'llama 4', 'grok', 'kimi', 'deepseek'];
        if (modelKeywords.some(m => fullText.includes(m))) score += 40;
        
        // HIGH VALUE: IDE/Tool launches
        const ideKeywords = ['cursor', 'copilot', 'windsurf', 'codeium', 'vs code', 'vscode'];
        if (ideKeywords.some(i => fullText.includes(i))) score += 30;
        
        // HIGH VALUE: Framework updates
        const frameworkKeywords = ['langchain', 'llamaindex', 'crewai', 'autogen', 'mcp', 'rag'];
        if (frameworkKeywords.some(f => fullText.includes(f))) score += 25;
        
        // HIGH VALUE: Launch/announce keywords
        if (fullText.includes('launch') || fullText.includes('introducing') || 
            fullText.includes('announcing') || fullText.includes('release')) score += 20;
        
        // HIGH VALUE: Prompt engineering content
        if (fullText.includes('prompt engineering') || fullText.includes('prompting')) score += 25;
        
        // HIGH VALUE: AI engineering content
        if (fullText.includes('ai engineer') || fullText.includes('gen ai') || 
            fullText.includes('generative ai')) score += 20;
        
        // PENALTY: Generic/boring content
        if (fullText.includes('bug fix') || fullText.includes('patch')) score -= 30;
        if (fullText.includes('minor') && !fullText.includes('minor feature')) score -= 20;
        
        return { item, score };
    });
    
    // Sort by score descending, then by date
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.item.pubDate).getTime() - new Date(a.item.pubDate).getTime();
    });
    
    // STEP 3: Deduplicate
    const deduped = scored.filter(({ item }) => {
        const date = new Date(item.pubDate);
        if (isNaN(date.getTime()) || !isAfter(date, cutoffDate)) return false;
        
        const normalizedUrl = item.link.toLowerCase()
            .replace(/https?:\/\//, '')
            .replace(/www\./, '')
            .replace(/\/$/, '');
        
        if (seenUrls.has(normalizedUrl)) return false;
        seenUrls.add(normalizedUrl);
        
        const normalizedTitle = item.title.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 50);
        
        if (normalizedTitle.length > 10 && seenTitles.has(normalizedTitle)) return false;
        seenTitles.add(normalizedTitle);
        
        return true;
    });
    
    console.log(`[Sources] Filtered: ${items.length} -> ${filtered.length} -> ${deduped.length} (removed noise)`);
    
    return deduped.map(({ item }) => item).slice(0, 50); // Top 50 high-value items only
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
