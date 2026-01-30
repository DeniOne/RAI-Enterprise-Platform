/**
 * Audit Event Types — MatrixCoin-Economy
 * Module 08
 * STEP 2.3 — AUDIT STRUCTURE (NO STORAGE)
 * 
 * ⚠️ CANONICAL: Based on STEP-2-STATE-LIFECYCLE.md Section 3.4
 * 
 * This module defines ONLY:
 * - Audit event shapes (interfaces)
 * - Mandatory fields
 * - Event type definitions
 * 
 * NO database writes.
 * NO persistence logic.
 * NO side effects.
 */

import {
    MCLifecycleState,
    MCOperationType,
    StoreEligibilityStatus,
    StoreAccessDeniedReason,
    AuctionEventStatus,
    AuctionParticipationOutcome,
    AuctionDeniedReason,
    GMCRecognitionStatus,
    GMCRecognitionDeniedReason,
    GMCRecognitionTrigger,
    GovernanceStatus,
    GovernanceRestriction,
    GovernanceReviewLevel,
    GovernanceViolationReason
} from './economy.enums';
import { MCState } from './mc.types';
import { MCSourceType } from './mc.types';
import { GMCRecognitionCategory } from './gmc.types';

// ============================================================================
// AUDIT EVENT TYPES
// ============================================================================

/**
 * All audit event types in MatrixCoin-Economy
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 3.4
 */
export enum AuditEventType {
    /** MC record created */
    MC_CREATED = 'MC_CREATED',

    /** MC state transition (ACTIVE → FROZEN, etc.) */
    MC_TRANSITION = 'MC_TRANSITION',

    /** MC split into multiple records */
    MC_SPLIT = 'MC_SPLIT',

    /** GMC recognized to user */
    GMC_RECOGNIZED = 'GMC_RECOGNIZED',

    /** Administrative correction (exceptional rollback) */
    /** Administrative correction (exceptional rollback) */
    ADMINISTRATIVE_CORRECTION = 'ADMINISTRATIVE_CORRECTION',

    /** Store Access evaluated (Access Attempt) */
    STORE_ACCESS_EVALUATED = 'STORE_ACCESS_EVALUATED',

    /** Store Access Denied (Explicit Denial) */
    STORE_ACCESS_DENIED = 'STORE_ACCESS_DENIED',

    /** PHASE 0: Store Eligibility evaluated (Eligibility Check) */
    STORE_ELIGIBILITY_EVALUATED = 'STORE_ELIGIBILITY_EVALUATED',

    /** PHASE 0: Store Eligibility Denied (Explicit Denial) */
    STORE_ELIGIBILITY_DENIED = 'STORE_ELIGIBILITY_DENIED',

    /** Auction Event Opened */
    AUCTION_OPENED = 'AUCTION_OPENED',

    /** Auction Participation Recorded (Result) */
    AUCTION_PARTICIPATION = 'AUCTION_PARTICIPATION',

    /** Auction Participation Denied */
    AUCTION_DENIED = 'AUCTION_DENIED',

    /** Auction Event Closed */
    AUCTION_CLOSED = 'AUCTION_CLOSED',

    /** GMC Recognition Evaluated (Bridge Check) */
    GMC_RECOGNITION_EVALUATED = 'GMC_RECOGNITION_EVALUATED',

    /** GMC Recognition Flagged (Signal) */
    GMC_RECOGNITION_FLAGGED = 'GMC_RECOGNITION_FLAGGED',

    /** GMC Recognition Denied */
    GMC_RECOGNITION_DENIED = 'GMC_RECOGNITION_DENIED',

    /** Governance Rule Evaluated */
    GOVERNANCE_EVALUATED = 'GOVERNANCE_EVALUATED',

    /** Governance Flag Raised (Review Required) */
    GOVERNANCE_FLAGGED = 'GOVERNANCE_FLAGGED',

