/**
 * Economy Integration Contracts
 * Module 08 — MatrixCoin-Economy
 * STEP 6 — INTEGRATION BOUNDARIES
 * 
 * ⚠️ READ-ONLY CONTRACTS
 * Explicitly defined fields. No implicit domain object leakage.
 */

import { EconomyAuditEvent } from '../core/audit.types';
import { GovernanceStatus, GovernanceReviewLevel } from '../core/economy.enums';

// ============================================================================
// 1. AUDIT READ CONTRACT
// ============================================================================
export interface EconomyAuditReadContract {
    readonly eventId: string;
    readonly eventType: string;
    readonly occurredAt: Date;
    readonly actorId: string;
    // Anonymized or Specific Payload fields depending on scope?
    // For now, exposing safe base fields.
    readonly summary: string;
}

// ============================================================================
// 2. DECISION READ CONTRACT
// ============================================================================
export interface EconomyDecisionReadContract {
    readonly decisionId: string; // usually contextId
    readonly timestamp: Date;
    readonly outcome: string; // 'GRANTED', 'DENIED', 'ELIGIBLE', etc.
    readonly reason?: string;
}

// ============================================================================
// 3. GOVERNANCE READ CONTRACT
// ============================================================================
export interface EconomyGovernanceReadContract {
    readonly flagId: string;
    readonly userId: string; // ID only, no profile
    readonly reviewLevel: GovernanceReviewLevel;
    readonly status: GovernanceStatus;
    readonly flaggedAt: Date;
    readonly reason: string;
}
