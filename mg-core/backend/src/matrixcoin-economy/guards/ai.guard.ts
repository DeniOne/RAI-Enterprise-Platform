/**
 * AI Integration Guard
 * Module 08 — MatrixCoin-Economy
 * 
 * Гарантирует, что AI остаётся read-only advisory.
 * 
 * ⛔ ABSOLUTE: Любое нарушение = BLOCKED
 */

import { AI_CONSTRAINTS } from '../core/economy.constants';

/**
 * Проверяет, что вызов исходит от AI и запрещает write-операции
 */
export function assertAIReadOnly(isAIContext: boolean, isWriteOperation: boolean): void {
    if (!AI_CONSTRAINTS.HAS_WRITE_ACCESS && isAIContext && isWriteOperation) {
        throw new AIGuardViolationError('AI cannot perform write operations on economy');
    }
}

/**
 * Проверяет, что AI не инициирует экономические события
 */
export function assertAICannotInitiateEvents(isAIContext: boolean): void {
    if (!AI_CONSTRAINTS.CAN_INITIATE_EVENTS && isAIContext) {
        throw new AIGuardViolationError('AI cannot initiate economy events');
    }
}

/**
 * Проверяет, что данные для AI — только агрегированные
 */
export function assertAIDataIsAggregated(isAIContext: boolean, containsPersonalData: boolean): void {
    if (!AI_CONSTRAINTS.HAS_PERSONAL_DATA_ACCESS && isAIContext && containsPersonalData) {
        throw new AIGuardViolationError('AI cannot receive personal economy data');
    }
}

/**
 * Проверяет, что AI не участвует в Store
 */
export function assertAICannotInteractWithStore(isAIContext: boolean): void {
    if (!AI_CONSTRAINTS.CAN_INTERACT_WITH_STORE && isAIContext) {
        throw new AIGuardViolationError('AI cannot interact with Store');
    }
}

/**
 * Проверяет, что AI не участвует в Auction
 */
export function assertAICannotParticipateInAuction(isAIContext: boolean): void {
    if (!AI_CONSTRAINTS.CAN_PARTICIPATE_IN_AUCTION && isAIContext) {
        throw new AIGuardViolationError('AI cannot participate in Auction');
    }
}

/**
 * Проверяет, что AI не может признавать GMC
 */
export function assertAICannotRecognizeGMC(isAIContext: boolean): void {
    if (!AI_CONSTRAINTS.CAN_RECOGNIZE_GMC && isAIContext) {
        throw new AIGuardViolationError('AI cannot recognize GMC');
    }
}

/**
 * AI Guard Violation Error
 */
export class AIGuardViolationError extends Error {
    readonly code = 'AI_GUARD_VIOLATION';

    constructor(message: string) {
        super(`AI_GUARD_VIOLATION: ${message}`);
        this.name = 'AIGuardViolationError';
    }
}
