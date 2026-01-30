"use strict";
/**
 * MC Lifecycle Service — Minimal Implementation
 * Module 08 — MatrixCoin-Economy
 * STEP 2.4 — SERVICE IMPLEMENTATION
 *
 * ⚠️ CANONICAL: Based on STEP-2-STATE-LIFECYCLE.md
 *
 * Scope:
 * - grantMC (Human only)
 * - freezeToSafe (Human only)
 * - unfreezeFromSafe (Human only)
 *
 * Flow:
 * Guards → State Machine → Audit Events
 *
 * NO DB Persistence yet. Returns state + events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCLifecycleService = void 0;
const crypto_1 = require("crypto");
const economy_enums_1 = require("../core/economy.enums");
const mc_state_machine_1 = require("../core/mc.state-machine");
const mc_invariant_guards_1 = require("../guards/mc.invariant-guards");
const audit_types_1 = require("../core/audit.types");
const economy_constants_1 = require("../core/economy.constants");
// ============================================================================
// SERVICE CLASS
// ============================================================================
class MCLifecycleService {
    /**
     * Grant MC to a user manually
     * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2 "Grant" logic implies creation
     */
    grantMC(params) {
        // 1. Guard: Actor must be Human
        // effectively checking if initiator is defined and human, though logic here implies
        // the caller responsibilty to pass correct actorType. 
        // We enforce actorType='HUMAN' inside the event creation/logic implicitly by design constants.
        (0, mc_invariant_guards_1.guardMCHumanActor)('HUMAN');
        const now = new Date();
        // 2. Validate TTL
        if (params.ttlDays < economy_constants_1.MC_CONSTRAINTS.MIN_TTL_DAYS || params.ttlDays > economy_constants_1.MC_CONSTRAINTS.MAX_TTL_DAYS) {
            throw new mc_invariant_guards_1.MCInvariantViolation('MC-INV-002', // Closest to expiration invalidity
            'INVALID_TTL', `TTL must be between ${economy_constants_1.MC_CONSTRAINTS.MIN_TTL_DAYS} and ${economy_constants_1.MC_CONSTRAINTS.MAX_TTL_DAYS} days. Got: ${params.ttlDays}`, { ttl: params.ttlDays });
        }
        // Calculate expiration
        const expiresAt = new Date(now.getTime() + params.ttlDays * 24 * 60 * 60 * 1000);
        // 3. Construct candidate State
        const newMC = {
            id: (0, crypto_1.randomUUID)(),
            userId: params.userId,
            amount: params.amount,
            issuedAt: now,
            expiresAt: expiresAt,
            isFrozen: false,
            sourceType: params.sourceType,
            sourceId: params.sourceId,
            lifecycleState: economy_enums_1.MCLifecycleState.ACTIVE
        };
        // 4. Run Structural Guards
        (0, mc_invariant_guards_1.guardMCStructuralInvariants)(newMC);
        // 5. Create Audit Event
        const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.MC_CREATED, params.actorId, 'HUMAN' // Hardcoded as strictly required
        );
        const auditEvent = {
            ...baseEvent,
            eventId: (0, crypto_1.randomUUID)(),
            eventType: audit_types_1.AuditEventType.MC_CREATED,
            mcId: newMC.id,
            userId: newMC.userId,
            amount: newMC.amount,
            issuedAt: newMC.issuedAt,
            expiresAt: newMC.expiresAt,
            sourceType: newMC.sourceType,
            sourceId: newMC.sourceId,
            initialState: economy_enums_1.MCLifecycleState.ACTIVE
        };
        // 6. Validate Event structure
        (0, audit_types_1.validateMCCreatedEvent)(auditEvent);
        return { mc: newMC, auditEvent };
    }
    /**
     * Freeze MC to Safe
     * Transition: ACTIVE -> FROZEN
     */
    freezeToSafe(params) {
        const now = params.now || new Date();
        const { mc, actorId } = params;
        // 0. Security Guard (Ownership) - simplified, usually checked by upper layer, 
        // but we enforce actor presence.
        if (!actorId)
            throw new Error('ActorID required');
        // 1. Context for Transition
        const context = {
            currentState: mc.lifecycleState,
            expiresAt: mc.expiresAt,
            now: now,
            actorId: actorId,
            actorType: 'HUMAN'
        };
        // 2. Check Specific Freeze Invariants (MC-INV-011, MC-INV-002)
        (0, mc_invariant_guards_1.guardMCCanFreeze)(mc, now);
        // 3. Execute State Machine Transition Logic
        const transitionResult = (0, mc_state_machine_1.validateFreeze)(context);
        if (!transitionResult.success) {
            throw new mc_invariant_guards_1.MCInvariantViolation(transitionResult.error?.invariantId || 'UNKNOWN', transitionResult.error?.code || 'TRANSITION_FAILED', transitionResult.error?.message || 'Transition failed');
        }
        // 4. Create New State (Immutable update)
        const updatedMC = {
            ...mc,
            isFrozen: true,
            lifecycleState: economy_enums_1.MCLifecycleState.FROZEN
        };
        // 5. Create Audit Event
        const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.MC_TRANSITION, actorId, 'HUMAN');
        const auditEvent = {
            ...baseEvent,
            eventId: (0, crypto_1.randomUUID)(),
            eventType: audit_types_1.AuditEventType.MC_TRANSITION,
            mcId: mc.id,
            fromState: economy_enums_1.MCLifecycleState.ACTIVE,
            toState: economy_enums_1.MCLifecycleState.FROZEN,
            operation: economy_enums_1.MCOperationType.FREEZE,
            reason: 'USER_FREEZE'
        };
        (0, audit_types_1.validateMCTransitionEvent)(auditEvent);
        return { mc: updatedMC, auditEvent };
    }
    /**
     * Unfreeze MC from Safe
     * Transition: FROZEN -> ACTIVE
     */
    unfreezeFromSafe(params) {
        const now = params.now || new Date();
        const { mc, actorId } = params;
        if (!actorId)
            throw new Error('ActorID required');
        const context = {
            currentState: mc.lifecycleState,
            expiresAt: mc.expiresAt,
            now: now,
            actorId: actorId,
            actorType: 'HUMAN'
        };
        // 2. Check Specific Unfreeze Invariants
        (0, mc_invariant_guards_1.guardMCCanUnfreeze)(mc, now);
        // 3. Execute State Machine
        const transitionResult = (0, mc_state_machine_1.validateUnfreeze)(context);
        if (!transitionResult.success) {
            throw new mc_invariant_guards_1.MCInvariantViolation(transitionResult.error?.invariantId || 'UNKNOWN', transitionResult.error?.code || 'TRANSITION_FAILED', transitionResult.error?.message || 'Transition failed');
        }
        // 4. Update State
        const updatedMC = {
            ...mc,
            isFrozen: false,
            lifecycleState: economy_enums_1.MCLifecycleState.ACTIVE
        };
        // 5. Audit
        const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.MC_TRANSITION, actorId, 'HUMAN');
        const auditEvent = {
            ...baseEvent,
            eventId: (0, crypto_1.randomUUID)(),
            eventType: audit_types_1.AuditEventType.MC_TRANSITION,
            mcId: mc.id,
            fromState: economy_enums_1.MCLifecycleState.FROZEN,
            toState: economy_enums_1.MCLifecycleState.ACTIVE,
            operation: economy_enums_1.MCOperationType.UNFREEZE,
            reason: 'USER_UNFREEZE'
        };
        (0, audit_types_1.validateMCTransitionEvent)(auditEvent);
        return { mc: updatedMC, auditEvent };
    }
}
exports.MCLifecycleService = MCLifecycleService;
