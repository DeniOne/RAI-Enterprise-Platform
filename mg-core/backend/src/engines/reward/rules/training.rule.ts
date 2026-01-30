/**
 * Training Reward Rules - Phase 1.3
 * 
 * Награды за обучение.
 * 
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Триггер: COURSE_COMPLETED, TEST_PASSED Events
 */

import { IRewardInput, IRewardRule } from '../../../types/core/reward.types';
import { ICourseCompletedPayload, ITestPassedPayload } from '../../../types/core/event.types';

/**
 * Course Completion Rule
 * 
 * Награда: 200 MC за завершение курса
 */
export const courseCompletionRule: IRewardRule = {
    name: 'course_completion',
    description: 'Награда за завершение курса',
    trigger: { event_type: 'COURSE_COMPLETED' },
    amount: 200,
    currency: 'MC',

    /**
     * Проверка: курс завершён (event COURSE_COMPLETED подразумевает завершение)
     */
    check: (input: IRewardInput): boolean => {
        const payload = input.event.payload as ICourseCompletedPayload;

        if (!payload || !payload.course_id) {
            return false;
        }

        // COURSE_COMPLETED event подразумевает успешное завершение курса
        return true;
    },
};

/**
 * Test Passed Rule
 * 
 * Награда: 50 MC за успешное прохождение теста
 */
export const testPassedRule: IRewardRule = {
    name: 'test_passed',
    description: 'Награда за успешное прохождение теста',
    trigger: { event_type: 'TEST_PASSED' },
    amount: 50,
    currency: 'MC',

    /**
     * Проверка: тест пройден с score >= минимального
     */
    check: (input: IRewardInput): boolean => {
        const payload = input.event.payload as ITestPassedPayload;

        if (!payload || typeof payload.score !== 'number') {
            return false;
        }

        // Тест считается пройденным если score >= 70%
        return payload.score >= 70;
    },
};
