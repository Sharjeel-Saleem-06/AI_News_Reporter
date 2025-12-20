/**
 * Vibe Coder / AI Engineer Focused RSS Feed System
 * - Prioritizes AI coding tools, models, and IDEs
 * - Fresh content (2-3 days lookback)
 * - High signal sources for developers using AI
 */

import Parser from 'rss-parser';
import { NewsItem, NewsSource, SourceTier } from './types';
import { subDays, isAfter } from 'date-fns';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    timeout: 10000, // 10 second timeout
});

/**
 * VIBE CODER / AI ENGINEER RSS FEEDS
 * Prioritized for developers using AI tools
 */
export const RSS_FEEDS: NewsSource[] = [
    // ============================================
    // 🚀 TIER 1: AI MODEL MAKERS (Must-Follow for New Releases)
    // ============================================
    {
        name: 'OpenAI',
        url: 'https://openai.com/blog/rss.xml',
        tier: 'official',
        categories: ['model_launch', 'api', 'feature'],
        color: '#10a37f',
    },
    {
        name: 'Anthropic',
        url: 'https://www.anthropic.com/rss.xml',
        tier: 'official',
        categories: ['model_launch', 'research'],
        color: '#d4a574',
    },
    {
        name: 'Google AI',
        url: 'https://blog.google/technology/ai/rss/',
        tier: 'official',
        categories: ['model_launch', 'feature'],
        color: '#4285f4',
    },
    {
        name: 'Google DeepMind',
        url: 'https://deepmind.google/blog/rss.xml',
        tier: 'official',
        categories: ['research', 'model_launch'],
        color: '#4285f4',
    },
    {
        name: 'Meta AI',
        url: 'https://ai.meta.com/blog/rss.xml',
        tier: 'official',
        categories: ['model_launch', 'research', 'video_ai'],
        color: '#0668e1',
    },
    {
        name: 'Microsoft AI',
        url: 'https://blogs.microsoft.com/ai/feed/',
        tier: 'official',
        categories: ['model_launch', 'ide_update', 'feature'],
        color: '#00a4ef',
    },
    {
        name: 'Mistral AI',
        url: 'https://mistral.ai/feed.xml',
        tier: 'official',
        categories: ['model_launch', 'api'],
        color: '#ff7000',
    },
    {
        name: 'Groq',
        url: 'https://groq.com/feed/',
        tier: 'official',
        categories: ['model_launch', 'api'],
        color: '#f55036',
    },

    // ============================================
    // ⚡ TIER 2: AI CODING TOOLS & IDEs (HIGH PRIORITY)
    // Cursor, Copilot, Windsurf, Codeium updates
    // ============================================
    {
        name: 'GitHub Blog',
        url: 'https://github.blog/feed/',
        tier: 'trusted',
        categories: ['ide_update', 'feature', 'agent'],
        color: '#333333',
    },
    {
        name: 'VS Code',
        url: 'https://code.visualstudio.com/feed.xml',
        tier: 'trusted',
        categories: ['ide_update', 'feature'],
        color: '#007acc',
    },
    {
        name: 'Vercel',
        url: 'https://vercel.com/atom',
        tier: 'trusted',
        categories: ['ide_update', 'feature'],
        color: '#000000',
    },
    {
        name: 'Replit',
        url: 'https://blog.replit.com/feed.xml',
        tier: 'trusted',
        categories: ['ide_update', 'ide_launch', 'agent'],
        color: '#f26207',
    },

    // ============================================
    // 🤖 TIER 3: AI AGENT & RAG FRAMEWORKS
    // LangChain, LlamaIndex, CrewAI, etc.
    // ============================================
    {
        name: 'LangChain',
        url: 'https://blog.langchain.dev/rss/',
        tier: 'trusted',
        categories: ['agent', 'tutorial', 'feature'],
        color: '#1c3c3c',
    },
    {
        name: 'LlamaIndex',
        url: 'https://www.llamaindex.ai/blog/rss.xml',
        tier: 'trusted',
        categories: ['agent', 'tutorial', 'feature'],
        color: '#7c3aed',
    },
    {
        name: 'Hugging Face',
        url: 'https://huggingface.co/blog/feed.xml',
        tier: 'trusted',
        categories: ['model_launch', 'feature', 'tutorial'],
        color: '#ff9d00',
    },

    // ============================================
    // 🔌 TIER 4: AI INFRASTRUCTURE & APIs
    // Together AI, Replicate, Groq, etc.
    // ============================================
    {
        name: 'Together AI',
        url: 'https://www.together.ai/blog/rss.xml',
        tier: 'trusted',
        categories: ['model_launch', 'api'],
        color: '#0ea5e9',
    },
    {
        name: 'Replicate',
        url: 'https://replicate.com/blog/rss.xml',
        tier: 'trusted',
        categories: ['model_launch', 'api', 'video_ai', 'image_ai'],
        color: '#000000',
    },
    {
        name: 'Supabase',
        url: 'https://supabase.com/rss.xml',
        tier: 'trusted',
        categories: ['feature', 'api'],
        color: '#3ecf8e',
    },
    {
        name: 'Modal',
        url: 'https://modal.com/blog/feed.xml',
        tier: 'trusted',
        categories: ['feature', 'api', 'tutorial'],
        color: '#00d26a',
    },

    // ============================================
    // 🧠 TIER 5: AI THOUGHT LEADERS (High Signal)
    // Simon Willison, Karpathy - Always relevant
    // ============================================
    {
        name: 'Simon Willison',
        url: 'https://simonwillison.net/atom/entries/',
        tier: 'trusted',
        categories: ['model_launch', 'tutorial', 'feature'],
        color: '#2563eb',
    },
    {
        name: 'Andrej Karpathy',
        url: 'https://karpathy.github.io/feed.xml',
        tier: 'trusted',
        categories: ['research', 'tutorial'],
        color: '#000000',
    },
    {
        name: 'Lilian Weng',
        url: 'https://lilianweng.github.io/index.xml',
        tier: 'trusted',
        categories: ['research'],
        color: '#ec4899',
    },

    // ============================================
    // 📰 TIER 6: TECH NEWS (For Breaking News)
    // ============================================
    {
        name: 'The Verge AI',
        url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
        tier: 'aggregator',
        categories: ['market', 'model_launch', 'ide_launch'],
        color: '#ff0055',
    },
    {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        tier: 'aggregator',
        categories: ['market', 'model_launch', 'ide_launch'],
        color: '#0a9e01',
    },
    {
        name: 'Ars Technica',
        url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        tier: 'aggregator',
        categories: ['market', 'research'],
        color: '#ff4e00',
    },
    {
        name: 'MIT Tech Review AI',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
        tier: 'aggregator',
        categories: ['research', 'market'],
        color: '#8b0000',
    },
    {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/category/ai/feed/',
        tier: 'aggregator',
        categories: ['market', 'model_launch'],
        color: '#cd1c10',
    },

    // ============================================
    // 🏢 TIER 7: ENGINEERING BLOGS (Technical Context)
    // ============================================
    {
        name: 'Stripe Engineering',
        url: 'https://stripe.com/blog/feed.rss',
        tier: 'trusted',
        categories: ['feature', 'api'],
        color: '#635bff',
    },
    {
        name: 'Netflix Tech',
        url: 'https://netflixtechblog.com/feed',
        tier: 'trusted',
        categories: ['research', 'feature'],
        color: '#e50914',
    },
];

