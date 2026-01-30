"use strict";
/**
 * Shift Completion Reward Rule - Phase 1.3
 *
 * Награда за завершение смены.
 *
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Триггер: SHIFT_COMPLETED Event
 * - check() проверяет дополнительные условия
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.successfulShiftRule = exports.shiftCompletionRule = void 0;
/**
 * Shift Completion Rule
 *
 * Награда: 100 MC за каждую завершённую смену
 */
exports.shiftCompletionRule = {
    name: 'shift_completion',
    description: 'Награда за завершение смены',
    trigger: { event_type: 'SHIFT_COMPLETED' },
    amount: 100,
    currency: 'MC',
    /**
     * Проверка дополнительных условий
     *
     * Условие: смена должна иметь duration_minutes > 0
     */
    check: (input) => {
        const payload = input.event.payload;
        // Смена должна иметь продолжительность
        if (!payload || typeof payload.duration_minutes !== 'number') {
            return false;
        }
        return payload.duration_minutes > 0;
    },
};
/**
 * Successful Shift Rule
 *
 * Бонус: 50 MC если план выполнен или перевыполнен
 */
exports.successfulShiftRule = {
    name: 'successful_shift',
    description: 'Бонус за выполнение плана смены',
    trigger: { event_type: 'SHIFT_COMPLETED' },
    amount: 50,
    currency: 'MC',
    /**
     * Проверка: fact.sessions_count >= plan.sessions_count
     */
    check: (input) => {
        const payload = input.event.payload;
        if (!payload || !payload.plan || !payload.fact) {
            return false;
        }
        return payload.fact.sessions_count >= payload.plan.sessions_count;
    },
};
