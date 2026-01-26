'use client';

import { motion } from 'framer-motion';
import { NewsItem, CATEGORY_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import {
    ExternalLink, Zap, Rocket, TrendingUp, Calendar,
    Microscope, BookOpen, Terminal, Video, Image,
    Bot, Plug, Newspaper, Sparkles, Clock, Building2,
    Github, Star, ArrowUpRight
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
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

// Source icons
const sourceIcons: Record<string, React.ElementType> = {
    'GitHub': Github,
    'Hacker News': ArrowUpRight,
    'Product Hunt': Star,
};

interface NewsCardProps {
    item: NewsItem;
    variant?: 'default' | 'featured' | 'compact';
}

export function NewsCard({ item, variant = 'default' }: NewsCardProps) {
    const category = item.category || 'other';
    const config = CATEGORY_CONFIG[category];
    const Icon = categoryIcons[category] || Newspaper;
    const priorityConfig = PRIORITY_CONFIG[item.priority || 'normal'];

    const isBreaking = item.isBreaking || item.priority === 'breaking';
    const isHot = item.priority === 'high';

    if (variant === 'featured') {
        return <FeaturedCard item={item} config={config} Icon={Icon} priorityConfig={priorityConfig} />;
    }

    if (variant === 'compact') {
        return <CompactCard item={item} config={config} Icon={Icon} />;
    }

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={`
                relative overflow-hidden rounded-2xl h-full
                bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                border border-white/10 hover:border-white/25
                backdrop-blur-xl
                group transition-all duration-300
                ${isBreaking ? 'ring-2 ring-red-500/60 border-red-500/40 shadow-lg shadow-red-500/10' : ''}
                ${isHot && !isBreaking ? 'ring-1 ring-orange-500/40 shadow-lg shadow-orange-500/5' : ''}
            `}
        >
            {/* Breaking/Hot Badge - More prominent */}
            {(isBreaking || isHot) && (
                <div className={`
                    absolute top-0 right-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider
                    ${isBreaking ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'}
                    rounded-bl-xl
                `}>
                    {isBreaking && (
                        <span className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            BREAKING
                        </span>
                    )}
                    {isHot && !isBreaking && (
                        <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" />
                            HOT
                        </span>
                    )}
                </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-5 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <time dateTime={item.pubDate}>
                            {formatRelativeTime(item.pubDate)}
                        </time>
                    </div>
                    <SourceBadge source={item.source} tier={item.sourceTier} />
                </div>

                {/* Title */}
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group/title mb-3"
                >
                    <h3 className="text-lg font-semibold leading-snug text-white group-hover/title:text-accent-cyan transition-colors line-clamp-2">
                        {item.title}
                    </h3>
                </a>

                {/* Summary */}
                <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3 flex-grow">
                    {item.summary || item.contentSnippet?.slice(0, 150) + '...'}
                </p>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.tags.slice(0, 4).map(tag => (
                            <span
                                key={tag}
                                className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-default"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Related Models/Companies */}
                {((item.relatedModels && item.relatedModels.length > 0) || (item.relatedCompanies && item.relatedCompanies.length > 0)) && (
                    <div className="flex flex-wrap gap-2 mb-4 text-[10px]">
                        {item.relatedModels?.slice(0, 2).map(model => (
                            <span key={model} className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Zap className="w-2.5 h-2.5" />
                                {model}
                            </span>
                        ))}
                        {item.relatedCompanies?.slice(0, 2).map(company => (
                            <span key={company} className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Building2 className="w-2.5 h-2.5" />
                                {company}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${config.bgColor} ${config.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{config.label.replace(/^[^\s]+\s/, '')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Relevance indicator */}
                        {item.relevanceScore && item.relevanceScore >= 8 && (
                            <div
                                title={`Relevance: ${item.relevanceScore}/10`}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-medium"
                            >
                                <Zap className="w-3 h-3 fill-current" />
                                {item.relevanceScore}/10
                            </div>
                        )}

                        {/* External link */}
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            title="Read full article"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

/**
 * Featured Card - Larger, more prominent display for breaking news
 */
function FeaturedCard({
    item,
    config,
    Icon,
    priorityConfig
}: {
    item: NewsItem;
    config: typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG];
    Icon: React.ElementType;
    priorityConfig: typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG];
}) {
    return (
        <motion.article
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-800/60 border border-red-500/30 backdrop-blur-xl col-span-full shadow-2xl shadow-red-500/10"
        >
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-red-500/15 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent-purple/10 via-transparent to-transparent" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            </div>

            {/* Breaking badge - Prominent */}
            <div className="absolute top-4 left-4 flex items-center gap-3 z-20">
                <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-red-500/30">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    Breaking News
                </span>
            </div>

            <div className="relative z-10 p-6 md:p-8 pt-16 md:pt-20">
                <div className="flex flex-col gap-6 max-w-4xl">
                    {/* Source & Time */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <SourceBadge source={item.source} tier={item.sourceTier} large />
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatRelativeTime(item.pubDate)}
                        </span>
                        {item.relevanceScore && (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium">
                                <Zap className="w-3 h-3 fill-current" />
                                {item.relevanceScore}/10 relevance
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="group">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white group-hover:text-accent-cyan transition-colors leading-tight">
                            {item.title}
                        </h2>
                    </a>

                    {/* Summary */}
                    <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-3xl">
                        {item.summary || item.contentSnippet?.slice(0, 300) + '...'}
                    </p>

                    {/* Technical Impact */}
                    {item.technicalImpact && (
                        <div className="bg-gradient-to-r from-white/5 to-transparent rounded-xl p-4 border-l-2 border-accent-cyan">
                            <h4 className="text-xs uppercase tracking-wider text-accent-cyan mb-2 font-semibold">Developer Impact</h4>
                            <p className="text-sm text-gray-300">{item.technicalImpact}</p>
                        </div>
                    )}

                    {/* Tags & Related */}
                    <div className="flex flex-wrap gap-2">
                        {item.tags?.map(tag => (
                            <span key={tag} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 transition-colors">
                                #{tag}
                            </span>
                        ))}
                        {item.relatedModels?.slice(0, 3).map(model => (
                            <span key={model} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Zap className="w-3 h-3" />
                                {model}
                            </span>
                        ))}
                    </div>

                    {/* CTA */}
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-semibold hover:opacity-90 transition-all w-fit shadow-lg shadow-accent-cyan/20 hover:shadow-accent-cyan/30"
                    >
                        Read Full Story
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </motion.article>
    );
}

/**
 * Compact Card - For "Hot Right Now" section
 */
function CompactCard({
    item,
    config,
    Icon
}: {
    item: NewsItem;
    config: typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG];
    Icon: React.ElementType;
}) {
    const SourceIcon = sourceIcons[item.source];
    
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:from-white/[0.08] hover:to-white/[0.04] border border-white/5 hover:border-white/15 transition-all group cursor-pointer"
        >
            <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${config.bgColor} border ${config.bgColor.replace('/20', '/30')}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
            </div>

            <div className="flex-1 min-w-0">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-accent-cyan transition-colors leading-snug">
                        {item.title}
                    </h4>
                </a>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        {SourceIcon && <SourceIcon className="w-3 h-3" />}
                        {item.source}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span>{formatRelativeTime(item.pubDate)}</span>
                </div>
            </div>
            
            <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 self-center p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
                <ExternalLink className="w-4 h-4" />
            </a>
        </motion.article>
    );
}

/**
 * Source Badge Component - Enhanced with tier indicators
 */
function SourceBadge({ source, tier, large = false }: { source: string; tier?: string; large?: boolean }) {
    const tierConfig: Record<string, { color: string; label: string }> = {
        official: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: '✓' },
        trusted: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/25', label: '' },
        community: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', label: '' },
        aggregator: { color: 'bg-slate-500/15 text-slate-400 border-slate-500/25', label: '' },
    };

    const config = tierConfig[tier || 'aggregator'];
    const SourceIcon = sourceIcons[source];

    return (
        <span className={`
            ${large ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-[10px]'}
            rounded-lg border font-semibold uppercase tracking-wider truncate max-w-[160px]
            flex items-center gap-1.5
            ${config.color}
        `}>
            {SourceIcon && <SourceIcon className={large ? 'w-4 h-4' : 'w-3 h-3'} />}
            {source}
            {tier === 'official' && <span className="text-emerald-400">✓</span>}
        </span>
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default NewsCard;
