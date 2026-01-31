"use strict";
/**
 * MC State Machine — Pure Transition Functions
 * Module 08 — BusinessCoin-Economy
 * STEP 2.1 — STATE MACHINE (NO PERSISTENCE)
 *
 * ⚠️ CANONICAL: Based on STEP-2-STATE-LIFECYCLE.md
 *
 * This module contains ONLY:
 * - Pure state transition functions
 * - Forbidden transition handling
 * - Terminal state enforcement
 *
 * NO database code.
 * NO side effects.
 * NO Store/Auction logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMC_LIFECYCLE = void 0;
exports.isTerminalState = isTerminalState;
exports.isTransitionAllowed = isTransitionAllowed;
exports.getAllowedTransitions = getAllowedTransitions;
exports.validateTransition = validateTransition;
exports.validateFreeze = validateFreeze;
exports.validateUnfreeze = validateUnfreeze;
exports.validateExpire = validateExpire;
exports.validateSpend = validateSpend;
exports.assertExhaustiveState = assertExhaustiveState;
exports.getStateDescription = getStateDescription;
exports.validateGMCMutation = validateGMCMutation;
const economy_enums_1 = require("./economy.enums");
// ============================================================================
// TERMINAL STATES
// ============================================================================
/**
 * Terminal states — no transitions allowed FROM these states
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.3
 */
const TERMINAL_STATES = new Set([
    economy_enums_1.MCLifecycleState.EXPIRED,
    economy_enums_1.MCLifecycleState.SPENT,
]);
/**
 * Check if state is terminal
 */
function isTerminalState(state) {
    return TERMINAL_STATES.has(state);
}
// ============================================================================
// ALLOWED TRANSITIONS MAP
// ============================================================================
/**
 * Allowed transitions map
 * Key: fromState, Value: Set of allowed toStates
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 */
const ALLOWED_TRANSITIONS = new Map([
    // ACTIVE can transition to: FROZEN, EXPIRED, SPENT
    [economy_enums_1.MCLifecycleState.ACTIVE, new Set([
            economy_enums_1.MCLifecycleState.FROZEN,
            economy_enums_1.MCLifecycleState.EXPIRED,
            economy_enums_1.MCLifecycleState.SPENT,
        ])],
    // FROZEN can transition to: ACTIVE, EXPIRED (but NOT directly to SPENT)
    // Ref: MC-INV-011 — MC не может перейти из FROZEN в SPENT напрямую
    [economy_enums_1.MCLifecycleState.FROZEN, new Set([
            economy_enums_1.MCLifecycleState.ACTIVE,
            economy_enums_1.MCLifecycleState.EXPIRED,
        ])],
    // EXPIRED is terminal — no transitions allowed
    [economy_enums_1.MCLifecycleState.EXPIRED, new Set()],
    // SPENT is terminal — no transitions allowed
    [economy_enums_1.MCLifecycleState.SPENT, new Set()],
]);
/**
 * Operation to target state mapping
 */
const OPERATION_TARGET_STATE = new Map([
    [economy_enums_1.MCOperationType.FREEZE, economy_enums_1.MCLifecycleState.FROZEN],
    [economy_enums_1.MCOperationType.UNFREEZE, economy_enums_1.MCLifecycleState.ACTIVE],
    [economy_enums_1.MCOperationType.EXPIRE, economy_enums_1.MCLifecycleState.EXPIRED],
    [economy_enums_1.MCOperationType.SPEND, economy_enums_1.MCLifecycleState.SPENT],
]);
// ============================================================================
// TRANSITION VALIDATION FUNCTIONS
// ============================================================================
/**
 * Check if a transition is structurally allowed
 * Does NOT check expiration or actor — pure state check
 */
function isTransitionAllowed(fromState, toState) {
    const allowedTargets = ALLOWED_TRANSITIONS.get(fromState);
    if (!allowedTargets) {
        return false;
    }
    return allowedTargets.has(toState);
}
/**
 * Get all allowed target states from a given state
 */
function getAllowedTransitions(fromState) {
    const allowed = ALLOWED_TRANSITIONS.get(fromState);
    return allowed ? Array.from(allowed) : [];
}
// ============================================================================
// TRANSITION ERROR FACTORY
// ============================================================================
/**
 * Create transition error with invariant reference
 */
