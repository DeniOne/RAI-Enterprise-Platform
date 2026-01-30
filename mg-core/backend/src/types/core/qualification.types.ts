/**
 * Qualification Types - Phase 1.2
 * 
 * Canon: Qualification Engine ТОЛЬКО оценивает, НЕ принимает решений.
 * Принцип: Одни Events + KPI → один Qualification State.
 * 
 * АРХИТЕКТУРНЫЕ ПРАВИЛА:
 * 1. ОЦЕНКА ≠ РЕШЕНИЕ: Engine предлагает, человек решает
 * 2. ДЕТЕРМИНИЗМ: evaluated_at передаётся извне
 * 3. EVIDENCE: каждое состояние объяснимо фактами
 */

import { EventType } from './event.types';
import { IKPIResult } from './kpi.types';

// =============================================================================
// QUALIFICATION STATE
// =============================================================================

/**
 * Qualification State - текущее состояние квалификации
 * 
 * Это ФАКТ, оценённый из Events и KPI.
 * НЕ является решением — решение принимает человек.
 */
export type QualificationState =
    | 'stable'               // Стабильное состояние
    | 'eligible_for_upgrade' // Готов к повышению (ФАКТ из Events/KPI)
    | 'risk_of_downgrade';   // Риск понижения (ФАКТ из Events/KPI)

// =============================================================================
// EVIDENCE
// =============================================================================

/**
 * Evidence Type - тип доказательства
 */
export type EvidenceType = 'kpi' | 'event' | 'time' | 'training';

/**
 * Evidence - доказательство для оценки квалификации
 * 
 * Каждое состояние должно быть объяснимо через evidence.
 * Evidence собирается ТОЛЬКО из Canon Events.
 */
export interface IQualificationEvidence {
    /** Тип доказательства */
    type: EvidenceType;
    /** Описание доказательства */
    description: string;
    /** Значение (число или строка) */
    value: string | number;
    /** Является ли это позитивным или негативным фактом */
    polarity: 'positive' | 'negative' | 'neutral';
    /** ID исходного события (для трейсинга) */
    source_event_id?: string;
}

// =============================================================================
// QUALIFICATION INPUT
// =============================================================================

/**
 * Qualification Input - вход для оценки
 * 
 * Содержит все данные, необходимые для детерминированной оценки.
 */
export interface IQualificationInput {
    /** ID пользователя */
    user_id: string;
    /** ID роли */
    role_id: string;
    /** Текущий уровень квалификации (1-5) */
    current_level: number;
    /** KPI за период (из KPI_RECORDED Events) */
    kpi_results: IKPIResult[];
    /** Релевантные события (обучение, наставничество и т.д.) */
    events: IQualificationEvent[];
    /** Дата достижения текущего уровня */
    level_achieved_at: Date;
    /** Требования из RoleContract для текущего уровня */
    requirements: IQualificationRequirements;
    /**
     * Время оценки (для evaluated_at в результате)
     * 
     * ВНЕШНИЙ ПАРАМЕТР: передаётся извне, не влияет на оценку.
     */
    evaluated_at: Date;
}

/**
 * Qualification Event - событие для оценки квалификации
 */
export interface IQualificationEvent {
    id: string;
    type: EventType;
    timestamp: Date;
    payload: Record<string, unknown>;
}

/**
 * Qualification Requirements - требования из RoleContract
 */
export interface IQualificationRequirements {
    /** Минимальное время на текущем уровне (дней) */
    min_days_at_level: number;
    /** Количество завершённых курсов для повышения */
    required_courses: number;
    /** KPI targets для текущего уровня */
    kpi_targets: Record<string, number>;
    /** Минимальный NPS для повышения */
    min_nps?: number;
}

// =============================================================================
// QUALIFICATION EVALUATION (OUTPUT)
// =============================================================================

/**
 * Qualification Evaluation - результат оценки
 * 
 * Содержит state и evidence.
 * НЕ содержит решений — только оценку.
 */
export interface IQualificationEvaluation {
    /** ID пользователя */
    user_id: string;
    /** ID роли */
    role_id: string;
    /** Текущий уровень квалификации */
    current_level: number;
    /** Оценённое состояние (ФАКТ) */
    state: QualificationState;
    /** Доказательства для состояния */
    evidence: IQualificationEvidence[];
    /** Дней на текущем уровне */
    days_at_current_level: number;
    /**
     * Время оценки
     * 
     * ВАЖНО: НЕ используется в оценке!
     * Передаётся извне только для логирования/аудита.
     */
    evaluated_at: Date;
}

// =============================================================================
// QUALIFICATION RULE
// =============================================================================

/**
 * Qualification Rule - правило оценки
 * 
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Возвращает boolean (условие выполнено / не выполнено)
 * - Не имеет побочных эффектов
 * - Не читает БД
 * - Не принимает решений — только проверяет ФАКТЫ
 */
export interface IQualificationRule {
    /** Уникальное имя правила */
    name: string;
    /** Описание правила */
    description: string;
    /** Тип состояния, которое проверяет правило */
    target_state: QualificationState;
    /**
     * Чистая функция проверки
     * 
     * @param input - Входные данные для оценки
     * @returns true если условие выполнено, false иначе
     */
    check: (input: IQualificationInput) => boolean;
    /**
     * Сбор evidence для правила
     * 
     * @param input - Входные данные
     * @returns Список доказательств
     */
    collectEvidence: (input: IQualificationInput) => IQualificationEvidence[];
}

// =============================================================================
// TYPE HELPERS
// =============================================================================

/**
 * Input для создания QualificationEvaluation без evaluated_at
 */
export type CreateQualificationEvaluationInput = Omit<IQualificationEvaluation, 'evaluated_at'>;
