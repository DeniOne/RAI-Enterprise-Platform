/**
 * PSEE Read Model
 * 
 * Derived state from domain events.
 * NOT source of truth.
 * Can be rebuilt from scratch.
 */

import { PseeEvent } from './psee-db';
import { logger } from '../config/logger';

export interface SessionMetrics {
    sessionId: string;
    currentStatus: string;
    createdAt: Date;
    lastEventAt: Date;
    eventCount: number;
    statusHistory: string[];
}

export interface SLAAlert {
    sessionId: string;
    eventType: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    timestamp: Date;
}

/**
 * In-memory read model for PSEE events.
 * Ephemeral - can be rebuilt.
 */
export class PseeReadModel {
    private sessions: Map<string, SessionMetrics> = new Map();
    private alerts: SLAAlert[] = [];
    private totalEventsProcessed = 0;

    /**
     * Process batch of events and update read model.
     */
    async processEvents(events: PseeEvent[]): Promise<void> {
        for (const event of events) {
            this.processEvent(event);
        }
        this.totalEventsProcessed += events.length;
    }

    private processEvent(event: PseeEvent): void {
        const sessionId = event.sessionId;
        if (!sessionId) return;

        let metrics = this.sessions.get(sessionId);
        if (!metrics) {
            metrics = {
                sessionId,
                currentStatus: 'UNKNOWN',
                createdAt: event.createdAt,
                lastEventAt: event.createdAt,
                eventCount: 0,
                statusHistory: [],
            };
            this.sessions.set(sessionId, metrics);
        }

        metrics.eventCount++;
        metrics.lastEventAt = event.createdAt;

        // Extract status from payload
        const payload = event.payload as Record<string, unknown>;
        if (payload.toStatus) {
            metrics.currentStatus = payload.toStatus as string;
            metrics.statusHistory.push(payload.toStatus as string);
        }

        // Generate SLA alerts (simple example)
        if (event.eventType === 'StageRejected') {
            this.alerts.push({
                sessionId,
                eventType: event.eventType,
                severity: 'WARNING',
                message: `Session ${sessionId} stage rejected: ${payload.reason || 'unknown'}`,
                timestamp: event.createdAt,
            });
        }
    }

    /**
     * Get metrics for a session.
     */
    getSessionMetrics(sessionId: string): SessionMetrics | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Get all active sessions.
     */
    getAllSessions(): SessionMetrics[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get recent alerts.
     */
    getAlerts(limit = 100): SLAAlert[] {
        return this.alerts.slice(-limit);
    }

    /**
     * Get stats for monitoring.
     */
    getStats(): { sessionsCount: number; eventsProcessed: number; alertsCount: number } {
        return {
            sessionsCount: this.sessions.size,
            eventsProcessed: this.totalEventsProcessed,
            alertsCount: this.alerts.length,
        };
    }

    /**
     * Clear read model (for rebuild).
     */
    clear(): void {
        this.sessions.clear();
        this.alerts = [];
        this.totalEventsProcessed = 0;
        logger.info('PSEE Read Model cleared');
    }
}
