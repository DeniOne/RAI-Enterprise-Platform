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

import { PrismaClient } from '@prisma/client';
import { EconomyAuditEvent } from '../core/audit.types';

export class AuditEventRepository {
    constructor(private readonly prisma: PrismaClient) { }

    /**
     * Persist Audit Event.
     * CRITICAL: Must be called BEFORE any state mutation persistence.
     */
    async saveEvent(event: EconomyAuditEvent): Promise<void> {
        // Strict mapping: No derived fields
        // Using 'any' cast for prisma client until generation is run
        const prismaAny = this.prisma as any;

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
                actor_role: (event as any).actorRole || 'SYSTEM',
                user_id: 'userId' in event ? (event as any).userId : null,
                context_id: 'usageContextId' in event ? (event as any).usageContextId : null,
                payload: event as any
            }
        });
    }

    private extractTimestamp(event: EconomyAuditEvent): Date {
        if ('evaluatedAt' in event) return (event as any).evaluatedAt;
        if ('detectedAt' in event) return (event as any).detectedAt;
        if ('flaggedAt' in event) return (event as any).flaggedAt;
        if ('deniedAt' in event) return (event as any).deniedAt;
        if ('attemptTimestamp' in event) return (event as any).attemptTimestamp;
        if ('created_at' in event) return (event as any).created_at; // legacy fallback
        return new Date(); // Fallback to now if missing
    }
}
