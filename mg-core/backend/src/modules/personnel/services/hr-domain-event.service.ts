import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { HREventType, HRAggregateType } from '@prisma/client';
import { validateActorRole } from '../domain/hr-event-validator';

interface EmitEventParams {
    eventType: HREventType;
    aggregateType: HRAggregateType;
    aggregateId: string;
    actorId: string;
    actorRole: string;
    payload: any;
    previousState?: any;
    newState?: any;
    legalBasis?: string;
}

@Injectable()
export class HRDomainEventService {
    constructor(private prisma: PrismaService) { }

    /**
     * Emit HR domain event (append-only)
     * CRITICAL: Validates actor role before emission
     */
    async emit(params: EmitEventParams): Promise<void> {
        const {
            eventType,
            aggregateType,
            aggregateId,
            actorId,
            actorRole,
            payload,
            previousState,
            newState,
            legalBasis,
        } = params;

        // CRITICAL: Validate actor role
        validateActorRole(eventType, actorRole);

        // Emit event (INSERT-only, immutable)
        await this.prisma.hRDomainEvent.create({
            data: {
                eventType,
                aggregateType,
                aggregateId,
                actorId,
                actorRole,
                payload,
                previousState,
                newState,
                legalBasis,
            },
        });
    }

    /**
     * Get all events for an aggregate (for audit)
     */
    async getEventsByAggregate(
        aggregateId: string,
        aggregateType?: HRAggregateType
    ) {
        return this.prisma.hRDomainEvent.findMany({
            where: {
                aggregateId,
                ...(aggregateType && { aggregateType }),
            },
            orderBy: { occurredAt: 'asc' },
        });
    }

    /**
     * Replay events to reconstruct aggregate state
     * CRITICAL: READ-ONLY operation, NO side-effects, NO mutations
     * Used ONLY for audit and state verification
     * 
     * @returns Immutable event log (chronological order)
     */
    async replayEvents(aggregateId: string): Promise<Readonly<any[]>> {
        const events = await this.getEventsByAggregate(aggregateId);

        // CRITICAL: Return read-only event log
        // This method MUST NOT trigger any writes or side-effects
        return Object.freeze(
            events.map(event => Object.freeze({
                timestamp: event.occurredAt,
                type: event.eventType,
                actor: event.actorId,
                role: event.actorRole,
                payload: event.payload,
                legalBasis: event.legalBasis,
            }))
        );
    }
}
