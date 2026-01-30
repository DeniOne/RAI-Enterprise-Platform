/**
 * PSEE Read-Only Database Client
 * 
 * SELECT only access to psee.events table.
 * No write operations allowed.
 */

import { PrismaClient } from '@prisma/client';

export interface PseeEvent {
    id: string;
    sessionId: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: Date;
}

export interface EventCursor {
    createdAt: Date;
    id: string;
}

const BATCH_SIZE = 100;

/**
 * Read-only client for psee.events
 */
export class PseeEventReader {
    constructor(private readonly prisma: PrismaClient) { }

    /**
     * Fetch events after cursor (cursor-based pagination).
     * READ-ONLY. No write operations.
     */
    async fetchEvents(cursor: EventCursor | null): Promise<PseeEvent[]> {
        const whereClause = cursor
            ? {
                OR: [
                    { createdAt: { gt: cursor.createdAt } },
                    {
                        AND: [
                            { createdAt: cursor.createdAt },
                            { id: { gt: cursor.id } },
                        ],
                    },
                ],
            }
            : {};

        const result = await this.prisma.$queryRawUnsafe<PseeEvent[]>(`
      SELECT id, session_id as "sessionId", event_type as "eventType", payload, created_at as "createdAt"
      FROM psee.events
      ${cursor ? `WHERE (created_at, id) > ($1, $2)` : ''}
      ORDER BY created_at ASC, id ASC
      LIMIT ${BATCH_SIZE}
    `, ...(cursor ? [cursor.createdAt, cursor.id] : []));

        return result;
    }

    /**
     * Get the last cursor from events.
     */
    extractCursor(events: PseeEvent[]): EventCursor | null {
        if (events.length === 0) return null;
        const last = events[events.length - 1];
        return { createdAt: last.createdAt, id: last.id };
    }
}
