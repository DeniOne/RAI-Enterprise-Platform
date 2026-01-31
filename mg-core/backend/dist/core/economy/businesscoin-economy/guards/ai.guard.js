"use strict";
/**
 * AI Integration Guard
 * Module 08 — BusinessCoin-Economy
 *
 * Гарантирует, что AI остаётся read-only advisory.
 *
 * ⛔ ABSOLUTE: Любое нарушение = BLOCKED
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGuardViolationError = void 0;
exports.assertAIReadOnly = assertAIReadOnly;
exports.assertAICannotInitiateEvents = assertAICannotInitiateEvents;
exports.assertAIDataIsAggregated = assertAIDataIsAggregated;
exports.assertAICannotInteractWithStore = assertAICannotInteractWithStore;
exports.assertAICannotParticipateInAuction = assertAICannotParticipateInAuction;
exports.assertAICannotRecognizeGMC = assertAICannotRecognizeGMC;
const economy_constants_1 = require("../core/economy.constants");
/**
 * Проверяет, что вызов исходит от AI и запрещает write-операции
 */
function assertAIReadOnly(isAIContext, isWriteOperation) {
    if (!economy_constants_1.AI_CONSTRAINTS.HAS_WRITE_ACCESS && isAIContext && isWriteOperation) {
        throw new AIGuardViolationError('AI cannot perform write operations on economy');
    }
}
/**
 * Проверяет, что AI не инициирует экономические события
 */
function assertAICannotInitiateEvents(isAIContext) {
    if (!economy_constants_1.AI_CONSTRAINTS.CAN_INITIATE_EVENTS && isAIContext) {
        throw new AIGuardViolationError('AI cannot initiate economy events');
    }
}
/**
 * Проверяет, что данные для AI — только агрегированные
 */
function assertAIDataIsAggregated(isAIContext, containsPersonalData) {
    if (!economy_constants_1.AI_CONSTRAINTS.HAS_PERSONAL_DATA_ACCESS && isAIContext && containsPersonalData) {
        throw new AIGuardViolationError('AI cannot receive personal economy data');
    }
}
/**
 * Проверяет, что AI не участвует в Store
 */
function assertAICannotInteractWithStore(isAIContext) {
    if (!economy_constants_1.AI_CONSTRAINTS.CAN_INTERACT_WITH_STORE && isAIContext) {
        throw new AIGuardViolationError('AI cannot interact with Store');
    }
}
/**
 * Проверяет, что AI не участвует в Auction
 */
function assertAICannotParticipateInAuction(isAIContext) {
    if (!economy_constants_1.AI_CONSTRAINTS.CAN_PARTICIPATE_IN_AUCTION && isAIContext) {
        throw new AIGuardViolationError('AI cannot participate in Auction');
    }
}
/**
 * Проверяет, что AI не может признавать GMC
 */
function assertAICannotRecognizeGMC(isAIContext) {
    if (!economy_constants_1.AI_CONSTRAINTS.CAN_RECOGNIZE_GMC && isAIContext) {
        throw new AIGuardViolationError('AI cannot recognize GMC');
    }
}
/**
 * AI Guard Violation Error
 */
class AIGuardViolationError extends Error {
    code = 'AI_GUARD_VIOLATION';
    constructor(message) {
        super(`AI_GUARD_VIOLATION: ${message}`);
        this.name = 'AIGuardViolationError';
    }
}
exports.AIGuardViolationError = AIGuardViolationError;
