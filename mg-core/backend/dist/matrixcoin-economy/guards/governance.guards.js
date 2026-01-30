"use strict";
/**
 * Governance Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 4 — POST-ECONOMY GOVERNANCE
 *
 * ⚠️ STRICT: Blocks invalid governance evaluation.
 * Throws explicit domain errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceError = void 0;
exports.guardValidContext = guardValidContext;
exports.guardKnownDomain = guardKnownDomain;
exports.guardSnapshotIntegrity = guardSnapshotIntegrity;
const economy_enums_1 = require("../core/economy.enums");
// ============================================================================
// ERROR CLASSES
// ============================================================================
class GovernanceError extends Error {
    reason;
    constructor(reason, message) {
        super(message);
        this.reason = reason;
        this.name = 'GovernanceError';
    }
}
exports.GovernanceError = GovernanceError;
// ============================================================================
// GUARDS
// ============================================================================
/**
 * Guard: Context is Valid Structure
 */
function guardValidContext(context) {
    if (!context.userId || !context.usageContextId) {
        throw new GovernanceError(economy_enums_1.GovernanceViolationReason.DATA_INTEGRITY_ISSUE, 'Missing Critical User/ID Context');
    }
    if (!context.domain || !context.operation) {
        throw new GovernanceError(economy_enums_1.GovernanceViolationReason.DATA_INTEGRITY_ISSUE, 'Missing Domain or Operation');
    }
}
/**
 * Guard: Domain is recognized
 */
function guardKnownDomain(context) {
    const validDomains = ['STORE', 'AUCTION', 'SAFE', 'TRANSFER', 'RECOGNITION'];
    if (!validDomains.includes(context.domain)) {
        throw new GovernanceError(economy_enums_1.GovernanceViolationReason.RESTRICTED_DOMAIN, `Unknown domain: ${context.domain}`);
    }
}
/**
 * Guard: MC Snapshot Integrity
 * Ensures we are not running governance on invalid state data.
 */
function guardSnapshotIntegrity(context) {
    if (!context.mcSnapshot) {
        throw new GovernanceError(economy_enums_1.GovernanceViolationReason.DATA_INTEGRITY_ISSUE, 'MC Snapshot is missing or null');
    }
    // Deep check could go here, but minimal guard checks presence
}
