/**
 * GitHub Releases API Fetcher
 * Fetches releases from key AI/ML repositories
 */

import { NewsItem, NewsCategory } from '../types';
import { subDays, isAfter, parseISO } from 'date-fns';

interface GitHubRepo {
    owner: string;
    repo: string;
    name: string;
    category: NewsCategory;
    color: string;
}

// Key AI/ML repositories to track
const TRACKED_REPOS: GitHubRepo[] = [
    // AI Frameworks
    { owner: 'langchain-ai', repo: 'langchain', name: 'LangChain', category: 'agent', color: '#1c3c3c' },
    { owner: 'run-llama', repo: 'llama_index', name: 'LlamaIndex', category: 'agent', color: '#7c3aed' },
    { owner: 'microsoft', repo: 'autogen', name: 'AutoGen', category: 'agent', color: '#00a4ef' },
    { owner: 'joaomdmoura', repo: 'crewAI', name: 'CrewAI', category: 'agent', color: '#ff6b6b' },
    
    // LLMs & Models
    { owner: 'ollama', repo: 'ollama', name: 'Ollama', category: 'model_launch', color: '#ffffff' },
    { owner: 'ggerganov', repo: 'llama.cpp', name: 'llama.cpp', category: 'model_launch', color: '#333333' },
    { owner: 'huggingface', repo: 'transformers', name: 'HF Transformers', category: 'model_launch', color: '#ff9d00' },
    { owner: 'vllm-project', repo: 'vllm', name: 'vLLM', category: 'api', color: '#7c3aed' },
    
    // AI Coding Tools
    { owner: 'Aider-AI', repo: 'aider', name: 'Aider', category: 'ide_update', color: '#00ff9f' },
    { owner: 'continuedev', repo: 'continue', name: 'Continue', category: 'ide_update', color: '#0066ff' },
    { owner: 'sourcegraph', repo: 'cody', name: 'Cody', category: 'ide_update', color: '#ff5733' },
    
    // Vector DBs & RAG
    { owner: 'chroma-core', repo: 'chroma', name: 'ChromaDB', category: 'agent', color: '#ff6b6b' },
    { owner: 'qdrant', repo: 'qdrant', name: 'Qdrant', category: 'agent', color: '#dc2626' },
    { owner: 'weaviate', repo: 'weaviate', name: 'Weaviate', category: 'agent', color: '#00d26a' },
    
    // AI Infrastructure
    { owner: 'BerriAI', repo: 'litellm', name: 'LiteLLM', category: 'api', color: '#10a37f' },
    { owner: 'anthropics', repo: 'anthropic-cookbook', name: 'Anthropic Cookbook', category: 'tutorial', color: '#d4a574' },
    { owner: 'openai', repo: 'openai-cookbook', name: 'OpenAI Cookbook', category: 'tutorial', color: '#10a37f' },
    
    // MCP (Model Context Protocol)
    { owner: 'modelcontextprotocol', repo: 'servers', name: 'MCP Servers', category: 'agent', color: '#8b5cf6' },
    
    // Image/Video AI
    { owner: 'AUTOMATIC1111', repo: 'stable-diffusion-webui', name: 'SD WebUI', category: 'image_ai', color: '#ff9d00' },
    { owner: 'comfyanonymous', repo: 'ComfyUI', name: 'ComfyUI', category: 'image_ai', color: '#22c55e' },
];

/**
 * Fetch releases from GitHub API
 */
export async function fetchGitHubReleases(lookbackDays: number = 3): Promise<NewsItem[]> {
    const cutoffDate = subDays(new Date(), lookbackDays);
    const allItems: NewsItem[] = [];
    
    // Fetch releases in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < TRACKED_REPOS.length; i += batchSize) {
        const batch = TRACKED_REPOS.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
            batch.map(repo => fetchRepoReleases(repo, cutoffDate))
        );
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                allItems.push(...result.value);
            }
        });
        
        // Small delay between batches to be nice to GitHub API
        if (i + batchSize < TRACKED_REPOS.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    return allItems;
}

/**
 * Fetch releases for a single repository
 */
async function fetchRepoReleases(repo: GitHubRepo, cutoffDate: Date): Promise<NewsItem[]> {
    try {
        const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases?per_page=5`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AI-News-Aggregator',
            },
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                console.warn(`[GitHub] Rate limited for ${repo.name}`);
            }
            return [];
        }
        
        const releases = await response.json();
        
        return releases
            .filter((release: any) => {
                const date = new Date(release.published_at);
                return !release.draft && isAfter(date, cutoffDate);
            })
            .map((release: any) => ({
                id: `github-${repo.owner}-${repo.repo}-${release.id}`,
                title: `${repo.name} ${release.tag_name}${release.name ? ` - ${release.name}` : ''}`,
                link: release.html_url,
                pubDate: release.published_at,
                source: 'GitHub',
                sourceTier: 'official' as const,
                contentSnippet: truncateMarkdown(release.body || '', 500),
                content: release.body || '',
                category: repo.category,
                tags: ['GitHub', repo.name, 'Release'],
                relatedCompanies: [repo.name],
            }))
            .slice(0, 2); // Max 2 releases per repo
        
    } catch (error) {
        console.warn(`[GitHub] Failed to fetch ${repo.name}:`, error instanceof Error ? error.message : 'Unknown');
        return [];
    }
}

/**
 * Truncate markdown content for snippet
 */
function truncateMarkdown(content: string, maxLength: number): string {
    // Remove markdown formatting for snippet
    let text = content
        .replace(/#{1,6}\s/g, '') // Headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
        .replace(/\*([^*]+)\*/g, '$1') // Italic
        .replace(/`([^`]+)`/g, '$1') // Inline code
        .replace(/```[\s\S]*?```/g, '[code]') // Code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
        .replace(/^\s*[-*+]\s/gm, '• ') // List items
        .replace(/\n{2,}/g, ' ') // Multiple newlines
        .trim();
    
    if (text.length > maxLength) {
        text = text.slice(0, maxLength).trim() + '...';
    }
    
    return text;
}
