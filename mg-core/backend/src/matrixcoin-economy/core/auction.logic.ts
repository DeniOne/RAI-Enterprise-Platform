/**
 * Auction Pure Logic
 * Module 08 — MatrixCoin-Economy
 * STEP 3.2 — AUCTION (EVENT LOGIC)
 * 
 * ⚠️ PURE DOMAIN LOGIC.
 * Deterministic. No side effects.
 */

import {
    AuctionEventContext,
    AuctionParticipant,
    AuctionEventResult
} from './auction.types';
import {
    AuctionEventStatus,
    AuctionParticipationOutcome,
    AuctionDeniedReason
} from './economy.enums';
import { isMCUsableForStore } from '../guards/store-eligibility.guards';

// ============================================================================
// CONSTANTS
// ============================================================================

const PARTICIPATION_COST_MC = 1;
const WIN_THRESHOLD = 0.9; // 10% chance strict deterministic check

// ============================================================================
// PURE LOGIC FUNCTIONS
// ============================================================================

/**
 * Open Auction Event
 * Transition: SCHEDULED -> ACTIVE
 */
export function openAuctionEvent(context: AuctionEventContext): { status: AuctionEventStatus } {
    return {
        status: AuctionEventStatus.ACTIVE
    };
}

/**
 * Close Auction Event
 * Transition: ACTIVE -> COMPLETED
 */
export function closeAuctionEvent(context: AuctionEventContext): { status: AuctionEventStatus } {
    return {
        status: AuctionEventStatus.COMPLETED
    };
}

/**
 * Participate in Auction
 * Consumes MC, determines Outcome deterministically from context.randomFactor
 */
export function participateInAuction(
    context: AuctionEventContext,
    participant: AuctionParticipant
): AuctionEventResult {
    // 1. Select MCs to consume (Cost)
    // Filter usable MCs (using Store Guards logic reuse)
    // Sort by ExpiresAt ASC (Burn closest to expiration first - user friendly)
    const usableMCs = participant.mcSnapshot
        .filter(mc => isMCUsableForStore(mc, context.now))
        .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

    if (usableMCs.length < PARTICIPATION_COST_MC) {
        // Should have been caught by Guard, but double check logic
        return {
            success: false,
            deniedReason: AuctionDeniedReason.INSUFFICIENT_FUNDS,
            mcConsumedIds: [],
            timestamp: context.now
        };
    }

    // Take the required amount
    const consumedMCs = usableMCs.slice(0, PARTICIPATION_COST_MC);
    const consumedIds = consumedMCs.map(mc => mc.id);

    // 2. Determine Outcome
    // Strict deterministic check against injected randomFactor
    const isWin = context.randomFactor >= WIN_THRESHOLD;
    const outcome = isWin ? AuctionParticipationOutcome.WON : AuctionParticipationOutcome.LOST;

    // 3. Return Result
    return {
        success: true,
        outcome,
        mcConsumedIds: consumedIds,
        timestamp: context.now
    };
}
