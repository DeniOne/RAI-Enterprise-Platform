/**
 * Economy Integration Matrix
 * Module 08 — MatrixCoin-Economy
 * STEP 6 — INTEGRATION BOUNDARIES
 * 
 * ⚠️ STRICT PERMISSION MATRIX
 * Maps Requester -> Allowed Scope.
 * No Dynamic Permissions. Code-Level Versioned.
 */

export enum RequesterModule {
    ANALYTICS = 'ANALYTICS',
    AI_ADVISORY = 'AI_ADVISORY',
    OFS_HUMAN = 'OFS_HUMAN',
    SYSTEM_INTEGRITY = 'SYSTEM_INTEGRITY',
    UNKNOWN = 'UNKNOWN'
}

export enum IntegrationScope {
    NONE = 'NONE',
    AUDIT_AGGREGATED = 'AUDIT_AGGREGATED', // Counts, Trends
    AUDIT_FULL = 'AUDIT_FULL',             // Specific Events
    GOVERNANCE_FLAGS = 'GOVERNANCE_FLAGS', // For Review
    DECISION_READ = 'DECISION_READ'        // Checking outcomes
}

// THE MATRIX
export const IntegrationMatrix: Record<RequesterModule, readonly IntegrationScope[]> = {
    [RequesterModule.ANALYTICS]: [
        IntegrationScope.AUDIT_AGGREGATED
    ],
    [RequesterModule.AI_ADVISORY]: [
        IntegrationScope.GOVERNANCE_FLAGS // AI can see flags to suggest reviews, but NOT full audit
    ],
    [RequesterModule.OFS_HUMAN]: [
        IntegrationScope.AUDIT_FULL,
        IntegrationScope.GOVERNANCE_FLAGS,
        IntegrationScope.DECISION_READ
    ],
    [RequesterModule.SYSTEM_INTEGRITY]: [
        IntegrationScope.AUDIT_FULL,
        IntegrationScope.GOVERNANCE_FLAGS
    ],
    [RequesterModule.UNKNOWN]: []
};
