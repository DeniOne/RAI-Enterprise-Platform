"use strict";
/**
 * Auction Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 3.2 — AUCTION (EVENT LOGIC)
 *
 * ⚠️ STRICT: Blocks invalid auction operations.
 * Throws explicit domain errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionError = void 0;
exports.guardAuctionCanOpen = guardAuctionCanOpen;
exports.guardAuctionCanClose = guardAuctionCanClose;
exports.guardAuctionCanParticipate = guardAuctionCanParticipate;
const economy_enums_1 = require("../core/economy.enums");
const store_eligibility_guards_1 = require("./store-eligibility.guards");
// ============================================================================
// ERROR CLASSES
// ============================================================================
class AuctionError extends Error {
    reason;
    constructor(reason, message) {
        super(message);
        this.reason = reason;
        this.name = 'AuctionError';
    }
}
exports.AuctionError = AuctionError;
// ============================================================================
// GUARDS
// ============================================================================
/**
 * Guard: Auction can be opened
 */
function guardAuctionCanOpen(context) {
    if (context.status !== economy_enums_1.AuctionEventStatus.SCHEDULED) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.INVALID_CONTEXT, // Or distinct reason
        `Cannot open auction. Status is ${context.status}, expected SCHEDULED.`);
    }
    if (context.now < context.startsAt) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.AUCTION_NOT_STARTED, 'Cannot open auction. Start time not reached.');
    }
    if (context.now >= context.endsAt) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.AUCTION_CLOSED, 'Cannot open auction. End time passed.');
    }
}
/**
 * Guard: Auction can be closed
 */
function guardAuctionCanClose(context) {
    if (context.status !== economy_enums_1.AuctionEventStatus.ACTIVE) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.INVALID_CONTEXT, `Cannot close auction. Status is ${context.status}, expected ACTIVE.`);
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
function guardAuctionCanParticipate(context, participant) {
    // 1. Check Event Status
    if (context.status !== economy_enums_1.AuctionEventStatus.ACTIVE) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.AUCTION_CLOSED, // or NOT_STARTED depending on case
        `Auction is not active. Status: ${context.status}`);
    }
    // 2. Check Time Window
    if (context.now < context.startsAt) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.AUCTION_NOT_STARTED, 'Auction window not started.');
    }
    if (context.now >= context.endsAt) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.AUCTION_CLOSED, 'Auction window closed.');
    }
    // 3. Check Store Access Eligibility (Pre-requisite)
    if (participant.storeAccessDecision.status !== economy_enums_1.StoreEligibilityStatus.ELIGIBLE) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.ACCESS_DENIED, `Store access denied. Reason: ${participant.storeAccessDecision.denialReason}`);
    }
    // 4. Check MC Liquidity (Must have at least 1 usable MC)
    // Usage: We assume participation costs 1 MC (minimal).
    // Re-verify usable MCs in snapshot against Auction time
    const usableMC = participant.mcSnapshot.filter(mc => (0, store_eligibility_guards_1.isMCUsableForStore)(mc, context.now));
    if (usableMC.length === 0) {
        throw new AuctionError(economy_enums_1.AuctionDeniedReason.INSUFFICIENT_FUNDS, 'No usable (Active/Unfrozen) MC found for auction participation.');
    }
}
