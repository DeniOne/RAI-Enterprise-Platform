/**
 * GMC Recognition Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 3.3 — GMC RECOGNITION BRIDGE
 * 
 * ⚠️ STRICT: Blocks invalid recognition evaluation.
 * Throws explicit domain errors.
 */

import { GMCRecognitionContext } from '../core/gmc-recognition.types';
import { AuctionEventStatus, GMCRecognitionDeniedReason } from '../core/economy.enums';

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class GMCRecognitionError extends Error {
    constructor(
        public readonly reason: GMCRecognitionDeniedReason,
        message: string
    ) {
        super(message);
        this.name = 'GMCRecognitionError';
    }
}

// ============================================================================
// GUARDS
// ============================================================================

/**
 * Guard: Auction must be CLOSED (COMPLETED)
 * Recognition only runs after event.
 */
export function guardAuctionClosed(context: GMCRecognitionContext): void {
    if (context.auctionStatus !== AuctionEventStatus.COMPLETED) {
        throw new GMCRecognitionError(
            GMCRecognitionDeniedReason.AUCTION_NOT_CLOSED,
            `Cannot evaluate recognition. Auction ${context.auctionEventId} is ${context.auctionStatus}.`
        );
    }
}

/**
 * Guard: Context must have snapshot
 */
export function guardMCSnapshotPresent(context: GMCRecognitionContext): void {
    if (!context.mcSnapshot || context.mcSnapshot.length === 0) {
        // Warning: Empty snapshot might be valid if user has no MC? 
        // But recognition usually implies activity. 
        // If snapshot is empty, we can block or just return NOT_ELIGIBLE.
        // Prompt says "Guards that BLOCK... missing audit trail"
        // Let's assume snapshot array presence is mandatory, even if empty.
        // But if null/undefined -> Error.
        if (!context.mcSnapshot) {
            throw new GMCRecognitionError(
                GMCRecognitionDeniedReason.MISSING_SNAPSHOT,
                'MC Snapshot missing in context.'
            );
        }
    }
}

/**
 * Guard: Participant ID valid
 */
export function guardParticipantValid(context: GMCRecognitionContext): void {
    if (!context.participantId) {
        throw new GMCRecognitionError(
            GMCRecognitionDeniedReason.INVALID_CONTEXT,
            'Participant ID missing in context.'
        );
    }
}
