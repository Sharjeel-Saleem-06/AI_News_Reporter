/**
 * GitHub Releases API Fetcher
 * ONLY fetches MAJOR releases - filters out patch/minor updates
 * For AI/Prompt Engineers: We only care about significant releases
 */

import { NewsItem, NewsCategory } from '../types';
import { subDays, isAfter, parseISO } from 'date-fns';

interface GitHubRepo {
    owner: string;
    repo: string;
    name: string;
    category: NewsCategory;
    color: string;
    minMajorVersion?: number; // Only show releases >= this major version
}

// Key AI/ML repositories to track - REDUCED LIST for quality over quantity
// Only repos that have MEANINGFUL releases for AI engineers
const TRACKED_REPOS: GitHubRepo[] = [
    // AI Frameworks - MAJOR releases only
    { owner: 'langchain-ai', repo: 'langchain', name: 'LangChain', category: 'agent', color: '#1c3c3c' },
    { owner: 'langchain-ai', repo: 'langgraph', name: 'LangGraph', category: 'agent', color: '#1c3c3c' },
    { owner: 'run-llama', repo: 'llama_index', name: 'LlamaIndex', category: 'agent', color: '#7c3aed' },
    { owner: 'joaomdmoura', repo: 'crewAI', name: 'CrewAI', category: 'agent', color: '#ff6b6b' },
    
    // LLM Runners - Only major releases
    { owner: 'ollama', repo: 'ollama', name: 'Ollama', category: 'model_launch', color: '#ffffff' },
    { owner: 'vllm-project', repo: 'vllm', name: 'vLLM', category: 'api', color: '#7c3aed' },
    
    // Agentic AI - Major releases
    { owner: 'All-Hands-AI', repo: 'OpenHands', name: 'OpenHands', category: 'agent', color: '#ef4444' },
    { owner: 'FlowiseAI', repo: 'Flowise', name: 'Flowise', category: 'agent', color: '#6366f1' },
];

/**
 * Check if a version is a MAJOR release (x.0.0 or significant)
 * Returns true for:
 * - Major versions (1.0.0, 2.0.0)
 * - Minor with new features (0.1.0 for new projects)
 * - Named releases with significant keywords
 */
function isMajorRelease(tagName: string, releaseName: string, body: string): boolean {
    const fullText = `${tagName} ${releaseName} ${body}`.toLowerCase();
    
    // Version patterns
    const versionMatch = tagName.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (versionMatch) {
        const [, major, minor, patch] = versionMatch.map(Number);
        
        // x.0.0 = MAJOR release
        if (minor === 0 && patch === 0 && major > 0) return true;
        
        // x.x.0 with major >= 1 = MINOR feature release (still interesting)
        if (patch === 0 && major >= 1) return true;
        
        // Skip all patch releases (x.x.1, x.x.2, etc.)
        if (patch > 0) return false;
    }
    
    // Check for significant keywords in release
    const significantKeywords = [
        'major', 'breaking', 'new feature', 'introducing',
        'completely new', 'rewrite', 'v1.0', 'v2.0', 'v3.0',
        'launch', 'announcing', 'big update', 'milestone'
    ];
    
    if (significantKeywords.some(kw => fullText.includes(kw))) {
        return true;
    }
    
    // Check for insignificant keywords (skip these)
    const skipKeywords = [
        'bug fix', 'bugfix', 'patch', 'hotfix', 'typo',
        'dependency', 'deps', 'chore', 'refactor', 'cleanup',
        'minor', 'small', 'fix:'
    ];
    
    if (skipKeywords.some(kw => fullText.includes(kw))) {
        return false;
    }
    
    return false;
}

/**
 * Fetch ONLY major releases from GitHub API
 */
export async function fetchGitHubReleases(lookbackDays: number = 7): Promise<NewsItem[]> {
    const cutoffDate = subDays(new Date(), lookbackDays);
    const allItems: NewsItem[] = [];
    
    // Fetch releases in batches
    const batchSize = 4;
    for (let i = 0; i < TRACKED_REPOS.length; i += batchSize) {
        const batch = TRACKED_REPOS.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
            batch.map(repo => fetchRepoReleases(repo, cutoffDate))
        );
        
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                allItems.push(...result.value);
            }
        });
        
        if (i + batchSize < TRACKED_REPOS.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    console.log(`[GitHub] Found ${allItems.length} MAJOR releases (filtered from noise)`);
    return allItems;
}

/**
 * Fetch releases for a single repository - ONLY MAJOR ones
 */
async function fetchRepoReleases(repo: GitHubRepo, cutoffDate: Date): Promise<NewsItem[]> {
    try {
        const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases?per_page=10`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AI-News-Aggregator',
            },
        });
        
        if (!response.ok) {
            return [];
        }
        
        const releases = await response.json();
        
        return releases
            .filter((release: any) => {
                const date = new Date(release.published_at);
                if (release.draft || !isAfter(date, cutoffDate)) return false;
                
                // CRITICAL: Only include MAJOR releases
                return isMajorRelease(release.tag_name, release.name || '', release.body || '');
            })
            .map((release: any) => ({
                id: `github-${repo.owner}-${repo.repo}-${release.id}`,
                title: `${repo.name} ${release.tag_name}${release.name ? ` - ${release.name}` : ''}`,
                link: release.html_url,
                pubDate: release.published_at,
                source: repo.name,
                sourceTier: 'trusted' as const, // GitHub releases are trusted but not "official news"
                contentSnippet: truncateMarkdown(release.body || '', 400),
                content: release.body || '',
                category: repo.category,
                tags: [repo.name, 'Release', 'Major Update'],
                relatedCompanies: [repo.name],
            }))
            .slice(0, 1); // Max 1 major release per repo
        
    } catch (error) {
        return [];
    }
}

/**
 * Truncate markdown content for snippet
 */
function truncateMarkdown(content: string, maxLength: number): string {
    let text = content
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/```[\s\S]*?```/g, '[code]')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        .replace(/^\s*[-*+]\s/gm, '• ')
        .replace(/\n{2,}/g, ' ')
        .trim();
    
    if (text.length > maxLength) {
        text = text.slice(0, maxLength).trim() + '...';
    }
    
    return text;
}
