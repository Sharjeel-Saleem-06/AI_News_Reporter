/**
 * Product Hunt AI Tools Fetcher
 * Fetches trending AI tools from Product Hunt
 */

import { NewsItem, NewsCategory } from '../types';
import { subDays, isAfter, parseISO } from 'date-fns';

// AI-related topics to search for
const AI_TOPICS = [
    'artificial-intelligence',
    'machine-learning', 
    'developer-tools',
    'no-code',
    'productivity',
];

// Keywords to identify AI products
const AI_PRODUCT_KEYWORDS = [
    'ai', 'gpt', 'llm', 'claude', 'gemini', 'chatbot', 'copilot',
    'automation', 'agent', 'assistant', 'machine learning', 'ml',
    'code', 'coding', 'developer', 'api', 'model', 'prompt',
    'generate', 'generation', 'neural', 'intelligent',
];

/**
 * Fetch AI-related products from Product Hunt
 * Uses the public posts endpoint
 */
export async function fetchProductHuntAI(lookbackDays: number = 3): Promise<NewsItem[]> {
    const cutoffDate = subDays(new Date(), lookbackDays);
    const items: NewsItem[] = [];
    
    try {
        // Product Hunt's public API is limited, so we'll use their RSS feed
        const rssUrl = 'https://www.producthunt.com/feed';
        
        const response = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
        });
        
        if (!response.ok) {
            console.warn('[ProductHunt] Failed to fetch RSS');
            return [];
        }
        
        const text = await response.text();
        
        // Parse RSS manually (simple approach)
        const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
        
        for (const match of itemMatches) {
            const itemXml = match[1];
            
            const title = extractTag(itemXml, 'title');
            const link = extractTag(itemXml, 'link');
            const description = extractTag(itemXml, 'description');
            const pubDate = extractTag(itemXml, 'pubDate');
            
            if (!title || !link) continue;
            
            // Check date
            const date = pubDate ? new Date(pubDate) : new Date();
            if (!isAfter(date, cutoffDate)) continue;
            
            // Check if AI-related
            const combined = `${title} ${description}`.toLowerCase();
            const isAIRelated = AI_PRODUCT_KEYWORDS.some(kw => combined.includes(kw));
            
            if (!isAIRelated) continue;
            
            // Determine category
            const category = determineCategory(combined);
            
            items.push({
                id: `ph-${link.split('/').pop() || Date.now()}`,
                title: decodeHtmlEntities(title),
                link,
                pubDate: date.toISOString(),
                source: 'Product Hunt',
                sourceTier: 'community',
                contentSnippet: decodeHtmlEntities(description?.slice(0, 300) || ''),
                content: description || '',
                category,
                tags: ['Product Hunt', 'New Tool'],
            });
            
            // Limit results
            if (items.length >= 10) break;
        }
        
        return items;
        
    } catch (error) {
        console.warn('[ProductHunt] Error:', error instanceof Error ? error.message : 'Unknown');
        return [];
    }
}

/**
 * Extract text from XML tag
 */
function extractTag(xml: string, tag: string): string | null {
    const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([^<]*)</${tag}>`));
    return match ? (match[1] || match[2])?.trim() || null : null;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

/**
 * Determine category based on content
 */
function determineCategory(content: string): NewsCategory {
    const text = content.toLowerCase();
    
    if (text.includes('code') || text.includes('developer') || text.includes('ide') || text.includes('programming')) {
        return 'ide_launch';
    }
    
    if (text.includes('agent') || text.includes('automation') || text.includes('workflow')) {
        return 'agent';
    }
    
    if (text.includes('image') || text.includes('design') || text.includes('art')) {
        return 'image_ai';
    }
    
    if (text.includes('video')) {
        return 'video_ai';
    }
    
    if (text.includes('api') || text.includes('integration')) {
        return 'api';
    }
    
    return 'feature';
}
