"use strict";
/**
 * GMC Semantic Guard
 * Module 08 — MatrixCoin-Economy
 *
 * Защищает семантическую целостность GMC.
 *
 * ⛔ ABSOLUTE GUARDS:
 * - GMC не может быть признан AI
 * - GMC не автоматизируется
 * - GMC не фармится
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMCGuardViolationError = void 0;
exports.assertGMCRecognizedByHuman = assertGMCRecognizedByHuman;
exports.assertJustificationValid = assertJustificationValid;
exports.assertGMCNotReward = assertGMCNotReward;
exports.validateGMCRecognitionRequest = validateGMCRecognitionRequest;
const economy_constants_1 = require("../core/economy.constants");
/**
 * Проверяет, что GMC признан человеком, а не AI
 * ⛔ ABSOLUTE: AI НИКОГДА не может быть recognizedBy
 */
function assertGMCRecognizedByHuman(recognizedBy) {
    if (economy_constants_1.GMC_CONSTRAINTS.CAN_BE_AUTO_GRANTED)
        return; // Guard disabled
    const AI_IDENTIFIERS = ['AI', 'SYSTEM', 'AUTO', 'BOT', 'ALGORITHM', 'COPILOT'];
    for (const aiId of AI_IDENTIFIERS) {
        if (recognizedBy.toUpperCase().includes(aiId)) {
            throw new GMCGuardViolationError(`GMC cannot be recognized by AI: ${recognizedBy}`);
        }
    }
}
/**
 * Проверяет минимальную длину обоснования признания
 * ⚠️ GUARD: Признание требует осмысленного обоснования
 */
function assertJustificationValid(justification) {
    const minLength = economy_constants_1.GMC_CONSTRAINTS.MIN_JUSTIFICATION_LENGTH;
    if (!justification || justification.trim().length < minLength) {
        throw new GMCGuardViolationError(`GMC justification must be at least ${minLength} characters (got: ${justification?.length || 0})`);
    }
}
/**
 * Проверяет, что GMC не является "наградой"
 * ⚠️ GUARD: GMC — признание, не reward
 */
function assertGMCNotReward(metadata) {
    if (economy_constants_1.GMC_CONSTRAINTS.IS_REWARD)
        return; // Guard disabled
    const REWARD_KEYWORDS = ['prize', 'bonus', 'award', 'win', 'victory'];
    if (metadata) {
        const metaString = JSON.stringify(metadata).toLowerCase();
        for (const keyword of REWARD_KEYWORDS) {
            if (metaString.includes(keyword)) {
                throw new GMCGuardViolationError('GMC cannot be framed as reward/prize/bonus');
            }
        }
    }
}
/**
 * Полная валидация запроса на признание GMC
 */
function validateGMCRecognitionRequest(request) {
    assertGMCRecognizedByHuman(request.recognizedBy);
    assertJustificationValid(request.justification);
}
/**
 * GMC Guard Violation Error
 */
class GMCGuardViolationError extends Error {
    code = 'GMC_GUARD_VIOLATION';
    constructor(message) {
        super(`GMC_GUARD_VIOLATION: ${message}`);
        this.name = 'GMCGuardViolationError';
    }
}
exports.GMCGuardViolationError = GMCGuardViolationError;
