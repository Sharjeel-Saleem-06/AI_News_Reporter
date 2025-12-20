/**
 * Vibe Coder AI Analysis System
 * - Prioritizes AI coding tools, models, and IDEs
 * - Uses API Key Pool for load balancing
 * - Smart caching to minimize API calls
 */

import Groq from 'groq-sdk';
import { NewsItem, NewsCategory, NewsPriority } from './types';
import { apiKeyPool } from './api-pool';
import { analysisCache } from './advanced-cache';

// VIBE CODER RELEVANT ENTITIES
const KNOWN_MODELS = [
    // Flagship Models - MUST KNOW
    'GPT-4', 'GPT-4o', 'GPT-4.5', 'GPT-5', 'o1', 'o3', 'o1-pro',
    'Claude', 'Claude 3', 'Claude 3.5', 'Claude 4', 'Sonnet', 'Opus', 'Haiku',
    'Gemini', 'Gemini 2', 'Gemini Pro', 'Gemini Ultra', 'Gemma',
    // Open Source - For local dev
    'Llama', 'Llama 3', 'Llama 4', 'CodeLlama',
    'Mistral', 'Mixtral', 'Codestral', 'Pixtral',
    'Qwen', 'DeepSeek', 'DeepSeek-V3', 'Phi-4',
    // Code Models
    'Codex', 'StarCoder', 'CodeGen', 'WizardCoder',
    // Vision/Multimodal
    'GPT-4V', 'Claude 3 Vision', 'Gemini Vision',
    // Video/Image
    'Sora', 'DALL-E 3', 'Midjourney', 'Stable Diffusion', 'FLUX',
];

const KNOWN_IDES = [
    // AI IDEs - PRIMARY FOCUS
    'Cursor', 'Cursor IDE',
    'Windsurf', 'Codeium',
    'GitHub Copilot', 'Copilot',
    'Tabnine',
    'Replit', 'Replit Agent',
    'Bolt', 'bolt.new',
    'v0', 'v0.dev',
    'Lovable',
    // AI Code Assistants
    'Claude Code', 'Aider',
    'Continue', 'Sourcegraph Cody',
    // Traditional IDEs with AI
    'VS Code', 'Visual Studio Code',
    'JetBrains AI', 'IntelliJ', 'PyCharm',
    'Zed',
];

const AI_FRAMEWORKS = [
    // Agent Frameworks
    'LangChain', 'LlamaIndex', 'CrewAI', 'AutoGen',
    'Semantic Kernel', 'Haystack',
    // MCP & Tools
    'MCP', 'Model Context Protocol',
    'Function Calling', 'Tool Use',
    // RAG & Vector
    'RAG', 'Vector Database', 'Embeddings',
    'Pinecone', 'Weaviate', 'Chroma', 'Qdrant',
    // Inference
    'vLLM', 'TensorRT', 'ONNX', 'Ollama',
];

const KNOWN_COMPANIES = [
    'OpenAI', 'Anthropic', 'Google', 'DeepMind', 'Meta AI',
    'Microsoft', 'Mistral AI', 'Cohere', 'AI21',
    'Vercel', 'Supabase', 'Hugging Face',
    'Together AI', 'Groq', 'Replicate', 'Modal',
    'Anysphere', // Cursor
];

/**
 * Analyze a single news item using Groq
 */
