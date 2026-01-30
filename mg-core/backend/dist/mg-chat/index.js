"use strict";
/**
 * MG Chat Module Bootstrap
 *
 * Initializes MG Chat contracts at service startup.
 * Call this in your main server initialization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMGChatContracts = void 0;
exports.initializeMGChat = initializeMGChat;
const contracts_1 = require("./contracts");
/**
 * Initialize MG Chat module.
 *
 * This MUST be called during service startup, before accepting requests.
 * Will throw if contracts are invalid.
 */
function initializeMGChat() {
    console.log('[MG Chat] Initializing...');
    try {
        const contracts = (0, contracts_1.loadMGChatContracts)();
        console.log('[MG Chat] ✅ Contracts loaded successfully');
        console.log(`[MG Chat]    Version: ${contracts.intents.version}`);
    }
    catch (error) {
        console.error('[MG Chat] ❌ Failed to load contracts:', error);
        throw error; // Fail-fast: prevent service startup
    }
}
// Re-export for convenience
var contracts_2 = require("./contracts");
Object.defineProperty(exports, "loadMGChatContracts", { enumerable: true, get: function () { return contracts_2.loadMGChatContracts; } });
