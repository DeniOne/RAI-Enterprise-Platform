"use strict";
/**
 * MES Canonical Rates Configuration
 *
 * CRITICAL RULE: This file MUST only contain raw rates and complexity coefficients.
 * NO motivation logic, NO "performance" calculations here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIFT_CONFIG = exports.QUALITY_MODIFIERS = exports.PRODUCT_RATES = void 0;
exports.PRODUCT_RATES = {
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
exports.QUALITY_MODIFIERS = {
    'PASS': 1.0, // Full payment
    'FAIL': 0.5 // Half payment penalty for low quality
};
/**
 * Shift Window Configuration
 * Defines what "current shift" means for aggregation logic.
 */
exports.SHIFT_CONFIG = {
    START_HOUR: 8, // 08:00
    END_HOUR: 23, // 23:00
};
