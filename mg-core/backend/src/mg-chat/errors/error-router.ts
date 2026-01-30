/**
 * Error Router
 * 
 * Maps error ID to UX response from error_ux_map.json contract.
 * NO fabrication, NO fallbacks.
 */

import { loadMGChatContracts } from '../contracts';
import { ErrorUXMatch } from './error.types';

/**
 * Route error ID to UX response from contract.
 * 
 * @param errorId - Error intent ID
 * @returns Error UX match with text and actions
 * @throws Error if errorId not found in contract (fail-fast)
 */
export function routeError(errorId: string): ErrorUXMatch {
    const contracts = loadMGChatContracts();

    // Find error intent in contract
    const errorIntent = contracts.errors.error_intents.find(
        e => e.id === errorId
    );

    if (!errorIntent) {
        throw new Error(`Error intent not found in contract: ${errorId}`);
    }

    // Map to ErrorUXMatch
    return {
        errorId: errorIntent.id,
        severity: errorIntent.severity,
        text: errorIntent.response.text,
        actions: errorIntent.response.actions || []
    };
}
