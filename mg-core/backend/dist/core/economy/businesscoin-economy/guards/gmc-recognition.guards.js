"use strict";
/**
 * GMC Recognition Guards
 * Module 08 — BusinessCoin-Economy
 * STEP 3.3 — GMC RECOGNITION BRIDGE
 *
 * ⚠️ STRICT: Blocks invalid recognition evaluation.
 * Throws explicit domain errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMCRecognitionError = void 0;
exports.guardAuctionClosed = guardAuctionClosed;
exports.guardMCSnapshotPresent = guardMCSnapshotPresent;
exports.guardParticipantValid = guardParticipantValid;
const economy_enums_1 = require("../core/economy.enums");
// ============================================================================
// ERROR CLASSES
// ============================================================================
class GMCRecognitionError extends Error {
    reason;
    constructor(reason, message) {
        super(message);
        this.reason = reason;
        this.name = 'GMCRecognitionError';
    }
}
exports.GMCRecognitionError = GMCRecognitionError;
// ============================================================================
// GUARDS
// ============================================================================
/**
 * Guard: Auction must be CLOSED (COMPLETED)
 * Recognition only runs after event.
 */
function guardAuctionClosed(context) {
    if (context.auctionStatus !== economy_enums_1.AuctionEventStatus.COMPLETED) {
        throw new GMCRecognitionError(economy_enums_1.GMCRecognitionDeniedReason.AUCTION_NOT_CLOSED, `Cannot evaluate recognition. Auction ${context.auctionEventId} is ${context.auctionStatus}.`);
    }
}
/**
 * Guard: Context must have snapshot
 */
function guardMCSnapshotPresent(context) {
    if (!context.mcSnapshot || context.mcSnapshot.length === 0) {
        // Warning: Empty snapshot might be valid if user has no MC? 
        // But recognition usually implies activity. 
        // If snapshot is empty, we can block or just return NOT_ELIGIBLE.
        // Prompt says "Guards that BLOCK... missing audit trail"
        // Let's assume snapshot array presence is mandatory, even if empty.
        // But if null/undefined -> Error.
        if (!context.mcSnapshot) {
            throw new GMCRecognitionError(economy_enums_1.GMCRecognitionDeniedReason.MISSING_SNAPSHOT, 'MC Snapshot missing in context.');
        }
    }
}
/**
 * Guard: Participant ID valid
 */
function guardParticipantValid(context) {
    if (!context.participantId) {
        throw new GMCRecognitionError(economy_enums_1.GMCRecognitionDeniedReason.INVALID_CONTEXT, 'Participant ID missing in context.');
    }
}
