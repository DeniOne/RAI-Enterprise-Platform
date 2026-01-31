"use strict";
/**
 * GMC Invariant Guards — Runtime Enforcement
 * Module 08 — BusinessCoin-Economy
 * STEP 2.2 — INVARIANT GUARDS
 *
 * ⚠️ CANONICAL: Based on STEP-2-STATE-LIFECYCLE.md Section 2.6-2.8
 *
 * GMC is IMMUTABLE after creation.
 * Guards enforce recognition-only, no-mutation rules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMCInvariantViolation = void 0;
exports.guardGMCHasRecognizer = guardGMCHasRecognizer;
exports.guardGMCRecognizerNotAI = guardGMCRecognizerNotAI;
exports.guardGMCHumanRecognizer = guardGMCHumanRecognizer;
exports.guardGMCJustification = guardGMCJustification;
exports.guardGMCPositiveAmount = guardGMCPositiveAmount;
exports.guardGMCValidCategory = guardGMCValidCategory;
exports.guardGMCImmutable = guardGMCImmutable;
exports.guardGMCNoSpend = guardGMCNoSpend;
exports.guardGMCNoTransfer = guardGMCNoTransfer;
exports.guardGMCNoExpiration = guardGMCNoExpiration;
exports.guardGMCNoFarming = guardGMCNoFarming;
exports.guardGMCNoAutomation = guardGMCNoAutomation;
exports.guardGMCNoMoneyConversion = guardGMCNoMoneyConversion;
exports.guardGMCNotReward = guardGMCNotReward;
exports.guardGMCRecognitionRequest = guardGMCRecognitionRequest;
exports.guardGMCStructuralInvariants = guardGMCStructuralInvariants;
exports.guardGMCBlockMutation = guardGMCBlockMutation;
const economy_constants_1 = require("../core/economy.constants");
// ============================================================================
// ERROR TYPES
// ============================================================================
/**
 * GMC Invariant violation error
 * Always includes invariant ID for audit and debugging
 */
class GMCInvariantViolation extends Error {
    invariantId;
    code;
    context;
    constructor(invariantId, code, message, context) {
        super(`[${invariantId}] ${message}`);
        this.name = 'GMCInvariantViolation';
        this.invariantId = invariantId;
        this.code = code;
        this.context = context;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GMCInvariantViolation);
        }
    }
}
exports.GMCInvariantViolation = GMCInvariantViolation;
// ============================================================================
// GMC STRUCTURAL INVARIANT GUARDS
// ============================================================================
/**
 * GMC-INV-001: GMC обязан иметь recognizedBy (человек)
 */
function guardGMCHasRecognizer(gmc) {
    if (!gmc.recognizedBy || gmc.recognizedBy.trim() === '') {
        throw new GMCInvariantViolation('GMC-INV-001', 'MISSING_RECOGNIZER', 'GMC must have recognizedBy (human recognizer).', { gmcId: gmc.id });
    }
}
/**
 * GMC-INV-002: recognizedBy НИКОГДА не может быть AI/System
 * ⛔ ABSOLUTE BLOCK
 */
const FORBIDDEN_RECOGNIZERS = new Set([
    'AI',
    'SYSTEM',
    'CRON',
    'AUTOMATION',
    'BOT',
    'ai',
    'system',
    'cron',
    'automation',
    'bot',
]);
function guardGMCRecognizerNotAI(recognizedBy) {
    const upperRecognizer = recognizedBy.toUpperCase();
    if (FORBIDDEN_RECOGNIZERS.has(recognizedBy) ||
        upperRecognizer.includes('AI') ||
        upperRecognizer.includes('SYSTEM') ||
        upperRecognizer.includes('BOT') ||
        upperRecognizer.includes('AUTO')) {
        throw new GMCInvariantViolation('GMC-INV-002', 'AI_RECOGNIZER_FORBIDDEN', `GMC recognizedBy CANNOT be AI or System. Got: ${recognizedBy}. This is an ABSOLUTE BLOCK.`, { recognizedBy });
    }
}
/**
 * GMC-INV-002: Validate actor type is human
 */
function guardGMCHumanRecognizer(actorType) {
    if (actorType !== 'HUMAN') {
        throw new GMCInvariantViolation('GMC-INV-002', 'NON_HUMAN_RECOGNIZER', `GMC can only be recognized by HUMAN. Got: ${actorType}. This is an ABSOLUTE BLOCK.`, { actorType });
    }
}
/**
 * GMC-INV-003: justification обязательно, минимум 50 символов
 */
function guardGMCJustification(justification) {
    if (!justification || justification.trim() === '') {
        throw new GMCInvariantViolation('GMC-INV-003', 'MISSING_JUSTIFICATION', 'GMC must have justification for recognition.', {});
    }
    const minLength = economy_constants_1.GMC_CONSTRAINTS.MIN_JUSTIFICATION_LENGTH;
    if (justification.trim().length < minLength) {
        throw new GMCInvariantViolation('GMC-INV-003', 'JUSTIFICATION_TOO_SHORT', `GMC justification must be at least ${minLength} characters. Got: ${justification.trim().length}`, { justificationLength: justification.trim().length, minLength });
    }
}
/**
 * GMC-INV-004: amount > 0
 */
