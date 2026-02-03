/**
 * Vibe Coder AI Analysis System v2
 * - Enhanced relevance scoring for AI developers
 * - Prioritizes AI coding tools, models, and IDEs
 * - Uses API Key Pool for load balancing with 10 keys
 * - Smart caching to minimize API calls
 */

import Groq from 'groq-sdk';
import { NewsItem, NewsCategory, NewsPriority } from './types';
import { apiKeyPool } from './api-pool';
import { analysisCache } from './advanced-cache';
import { stripHtml } from './utils';

// VIBE CODER RELEVANT ENTITIES - Expanded and prioritized (Updated Jan 2026)
const KNOWN_MODELS = [
    // Flagship Models - MUST KNOW (Tier 1)
    'GPT-4', 'GPT-4o', 'GPT-4.5', 'GPT-5', 'GPT-5.2', 'GPT-5.2-Codex', 'o1', 'o3', 'o1-pro', 'o1-mini',
    'Claude', 'Claude 3', 'Claude 3.5', 'Claude 4', 'Claude 4.5', 'Sonnet', 'Opus', 'Haiku',
    'Sonnet 4', 'Sonnet 4.5', 'Opus 4', 'Opus 4.5', 'Haiku 4', 'Haiku 4.5',
    'Gemini', 'Gemini 2', 'Gemini 2.0', 'Gemini 3', 'Gemini 3 Flash', 'Gemini Pro', 'Gemini Ultra', 'Gemini Flash', 'Gemma', 'Gemma 2', 'Gemma 3',
    // Grok (xAI) - Tier 1
    'Grok', 'Grok 2', 'Grok 3', 'Grok 4', 'Grok 4.1',
    // Kimi (Moonshot AI) - Tier 1
    'Kimi', 'Kimi K1', 'Kimi K1.5', 'Kimi K2', 'Kimi K2.5', 'Kimi K2 Thinking',
    // Open Source - For local dev (Tier 2)
    'Llama', 'Llama 3', 'Llama 3.1', 'Llama 3.2', 'Llama 3.3', 'Llama 4', 'CodeLlama',
    'Mistral', 'Mixtral', 'Codestral', 'Pixtral', 'Mistral Large', 'Mistral Small',
    'Qwen', 'Qwen 2', 'Qwen 2.5', 'QwQ', 'DeepSeek', 'DeepSeek-V3', 'DeepSeek-R1',
    'Phi-4', 'Phi-3', 'Phi-3.5',
    // Chinese AI Models (Tier 2)
    'Yi', 'Yi-Lightning', 'Yi-Large', 'Yi-34B',
    'Baichuan', 'Baichuan 2',
    'GLM', 'GLM-4', 'ChatGLM',
    'Ernie', 'Ernie Bot',
    // Enterprise Models (Tier 2)
    'Command R', 'Command R+', 'Cohere Command',
    'Reka', 'Reka Core', 'Reka Flash', 'Reka Edge',
    'AI21 Jamba', 'Jurassic',
    // NVIDIA Models (Tier 2)
    'Nemotron', 'NVIDIA Nemotron',
    // Code Models (Tier 2)
    'Codex', 'StarCoder', 'StarCoder2', 'CodeGen', 'WizardCoder', 'Magicoder',
    // Vision/Multimodal (Tier 2)
    'GPT-4V', 'GPT-4o', 'Claude 3 Vision', 'Gemini Vision', 'LLaVA', 'Qwen-VL',
    // Video/Image (Tier 3)
    'Sora', 'DALL-E', 'DALL-E 3', 'Midjourney', 'Midjourney v6', 'Stable Diffusion', 'SDXL', 'FLUX', 'Flux.1',
    'Runway', 'Kling', 'Pika', 'Luma', 'HeyGen', 'Synthesia',
    'Imagen', 'Imagen 3', 'Firefly', 'Adobe Firefly',
];

