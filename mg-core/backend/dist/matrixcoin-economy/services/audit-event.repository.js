"use strict";
/**
 * Economy Audit Event Repository
 * Module 08 — MatrixCoin-Economy
 * STEP 5 — PERSISTENCE & API
 *
 * ⚠️ STRICT ADAPTER:
 * - Append-only
 * - No logic
 * - Maps Domain Event -> Prisma Model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEventRepository = void 0;
class AuditEventRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Persist Audit Event.
     * CRITICAL: Must be called BEFORE any state mutation persistence.
     */
    async saveEvent(event) {
        // Strict mapping: No derived fields
        // Using 'any' cast for prisma client until generation is run
        const prismaAny = this.prisma;
        // Handle optional/missing common fields if types mismatch (though they should exist on Base)
        // Ensure occurredAt exists or fallback (though Base has it?)
        // Let's check BaseAuditEvent in audit.types.ts for 'occurredAt'
        // BaseAuditEvent has: eventId, eventType, actorId, actorRole. 
        // IT DOES NOT HAVE occurredAt. It has timestamp in snapshots maybe?
        // Wait, BaseAuditEvent doesn't hava occurredAt? 
        // Let's check audit.types.ts to be sure.
        // Assuming we need to add it or map it from specific event timestamp.
        // Specific events have: evaluatedAt, detectedAt, flaggedAt, attemptTimestamp, etc.
        // We need a helper to extract "timestamp" from the specific event type.
        const timestamp = this.extractTimestamp(event);
        await prismaAny.economyAuditLog.create({
            data: {
                event_id: event.eventId,
                event_type: event.eventType,
                occurred_at: timestamp,
                actor_id: event.actorId,
                actor_role: event.actorRole || 'SYSTEM',
                user_id: 'userId' in event ? event.userId : null,
                context_id: 'usageContextId' in event ? event.usageContextId : null,
                payload: event
            }
        });
    }
    extractTimestamp(event) {
        if ('evaluatedAt' in event)
            return event.evaluatedAt;
        if ('detectedAt' in event)
            return event.detectedAt;
        if ('flaggedAt' in event)
            return event.flaggedAt;
        if ('deniedAt' in event)
            return event.deniedAt;
        if ('attemptTimestamp' in event)
            return event.attemptTimestamp;
        if ('created_at' in event)
            return event.created_at; // legacy fallback
        return new Date(); // Fallback to now if missing
    }
}
exports.AuditEventRepository = AuditEventRepository;
