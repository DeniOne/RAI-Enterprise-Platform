/**
 * Core Event Types - Phase 0.3
 * 
 * Canon: События — единственный источник фактов. Нет KPI без события.
 * Canon: Каждому EventType соответствует строго один canonical payload schema.
 * 
 * Эти типы описывают структуру событий в системе.
 * Event Store является единственным источником фактов для всех Engines.
 */

// =============================================================================
// EVENT TYPE ENUM
// =============================================================================

/**
 * Все типы событий в системе
 * 
 * Canon: Каждый EventType имеет строго один canonical payload.
 * Никаких произвольных payload для одного и того же EventType.
 */
export const EventTypes = [
    'SHIFT_STARTED',
    'SHIFT_COMPLETED',
    'KPI_RECORDED',
    'FEEDBACK_SUBMITTED',
    'COURSE_COMPLETED',
    'TEST_PASSED',
    'MENTORING_COMPLETED',
    'QUALIFICATION_PROPOSED',
    'QUALIFICATION_CHANGED',
    'REWARD_GRANTED',
    'TASK_CREATED',
    'TASK_COMPLETED',
    'TRANSACTION_CREATED',
    'PHOTOCOMPANY_RESULT', // Module 13: PhotoCompany shift results
] as const;

export type EventType = typeof EventTypes[number];

// =============================================================================
// SUBJECT TYPES
// =============================================================================

/**
 * Типы субъектов событий
 */
export const SubjectTypes = ['user', 'task', 'shift', 'session', 'order'] as const;
export type SubjectType = typeof SubjectTypes[number];

// =============================================================================
// EVENT SOURCES
// =============================================================================

/**
 * Источники событий
 */
export const EventSources = ['system', 'user', 'api', 'scheduler'] as const;
export type EventSource = typeof EventSources[number];

// =============================================================================
// BASE EVENT INTERFACE
// =============================================================================

/**
 * Базовый интерфейс события
 * 
 * Все события в системе следуют этой структуре.
 * Payload типизируется через EventPayloadMap.
 */
export interface IEvent<T extends EventType = EventType> {
    id: string;
    type: T;
    source: EventSource;
    subject_id: string;
    subject_type: SubjectType;
    payload: EventPayloadMap[T];
    metadata?: IEventMetadata;
    timestamp: Date;
}

/**
 * Метаданные события (опционально)
 */
export interface IEventMetadata {
    /** IP адрес источника */
    ip_address?: string;
    /** User Agent */
    user_agent?: string;
    /** ID сессии */
    session_id?: string;
    /** ID запроса (для трейсинга) */
    request_id?: string;
    /** Дополнительные данные */
    [key: string]: unknown;
}

// =============================================================================
// EVENT PAYLOAD MAP (Canon: строгий маппинг EventType → Payload)
// =============================================================================

/**
 * Маппинг EventType → Canonical Payload
 * 
 * Canon: Каждому EventType соответствует строго один canonical payload schema.
 * Никаких произвольных payload для одного и того же EventType.
 */
export interface EventPayloadMap {
    SHIFT_STARTED: IShiftStartedPayload;
    SHIFT_COMPLETED: IShiftCompletedPayload;
    KPI_RECORDED: IKPIRecordedPayload;
    FEEDBACK_SUBMITTED: IFeedbackSubmittedPayload;
    COURSE_COMPLETED: ICourseCompletedPayload;
    TEST_PASSED: ITestPassedPayload;
    MENTORING_COMPLETED: IMentoringCompletedPayload;
    QUALIFICATION_PROPOSED: IQualificationProposedPayload;
    QUALIFICATION_CHANGED: IQualificationChangedPayload;
    REWARD_GRANTED: IRewardGrantedPayload;
    TASK_CREATED: ITaskCreatedPayload;
    TASK_COMPLETED: ITaskCompletedPayload;
    TRANSACTION_CREATED: ITransactionCreatedPayload;
    PHOTOCOMPANY_RESULT: IPhotoCompanyResultPayload;
}

// =============================================================================
// CANONICAL PAYLOAD INTERFACES
// =============================================================================

/**
 * SHIFT_STARTED payload
 */
export interface IShiftStartedPayload {
    shift_id: string;
    user_id: string;
    role_id: string;
    branch_id: string;
    planned_start: Date;
    actual_start: Date;
    planned_end: Date;
}

/**
 * SHIFT_COMPLETED payload
 * 
 * Включает Plan vs Fact и Kaizen данные
 */
export interface IShiftCompletedPayload {
    shift_id: string;
    user_id: string;
    role_id: string;
    branch_id: string;
    actual_end: Date;
    duration_minutes: number;
    /** План смены */
    plan: {
        sessions_count: number;
        revenue: number;
    };
    /** Факт смены */
    fact: {
        sessions_count: number;
        revenue: number;
        nps_average?: number;
    };
    /** Kaizen: выявленные проблемы */
    problems?: string[];
    /** Kaizen: предложенные улучшения */
    improvements?: string[];
    /** Kaizen: выводы */
    conclusions?: string;
}