const KNOWN_IDES = [
    // AI IDEs - PRIMARY FOCUS (Tier 1) - Updated Jan 2026
    'Cursor', 'Cursor IDE', 'Cursor AI', 'Cursor 2',
    'Windsurf', 'Codeium', 'Supermaven',
    'GitHub Copilot', 'Copilot', 'Copilot Chat', 'Copilot Workspace',
    'Tabnine',
    'Replit', 'Replit Agent', 'Ghostwriter',
    'Bolt', 'bolt.new', 'StackBlitz',
    'v0', 'v0.dev',
    'Lovable', 'Devin', 'Devon',
    // NEW AI IDEs (Tier 1)
    'Antigravity', 'Antigravity IDE', 'Google Antigravity',
    'Trae', 'Trae IDE',
    'Melty', 'Melty AI',
    'Void', 'Void Editor',
    'PearAI', 'Pear AI',
    // AI Code Assistants (Tier 2)
    'Claude Code', 'Aider', 'Cody', 'Sourcegraph Cody',
    'Continue', 'Continuedev',
    'Amazon Q', 'CodeWhisperer', 'Amazon Q Developer',
    'Codium', 'Codiumate',
    'Refact', 'Refact AI',
    'Cline', 'Roo Code', 'Roo Cline',
    // Traditional IDEs with AI (Tier 3)
    'VS Code', 'Visual Studio Code', 'VSCode',
    'JetBrains AI', 'IntelliJ', 'PyCharm', 'WebStorm',
    'Zed', 'Zed Editor',
    'Neovim', 'Vim',
];

const AI_FRAMEWORKS = [
    // Agent Frameworks (Tier 1) - Updated Jan 2026
    'LangChain', 'LangGraph', 'LangSmith', 'LangServe',
    'LlamaIndex', 'LlamaHub', 'LlamaParse', 'LlamaCloud',
    'CrewAI', 'AutoGen', 'Autogen Studio', 'AG2',
    'Semantic Kernel', 'Haystack', 'DSPy', 'Instructor',
    'Pydantic AI', 'Marvin', 'Mirascope', 'Magentic',
    'OpenAI Swarm', 'Swarm', 'Bee AI', 'BeeAI',
    // MCP & Tools (Tier 1)
    'MCP', 'Model Context Protocol', 'Claude MCP',
    'Function Calling', 'Tool Use', 'Tool Calling',
    // Agentic AI Platforms (NEW - Tier 1)
    'Dify', 'Flowise', 'n8n AI', 'Langflow',
    'AgentOps', 'OpenDevin', 'SWE-agent', 'SWE Agent',
    'Cognition', 'Factory AI', 'Poolside AI',
    // RAG & Vector (Tier 2)
    'RAG', 'Retrieval Augmented', 'Retrieval Augmented Generation',
    'Vector Database', 'Embeddings', 'Semantic Search',
    'Pinecone', 'Weaviate', 'Chroma', 'ChromaDB', 'Qdrant', 'Milvus', 'pgvector',
    'LanceDB', 'Turbopuffer', 'Supabase Vector',
    // Inference (Tier 2)
    'vLLM', 'TensorRT', 'TensorRT-LLM', 'ONNX', 'Ollama', 'LM Studio', 'LocalAI',
    'Groq', 'Together AI', 'Fireworks AI', 'Anyscale', 'Modal', 'Replicate',
    'Lepton AI', 'RunPod', 'Lambda Labs', 'Msty', 'Jan AI',
    // Prompting & Training (Tier 2)
    'Prompt Engineering', 'Chain of Thought', 'CoT', 'Few-shot', 'Zero-shot',
    'RLHF', 'DPO', 'Fine-tuning', 'LoRA', 'QLoRA', 'Adapter',
    'PromptLayer', 'Promptfoo', 'Langfuse', 'Helicone', 'Braintrust',
    // Gen AI Concepts (Tier 2)
    'Gen AI', 'Generative AI', 'AI Engineering', 'MLOps', 'LLMOps',
    'Context Window', 'Token Optimization', 'Model Serving',
    'AI Architecture', 'Multi-Agent', 'Agent Orchestration',
];