function createTransitionError(code, invariantId, message) {
    return { code, invariantId, message };
}
// ============================================================================
// CORE TRANSITION FUNCTIONS
// ============================================================================
/**
 * Validate and compute transition result
 * Pure function — NO side effects
 *
 * Enforces:
 * - Terminal state blocking (MC-INV-010)
 * - Forbidden transitions (MC-INV-011)
 * - Single state at a time (MC-INV-012)
 * - Human-only actions (MC-INV-020, MC-INV-021)
 * - Expiration rules
 */
function validateTransition(context, operation) {
    const { currentState, expiresAt, now, actorId, actorType } = context;
    // -------------------------------------------------------------------------
    // GUARD: Actor must be human (MC-INV-020, MC-INV-021, MC-INV-022)
    // -------------------------------------------------------------------------
    if (actorType !== 'HUMAN') {
        return {
            success: false,
            fromState: currentState,
            toState: null,
            operation,
            error: createTransitionError('ACTOR_NOT_HUMAN', actorType === 'AI' ? 'MC-INV-022' : 'MC-INV-021', `Transition requires human actor. Got: ${actorType}. ActorId: ${actorId}`),
        };
    }
    // -------------------------------------------------------------------------
    // GUARD: Terminal state check (MC-INV-010)
    // -------------------------------------------------------------------------
    if (isTerminalState(currentState)) {
        return {
            success: false,
            fromState: currentState,
            toState: null,
            operation,
            error: createTransitionError('TERMINAL_STATE', 'MC-INV-010', `Cannot transition from terminal state: ${currentState}`),
        };
    }
    // -------------------------------------------------------------------------
    // Get target state for operation
    // -------------------------------------------------------------------------
    const targetState = OPERATION_TARGET_STATE.get(operation);
    if (!targetState) {
        // GRANT and TRANSFER don't change lifecycle state here
        // They are handled separately
        return {
            success: false,
            fromState: currentState,
            toState: null,
            operation,
            error: createTransitionError('INVALID_OPERATION', 'MC-INV-012', `Operation ${operation} does not map to a state transition`),
        };
    }
    // -------------------------------------------------------------------------
    // GUARD: Forbidden transition check (MC-INV-011)
    // -------------------------------------------------------------------------
    if (!isTransitionAllowed(currentState, targetState)) {
        return {
            success: false,
            fromState: currentState,
            toState: null,
            operation,
            error: createTransitionError('FORBIDDEN_TRANSITION', 'MC-INV-011', `Transition from ${currentState} to ${targetState} is forbidden`),
        };
    }
    // -------------------------------------------------------------------------
    // GUARD: Expiration check for non-expire operations
    // If MC is expired, only EXPIRE operation is allowed
    // -------------------------------------------------------------------------
    const isExpired = expiresAt <= now;
    if (operation === economy_enums_1.MCOperationType.EXPIRE) {
        // EXPIRE operation: MC must actually be expired
        if (!isExpired) {
            return {
                success: false,
                fromState: currentState,
                toState: null,
                operation,
                error: createTransitionError('NOT_EXPIRED_YET', 'MC-INV-002', `Cannot mark as EXPIRED: expiresAt (${expiresAt.toISOString()}) > now (${now.toISOString()})`),
            };
        }
    }
    else {
        // Non-EXPIRE operations: MC must NOT be expired
        if (isExpired) {
            return {
                success: false,
                fromState: currentState,
                toState: null,
                operation,
                error: createTransitionError('MC_EXPIRED', 'MC-INV-002', `MC is expired. expiresAt: ${expiresAt.toISOString()}, now: ${now.toISOString()}`),
            };
        }
    }
    // -------------------------------------------------------------------------
    // SUCCESS: Transition is valid
    // -------------------------------------------------------------------------
    return {
        success: true,
        fromState: currentState,
        toState: targetState,
        operation,
    };
}
// ============================================================================
// SPECIFIC TRANSITION FUNCTIONS
// ============================================================================
/**
 * Validate FREEZE transition (ACTIVE → FROZEN)
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 */
function validateFreeze(context) {
    // Pre-check: must be in ACTIVE state
    if (context.currentState !== economy_enums_1.MCLifecycleState.ACTIVE) {
        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: economy_enums_1.MCOperationType.FREEZE,
            error: createTransitionError('INVALID_SOURCE_STATE', 'MC-INV-011', `FREEZE requires ACTIVE state. Current: ${context.currentState}`),
        };
    }
    return validateTransition(context, economy_enums_1.MCOperationType.FREEZE);
}
/**
 * Validate UNFREEZE transition (FROZEN → ACTIVE)
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 */
function validateUnfreeze(context) {
    // Pre-check: must be in FROZEN state
    if (context.currentState !== economy_enums_1.MCLifecycleState.FROZEN) {
        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: economy_enums_1.MCOperationType.UNFREEZE,
            error: createTransitionError('INVALID_SOURCE_STATE', 'MC-INV-011', `UNFREEZE requires FROZEN state. Current: ${context.currentState}`),
        };
    }
    return validateTransition(context, economy_enums_1.MCOperationType.UNFREEZE);
}
/**
 * Validate EXPIRE transition (ACTIVE|FROZEN → EXPIRED)
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 *
 * Note: Safe does NOT protect from expiration (MC-INV-030)
 */