// Feed health tracking
const feedHealth: Map<string, {
    lastSuccess: number;
    errorCount: number;
    isHealthy: boolean;
}> = new Map();

/**
 * Fetch RSS feeds - optimized for fresh vibe coder content
 */
export async function fetchRSSFeeds(lookbackDays: number = 3): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    const cutoffDate = subDays(new Date(), lookbackDays);

    console.log(`[RSS] Fetching from ${RSS_FEEDS.length} vibe coder sources (${lookbackDays} day lookback)...`);

    const results = await Promise.allSettled(
        RSS_FEEDS.map(async (feed) => {
            try {
                const feedData = await parser.parseURL(feed.url);
                const health = feedHealth.get(feed.name) || {
                    lastSuccess: 0,
                    errorCount: 0,
                    isHealthy: true
                };

                // Update health on success
                health.lastSuccess = Date.now();
                health.errorCount = 0;
                health.isHealthy = true;
                feedHealth.set(feed.name, health);

                return feedData.items.map((item) => ({
                    id: item.guid || item.link || `${feed.name}-${Math.random().toString(36).slice(2)}`,
                    title: item.title || 'Untitled',
                    link: item.link || '#',
                    pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                    source: feed.name,
                    sourceTier: feed.tier,
                    contentSnippet: item.contentSnippet || item.content || item.summary || '',
                    content: item.content || item.contentSnippet || '',
                    imageUrl: extractImageUrl(item),
                }));
            } catch (error) {
                // Track feed health
                const health = feedHealth.get(feed.name) || {
                    lastSuccess: 0,
                    errorCount: 0,
                    isHealthy: true
                };
                health.errorCount++;
                health.isHealthy = health.errorCount < 3;
                feedHealth.set(feed.name, health);

                console.warn(`[RSS] Failed to fetch ${feed.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return [];
            }
        })
    );

    // Collect successful results
    let totalArticles = 0;
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allNews.push(...result.value);
            totalArticles += result.value.length;
        }
    });

    console.log(`[RSS] Fetched ${totalArticles} total articles from successful feeds`);

    // Deduplicate by link
    const seenLinks = new Set<string>();
    const seenTitles = new Set<string>();

    const filtered = allNews
        .filter((item) => {
            // Filter by date
            const date = new Date(item.pubDate);
            if (isNaN(date.getTime()) || !isAfter(date, cutoffDate)) return false;

            // Dedupe by link
            if (seenLinks.has(item.link)) return false;
            seenLinks.add(item.link);

            // Dedupe by similar title (normalized)
            const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seenTitles.has(normalizedTitle)) return false;
            seenTitles.add(normalizedTitle);

            return true;
        })
        .sort((a, b) => {
            // Sort by tier first (official > trusted > aggregator), then by date
            const tierOrder: Record<SourceTier, number> = {
                official: 0,
                trusted: 1,
                community: 2,
                aggregator: 3,
            };
            const tierDiff = tierOrder[a.sourceTier || 'aggregator'] - tierOrder[b.sourceTier || 'aggregator'];
            if (tierDiff !== 0) return tierDiff;

            return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        })
        .slice(0, 60); // Increased limit

    console.log(`[RSS] Filtered to ${filtered.length} unique articles`);

    return filtered;
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: Record<string, any>): string | undefined {
    // Try common image fields
    if (item.enclosure?.url) return item.enclosure.url;
    if (item['media:content']?.url) return item['media:content'].url;
    if (item['media:thumbnail']?.url) return item['media:thumbnail'].url;

    // Try to extract from content
    const content = item.content || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];

    return undefined;
}

/**
 * Get feed health status
 */
export function getFeedHealth() {
    return RSS_FEEDS.map(feed => {
        const health = feedHealth.get(feed.name);
        return {
            name: feed.name,
            tier: feed.tier,
            isHealthy: health?.isHealthy ?? true,
            errorCount: health?.errorCount ?? 0,
            lastSuccess: health?.lastSuccess
                ? new Date(health.lastSuccess).toISOString()
                : null,
        };
    });
}

/**
 * Get feeds by tier
 */
export function getFeedsByTier(tier: SourceTier): NewsSource[] {
    return RSS_FEEDS.filter(feed => feed.tier === tier);
}

/**
 * Get total feed count by tier
 */
export function getFeedStats() {
    return {
        total: RSS_FEEDS.length,
        official: RSS_FEEDS.filter(f => f.tier === 'official').length,
        trusted: RSS_FEEDS.filter(f => f.tier === 'trusted').length,
        community: RSS_FEEDS.filter(f => f.tier === 'community').length,
        aggregator: RSS_FEEDS.filter(f => f.tier === 'aggregator').length,
        healthy: Array.from(feedHealth.values()).filter(h => h.isHealthy).length,
    };
}
