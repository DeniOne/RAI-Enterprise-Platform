"use strict";
/**
 * Governance Logic (Pure)
 * Module 08 — MatrixCoin-Economy
 * STEP 4 — POST-ECONOMY GOVERNANCE
 *
 * ⚠️ PURE DOMAIN LOGIC.
 * Evaluates usage against rules.
 * No side effects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEconomyGovernance = evaluateEconomyGovernance;
const economy_enums_1 = require("./economy.enums");
// ============================================================================
// CONSTANTS (Governance Thresholds)
// ============================================================================
const SUSPICIOUS_VOLUME_THRESHOLD = 1000; // Example
const FREQUENCY_CAP = 10; // Simple placeholder
// ============================================================================
// PURE LOGIC
// ============================================================================
/**
 * Evaluate Economy Governance Rules
 */
function evaluateEconomyGovernance(context) {
    const NOW = context.timestamp;
    // 1. Check Volume Anomalies (Example Rule)
    // If user has excessive MC count in snapshot compared to norm?
    // We don't have historical context here (pure), so we check snapshot sum.
    const totalMC = context.mcSnapshot.reduce((acc, mc) => acc + mc.amount, 0);
    if (totalMC > SUSPICIOUS_VOLUME_THRESHOLD) {
        return {
            status: economy_enums_1.GovernanceStatus.ALLOWED_WITH_REVIEW, // Allow but flag
            restriction: economy_enums_1.GovernanceRestriction.FLAG_FOR_AUDIT,
            reviewLevel: economy_enums_1.GovernanceReviewLevel.ELEVATED,
            explanation: `Total MC volume (${totalMC}) exceeds threshold (${SUSPICIOUS_VOLUME_THRESHOLD})`,
            evaluatedAt: NOW
        };
    }
    // 2. Check Restricted Domains
    // Generally guarded, but double check logic
    if (context.domain === 'RESTRICTED_ZONE') {
        return {
            status: economy_enums_1.GovernanceStatus.DISALLOWED,
            restriction: economy_enums_1.GovernanceRestriction.BLOCK_OPERATION,
            reviewLevel: economy_enums_1.GovernanceReviewLevel.CRITICAL,
            violationReason: economy_enums_1.GovernanceViolationReason.RESTRICTED_DOMAIN,
            explanation: 'Operation in restricted zone',
            evaluatedAt: NOW
        };
    }
    // 3. Metadata Checks (e.g. frequency passed in metadata)
    if (context.metadata && context.metadata['frequencyCount'] > FREQUENCY_CAP) {
        return {
            status: economy_enums_1.GovernanceStatus.ALLOWED_WITH_REVIEW,
            restriction: economy_enums_1.GovernanceRestriction.FLAG_FOR_AUDIT,
            reviewLevel: economy_enums_1.GovernanceReviewLevel.ROUTINE,
            violationReason: economy_enums_1.GovernanceViolationReason.SUSPICIOUS_FREQUENCY,
            explanation: 'High frequency of operations detected',
            evaluatedAt: NOW
        };
    }
    // 4. Default: Allowed
    return {
        status: economy_enums_1.GovernanceStatus.ALLOWED,
        restriction: economy_enums_1.GovernanceRestriction.NONE,
        reviewLevel: economy_enums_1.GovernanceReviewLevel.NONE,
        evaluatedAt: NOW
    };
}
