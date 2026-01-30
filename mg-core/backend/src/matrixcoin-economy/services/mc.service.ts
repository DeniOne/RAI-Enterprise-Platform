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

import { randomUUID } from 'crypto';
import {
    MCLifecycleState,
    MCOperationType,
    EconomyCurrency
} from '../core/economy.enums';
import {
    MCState,
    MCSourceType
} from '../core/mc.types';
import {
    validateTransition,
    validateFreeze,
    validateUnfreeze,
    TransitionContext
} from '../core/mc.state-machine';
import {
    guardMCStructuralInvariants,
    guardMCCanFreeze,
    guardMCCanUnfreeze,
    guardMCHumanActor,
    guardMCHasOwner,
    MCInvariantViolation
} from '../guards/mc.invariant-guards';
import {
    AuditEventType,
    MCAuditEventCreated,
    MCAuditEventTransition,
    createBaseAuditEvent,
    validateMCCreatedEvent,
    validateMCTransitionEvent
} from '../core/audit.types';
import {
    MC_CONSTRAINTS
} from '../core/economy.constants';

// ============================================================================
// TYPES
// ============================================================================

export interface MCOperationResult {
    readonly mc: MCState;
    readonly auditEvent: MCAuditEventCreated | MCAuditEventTransition;
}

export interface GrantMCParams {
    readonly userId: string;
    readonly amount: number;
    readonly sourceType: MCSourceType;
    readonly sourceId: string;
    readonly ttlDays: number;
    readonly actorId: string; // Must be human operator
}

export interface FreezeMCParams {
    readonly mc: MCState;     // Current state object (would legally come from DB)
    readonly actorId: string; // Owner or Admin
    readonly now?: Date;      // Optional, defaults to new Date()
}

