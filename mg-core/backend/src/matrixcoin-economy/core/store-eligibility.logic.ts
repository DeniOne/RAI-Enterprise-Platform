/**
 * Store Eligibility Pure Logic
 * Module 08 — MatrixCoin-Economy
 * PHASE 0 — STORE (ELIGIBILITY LOGIC)
 * 
 * ⚠️ PURE DOMAIN LOGIC.
 * No side effects. No DB.
 */

import {
    StoreEligibilityContext,
    StoreEligibilityDecision,
    StoreEligibilityDeniedReason
} from './store.types';
import {
    StoreEligibilityStatus,
    StoreAccessDeniedReason
} from './economy.enums';
import { isMCUsableForStore } from '../guards/store-eligibility.guards';

/**
 * Evaluates if a user is eligible to access the Store
 * Returns deterministic Decision.
 * 
 * Logic:
 * 1. Checks constraints implied by context (that were not blockers)
 * 2. Filters usable MCs
 * 3. Calculates balance
 * 4. Returns ELIGIBLE if balance > 0
 */
export function evaluateStoreEligibility(context: StoreEligibilityContext): StoreEligibilityDecision {
    const { mcSnapshot, timestamp } = context;

    // 1. Calculate usable liquid balance
    // This logic relies on STEP 2 states (Active/Frozen/Expired)
    const usableMCs = mcSnapshot.filter(mc => isMCUsableForStore(mc, timestamp));

    // 2. Sum amount
    // Reduce is deterministic
    const availableBalance = usableMCs.reduce((sum, mc) => sum + mc.amount, 0);

    // 3. Determine Status
    let status = StoreEligibilityStatus.INELIGIBLE;
    let denialReason: StoreEligibilityDeniedReason | undefined;

    if (availableBalance > 0) {
        status = StoreEligibilityStatus.ELIGIBLE;
    } else {
        // Determine specific reason for 0 balance
        const hasFrozen = mcSnapshot.some(mc => mc.isFrozen);
        const hasExpired = mcSnapshot.some(mc => mc.expiresAt <= timestamp);
        const hasActive = mcSnapshot.length > 0;

        if (hasFrozen && !usableMCs.length) {
            denialReason = StoreAccessDeniedReason.ALL_MC_FROZEN;
        } else if (hasActive) {
            // Has MCs but none usable (e.g. Expired)
            // Or maybe just NO_ACTIVE_MC covers empty case too
            denialReason = StoreAccessDeniedReason.NO_ACTIVE_MC;
        } else {
            // No MCs at all
            denialReason = StoreAccessDeniedReason.NO_ACTIVE_MC;
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
