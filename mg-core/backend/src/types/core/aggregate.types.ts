/**
 * Aggregate Types - Phase 0.4
 * 
 * Canon: Aggregates — read-only отображение текущего состояния.
 * Canon: Aggregates строятся из Events, без бизнес-логики и решений.
 * 
 * Эти типы описывают агрегированное состояние сущностей.
 * Используются для read-only представлений.
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Период агрегации
 */
export type AggregatePeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Базовый интерфейс для period stats
 */
export interface IPeriodStats {
    period: AggregatePeriod;
    period_start: Date;
    period_end: Date;
    shifts_count: number;
    sessions_count: number;
    revenue_total: number;
    nps_average?: number;
}

// =============================================================================
// USER AGGREGATE
// =============================================================================

/**
 * User Aggregate - текущее состояние пользователя
 * 
 * Read-only представление, построенное из Events.
 * Не содержит бизнес-логики, правил или решений.
 */
export interface IUserAggregate {
    /** ID пользователя */
    user_id: string;
    /** ID текущей роли */
    role_id: string;
    /** Код роли (e.g., 'PHOTOGRAPHER') */
    role_code: string;
    /** Текущий уровень квалификации (1-5) */
    qualification_level: number;

    /**
     * Текущая активная смена (если есть)
     */
    current_shift?: {
        shift_id: string;
        started_at: Date;
        planned_end: Date;
        status: 'active';
    };

    /**
     * Статистика за период (read-only, из Events)
     * Никаких вычислений KPI, только raw data
     */
    period_stats: IPeriodStats;

    /** Последнее обновление агрегата */
    last_updated: Date;
}

// =============================================================================
// SHIFT AGGREGATE
// =============================================================================

/**
 * Статус смены
 */
export type ShiftStatus = 'pending' | 'active' | 'completed' | 'cancelled';

/**
 * Plan данные смены
 */
export interface IShiftPlan {
    sessions_count: number;
    revenue: number;
    start: Date;
    end: Date;
}

/**
 * Fact данные смены (accumulated from events)
 */
export interface IShiftFact {
    sessions_count: number;
    revenue: number;
    /** Все NPS scores за смену (raw data, not averaged) */
    nps_scores: number[];
    start?: Date;
    end?: Date;
}

/**
 * Kaizen данные смены
 */
export interface IShiftKaizen {
    problems: string[];
    improvements: string[];
    conclusions: string;
}

/**
 * Shift Aggregate - текущее состояние смены
 * 
 * Read-only представление, построенное из Events.
 * Включает Plan vs Fact без вычисления отклонений.
 */
export interface IShiftAggregate {
    /** ID смены */
    shift_id: string;
    /** ID пользователя */
    user_id: string;
    /** ID роли */
    role_id: string;
    /** ID филиала */
    branch_id: string;
    /** Статус смены */
    status: ShiftStatus;

    /** Plan данные */
    plan: IShiftPlan;

    /** Fact данные (accumulated from events) */
    fact: IShiftFact;

    /** Kaizen данные (опционально) */
    kaizen?: IShiftKaizen;

    /** Последнее обновление агрегата */
    last_updated: Date;
}

// =============================================================================
// BRANCH AGGREGATE
// =============================================================================

/**
 * Branch Aggregate - текущее состояние филиала
 * 
 * Read-only представление, агрегированное из User и Shift агрегатов.
 */
export interface IBranchAggregate {
    /** ID филиала */
    branch_id: string;
    /** Название филиала */
    name: string;

    /** Количество активных смен в филиале */
    active_shifts_count: number;
    /** IDs активных пользователей в филиале */
    active_users: string[];

    /** Статистика за период */
    period_stats: IPeriodStats;

    /** Последнее обновление агрегата */
    last_updated: Date;
}

// =============================================================================
// QUALIFICATION AGGREGATE
// =============================================================================

/**
 * Состояние квалификации
 */
export type QualificationState = 'stable' | 'eligible_for_upgrade' | 'risk_of_downgrade';

/**
 * Qualification Aggregate - текущее состояние квалификации пользователя
 * 
 * Read-only представление, без автоматических решений.
 * State показывает только факт, не действие.
 */
export interface IQualificationAggregate {
    user_id: string;
    current_level: number;
    level_name: string;

    /** Текущее состояние (факт, не решение) */
    state: QualificationState;

    /** Дата достижения текущего уровня */
    achieved_at: Date;

    /** Длительность на текущем уровне (дней) */
    days_at_current_level: number;

    /** Последние события, связанные с квалификацией */
    recent_events: {
        event_id: string;
        type: 'QUALIFICATION_PROPOSED' | 'QUALIFICATION_CHANGED';
        timestamp: Date;
    }[];

    last_updated: Date;
}

// =============================================================================
// TYPE HELPERS
// =============================================================================

/**
 * Тип всех агрегатов
 */
export type AggregateType = 'user' | 'shift' | 'branch' | 'qualification';

/**
 * Map aggregate type to interface
 */
export interface AggregateTypeMap {
    user: IUserAggregate;
    shift: IShiftAggregate;
    branch: IBranchAggregate;
    qualification: IQualificationAggregate;
}

/**
 * Input для создания агрегата (без last_updated)
 */
export type CreateAggregateInput<T extends keyof AggregateTypeMap> =
    Omit<AggregateTypeMap[T], 'last_updated'>;
