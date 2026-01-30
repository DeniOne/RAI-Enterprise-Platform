/**
 * KPI Recorder - Phase 1.1
 * 
 * Записывает результат расчёта KPI как Event типа KPI_RECORDED.
 * 
 * ОТВЕТСТВЕННОСТЬ:
 * - Сохранение KPIResult в Event Store
 * 
 * НЕ ОТВЕТСТВЕНЕН ЗА:
 * - Расчёт KPI (это делает Engine)
 */

import { PrismaClient } from '@prisma/client';
import { IKPIResult } from '../../types/core/kpi.types';

// =============================================================================
// KPI RECORDER
// =============================================================================

/**
 * Записать результат расчёта KPI как Event
 * 
 * @param prisma - Prisma клиент
 * @param result - Результат расчёта KPI
 * @param userId - ID пользователя
 * @returns Созданный Event
 */
export async function recordKPIResult(
    prisma: PrismaClient,
    result: IKPIResult,
    userId: string
) {
    return prisma.event.create({
        data: {
            type: 'KPI_RECORDED',
            source: 'system',
            subject_id: userId,
            subject_type: 'user',
            payload: {
                kpi_id: `${result.kpi_name}_${result.period_start.toISOString()}`,
                kpi_name: result.kpi_name,
                user_id: userId,
                value: result.value,
                unit: result.unit,
                period_start: result.period_start.toISOString(),
                period_end: result.period_end.toISOString(),
                source_event_ids: result.source_event_ids,
            },
            metadata: {
                calculated_at: result.calculated_at.toISOString(),
            },
            timestamp: result.calculated_at,
        },
    });
}

/**
 * Записать несколько результатов KPI
 * 
 * @param prisma - Prisma клиент
 * @param results - Результаты расчёта KPI
 * @param userId - ID пользователя
 * @returns Созданные Events
 */
export async function recordMultipleKPIResults(
    prisma: PrismaClient,
    results: IKPIResult[],
    userId: string
) {
    const promises = results.map(result => recordKPIResult(prisma, result, userId));
    return Promise.all(promises);
}