    /** Governance Violation Detected (Blocked) */
    GOVERNANCE_VIOLATION = 'GOVERNANCE_VIOLATION',
}

// ============================================================================
// BASE AUDIT EVENT
// ============================================================================

/**
 * Base audit event — common fields for ALL audit events
 * 
 * MANDATORY FIELDS (MC-INV-013):
 * - Every change MUST be logged
 * - Every log MUST have these fields
 */
export interface BaseAuditEvent {
    /** Unique event ID (UUID) */
    readonly eventId: string;

    /** Event type discriminator */
    readonly eventType: AuditEventType;

    /** 
     * Timestamp of the event (ISO 8601)
     * MANDATORY: No event without timestamp
     */
    readonly timestamp: Date;

    /** 
     * Actor who initiated the event
     * MANDATORY: Must be human for MC/GMC operations
     */
    readonly actorId: string;

    /** 
     * Actor type (for audit trail)
     * MANDATORY: Must be 'HUMAN' for MC/GMC operations
     */
    readonly actorType: 'HUMAN' | 'SYSTEM' | 'ADMIN';

    /** 
     * Correlation ID for request tracing
     * Links related events together
     */
    readonly correlationId?: string;

    /**
     * Session ID if applicable
     */
    readonly sessionId?: string;

    /**
     * IP address if applicable (for security audit)
     */
    readonly ipAddress?: string;
}

// ============================================================================
// MC CREATED EVENT
// ============================================================================

/**
 * Audit event for MC creation
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 3.4 — "Создание MC"
 */
export interface MCAuditEventCreated extends BaseAuditEvent {
    readonly eventType: AuditEventType.MC_CREATED;

    /** MC record ID */
    readonly mcId: string;

    /** Owner user ID */
    readonly userId: string;

    /** Amount of MC created */
    readonly amount: number;

    /** When MC was issued */
    readonly issuedAt: Date;

    /** When MC expires */
    readonly expiresAt: Date;

    /** Source type (MANUAL_GRANT, EVENT_PARTICIPATION, PEER_TRANSFER) */
    readonly sourceType: MCSourceType;

    /** Source reference ID */
    readonly sourceId: string;

    /** Initial lifecycle state (always ACTIVE) */
    readonly initialState: MCLifecycleState.ACTIVE;
}

// ============================================================================
// MC TRANSITION EVENT
// ============================================================================

/**
 * Audit event for MC state transition
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 3.4 — "Transition"
 */
export interface MCAuditEventTransition extends BaseAuditEvent {
    readonly eventType: AuditEventType.MC_TRANSITION;

    /** MC record ID */
    readonly mcId: string;

    /** State before transition */
    readonly fromState: MCLifecycleState;

    /** State after transition */
    readonly toState: MCLifecycleState;

    /** Operation that triggered transition */
    readonly operation: MCOperationType;

    /** 
     * Reason for transition
     * Required for audit trail
     */
    readonly reason: TransitionReason;

    /**
     * Spend target if operation is SPEND
     * Format: "STORE:<item_id>" or "AUCTION:<event_id>"
     */
    readonly spendTarget?: string;
}

/**
 * Transition reason types
 */
export type TransitionReason =
    | 'USER_FREEZE'           // User froze MC in Safe
    | 'USER_UNFREEZE'         // User unfroze MC from Safe
    | 'NATURAL_DECAY'         // MC expired (not punishment)
    | 'USER_SPEND_STORE'      // User spent MC in Store
    | 'USER_SPEND_AUCTION'    // User spent MC in Auction
    | 'USER_TRANSFER'         // User transferred MC to peer
    | 'ADMIN_CORRECTION';     // Administrative correction

// ============================================================================
// MC SPLIT EVENT
// ============================================================================

/**
 * Audit event for MC split
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2 — EC-FRZ-001
 * Ref: MC-INV-032 — Split логируется как событие MC_SPLIT
 */
