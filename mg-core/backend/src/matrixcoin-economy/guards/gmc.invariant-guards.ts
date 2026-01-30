/**
 * GMC Invariant Guards — Runtime Enforcement
 * Module 08 — MatrixCoin-Economy
 * STEP 2.2 — INVARIANT GUARDS
 * 
 * ⚠️ CANONICAL: Based on STEP-2-STATE-LIFECYCLE.md Section 2.6-2.8
 * 
 * GMC is IMMUTABLE after creation.
 * Guards enforce recognition-only, no-mutation rules.
 */

import { GMCState, GMCRecognitionCategory, GMCRecognitionRequest } from '../core/gmc.types';
import { GMC_CONSTRAINTS } from '../core/economy.constants';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * GMC Invariant violation error
 * Always includes invariant ID for audit and debugging
 */
export class GMCInvariantViolation extends Error {
    public readonly invariantId: string;
    public readonly code: string;
    public readonly context?: Record<string, unknown>;

    constructor(
        invariantId: string,
        code: string,
        message: string,
        context?: Record<string, unknown>
    ) {
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

// ============================================================================
// TYPE IMPORTS FOR GUARDS
// ============================================================================

import { ActorType } from './mc.invariant-guards';

// ============================================================================
// GMC STRUCTURAL INVARIANT GUARDS
// ============================================================================

/**
 * GMC-INV-001: GMC обязан иметь recognizedBy (человек)
 */
export function guardGMCHasRecognizer(gmc: Partial<GMCState>): void {
    if (!gmc.recognizedBy || gmc.recognizedBy.trim() === '') {
        throw new GMCInvariantViolation(
            'GMC-INV-001',
            'MISSING_RECOGNIZER',
            'GMC must have recognizedBy (human recognizer).',
            { gmcId: gmc.id }
        );
    }
}

/**
 * GMC-INV-002: recognizedBy НИКОГДА не может быть AI/System
 * ⛔ ABSOLUTE BLOCK
 */
const FORBIDDEN_RECOGNIZERS: ReadonlySet<string> = new Set([
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

export function guardGMCRecognizerNotAI(recognizedBy: string): void {
    const upperRecognizer = recognizedBy.toUpperCase();

    if (FORBIDDEN_RECOGNIZERS.has(recognizedBy) ||
        upperRecognizer.includes('AI') ||
        upperRecognizer.includes('SYSTEM') ||
        upperRecognizer.includes('BOT') ||
        upperRecognizer.includes('AUTO')) {
        throw new GMCInvariantViolation(
            'GMC-INV-002',
            'AI_RECOGNIZER_FORBIDDEN',
            `GMC recognizedBy CANNOT be AI or System. Got: ${recognizedBy}. This is an ABSOLUTE BLOCK.`,
            { recognizedBy }
        );
    }
}

/**
 * GMC-INV-002: Validate actor type is human
 */
export function guardGMCHumanRecognizer(actorType: ActorType): void {
    if (actorType !== 'HUMAN') {
        throw new GMCInvariantViolation(
            'GMC-INV-002',
            'NON_HUMAN_RECOGNIZER',
            `GMC can only be recognized by HUMAN. Got: ${actorType}. This is an ABSOLUTE BLOCK.`,
            { actorType }
        );
    }
}

/**
 * GMC-INV-003: justification обязательно, минимум 50 символов
 */
export function guardGMCJustification(justification?: string): void {
    if (!justification || justification.trim() === '') {
        throw new GMCInvariantViolation(
            'GMC-INV-003',
            'MISSING_JUSTIFICATION',
            'GMC must have justification for recognition.',
            {}
        );
    }

    const minLength = GMC_CONSTRAINTS.MIN_JUSTIFICATION_LENGTH;
    if (justification.trim().length < minLength) {
        throw new GMCInvariantViolation(
            'GMC-INV-003',
            'JUSTIFICATION_TOO_SHORT',
            `GMC justification must be at least ${minLength} characters. Got: ${justification.trim().length}`,
            { justificationLength: justification.trim().length, minLength }
        );
    }
}

/**
 * GMC-INV-004: amount > 0
 */
export function guardGMCPositiveAmount(amount?: number): void {
    if (amount === undefined || amount === null) {
        throw new GMCInvariantViolation(
            'GMC-INV-004',
            'MISSING_AMOUNT',
            'GMC must have amount defined.',
            {}
        );
    }

    if (amount <= 0) {
        throw new GMCInvariantViolation(
            'GMC-INV-004',
            'INVALID_AMOUNT',
            `GMC amount must be positive. Got: ${amount}`,
            { amount }
        );
    }
}

/**
 * GMC-INV-005: category ∈ допустимых категорий
 */
const ALLOWED_CATEGORIES: ReadonlySet<GMCRecognitionCategory> = new Set([
    'SYSTEMIC_CONTRIBUTION',
    'CRISIS_RESOLUTION',
    'MENTORSHIP',
    'CULTURAL_IMPACT',
]);

export function guardGMCValidCategory(category?: GMCRecognitionCategory): void {
    if (!category) {
        throw new GMCInvariantViolation(
            'GMC-INV-005',
            'MISSING_CATEGORY',
            'GMC must have category.',
            {}
        );
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
        throw new GMCInvariantViolation(
            'GMC-INV-005',
            'INVALID_CATEGORY',
            `Invalid GMC category: ${category}. Allowed: ${Array.from(ALLOWED_CATEGORIES).join(', ')}`,
            { category }
        );
    }
}

// ============================================================================
// GMC IMMUTABILITY INVARIANT GUARDS
// ============================================================================

/**
 * GMC-INV-010: GMC после создания не изменяется
 */
export function guardGMCImmutable(gmcId: string, operation: string): void {
    throw new GMCInvariantViolation(
        'GMC-INV-010',
        'GMC_IMMUTABLE',
        `GMC is immutable after creation. Cannot perform: ${operation}`,
        { gmcId, operation }
    );
}

/**
 * GMC-INV-011: GMC не списывается
 */
export function guardGMCNoSpend(gmcId: string): void {
    throw new GMCInvariantViolation(
        'GMC-INV-011',
        'GMC_SPEND_FORBIDDEN',
        'GMC cannot be spent. GMC is a status marker, not a currency.',
        { gmcId }
    );
}

/**
 * GMC-INV-012: GMC не передаётся
 */
export function guardGMCNoTransfer(gmcId: string): void {
    throw new GMCInvariantViolation(
        'GMC-INV-012',
        'GMC_TRANSFER_FORBIDDEN',
        'GMC cannot be transferred. Recognition is personal and non-transferable.',
        { gmcId }
    );
}

/**
 * GMC-INV-013: GMC не истекает
 */
export function guardGMCNoExpiration(expiresAt?: Date): void {
    if (expiresAt !== undefined && expiresAt !== null) {
        throw new GMCInvariantViolation(
            'GMC-INV-013',
            'GMC_EXPIRATION_FORBIDDEN',
            'GMC cannot have expiration date. GMC is permanent.',
            { expiresAt }
        );
    }
}

// ============================================================================
// GMC PROHIBITION INVARIANT GUARDS
// ============================================================================

/**
 * GMC-INV-020: GMC не фармится
 */
export function guardGMCNoFarming(farmingIndicator?: boolean): void {
    if (farmingIndicator) {
        throw new GMCInvariantViolation(
            'GMC-INV-020',
            'GMC_FARMING_FORBIDDEN',
            'GMC cannot be farmed. Farming patterns are forbidden.',
            {}
        );
    }
}

/**
 * GMC-INV-021: GMC не автоматизируется
 */
export function guardGMCNoAutomation(actorType: ActorType): void {
    if (actorType !== 'HUMAN') {
        throw new GMCInvariantViolation(
            'GMC-INV-021',
            'GMC_AUTOMATION_FORBIDDEN',
            `GMC cannot be automated. Actor type: ${actorType}. Only HUMAN recognition allowed.`,
            { actorType }
        );
    }
}

/**
 * GMC-INV-022: GMC не конвертируется в деньги
 */
export function guardGMCNoMoneyConversion(monetaryValue?: number): void {
    if (monetaryValue !== undefined && monetaryValue !== null) {
        throw new GMCInvariantViolation(
            'GMC-INV-022',
            'GMC_MONEY_CONVERSION_FORBIDDEN',
            'GMC cannot be converted to money. This is an architectural error.',
            { monetaryValue }
        );
    }
}

/**
 * GMC-INV-023: GMC не используется как награда/бонус
 */
export function guardGMCNotReward(rewardContext?: boolean): void {
    if (rewardContext) {
        throw new GMCInvariantViolation(
            'GMC-INV-023',
            'GMC_REWARD_FORBIDDEN',
            'GMC is not a reward or bonus. It is recognition of contribution.',
            {}
        );
    }
}

// ============================================================================
// COMPOSITE GUARDS
// ============================================================================

/**
 * Validate GMC recognition request
 */
export function guardGMCRecognitionRequest(
    request: GMCRecognitionRequest,
    actorType: ActorType
): void {
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
export function guardGMCStructuralInvariants(gmc: Partial<GMCState>): void {
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
export function guardGMCBlockMutation(gmcId: string, operation: string): never {
    throw new GMCInvariantViolation(
        'GMC-INV-010',
        'GMC_MUTATION_BLOCKED',
        `All GMC mutations are blocked. Attempted: ${operation}. GMC is immutable.`,
        { gmcId, operation }
    );
}
