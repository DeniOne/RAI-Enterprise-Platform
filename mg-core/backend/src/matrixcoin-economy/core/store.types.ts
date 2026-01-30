/**
 * Store Eligibility Types
 * Module 08 — MatrixCoin-Economy
 * PHASE 0 — STORE (ELIGIBILITY LOGIC)
 * 
 * ⚠️ CANONICAL: Defines inputs/outputs for Store Eligibility Logic.
 * ⚠️ ELIGIBILITY ≠ PURCHASE
 * NO Store Item logic here. Only ELIGIBILITY (can user access Store?).
 */

import { MCState } from './mc.types';
import { StoreEligibilityStatus, StoreAccessDeniedReason } from './economy.enums';

// PHASE 0: Переименование StoreAccessDeniedReason → StoreEligibilityDeniedReason
// Алиас для обратной совместимости
export type StoreEligibilityDeniedReason = StoreAccessDeniedReason;

/**
 * Context required to evaluate Store Eligibility
 * Must be pure data.
 */
export interface StoreEligibilityContext {
    /** User requesting access */
    readonly userId: string;

    /** 
     * Snapshot of user's MC wallet 
     * MUST be fresh from DB (read-only)
     */
    readonly mcSnapshot: readonly MCState[];

    /** Current server time */
    readonly timestamp: Date;

    /** 
     * Is system in maintenance mode? 
     * Passed from config/flag
     */
    readonly isSystemMaintenance: boolean;

    /**
     * Is user explicitly restricted?
     * Passed from User module / ACL
     */
    readonly isUserRestricted: boolean;
}

/**
 * Result of Store Eligibility evaluation
 * Deterministic output.
 */
export interface StoreEligibilityDecision {
    /** Can the user enter/participate? */
    readonly status: StoreEligibilityStatus;

    /** If denied, why? */
    readonly denialReason?: StoreEligibilityDeniedReason;

    /** 
     * Aggregated available MC for Store 
     * (Calculated from snapshot, excluding Frozen/Expired)
     */
    readonly availableBalance: number;

    /** Timestamp of decision */
    readonly evaluatedAt: Date;
}

// PHASE 0: Алиасы для обратной совместимости
// Эти типы будут удалены после полного рефакторинга
export type StoreAccessContext = StoreEligibilityContext;
export type StoreAccessDecision = StoreEligibilityDecision;
