"use strict";
/**
 * Reward Engine - Phase 1.3
 *
 * Детерминированный расчёт вознаграждений.
 *
 * АРХИТЕКТУРНЫЕ ПРАВИЛА:
 * 1. REWARD ≠ РЕШЕНИЕ: Engine рассчитывает, не начисляет
 * 2. ТРИГГЕРЫ: только Events
 * 3. ДЕТЕРМИНИЗМ: calculated_at передаётся извне
 *
 * Принцип: Reward — следствие, не причина.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardEngine = exports.RewardValidationError = void 0;
const rules_1 = require("./rules");
// =============================================================================
// VALIDATION ERRORS
// =============================================================================
class RewardValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RewardValidationError';
    }
}
exports.RewardValidationError = RewardValidationError;
// =============================================================================
// REWARD ENGINE
// =============================================================================
/**
 * Reward Engine - детерминированный расчёт вознаграждений
 *
 * ОТВЕТСТВЕННОСТЬ:
 * - Определение применимых правил по типу события
 * - Проверка дополнительных условий
 * - Формирование результатов расчёта
 *
 * НЕ ОТВЕТСТВЕНЕН ЗА:
 * - Начисление балансов
 * - Изменение данных
 * - Принятие решений о "грантовании"
 */
class RewardEngine {
    /**
     * Рассчитать вознаграждения для события
     *
     * ДЕТЕРМИНИРОВАННЫЙ: одни Events → одни Rewards
     *
     * @param input - Входные данные
     * @returns Список рассчитанных вознаграждений
     */
    static calculate(input) {
        // 1. Валидация входных данных
        this.validateInput(input);
        // 2. Получить правила для этого типа события
        const eventType = input.event.type;
        const applicableRules = (0, rules_1.getRulesByEventType)(eventType);
        // 3. Проверить каждое правило и сформировать результаты
        const calculations = [];
        for (const rule of applicableRules) {
            // Проверяем дополнительные условия
            if (rule.check(input)) {
                calculations.push({
                    rule_name: rule.name,
                    amount: rule.amount,
                    currency: rule.currency,
                    reason: rule.description,
                    user_id: input.user_id,
                    source_event_id: input.event.id,
                    calculated_at: input.calculated_at, // Передан извне
                });
            }
        }
        return calculations;
    }
    /**
     * Рассчитать вознаграждения для нескольких событий
     *
     * @param events - Список входных данных
     * @returns Все рассчитанные вознаграждения
     */
    static calculateMultiple(inputs) {
        const allCalculations = [];
        for (const input of inputs) {
            const calculations = this.calculate(input);
            allCalculations.push(...calculations);
        }
        return allCalculations;
    }
    /**
     * Получить правила, применимые к типу события
     */
    static getRulesForEvent(eventType) {
        return (0, rules_1.getRulesByEventType)(eventType);
    }
    /**
     * Валидация входных данных
     */
    static validateInput(input) {
        if (!input) {
            throw new RewardValidationError('Input is required');
        }
        if (!input.event) {
            throw new RewardValidationError('event is required');
        }
        if (!input.event.id) {
            throw new RewardValidationError('event.id is required');
        }
        if (!input.event.type) {
            throw new RewardValidationError('event.type is required');
        }
        if (!input.user_id) {
            throw new RewardValidationError('user_id is required');
        }
        if (!input.calculated_at) {
            throw new RewardValidationError('calculated_at is required');
        }
    }
}
exports.RewardEngine = RewardEngine;
