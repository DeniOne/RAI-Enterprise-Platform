"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCanon = checkCanon;
const mcCanonicalGuard_1 = require("../mcCanonicalGuard");
const gmcCanonicalGuard_1 = require("../gmcCanonicalGuard");
const CanonicalViolationError_1 = require("../CanonicalViolationError");
const canonicalViolationLogger_1 = require("../canonicalViolationLogger");
/**
 * Canonical Guard Registry
 *
 * SINGLE ENTRY POINT for all MC and GMC canonical checks.
 *
 * This registry:
 * - Routes to appropriate guard (MC or GMC)
 * - Automatically logs violations
 * - Automatically throws CanonicalViolationError
 * - Ensures consistent enforcement
 *
 * CRITICAL: Services MUST use this registry.
 * Direct calls to checkMCCanon or checkGMCCanon are FORBIDDEN.
 *
 * @param params - Unified canonical check parameters
 * @throws CanonicalViolationError if canonical rules are violated
 */
async function checkCanon(params) {
    const { canon, action, source, payload, userId } = params;
    let checkResult;
    // Route to appropriate guard
    if (canon === 'MC') {
        const mcContext = {
            action,
            source,
            payload,
        };
        checkResult = (0, mcCanonicalGuard_1.checkMCCanon)(mcContext);
    }
    else if (canon === 'GMC') {
        const gmcContext = {
            action,
            source,
            payload,
        };
        checkResult = (0, gmcCanonicalGuard_1.checkGMCCanon)(gmcContext);
    }
    else {
        throw new Error(`Unknown canon type: ${canon}`);
    }
    // If check failed, log and throw
    if (!checkResult.allowed) {
        // Log violation to database
        await canonicalViolationLogger_1.CanonicalViolationLogger.log(canon, checkResult.violation, source, action, payload, userId);
        // Throw error to block operation
        throw new CanonicalViolationError_1.CanonicalViolationError(canon, checkResult.violation, checkResult.message);
    }
    // Check passed - operation allowed
    // No action needed, service can proceed
}
