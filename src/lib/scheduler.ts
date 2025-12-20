/**
 * Smart Scheduler System
 * - Controls when to fetch new data
 * - Prevents excessive API calls
 * - Manages background refresh
 */

import { promises as fs } from 'fs';
import path from 'path';

interface SchedulerState {
    lastRSSFetch: number;
    lastAnalysis: number;
    fetchCount: number;
    lastFetchDate: string;
    isProcessing: boolean;
    processStartTime: number | null;
}

interface SchedulerConfig {
    minFetchInterval: number;      // Minimum time between RSS fetches (ms)
    minAnalysisInterval: number;   // Minimum time between full analysis (ms)
    staleDataThreshold: number;    // When to consider data stale (ms)
    maxProcessingTime: number;     // Max time for processing before timeout (ms)
}

const DEFAULT_CONFIG: SchedulerConfig = {
    minFetchInterval: 5 * 60 * 1000,         // 5 minutes
    minAnalysisInterval: 15 * 60 * 1000,     // 15 minutes
    staleDataThreshold: 30 * 60 * 1000,      // 30 minutes
    maxProcessingTime: 2 * 60 * 1000,        // 2 minutes
};

const STATE_FILE = path.join(process.cwd(), 'data', 'scheduler-state.json');

class Scheduler {
    private state: SchedulerState = {
        lastRSSFetch: 0,
        lastAnalysis: 0,
        fetchCount: 0,
        lastFetchDate: '',
        isProcessing: false,
        processStartTime: null,
    };
    private config: SchedulerConfig;
    private initialized: boolean = false;

    constructor(config: Partial<SchedulerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize scheduler - load state from disk
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            const dir = path.dirname(STATE_FILE);
            await fs.mkdir(dir, { recursive: true });

            const data = await fs.readFile(STATE_FILE, 'utf-8');
            const savedState = JSON.parse(data);
            this.state = { ...this.state, ...savedState };

            // Reset processing flag if stuck (process crashed)
            if (this.state.isProcessing && this.state.processStartTime) {
                const elapsed = Date.now() - this.state.processStartTime;
                if (elapsed > this.config.maxProcessingTime) {
                    console.log('[Scheduler] Resetting stuck processing state');
                    this.state.isProcessing = false;
                    this.state.processStartTime = null;
                }
            }
        } catch {
            // File doesn't exist or is invalid - use defaults
            console.log('[Scheduler] Using default state');
        }

        this.initialized = true;
    }

    /**
     * Save state to disk
     */
    private async saveState(): Promise<void> {
        try {
            const dir = path.dirname(STATE_FILE);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(STATE_FILE, JSON.stringify(this.state, null, 2));
        } catch (error) {
            console.error('[Scheduler] Failed to save state:', error);
        }
    }

    /**
     * Check if RSS fetch is allowed
     */
    canFetchRSS(): boolean {
        const now = Date.now();
        const elapsed = now - this.state.lastRSSFetch;
        return elapsed >= this.config.minFetchInterval;
    }

    /**
     * Check if full analysis is allowed
     */
    canRunAnalysis(): boolean {
        const now = Date.now();
        const elapsed = now - this.state.lastAnalysis;
        return elapsed >= this.config.minAnalysisInterval;
    }

    /**
     * Check if data is stale and needs refresh
     */
    isDataStale(): boolean {
        const now = Date.now();
        const elapsed = now - this.state.lastAnalysis;
        return elapsed >= this.config.staleDataThreshold;
    }

    /**
     * Check if currently processing
     */
    isCurrentlyProcessing(): boolean {
        if (!this.state.isProcessing) return false;

        // Check for stuck state
        if (this.state.processStartTime) {
            const elapsed = Date.now() - this.state.processStartTime;
            if (elapsed > this.config.maxProcessingTime) {
                console.log('[Scheduler] Processing timed out, resetting');
                this.state.isProcessing = false;
                this.state.processStartTime = null;
                return false;
            }
        }

        return true;
    }

    /**
     * Mark RSS fetch started
     */
    async startRSSFetch(): Promise<void> {
        this.state.isProcessing = true;
        this.state.processStartTime = Date.now();
        await this.saveState();
    }

    /**
     * Mark RSS fetch completed
     */
    async completeRSSFetch(): Promise<void> {
        this.state.lastRSSFetch = Date.now();
        this.state.fetchCount++;
        this.state.lastFetchDate = new Date().toISOString();
        await this.saveState();
    }

    /**
     * Mark analysis started
     */
    async startAnalysis(): Promise<void> {
        this.state.isProcessing = true;
        this.state.processStartTime = Date.now();
        await this.saveState();
    }

    /**
     * Mark analysis completed
     */
    async completeAnalysis(): Promise<void> {
        this.state.lastAnalysis = Date.now();
        this.state.isProcessing = false;
        this.state.processStartTime = null;
        await this.saveState();
    }

    /**
     * Mark processing failed
     */
    async failProcessing(): Promise<void> {
        this.state.isProcessing = false;
        this.state.processStartTime = null;
        await this.saveState();
    }

    /**
     * Get time until next allowed fetch
     */
    getTimeUntilNextFetch(): number {
        const elapsed = Date.now() - this.state.lastRSSFetch;
        return Math.max(0, this.config.minFetchInterval - elapsed);
    }

    /**
     * Get time until next allowed analysis
     */
    getTimeUntilNextAnalysis(): number {
        const elapsed = Date.now() - this.state.lastAnalysis;
        return Math.max(0, this.config.minAnalysisInterval - elapsed);
    }

    /**
     * Get scheduler status for API response
     */
    getStatus() {
        return {
            lastRSSFetch: this.state.lastRSSFetch
                ? new Date(this.state.lastRSSFetch).toISOString()
                : null,
            lastAnalysis: this.state.lastAnalysis
                ? new Date(this.state.lastAnalysis).toISOString()
                : null,
            fetchCount: this.state.fetchCount,
            canFetch: this.canFetchRSS(),
            canAnalyze: this.canRunAnalysis(),
            isStale: this.isDataStale(),
            isProcessing: this.isCurrentlyProcessing(),
            nextFetchIn: Math.round(this.getTimeUntilNextFetch() / 1000),
            nextAnalysisIn: Math.round(this.getTimeUntilNextAnalysis() / 1000),
        };
    }

    /**
     * Force reset scheduler state
     */
    async reset(): Promise<void> {
        this.state = {
            lastRSSFetch: 0,
            lastAnalysis: 0,
            fetchCount: 0,
            lastFetchDate: '',
            isProcessing: false,
            processStartTime: null,
        };
        await this.saveState();
        console.log('[Scheduler] State reset');
    }

    /**
     * Get decision on what action to take
     */
    async getNextAction(): Promise<'fetch_and_analyze' | 'fetch_only' | 'serve_cache' | 'wait'> {
        await this.init();

        if (this.isCurrentlyProcessing()) {
            return 'wait';
        }

        // If data is stale and we can analyze, do full refresh
        if (this.isDataStale() && this.canRunAnalysis()) {
            return 'fetch_and_analyze';
        }

        // If we can fetch but not analyze, just fetch RSS
        if (this.canFetchRSS() && !this.canRunAnalysis()) {
            return 'fetch_only';
        }

        // If we can both fetch and analyze
        if (this.canFetchRSS() && this.canRunAnalysis()) {
            return 'fetch_and_analyze';
        }

        // Otherwise serve from cache
        return 'serve_cache';
    }
}

// Singleton instance
export const scheduler = new Scheduler();

