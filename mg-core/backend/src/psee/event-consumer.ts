/**
 * PSEE Event Consumer
 * 
 * Polling service that reads events from psee.events.
 * Cursor-based, no duplicates, survives restart.
 */

import { PseeEventReader, PseeEvent, EventCursor } from './psee-db';
import { logger } from '../config/logger';
import { cache } from '../config/cache';

const CURSOR_KEY = 'psee:event_consumer:cursor';
const DEFAULT_POLL_INTERVAL_MS = 5000; // 5 seconds

export type EventHandler = (events: PseeEvent[]) => Promise<void>;

export class PseeEventConsumer {
    private isRunning = false;
    private cursor: EventCursor | null = null;
    private timer: NodeJS.Timeout | null = null;

    constructor(
        private readonly reader: PseeEventReader,
        private readonly handler: EventHandler,
        private readonly pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS
    ) { }

    /**
     * Start the consumer (polling loop).
     */
    async start(): Promise<void> {
        if (this.isRunning) return;

        this.isRunning = true;
        await this.loadCursor();
        this.poll();

        logger.info('PSEE Event Consumer started', { cursor: this.cursor });
    }

    /**
     * Stop the consumer.
     */
    stop(): void {
        this.isRunning = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        logger.info('PSEE Event Consumer stopped');
    }

    private async poll(): Promise<void> {
        if (!this.isRunning) return;

        try {
            const events = await this.reader.fetchEvents(this.cursor);

            if (events.length > 0) {
                await this.handler(events);

                const newCursor = this.reader.extractCursor(events);
                if (newCursor) {
                    this.cursor = newCursor;
                    await this.saveCursor();
                }

                logger.info('PSEE events processed', {
                    count: events.length,
                    cursor: this.cursor
                });
            }
        } catch (error) {
            logger.error('PSEE Event Consumer error', { error });
        }

        // Schedule next poll
        this.timer = setTimeout(() => this.poll(), this.pollIntervalMs);
    }

    /**
     * Load cursor from Redis (survives restart).
     */
    private async loadCursor(): Promise<void> {
        try {
            const stored = await cache.get<{ createdAt: string; id: string }>(CURSOR_KEY);
            if (stored) {
                this.cursor = {
                    createdAt: new Date(stored.createdAt),
                    id: stored.id,
                };
            }
        } catch (error) {
            logger.warn('Failed to load PSEE cursor, starting from beginning');
            this.cursor = null;
        }
    }

    /**
     * Save cursor to Redis.
     */
    private async saveCursor(): Promise<void> {
        if (!this.cursor) return;
        try {
            await cache.set(CURSOR_KEY, JSON.stringify({
                createdAt: this.cursor.createdAt.toISOString(),
                id: this.cursor.id,
            }));
        } catch (error) {
            logger.error('Failed to save PSEE cursor', { error });
        }
    }

    /**
     * Get current lag (time since last event processed).
     */
    getLag(): number | null {
        if (!this.cursor) return null;
        return Date.now() - this.cursor.createdAt.getTime();
    }
}
