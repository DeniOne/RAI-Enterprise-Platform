"use strict";
/**
 * PSEE Event Consumer
 *
 * Polling service that reads events from psee.events.
 * Cursor-based, no duplicates, survives restart.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PseeEventConsumer = void 0;
const logger_1 = require("../config/logger");
const cache_1 = require("../config/cache");
const CURSOR_KEY = 'psee:event_consumer:cursor';
const DEFAULT_POLL_INTERVAL_MS = 5000; // 5 seconds
class PseeEventConsumer {
    reader;
    handler;
    pollIntervalMs;
    isRunning = false;
    cursor = null;
    timer = null;
    constructor(reader, handler, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS) {
        this.reader = reader;
        this.handler = handler;
        this.pollIntervalMs = pollIntervalMs;
    }
    /**
     * Start the consumer (polling loop).
     */
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        await this.loadCursor();
        this.poll();
        logger_1.logger.info('PSEE Event Consumer started', { cursor: this.cursor });
    }
    /**
     * Stop the consumer.
     */
    stop() {
        this.isRunning = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        logger_1.logger.info('PSEE Event Consumer stopped');
    }
    async poll() {
        if (!this.isRunning)
            return;
        try {
            const events = await this.reader.fetchEvents(this.cursor);
            if (events.length > 0) {
                await this.handler(events);
                const newCursor = this.reader.extractCursor(events);
                if (newCursor) {
                    this.cursor = newCursor;
                    await this.saveCursor();
                }
                logger_1.logger.info('PSEE events processed', {
                    count: events.length,
                    cursor: this.cursor
                });
            }
        }
        catch (error) {
            logger_1.logger.error('PSEE Event Consumer error', { error });
        }
        // Schedule next poll
        this.timer = setTimeout(() => this.poll(), this.pollIntervalMs);
    }
    /**
     * Load cursor from Redis (survives restart).
     */
    async loadCursor() {
        try {
            const stored = await cache_1.cache.get(CURSOR_KEY);
            if (stored) {
                this.cursor = {
                    createdAt: new Date(stored.createdAt),
                    id: stored.id,
                };
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to load PSEE cursor, starting from beginning');
            this.cursor = null;
        }
    }
    /**
     * Save cursor to Redis.
     */
    async saveCursor() {
        if (!this.cursor)
            return;
        try {
            await cache_1.cache.set(CURSOR_KEY, JSON.stringify({
                createdAt: this.cursor.createdAt.toISOString(),
                id: this.cursor.id,
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to save PSEE cursor', { error });
        }
    }
    /**
     * Get current lag (time since last event processed).
     */
    getLag() {
        if (!this.cursor)
            return null;
        return Date.now() - this.cursor.createdAt.getTime();
    }
}
exports.PseeEventConsumer = PseeEventConsumer;
