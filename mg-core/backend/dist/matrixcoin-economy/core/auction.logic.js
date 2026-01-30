"use strict";
/**
 * Auction Pure Logic
 * Module 08 — MatrixCoin-Economy
 * STEP 3.2 — AUCTION (EVENT LOGIC)
 *
 * ⚠️ PURE DOMAIN LOGIC.
 * Deterministic. No side effects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAuctionEvent = openAuctionEvent;
exports.closeAuctionEvent = closeAuctionEvent;
exports.participateInAuction = participateInAuction;
const economy_enums_1 = require("./economy.enums");
const store_eligibility_guards_1 = require("../guards/store-eligibility.guards");
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
function openAuctionEvent(context) {
    return {
        status: economy_enums_1.AuctionEventStatus.ACTIVE
    };
}
/**
 * Close Auction Event
 * Transition: ACTIVE -> COMPLETED
 */
function closeAuctionEvent(context) {
    return {
        status: economy_enums_1.AuctionEventStatus.COMPLETED
    };
}
/**
 * Participate in Auction
 * Consumes MC, determines Outcome deterministically from context.randomFactor
 */
function participateInAuction(context, participant) {
    // 1. Select MCs to consume (Cost)
    // Filter usable MCs (using Store Guards logic reuse)
    // Sort by ExpiresAt ASC (Burn closest to expiration first - user friendly)
    const usableMCs = participant.mcSnapshot
        .filter(mc => (0, store_eligibility_guards_1.isMCUsableForStore)(mc, context.now))
        .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    if (usableMCs.length < PARTICIPATION_COST_MC) {
        // Should have been caught by Guard, but double check logic
        return {
            success: false,
            deniedReason: economy_enums_1.AuctionDeniedReason.INSUFFICIENT_FUNDS,
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
    const outcome = isWin ? economy_enums_1.AuctionParticipationOutcome.WON : economy_enums_1.AuctionParticipationOutcome.LOST;
    // 3. Return Result
    return {
        success: true,
        outcome,
        mcConsumedIds: consumedIds,
        timestamp: context.now
    };
}
