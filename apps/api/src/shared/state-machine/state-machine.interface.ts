import { InvariantMetrics } from "../invariants/invariant-metrics";

/**
 * Unified State Machine Interface (Event-Driven).
 *
 * PURITY RULES:
 * - FSM is a pure mechanism, NOT a service
 * - NO PrismaService, NO database access
 * - NO @Injectable decorator
 * - NO companyId checks (that's Orchestrator's job)
 * - Pure function: entity in → entity out
 */
export interface StateMachine<TEntity, TState, TEvent> {
    /**
     * Check if transition is allowed for given state and event.
     * Returns true if transition is valid, false otherwise.
     */
    canTransition(state: TState, event: TEvent): boolean;

    /**
     * Apply transition to entity.
     * Returns NEW entity with updated state (immutable).
     * Throws if transition is invalid.
     */
    transition(entity: TEntity, event: TEvent): TEntity;

    /**
     * Get available events for current state.
     */
    getAvailableEvents(state: TState): TEvent[];

    /**
     * Get current state from entity.
     */
    getState(entity: TEntity): TState;

    /**
     * Check if state is terminal (no further transitions).
     */
    isTerminal(state: TState): boolean;
}

/**
 * State transition definition.
 */
export interface TransitionDef<TState, TEvent> {
    from: TState;
    event: TEvent;
    to: TState;
}

/**
 * State metadata with display information.
 */
export interface StateMetadata<TState> {
    id: TState;
    name: string;
    nameRu: string;
    order: number;
    isTerminal: boolean;
}

/**
 * FSM transition error.
 */
export class InvalidTransitionError extends Error {
    constructor(
        public readonly state: string,
        public readonly event: string,
    ) {
        InvariantMetrics.increment("illegal_transition_attempts_total");
        super(`Invalid transition: cannot apply event '${event}' in state '${state}'`);
        this.name = "InvalidTransitionError";
    }
}
