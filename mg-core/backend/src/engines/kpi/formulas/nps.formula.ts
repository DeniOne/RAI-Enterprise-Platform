/**
 * NPS Average Formula - Phase 1.1
 * 
 * Считает средний NPS из FEEDBACK_SUBMITTED events.
 * 
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Получает только отфильтрованные events
 * - Не обращается к внешним источникам
 * - Детерминированная: одни events → один результат
 */

import { IEvent, IFeedbackSubmittedPayload } from '../../../types/core/event.types';
import { IKPIFormula } from '../../../types/core/kpi.types';

/**
 * Извлечь nps_score из payload
 * 
 * @param payload - payload события FEEDBACK_SUBMITTED
 * @returns NPS score или null если данные некорректны
 */
function extractNpsScore(payload: unknown): number | null {
    const p = payload as IFeedbackSubmittedPayload;
    if (p && typeof p.nps_score === 'number' && p.nps_score >= 0 && p.nps_score <= 10) {
        return p.nps_score;
    }
    return null;
}

/**
 * NPS Average Formula
 * 
 * Формула: AVG(nps_score) для всех FEEDBACK_SUBMITTED events
 * Возвращает 0 если нет валидных feedback
 */
export const npsAverageFormula: IKPIFormula = {
    name: 'nps_average',
    description: 'Средний NPS за период',
    source_events: ['FEEDBACK_SUBMITTED'],
    calculation_period: 'daily',
    unit: 'points',

    /**
     * Чистая функция расчёта
     * 
     * @param events - Отфильтрованные FEEDBACK_SUBMITTED events
     * @returns Среднее значение NPS или 0 если нет данных
     */
    calculate: (events: IEvent[]): number => {
        const scores: number[] = [];

        for (const event of events) {
            const score = extractNpsScore(event.payload);
            if (score !== null) {
                scores.push(score);
            }
        }

        if (scores.length === 0) {
            return 0;
        }

        const sum = scores.reduce((acc, score) => acc + score, 0);
        return sum / scores.length;
    }
};