export interface MCAuditEventSplit extends BaseAuditEvent {
    readonly eventType: AuditEventType.MC_SPLIT;

    /** Original MC record ID (parent) */
    readonly originalMcId: string;

    /** New MC record IDs (children) */
    readonly newMcIds: readonly string[];

    /** Original amount before split */
    readonly originalAmount: number;

    /** New amounts after split */
    readonly newAmounts: readonly number[];

    /** Reason for split */
    readonly reason: 'PARTIAL_FREEZE' | 'PARTIAL_SPEND';

    /**
     * Verification that metadata was preserved (MC-INV-031)
     */
    readonly metadataPreserved: {
        readonly issuedAt: Date;
        readonly sourceType: MCSourceType;
        readonly sourceId: string;
        readonly expiresAt: Date;
    };
}

// ============================================================================
// GMC RECOGNIZED EVENT
// ============================================================================

/**
 * Audit event for GMC recognition
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 3.4 — "GMC Recognition"
 */
export interface GMCAuditEventRecognized extends BaseAuditEvent {
    readonly eventType: AuditEventType.GMC_RECOGNIZED;

    /** GMC record ID */
    readonly gmcId: string;

    /** User who received recognition */
    readonly userId: string;

    /** Amount of GMC recognized */
    readonly amount: number;

    /** Recognition category */
    readonly category: GMCRecognitionCategory;

    /** 
     * Justification for recognition
     * MANDATORY: Minimum 50 characters (GMC-INV-003)
     */
    readonly justification: string;

    /** 
     * Who recognized (human ID)
     * MANDATORY: Cannot be AI (GMC-INV-002)
     */
    readonly recognizedBy: string;
}

// ============================================================================
// ADMINISTRATIVE CORRECTION EVENT
// ============================================================================

/**
 * Audit event for administrative correction
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 3.4 — "Exceptional Rollback"
 * 
 * ⚠️ EXCEPTIONAL: Only for system errors or fraud
 * - Requires written justification
 * - Does NOT create precedent for automatic rollback
 */
export interface AuditEventAdministrativeCorrection extends BaseAuditEvent {
    readonly eventType: AuditEventType.ADMINISTRATIVE_CORRECTION;

    /** Type of entity being corrected */
    readonly entityType: 'MC' | 'GMC';

    /** Entity ID being corrected */
    readonly entityId: string;

    /** Action taken */
    readonly correctionAction: CorrectionAction;

    /** Previous state/value before correction */
    readonly previousValue: unknown;

    /** New state/value after correction */
    readonly newValue: unknown;

    /**
     * Written justification (MANDATORY)
     * Must explain why administrative action was necessary
     */
    readonly justification: string;

    /**
     * Approval chain — who approved this correction
     * MANDATORY for any administrative action
     */
    readonly approvalChain: readonly ApprovalRecord[];

    /**
     * Is this a rollback?
     */
    readonly isRollback: boolean;

    /**
     * Original event ID if this is a correction of a previous event
     */
    readonly relatedEventId?: string;
}

/**
 * Approval record for administrative actions
 */
export interface ApprovalRecord {
    readonly approverId: string;
    readonly approverRole: string;
    readonly approvedAt: Date;
    readonly notes?: string;
}

/**
 * Types of administrative corrections
 */
export type CorrectionAction =
    | 'STATE_ROLLBACK'        // Rollback state transition
    | 'AMOUNT_ADJUSTMENT'     // Adjust MC/GMC amount
    | 'EXPIRATION_ADJUSTMENT' // Adjust expiration date
    | 'VOID_TRANSACTION'      // Void a transaction
    | 'DATA_CORRECTION';      // Correct data error

// ============================================================================
// STORE ACCESS AUDIT EVENTS
// ============================================================================

/**
 * Event: User attempted to access Store, and access was evaluated.
 * Result can be ELIGIBLE or INELIGIBLE.
 */
