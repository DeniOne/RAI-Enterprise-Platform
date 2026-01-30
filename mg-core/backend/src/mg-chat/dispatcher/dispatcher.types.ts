/**
 * Action Dispatcher Types
 * 
 * Platform-agnostic types for action dispatching.
 * No Telegram SDK, no business logic.
 */

/**
 * Dispatch result (success)
 */
export interface DispatchSuccess {
    status: 'ok';
    intent: string;
    source: 'action_dispatcher';
}

/**
 * Dispatch result (error)
 */
export interface DispatchError {
    status: 'error';
    error_code: 'UNKNOWN_ACTION' | 'INVALID_ACTION' | 'MISSING_ACTION';
}

/**
 * Dispatch result (union type)
 */
export type DispatchResult = DispatchSuccess | DispatchError;
