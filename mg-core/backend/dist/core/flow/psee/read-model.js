"use strict";
/**
 * PSEE Read Model
 *
 * Derived state from domain events.
 * NOT source of truth.
 * Can be rebuilt from scratch.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PseeReadModel = void 0;
const logger_1 = require("@/config/logger");
/**
 * In-memory read model for PSEE events.
 * Ephemeral - can be rebuilt.
 */
class PseeReadModel {
    sessions = new Map();
    alerts = [];
    totalEventsProcessed = 0;
    /**
     * Process batch of events and update read model.
     */
    async processEvents(events) {
        for (const event of events) {
            this.processEvent(event);
        }
        this.totalEventsProcessed += events.length;
    }
    processEvent(event) {
        const sessionId = event.sessionId;
        if (!sessionId)
            return;
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
        const payload = event.payload;
        if (payload.toStatus) {
            metrics.currentStatus = payload.toStatus;
            metrics.statusHistory.push(payload.toStatus);
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
    getSessionMetrics(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get all active sessions.
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Get recent alerts.
     */
    getAlerts(limit = 100) {
        return this.alerts.slice(-limit);
    }
    /**
     * Get stats for monitoring.
     */
    getStats() {
        return {
            sessionsCount: this.sessions.size,
            eventsProcessed: this.totalEventsProcessed,
            alertsCount: this.alerts.length,
        };
    }
    /**
     * Clear read model (for rebuild).
     */
    clear() {
        this.sessions.clear();
        this.alerts = [];
        this.totalEventsProcessed = 0;
        logger_1.logger.info('PSEE Read Model cleared');
    }
}
exports.PseeReadModel = PseeReadModel;