const KNOWN_COMPANIES = [
    // AI Labs (Tier 1) - Updated Jan 2026
    'OpenAI', 'Anthropic', 'Google', 'Google AI', 'DeepMind', 'Meta AI', 'Meta',
    'Microsoft', 'Microsoft AI', 'xAI', 'X.AI',
    // Chinese AI Labs (NEW - Tier 1)
    'Moonshot AI', 'Moonshot', 'Kimi', '01.AI', 'Zero One', 'Yi',
    'DeepSeek', 'Baichuan', 'Zhipu AI', 'GLM',
    'ByteDance', 'Doubao', 'Alibaba', 'Qwen',
    // Model Providers (Tier 2)
    'Mistral AI', 'Mistral', 'Cohere', 'AI21', 'AI21 Labs', 'Stability AI',
    'Hugging Face', 'HuggingFace', 'Reka AI', 'Reka',
    // Infrastructure (Tier 2)
    'Together AI', 'Groq', 'Replicate', 'Modal', 'Anyscale', 'Fireworks',
    'Lepton AI', 'RunPod', 'Lambda Labs', 'Cerebras', 'SambaNova',
    // Dev Tools (Tier 2)
    'Vercel', 'Supabase', 'Neon', 'Cloudflare', 'Netlify',
    // IDE Companies (Tier 1)
    'Anysphere', 'Cursor', 'GitHub', 'Sourcegraph', 'Replit',
    'Codeium', 'Tabnine', 'Cognition', 'Devin',
    'Factory', 'Poolside', 'Magic AI',
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

        // Retry on rate limit with different key - max 2 retries to avoid loops
        if (error?.status === 429 && retryCount < 2) {
            console.warn(`[Groq] Rate limited, retrying with different key (${retryCount + 1}/2)`);
            await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
            return analyzeNewsItem(item, retryCount + 1);
        }

        console.error(`[Groq] Analysis failed for "${item.title.slice(0, 50)}...":`, error?.message);
        return createFallbackAnalysis(item);
    }
}

/**
 * Vibe Coder focused analysis prompt v3
 * Enhanced for hot news detection and new model coverage
 * Updated Jan 2026
 */