export interface StoreAccessEvaluatedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.STORE_ACCESS_EVALUATED;
    readonly userId: string;
    readonly snapshotBalance: number;
    readonly decision: StoreEligibilityStatus;
    readonly denialReason?: StoreAccessDeniedReason;
    readonly evaluatedAt: Date;
}

/**
 * Event: User was explicitly denied access to Store.
 * Used for security monitoring or specific rejection handling.
 */
export interface StoreAccessDeniedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.STORE_ACCESS_DENIED;
    readonly userId: string;
    readonly denialReason: StoreAccessDeniedReason;
    readonly attemptTimestamp: Date;
}

// ============================================================================
// AUCTION AUDIT EVENTS
// ============================================================================

export interface AuctionOpenedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.AUCTION_OPENED;
    readonly auctionEventId: string;
    readonly scheduledEndsAt: Date;
}

export interface AuctionClosedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.AUCTION_CLOSED;
    readonly auctionEventId: string;
    readonly actualEndsAt: Date;
    readonly finalStatus: AuctionEventStatus;
}

export interface AuctionParticipationEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.AUCTION_PARTICIPATION;
    readonly auctionEventId: string;
    readonly userId: string;
    readonly mcSnapshot: readonly MCState[]; // REQUIRED by prompt
    readonly outcome: AuctionParticipationOutcome;
    readonly mcConsumedIds: readonly string[];
}

export interface AuctionDeniedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.AUCTION_DENIED;
    readonly auctionEventId: string;
    readonly userId: string;
    readonly denialReason: AuctionDeniedReason;
    readonly mcSnapshot: readonly MCState[]; // Context for denial
}

// ============================================================================
// GMC RECOGNITION BRIDGE AUDIT EVENTS
// ============================================================================

export interface GMCRecognitionEvaluatedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.GMC_RECOGNITION_EVALUATED;
    readonly auctionEventId: string;
    readonly participantId: string;
    readonly mcSnapshot: readonly MCState[];
    readonly status: GMCRecognitionStatus;
    readonly evaluatedAt: Date;
}

export interface GMCRecognitionFlaggedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.GMC_RECOGNITION_FLAGGED;
    readonly auctionEventId: string;
    readonly participantId: string;
    readonly mcSnapshot: readonly MCState[];
    readonly trigger: GMCRecognitionTrigger;
    readonly flaggedAt: Date;
}

export interface GMCRecognitionDeniedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.GMC_RECOGNITION_DENIED;
    readonly auctionEventId: string;
    readonly participantId: string;
    readonly mcSnapshot: readonly MCState[];
    readonly denialReason: GMCRecognitionDeniedReason;
    readonly deniedAt: Date;
}

// ============================================================================
// GOVERNANCE LAYER AUDIT EVENTS
// ============================================================================

export interface GovernanceEvaluatedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.GOVERNANCE_EVALUATED;
    readonly usageContextId: string;
    readonly userId: string;
    readonly domain: string;
    readonly status: GovernanceStatus;
    readonly evaluatedAt: Date;
}

export interface GovernanceFlaggedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.GOVERNANCE_FLAGGED;
    readonly usageContextId: string;
    readonly userId: string;
    readonly domain: string;
    readonly reviewLevel: GovernanceReviewLevel;
    readonly reason: string; // Human readable
    readonly flaggedAt: Date;
}

export interface GovernanceViolationEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.GOVERNANCE_VIOLATION;
    readonly usageContextId: string;
    readonly userId: string;
    readonly domain: string;
    readonly violationReason: GovernanceViolationReason;
    readonly restriction: GovernanceRestriction;
    readonly detectedAt: Date;
}

// ============================================================================
// UNION TYPE FOR ALL AUDIT EVENTS
// ============================================================================

/**
 * Union type of all audit events
 */