function validateExpire(context) {
    // Pre-check: must be in ACTIVE or FROZEN state
    if (context.currentState !== economy_enums_1.MCLifecycleState.ACTIVE &&
        context.currentState !== economy_enums_1.MCLifecycleState.FROZEN) {
        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: economy_enums_1.MCOperationType.EXPIRE,
            error: createTransitionError('INVALID_SOURCE_STATE', 'MC-INV-010', `EXPIRE requires ACTIVE or FROZEN state. Current: ${context.currentState}`),
        };
    }
    return validateTransition(context, economy_enums_1.MCOperationType.EXPIRE);
}
/**
 * Validate SPEND transition (ACTIVE → SPENT)
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 *
 * Note: Cannot spend from FROZEN state directly (MC-INV-011)
 */
function validateSpend(context) {
    // Pre-check: must be in ACTIVE state (NOT FROZEN)
    if (context.currentState !== economy_enums_1.MCLifecycleState.ACTIVE) {
        const invariantId = context.currentState === economy_enums_1.MCLifecycleState.FROZEN
            ? 'MC-INV-011'
            : 'MC-INV-010';
        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: economy_enums_1.MCOperationType.SPEND,
            error: createTransitionError('INVALID_SOURCE_STATE', invariantId, `SPEND requires ACTIVE state. Current: ${context.currentState}. ` +
                (context.currentState === economy_enums_1.MCLifecycleState.FROZEN
                    ? 'Unfreeze first.'
                    : 'Terminal state cannot spend.')),
        };
    }
    return validateTransition(context, economy_enums_1.MCOperationType.SPEND);
}
// ============================================================================
// STATE MACHINE EXHAUSTIVENESS CHECK
// ============================================================================
/**
 * Exhaustive state handler — ensures all states are handled
 * Compile-time check via TypeScript
 */
function assertExhaustiveState(state) {
    throw new Error(`Unhandled MC lifecycle state: ${state}`);
}
/**
 * Get human-readable state description
 */
function getStateDescription(state) {
    switch (state) {
        case economy_enums_1.MCLifecycleState.ACTIVE:
            return 'MC is active and available for operations';
        case economy_enums_1.MCLifecycleState.FROZEN:
            return 'MC is frozen in Safe, unavailable for spend/transfer';
        case economy_enums_1.MCLifecycleState.EXPIRED:
            return 'MC has expired (terminal state)';
        case economy_enums_1.MCLifecycleState.SPENT:
            return 'MC has been spent (terminal state)';
        default:
            return assertExhaustiveState(state);
    }
}
// ============================================================================
// GMC STATE (STATIC HOLDER — NO TRANSITIONS)
// ============================================================================
/**
 * GMC has NO lifecycle transitions
 * This function explicitly declares that GMC state is immutable
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.4
 * Ref: GMC-INV-010, GMC-INV-011, GMC-INV-012, GMC-INV-013
 */
function validateGMCMutation() {
    return createTransitionError('GMC_IMMUTABLE', 'GMC-INV-010', 'GMC is immutable after creation. No transitions, no spend, no transfer, no expiration.');
}
/**
 * GMC can only be created, never modified
 */
exports.GMC_LIFECYCLE = {
    CAN_TRANSITION: false,
    CAN_EXPIRE: false,
    CAN_SPEND: false,
    CAN_TRANSFER: false,
    IS_IMMUTABLE: true,
};
