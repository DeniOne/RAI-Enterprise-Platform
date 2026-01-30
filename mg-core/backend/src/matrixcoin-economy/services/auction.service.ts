/**
 * Auction Event Service — Minimal Implementation
 * Module 08 — MatrixCoin-Economy
 * STEP 3.2 — AUCTION (EVENT LOGIC)
 * 
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * No DB logic.
 */

import { randomUUID } from 'crypto';
import {
    AuctionEventContext,
    AuctionParticipant,
    AuctionEventResult
} from '../core/auction.types';
import {
    AuctionEventStatus,
    AuctionParticipationOutcome,
    AuctionDeniedReason
} from '../core/economy.enums';
import {
    guardAuctionCanOpen,
    guardAuctionCanClose,
    guardAuctionCanParticipate,
    AuctionError
} from '../guards/auction.guards';
import {
    openAuctionEvent,
    closeAuctionEvent,
    participateInAuction
} from '../core/auction.logic';
import {
    createBaseAuditEvent,
    validateAuditEvent,
    AuditEventType,
    AuctionOpenedEvent,
    AuctionClosedEvent,
    AuctionParticipationEvent,
    AuctionDeniedEvent
} from '../core/audit.types';

export interface AuctionServiceResult<T> {
    readonly result: T; // The event itself acts as result in current logic, or separate result type?
    // Current logic: open -> event; close -> event; participate -> event.
    // So the event IS the result.
    // But for consistency with StoreAccess (Decision + Events), let's wrap it.
    readonly events: any[];
}

export class AuctionEventService {

    /**
     * Open an Auction Event
     */
    public openAuction(context: AuctionEventContext): AuctionServiceResult<AuctionOpenedEvent> {
        // 1. Guards
        guardAuctionCanOpen(context);

        // 2. Logic (Transition)
        openAuctionEvent(context);

        // 3. Audit
        const baseEvent = createBaseAuditEvent(
            AuditEventType.AUCTION_OPENED,
            'SYSTEM',
            'SYSTEM'
        );

        const event: AuctionOpenedEvent = {
            ...baseEvent,
            eventId: randomUUID(),
            eventType: AuditEventType.AUCTION_OPENED,
            auctionEventId: context.eventId,
            scheduledEndsAt: context.endsAt
        };

        validateAuditEvent(event);
        return { result: event, events: [event] };
    }

    /**
     * Close an Auction Event
     */
    public closeAuction(context: AuctionEventContext): AuctionServiceResult<AuctionClosedEvent> {
        // 1. Guards
        guardAuctionCanClose(context);

        // 2. Logic
        closeAuctionEvent(context);

        // 3. Audit
        const baseEvent = createBaseAuditEvent(
            AuditEventType.AUCTION_CLOSED,
            'SYSTEM',
            'SYSTEM'
        );

        const event: AuctionClosedEvent = {
            ...baseEvent,
            eventId: randomUUID(),
            eventType: AuditEventType.AUCTION_CLOSED,
            auctionEventId: context.eventId,
            actualEndsAt: context.now,
            finalStatus: AuctionEventStatus.COMPLETED
        };

        validateAuditEvent(event);
        return { result: event, events: [event] };
    }

    /**
     * Participate in Auction
     */
    public participate(
        context: AuctionEventContext,
        participant: AuctionParticipant
    ): AuctionServiceResult<AuctionParticipationEvent | AuctionDeniedEvent> {

        try {
            // 1. Guards
            guardAuctionCanParticipate(context, participant);

            // 2. Logic
            const result = participateInAuction(context, participant);

            if (!result.success) {
                throw new AuctionError(
                    result.deniedReason || AuctionDeniedReason.INVALID_CONTEXT,
                    'Participation failed in logic layer.'
                );
            }

            // 3. Audit Success
            const baseEvent = createBaseAuditEvent(
                AuditEventType.AUCTION_PARTICIPATION,
                participant.userId,
                'HUMAN'
            );

            const event: AuctionParticipationEvent = {
                ...baseEvent,
                eventId: randomUUID(),
                eventType: AuditEventType.AUCTION_PARTICIPATION,
                auctionEventId: context.eventId,
                userId: participant.userId,
                mcSnapshot: participant.mcSnapshot,
                outcome: result.outcome || AuctionParticipationOutcome.LOST,
                mcConsumedIds: result.mcConsumedIds
            };

            validateAuditEvent(event);
            return { result: event, events: [event] };

        } catch (error) {
            // Handle Denials
            if (error instanceof AuctionError) {
                const baseEvent = createBaseAuditEvent(
                    AuditEventType.AUCTION_DENIED,
                    participant.userId,
                    'HUMAN'
                );

                const event: AuctionDeniedEvent = {
                    ...baseEvent,
                    eventId: randomUUID(),
                    eventType: AuditEventType.AUCTION_DENIED,
                    auctionEventId: context.eventId,
                    userId: participant.userId,
                    denialReason: error.reason,
                    mcSnapshot: participant.mcSnapshot
                };

                validateAuditEvent(event);
                return { result: event, events: [event] };
            }
            throw error;
        }
    }
}
