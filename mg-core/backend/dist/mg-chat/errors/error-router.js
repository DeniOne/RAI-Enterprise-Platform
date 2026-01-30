"use strict";
/**
 * Error Router
 *
 * Maps error ID to UX response from error_ux_map.json contract.
 * NO fabrication, NO fallbacks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeError = routeError;
const contracts_1 = require("../contracts");
/**
 * Route error ID to UX response from contract.
 *
 * @param errorId - Error intent ID
 * @returns Error UX match with text and actions
 * @throws Error if errorId not found in contract (fail-fast)
 */
function routeError(errorId) {
    const contracts = (0, contracts_1.loadMGChatContracts)();
    // Find error intent in contract
    const errorIntent = contracts.errors.error_intents.find(e => e.id === errorId);
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