/**
 * KPI_RECORDED payload
 * 
 * Canon: KPI вычисляется из Events. Этот event фиксирует результат вычисления.
 */
export interface IKPIRecordedPayload {
    kpi_id: string;
    kpi_name: string;
    user_id: string;
    value: number;
    unit: string;
    period_start: Date;
    period_end: Date;
    /** IDs событий, из которых вычислен KPI */
    source_event_ids: string[];
}

/**
 * FEEDBACK_SUBMITTED payload
 */
export interface IFeedbackSubmittedPayload {
    session_id: string;
    user_id: string;
    client_id?: string;
    nps_score: number;
    comment?: string;
    tags?: string[];
}

/**
 * COURSE_COMPLETED payload
 * 
 * Module 13: Corporate University
 * CANON: Course completion triggers recognition (MC), NOT money
 */
export interface ICourseCompletedPayload {
    course_id: string;
    user_id: string;
    enrollment_id: string;
    academy_id: string;
    completed_at: Date;
    score?: number;
    duration_minutes: number;
    // Module 13: Canonical fields
    recognition_mc: number; // Course = recognition, NOT money
    target_metric: string; // Which PhotoCompany metric this course targets
    expected_effect: string; // Expected improvement (e.g., "↓ declined 10%")
}

/**
 * TEST_PASSED payload
 */
export interface ITestPassedPayload {
    test_id: string;
    user_id: string;
    course_id?: string;
    score: number;
    max_score: number;
    passed_at: Date;
    attempts_count: number;
}

/**
 * MENTORING_COMPLETED payload
 */
export interface IMentoringCompletedPayload {
    mentoring_session_id: string;
    mentor_id: string;
    mentee_id: string;
    topic: string;
    duration_minutes: number;
    completed_at: Date;
    feedback?: string;
}

/**
 * QUALIFICATION_PROPOSED payload
 */
export interface IQualificationProposedPayload {
    user_id: string;
    current_level: number;
    proposed_level: number;
    proposed_by: string;
    reason: string;
    supporting_evidence: string[];
}

/**
 * QUALIFICATION_CHANGED payload
 */
export interface IQualificationChangedPayload {
    user_id: string;
    previous_level: number;
    new_level: number;
    changed_by: string;
    reason: string;
    effective_from: Date;
}

/**
 * REWARD_GRANTED payload
 * 
 * Canon: Reward — следствие, не причина.
 */
export interface IRewardGrantedPayload {
    user_id: string;
    reward_rule_id: string;
    reward_type: 'MC' | 'GMC' | 'RUB';
    amount: number;
    reason: string;
    /** ID события, которое триггернуло награду */
    trigger_event_id: string;
}

/**
 * TASK_CREATED payload
 */
export interface ITaskCreatedPayload {
    task_id: string;
    creator_id: string;
    assignee_id?: string;
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    due_date?: Date;
}

/**
 * TASK_COMPLETED payload
 */
export interface ITaskCompletedPayload {
    task_id: string;
    assignee_id: string;
    completed_at: Date;
    duration_minutes?: number;
    mc_reward?: number;
}

/**
 * TRANSACTION_CREATED payload
 */
export interface ITransactionCreatedPayload {
    transaction_id: string;
    sender_id?: string;
    recipient_id: string;
    amount: number;
    currency: 'MC' | 'GMC' | 'RUB';
    reason: string;
    related_event_id?: string;
}

/**
 * PHOTOCOMPANY_RESULT payload
 * 
 * Module 13: Corporate University
 * CANON: PhotoCompany metrics are the ONLY source of truth for qualification upgrades
 */
export interface IPhotoCompanyResultPayload {
    shift_id: string;
    user_id: string;
    role: string; // PHOTOGRAPHER, SALES, RETOUCH
    // PhotoCompany metrics
    okk?: number; // Общий коэффициент качества
    ck?: number; // Коэффициент конверсии
    conversion?: number; // Процент конверсии
    quality?: number; // Качество работы
    retouch_time?: number; // Время ретуши (минуты)
    avg_check?: number; // Средний чек
    anomalies?: number; // Количество аномалий
    // Metadata
    shift_date: Date;
    shift_duration_minutes: number;
    // Stability tracking (for qualification upgrades)
    is_stable: boolean; // Metrics within expected range
}

// =============================================================================
// TYPE HELPERS
// =============================================================================

/**
 * Получить тип payload по EventType
 */
export type PayloadForEventType<T extends EventType> = EventPayloadMap[T];

/**
 * Создать типизированный Event
 */
export type TypedEvent<T extends EventType> = IEvent<T>;

/**
 * Input для создания события (без id и timestamp)
 */
export type CreateEventInput<T extends EventType> = Omit<IEvent<T>, 'id' | 'timestamp'>;
