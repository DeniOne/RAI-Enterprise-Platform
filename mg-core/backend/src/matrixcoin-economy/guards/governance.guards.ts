/**
 * Governance Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 4 — POST-ECONOMY GOVERNANCE
 * 
 * ⚠️ STRICT: Blocks invalid governance evaluation.
 * Throws explicit domain errors.
 */

import { EconomyUsageContext } from '../core/governance.types';
import { GovernanceViolationReason } from '../core/economy.enums';

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class GovernanceError extends Error {
    constructor(
        public readonly reason: GovernanceViolationReason,
        message: string
    ) {
        super(message);
        this.name = 'GovernanceError';
    }
}

// ============================================================================
// GUARDS
// ============================================================================

/**
 * Guard: Context is Valid Structure
 */
export function guardValidContext(context: EconomyUsageContext): void {
    if (!context.userId || !context.usageContextId) {
        throw new GovernanceError(
            GovernanceViolationReason.DATA_INTEGRITY_ISSUE,
            'Missing Critical User/ID Context'
        );
    }

    if (!context.domain || !context.operation) {
        throw new GovernanceError(
            GovernanceViolationReason.DATA_INTEGRITY_ISSUE,
            'Missing Domain or Operation'
        );
    }
}

/**
 * Guard: Domain is recognized
 */
export function guardKnownDomain(context: EconomyUsageContext): void {
    const validDomains = ['STORE', 'AUCTION', 'SAFE', 'TRANSFER', 'RECOGNITION'];
    if (!validDomains.includes(context.domain)) {
        throw new GovernanceError(
            GovernanceViolationReason.RESTRICTED_DOMAIN,
            `Unknown domain: ${context.domain}`
        );
    }
}

/**
 * Guard: MC Snapshot Integrity
 * Ensures we are not running governance on invalid state data.
 */
export function guardSnapshotIntegrity(context: EconomyUsageContext): void {
    if (!context.mcSnapshot) {
        throw new GovernanceError(
            GovernanceViolationReason.DATA_INTEGRITY_ISSUE,
            'MC Snapshot is missing or null'
        );
    }
    // Deep check could go here, but minimal guard checks presence
}