export type EconomyAuditEvent =
    | MCAuditEventCreated
    | MCAuditEventTransition
    | MCAuditEventSplit
    | GMCAuditEventRecognized
    | GMCAuditEventRecognized
    | AuditEventAdministrativeCorrection
    | StoreAccessEvaluatedEvent
    | StoreAccessDeniedEvent
    | AuctionOpenedEvent
    | AuctionParticipationEvent
    | AuctionDeniedEvent
    | AuctionClosedEvent
    | GMCRecognitionEvaluatedEvent
    | GMCRecognitionFlaggedEvent
    | GMCRecognitionDeniedEvent
    | GovernanceEvaluatedEvent
    | GovernanceFlaggedEvent
    | GovernanceViolationEvent;

// ============================================================================
// AUDIT EVENT FACTORY FUNCTIONS (PURE, NO SIDE EFFECTS)
// ============================================================================

/**
 * Create base audit event fields
 * Pure function — NO side effects
 */
export function createBaseAuditEvent(
    eventType: AuditEventType,
    actorId: string,
    actorType: 'HUMAN' | 'SYSTEM' | 'ADMIN',
    correlationId?: string
): Omit<BaseAuditEvent, 'eventId'> {
    return {
        eventType,
        timestamp: new Date(),
        actorId,
        actorType,
        correlationId,
    };
}

/**
 * Validate that audit event has all mandatory fields
 * Throws if validation fails
 */
export function validateAuditEvent(event: BaseAuditEvent): void {
    if (!event.eventId) {
        throw new Error('[AUDIT-001] Audit event must have eventId');
    }
    if (!event.eventType) {
        throw new Error('[AUDIT-002] Audit event must have eventType');
    }
    if (!event.timestamp) {
        throw new Error('[AUDIT-003] Audit event must have timestamp');
    }
    if (!event.actorId) {
        throw new Error('[AUDIT-004] Audit event must have actorId');
    }
    if (!event.actorType) {
        throw new Error('[AUDIT-005] Audit event must have actorType');
    }
}

/**
 * Validate MC created event mandatory fields
 */
export function validateMCCreatedEvent(event: MCAuditEventCreated): void {
    validateAuditEvent(event);

    if (!event.mcId) {
        throw new Error('[AUDIT-MC-001] MC created event must have mcId');
    }
    if (!event.userId) {
        throw new Error('[AUDIT-MC-002] MC created event must have userId');
    }
    if (event.amount <= 0) {
        throw new Error('[AUDIT-MC-003] MC created event must have positive amount');
    }
    if (!event.issuedAt) {
        throw new Error('[AUDIT-MC-004] MC created event must have issuedAt');
    }
    if (!event.expiresAt) {
        throw new Error('[AUDIT-MC-005] MC created event must have expiresAt');
    }
    if (!event.sourceType) {
        throw new Error('[AUDIT-MC-006] MC created event must have sourceType');
    }
    if (!event.sourceId) {
        throw new Error('[AUDIT-MC-007] MC created event must have sourceId');
    }
}

/**
 * Validate MC transition event mandatory fields
 */
export function validateMCTransitionEvent(event: MCAuditEventTransition): void {
    validateAuditEvent(event);

    if (!event.mcId) {
        throw new Error('[AUDIT-MC-010] MC transition event must have mcId');
    }
    if (!event.fromState) {
        throw new Error('[AUDIT-MC-011] MC transition event must have fromState');
    }
    if (!event.toState) {
        throw new Error('[AUDIT-MC-012] MC transition event must have toState');
    }
    if (!event.operation) {
        throw new Error('[AUDIT-MC-013] MC transition event must have operation');
    }
    if (!event.reason) {
        throw new Error('[AUDIT-MC-014] MC transition event must have reason');
    }
}

/**
 * Validate GMC recognized event mandatory fields
 */
