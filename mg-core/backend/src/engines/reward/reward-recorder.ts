/**
 * Reward Recorder - Phase 1.3
 * 
 * Записывает результат расчёта как REWARD_CALCULATED Event.
 * 
 * ВАЖНО: Это НЕ начисление, а РАСЧЁТ.
 * Фактическое начисление (REWARD_GRANTED) происходит отдельно.
 */

import { PrismaClient } from '@prisma/client';
import { IRewardCalculation } from '../../types/core/reward.types';

// =============================================================================
// REWARD RECORDER
// =============================================================================

/**
 * Записать результат расчёта как REWARD_CALCULATED Event
 * 
 * @param prisma - Prisma клиент
 * @param calculation - Результат расчёта
 * @returns Созданный Event
 */
export async function recordRewardCalculation(
    prisma: PrismaClient,
    calculation: IRewardCalculation
) {
    return prisma.event.create({
        data: {
            type: 'REWARD_GRANTED', // Используем существующий тип из Prisma
            source: 'system',
            subject_id: calculation.user_id,
            subject_type: 'user',
            payload: {
                rule_name: calculation.rule_name,
                amount: calculation.amount,
                currency: calculation.currency,
                reason: calculation.reason,
                source_event_id: calculation.source_event_id,
                status: 'calculated', // НЕ granted - только расчёт
            },
            metadata: {
                calculated_at: calculation.calculated_at.toISOString(),
            },
            timestamp: calculation.calculated_at,
        },
    });
}

/**
 * Записать несколько результатов расчёта
 * 
 * @param prisma - Prisma клиент
 * @param calculations - Результаты расчёта
 * @returns Созданные Events
 */
export async function recordMultipleRewardCalculations(
    prisma: PrismaClient,
    calculations: IRewardCalculation[]
) {
    const promises = calculations.map(c => recordRewardCalculation(prisma, c));
    return Promise.all(promises);
}
