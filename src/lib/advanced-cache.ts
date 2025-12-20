/**
 * Advanced Cache System
 * - TTL-based expiration
 * - Separate caches for RSS data and AI analysis
 * - Memory + Disk persistence
 * - Automatic cleanup of old entries
 */

import { promises as fs } from 'fs';
import path from 'path';
import { NewsItem } from './types';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    source?: string;
}

interface CacheStats {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    oldestEntry: string | null;
    newestEntry: string | null;
    cacheHits: number;
    cacheMisses: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ANALYSIS_CACHE_FILE = path.join(DATA_DIR, 'analysis-cache.json');
const RSS_CACHE_FILE = path.join(DATA_DIR, 'rss-cache.json');
const NEWS_CACHE_FILE = path.join(DATA_DIR, 'news-cache.json');

// Cache TTL configurations
const CACHE_TTL = {
    analysis: 7 * 24 * 60 * 60 * 1000,    // 7 days for AI analysis
    rss: 5 * 60 * 1000,                     // 5 minutes for RSS data
    news: 15 * 60 * 1000,                   // 15 minutes for combined news
};

class AdvancedCache<T> {
    private memoryCache: Map<string, CacheEntry<T>> = new Map();
    private cacheFile: string;
    private ttl: number;
    private loaded: boolean = false;
    private stats = { hits: 0, misses: 0 };

    constructor(cacheFile: string, ttl: number) {
        this.cacheFile = cacheFile;
        this.ttl = ttl;
    }

    /**
     * Load cache from disk
     */
    async load(): Promise<void> {
        if (this.loaded) return;

        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const data = await fs.readFile(this.cacheFile, 'utf-8');
            const entries: Record<string, CacheEntry<T>> = JSON.parse(data);

            const now = Date.now();
            let validCount = 0;
            let expiredCount = 0;

            for (const [key, entry] of Object.entries(entries)) {
                if (entry.expiresAt > now) {
                    this.memoryCache.set(key, entry);
                    validCount++;
                } else {
                    expiredCount++;
                }
            }

            console.log(`[Cache] Loaded ${validCount} valid entries, skipped ${expiredCount} expired`);
        } catch {
            console.log('[Cache] No existing cache or invalid format');
        }

        this.loaded = true;
    }

    /**
     * Save cache to disk
     */
    async save(): Promise<void> {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const entries: Record<string, CacheEntry<T>> = {};

            for (const [key, entry] of this.memoryCache) {
                entries[key] = entry;
            }

            await fs.writeFile(this.cacheFile, JSON.stringify(entries, null, 2));
        } catch (error) {
            console.error('[Cache] Failed to save:', error);
        }
    }

    /**
     * Get item from cache
     */
    async get(key: string): Promise<T | null> {
        await this.load();

        const entry = this.memoryCache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (entry.expiresAt < Date.now()) {
            this.memoryCache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.data;
    }

    /**
     * Set item in cache
     */
    async set(key: string, data: T, customTTL?: number, source?: string): Promise<void> {
        await this.load();

        const now = Date.now();
        const entry: CacheEntry<T> = {
            data,
            timestamp: now,
            expiresAt: now + (customTTL || this.ttl),
            source,
        };

        this.memoryCache.set(key, entry);
        await this.save();
    }

    /**
     * Check if key exists and is valid
     */
    async has(key: string): Promise<boolean> {
        await this.load();

        const entry = this.memoryCache.get(key);
        if (!entry) return false;

        if (entry.expiresAt < Date.now()) {
            this.memoryCache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete specific key
     */
    async delete(key: string): Promise<void> {
        await this.load();
        this.memoryCache.delete(key);
        await this.save();
    }

    /**
     * Clear all entries
     */
    async clear(): Promise<void> {
        this.memoryCache.clear();
        this.stats = { hits: 0, misses: 0 };
        await this.save();
    }

    /**
     * Clean up expired entries
     */
    async cleanup(): Promise<number> {
        await this.load();

        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.memoryCache) {
            if (entry.expiresAt < now) {
                this.memoryCache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            await this.save();
            console.log(`[Cache] Cleaned up ${removed} expired entries`);
        }

        return removed;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        let oldest = Infinity;
        let newest = 0;
        let oldestKey: string | null = null;
        let newestKey: string | null = null;

        for (const [key, entry] of this.memoryCache) {
            if (entry.expiresAt > now) {
                validEntries++;
                if (entry.timestamp < oldest) {
                    oldest = entry.timestamp;
                    oldestKey = key;
                }
                if (entry.timestamp > newest) {
                    newest = entry.timestamp;
                    newestKey = key;
                }
            } else {
                expiredEntries++;
            }
        }

        return {
            totalEntries: this.memoryCache.size,
            validEntries,
            expiredEntries,
            oldestEntry: oldestKey ? new Date(oldest).toISOString() : null,
            newestEntry: newestKey ? new Date(newest).toISOString() : null,
            cacheHits: this.stats.hits,
            cacheMisses: this.stats.misses,
        };
    }

    /**
     * Get all valid entries
     */
    async getAll(): Promise<Map<string, T>> {
        await this.load();

        const now = Date.now();
        const valid = new Map<string, T>();

        for (const [key, entry] of this.memoryCache) {
            if (entry.expiresAt > now) {
                valid.set(key, entry.data);
            }
        }

        return valid;
    }

    /**
     * Bulk set multiple items
     */
    async setBulk(entries: Array<{ key: string; data: T; source?: string }>): Promise<void> {
        await this.load();

        const now = Date.now();
        for (const { key, data, source } of entries) {
            this.memoryCache.set(key, {
                data,
                timestamp: now,
                expiresAt: now + this.ttl,
                source,
            });
        }

        await this.save();
    }
}

// Singleton cache instances
export const analysisCache = new AdvancedCache<Partial<NewsItem>>(ANALYSIS_CACHE_FILE, CACHE_TTL.analysis);
export const rssCache = new AdvancedCache<NewsItem[]>(RSS_CACHE_FILE, CACHE_TTL.rss);
export const newsCache = new AdvancedCache<NewsItem[]>(NEWS_CACHE_FILE, CACHE_TTL.news);

/**
 * Helper to get analyzed news from cache
 */
export async function getCachedNews(): Promise<NewsItem[] | null> {
    return newsCache.get('latest');
}

/**
 * Helper to save analyzed news to cache
 */
export async function setCachedNews(news: NewsItem[]): Promise<void> {
    await newsCache.set('latest', news);
}

/**
 * Run cleanup on all caches
 */
export async function cleanupAllCaches(): Promise<void> {
    await Promise.all([
        analysisCache.cleanup(),
        rssCache.cleanup(),
        newsCache.cleanup(),
    ]);
}

/**
 * Get combined cache stats
 */
export async function getAllCacheStats() {
    return {
        analysis: analysisCache.getStats(),
        rss: rssCache.getStats(),
        news: newsCache.getStats(),
    };
}

