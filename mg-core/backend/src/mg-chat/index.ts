/**
 * MG Chat Module Bootstrap
 * 
 * Initializes MG Chat contracts at service startup.
 * Call this in your main server initialization.
 */

import { loadMGChatContracts } from './contracts';

/**
 * Initialize MG Chat module.
 * 
 * This MUST be called during service startup, before accepting requests.
 * Will throw if contracts are invalid.
 */
export function initializeMGChat(): void {
    console.log('[MG Chat] Initializing...');

    try {
        const contracts = loadMGChatContracts();
        console.log('[MG Chat] ✅ Contracts loaded successfully');
        console.log(`[MG Chat]    Version: ${contracts.intents.version}`);
    } catch (error) {
        console.error('[MG Chat] ❌ Failed to load contracts:', error);
        throw error; // Fail-fast: prevent service startup
    }
}

// Re-export for convenience
export { loadMGChatContracts } from './contracts';
export type { MGChatContracts } from './contracts';
