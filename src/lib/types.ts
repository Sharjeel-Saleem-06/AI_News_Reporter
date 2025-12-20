/**
 * Enhanced Type Definitions for AI News Tracker
 */

// More granular categories for AI news
export type NewsCategory =
    | 'model_launch'      // New AI models (GPT-5, Claude 4, Llama 4)
    | 'ide_update'        // IDE updates (Cursor, Windsurf, VS Code AI)
    | 'ide_launch'        // New IDE launches
    | 'feature'           // Feature updates to existing tools
    | 'research'          // Papers, breakthroughs
    | 'tutorial'          // Guides, how-tos
    | 'market'            // Funding, acquisitions, corporate
    | 'video_ai'          // Video generation AI (Sora, Runway, Kling)
    | 'image_ai'          // Image generation AI (DALL-E, Midjourney)
    | 'agent'             // AI Agents, Autonomous systems
    | 'api'               // API updates, new endpoints
    | 'other';

// Priority levels for news importance
export type NewsPriority = 'breaking' | 'high' | 'normal' | 'low';

// Source credibility
export type SourceTier = 'official' | 'trusted' | 'community' | 'aggregator';

export interface NewsSource {
    name: string;
    url: string;
    tier: SourceTier;
    categories: NewsCategory[];
    icon?: string;
    color?: string;
}

export interface NewsItem {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    source: string;
    sourceTier?: SourceTier;
    contentSnippet: string;
    content: string;
    imageUrl?: string;

    // AI Analysis fields
    category?: NewsCategory;
    summary?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    relevanceScore?: number;
    tags?: string[];
    priority?: NewsPriority;

    // Enhanced fields
    isBreaking?: boolean;
    relatedModels?: string[];      // ["GPT-4", "Claude 3.5"]
    relatedCompanies?: string[];   // ["OpenAI", "Anthropic"]
    technicalImpact?: string;      // Brief technical impact note
    actionable?: boolean;          // Is this actionable for developers?
}

export interface NewsResponse {
    items: NewsItem[];
    lastUpdated: string;
    fromCache: boolean;
    stats: {
        totalArticles: number;
        newArticles: number;
        sources: number;
        categories: Record<NewsCategory, number>;
    };
    scheduler: {
        nextRefresh: number;
        isProcessing: boolean;
    };
}

export interface FeedStatus {
    name: string;
    url: string;
    lastFetch: string | null;
    isHealthy: boolean;
    articleCount: number;
    errorCount: number;
}

// Category display configuration
export const CATEGORY_CONFIG: Record<NewsCategory, {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    priority: number;
}> = {
    model_launch: {
        label: '🚀 Model Launch',
        icon: 'Rocket',
        color: 'text-purple-300',
        bgColor: 'bg-purple-500/20 border-purple-500/50',
        priority: 1,
    },
    ide_update: {
        label: '⚡ IDE Update',
        icon: 'Terminal',
        color: 'text-cyan-300',
        bgColor: 'bg-cyan-500/20 border-cyan-500/50',
        priority: 2,
    },
    ide_launch: {
        label: '✨ New IDE',
        icon: 'Sparkles',
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-500/20 border-yellow-500/50',
        priority: 1,
    },
    video_ai: {
        label: '🎬 Video AI',
        icon: 'Video',
        color: 'text-pink-300',
        bgColor: 'bg-pink-500/20 border-pink-500/50',
        priority: 3,
    },
    image_ai: {
        label: '🎨 Image AI',
        icon: 'Image',
        color: 'text-orange-300',
        bgColor: 'bg-orange-500/20 border-orange-500/50',
        priority: 3,
    },
    agent: {
        label: '🤖 AI Agent',
        icon: 'Bot',
        color: 'text-indigo-300',
        bgColor: 'bg-indigo-500/20 border-indigo-500/50',
        priority: 2,
    },
    api: {
        label: '🔌 API Update',
        icon: 'Plug',
        color: 'text-green-300',
        bgColor: 'bg-green-500/20 border-green-500/50',
        priority: 4,
    },
    feature: {
        label: '⚙️ Feature',
        icon: 'Zap',
        color: 'text-blue-300',
        bgColor: 'bg-blue-500/20 border-blue-500/50',
        priority: 4,
    },
    research: {
        label: '🔬 Research',
        icon: 'Microscope',
        color: 'text-violet-300',
        bgColor: 'bg-violet-500/20 border-violet-500/50',
        priority: 3,
    },
    tutorial: {
        label: '📚 Tutorial',
        icon: 'BookOpen',
        color: 'text-amber-300',
        bgColor: 'bg-amber-500/20 border-amber-500/50',
        priority: 5,
    },
    market: {
        label: '📈 Market',
        icon: 'TrendingUp',
        color: 'text-emerald-300',
        bgColor: 'bg-emerald-500/20 border-emerald-500/50',
        priority: 5,
    },
    other: {
        label: '📰 News',
        icon: 'Newspaper',
        color: 'text-gray-300',
        bgColor: 'bg-gray-500/20 border-gray-500/50',
        priority: 6,
    },
};

// Priority configuration
export const PRIORITY_CONFIG: Record<NewsPriority, {
    label: string;
    color: string;
    pulse: boolean;
}> = {
    breaking: {
        label: 'BREAKING',
        color: 'bg-red-500 text-white',
        pulse: true,
    },
    high: {
        label: 'HOT',
        color: 'bg-orange-500 text-white',
        pulse: false,
    },
    normal: {
        label: '',
        color: '',
        pulse: false,
    },
    low: {
        label: '',
        color: '',
        pulse: false,
    },
};
