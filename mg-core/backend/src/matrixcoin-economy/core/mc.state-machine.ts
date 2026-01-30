/**
 * MC State Machine — Pure Transition Functions
 * Module 08 — MatrixCoin-Economy
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

import { MCLifecycleState, MCOperationType } from './economy.enums';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a transition attempt
 */
export interface TransitionResult {
    readonly success: boolean;
    readonly fromState: MCLifecycleState;
    readonly toState: MCLifecycleState | null;
    readonly operation: MCOperationType;
    readonly error?: TransitionError;
}

/**
 * Transition error with invariant reference
 */
export interface TransitionError {
    readonly code: string;
    readonly invariantId: string;
    readonly message: string;
}

/**
 * Context for transition validation
 * NO persistence — pure data
 */
export interface TransitionContext {
    readonly currentState: MCLifecycleState;
    readonly expiresAt: Date;
    readonly now: Date;
    readonly actorId: string;
    readonly actorType: 'HUMAN' | 'SYSTEM' | 'AI';
}

// ============================================================================
// TERMINAL STATES
// ============================================================================

/**
 * Terminal states — no transitions allowed FROM these states
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.3
 */
const TERMINAL_STATES: ReadonlySet<MCLifecycleState> = new Set([
    MCLifecycleState.EXPIRED,
    MCLifecycleState.SPENT,
]);

/**
 * Check if state is terminal
 */
