'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { NewsItem, NewsCategory, NewsResponse, CATEGORY_CONFIG } from '@/lib/types';
import { NewsCard } from './NewsCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Search, RefreshCw, Filter, Zap, Clock,
    Rocket, Terminal, Sparkles, Video, Image, Bot,
    Plug, Microscope, BookOpen, TrendingUp, Newspaper,
    X, ChevronDown, AlertCircle, Wifi, WifiOff
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
    all: Activity,
    model_launch: Rocket,
    ide_update: Terminal,
    ide_launch: Sparkles,
    video_ai: Video,
    image_ai: Image,
    agent: Bot,
    api: Plug,
    feature: Zap,
    research: Microscope,
    tutorial: BookOpen,
    market: TrendingUp,
    other: Newspaper,
};

type FilterCategory = NewsCategory | 'all';

interface FilterOption {
    id: FilterCategory;
    label: string;
    icon: React.ElementType;
    count?: number;
}

export default function NewsDashboard() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [fromCache, setFromCache] = useState(false);
    const [stats, setStats] = useState<NewsResponse['stats'] | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch news
    const fetchNews = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) setIsRefreshing(true);
            else setLoading(true);

            const url = forceRefresh ? '/api/news?refresh=true' : '/api/news';
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status}`);
            }

            const data: NewsResponse = await res.json();

            if (data.items) {
                setNews(data.items);
                setLastUpdated(data.lastUpdated);
                setFromCache(data.fromCache);
                setStats(data.stats);
                setError(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load news');
            console.error('Failed to load news', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();

        // Auto-refresh every 5 minutes
        const interval = setInterval(() => {
            fetchNews();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchNews]);

    // Filter options with counts
    const filterOptions = useMemo(() => {
        const baseCounts: Record<string, number> = { all: news.length };

        news.forEach(item => {
            if (item.category) {
                baseCounts[item.category] = (baseCounts[item.category] || 0) + 1;
            }
        });

        return [
            { id: 'all' as FilterCategory, label: 'All News', icon: Activity, count: baseCounts.all },
            { id: 'model_launch' as FilterCategory, label: 'Model Launches', icon: Rocket, count: baseCounts.model_launch },
            { id: 'ide_update' as FilterCategory, label: 'IDE Updates', icon: Terminal, count: baseCounts.ide_update },
            { id: 'ide_launch' as FilterCategory, label: 'New IDEs', icon: Sparkles, count: baseCounts.ide_launch },
            { id: 'video_ai' as FilterCategory, label: 'Video AI', icon: Video, count: baseCounts.video_ai },
            { id: 'image_ai' as FilterCategory, label: 'Image AI', icon: Image, count: baseCounts.image_ai },
            { id: 'agent' as FilterCategory, label: 'AI Agents', icon: Bot, count: baseCounts.agent },
            { id: 'api' as FilterCategory, label: 'API Updates', icon: Plug, count: baseCounts.api },
            { id: 'research' as FilterCategory, label: 'Research', icon: Microscope, count: baseCounts.research },
            { id: 'tutorial' as FilterCategory, label: 'Tutorials', icon: BookOpen, count: baseCounts.tutorial },
            { id: 'market' as FilterCategory, label: 'Market News', icon: TrendingUp, count: baseCounts.market },
        ].filter(opt => opt.id === 'all' || (opt.count && opt.count > 0));
    }, [news]);

    // Filtered news
    const filteredNews = useMemo(() => {
        let filtered = news;

        // Category filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(item => item.category === activeFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.summary?.toLowerCase().includes(query) ||
                item.source.toLowerCase().includes(query) ||
                item.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [news, activeFilter, searchQuery]);

    // Breaking news (top featured)
    const breakingNews = useMemo(() => {
        return news.filter(item => item.isBreaking || item.priority === 'breaking').slice(0, 1);
    }, [news]);

    // Hot news (high priority, not breaking)
    const hotNews = useMemo(() => {
        return news.filter(item =>
            item.priority === 'high' && !item.isBreaking
        ).slice(0, 3);
    }, [news]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Status Bar - Enhanced */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 rounded-2xl bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/10 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm">
                    {/* Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${fromCache ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                        {fromCache ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                        <span className="font-medium">{fromCache ? 'Cached' : 'Live'}</span>
                    </div>

                    {/* Last Updated */}
                    {lastUpdated && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>Updated {formatRelativeTime(lastUpdated)}</span>
                        </div>
                    )}

                    {/* Stats */}
                    {stats && (
                        <div className="hidden md:flex items-center gap-3 text-gray-400">
                            <span className="px-2 py-1 rounded bg-white/5">{stats.totalArticles} articles</span>
                            <span className="px-2 py-1 rounded bg-white/5">{stats.sources} sources</span>
                            {stats.newArticles > 0 && (
                                <span className="px-2 py-1 rounded bg-accent-cyan/10 text-accent-cyan font-medium">
                                    {stats.newArticles} new
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Refresh Button */}
                <button
                    onClick={() => fetchNews(true)}
                    disabled={isRefreshing}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-gradient-to-r from-accent-cyan/20 to-accent-purple/10 
                        text-accent-cyan border border-accent-cyan/30
                        hover:from-accent-cyan/30 hover:to-accent-purple/20 
                        hover:border-accent-cyan/50 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-lg shadow-accent-cyan/5
                    `}
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-semibold">
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search news, models, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filters */}
            <div className="mb-10">
                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="md:hidden flex items-center justify-between w-full p-4 rounded-xl bg-white/5 border border-white/10 mb-4"
                >
                    <span className="flex items-center gap-2 text-white">
                        <Filter className="w-4 h-4" />
                        Filter by Category
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* Filter Buttons */}
                <div className={`
                    flex flex-wrap gap-2 md:gap-3 justify-center
                    ${showFilters ? 'block' : 'hidden md:flex'}
                `}>
                    {filterOptions.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = activeFilter === filter.id;

                        return (
                            <motion.button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                    relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                                    transition-all duration-200 overflow-hidden
                                    ${isActive
                                        ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-lg shadow-accent-cyan/20'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{filter.label}</span>
                                {filter.count !== undefined && filter.count > 0 && (
                                    <span className={`
                                        text-[10px] px-1.5 py-0.5 rounded-full
                                        ${isActive ? 'bg-white/20' : 'bg-white/10'}
                                    `}>
                                        {filter.count}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 mb-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
                >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                    <button
                        onClick={() => fetchNews(true)}
                        className="ml-auto text-sm underline hover:no-underline"
                    >
                        Retry
                    </button>
                </motion.div>
            )}

            {/* Loading State */}
            {loading ? (
                <LoadingState />
            ) : (
                <>
                    {/* Breaking News Section */}
                    {breakingNews.length > 0 && activeFilter === 'all' && !searchQuery && (
                        <section className="mb-12">
                            <div className="grid grid-cols-1 gap-6">
                                {breakingNews.map((item) => (
                                    <NewsCard key={item.id} item={item} variant="featured" />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Hot News Section */}
                    {hotNews.length > 0 && activeFilter === 'all' && !searchQuery && (
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20">
                                    <Zap className="w-5 h-5 text-orange-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Hot Right Now</h2>
                                <span className="text-xs px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 font-medium">
                                    {hotNews.length} trending
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {hotNews.map((item) => (
                                    <NewsCard key={item.id} item={item} variant="compact" />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Main News Grid */}
                    <section>
                        {(activeFilter !== 'all' || searchQuery) && (
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {searchQuery
                                        ? `Search Results (${filteredNews.length})`
                                        : filterOptions.find(f => f.id === activeFilter)?.label
                                    }
                                </h2>
                                {(activeFilter !== 'all' || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setActiveFilter('all');
                                            setSearchQuery('');
                                        }}
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}

                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredNews
                                    .filter(item =>
                                        activeFilter !== 'all' ||
                                        searchQuery ||
                                        (!item.isBreaking && item.priority !== 'breaking')
                                    )
                                    .map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <NewsCard item={item} />
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </motion.div>

                        {/* Empty State */}
                        {!loading && filteredNews.length === 0 && (
                            <EmptyState
                                searchQuery={searchQuery}
                                activeFilter={activeFilter}
                                onClear={() => {
                                    setSearchQuery('');
                                    setActiveFilter('all');
                                }}
                            />
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

/**
 * Loading State Component
 */
function LoadingState() {
    return (
        <div className="space-y-8">
            {/* Featured skeleton */}
            <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="h-72 rounded-2xl bg-white/5 animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Empty State Component
 */
function EmptyState({
    searchQuery,
    activeFilter,
    onClear
}: {
    searchQuery: string;
    activeFilter: FilterCategory;
    onClear: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
        >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Activity className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
                No news found
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery
                    ? `No results for "${searchQuery}". Try a different search term.`
                    : `No articles in this category yet. Check back later!`
                }
            </p>
            <button
                onClick={onClear}
                className="px-6 py-2 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/20 transition-all"
            >
                View All News
            </button>
        </motion.div>
    );
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}
