/**
 * Hacker News API Fetcher
 * Fetches trending AI/ML stories from Hacker News
 */

import { NewsItem, NewsCategory } from '../types';
import { subDays, isAfter, fromUnixTime } from 'date-fns';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// AI-related keywords to filter stories
const AI_KEYWORDS = [
    // Models
    'gpt', 'gpt-4', 'gpt-5', 'claude', 'gemini', 'llama', 'mistral', 'qwen',
    'deepseek', 'anthropic', 'openai', 'chatgpt', 'o1', 'o3',
    
    // IDEs & Tools
    'cursor', 'copilot', 'windsurf', 'codeium', 'tabnine', 'aider',
    'continue', 'cody', 'bolt', 'v0',
    
    // Frameworks & Concepts
    'langchain', 'llamaindex', 'llama-index', 'rag', 'vector database',
    'embedding', 'fine-tuning', 'fine tuning', 'prompt engineering',
    'ai agent', 'ai agents', 'mcp', 'model context protocol',
    'function calling', 'tool use',
    
    // General AI
    'llm', 'large language model', 'machine learning', 'ml',
    'artificial intelligence', 'neural network', 'transformer',
    'diffusion', 'stable diffusion', 'midjourney', 'dall-e', 'sora',
    
    // Companies
    'hugging face', 'huggingface', 'replicate', 'together ai',
    'groq', 'perplexity', 'cohere',
    
    // Coding
    'ai coding', 'code generation', 'autocomplete', 'code completion',
    'vibe coding', 'ai programming',
];

// Negative keywords (filter out these)
const NEGATIVE_KEYWORDS = [
    'hiring', 'job', 'career', 'salary', 'compensation',
    'ask hn', 'show hn: my portfolio', 'who is hiring',
];

/**
 * Fetch AI-related stories from Hacker News
 */
export async function fetchHackerNewsAI(lookbackDays: number = 3): Promise<NewsItem[]> {
    const cutoffDate = subDays(new Date(), lookbackDays);
    
    try {
        // Fetch top stories and new stories
        const [topIds, newIds, bestIds] = await Promise.all([
            fetchStoryIds('topstories'),
            fetchStoryIds('newstories'),
            fetchStoryIds('beststories'),
        ]);
        
        // Combine and dedupe
        const allIds = [...new Set([...topIds.slice(0, 100), ...newIds.slice(0, 50), ...bestIds.slice(0, 50)])];
        
        // Fetch stories in batches
        const stories: NewsItem[] = [];
        const batchSize = 20;
        
        for (let i = 0; i < Math.min(allIds.length, 200); i += batchSize) {
            const batch = allIds.slice(i, i + batchSize);
            const batchStories = await Promise.all(
                batch.map(id => fetchStory(id, cutoffDate))
            );
            
            stories.push(...batchStories.filter((s): s is NewsItem => s !== null));
            
            // Stop if we have enough stories
            if (stories.length >= 30) break;
        }
        
        // Sort by score (relevance)
        return stories
            .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
            .slice(0, 20);
        
    } catch (error) {
        console.error('[HN] Failed to fetch:', error);
        return [];
    }
}

/**
 * Fetch story IDs from HN
 */
async function fetchStoryIds(type: 'topstories' | 'newstories' | 'beststories'): Promise<number[]> {
    try {
        const response = await fetch(`${HN_API_BASE}/${type}.json`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

/**
 * Fetch and parse a single story
 */
async function fetchStory(id: number, cutoffDate: Date): Promise<NewsItem | null> {
    try {
        const response = await fetch(`${HN_API_BASE}/item/${id}.json`);
        if (!response.ok) return null;
        
        const story = await response.json();
        
        // Skip if not a story or deleted
        if (!story || story.type !== 'story' || story.deleted || story.dead) {
            return null;
        }
        
        // Check date
        const storyDate = fromUnixTime(story.time);
        if (!isAfter(storyDate, cutoffDate)) {
            return null;
        }
        
        // Check if AI-related
        const title = story.title?.toLowerCase() || '';
        const url = story.url?.toLowerCase() || '';
        const text = story.text?.toLowerCase() || '';
        const combined = `${title} ${url} ${text}`;
        
        // Skip negative keywords
        if (NEGATIVE_KEYWORDS.some(kw => combined.includes(kw))) {
            return null;
        }
        
        // Check for AI keywords
        const matchedKeywords = AI_KEYWORDS.filter(kw => combined.includes(kw.toLowerCase()));
        if (matchedKeywords.length === 0) {
            return null;
        }
        
        // Calculate relevance score based on HN score and keyword matches
        const relevanceScore = Math.min(10, Math.round(
            (Math.log10((story.score || 1) + 1) * 2) + (matchedKeywords.length * 1.5)
        ));
        
        // Determine category
        const category = determineCategory(combined, matchedKeywords);
        
        return {
            id: `hn-${story.id}`,
            title: story.title,
            link: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            pubDate: storyDate.toISOString(),
            source: 'Hacker News',
            sourceTier: 'community',
            contentSnippet: story.text 
                ? story.text.replace(/<[^>]*>/g, '').slice(0, 300) + '...'
                : `${story.score} points | ${story.descendants || 0} comments`,
            content: story.text || '',
            category,
            relevanceScore,
            tags: matchedKeywords.slice(0, 4).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        };
        
    } catch {
        return null;
    }
}

/**
 * Determine category based on content
 */
function determineCategory(content: string, keywords: string[]): NewsCategory {
    const text = content.toLowerCase();
    
    // IDE/Tool updates
    if (keywords.some(k => ['cursor', 'copilot', 'windsurf', 'codeium', 'aider', 'v0', 'bolt'].includes(k))) {
        if (text.includes('launch') || text.includes('release') || text.includes('new')) {
            return 'ide_launch';
        }
        return 'ide_update';
    }
    
    // Agent frameworks
    if (keywords.some(k => ['langchain', 'llamaindex', 'llama-index', 'ai agent', 'mcp', 'rag'].includes(k))) {
        return 'agent';
    }
    
    // Model launches
    if (keywords.some(k => ['gpt', 'claude', 'gemini', 'llama', 'mistral', 'o1', 'o3'].includes(k))) {
        if (text.includes('launch') || text.includes('release') || text.includes('announce') || text.includes('new model')) {
            return 'model_launch';
        }
    }
    
    // Image/Video AI
    if (keywords.some(k => ['diffusion', 'midjourney', 'dall-e', 'sora', 'stable diffusion'].includes(k))) {
        if (text.includes('video')) return 'video_ai';
        return 'image_ai';
    }
    
    // Research
    if (text.includes('paper') || text.includes('arxiv') || text.includes('research')) {
        return 'research';
    }
    
    // Tutorial
    if (text.includes('tutorial') || text.includes('guide') || text.includes('how to')) {
        return 'tutorial';
    }
    
    // API
    if (text.includes('api') || text.includes('sdk')) {
        return 'api';
    }
    
    return 'feature';
}
