/**
 * GMC Recognition Logic (Pure)
 * Module 08 — MatrixCoin-Economy
 * STEP 3.3 — GMC RECOGNITION BRIDGE
 * 
 * ⚠️ PURE DOMAIN LOGIC.
 * Evaluates potential for recognition (Signal).
 * DOES NOT GRANT GMC.
 */

import { GMCRecognitionContext, GMCRecognitionDecision } from './gmc-recognition.types';
import { GMCRecognitionStatus, GMCRecognitionTrigger, GMCRecognitionDeniedReason } from './economy.enums';

// ============================================================================
// CONSTANTS
// ============================================================================

const RECOGNITION_THRESHOLD = 0.98; // 2% chance of signal

// ============================================================================
// PURE LOGIC
// ============================================================================

/**
 * Evaluate if the Context triggers a GMC Recognition Signal
 */
export function evaluateGMCRecognition(context: GMCRecognitionContext): GMCRecognitionDecision {
    // 1. Basic Eligibility Check (e.g. Activity level)
    // For minimal bridge, we ensure at least some MCs exist (activity)
    // If strict, we might require specific MC types, but keeping generic.
    // If empty snapshot -> BELOW_THRESHOLD (no impact).
    if (!context.mcSnapshot || context.mcSnapshot.length === 0) {
        return {
            status: GMCRecognitionStatus.NOT_ELIGIBLE,
            deniedReason: GMCRecognitionDeniedReason.NO_PARTICIPANTS,
            evaluatedAt: context.now
        };
    }

    // 2. Probabilistic Evaluation (Injected Randomness)
    // Signal generation only.
    if (context.randomFactor >= RECOGNITION_THRESHOLD) {
        return {
            status: GMCRecognitionStatus.ELIGIBLE,
            trigger: GMCRecognitionTrigger.PROBABILISTIC_CHECK,
            evaluatedAt: context.now
        };
    }

    // 3. Default: Not Eligible (Ordinary outcome)
    return {
        status: GMCRecognitionStatus.NOT_ELIGIBLE,
        deniedReason: GMCRecognitionDeniedReason.BELOW_THRESHOLD,
        evaluatedAt: context.now
    };
}
