/**
 * Auction Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 3.2 — AUCTION (EVENT LOGIC)
 * 
 * ⚠️ STRICT: Blocks invalid auction operations.
 * Throws explicit domain errors.
 */

import {
    AuctionEventContext,
    AuctionParticipant
} from '../core/auction.types';
import {
    AuctionEventStatus,
    AuctionDeniedReason,
    StoreEligibilityStatus
} from '../core/economy.enums';
import { isMCUsableForStore } from './store-eligibility.guards';

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class AuctionError extends Error {
    constructor(
        public readonly reason: AuctionDeniedReason,
        message: string
    ) {
        super(message);
        this.name = 'AuctionError';
    }
}

// ============================================================================
// GUARDS
// ============================================================================

/**
 * Guard: Auction can be opened
 */
export function guardAuctionCanOpen(context: AuctionEventContext): void {
    if (context.status !== AuctionEventStatus.SCHEDULED) {
        throw new AuctionError(
            AuctionDeniedReason.INVALID_CONTEXT, // Or distinct reason
            `Cannot open auction. Status is ${context.status}, expected SCHEDULED.`
        );
    }

    if (context.now < context.startsAt) {
        throw new AuctionError(
            AuctionDeniedReason.AUCTION_NOT_STARTED,
            'Cannot open auction. Start time not reached.'
        );
    }

    if (context.now >= context.endsAt) {
        throw new AuctionError(
            AuctionDeniedReason.AUCTION_CLOSED,
            'Cannot open auction. End time passed.'
        );
    }
}

/**
 * Guard: Auction can be closed
 */
export function guardAuctionCanClose(context: AuctionEventContext): void {
    if (context.status !== AuctionEventStatus.ACTIVE) {
        throw new AuctionError(
            AuctionDeniedReason.INVALID_CONTEXT,
            `Cannot close auction. Status is ${context.status}, expected ACTIVE.`
        );
    }

    // Note: Can close early? Or must be after end?
    // Prompt says "Auction IS ONLY: a bounded event".
    // Usually closes when time passes.
    // If manually closing, maybe allow.
    // But basic guard requires Active.
}

/**
 * Guard: User can participate
 */
export function guardAuctionCanParticipate(
    context: AuctionEventContext,
    participant: AuctionParticipant
): void {
    // 1. Check Event Status
    if (context.status !== AuctionEventStatus.ACTIVE) {
        throw new AuctionError(
            AuctionDeniedReason.AUCTION_CLOSED, // or NOT_STARTED depending on case
            `Auction is not active. Status: ${context.status}`
        );
    }

    // 2. Check Time Window
    if (context.now < context.startsAt) {
        throw new AuctionError(
            AuctionDeniedReason.AUCTION_NOT_STARTED,
            'Auction window not started.'
        );
    }

    if (context.now >= context.endsAt) {
        throw new AuctionError(
            AuctionDeniedReason.AUCTION_CLOSED,
            'Auction window closed.'
        );
    }

    // 3. Check Store Access Eligibility (Pre-requisite)
    if (participant.storeAccessDecision.status !== StoreEligibilityStatus.ELIGIBLE) {
        throw new AuctionError(
            AuctionDeniedReason.ACCESS_DENIED,
            `Store access denied. Reason: ${participant.storeAccessDecision.denialReason}`
        );
    }

    // 4. Check MC Liquidity (Must have at least 1 usable MC)
    // Usage: We assume participation costs 1 MC (minimal).
    // Re-verify usable MCs in snapshot against Auction time
    const usableMC = participant.mcSnapshot.filter(mc =>
        isMCUsableForStore(mc, context.now)
    );

    if (usableMC.length === 0) {
        throw new AuctionError(
            AuctionDeniedReason.INSUFFICIENT_FUNDS,
            'No usable (Active/Unfrozen) MC found for auction participation.'
        );
    }
}
