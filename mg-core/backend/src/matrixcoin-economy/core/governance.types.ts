/**
 * Governance Core Types
 * Module 08 — MatrixCoin-Economy
 * STEP 4 — POST-ECONOMY GOVERNANCE
 * 
 * ⚠️ CANONICAL: Types for Governance Layer.
 * Defines evaluation context and decision structure.
 */

import { MCState } from './mc.types';
import {
    GovernanceStatus,
    GovernanceRestriction,
    GovernanceReviewLevel,
    GovernanceViolationReason
} from './economy.enums';

/**
 * Context required to evaluate Governance Rules
 * Must be pure data snapshot.
 */
export interface EconomyUsageContext {
    /** Unique ID for this usage attempt/event */
    readonly usageContextId: string;

    /** User attempting the action */
    readonly userId: string;

    /** 
     * Target Domain of usage 
     * e.g., 'STORE', 'AUCTION', 'TRANSFER', 'EXTERNAL_INTEGRATION'
     */
    readonly domain: string;

    /** 
     * Specific Operation being attempted 
     * e.g., 'SPEND', 'FREEZE', 'PARTICIPATE'
     */
    readonly operation: string;

    /** 
     * MC Snapshot involved in the operation 
     * Read-only state.
     */
    readonly mcSnapshot: readonly MCState[];

    /** 
     * Timestamp of the attempt
     */
    readonly timestamp: Date;

    /**
     * Optional metadata for specific checks
     * e.g. target volume, frequency count
     */
    readonly metadata?: Record<string, unknown>;
}

/**
 * Result of Governance Evaluation
 */
export interface GovernanceDecision {
    /** Status of the decision */
    readonly status: GovernanceStatus;

    /** Restriction applied (if any) */
    readonly restriction: GovernanceRestriction;

    /** Review level required (if any) */
    readonly reviewLevel: GovernanceReviewLevel;

    /** Violation reason (if DISALLOWED or FLAGGED) */
    readonly violationReason?: GovernanceViolationReason;

    /** Human-readable explanation */
    readonly explanation?: string;

    /** time of decision */
    readonly evaluatedAt: Date;
}
