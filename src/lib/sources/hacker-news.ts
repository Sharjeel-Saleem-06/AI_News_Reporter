/**
 * Hacker News API Fetcher
 * Fetches trending AI/ML stories from Hacker News
 */

import { NewsItem, NewsCategory } from '../types';
import { subDays, isAfter, fromUnixTime } from 'date-fns';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// AI-related keywords to filter stories - Updated Jan 2026
const AI_KEYWORDS = [
    // Flagship Models (Tier 1)
    'gpt', 'gpt-4', 'gpt-5', 'gpt-5.2', 'gpt-5.2-codex', 'o1', 'o3', 'o1-pro', 'chatgpt',
    'claude', 'claude 4', 'claude 4.5', 'sonnet 4', 'opus 4', 'haiku 4',
    'gemini', 'gemini 3', 'gemini 3 flash', 'gemini pro', 'gemini ultra',
    'grok', 'grok 3', 'grok 4', 'grok 4.1',
    
    // Kimi & Chinese Models (NEW)
    'kimi', 'kimi k2', 'kimi k2.5', 'kimi k2 thinking', 'moonshot ai', 'moonshot',
    'yi', 'yi-lightning', '01.ai', 'zero one ai',
    'deepseek', 'deepseek-v3', 'deepseek-r1', 'deepseek coder',
    'qwen', 'qwen 2.5', 'qwq', 'alibaba ai',
    'baichuan', 'glm', 'glm-4', 'chatglm', 'zhipu',
    'ernie', 'ernie bot', 'baidu ai',
    
    // Open Source Models
    'llama', 'llama 3', 'llama 4', 'codellama',
    'mistral', 'mixtral', 'codestral', 'pixtral',
    'phi-4', 'phi-3', 'gemma', 'gemma 3',
    
    // Enterprise Models
    'command r', 'command r+', 'cohere command',
    'reka', 'reka core', 'reka flash',
    'nemotron', 'nvidia nemotron',
    
    // Companies
    'openai', 'anthropic', 'google ai', 'deepmind', 'meta ai',
    'xai', 'x.ai', 'mistral ai',
    'hugging face', 'huggingface', 'replicate', 'together ai',
    'groq', 'perplexity', 'cohere', 'ai21',
    
    // AI IDEs & Tools (Tier 1)
    'cursor', 'cursor 2', 'cursor ide',
    'copilot', 'github copilot', 'copilot workspace',
    'windsurf', 'codeium', 'tabnine', 'supermaven',
    'antigravity', 'antigravity ide', 'google antigravity',
    'aider', 'continue', 'cody', 'bolt', 'v0', 'replit',
    'devin', 'cognition', 'lovable', 'trae', 'melty',
    'pearai', 'void editor', 'cline', 'roo code',
    
    // Frameworks & Concepts
    'langchain', 'langgraph', 'langsmith', 'langserve',
    'llamaindex', 'llama-index', 'llamaparse', 'llamacloud',
    'crewai', 'autogen', 'semantic kernel', 'dspy', 'instructor',
    'pydantic ai', 'openai swarm', 'bee ai',
    'dify', 'flowise', 'n8n ai', 'langflow',
    'opendevin', 'swe-agent', 'agentops',
    
    // RAG & Vector
    'rag', 'vector database', 'embedding', 'embeddings',
    'pinecone', 'weaviate', 'chroma', 'chromadb', 'qdrant', 'milvus', 'pgvector',
    'lancedb', 'turbopuffer', 'supabase vector',
    
    // MCP & Tools
    'mcp', 'model context protocol', 'claude mcp',
    'function calling', 'tool use', 'tool calling',
    
    // Gen AI & AI Engineering
    'gen ai', 'generative ai', 'ai engineer', 'ai engineering',
    'mlops', 'llmops', 'ai developer', 'ml engineer',
    'prompt engineer', 'prompt engineering', 'ai trainer', 'model training',
    'ai architecture', 'ai infrastructure', 'ai workflow',
    'fine-tuning', 'fine tuning', 'lora', 'qlora',
    
    // General AI
    'llm', 'large language model', 'machine learning',
    'artificial intelligence', 'neural network', 'transformer',
    'context window', 'token', 'inference', 'model serving',
    'agent framework', 'autonomous agent', 'multi-agent', 'agentic ai',
    
    // Image/Video AI
    'diffusion', 'stable diffusion', 'sdxl', 'flux',
    'midjourney', 'dall-e', 'sora', 'imagen',
    'runway', 'kling', 'pika', 'luma',
    
    // Inference & Infrastructure
    'vllm', 'tensorrt', 'ollama', 'lm studio', 'localai',
    'modal', 'runpod', 'lambda labs', 'cerebras', 'sambanova',
    
    // Coding
    'ai coding', 'code generation', 'autocomplete', 'code completion',
    'vibe coding', 'ai programming', 'pair programming',
];

// Negative keywords (filter out these)
// BUT allow AI job-related content as it's relevant to AI engineers
const NEGATIVE_KEYWORDS = [
    'who is hiring', 'seeking work', 'for hire', 'resume review',
    'show hn: my portfolio', 'show hn: my resume',
    'salary negotiation', 'career advice',
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
        
        // STRICT: Require minimum HN score for quality (popular = interesting)
        // Stories with < 50 points are usually not worth showing
        const minScore = 30;
        if ((story.score || 0) < minScore) {
            return null;
        }
        
        // Calculate relevance score based on HN score and keyword matches
        const relevanceScore = Math.min(10, Math.round(
            (Math.log10((story.score || 1) + 1) * 2) + (matchedKeywords.length * 1.5)
        ));
        
        // Determine category
        const category = determineCategory(combined, matchedKeywords);
        
        // Clean text content
        const cleanText = story.text ? story.text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        
        return {
            id: `hn-${story.id}`,
            title: story.title,
            link: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            pubDate: storyDate.toISOString(),
            source: 'Hacker News',
            sourceTier: 'community',
            contentSnippet: cleanText 
                ? cleanText.slice(0, 300) + '...'
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
