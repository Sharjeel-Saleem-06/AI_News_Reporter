/**
 * Advanced API Key Pool Manager
 * - Round-robin with health tracking
 * - Rate limit detection & cooldown
 * - Usage statistics per key
 * - Automatic failover
 */

export interface APIKeyStatus {
    key: string;
    index: number;
    isHealthy: boolean;
    requestCount: number;
    lastUsed: number;
    cooldownUntil: number;
    errorCount: number;
    successRate: number;
}

interface PoolStats {
    totalRequests: number;
    totalErrors: number;
    keysInCooldown: number;
    healthyKeys: number;
}

class APIKeyPool {
    private keys: string[] = [];
    private keyStatus: Map<string, APIKeyStatus> = new Map();
    private currentIndex: number = 0;
    private readonly COOLDOWN_DURATION = 60000; // 1 minute cooldown on rate limit
    private readonly MAX_ERRORS_BEFORE_COOLDOWN = 3;
    private readonly COOLDOWN_MULTIPLIER = 1.5; // Exponential backoff

    constructor() {
        this.initializeKeys();
    }

    private initializeKeys() {
        const envKeys = [
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3,
            process.env.GROQ_API_KEY_4,
            process.env.GROQ_API_KEY_5,
            process.env.GROQ_API_KEY_6,
            process.env.GROQ_API_KEY_7,
            process.env.GROQ_API_KEY_8,
            process.env.GROQ_API_KEY_9,
            process.env.GROQ_API_KEY_10,
        ].filter(Boolean) as string[];

        this.keys = envKeys;

        // Initialize status for each key
        envKeys.forEach((key, index) => {
            this.keyStatus.set(key, {
                key,
                index,
                isHealthy: true,
                requestCount: 0,
                lastUsed: 0,
                cooldownUntil: 0,
                errorCount: 0,
                successRate: 100,
            });
        });

        // Start with a random index to distribute load across restarts
        this.currentIndex = Math.floor(Math.random() * this.keys.length);

        console.log(`[APIPool] Initialized with ${this.keys.length} API keys`);
    }

    /**
     * Get the next available healthy API key using round-robin
     */
    getNextKey(): string | null {
        if (this.keys.length === 0) {
            console.warn('[APIPool] No API keys configured');
            return null;
        }

        const now = Date.now();
        let attempts = 0;
        const maxAttempts = this.keys.length * 2;

        while (attempts < maxAttempts) {
            const key = this.keys[this.currentIndex];
            const status = this.keyStatus.get(key);

            // Move to next key for next request
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            attempts++;

            if (!status) continue;

            // Check if key is in cooldown
            if (status.cooldownUntil > now) {
                continue;
            }

            // Check if key is healthy
            if (!status.isHealthy && status.errorCount >= this.MAX_ERRORS_BEFORE_COOLDOWN) {
                // Check if cooldown has expired and reset
                if (status.cooldownUntil <= now) {
                    status.isHealthy = true;
                    status.errorCount = 0;
                }
                continue;
            }

            // Update usage stats
            status.requestCount++;
            status.lastUsed = now;

            return key;
        }

        // All keys in cooldown - return the one with shortest remaining cooldown
        console.warn('[APIPool] All keys in cooldown, using least-cooldown key');
        return this.getLeastCooldownKey();
    }

    private getLeastCooldownKey(): string | null {
        let minCooldown = Infinity;
        let bestKey: string | null = null;

        for (const [key, status] of this.keyStatus) {
            if (status.cooldownUntil < minCooldown) {
                minCooldown = status.cooldownUntil;
                bestKey = key;
            }
        }

        return bestKey;
    }

    /**
     * Report successful API call
     */
    reportSuccess(key: string) {
        const status = this.keyStatus.get(key);
        if (status) {
            status.errorCount = Math.max(0, status.errorCount - 1);
            status.isHealthy = true;
            const total = status.requestCount || 1;
            const errors = status.errorCount;
            status.successRate = ((total - errors) / total) * 100;
        }
    }

    /**
     * Report API error - handles rate limits and other errors
     */
    reportError(key: string, errorCode?: number) {
        const status = this.keyStatus.get(key);
        if (!status) return;

        status.errorCount++;

        // Rate limit detected - put key in cooldown
        if (errorCode === 429) {
            const cooldownDuration = this.COOLDOWN_DURATION *
                Math.pow(this.COOLDOWN_MULTIPLIER, Math.min(status.errorCount, 5));
            status.cooldownUntil = Date.now() + cooldownDuration;
            status.isHealthy = false;
            console.warn(`[APIPool] Key ${status.index} rate limited, cooldown for ${cooldownDuration / 1000}s`);
        } else if (status.errorCount >= this.MAX_ERRORS_BEFORE_COOLDOWN) {
            // Too many errors - temporary cooldown
            status.cooldownUntil = Date.now() + this.COOLDOWN_DURATION;
            status.isHealthy = false;
            console.warn(`[APIPool] Key ${status.index} has ${status.errorCount} errors, entering cooldown`);
        }

        // Update success rate
        const total = status.requestCount || 1;
        status.successRate = ((total - status.errorCount) / total) * 100;
    }

    /**
     * Get pool statistics for monitoring
     */
    getStats(): PoolStats {
        const now = Date.now();
        let totalRequests = 0;
        let totalErrors = 0;
        let keysInCooldown = 0;
        let healthyKeys = 0;

        for (const status of this.keyStatus.values()) {
            totalRequests += status.requestCount;
            totalErrors += status.errorCount;
            if (status.cooldownUntil > now) keysInCooldown++;
            if (status.isHealthy) healthyKeys++;
        }

        return {
            totalRequests,
            totalErrors,
            keysInCooldown,
            healthyKeys,
        };
    }

    /**
     * Get detailed status of all keys
     */
    getDetailedStatus(): APIKeyStatus[] {
        return Array.from(this.keyStatus.values()).map(status => ({
            ...status,
            key: `***${status.key.slice(-4)}`, // Mask key for security
        }));
    }

    /**
     * Check if pool has any available keys
     */
    hasAvailableKeys(): boolean {
        const now = Date.now();
        for (const status of this.keyStatus.values()) {
            if (status.isHealthy && status.cooldownUntil <= now) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get total number of configured keys
     */
    getTotalKeys(): number {
        return this.keys.length;
    }

    /**
     * Force reset a specific key (for manual recovery)
     */
    resetKey(index: number) {
        const key = this.keys[index];
        if (key) {
            const status = this.keyStatus.get(key);
            if (status) {
                status.isHealthy = true;
                status.errorCount = 0;
                status.cooldownUntil = 0;
                console.log(`[APIPool] Key ${index} manually reset`);
            }
        }
    }

    /**
     * Reset all keys (for emergency recovery)
     */
    resetAll() {
        for (const status of this.keyStatus.values()) {
            status.isHealthy = true;
            status.errorCount = 0;
            status.cooldownUntil = 0;
        }
        console.log('[APIPool] All keys reset');
    }
}

// Singleton instance
export const apiKeyPool = new APIKeyPool();

