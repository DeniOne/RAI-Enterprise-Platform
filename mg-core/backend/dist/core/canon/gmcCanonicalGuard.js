"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGMCCanon = checkGMCCanon;
const canonicalViolation_1 = require("./canonicalViolation");
/**
 * GMC Canonical Guard
 *
 * This function enforces the canonical rules of GMC (Golden Matrix Coin)
 * as defined in MatrixGin v8 philosophy.
 *
 * CANONICAL RULES:
 * 1. AI cannot interfere with GMC decisions (advisory only)
 * 2. GMC cannot be granted automatically
 * 3. GMC cannot be bound to KPI or performance metrics
 * 4. GMC is recognition, not reward
 *
 * @param context - The context of the GMC operation
 * @returns CanonicalCheckResult indicating if operation is allowed
 */
function checkGMCCanon(context) {
    // RULE 1: AI cannot interfere with GMC
    if (context.source === 'AI') {
        return {
            allowed: false,
            violation: canonicalViolation_1.CanonicalViolationType.GMC_AI_INTERFERENCE,
            message: 'AI cannot grant, modify, or interfere with GMC. GMC decisions must be made by humans (Heroes Fund Committee). AI role is advisory-only.',
        };
    }
    // RULE 2: GMC cannot be granted automatically
    if (context.action === 'GMC_GRANT_AUTOMATIC' ||
        context.payload.automatic === true) {
        return {
            allowed: false,
            violation: canonicalViolation_1.CanonicalViolationType.GMC_AUTOMATION,
            message: 'GMC cannot be granted automatically. GMC is strategic recognition that requires human committee decision (Heroes Fund).',
        };
    }
    // RULE 3: GMC cannot be bound to KPI
    if (context.payload.kpiBased === true) {
        return {
            allowed: false,
            violation: canonicalViolation_1.CanonicalViolationType.GMC_KPI_BINDING,
            message: 'GMC cannot be bound to KPI or performance metrics. GMC recognizes heroic contribution (system-saving, system-building, system-transformation), not KPI achievement.',
        };
    }
    // RULE 4: CRON cannot grant GMC
    if (context.source === 'CRON' && context.action.includes('GRANT')) {
        return {
            allowed: false,
            violation: canonicalViolation_1.CanonicalViolationType.GMC_AUTOMATION,
            message: 'CRON jobs cannot grant GMC. GMC requires human committee decision.',
        };
    }
    // All checks passed
    return {
        allowed: true,
        message: 'Operation allowed under GMC canonical rules.',
    };
}
