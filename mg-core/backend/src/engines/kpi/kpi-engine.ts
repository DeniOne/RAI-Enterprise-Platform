/**
 * KPI Engine - Phase 1.1
 * 
 * Детерминированный движок расчёта KPI.
 * 
 * АРХИТЕКТУРНЫЕ ПРАВИЛА:
 * 1. ДЕТЕРМИНИЗМ: calculated_at передаётся извне, не используется в расчётах
 * 2. РАЗДЕЛЕНИЕ: Engine фильтрует → Formula считает
 * 3. ЧИСТОТА: нет состояния, нет side effects
 * 
 * Принцип: Один и тот же набор Events → всегда один и тот же KPI.
 */

import { IEvent, EventType } from '../../types/core/event.types';
import {
    IKPIFormula,
    IKPIContext,
    IKPIResult,
    IKPICalculationInput,
} from '../../types/core/kpi.types';

// =============================================================================
// VALIDATION ERRORS
// =============================================================================

export class KPIValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'KPIValidationError';
    }
}

// =============================================================================
// HELPER FUNCTIONS (PURE)
// =============================================================================

/**
 * Проверить, попадает ли timestamp в период
 * 
 * ЧИСТАЯ ФУНКЦИЯ: нет side effects
 */
function isInPeriod(timestamp: Date, periodStart: Date, periodEnd: Date): boolean {
    const t = timestamp.getTime();
    return t >= periodStart.getTime() && t <= periodEnd.getTime();
}

/**
 * Фильтровать события по типу
 * 
 * ЧИСТАЯ ФУНКЦИЯ: нет side effects
 */
function filterByEventType(events: IEvent[], types: EventType[]): IEvent[] {
    return events.filter(event => types.includes(event.type as EventType));
}

/**
 * Фильтровать события по периоду
 * 
 * ЧИСТАЯ ФУНКЦИЯ: нет side effects
 */
function filterByPeriod(events: IEvent[], periodStart: Date, periodEnd: Date): IEvent[] {
    return events.filter(event => isInPeriod(event.timestamp, periodStart, periodEnd));
}

/**
 * Фильтровать события по субъекту (user)
 * 
 * ЧИСТАЯ ФУНКЦИЯ: нет side effects
 */
function filterByUserId(events: IEvent[], userId: string): IEvent[] {
    return events.filter(event => event.subject_id === userId);
}

// =============================================================================
// KPI ENGINE
// =============================================================================

/**
 * KPI Engine - детерминированный расчёт KPI
 * 
 * ОТВЕТСТВЕННОСТЬ:
 * - Фильтрация Events по типу, периоду, субъекту
 * - Валидация входных данных
 * - Вызов Formula с отфильтрованными Events
 * - Формирование результата
 * 
 * НЕ ОТВЕТСТВЕНЕН ЗА:
 * - Хранение результата (это делает Recorder)
 * - Генерация timestamps (calculated_at передаётся извне)
 */
export class KPIEngine {
    /**
     * Рассчитать KPI
     * 
     * ДЕТЕРМИНИРОВАННЫЙ: одни и те же Events + Context → один результат
     * 
     * @param input - Все данные для расчёта
     * @returns Результат расчёта KPI
     */
    static calculate(input: IKPICalculationInput): IKPIResult {
        const { formula, events, context, calculated_at } = input;

        // 1. Валидация входных данных
        this.validateInput(input);

        // 2. Фильтрация событий по типу
        const byType = filterByEventType(events, formula.source_events);

        // 3. Фильтрация по периоду
        const byPeriod = filterByPeriod(byType, context.period_start, context.period_end);

        // 4. Фильтрация по субъекту (user_id)
        const relevantEvents = filterByUserId(byPeriod, context.user_id);

        // 5. Детерминированный расчёт (Formula получает ТОЛЬКО отфильтрованные events)
        const value = formula.calculate(relevantEvents);

        // 6. Формирование результата
        return {
            kpi_name: formula.name,
            value,
            unit: formula.unit,
            period_start: context.period_start,
            period_end: context.period_end,
            source_event_ids: relevantEvents.map(e => e.id),
            calculated_at, // Передан извне, НЕ влияет на расчёт
        };
    }

    /**
     * Валидация входных данных
     * 
     * @throws KPIValidationError если данные невалидны
     */
    private static validateInput(input: IKPICalculationInput): void {
        const { formula, context } = input;

        // Проверка обязательных полей
        if (!formula) {
            throw new KPIValidationError('Formula is required');
        }
        if (!formula.name) {
            throw new KPIValidationError('Formula name is required');
        }
        if (!formula.calculate || typeof formula.calculate !== 'function') {
            throw new KPIValidationError('Formula must have a calculate function');
        }
        if (!context) {
            throw new KPIValidationError('Context is required');
        }
        if (!context.user_id) {
            throw new KPIValidationError('Context user_id is required');
        }
        if (!context.period_start) {
            throw new KPIValidationError('Context period_start is required');
        }
        if (!context.period_end) {
            throw new KPIValidationError('Context period_end is required');
        }

        // Проверка периода
        if (context.period_end < context.period_start) {
            throw new KPIValidationError('period_end must be >= period_start');
        }
    }

    /**
     * Рассчитать несколько KPI за один проход
     * 
     * ДЕТЕРМИНИРОВАННЫЙ: одни Events → одни результаты
     */
    static calculateMultiple(
        formulas: IKPIFormula[],
        events: IEvent[],
        context: IKPIContext,
        calculated_at: Date
    ): IKPIResult[] {
        return formulas.map(formula =>
            this.calculate({ formula, events, context, calculated_at })
        );
    }
}
