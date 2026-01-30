/**
 * Revenue Formula - Phase 1.1
 * 
 * Считает общую выручку из SHIFT_COMPLETED events.
 * 
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Получает только отфильтрованные events
 * - Не обращается к внешним источникам
 * - Детерминированная: одни events → один результат
 */

import { IEvent, IShiftCompletedPayload } from '../../../types/core/event.types';
import { IKPIFormula } from '../../../types/core/kpi.types';

/**
 * Извлечь revenue из payload
 * 
 * @param payload - payload события SHIFT_COMPLETED
 * @returns выручка или 0 если данные некорректны
 */
function extractRevenue(payload: unknown): number {
    const p = payload as IShiftCompletedPayload;
    if (p && p.fact && typeof p.fact.revenue === 'number') {
        return p.fact.revenue;
    }
    return 0;
}

/**
 * Revenue Formula
 * 
 * Формула: SUM(fact.revenue) для всех SHIFT_COMPLETED events
 */
export const revenueFormula: IKPIFormula = {
    name: 'revenue',
    description: 'Общая выручка за период',
    source_events: ['SHIFT_COMPLETED'],
    calculation_period: 'daily',
    unit: 'руб',

    /**
     * Чистая функция расчёта
     * 
     * @param events - Отфильтрованные SHIFT_COMPLETED events
     * @returns Сумма revenue
     */
    calculate: (events: IEvent[]): number => {
        return events.reduce((sum, event) => {
            return sum + extractRevenue(event.payload);
        }, 0);
    }
};
