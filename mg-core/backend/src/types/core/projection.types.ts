/**
 * Projection Types - Phase 0.4
 * 
 * Canon: Projections — read-only представления, построенные из Events.
 * Canon: Никаких решений, только данные.
 * 
 * Проекции используются для отображения данных в Views.
 * Не содержат бизнес-логики, правил или пороговых значений.
 */

// =============================================================================
// DAILY SUMMARY PROJECTION
// =============================================================================

/**
 * Daily Summary Projection
 * 
 * Дневная сводка по пользователю, агрегированная из Events.
 */
export interface IDailySummaryProjection {
    /** Дата (начало дня) */
    date: Date;
    /** ID пользователя */
    user_id: string;
    /** Количество смен за день */
    shifts_count: number;
    /** Количество сессий за день */
    sessions_count: number;
    /** Общая выручка за день */
    revenue: number;
    /** Средний NPS (если есть feedback) */
    nps_average?: number;
    /** Количество событий за день */
    events_count: number;
}

// =============================================================================
// SHIFT TIMELINE PROJECTION
// =============================================================================

/**
 * Событие в timeline смены
 */
export interface IShiftTimelineEvent {
    event_id: string;
    type: string;
    timestamp: Date;
    /** Краткое описание события */
    summary: string;
}

/**
 * Shift Timeline Projection
 * 
 * Timeline всех событий в рамках одной смены.
 * Используется для отображения истории смены.
 */
export interface IShiftTimelineProjection {
    shift_id: string;
    user_id: string;
    /** Все события смены в хронологическом порядке */
    events: IShiftTimelineEvent[];
    /** Общая длительность смены в минутах */
    duration_minutes?: number;
    /** Начало смены */
    started_at?: Date;
    /** Конец смены */
    ended_at?: Date;
}

// =============================================================================
// USER PERFORMANCE VIEW
// =============================================================================

/**
 * Статистика за период (read-only)
 */
export interface IPeriodStats {
    sessions: number;
    revenue: number;
    nps?: number;
}

/**
 * Тренд производительности
 * 
 * Вычисляется путём сравнения текущего периода с предыдущим.
 * Не содержит решений, только факт.
 */
export type PerformanceTrend = 'up' | 'down' | 'stable';

/**
 * User Performance View
 * 
 * Read-only представление производительности пользователя.
 * Без пороговых значений, правил или решений.
 */
export interface IUserPerformanceView {
    user_id: string;
    role: string;
    qualification_level: number;

    /** Статистика за сегодня */
    today: IPeriodStats;
    /** Статистика за эту неделю */
    this_week: IPeriodStats;
    /** Статистика за этот месяц */
    this_month: IPeriodStats;

    /**
     * Тренд (только факт, не решение)
     * Сравнение текущей недели с предыдущей
     */
    trend: PerformanceTrend;

    /** Последнее обновление */
    last_updated: Date;
}

// =============================================================================
// BRANCH PERFORMANCE VIEW
// =============================================================================

/**
 * Branch Performance View
 * 
 * Read-only сводка по филиалу.
 */
export interface IBranchPerformanceView {
    branch_id: string;
    branch_name: string;

    /** Активные смены сейчас */
    active_shifts: number;
    /** Активные пользователи сейчас */
    active_users: number;

    /** Статистика за сегодня */
    today: IPeriodStats & { shifts_count: number };
    /** Статистика за эту неделю */
    this_week: IPeriodStats & { shifts_count: number };

    /** Тренд филиала */
    trend: PerformanceTrend;

    last_updated: Date;
}

// =============================================================================
// EVENT FEED PROJECTION
// =============================================================================

/**
 * Элемент ленты событий
 */
export interface IEventFeedItem {
    event_id: string;
    type: string;
    timestamp: Date;
    /** Субъект события */
    subject: {
        id: string;
        type: string;
        name?: string;
    };
    /** Человекочитаемое описание */
    description: string;
    /** Важность события (для UI сортировки) */
    importance: 'low' | 'medium' | 'high';
}

/**
 * Event Feed Projection
 * 
 * Лента последних событий для отображения в UI.
 */
export interface IEventFeedProjection {
    items: IEventFeedItem[];
    /** Общее количество событий */
    total_count: number;
    /** Фильтры, применённые к ленте */
    filters?: {
        user_id?: string;
        branch_id?: string;
        event_types?: string[];
        date_from?: Date;
        date_to?: Date;
    };
    last_updated: Date;
}

// =============================================================================
// QUALIFICATION PROGRESS VIEW
// =============================================================================

/**
 * Qualification Progress View
 * 
 * Read-only представление прогресса квалификации.
 * Без автоматических решений о повышении/понижении.
 */
export interface IQualificationProgressView {
    user_id: string;
    current_level: number;
    level_name: string;

    /** Дней на текущем уровне */
    days_at_current_level: number;

    /** История изменений (последние N) */
    history: {
        from_level: number;
        to_level: number;
        changed_at: Date;
        reason: string;
    }[];

    /** Pending предложения о изменении (если есть) */
    pending_proposals: {
        proposed_level: number;
        proposed_by: string;
        proposed_at: Date;
        reason: string;
    }[];

    last_updated: Date;
}

// =============================================================================
// TYPE HELPERS
// =============================================================================

/**
 * Все типы проекций
 */
export type ProjectionType =
    | 'daily_summary'
    | 'shift_timeline'
    | 'user_performance'
    | 'branch_performance'
    | 'event_feed'
    | 'qualification_progress';

/**
 * Map projection type to interface
 */
export interface ProjectionTypeMap {
    daily_summary: IDailySummaryProjection;
    shift_timeline: IShiftTimelineProjection;
    user_performance: IUserPerformanceView;
    branch_performance: IBranchPerformanceView;
    event_feed: IEventFeedProjection;
    qualification_progress: IQualificationProgressView;
}
