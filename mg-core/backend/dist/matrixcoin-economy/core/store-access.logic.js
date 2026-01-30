"use strict";
/**
 * Store Access Pure Logic
 * Module 08 — MatrixCoin-Economy
 * STEP 3.1 — STORE (ACCESS LOGIC)
 *
 * ⚠️ PURE DOMAIN LOGIC.
 * No side effects. No DB.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateStoreAccess = evaluateStoreAccess;
const economy_enums_1 = require("./economy.enums");
const store_access_guards_1 = require("../guards/store-access.guards");
/**
 * Evaluates if a user can access the Store
 * Returns deterministic Decision.
 *
 * Logic:
 * 1. Checks constraints implies by context (that were not blockers)
 * 2. Filters usable MCs
 * 3. Calculates balance
 * 4. Returns ELIGIBLE if balance > 0
 */
function evaluateStoreAccess(context) {
    const { mcSnapshot, timestamp } = context;
    // 1. Calculate usable liquid balance
    // This logic relies on STEP 2 states (Active/Frozen/Expired)
    const usableMCs = mcSnapshot.filter(mc => (0, store_access_guards_1.isMCUsableForStore)(mc, timestamp));
    // 2. Sum amount
    // Reduce is deterministic
    const availableBalance = usableMCs.reduce((sum, mc) => sum + mc.amount, 0);
    // 3. Determine Status
    let status = economy_enums_1.StoreEligibilityStatus.INELIGIBLE;
    let denialReason;
    if (availableBalance > 0) {
        status = economy_enums_1.StoreEligibilityStatus.ELIGIBLE;
    }
    else {
        // Determine specific reason for 0 balance
        const hasFrozen = mcSnapshot.some(mc => mc.isFrozen);
        const hasExpired = mcSnapshot.some(mc => mc.expiresAt <= timestamp);
        const hasActive = mcSnapshot.length > 0;
        if (hasFrozen && !usableMCs.length) {
            denialReason = economy_enums_1.StoreAccessDeniedReason.ALL_MC_FROZEN;
        }
        else if (hasActive) {
            // Has MCs but none usable (e.g. Expired)
            // Or maybe just NO_ACTIVE_MC covers empty case too
            denialReason = economy_enums_1.StoreAccessDeniedReason.NO_ACTIVE_MC;
        }
        else {
            // No MCs at all
            denialReason = economy_enums_1.StoreAccessDeniedReason.NO_ACTIVE_MC;
        }
    }
    // 4. Return Decision
    return {
        status,
        denialReason,
        availableBalance,
        evaluatedAt: context.timestamp
    };
}