export function validateGMCRecognizedEvent(event: GMCAuditEventRecognized): void {
    validateAuditEvent(event);

    if (!event.gmcId) {
        throw new Error('[AUDIT-GMC-001] GMC recognized event must have gmcId');
    }
    if (!event.userId) {
        throw new Error('[AUDIT-GMC-002] GMC recognized event must have userId');
    }
    if (event.amount <= 0) {
        throw new Error('[AUDIT-GMC-003] GMC recognized event must have positive amount');
    }
    if (!event.category) {
        throw new Error('[AUDIT-GMC-004] GMC recognized event must have category');
    }
    if (!event.justification || event.justification.length < 50) {
        throw new Error('[AUDIT-GMC-005] GMC recognized event must have justification (min 50 chars)');
    }
    if (!event.recognizedBy) {
        throw new Error('[AUDIT-GMC-006] GMC recognized event must have recognizedBy');
    }
}

/**
 * Validate administrative correction event mandatory fields
 */
export function validateAdministrativeCorrectionEvent(
    event: AuditEventAdministrativeCorrection
): void {
    validateAuditEvent(event);

    if (!event.entityType) {
        throw new Error('[AUDIT-ADMIN-001] Administrative correction must have entityType');
    }
    if (!event.entityId) {
        throw new Error('[AUDIT-ADMIN-002] Administrative correction must have entityId');
    }
    if (!event.correctionAction) {
        throw new Error('[AUDIT-ADMIN-003] Administrative correction must have correctionAction');
    }
    if (!event.justification) {
        throw new Error('[AUDIT-ADMIN-004] Administrative correction must have justification');
    }
    if (!event.approvalChain || event.approvalChain.length === 0) {
        throw new Error('[AUDIT-ADMIN-005] Administrative correction must have approval chain');
    }
}

// ============================================================================
// BATCH AUDIT REQUIREMENT (MC-INV-033)
// ============================================================================

/**
 * Batch operation audit requirement
 * Ref: MC-INV-033 — Batch-операции обязаны создавать per-MC audit trail
 */
export interface BatchOperationAudit {
    /** Batch operation ID */
    readonly batchId: string;

    /** Type of batch operation */
    readonly batchType: 'BATCH_FREEZE' | 'BATCH_UNFREEZE';

    /** Individual audit events for each MC */
    readonly individualEvents: readonly MCAuditEventTransition[];

    /** Actor who initiated batch */
    readonly actorId: string;

    /** Timestamp of batch initiation */
    readonly timestamp: Date;

    /** Total number of MC records affected */
    readonly totalRecords: number;
}

/**
 * Validate batch operation has per-MC audit trail
 */
export function validateBatchAudit(batch: BatchOperationAudit): void {
    if (batch.individualEvents.length !== batch.totalRecords) {
        throw new Error(
            `[AUDIT-BATCH-001] Batch audit must have per-MC audit trail. ` +
            `Expected ${batch.totalRecords} events, got ${batch.individualEvents.length}`
        );
    }

    // Validate each individual event
    for (const event of batch.individualEvents) {
        validateMCTransitionEvent(event);
    }
}

// ============================================================================
// PHASE 0: STORE ELIGIBILITY EVENTS (NEW)
// ============================================================================

/**
 * Event: User attempted to access Store, and eligibility was evaluated.
 * Result can be ELIGIBLE or INELIGIBLE.
 */
export interface StoreEligibilityEvaluatedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.STORE_ELIGIBILITY_EVALUATED;
    readonly userId: string;
    readonly snapshotBalance: number;
    readonly decision: StoreEligibilityStatus;
    readonly denialReason?: StoreAccessDeniedReason;
    readonly evaluatedAt: Date;
}

/**
 * Event: User was explicitly denied eligibility to Store.
 * Used for security monitoring or specific rejection handling.
 */
export interface StoreEligibilityDeniedEvent extends BaseAuditEvent {
    readonly eventType: AuditEventType.STORE_ELIGIBILITY_DENIED;
    readonly userId: string;
    readonly denialReason: StoreAccessDeniedReason;
    readonly attemptTimestamp: Date;
}
