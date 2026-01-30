/**
 * MG Chat Contracts
 * 
 * Public API for accessing MG Chat conversational contracts.
 * Contracts are loaded once at startup and cached.
 */

import { mgChatContractLoader } from './contract-loader';
import type { MGChatContracts } from './contract.types';

/**
 * Load MG Chat contracts.
 * 
 * This function is idempotent and returns a read-only singleton.
 * Call this at service startup to ensure contracts are valid.
 * 
 * @throws Error if contracts are invalid or missing
 * @returns Frozen, read-only contracts
 */
export function loadMGChatContracts(): MGChatContracts {
    return mgChatContractLoader.load();
}

// Re-export types for convenience
export type {
    MGChatContracts,
    MGIntentMap,
    MGUxComponentMap,
    MGErrorUxMap,
    MGIntent,
    MGComponent,
    MGErrorIntent
} from './contract.types';
