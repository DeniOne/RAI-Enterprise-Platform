"use strict";
/**
 * Audit Event Types — BusinessCoin-Economy
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEventType = void 0;
exports.createBaseAuditEvent = createBaseAuditEvent;
exports.validateAuditEvent = validateAuditEvent;
exports.validateMCCreatedEvent = validateMCCreatedEvent;
exports.validateMCTransitionEvent = validateMCTransitionEvent;
exports.validateGMCRecognizedEvent = validateGMCRecognizedEvent;
exports.validateAdministrativeCorrectionEvent = validateAdministrativeCorrectionEvent;
exports.validateBatchAudit = validateBatchAudit;
// ============================================================================
// AUDIT EVENT TYPES
// ============================================================================
/**
 * All audit event types in BusinessCoin-Economy
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 3.4
 */
var AuditEventType;
(function (AuditEventType) {
    /** MC record created */
    AuditEventType["MC_CREATED"] = "MC_CREATED";
    /** MC state transition (ACTIVE → FROZEN, etc.) */
    AuditEventType["MC_TRANSITION"] = "MC_TRANSITION";
    /** MC split into multiple records */
    AuditEventType["MC_SPLIT"] = "MC_SPLIT";
    /** GMC recognized to user */
    AuditEventType["GMC_RECOGNIZED"] = "GMC_RECOGNIZED";
    /** Administrative correction (exceptional rollback) */
    /** Administrative correction (exceptional rollback) */
    AuditEventType["ADMINISTRATIVE_CORRECTION"] = "ADMINISTRATIVE_CORRECTION";
    /** Store Access evaluated (Access Attempt) */
    AuditEventType["STORE_ACCESS_EVALUATED"] = "STORE_ACCESS_EVALUATED";
    /** Store Access Denied (Explicit Denial) */
    AuditEventType["STORE_ACCESS_DENIED"] = "STORE_ACCESS_DENIED";
    /** PHASE 0: Store Eligibility evaluated (Eligibility Check) */
    AuditEventType["STORE_ELIGIBILITY_EVALUATED"] = "STORE_ELIGIBILITY_EVALUATED";
    /** PHASE 0: Store Eligibility Denied (Explicit Denial) */
    AuditEventType["STORE_ELIGIBILITY_DENIED"] = "STORE_ELIGIBILITY_DENIED";
    /** Auction Event Opened */
    AuditEventType["AUCTION_OPENED"] = "AUCTION_OPENED";
    /** Auction Participation Recorded (Result) */
    AuditEventType["AUCTION_PARTICIPATION"] = "AUCTION_PARTICIPATION";
    /** Auction Participation Denied */
    AuditEventType["AUCTION_DENIED"] = "AUCTION_DENIED";
    /** Auction Event Closed */
    AuditEventType["AUCTION_CLOSED"] = "AUCTION_CLOSED";
    /** GMC Recognition Evaluated (Bridge Check) */
    AuditEventType["GMC_RECOGNITION_EVALUATED"] = "GMC_RECOGNITION_EVALUATED";
    /** GMC Recognition Flagged (Signal) */
    AuditEventType["GMC_RECOGNITION_FLAGGED"] = "GMC_RECOGNITION_FLAGGED";
    /** GMC Recognition Denied */
    AuditEventType["GMC_RECOGNITION_DENIED"] = "GMC_RECOGNITION_DENIED";
    /** Governance Rule Evaluated */
    AuditEventType["GOVERNANCE_EVALUATED"] = "GOVERNANCE_EVALUATED";
    /** Governance Flag Raised (Review Required) */
    AuditEventType["GOVERNANCE_FLAGGED"] = "GOVERNANCE_FLAGGED";
    /** Governance Violation Detected (Blocked) */
    AuditEventType["GOVERNANCE_VIOLATION"] = "GOVERNANCE_VIOLATION";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
// ============================================================================
// AUDIT EVENT FACTORY FUNCTIONS (PURE, NO SIDE EFFECTS)
// ============================================================================
/**
 * Create base audit event fields
 * Pure function — NO side effects
 */
function createBaseAuditEvent(eventType, actorId, actorType, correlationId) {
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
function validateAuditEvent(event) {
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
function validateMCCreatedEvent(event) {
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
function validateMCTransitionEvent(event) {
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
function validateGMCRecognizedEvent(event) {
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
function validateAdministrativeCorrectionEvent(event) {
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
/**
 * Validate batch operation has per-MC audit trail
 */
function validateBatchAudit(batch) {
    if (batch.individualEvents.length !== batch.totalRecords) {
        throw new Error(`[AUDIT-BATCH-001] Batch audit must have per-MC audit trail. ` +
            `Expected ${batch.totalRecords} events, got ${batch.individualEvents.length}`);
    }
    // Validate each individual event
    for (const event of batch.individualEvents) {
        validateMCTransitionEvent(event);
    }
}
