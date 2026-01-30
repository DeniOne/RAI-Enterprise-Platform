"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKeys = exports.cache = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
/**
 * Redis Cache Service
 *
 * Provides caching layer for frequently accessed data.
 * Supports automatic JSON serialization/deserialization.
 */
class CacheService {
    client = null;
    isConnected = false;
    defaultTTL = 300; // 5 minutes
    /**
     * Initialize Redis connection
     */
    async connect() {
        if (this.isConnected)
            return;
        // Skip Redis if explicitly disabled
        const redisEnabled = process.env.REDIS_ENABLED !== 'false';
        if (!redisEnabled) {
            logger_1.logger.warn('Redis disabled via REDIS_ENABLED=false');
            return;
        }
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        try {
            this.client = (0, redis_1.createClient)({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 3) {
                            logger_1.logger.warn('Redis max retries reached, giving up');
                            return false; // Stop trying to reconnect
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });
            this.client.on('error', (err) => {
                logger_1.logger.error('Redis connection error', { error: err.message });
            });
            this.client.on('connect', () => {
                logger_1.logger.info('Redis connected successfully');
            });
            this.client.on('reconnecting', () => {
                logger_1.logger.warn('Redis reconnecting...');
            });
            await this.client.connect();
            this.isConnected = true;
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis', { error: error.message });
            // Don't throw - app should work without cache
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
            logger_1.logger.info('Redis disconnected');
        }
    }
    /**
     * Get value from cache
     */
    async get(key) {
        if (!this.client || !this.isConnected)
            return null;
        try {
            const value = await this.client.get(key);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error('Redis GET error', { key, error: error.message });
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, ttlSeconds) {
        if (!this.client || !this.isConnected)
            return false;
        try {
            const serialized = JSON.stringify(value);
            const ttl = ttlSeconds || this.defaultTTL;
            await this.client.setEx(key, ttl, serialized);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis SET error', { key, error: error.message });
            return false;
        }
    }
    /**
     * Delete key from cache
     */
    async del(key) {
        if (!this.client || !this.isConnected)
            return false;
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis DEL error', { key, error: error.message });
            return false;
        }
    }
    /**
     * Delete all keys matching pattern
     */
    async delPattern(pattern) {
        if (!this.client || !this.isConnected)
            return 0;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0)
                return 0;
            await this.client.del(keys);
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error('Redis DEL pattern error', { pattern, error: error.message });
            return 0;
        }
    }
    /**
     * Cache-aside pattern: get from cache or fetch and cache
     */
    async getOrSet(key, fetchFn, ttlSeconds) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            logger_1.logger.debug('Cache HIT', { key });
            return cached;
        }
        // Fetch from source
        logger_1.logger.debug('Cache MISS', { key });
        const value = await fetchFn();
        // Store in cache (don't await to avoid blocking)
        this.set(key, value, ttlSeconds).catch(() => { });
        return value;
    }
    /**
     * Check if connected
     */
    isReady() {
        return this.isConnected && this.client !== null;
    }
}
// Export singleton instance
exports.cache = new CacheService();
// Cache key generators
exports.CacheKeys = {
    departments: () => 'departments:all',
    departmentTree: () => 'departments:tree',
    department: (id) => `department:${id}`,
    roleMatrix: (deptId) => deptId ? `roles:dept:${deptId}` : 'roles:all',
    user: (id) => `user:${id}`,
    employee: (id) => `employee:${id}`,
    leaderboard: (metric, period) => `leaderboard:${metric}:${period}`,
    orgChart: (deptId) => deptId ? `orgchart:${deptId}` : 'orgchart:root',
};
// Common TTL values (in seconds)
exports.CacheTTL = {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
};
