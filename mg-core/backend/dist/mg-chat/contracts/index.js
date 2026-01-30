"use strict";
/**
 * MG Chat Contracts
 *
 * Public API for accessing MG Chat conversational contracts.
 * Contracts are loaded once at startup and cached.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMGChatContracts = loadMGChatContracts;
const contract_loader_1 = require("./contract-loader");
/**
 * Load MG Chat contracts.
 *
 * This function is idempotent and returns a read-only singleton.
 * Call this at service startup to ensure contracts are valid.
 *
 * @throws Error if contracts are invalid or missing
 * @returns Frozen, read-only contracts
 */
function loadMGChatContracts() {
    return contract_loader_1.mgChatContractLoader.load();
}