function createAnalysisPrompt(item: NewsItem): string {
    return `You are an AI News Analyst for AI ENGINEERS and GEN AI DEVELOPERS.
Your audience:
- Builds with LLMs (LangChain, LlamaIndex, RAG systems, MCP)
- Uses AI coding tools (Cursor, Copilot, Windsurf, Antigravity, Aider)
- Works on Gen AI applications and AI engineering projects
- Interested in prompt engineering, model training, AI architecture
- Wants actionable updates on AI models, tools, frameworks, and job-relevant skills

ANALYZE THIS NEWS:
Title: "${item.title}"
Source: "${item.source}"
Content: "${(item.contentSnippet || item.content || '').slice(0, 1000)}"

STRICT CATEGORIZATION (pick ONE - be precise):
- 'model_launch': NEW AI model releases (GPT-5, Claude 4.5, Gemini 3, Llama 4, Kimi K2, Grok 4, DeepSeek, Yi-Lightning, new version of ANY model)
- 'ide_update': Updates to AI coding tools (Cursor changelog, Copilot feature, Windsurf, Codeium, VS Code AI features, Antigravity)
- 'ide_launch': NEW AI IDE or coding tool launch
- 'agent': AI Agents, MCP, LangChain, LlamaIndex, CrewAI, AutoGen, OpenAI Swarm, autonomous coding, RAG, multi-agent systems, tool use
- 'api': API updates, SDK releases, pricing changes, rate limits, new endpoints
- 'video_ai': Video generation (Sora, Runway, Kling, Pika, Luma)
- 'image_ai': Image generation (DALL-E, Midjourney, Flux, Stable Diffusion, Imagen)
- 'feature': Gen AI product updates, new features in AI tools
- 'research': Papers, benchmarks, technical deep-dives, arxiv, prompt engineering research
- 'tutorial': How-to guides, code examples, cookbooks, prompt engineering tutorials, RAG tutorials
- 'market': Funding, acquisitions, AI job market, hiring trends, AI engineering roles
- 'other': Doesn't fit above (use sparingly)

PRIORITY LEVELS (BE GENEROUS WITH breaking/high FOR HOT NEWS):
- 'breaking': Major flagship model (GPT-5, Claude 4.5, Gemini 3, Grok 4, Kimi K2), Major IDE release (Cursor 2), Game-changing AI tool, Major company announcement
- 'high': New model version, significant IDE update, major framework release, API pricing change, AI job market shift
- 'normal': Regular updates, tutorials, research papers, prompt engineering tips
- 'low': Opinion pieces, minor news, tangential topics

MODEL HOTLIST (Trending - boost relevance if mentioned):
GPT-5, GPT-5.2, Claude 4.5, Opus 4.5, Gemini 3, Grok 4, Grok 4.1, Kimi K2, Kimi K2.5, DeepSeek-R1, Yi-Lightning, Qwen 2.5, Llama 4, Nemotron, Command R+

IDE HOTLIST (Boost if mentioned):
Cursor 2, GitHub Copilot (new features), Windsurf, Antigravity IDE, Devin, Cline, Roo Code

FRAMEWORK HOTLIST (Boost if mentioned):
LangGraph, LlamaIndex, CrewAI, AutoGen, OpenAI Swarm, MCP, Dify, Flowise, SWE-agent, OpenHands

RELEVANCE SCORE (1-10) - Be generous for HOT topics:
10: New flagship model release or major IDE launch
9: Major update to popular model/tool I use daily
8: Framework release affecting my Gen AI stack
7: New AI engineering tool, prompt engineering breakthrough
6: Useful tutorial, career-relevant AI skills
5: Interesting concept but not immediately actionable
3-4: Background AI industry news
1-2: Not relevant to AI engineering

SPECIAL ATTENTION (Boost priority for these):
- New model launches from ANY company (OpenAI, Anthropic, Google, xAI, Moonshot, Meta, Mistral, Cohere, etc.)
- Prompt engineering techniques and best practices
- RAG improvements and vector database updates
- MCP (Model Context Protocol) ecosystem
- AI Engineering job skills and career development
- Chinese AI models (Kimi, DeepSeek, Qwen, Yi)
- AI coding agents and tools

Return ONLY valid JSON (no markdown):
{
  "category": "model_launch|ide_update|ide_launch|agent|api|video_ai|image_ai|feature|research|tutorial|market|other",
  "priority": "breaking|high|normal|low",
  "summary": "2 sentences max: What happened + Why AI engineers/Gen AI developers should care",
  "tags": ["max 4 relevant tags - include model names, tools, 'Gen AI', 'AI Engineer', 'Prompt Engineering' if applicable"],
  "relatedModels": ["list ALL specific model names mentioned - be thorough"],
  "relatedCompanies": ["list companies mentioned"],
  "relevanceScore": 1-10,
  "sentiment": "positive|neutral|negative",
  "actionable": true or false,
  "technicalImpact": "One sentence: What can AI engineers build/do differently now?"
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
        summary: stripHtml(result.summary || item.contentSnippet.slice(0, 150) + '...'),
        tags: Array.isArray(result.tags) ? result.tags.slice(0, 4) : [],
        relatedModels: Array.isArray(result.relatedModels) ? result.relatedModels : [],
        relatedCompanies: Array.isArray(result.relatedCompanies) ? result.relatedCompanies : [],
        relevanceScore: Math.min(10, Math.max(1, result.relevanceScore || 5)),
        sentiment: ['positive', 'neutral', 'negative'].includes(result.sentiment)
            ? result.sentiment
            : 'neutral',
        actionable: Boolean(result.actionable),
        technicalImpact: stripHtml(result.technicalImpact || ''),
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
 * Updated Jan 2026 with new hot models
 */
function detectPriority(item: NewsItem, category: NewsCategory): NewsPriority {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();

    // BREAKING: New flagship models or major IDE releases - EXPANDED
    const breakingKeywords = [
        // Flagship Models
        'gpt-5', 'gpt5', 'gpt-5.2', 'claude 4', 'claude4', 'claude 4.5', 'opus 4.5',
        'gemini 3', 'gemini 2', 'llama 4', 'grok 4', 'grok 3',
        'kimi k2', 'kimi k2.5', 'deepseek-r1', 'yi-lightning',
        // IDEs
        'cursor 2', 'cursor', 'windsurf', 'copilot', 'antigravity',
        'devin', 'cline',
        // Launch keywords
        'introducing', 'announcing', 'launch', 'release', 'now available'
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

    // HIGH: Hot frameworks
    const hotFrameworks = ['langgraph', 'mcp', 'model context protocol', 'crewai', 'openai swarm', 'swe-agent', 'openhands'];
    if (hotFrameworks.some(fw => text.includes(fw))) {
        return 'high';
    }

    // HIGH: Chinese AI models (trending)
    const chineseModels = ['kimi', 'deepseek', 'qwen', 'yi-', 'baichuan', 'glm', 'moonshot'];
    if (chineseModels.some(m => text.includes(m))) {
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
        summary: stripHtml(item.contentSnippet).slice(0, 150) + '...',
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
 * Extract basic tags from content - Enhanced for Gen AI and AI Engineer focus
 */
function extractBasicTags(item: NewsItem): string[] {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
    const tags: string[] = [];

    // Gen AI & AI Engineering
    if (text.includes('gen ai') || text.includes('generative ai')) tags.push('Gen AI');
    if (text.includes('ai engineer') || text.includes('ai engineering')) tags.push('AI Engineer');
    if (text.includes('mlops') || text.includes('llmops')) tags.push('MLOps');
    
    // Core AI Concepts
    if (text.includes('llm') || text.includes('language model')) tags.push('LLM');
    if (text.includes('prompt engineering') || text.includes('prompting')) tags.push('Prompt Engineering');
    if (text.includes('rag') || text.includes('retrieval augmented')) tags.push('RAG');
    
    // Frameworks
    if (text.includes('langchain')) tags.push('LangChain');
    if (text.includes('llamaindex') || text.includes('llama-index')) tags.push('LlamaIndex');
    if (text.includes('crewai')) tags.push('CrewAI');
    if (text.includes('autogen')) tags.push('AutoGen');
    
    // Technologies
    if (text.includes('api')) tags.push('API');
    if (text.includes('python')) tags.push('Python');
    if (text.includes('javascript') || text.includes('typescript')) tags.push('JavaScript');
    if (text.includes('react') || text.includes('next.js')) tags.push('React');
    if (text.includes('agent')) tags.push('Agents');
    if (text.includes('fine-tun')) tags.push('Fine-tuning');
    if (text.includes('embedding')) tags.push('Embeddings');
    if (text.includes('vector')) tags.push('Vector DB');
    if (text.includes('semantic search')) tags.push('Semantic Search');
    
    // Career & Skills
    if (text.includes('job') || text.includes('hiring') || text.includes('career')) tags.push('Career');
    if (text.includes('tutorial') || text.includes('guide')) tags.push('Tutorial');

    return tags.slice(0, 4);
}

/**
 * Batch analyze multiple items with optimized concurrency for 10 API keys
 * Conservative approach to avoid rate limits on Groq free tier
 */
export async function batchAnalyze(items: NewsItem[]): Promise<NewsItem[]> {
    const results: NewsItem[] = [];

    // Conservative concurrency for Groq free tier
    // Each key allows ~30 requests/minute, but we'll be cautious
    // Use max 2-3 concurrent requests to avoid hitting limits
    const availableKeys = apiKeyPool.getTotalKeys();
    const concurrency = Math.min(3, Math.max(1, Math.floor(availableKeys / 4)));

    console.log(`[Groq] Analyzing ${items.length} items with concurrency ${concurrency} (${availableKeys} API keys)`);

    // Pre-filter items to skip those with existing analysis in cache
    const itemsToProcess: NewsItem[] = [];
    const cachedResults: NewsItem[] = [];

    for (const item of items) {
        const cached = await analysisCache.get(item.id);
        if (cached) {
            cachedResults.push({ ...item, ...cached });
        } else {
            itemsToProcess.push(item);
        }
    }

    if (cachedResults.length > 0) {
        console.log(`[Groq] Using ${cachedResults.length} cached analyses, processing ${itemsToProcess.length} new items`);
    }

    // Process items in parallel chunks with timeout protection
    for (let i = 0; i < itemsToProcess.length; i += concurrency) {
        const chunk = itemsToProcess.slice(i, i + concurrency);

        const analyzedChunk = await Promise.allSettled(
            chunk.map(async (item, index) => {
                try {
                    // Add timeout to individual analysis (5 seconds max per item)
                    const analysisPromise = analyzeNewsItem(item);
                    const timeoutPromise = new Promise<Partial<NewsItem>>((resolve) => 
                        setTimeout(() => resolve(createFallbackAnalysis(item)), 5000)
                    );
                    const analysis = await Promise.race([analysisPromise, timeoutPromise]);
                    return { ...item, ...analysis };
                } catch (error) {
                    console.warn(`[Groq] Analysis error for "${item.title.slice(0, 50)}...":`, error);
                    return { ...item, ...createFallbackAnalysis(item) };
                }
            })
        );

        // Process results, handling both fulfilled and rejected promises
        analyzedChunk.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                console.warn(`[Groq] Analysis failed for item at index ${index}:`, result.reason);
                // Add fallback analysis
                const item = chunk[index];
                if (item) {
                    results.push({ ...item, ...createFallbackAnalysis(item) });
                }
            }
        });

        // Progress logging
        const progress = Math.min(100, Math.round(((i + chunk.length) / itemsToProcess.length) * 100));
        console.log(`[Groq] Progress: ${progress}% (${i + chunk.length}/${itemsToProcess.length})`);

        // Longer delay between chunks to avoid rate limits
        // Groq free tier is strict, so we add 500ms between batches
        if (i + concurrency < itemsToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Combine cached and new results
    const allResults = [...cachedResults, ...results];

    // Sort by priority, then relevance, then date
    allResults.sort((a, b) => {
        const priorityOrder = { breaking: 0, high: 1, normal: 2, low: 3 };
        const pA = priorityOrder[a.priority || 'normal'];
        const pB = priorityOrder[b.priority || 'normal'];
        if (pA !== pB) return pA - pB;
        
        const scoreA = a.relevanceScore || 0;
        const scoreB = b.relevanceScore || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    // STRICT FILTERING: Only keep high-value content for AI engineers
    const filtered = allResults.filter(item => {
        // Always keep breaking news
        if (item.priority === 'breaking') return true;
        
        // Always keep high priority from official sources
        if (item.priority === 'high' && item.sourceTier === 'official') return true;
        
        // Keep items with relevance >= 6 (meaningful for AI engineers)
        if (item.relevanceScore && item.relevanceScore >= 6) return true;
        
        // Keep high priority items with decent relevance
        if (item.priority === 'high' && item.relevanceScore && item.relevanceScore >= 5) return true;
        
        // Skip everything else (low value content)
        return false;
    });

    console.log(`[Groq] Final: ${filtered.length} items after strict filtering (removed ${allResults.length - filtered.length} low-value items)`);

    return filtered;
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