export function isTerminalState(state: MCLifecycleState): boolean {
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
const ALLOWED_TRANSITIONS: ReadonlyMap<MCLifecycleState, ReadonlySet<MCLifecycleState>> = new Map([
    // ACTIVE can transition to: FROZEN, EXPIRED, SPENT
    [MCLifecycleState.ACTIVE, new Set([
        MCLifecycleState.FROZEN,
        MCLifecycleState.EXPIRED,
        MCLifecycleState.SPENT,
    ])],

    // FROZEN can transition to: ACTIVE, EXPIRED (but NOT directly to SPENT)
    // Ref: MC-INV-011 — MC не может перейти из FROZEN в SPENT напрямую
    [MCLifecycleState.FROZEN, new Set([
        MCLifecycleState.ACTIVE,
        MCLifecycleState.EXPIRED,
    ])],

    // EXPIRED is terminal — no transitions allowed
    [MCLifecycleState.EXPIRED, new Set()],

    // SPENT is terminal — no transitions allowed
    [MCLifecycleState.SPENT, new Set()],
]);

/**
 * Operation to target state mapping
 */
const OPERATION_TARGET_STATE: ReadonlyMap<MCOperationType, MCLifecycleState> = new Map([
    [MCOperationType.FREEZE, MCLifecycleState.FROZEN],
    [MCOperationType.UNFREEZE, MCLifecycleState.ACTIVE],
    [MCOperationType.EXPIRE, MCLifecycleState.EXPIRED],
    [MCOperationType.SPEND, MCLifecycleState.SPENT],
]);

// ============================================================================
// TRANSITION VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a transition is structurally allowed
 * Does NOT check expiration or actor — pure state check
 */
export function isTransitionAllowed(
    fromState: MCLifecycleState,
    toState: MCLifecycleState
): boolean {
    const allowedTargets = ALLOWED_TRANSITIONS.get(fromState);
    if (!allowedTargets) {
        return false;
    }
    return allowedTargets.has(toState);
}

/**
 * Get all allowed target states from a given state
 */
export function getAllowedTransitions(fromState: MCLifecycleState): readonly MCLifecycleState[] {
    const allowed = ALLOWED_TRANSITIONS.get(fromState);
    return allowed ? Array.from(allowed) : [];
}

// ============================================================================
// TRANSITION ERROR FACTORY
// ============================================================================

/**
 * Create transition error with invariant reference
 */
function createTransitionError(
    code: string,
    invariantId: string,
    message: string
): TransitionError {
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
export function validateTransition(
    context: TransitionContext,
    operation: MCOperationType
): TransitionResult {
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
            error: createTransitionError(
                'ACTOR_NOT_HUMAN',
                actorType === 'AI' ? 'MC-INV-022' : 'MC-INV-021',
                `Transition requires human actor. Got: ${actorType}. ActorId: ${actorId}`
            ),
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
            error: createTransitionError(
                'TERMINAL_STATE',
                'MC-INV-010',
                `Cannot transition from terminal state: ${currentState}`
            ),
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
            error: createTransitionError(
                'INVALID_OPERATION',
                'MC-INV-012',
                `Operation ${operation} does not map to a state transition`
            ),
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
            error: createTransitionError(
                'FORBIDDEN_TRANSITION',
                'MC-INV-011',
                `Transition from ${currentState} to ${targetState} is forbidden`
            ),
        };
    }

    // -------------------------------------------------------------------------
    // GUARD: Expiration check for non-expire operations
    // If MC is expired, only EXPIRE operation is allowed
    // -------------------------------------------------------------------------
    const isExpired = expiresAt <= now;

    if (operation === MCOperationType.EXPIRE) {
        // EXPIRE operation: MC must actually be expired
        if (!isExpired) {
            return {
                success: false,
                fromState: currentState,
                toState: null,
                operation,
                error: createTransitionError(
                    'NOT_EXPIRED_YET',
                    'MC-INV-002',
                    `Cannot mark as EXPIRED: expiresAt (${expiresAt.toISOString()}) > now (${now.toISOString()})`
                ),
            };
        }
    } else {
        // Non-EXPIRE operations: MC must NOT be expired
        if (isExpired) {
            return {
                success: false,
                fromState: currentState,
                toState: null,
                operation,
                error: createTransitionError(
                    'MC_EXPIRED',
                    'MC-INV-002',
                    `MC is expired. expiresAt: ${expiresAt.toISOString()}, now: ${now.toISOString()}`
                ),
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
export function validateFreeze(context: TransitionContext): TransitionResult {
    // Pre-check: must be in ACTIVE state
    if (context.currentState !== MCLifecycleState.ACTIVE) {
        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: MCOperationType.FREEZE,
            error: createTransitionError(
                'INVALID_SOURCE_STATE',
                'MC-INV-011',
                `FREEZE requires ACTIVE state. Current: ${context.currentState}`
            ),
        };
    }

    return validateTransition(context, MCOperationType.FREEZE);
}

/**
 * Validate UNFREEZE transition (FROZEN → ACTIVE)
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 */
export function validateUnfreeze(context: TransitionContext): TransitionResult {
    // Pre-check: must be in FROZEN state
    if (context.currentState !== MCLifecycleState.FROZEN) {
        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: MCOperationType.UNFREEZE,
            error: createTransitionError(
                'INVALID_SOURCE_STATE',
                'MC-INV-011',
                `UNFREEZE requires FROZEN state. Current: ${context.currentState}`
            ),
        };
    }

    return validateTransition(context, MCOperationType.UNFREEZE);
}

/**
 * Validate EXPIRE transition (ACTIVE|FROZEN → EXPIRED)
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 * 
 * Note: Safe does NOT protect from expiration (MC-INV-030)
 */
export function validateExpire(context: TransitionContext): TransitionResult {
    // Pre-check: must be in ACTIVE or FROZEN state
    if (context.currentState !== MCLifecycleState.ACTIVE &&
        context.currentState !== MCLifecycleState.FROZEN) {
        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: MCOperationType.EXPIRE,
            error: createTransitionError(
                'INVALID_SOURCE_STATE',
                'MC-INV-010',
                `EXPIRE requires ACTIVE or FROZEN state. Current: ${context.currentState}`
            ),
        };
    }

    return validateTransition(context, MCOperationType.EXPIRE);
}

/**
 * Validate SPEND transition (ACTIVE → SPENT)
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.2
 * 
 * Note: Cannot spend from FROZEN state directly (MC-INV-011)
 */
export function validateSpend(context: TransitionContext): TransitionResult {
    // Pre-check: must be in ACTIVE state (NOT FROZEN)
    if (context.currentState !== MCLifecycleState.ACTIVE) {
        const invariantId = context.currentState === MCLifecycleState.FROZEN
            ? 'MC-INV-011'
            : 'MC-INV-010';

        return {
            success: false,
            fromState: context.currentState,
            toState: null,
            operation: MCOperationType.SPEND,
            error: createTransitionError(
                'INVALID_SOURCE_STATE',
                invariantId,
                `SPEND requires ACTIVE state. Current: ${context.currentState}. ` +
                (context.currentState === MCLifecycleState.FROZEN
                    ? 'Unfreeze first.'
                    : 'Terminal state cannot spend.')
            ),
        };
    }

    return validateTransition(context, MCOperationType.SPEND);
}

// ============================================================================
// STATE MACHINE EXHAUSTIVENESS CHECK
// ============================================================================

/**
 * Exhaustive state handler — ensures all states are handled
 * Compile-time check via TypeScript
 */
export function assertExhaustiveState(state: never): never {
    throw new Error(`Unhandled MC lifecycle state: ${state}`);
}

/**
 * Get human-readable state description
 */
export function getStateDescription(state: MCLifecycleState): string {
    switch (state) {
        case MCLifecycleState.ACTIVE:
            return 'MC is active and available for operations';
        case MCLifecycleState.FROZEN:
            return 'MC is frozen in Safe, unavailable for spend/transfer';
        case MCLifecycleState.EXPIRED:
            return 'MC has expired (terminal state)';
        case MCLifecycleState.SPENT:
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
export function validateGMCMutation(): TransitionError {
    return createTransitionError(
        'GMC_IMMUTABLE',
        'GMC-INV-010',
        'GMC is immutable after creation. No transitions, no spend, no transfer, no expiration.'
    );
}

/**
 * GMC can only be created, never modified
 */
export const GMC_LIFECYCLE = {
    CAN_TRANSITION: false,
    CAN_EXPIRE: false,
    CAN_SPEND: false,
    CAN_TRANSFER: false,
    IS_IMMUTABLE: true,
} as const;
