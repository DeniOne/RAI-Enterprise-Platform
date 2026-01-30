/**
 * Action Dispatcher
 * 
 * Platform-agnostic action → intent mapper.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * - Pure function (no side effects)
 * - Deterministic (same input → same output)
 * - Contract-driven (no hardcoded logic)
 * - Platform-agnostic (no Telegram SDK)
 * 
 * WHY THIS ARCHITECTURE:
 * 1. Action IDs come from UX contracts (mg_ux_components_map.json)
 * 2. Actions can map to:
 *    - Intents (most common)
 *    - Other actions (navigation)
 *    - Components (composite UX)
 * 3. Dispatcher only resolves the mapping, does NOT execute
 * 4. Execution happens in Intent Resolver → Scenario Router → UX Renderer
 */

import { loadMGChatContracts } from '../contracts';
import { DispatchResult } from './dispatcher.types';

/**
 * Dispatch action to intent.
 * 
 * This is the ONLY entry point for action handling.
 * 
 * FLOW:
 * 1. Validate input
 * 2. Check if action_id exists in contracts
 * 3. Resolve action_id → intent_id
 * 4. Return result (no side effects)
 * 
 * @param actionId - Action ID from callback_data
 * @returns Dispatch result (success or error)
 */
export function dispatchAction(actionId: string): DispatchResult {
    // 1. Validate input
    if (!actionId || typeof actionId !== 'string' || actionId.trim().length === 0) {
        return {
            status: 'error',
            error_code: 'MISSING_ACTION'
        };
    }

    // 2. Load contracts (cached singleton)
    const contracts = loadMGChatContracts();

    // 3. Check if action_id is a direct intent
    // WHY: Many action_ids ARE intent_ids (e.g., "my_tasks", "focus_mode")
    const isDirectIntent = contracts.intents.intents.some(
        intent => intent.id === actionId
    );

    if (isDirectIntent) {
        return {
            status: 'ok',
            intent: actionId,
            source: 'action_dispatcher'
        };
    }

    // 4. Check if action_id is in UX components
    // WHY: Some actions might be component references (future: navigation)
    const componentExists = Object.keys(contracts.ux.components).includes(actionId);

    if (componentExists) {
        // Component reference → treat as navigation intent
        // WHY: Components represent UI states, which map to intents
        return {
            status: 'ok',
            intent: actionId,
            source: 'action_dispatcher'
        };
    }

    // 5. Check if action_id is an error intent
    // WHY: Error intents can also be triggered via actions
    const isErrorIntent = contracts.errors.error_intents.some(
        err => err.id === actionId
    );

    if (isErrorIntent) {
        return {
            status: 'ok',
            intent: actionId,
            source: 'action_dispatcher'
        };
    }

    // 6. Action not found in any contract
    // WHY: This is a contract violation (button references non-existent action)
    return {
        status: 'error',
        error_code: 'UNKNOWN_ACTION'
    };
}
