/**
 * MES Canonical Rates Configuration
 * 
 * CRITICAL RULE: This file MUST only contain raw rates and complexity coefficients.
 * NO motivation logic, NO "performance" calculations here.
 */

export interface MesRate {
    baseRate: number;      // Fixed payment per unit
    saleBonus?: number;    // Bonus for completed (sold) unit
}

export const PRODUCT_RATES: Record<string, MesRate> = {
    'PHOTO_SESSION': {
        baseRate: 500,
        saleBonus: 100
    },
    'RETOUCHING': {
        baseRate: 50,
        saleBonus: 20
    },
    'DEFAULT': {
        baseRate: 100,
        saleBonus: 0
    }
};

/**
 * Binary Quality Modifiers (PASS/FAIL)
 * Used to modify the earnings base without deleting the production event.
 */
export const QUALITY_MODIFIERS = {
    'PASS': 1.0,  // Full payment
    'FAIL': 0.5   // Half payment penalty for low quality
};

/**
 * Shift Window Configuration
 * Defines what "current shift" means for aggregation logic.
 */
export const SHIFT_CONFIG = {
    START_HOUR: 8,  // 08:00
    END_HOUR: 23,    // 23:00
};
