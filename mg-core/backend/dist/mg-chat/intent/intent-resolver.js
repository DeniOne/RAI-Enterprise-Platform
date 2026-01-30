"use strict";
/**
 * Intent Resolver
 *
 * Resolves user message to intent_id with confidence threshold.
 * Pure classification layer - no side effects, no business logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveIntent = resolveIntent;
const contracts_1 = require("../contracts");
const intent_matcher_1 = require("./intent-matcher");
// =============================================================================
// CONFIGURATION
// =============================================================================
const CONFIDENCE_THRESHOLD = 0.6;
// =============================================================================
// RESOLVER
// =============================================================================
/**
 * Resolve user message to intent.
 *
 * @param message - User input text
 * @returns Resolution result with intent or reason for failure
 */
function resolveIntent(message) {
    // 1. Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return {
            resolved: false,
            reason: 'NO_MATCH'
        };
    }
    // 2. Load contracts (cached singleton)
    const contracts = (0, contracts_1.loadMGChatContracts)();
    // 3. Match against intent examples
    const match = (0, intent_matcher_1.matchIntent)(message, contracts.intents.intents);
    // 4. Apply confidence threshold
    if (!match) {
        return {
            resolved: false,
            reason: 'NO_MATCH'
        };
    }
    if (match.confidence < CONFIDENCE_THRESHOLD) {
        return {
            resolved: false,
            reason: 'LOW_CONFIDENCE'
        };
    }
    // 5. Return resolved intent
    return {
        resolved: true,
        intent: {
            ...match,
            userId: '', // Still empty, filled by adapter
            slots: {}
        }
    };
}