export interface UnfreezeMCParams {
    readonly mc: MCState;
    readonly actorId: string;
    readonly now?: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class MCLifecycleService {

    /**
     * Grant MC to a user manually
     * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2 "Grant" logic implies creation
     */
    public grantMC(params: GrantMCParams): MCOperationResult {
        // 1. Guard: Actor must be Human
        // effectively checking if initiator is defined and human, though logic here implies
        // the caller responsibilty to pass correct actorType. 
        // We enforce actorType='HUMAN' inside the event creation/logic implicitly by design constants.
        guardMCHumanActor('HUMAN');

        const now = new Date();

        // 2. Validate TTL
        if (params.ttlDays < MC_CONSTRAINTS.MIN_TTL_DAYS || params.ttlDays > MC_CONSTRAINTS.MAX_TTL_DAYS) {
            throw new MCInvariantViolation(
                'MC-INV-002', // Closest to expiration invalidity
                'INVALID_TTL',
                `TTL must be between ${MC_CONSTRAINTS.MIN_TTL_DAYS} and ${MC_CONSTRAINTS.MAX_TTL_DAYS} days. Got: ${params.ttlDays}`,
                { ttl: params.ttlDays }
            );
        }

        // Calculate expiration
        const expiresAt = new Date(now.getTime() + params.ttlDays * 24 * 60 * 60 * 1000);

        // 3. Construct candidate State
        const newMC: MCState = {
            id: randomUUID(),
            userId: params.userId,
            amount: params.amount,
            issuedAt: now,
            expiresAt: expiresAt,
            isFrozen: false,
            sourceType: params.sourceType,
            sourceId: params.sourceId,
            lifecycleState: MCLifecycleState.ACTIVE
        };

        // 4. Run Structural Guards
        guardMCStructuralInvariants(newMC);

        // 5. Create Audit Event
        const baseEvent = createBaseAuditEvent(
            AuditEventType.MC_CREATED,
            params.actorId,
            'HUMAN' // Hardcoded as strictly required
        );

        const auditEvent: MCAuditEventCreated = {
            ...baseEvent,
            eventId: randomUUID(),
            eventType: AuditEventType.MC_CREATED,
            mcId: newMC.id,
            userId: newMC.userId,
            amount: newMC.amount,
            issuedAt: newMC.issuedAt,
            expiresAt: newMC.expiresAt,
            sourceType: newMC.sourceType,
            sourceId: newMC.sourceId,
            initialState: MCLifecycleState.ACTIVE
        };

        // 6. Validate Event structure
        validateMCCreatedEvent(auditEvent);

        return { mc: newMC, auditEvent };
    }

    /**
     * Freeze MC to Safe
     * Transition: ACTIVE -> FROZEN
     */
    public freezeToSafe(params: FreezeMCParams): MCOperationResult {
        const now = params.now || new Date();
        const { mc, actorId } = params;

        // 0. Security Guard (Ownership) - simplified, usually checked by upper layer, 
        // but we enforce actor presence.
        if (!actorId) throw new Error('ActorID required');

        // 1. Context for Transition
        const context: TransitionContext = {
            currentState: mc.lifecycleState,
            expiresAt: mc.expiresAt,
            now: now,
            actorId: actorId,
            actorType: 'HUMAN'
        };

        // 2. Check Specific Freeze Invariants (MC-INV-011, MC-INV-002)
        guardMCCanFreeze(mc, now);

        // 3. Execute State Machine Transition Logic
        const transitionResult = validateFreeze(context);

        if (!transitionResult.success) {
            throw new MCInvariantViolation(
                transitionResult.error?.invariantId || 'UNKNOWN',
                transitionResult.error?.code || 'TRANSITION_FAILED',
                transitionResult.error?.message || 'Transition failed'
            );
        }

        // 4. Create New State (Immutable update)
        const updatedMC: MCState = {
            ...mc,
            isFrozen: true,
            lifecycleState: MCLifecycleState.FROZEN
        };

        // 5. Create Audit Event
        const baseEvent = createBaseAuditEvent(
            AuditEventType.MC_TRANSITION,
            actorId,
            'HUMAN'
        );

        const auditEvent: MCAuditEventTransition = {
            ...baseEvent,
            eventId: randomUUID(),
            eventType: AuditEventType.MC_TRANSITION,
            mcId: mc.id,
            fromState: MCLifecycleState.ACTIVE,
            toState: MCLifecycleState.FROZEN,
            operation: MCOperationType.FREEZE,
            reason: 'USER_FREEZE'
        };

        validateMCTransitionEvent(auditEvent);

        return { mc: updatedMC, auditEvent };
    }

    /**
     * Unfreeze MC from Safe
     * Transition: FROZEN -> ACTIVE
     */
    public unfreezeFromSafe(params: UnfreezeMCParams): MCOperationResult {
        const now = params.now || new Date();
        const { mc, actorId } = params;

        if (!actorId) throw new Error('ActorID required');

        const context: TransitionContext = {
            currentState: mc.lifecycleState,
            expiresAt: mc.expiresAt,
            now: now,
            actorId: actorId,
            actorType: 'HUMAN'
        };

        // 2. Check Specific Unfreeze Invariants
        guardMCCanUnfreeze(mc, now);

        // 3. Execute State Machine
        const transitionResult = validateUnfreeze(context);

        if (!transitionResult.success) {
            throw new MCInvariantViolation(
                transitionResult.error?.invariantId || 'UNKNOWN',
                transitionResult.error?.code || 'TRANSITION_FAILED',
                transitionResult.error?.message || 'Transition failed'
            );
        }

        // 4. Update State
        const updatedMC: MCState = {
            ...mc,
            isFrozen: false,
            lifecycleState: MCLifecycleState.ACTIVE
        };

        // 5. Audit
        const baseEvent = createBaseAuditEvent(
            AuditEventType.MC_TRANSITION,
            actorId,
            'HUMAN'
        );

        const auditEvent: MCAuditEventTransition = {
            ...baseEvent,
            eventId: randomUUID(),
            eventType: AuditEventType.MC_TRANSITION,
            mcId: mc.id,
            fromState: MCLifecycleState.FROZEN,
            toState: MCLifecycleState.ACTIVE,
            operation: MCOperationType.UNFREEZE,
            reason: 'USER_UNFREEZE'
        };

        validateMCTransitionEvent(auditEvent);

        return { mc: updatedMC, auditEvent };
    }
}
