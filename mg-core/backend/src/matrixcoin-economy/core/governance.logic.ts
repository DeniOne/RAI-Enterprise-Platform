/**
 * Governance Logic (Pure)
 * Module 08 — MatrixCoin-Economy
 * STEP 4 — POST-ECONOMY GOVERNANCE
 * 
 * ⚠️ PURE DOMAIN LOGIC.
 * Evaluates usage against rules.
 * No side effects.
 */

import { EconomyUsageContext, GovernanceDecision } from './governance.types';
import {
    GovernanceStatus,
    GovernanceRestriction,
    GovernanceReviewLevel,
    GovernanceViolationReason
} from './economy.enums';

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
export function evaluateEconomyGovernance(context: EconomyUsageContext): GovernanceDecision {
    const NOW = context.timestamp;

    // 1. Check Volume Anomalies (Example Rule)
    // If user has excessive MC count in snapshot compared to norm?
    // We don't have historical context here (pure), so we check snapshot sum.
    const totalMC = context.mcSnapshot.reduce((acc, mc) => acc + mc.amount, 0);

    if (totalMC > SUSPICIOUS_VOLUME_THRESHOLD) {
        return {
            status: GovernanceStatus.ALLOWED_WITH_REVIEW, // Allow but flag
            restriction: GovernanceRestriction.FLAG_FOR_AUDIT,
            reviewLevel: GovernanceReviewLevel.ELEVATED,
            explanation: `Total MC volume (${totalMC}) exceeds threshold (${SUSPICIOUS_VOLUME_THRESHOLD})`,
            evaluatedAt: NOW
        };
    }

    // 2. Check Restricted Domains
    // Generally guarded, but double check logic
    if (context.domain === 'RESTRICTED_ZONE') {
        return {
            status: GovernanceStatus.DISALLOWED,
            restriction: GovernanceRestriction.BLOCK_OPERATION,
            reviewLevel: GovernanceReviewLevel.CRITICAL,
            violationReason: GovernanceViolationReason.RESTRICTED_DOMAIN,
            explanation: 'Operation in restricted zone',
            evaluatedAt: NOW
        };
    }

    // 3. Metadata Checks (e.g. frequency passed in metadata)
    if (context.metadata && (context.metadata['frequencyCount'] as number) > FREQUENCY_CAP) {
        return {
            status: GovernanceStatus.ALLOWED_WITH_REVIEW,
            restriction: GovernanceRestriction.FLAG_FOR_AUDIT,
            reviewLevel: GovernanceReviewLevel.ROUTINE,
            violationReason: GovernanceViolationReason.SUSPICIOUS_FREQUENCY,
            explanation: 'High frequency of operations detected',
            evaluatedAt: NOW
        };
    }

    // 4. Default: Allowed
    return {
        status: GovernanceStatus.ALLOWED,
        restriction: GovernanceRestriction.NONE,
        reviewLevel: GovernanceReviewLevel.NONE,
        evaluatedAt: NOW
    };
}