function guardGMCPositiveAmount(amount) {
    if (amount === undefined || amount === null) {
        throw new GMCInvariantViolation('GMC-INV-004', 'MISSING_AMOUNT', 'GMC must have amount defined.', {});
    }
    if (amount <= 0) {
        throw new GMCInvariantViolation('GMC-INV-004', 'INVALID_AMOUNT', `GMC amount must be positive. Got: ${amount}`, { amount });
    }
}
/**
 * GMC-INV-005: category ∈ допустимых категорий
 */
const ALLOWED_CATEGORIES = new Set([
    'SYSTEMIC_CONTRIBUTION',
    'CRISIS_RESOLUTION',
    'MENTORSHIP',
    'CULTURAL_IMPACT',
]);
function guardGMCValidCategory(category) {
    if (!category) {
        throw new GMCInvariantViolation('GMC-INV-005', 'MISSING_CATEGORY', 'GMC must have category.', {});
    }
    if (!ALLOWED_CATEGORIES.has(category)) {
        throw new GMCInvariantViolation('GMC-INV-005', 'INVALID_CATEGORY', `Invalid GMC category: ${category}. Allowed: ${Array.from(ALLOWED_CATEGORIES).join(', ')}`, { category });
    }
}
// ============================================================================
// GMC IMMUTABILITY INVARIANT GUARDS
// ============================================================================
/**
 * GMC-INV-010: GMC после создания не изменяется
 */
function guardGMCImmutable(gmcId, operation) {
    throw new GMCInvariantViolation('GMC-INV-010', 'GMC_IMMUTABLE', `GMC is immutable after creation. Cannot perform: ${operation}`, { gmcId, operation });
}
/**
 * GMC-INV-011: GMC не списывается
 */
function guardGMCNoSpend(gmcId) {
    throw new GMCInvariantViolation('GMC-INV-011', 'GMC_SPEND_FORBIDDEN', 'GMC cannot be spent. GMC is a status marker, not a currency.', { gmcId });
}
/**
 * GMC-INV-012: GMC не передаётся
 */
function guardGMCNoTransfer(gmcId) {
    throw new GMCInvariantViolation('GMC-INV-012', 'GMC_TRANSFER_FORBIDDEN', 'GMC cannot be transferred. Recognition is personal and non-transferable.', { gmcId });
}
/**
 * GMC-INV-013: GMC не истекает
 */
function guardGMCNoExpiration(expiresAt) {
    if (expiresAt !== undefined && expiresAt !== null) {
        throw new GMCInvariantViolation('GMC-INV-013', 'GMC_EXPIRATION_FORBIDDEN', 'GMC cannot have expiration date. GMC is permanent.', { expiresAt });
    }
}
// ============================================================================
// GMC PROHIBITION INVARIANT GUARDS
// ============================================================================
/**
 * GMC-INV-020: GMC не фармится
 */
function guardGMCNoFarming(farmingIndicator) {
    if (farmingIndicator) {
        throw new GMCInvariantViolation('GMC-INV-020', 'GMC_FARMING_FORBIDDEN', 'GMC cannot be farmed. Farming patterns are forbidden.', {});
    }
}
/**
 * GMC-INV-021: GMC не автоматизируется
 */
function guardGMCNoAutomation(actorType) {
    if (actorType !== 'HUMAN') {
        throw new GMCInvariantViolation('GMC-INV-021', 'GMC_AUTOMATION_FORBIDDEN', `GMC cannot be automated. Actor type: ${actorType}. Only HUMAN recognition allowed.`, { actorType });
    }
}
/**
 * GMC-INV-022: GMC не конвертируется в деньги
 */
function guardGMCNoMoneyConversion(monetaryValue) {
    if (monetaryValue !== undefined && monetaryValue !== null) {
        throw new GMCInvariantViolation('GMC-INV-022', 'GMC_MONEY_CONVERSION_FORBIDDEN', 'GMC cannot be converted to money. This is an architectural error.', { monetaryValue });
    }
}
/**
 * GMC-INV-023: GMC не используется как награда/бонус
 */
function guardGMCNotReward(rewardContext) {
    if (rewardContext) {
        throw new GMCInvariantViolation('GMC-INV-023', 'GMC_REWARD_FORBIDDEN', 'GMC is not a reward or bonus. It is recognition of contribution.', {});
    }
}
// ============================================================================
// COMPOSITE GUARDS
// ============================================================================
/**
 * Validate GMC recognition request
 */
function guardGMCRecognitionRequest(request, actorType) {
    // Actor validation
    guardGMCHumanRecognizer(actorType);
    guardGMCNoAutomation(actorType);
    // Request validation
    guardGMCRecognizerNotAI(request.recognizedBy);
    guardGMCJustification(request.justification);
    guardGMCPositiveAmount(request.amount);
    guardGMCValidCategory(request.category);
}
/**
 * Validate existing GMC state
 */
function guardGMCStructuralInvariants(gmc) {
    guardGMCHasRecognizer(gmc);
    if (gmc.recognizedBy) {
        guardGMCRecognizerNotAI(gmc.recognizedBy);
    }
    guardGMCPositiveAmount(gmc.amount);
    if (gmc.category) {
        guardGMCValidCategory(gmc.category);
    }
}
/**
 * Block any mutation attempt on GMC
 */
function guardGMCBlockMutation(gmcId, operation) {
    throw new GMCInvariantViolation('GMC-INV-010', 'GMC_MUTATION_BLOCKED', `All GMC mutations are blocked. Attempted: ${operation}. GMC is immutable.`, { gmcId, operation });
}
