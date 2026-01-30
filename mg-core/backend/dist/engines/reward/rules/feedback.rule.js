"use strict";
/**
 * Feedback Reward Rules - Phase 1.3
 *
 * Награды за положительные отзывы.
 *
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Триггер: FEEDBACK_SUBMITTED Event
 * - check() проверяет NPS score в payload
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfectScoreRule = exports.positiveFeedbackRule = void 0;
/**
 * Positive Feedback Rule
 *
 * Награда: 20 MC за каждый положительный отзыв (NPS >= 9)
 */
exports.positiveFeedbackRule = {
    name: 'positive_feedback',
    description: 'Награда за положительный отзыв (NPS >= 9)',
    trigger: { event_type: 'FEEDBACK_SUBMITTED' },
    amount: 20,
    currency: 'MC',
    /**
     * Проверка: nps_score >= 9
     */
    check: (input) => {
        const payload = input.event.payload;
        if (!payload || typeof payload.nps_score !== 'number') {
            return false;
        }
        return payload.nps_score >= 9;
    },
};
/**
 * Perfect Score Rule
 *
 * Бонус: 50 MC за идеальный отзыв (NPS = 10)
 */
exports.perfectScoreRule = {
    name: 'perfect_score',
    description: 'Бонус за идеальный отзыв (NPS = 10)',
    trigger: { event_type: 'FEEDBACK_SUBMITTED' },
    amount: 50,
    currency: 'MC',
    /**
     * Проверка: nps_score === 10
     */
    check: (input) => {
        const payload = input.event.payload;
        if (!payload || typeof payload.nps_score !== 'number') {
            return false;
        }
        return payload.nps_score === 10;
    },
};
