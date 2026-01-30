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

import { GMC_CONSTRAINTS } from '../core/economy.constants';
import type { GMCRecognitionRequest } from '../core/gmc.types';

/**
 * Проверяет, что GMC признан человеком, а не AI
 * ⛔ ABSOLUTE: AI НИКОГДА не может быть recognizedBy
 */
export function assertGMCRecognizedByHuman(recognizedBy: string): void {
    if (GMC_CONSTRAINTS.CAN_BE_AUTO_GRANTED) return; // Guard disabled

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
export function assertJustificationValid(justification: string): void {
    const minLength = GMC_CONSTRAINTS.MIN_JUSTIFICATION_LENGTH;

    if (!justification || justification.trim().length < minLength) {
        throw new GMCGuardViolationError(
            `GMC justification must be at least ${minLength} characters (got: ${justification?.length || 0})`
        );
    }
}

/**
 * Проверяет, что GMC не является "наградой"
 * ⚠️ GUARD: GMC — признание, не reward
 */
export function assertGMCNotReward(metadata?: Record<string, unknown>): void {
    if (GMC_CONSTRAINTS.IS_REWARD) return; // Guard disabled

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
export function validateGMCRecognitionRequest(request: GMCRecognitionRequest): void {
    assertGMCRecognizedByHuman(request.recognizedBy);
    assertJustificationValid(request.justification);
}

/**
 * GMC Guard Violation Error
 */
export class GMCGuardViolationError extends Error {
    readonly code = 'GMC_GUARD_VIOLATION';

    constructor(message: string) {
        super(`GMC_GUARD_VIOLATION: ${message}`);
        this.name = 'GMCGuardViolationError';
    }
}
