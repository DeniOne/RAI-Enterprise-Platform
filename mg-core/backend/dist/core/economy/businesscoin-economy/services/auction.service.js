"use strict";
/**
 * Auction Event Service — Minimal Implementation
 * Module 08 — BusinessCoin-Economy
 * STEP 3.2 — AUCTION (EVENT LOGIC)
 *
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * No DB logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionEventService = void 0;
const crypto_1 = require("crypto");
const economy_enums_1 = require("../core/economy.enums");
const auction_guards_1 = require("../guards/auction.guards");
const auction_logic_1 = require("../core/auction.logic");
const audit_types_1 = require("../core/audit.types");
class AuctionEventService {
    /**
     * Open an Auction Event
     */
    openAuction(context) {
        // 1. Guards
        (0, auction_guards_1.guardAuctionCanOpen)(context);
        // 2. Logic (Transition)
        (0, auction_logic_1.openAuctionEvent)(context);
        // 3. Audit
        const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.AUCTION_OPENED, 'SYSTEM', 'SYSTEM');
        const event = {
            ...baseEvent,
            eventId: (0, crypto_1.randomUUID)(),
            eventType: audit_types_1.AuditEventType.AUCTION_OPENED,
            auctionEventId: context.eventId,
            scheduledEndsAt: context.endsAt
        };
        (0, audit_types_1.validateAuditEvent)(event);
        return { result: event, events: [event] };
    }
    /**
     * Close an Auction Event
     */
    closeAuction(context) {
        // 1. Guards
        (0, auction_guards_1.guardAuctionCanClose)(context);
        // 2. Logic
        (0, auction_logic_1.closeAuctionEvent)(context);
        // 3. Audit
        const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.AUCTION_CLOSED, 'SYSTEM', 'SYSTEM');
        const event = {
            ...baseEvent,
            eventId: (0, crypto_1.randomUUID)(),
            eventType: audit_types_1.AuditEventType.AUCTION_CLOSED,
            auctionEventId: context.eventId,
            actualEndsAt: context.now,
            finalStatus: economy_enums_1.AuctionEventStatus.COMPLETED
        };
        (0, audit_types_1.validateAuditEvent)(event);
        return { result: event, events: [event] };
    }
    /**
     * Participate in Auction
     */
    participate(context, participant) {
        try {
            // 1. Guards
            (0, auction_guards_1.guardAuctionCanParticipate)(context, participant);
            // 2. Logic
            const result = (0, auction_logic_1.participateInAuction)(context, participant);
            if (!result.success) {
                throw new auction_guards_1.AuctionError(result.deniedReason || economy_enums_1.AuctionDeniedReason.INVALID_CONTEXT, 'Participation failed in logic layer.');
            }
            // 3. Audit Success
            const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.AUCTION_PARTICIPATION, participant.userId, 'HUMAN');
            const event = {
                ...baseEvent,
                eventId: (0, crypto_1.randomUUID)(),
                eventType: audit_types_1.AuditEventType.AUCTION_PARTICIPATION,
                auctionEventId: context.eventId,
                userId: participant.userId,
                mcSnapshot: participant.mcSnapshot,
                outcome: result.outcome || economy_enums_1.AuctionParticipationOutcome.LOST,
                mcConsumedIds: result.mcConsumedIds
            };
            (0, audit_types_1.validateAuditEvent)(event);
            return { result: event, events: [event] };
        }
        catch (error) {
            // Handle Denials
            if (error instanceof auction_guards_1.AuctionError) {
                const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.AUCTION_DENIED, participant.userId, 'HUMAN');
                const event = {
                    ...baseEvent,
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.AUCTION_DENIED,
                    auctionEventId: context.eventId,
                    userId: participant.userId,
                    denialReason: error.reason,
                    mcSnapshot: participant.mcSnapshot
                };
                (0, audit_types_1.validateAuditEvent)(event);
                return { result: event, events: [event] };
            }
            throw error;
        }
    }
}
exports.AuctionEventService = AuctionEventService;
