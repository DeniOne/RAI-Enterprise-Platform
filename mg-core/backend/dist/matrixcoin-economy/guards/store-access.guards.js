"use strict";
/**
 * Store Access Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 3.1 — STORE (ACCESS LOGIC)
 *
 * ⚠️ STRICT: Blocks access if invariants fail.
 * Throws explicit domain errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreAccessError = void 0;
exports.guardSystemOperational = guardSystemOperational;
exports.guardUserNotRestricted = guardUserNotRestricted;
exports.guardValidContext = guardValidContext;
exports.isMCUsableForStore = isMCUsableForStore;
const economy_enums_1 = require("../core/economy.enums");
const economy_enums_2 = require("../core/economy.enums");
// ============================================================================
// ERROR CLASSES
// ============================================================================
class StoreAccessError extends Error {
    reason;
    constructor(reason, message) {
        super(message);
        this.reason = reason;
        this.name = 'StoreAccessError';
    }
}
exports.StoreAccessError = StoreAccessError;
// ============================================================================
// GUARDS
// ============================================================================
/**
 * Guard: System is operational
 */
function guardSystemOperational(isMaintenance) {
    if (isMaintenance) {
        throw new StoreAccessError(economy_enums_1.StoreAccessDeniedReason.SYSTEM_MAINTENANCE, 'System is in maintenance mode. Store access denied.');
    }
}
/**
 * Guard: User is not restricted
 */
function guardUserNotRestricted(isRestricted) {
    if (isRestricted) {
        throw new StoreAccessError(economy_enums_1.StoreAccessDeniedReason.USER_RESTRICTED, 'User is restricted from accessing Store.');
    }
}
/**
 * Guard: Context is valid
 */
function guardValidContext(context) {
    if (!context.userId || !context.mcSnapshot) {
        throw new StoreAccessError(economy_enums_1.StoreAccessDeniedReason.INVALID_CONTEXT, 'Invalid store access context: Missing userId or mcSnapshot.');
    }
}
/**
 * Guard: At least one MC is valid required?
 * No, having 0 MC is valid state, just INELIGIBLE result, not Error.
 * Error guards are for INVARIANTS/BLOCKERS.
 *
 * But checking distinct MC validity (if passed) for specific Item purchase?
 * Step 3.1 is "ACCESS LOGIC ONLY" -> "Is this user eligible to participate?".
 *
 * So, if user has 0 valid MC, they are effectively INELIGIBLE but it's not a System Error.
 * However, prompt says "Guards that BLOCK access if... MC is frozen in Safe".
 *
 * If I have 10 MC, and 10 are Frozen -> INELIGIBLE (Reason: ALL_MC_FROZEN).
 * Is this a Guard (throw) or Logic (return Deny)?
 * Prompt: "Guards that BLOCK access if... MC state is invalid... MC is frozen in Safe".
 * And "Pure function... return ALLOW or DENY".
 *
 * Usually Guards protect against Illegal States/Operations.
 * "All Frozen" is a legal state, just results in Denial.
 * "MC state is invalid" (e.g. unknown enum) -> Guard Violation.
 *
 * I will implement helper validator `isValidMCForStore(mc)` which returns boolean,
 * and Logic will use it to count available balance.
 *
 * BUT strict guards like `guardSystemOperational` throw.
 */
/**
 * Validates individual MC for Store usage eligibility
 * Returns true if usable, false if not (e.g. Frozen/Expired).
 * DOES NOT THROW. Used by Logic to filter.
 */
function isMCUsableForStore(mc, now) {
    // Must be ACTIVE
    if (mc.lifecycleState !== economy_enums_2.MCLifecycleState.ACTIVE)
        return false;
    // Must not be Frozen
    if (mc.isFrozen)
        return false;
    // Must not be Expired
    if (mc.expiresAt <= now)
        return false;
    return true;
}
