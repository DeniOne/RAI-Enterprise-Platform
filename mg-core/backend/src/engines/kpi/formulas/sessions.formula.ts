/**
 * Sessions Count Formula - Phase 1.1
 * 
 * Считает количество сессий из SHIFT_COMPLETED events.
 * 
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Получает только отфильтрованные events
 * - Не обращается к внешним источникам
 * - Детерминированная: одни events → один результат
 */

import { IEvent, IShiftCompletedPayload } from '../../../types/core/event.types';
import { IKPIFormula } from '../../../types/core/kpi.types';

/**
 * Извлечь sessions_count из payload
 * 
 * @param payload - payload события SHIFT_COMPLETED
 * @returns количество сессий или 0 если данные некорректны
 */
function extractSessionsCount(payload: unknown): number {
    const p = payload as IShiftCompletedPayload;
    if (p && p.fact && typeof p.fact.sessions_count === 'number') {
        return p.fact.sessions_count;
    }
    return 0;
}

/**
 * Sessions Count Formula
 * 
 * Формула: SUM(fact.sessions_count) для всех SHIFT_COMPLETED events
 */
export const sessionsCountFormula: IKPIFormula = {
    name: 'sessions_count',
    description: 'Количество завершённых сессий за период',
    source_events: ['SHIFT_COMPLETED'],
    calculation_period: 'daily',
    unit: 'сессий',

    /**
     * Чистая функция расчёта
     * 
     * @param events - Отфильтрованные SHIFT_COMPLETED events
     * @returns Сумма sessions_count
     */
    calculate: (events: IEvent[]): number => {
        return events.reduce((sum, event) => {
            return sum + extractSessionsCount(event.payload);
        }, 0);
    }
};