export async function analyzeNewsItem(
    item: NewsItem,
    retryCount = 0
): Promise<Partial<NewsItem>> {
    // Check cache first
    const cached = await analysisCache.get(item.id);
    if (cached) {
        return cached;
    }

    // Get API key from pool
    const apiKey = apiKeyPool.getNextKey();
    if (!apiKey) {
        console.warn('[Groq] No API keys available, using fallback');
        return createFallbackAnalysis(item);
    }

    const prompt = createAnalysisPrompt(item);

    try {
        const client = new Groq({ apiKey });
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content received');

        const result = JSON.parse(content);

        // Report success to pool
        apiKeyPool.reportSuccess(apiKey);

        // Validate and normalize the result
        const analysis = normalizeAnalysis(result, item);

        // Cache the result
        await analysisCache.set(item.id, analysis, undefined, item.source);

        return analysis;

    } catch (error: any) {
        // Report error to pool
        apiKeyPool.reportError(apiKey, error?.status);

        // Retry on rate limit with different key
        if (error?.status === 429 && retryCount < 3) {
            console.warn(`[Groq] Rate limited, retrying with different key (${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 300 * (retryCount + 1)));
            return analyzeNewsItem(item, retryCount + 1);
        }

        console.error(`[Groq] Analysis failed for "${item.title.slice(0, 50)}...":`, error?.message);
        return createFallbackAnalysis(item);
    }
}

/**
 * Vibe Coder focused analysis prompt
 */
function createAnalysisPrompt(item: NewsItem): string {
    return `You are an AI News Analyst for VIBE CODERS and AI ENGINEERS.
Your audience uses AI coding tools (Cursor, Copilot), builds with LLMs, and wants actionable updates.

ANALYZE THIS NEWS:
Title: "${item.title}"
Source: "${item.source}"
Content: "${item.contentSnippet.slice(0, 800)}"

CATEGORIZE (pick ONE most relevant):
- 'model_launch': NEW AI model release (GPT-5, Claude 4, Llama 4, Gemini 2, new Sonnet/Opus)
- 'ide_update': Update to AI coding tools (Cursor update, Copilot feature, Windsurf, Codeium)
- 'ide_launch': NEW AI IDE or coding tool launch
- 'agent': AI Agents, MCP, autonomous coding, tool use, function calling
- 'api': API updates, SDK releases, new endpoints, pricing changes
- 'video_ai': Video generation (Sora, Runway, Kling)
- 'image_ai': Image generation (DALL-E, Midjourney, Flux)
- 'feature': General product updates
- 'research': Papers, benchmarks, technical deep-dives
- 'tutorial': How-to, guides, code examples
- 'market': Funding, acquisitions, business news
- 'other': Doesn't fit above

PRIORITY for a Vibe Coder:
- 'breaking': MUST SEE - New flagship model (GPT-5, Claude 4), Major IDE release, Game-changer
- 'high': Important - Significant API change, New coding feature, Framework update
- 'normal': Good to know
- 'low': Optional - Opinion pieces, minor news

VIBE CODER RELEVANCE (1-10):
- 10: New model I can use TODAY (GPT-4o update, Claude 3.5 Sonnet)
- 9: New IDE feature I'll use (Cursor MCP, Copilot improvement)
- 8: Framework update affecting my stack (LangChain, Next.js AI)
- 7: New tool to try (new AI IDE, code assistant)
- 5: Interesting but not immediately useful
- 3: Background knowledge only
- 1: Not relevant to AI development

Return JSON:
{
  "category": "...",
  "priority": "breaking|high|normal|low",
  "summary": "2 sentences: What's new + Why a vibe coder should care",
  "tags": ["max 4 tags like LLM, Cursor, API, RAG"],
  "relatedModels": ["GPT-4", "Claude 3.5"],
  "relatedCompanies": ["OpenAI"],
  "relevanceScore": 1-10,
  "sentiment": "positive|neutral|negative",
  "actionable": true/false,
  "technicalImpact": "One line: What can I build/do differently now?"
}`;
}

/**
 * Normalize and validate analysis result
 */
function normalizeAnalysis(result: any, item: NewsItem): Partial<NewsItem> {
    const validCategories: NewsCategory[] = [
        'model_launch', 'ide_update', 'ide_launch', 'video_ai', 'image_ai',
        'agent', 'api', 'feature', 'research', 'tutorial', 'market', 'other'
    ];

    const validPriorities: NewsPriority[] = ['breaking', 'high', 'normal', 'low'];

    // Auto-detect based on keywords if category seems wrong
    let category = validCategories.includes(result.category)
        ? result.category
        : detectCategory(item);

    let priority = validPriorities.includes(result.priority)
        ? result.priority
        : detectPriority(item, category);

    // BOOST for official sources with launches
    if (item.sourceTier === 'official' && ['model_launch', 'ide_launch'].includes(category)) {
        priority = 'breaking';
    }

    // BOOST for vibe coding tools
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
    if (KNOWN_IDES.some(ide => text.includes(ide.toLowerCase()))) {
        if (priority === 'normal') priority = 'high';
    }

    return {
        category,
        priority,
        summary: result.summary || item.contentSnippet.slice(0, 150) + '...',
        tags: Array.isArray(result.tags) ? result.tags.slice(0, 4) : [],
        relatedModels: Array.isArray(result.relatedModels) ? result.relatedModels : [],
        relatedCompanies: Array.isArray(result.relatedCompanies) ? result.relatedCompanies : [],
        relevanceScore: Math.min(10, Math.max(1, result.relevanceScore || 5)),
        sentiment: ['positive', 'neutral', 'negative'].includes(result.sentiment)
            ? result.sentiment
            : 'neutral',
        actionable: Boolean(result.actionable),
        technicalImpact: result.technicalImpact || '',
        isBreaking: priority === 'breaking',
    };
}

/**
 * Detect category - prioritizing vibe coder relevant content
 */
function detectCategory(item: NewsItem): NewsCategory {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();

    // PRIORITY 1: AI Coding Tools & IDEs
    if (KNOWN_IDES.some(ide => text.includes(ide.toLowerCase()))) {
        if (text.includes('launch') || text.includes('introducing') || text.includes('announce') || text.includes('new')) {
            return 'ide_launch';
        }
        return 'ide_update';
    }

    // PRIORITY 2: AI Agent Frameworks
    if (AI_FRAMEWORKS.some(fw => text.includes(fw.toLowerCase()))) {
        return 'agent';
    }

    // PRIORITY 3: Model Launches
    if (KNOWN_MODELS.some(model => text.includes(model.toLowerCase()))) {
        if (text.includes('launch') || text.includes('release') || text.includes('introducing') || text.includes('announce')) {
            return 'model_launch';
        }
    }

    // Video AI
    if (text.includes('video') && (text.includes('generation') || text.includes('sora') || text.includes('runway'))) {
        return 'video_ai';
    }

    // Image AI
    if ((text.includes('image') || text.includes('diffusion')) && text.includes('generat')) {
        return 'image_ai';
    }

    // API
    if (text.includes('api') || text.includes('endpoint') || text.includes('sdk')) {
        return 'api';
    }

    // Research
    if (text.includes('paper') || text.includes('arxiv') || text.includes('benchmark')) {
        return 'research';
    }

    // Tutorial
    if (text.includes('how to') || text.includes('tutorial') || text.includes('guide') || text.includes('building')) {
        return 'tutorial';
    }

    // Market
    if (text.includes('funding') || text.includes('acquisition') || text.includes('million') || text.includes('billion')) {
        return 'market';
    }

    return 'feature';
}

/**
 * Detect priority - boosting vibe coder relevant content
 */
function detectPriority(item: NewsItem, category: NewsCategory): NewsPriority {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();

    // BREAKING: New flagship models or major IDE releases
    const breakingKeywords = [
        'gpt-5', 'gpt5', 'claude 4', 'claude4', 'gemini 2', 'llama 4',
        'cursor', 'windsurf', 'copilot x',
        'introducing', 'announcing', 'launch'
    ];
    if (breakingKeywords.some(kw => text.includes(kw)) && ['model_launch', 'ide_launch', 'ide_update'].includes(category)) {
        return 'breaking';
    }

    // HIGH: IDE updates, Agent frameworks, important tools
    if (['ide_update', 'ide_launch', 'agent'].includes(category)) {
        return 'high';
    }

    // HIGH: Important coding tools mentioned
    if (KNOWN_IDES.some(ide => text.includes(ide.toLowerCase()))) {
        return 'high';
    }

    // LOW: Opinion pieces
    if (text.includes('opinion') || text.includes('thoughts') || text.includes('perspective')) {
        return 'low';
    }

    return 'normal';
}

/**
 * Create fallback analysis when API fails
 */
function createFallbackAnalysis(item: NewsItem): Partial<NewsItem> {
    const category = detectCategory(item);
    const priority = detectPriority(item, category);

    return {
        category,
        priority,
        summary: item.contentSnippet.slice(0, 150) + '...',
        tags: extractBasicTags(item),
        relatedModels: KNOWN_MODELS.filter(m =>
            item.title.toLowerCase().includes(m.toLowerCase()) ||
            item.contentSnippet.toLowerCase().includes(m.toLowerCase())
        ).slice(0, 3),
        relatedCompanies: KNOWN_COMPANIES.filter(c =>
            item.title.toLowerCase().includes(c.toLowerCase()) ||
            item.contentSnippet.toLowerCase().includes(c.toLowerCase())
        ).slice(0, 3),
        relevanceScore: 5,
        sentiment: 'neutral',
        actionable: false,
        isBreaking: priority === 'breaking',
    };
}

/**
 * Extract basic tags from content
 */
function extractBasicTags(item: NewsItem): string[] {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
    const tags: string[] = [];

    if (text.includes('llm') || text.includes('language model')) tags.push('LLM');
    if (text.includes('api')) tags.push('API');
    if (text.includes('python')) tags.push('Python');
    if (text.includes('javascript') || text.includes('typescript')) tags.push('JavaScript');
    if (text.includes('react') || text.includes('next.js')) tags.push('React');
    if (text.includes('rag')) tags.push('RAG');
    if (text.includes('agent')) tags.push('Agents');
    if (text.includes('fine-tun')) tags.push('Fine-tuning');
    if (text.includes('prompt')) tags.push('Prompting');
    if (text.includes('embedding')) tags.push('Embeddings');
    if (text.includes('vector')) tags.push('Vector DB');

    return tags.slice(0, 4);
}

/**
 * Batch analyze multiple items with smart concurrency
 */
export async function batchAnalyze(items: NewsItem[]): Promise<NewsItem[]> {
    const results: NewsItem[] = [];

    // Determine concurrency based on available keys - keep low to avoid rate limits
    const availableKeys = apiKeyPool.getTotalKeys();
    const concurrency = Math.min(3, Math.max(1, Math.floor(availableKeys / 4)));

    console.log(`[Groq] Analyzing ${items.length} items with concurrency ${concurrency}`);

    for (let i = 0; i < items.length; i += concurrency) {
        const chunk = items.slice(i, i + concurrency);

        const analyzedChunk = await Promise.all(
            chunk.map(async (item) => {
                const analysis = await analyzeNewsItem(item);
                return { ...item, ...analysis };
            })
        );

        results.push(...analyzedChunk);

        // Progress logging
        const progress = Math.min(100, Math.round(((i + chunk.length) / items.length) * 100));
        console.log(`[Groq] Progress: ${progress}% (${i + chunk.length}/${items.length})`);

        // Small delay between chunks to respect rate limits
        if (i + concurrency < items.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    // Sort by priority and relevance
    results.sort((a, b) => {
        const priorityOrder = { breaking: 0, high: 1, normal: 2, low: 3 };
        const pA = priorityOrder[a.priority || 'normal'];
        const pB = priorityOrder[b.priority || 'normal'];
        if (pA !== pB) return pA - pB;
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });

    return results;
}

/**
 * Get analysis statistics
 */
export async function getAnalysisStats() {
    const cacheStats = analysisCache.getStats();
    const poolStats = apiKeyPool.getStats();

    return {
        cache: cacheStats,
        apiPool: poolStats,
        knownModels: KNOWN_MODELS.length,
        knownIDEs: KNOWN_IDES.length,
        knownCompanies: KNOWN_COMPANIES.length,
    };
}
