/**
 * Official Changelogs Fetcher
 * Scrapes official product pages for the latest updates from:
 * - Cursor IDE
 * - VS Code
 * - Claude/Anthropic
 * - OpenAI
 * - GitHub Copilot
 */

import { NewsItem, NewsCategory } from '../types';
import { subDays, isAfter, parseISO, format } from 'date-fns';
import { stripHtml } from '../utils';

interface ChangelogSource {
    name: string;
    url: string;
    apiUrl?: string;
    type: 'json' | 'html' | 'rss';
    category: NewsCategory;
    color: string;
    parseFunction: (data: any, source: ChangelogSource) => NewsItem[];
}

// Official sources with their API/changelog endpoints - VERIFIED Jan 2026
const CHANGELOG_SOURCES: ChangelogSource[] = [
    // ============================================
    // AI IDEs & Coding Tools (Tier 1) - VERIFIED
    // ============================================
    {
        name: 'VS Code',
        url: 'https://code.visualstudio.com/updates',
        apiUrl: 'https://code.visualstudio.com/feed.xml', // VERIFIED
        type: 'rss',
        category: 'ide_update',
        color: '#007acc',
        parseFunction: parseVSCodeChangelog,
    },
    {
        name: 'GitHub Changelog',
        url: 'https://github.blog/changelog/',
        apiUrl: 'https://github.blog/changelog/feed/', // VERIFIED - includes Copilot updates
        type: 'rss',
        category: 'ide_update',
        color: '#333333',
        parseFunction: parseGitHubCopilotChangelog,
    },
    
    // ============================================
    // AI Model Providers (Tier 1) - VERIFIED
    // ============================================
    {
        name: 'Anthropic',
        url: 'https://www.anthropic.com/news',
        apiUrl: 'https://www.anthropic.com/news/feed_anthropic.xml', // VERIFIED
        type: 'rss',
        category: 'model_launch',
        color: '#d4a574',
        parseFunction: parseAnthropicChangelog,
    },
    {
        name: 'OpenAI',
        url: 'https://openai.com/news',
        apiUrl: 'https://openai.com/news/rss.xml', // VERIFIED - new official feed
        type: 'rss',
        category: 'model_launch',
        color: '#10a37f',
        parseFunction: parseOpenAIChangelog,
    },
    {
        name: 'Google AI',
        url: 'https://blog.google/technology/ai/',
        apiUrl: 'https://blog.google/technology/ai/rss/', // VERIFIED
        type: 'rss',
        category: 'model_launch',
        color: '#4285f4',
        parseFunction: parseGoogleAIChangelog,
    },
    {
        name: 'Mistral AI',
        url: 'https://mistral.ai/news/',
        apiUrl: 'https://mistral.ai/feed.xml', // Official Mistral feed
        type: 'rss',
        category: 'model_launch',
        color: '#ff7000',
        parseFunction: parseMistralChangelog,
    },
    
    // ============================================
    // Dev Platforms (Tier 2) - VERIFIED
    // ============================================
    {
        name: 'Vercel',
        url: 'https://vercel.com/changelog',
        apiUrl: 'https://vercel.com/atom', // VERIFIED
        type: 'rss',
        category: 'feature',
        color: '#000000',
        parseFunction: parseVercelChangelog,
    },
    {
        name: 'Supabase',
        url: 'https://supabase.com/blog',
        apiUrl: 'https://supabase.com/rss.xml', // VERIFIED
        type: 'rss',
        category: 'feature',
        color: '#3ecf8e',
        parseFunction: parseSupabaseChangelog,
    },
];

// Alternative approach: Use known RSS feeds that are more reliable
import Parser from 'rss-parser';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    timeout: 15000,
});

/**
 * Fetch official changelogs from all sources
 */
export async function fetchOfficialChangelogs(lookbackDays: number = 3): Promise<NewsItem[]> {
    const cutoffDate = subDays(new Date(), lookbackDays);
    const allItems: NewsItem[] = [];
    
    const results = await Promise.allSettled(
        CHANGELOG_SOURCES.map(async (source) => {
            try {
                if (source.type === 'rss' && source.apiUrl) {
                    const feed = await parser.parseURL(source.apiUrl);
                    return feed.items.map(item => {
                        const rawContent = item.contentSnippet || item.content || '';
                        return {
                            id: item.guid || item.link || `${source.name}-${Date.now()}-${Math.random()}`,
                            title: item.title || 'Untitled',
                            link: item.link || source.url,
                            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                            source: source.name,
                            sourceTier: 'official' as const,
                            contentSnippet: stripHtml(rawContent).slice(0, 500),
                            content: stripHtml(item.content || rawContent),
                            category: source.category,
                        };
                    }).filter(item => {
                        const date = new Date(item.pubDate);
                        return !isNaN(date.getTime()) && isAfter(date, cutoffDate);
                    });
                }
                return [];
            } catch (error) {
                console.warn(`[Changelogs] Failed to fetch ${source.name}:`, error instanceof Error ? error.message : 'Unknown');
                return [];
            }
        })
    );
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allItems.push(...result.value);
        }
    });
    
    return allItems;
}

// Parse functions for different sources (used when scraping HTML)
function parseVSCodeChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseCursorChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseAnthropicChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseOpenAIChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseGoogleAIChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseVercelChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseSupabaseChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseGitHubCopilotChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}

function parseMistralChangelog(data: any, source: ChangelogSource): NewsItem[] {
    return [];
}
