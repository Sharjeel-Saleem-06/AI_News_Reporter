/**
 * Enhanced RSS Feed System
 * - High-quality AI/ML focused sources
 * - Better error handling and health tracking
 * - Prioritized for vibe coders
 */

import Parser from 'rss-parser';
import { NewsItem, NewsSource, SourceTier, NewsCategory } from '../types';
import { subDays, isAfter } from 'date-fns';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    timeout: 12000,
});

// Curated high-quality RSS feeds focused on AI development
export const PREMIUM_RSS_FEEDS: NewsSource[] = [
    // ============================================
    // TIER 1: AI MODEL MAKERS - Official Sources
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
        name: 'DeepMind',
        url: 'https://deepmind.google/blog/rss.xml',
        tier: 'official',
        categories: ['research', 'model_launch'],
        color: '#4285f4',
    },
    {
        name: 'Meta AI',
        url: 'https://ai.meta.com/blog/rss.xml',
        tier: 'official',
        categories: ['model_launch', 'research'],
        color: '#0668e1',
    },
    {
        name: 'Mistral AI',
        url: 'https://mistral.ai/feed.xml',
        tier: 'official',
        categories: ['model_launch', 'api'],
        color: '#ff7000',
    },
    
    // ============================================
    // TIER 2: AI CODING TOOLS & INFRASTRUCTURE
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
        tier: 'official',
        categories: ['ide_update', 'feature'],
        color: '#007acc',
    },
    {
        name: 'Vercel',
        url: 'https://vercel.com/atom',
        tier: 'trusted',
        categories: ['feature', 'api'],
        color: '#000000',
    },
    {
        name: 'Replit',
        url: 'https://blog.replit.com/feed.xml',
        tier: 'trusted',
        categories: ['ide_update', 'agent'],
        color: '#f26207',
    },
    {
        name: 'Hugging Face',
        url: 'https://huggingface.co/blog/feed.xml',
        tier: 'official',
        categories: ['model_launch', 'feature', 'tutorial'],
        color: '#ff9d00',
    },
    
    // ============================================
    // TIER 3: AI FRAMEWORKS & DEVELOPER TOOLS
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
        categories: ['agent', 'tutorial'],
        color: '#7c3aed',
    },
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
        categories: ['model_launch', 'api', 'image_ai'],
        color: '#000000',
    },
    {
        name: 'Modal',
        url: 'https://modal.com/blog/feed.xml',
        tier: 'trusted',
        categories: ['feature', 'api', 'tutorial'],
        color: '#00d26a',
    },
    {
        name: 'Weights & Biases',
        url: 'https://wandb.ai/fully-connected/rss.xml',
        tier: 'trusted',
        categories: ['tutorial', 'research'],
        color: '#ffbe00',
    },
    
    // ============================================
    // TIER 4: AI THOUGHT LEADERS
    // ============================================
    {
        name: 'Simon Willison',
        url: 'https://simonwillison.net/atom/entries/',
        tier: 'trusted',
        categories: ['model_launch', 'tutorial', 'feature'],
        color: '#2563eb',
    },
    {
        name: 'Lilian Weng',
        url: 'https://lilianweng.github.io/index.xml',
        tier: 'trusted',
        categories: ['research'],
        color: '#ec4899',
    },
    
    // ============================================
    // TIER 5: TECH NEWS (AI FOCUSED)
    // ============================================
    {
        name: 'The Verge AI',
        url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
        tier: 'aggregator',
        categories: ['market', 'model_launch'],
        color: '#ff0055',
    },
    {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        tier: 'aggregator',
        categories: ['market', 'model_launch'],
        color: '#0a9e01',
    },
    {
        name: 'Ars Technica AI',
        url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        tier: 'aggregator',
        categories: ['market', 'research'],
        color: '#ff4e00',
    },
    {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/category/ai/feed/',
        tier: 'aggregator',
        categories: ['market', 'model_launch'],
        color: '#cd1c10',
    },
    
    // ============================================
    // TIER 6: NEWSLETTERS & SPECIALIZED
    // ============================================
    {
        name: 'The Batch (deeplearning.ai)',
        url: 'https://www.deeplearning.ai/the-batch/feed/',
        tier: 'trusted',
        categories: ['research', 'tutorial'],
        color: '#f59e0b',
    },
    {
        name: 'Import AI',
        url: 'https://jack-clark.net/feed/',
        tier: 'trusted',
        categories: ['research', 'market'],
        color: '#6366f1',
    },
];

// AI-related keywords for filtering non-AI content
const AI_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'llm',
    'gpt', 'claude', 'gemini', 'llama', 'mistral', 'openai', 'anthropic',
    'cursor', 'copilot', 'codeium', 'windsurf',
    'langchain', 'llamaindex', 'rag', 'vector', 'embedding',
    'agent', 'prompt', 'fine-tun', 'model', 'neural', 'transformer',
    'diffusion', 'generation', 'inference', 'training',
    'api', 'sdk', 'coding', 'code', 'programming',
];

/**
 * Fetch enhanced RSS feeds with filtering
 */
export async function fetchEnhancedRSS(lookbackDays: number = 3): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    const cutoffDate = subDays(new Date(), lookbackDays);
    
    console.log(`[RSS] Fetching from ${PREMIUM_RSS_FEEDS.length} premium sources...`);
    
    const results = await Promise.allSettled(
        PREMIUM_RSS_FEEDS.map(async (feed) => {
            try {
                const feedData = await parser.parseURL(feed.url);
                
                return feedData.items
                    .map((item) => ({
                        id: item.guid || item.link || `${feed.name}-${Math.random().toString(36).slice(2)}`,
                        title: item.title || 'Untitled',
                        link: item.link || '#',
                        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                        source: feed.name,
                        sourceTier: feed.tier,
                        contentSnippet: item.contentSnippet || item.content || item.summary || '',
                        content: item.content || item.contentSnippet || '',
                        imageUrl: extractImageUrl(item),
                        category: feed.categories[0] as NewsCategory,
                    }))
                    .filter((item) => {
                        // Date filter
                        const date = new Date(item.pubDate);
                        if (isNaN(date.getTime()) || !isAfter(date, cutoffDate)) return false;
                        
                        // For aggregator sources, check if AI-related
                        if (feed.tier === 'aggregator') {
                            const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
                            return AI_KEYWORDS.some(kw => text.includes(kw));
                        }
                        
                        return true;
                    });
                    
            } catch (error) {
                console.warn(`[RSS] Failed: ${feed.name} - ${error instanceof Error ? error.message : 'Unknown'}`);
                return [];
            }
        })
    );
    
    let successCount = 0;
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            allNews.push(...result.value);
            if (result.value.length > 0) successCount++;
        }
    });
    
    console.log(`[RSS] ${successCount}/${PREMIUM_RSS_FEEDS.length} feeds successful, ${allNews.length} items`);
    
    return allNews;
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: Record<string, any>): string | undefined {
    if (item.enclosure?.url) return item.enclosure.url;
    if (item['media:content']?.url) return item['media:content'].url;
    if (item['media:thumbnail']?.url) return item['media:thumbnail'].url;
    
    const content = item.content || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];
    
    return undefined;
}
