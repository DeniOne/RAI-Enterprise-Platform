import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

/**
 * Redis Cache Service
 * 
 * Provides caching layer for frequently accessed data.
 * Supports automatic JSON serialization/deserialization.
 */

class CacheService {
    private client: RedisClientType | null = null;
    private isConnected: boolean = false;
    private readonly defaultTTL: number = 300; // 5 minutes

    /**
     * Initialize Redis connection
     */
    async connect(): Promise<void> {
        if (this.isConnected) return;

        // Skip Redis if explicitly disabled
        const redisEnabled = process.env.REDIS_ENABLED !== 'false';
        if (!redisEnabled) {
            logger.warn('Redis disabled via REDIS_ENABLED=false');
            return;
        }

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        try {
            this.client = createClient({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 3) {
                            logger.warn('Redis max retries reached, giving up');
                            return false; // Stop trying to reconnect
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                logger.error('Redis connection error', { error: err.message });
            });

            this.client.on('connect', () => {
                logger.info('Redis connected successfully');
            });

            this.client.on('reconnecting', () => {
                logger.warn('Redis reconnecting...');
            });

            await this.client.connect();
            this.isConnected = true;
        } catch (error) {
            logger.error('Failed to connect to Redis', { error: (error as Error).message });
            // Don't throw - app should work without cache
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Redis disconnected');
        }
    }

    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.client || !this.isConnected) return null;

        try {
            const value = await this.client.get(key);
            if (!value) return null;

            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Redis GET error', { key, error: (error as Error).message });
            return null;
        }
    }

    /**
     * Set value in cache
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
        if (!this.client || !this.isConnected) return false;

        try {
            const serialized = JSON.stringify(value);
            const ttl = ttlSeconds || this.defaultTTL;

            await this.client.setEx(key, ttl, serialized);
            return true;
        } catch (error) {
            logger.error('Redis SET error', { key, error: (error as Error).message });
            return false;
        }
    }

    /**
     * Delete key from cache
     */
    async del(key: string): Promise<boolean> {
        if (!this.client || !this.isConnected) return false;

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Redis DEL error', { key, error: (error as Error).message });
            return false;
        }
    }

    /**
     * Delete all keys matching pattern
     */
    async delPattern(pattern: string): Promise<number> {
        if (!this.client || !this.isConnected) return 0;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;

            await this.client.del(keys);
            return keys.length;
        } catch (error) {
            logger.error('Redis DEL pattern error', { pattern, error: (error as Error).message });
            return 0;
        }
    }

    /**
     * Cache-aside pattern: get from cache or fetch and cache
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlSeconds?: number
    ): Promise<T> {
        // Try to get from cache
        const cached = await this.get<T>(key);
        if (cached !== null) {
            logger.debug('Cache HIT', { key });
            return cached;
        }

        // Fetch from source
        logger.debug('Cache MISS', { key });
        const value = await fetchFn();

        // Store in cache (don't await to avoid blocking)
        this.set(key, value, ttlSeconds).catch(() => { });

        return value;
    }

    /**
     * Check if connected
     */
    isReady(): boolean {
        return this.isConnected && this.client !== null;
    }
}

// Export singleton instance
export const cache = new CacheService();

// Cache key generators
export const CacheKeys = {
    departments: () => 'departments:all',
    departmentTree: () => 'departments:tree',
    department: (id: string) => `department:${id}`,
    roleMatrix: (deptId?: string) => deptId ? `roles:dept:${deptId}` : 'roles:all',
    user: (id: string) => `user:${id}`,
    employee: (id: string) => `employee:${id}`,
    leaderboard: (metric: string, period: string) => `leaderboard:${metric}:${period}`,
    orgChart: (deptId?: string) => deptId ? `orgchart:${deptId}` : 'orgchart:root',
};

// Common TTL values (in seconds)
export const CacheTTL = {
    SHORT: 60,         // 1 minute
    MEDIUM: 300,       // 5 minutes
    LONG: 3600,        // 1 hour
    DAY: 86400,        // 24 hours
};
