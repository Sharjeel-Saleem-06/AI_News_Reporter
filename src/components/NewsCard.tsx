'use client';

import { motion } from 'framer-motion';
import { NewsItem, CATEGORY_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import {
    ExternalLink, Zap, Rocket, TrendingUp, Calendar,
    Microscope, BookOpen, Terminal, Video, Image,
    Bot, Plug, Newspaper, Sparkles, Clock, Building2
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
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-br from-white/[0.07] to-white/[0.02]
                border border-white/10 hover:border-white/20
                backdrop-blur-xl shadow-2xl
                group transition-all duration-300
                ${isBreaking ? 'ring-2 ring-red-500/50 border-red-500/30' : ''}
                ${isHot ? 'ring-1 ring-orange-500/30' : ''}
            `}
        >
            {/* Breaking/Hot Badge */}
            {(isBreaking || isHot) && (
                <div className={`
                    absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider
                    ${isBreaking ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}
                    rounded-bl-lg
                `}>
                    {isBreaking && (
                        <span className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            BREAKING
                        </span>
                    )}
                    {isHot && !isBreaking && 'HOT'}
                </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-5 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
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
                    className="block group/title"
                >
                    <h3 className="text-lg font-semibold leading-snug mb-3 text-white group-hover/title:text-accent-cyan transition-colors line-clamp-2">
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
                        {item.tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 transition-colors cursor-default"
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
                            <span key={model} className="flex items-center gap-1 text-purple-400">
                                <Zap className="w-3 h-3" />
                                {model}
                            </span>
                        ))}
                        {item.relatedCompanies?.slice(0, 2).map(company => (
                            <span key={company} className="flex items-center gap-1 text-blue-400">
                                <Building2 className="w-3 h-3" />
                                {company}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{config.label.replace(/^[^\s]+\s/, '')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Relevance indicator */}
                        {item.relevanceScore && item.relevanceScore >= 8 && (
                            <motion.div
                                title={`Relevance: ${item.relevanceScore}/10`}
                                className="p-1.5 rounded-full bg-amber-500/20 text-amber-400"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <Zap className="w-3.5 h-3.5 fill-current" />
                            </motion.div>
                        )}

                        {/* External link */}
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
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
 * Featured Card - Larger, more prominent display
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-purple/20 via-accent-cyan/10 to-transparent border border-accent-cyan/20 backdrop-blur-xl col-span-full lg:col-span-2"
        >
            {/* Background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-purple/10 via-transparent to-accent-cyan/10" />

            {/* Breaking badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-bold uppercase tracking-wider">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    Breaking News
                </span>
            </div>

            <div className="relative z-10 p-8 pt-16">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        {/* Source & Time */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                            <SourceBadge source={item.source} tier={item.sourceTier} large />
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatRelativeTime(item.pubDate)}
                            </span>
                        </div>

                        {/* Title */}
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 hover:text-accent-cyan transition-colors leading-tight">
                                {item.title}
                            </h2>
                        </a>

                        {/* Summary */}
                        <p className="text-lg text-gray-300 leading-relaxed mb-6">
                            {item.summary || item.contentSnippet?.slice(0, 250) + '...'}
                        </p>

                        {/* Technical Impact */}
                        {item.technicalImpact && (
                            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                                <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Technical Impact</h4>
                                <p className="text-sm text-gray-300">{item.technicalImpact}</p>
                            </div>
                        )}

                        {/* Tags & Related */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {item.tags?.map(tag => (
                                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white border border-white/10">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* CTA */}
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Read Full Story
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

/**
 * Compact Card - For sidebar/list views
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
    return (
        <motion.article
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
        >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
            </div>

            <div className="flex-1 min-w-0">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-accent-cyan transition-colors">
                        {item.title}
                    </h4>
                </a>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(item.pubDate)}</span>
                </div>
            </div>
        </motion.article>
    );
}

/**
 * Source Badge Component
 */
function SourceBadge({ source, tier, large = false }: { source: string; tier?: string; large?: boolean }) {
    const tierColors: Record<string, string> = {
        official: 'bg-green-500/20 text-green-400 border-green-500/30',
        trusted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        community: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        aggregator: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    const color = tierColors[tier || 'aggregator'];

    return (
        <span className={`
            ${large ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-[10px]'}
            rounded-full border font-medium uppercase tracking-wider truncate max-w-[140px]
            ${color}
        `}>
            {source}
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
