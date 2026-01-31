"use strict";
/**
 * GMC Recognition Logic (Pure)
 * Module 08 — MatrixCoin-Economy
 * STEP 3.3 — GMC RECOGNITION BRIDGE
 *
 * ⚠️ PURE DOMAIN LOGIC.
 * Evaluates potential for recognition (Signal).
 * DOES NOT GRANT GMC.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateGMCRecognition = evaluateGMCRecognition;
const economy_enums_1 = require("./economy.enums");
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
function evaluateGMCRecognition(context) {
    // 1. Basic Eligibility Check (e.g. Activity level)
    // For minimal bridge, we ensure at least some MCs exist (activity)
    // If strict, we might require specific MC types, but keeping generic.
    // If empty snapshot -> BELOW_THRESHOLD (no impact).
    if (!context.mcSnapshot || context.mcSnapshot.length === 0) {
        return {
            status: economy_enums_1.GMCRecognitionStatus.NOT_ELIGIBLE,
            deniedReason: economy_enums_1.GMCRecognitionDeniedReason.NO_PARTICIPANTS,
            evaluatedAt: context.now
        };
    }
    // 2. Probabilistic Evaluation (Injected Randomness)
    // Signal generation only.
    if (context.randomFactor >= RECOGNITION_THRESHOLD) {
        return {
            status: economy_enums_1.GMCRecognitionStatus.ELIGIBLE,
            trigger: economy_enums_1.GMCRecognitionTrigger.PROBABILISTIC_CHECK,
            evaluatedAt: context.now
        };
    }
    // 3. Default: Not Eligible (Ordinary outcome)
    return {
        status: economy_enums_1.GMCRecognitionStatus.NOT_ELIGIBLE,
        deniedReason: economy_enums_1.GMCRecognitionDeniedReason.BELOW_THRESHOLD,
        evaluatedAt: context.now
    };
}
