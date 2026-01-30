/**
 * AI Types - Phase 2.1
 * 
 * Canon: AI объясняет. Человек решает.
 * 
 * Это НЕ Agentic AI. НЕ Orchestrator. НЕ Decision Engine.
 * Это EXPLAINABILITY LAYER поверх ERP.
 */

// =============================================================================
// EXPLANATION OUTPUT (STRICT FORMAT)
// =============================================================================

/**
 * Ссылка на факт (Event, KPI, Qualification)
 */
export interface IFactReference {
    /** Тип факта */
    type: 'EVENT' | 'KPI' | 'QUALIFICATION' | 'REWARD';
    /** ID сущности */
    id: string;
    /** Описание факта */
    description: string;
}

/**
 * Обнаруженный риск
 */
export interface IRisk {
    /** Уровень серьёзности */
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    /** Описание риска */
    description: string;
    /** Связанные факты (IDs) */
    related_facts: string[];
}

/**
 * Стандартный выход AI Analyst
 * 
 * СТРОГИЙ ФОРМАТ для всех методов.
 * Запрещено: императивы, советы "нужно/следует", оценка людей.
 */
export interface IExplanationOutput {
    /** Краткое резюме */
    summary: string;
    /** Наблюдаемые факты (ссылки на Events/KPI) */
    observed_facts: IFactReference[];
    /** Обнаруженные риски (если есть) */
    detected_risks: IRisk[];
    /** Предположения (если применимо) */
    assumptions: string[];
    /** Не обязательные заметки */
    notes: string[];
}

// =============================================================================
// AI ANALYST INPUTS (READ-ONLY)
// =============================================================================

/**
 * Вход для explainKPIChanges
 */
export interface IExplainKPIChangesInput {
    /** ID пользователя */
    user_id: string;
    /** Начало периода */
    period_start: Date;
    /** Конец периода */
    period_end: Date;
    /** KPI записи за период (read-only) */
    kpi_records: IKPIRecord[];
    /** События за период (read-only) */
    events: IEventSummary[];
}

/**
 * Вход для describeTrends
 */
export interface IDescribeTrendsInput {
    /** История KPI (read-only) */
    kpi_history: IKPIRecord[];
    /** Период анализа */
    period_count: number;
    /** Тип периода */
    period_type: 'daily' | 'weekly' | 'monthly';
}

/**
 * Вход для highlightRisks
 */
export interface IHighlightRisksInput {
    /** События для анализа (read-only) */
    events: IEventSummary[];
    /** Текущее состояние квалификации (read-only) */
    qualification_state?: IQualificationSummary;
    /** Последние KPI (read-only) */
    recent_kpis?: IKPIRecord[];
}

/**
 * Вход для summarizeState
 */
export interface ISummarizeStateInput {
    /** ID пользователя */
    user_id: string;
    /** Текущая квалификация */
    qualification: IQualificationSummary;
    /** Последние KPI */
    recent_kpis: IKPIRecord[];
    /** Последние награды */
    recent_rewards: IRewardSummary[];
}

// =============================================================================
// READ-ONLY DATA SUMMARIES
// =============================================================================

/**
 * Сводка KPI записи (read-only)
 */
export interface IKPIRecord {
    kpi_name: string;
    value: number;
    unit: string;
    period_start: Date;
    period_end: Date;
    source_event_ids: string[];
}

/**
 * Сводка события (read-only)
 */
export interface IEventSummary {
    id: string;
    type: string;
    timestamp: Date;
    subject_id: string;
    /** Краткое описание payload (без sensitive данных) */
    summary: string;
}

/**
 * Сводка квалификации (read-only)
 */
export interface IQualificationSummary {
    user_id: string;
    current_level: number;
    state: 'stable' | 'eligible_for_upgrade' | 'risk_of_downgrade';
    days_at_level: number;
}

/**
 * Сводка награды (read-only)
 */
export interface IRewardSummary {
    reward_type: 'MC' | 'GMC' | 'RUB';
    amount: number;
    reason: string;
    trigger_event_id: string;
    calculated_at: Date;
}

// =============================================================================
// LLM ADAPTER INTERFACE (STATELESS)
// =============================================================================

/**
 * Интерфейс LLM Adapter
 * 
 * СТРОГО STATELESS:
 * - НЕТ chat history
 * - НЕТ system/user/assistant ролей
 * - НЕТ chain-of-thought
 * - НЕТ памяти
 * 
 * LLM — это текстовый процессор, не агент.
 */
export interface ILLMAdapter {
    /**
     * Генерация текста по промпту
     * 
     * @param prompt - текстовый промпт
     * @returns сгенерированный текст
     */
    generate(prompt: string): Promise<string>;
}

// =============================================================================
// GUARDRAILS
// =============================================================================

/**
 * Типы запрещённых намерений
 */
export const FORBIDDEN_INTENTS = [
    'change_data',
    'grant_reward',
    'modify_qualification',
    'execute_action',
    'make_decision',
    'bypass_rules',
    'compare_people',
    'give_advice',
] as const;

export type ForbiddenIntent = typeof FORBIDDEN_INTENTS[number];

/**
 * Результат проверки guardrails
 */
export interface IGuardrailsCheckResult {
    /** Разрешён ли запрос */
    allowed: boolean;
    /** Причина отказа (если не разрешён) */
    reason?: string;
    /** Обнаруженные запрещённые намерения */
    detected_intents?: ForbiddenIntent[];
}

// =============================================================================
// AI COACH TYPES (Phase 2.2)
// =============================================================================

/**
 * Область развития
 */
export type GrowthArea = 'kpi' | 'training' | 'mentoring' | 'experience' | 'soft_skills';

/**
 * Приоритет рекомендации
 */
export type RecommendationPriority = 'low' | 'medium' | 'high';

/**
 * Рекомендация по развитию
 * 
 * NON-BINDING: это только предложение, не требование.
 */
export interface IGrowthRecommendation {
    /** Область развития */
    area: GrowthArea;
    /** Приоритет */
    priority: RecommendationPriority;
    /** Заголовок рекомендации */
    title: string;
    /** Описание */
    description: string;
    /** Почему это важно (обоснование) */
    rationale: string;
    /** Ожидаемый эффект (если применить) */
    expected_impact: string;
    /** Примерное время (дней) */
    time_estimate_days?: number;
    /** Связанные факты */
    related_facts: string[];
}

/**
 * Выход AI Coach
 * 
 * Canon: AI рекомендует. Человек решает.
 * Все рекомендации NON-BINDING (необязательные).
 */
export interface ICoachOutput {
    /** Краткое резюме ситуации */
    summary: string;
    /** Варианты рекомендаций (multi-option) */
    recommendations: IGrowthRecommendation[];
    /** Предположения AI */
    assumptions: string[];
    /** Риски / ограничения */
    risks: string[];
    /** Disclaimer: рекомендации не гарантируют результат */
    disclaimer: string;
}

// =============================================================================
// AI COACH INPUTS (READ-ONLY)
// =============================================================================

/**
 * Вход для recommendGrowth
 */
export interface IRecommendGrowthInput {
    /** ID пользователя */
    user_id: string;
    /** Текущая квалификация */
    qualification: IQualificationSummary;
    /** История KPI */
    kpi_history: IKPIRecord[];
    /** События (обучение, менторинг и т.д.) */
    events: IEventSummary[];
    /** Требования текущего уровня (из RoleContract) */
    level_requirements?: ILevelRequirements;
}

/**
 * Требования уровня (из RoleContract)
 */
export interface ILevelRequirements {
    /** Уровень */
    level: number;
    /** Минимальные KPI */
    kpi_targets: Record<string, number>;
    /** Требуемые курсы */
    required_courses: number;
    /** Минимум дней на уровне */
    min_days_at_level: number;
}

/**
 * Вход для suggestOptions (варианты развития)
 */
export interface ISuggestOptionsInput {
    /** ID пользователя */
    user_id: string;
    /** Текущий уровень */
    current_level: number;
    /** Целевой уровень (опционально) */
    target_level?: number;
    /** Текущие KPI */
    current_kpis: IKPIRecord[];
    /** Требования следующего уровня */
    next_level_requirements?: ILevelRequirements;
    /** Доступные курсы */
    available_courses?: string[];
}

// =============================================================================
// AI AUDITOR TYPES (Phase 2.3)
// =============================================================================

/**
 * Категория аномалии
 * 
 * Priority:
 * - data_quality: пропуски, дубликаты, невалидные значения
 * - frequency: слишком много/мало событий
 * - timing: события в нетипичное время (non-critical)
 */
export type AnomalyCategory = 'data_quality' | 'frequency' | 'timing';

/**
 * Серьёзность аномалии
 */
export type AnomalySeverity = 'info' | 'warning' | 'critical';

/**
 * Обнаруженная аномалия
 */
export interface IAnomaly {
    /** Категория */
    category: AnomalyCategory;
    /** Серьёзность */
    severity: AnomalySeverity;
    /** Описание */
    description: string;
    /** ID затронутых событий */
    affected_event_ids: string[];
    /** Обнаруженный паттерн */
    detected_pattern: string;
}

/**
 * Отчёт об аномалиях
 */
export interface IAnomalyReport {
    /** Краткое резюме */
    summary: string;
    /** Найденные аномалии */
    anomalies: IAnomaly[];
    /** Период сканирования */
    scan_period: {
        start: Date;
        end: Date;
    };
    /** Всего событий проверено */
    total_events_scanned: number;
    /** Предположения */
    assumptions: string[];
}

/**
 * Нарушение правила
 */
export interface IViolation {
    /** Название правила */
    rule_name: string;
    /** Серьёзность */
    severity: AnomalySeverity;
    /** Описание нарушения */
    description: string;
    /** Ссылка на правило в RoleContract */
    rule_reference?: string;
    /** ID затронутых сущностей */
    affected_ids: string[];
}

/**
 * Отчёт о соответствии (Compliance)
 */
export interface IComplianceReport {
    /** Краткое резюме */
    summary: string;
    /** Найденные нарушения */
    violations: IViolation[];
    /** Количество успешных проверок */
    compliant_count: number;
    /** Всего проверено */
    total_checked: number;
    /** Предположения */
    assumptions: string[];
}

// =============================================================================
// AI AUDITOR INPUTS (READ-ONLY)
// =============================================================================

/**
 * Вход для detectAnomalies
 */
export interface IDetectAnomaliesInput {
    /** События для анализа */
    events: IEventSummary[];
    /** Период анализа */
    period_start: Date;
    period_end: Date;
    /** Категории для проверки (опционально, по умолчанию все) */
    categories?: AnomalyCategory[];
}

/**
 * Вход для checkCompliance
 */
export interface ICheckComplianceInput {
    /** ID пользователя */
    user_id: string;
    /** События пользователя */
    events: IEventSummary[];
    /** KPI пользователя */
    kpi_records: IKPIRecord[];
    /** Требования из RoleContract */
    role_requirements: ILevelRequirements;
}

// =============================================================================
// AI OPS ADVISOR TYPES (Phase 2.4)
// =============================================================================

/**
 * Область оптимизации
 */
export type OptimizationArea = 'process' | 'scheduling' | 'training' | 'resources';

/**
 * Категория потерь (Kaizen)
 */
export type WasteCategory = 'time' | 'rework' | 'waiting' | 'overprocessing';

/**
 * Уровень усилий для внедрения
 */
export type ImplementationEffort = 'low' | 'medium' | 'high';

/**
 * Предложение по оптимизации
 * 
 * NON-BINDING: это рекомендация, не требование.
 */
export interface IOptimization {
    /** Область */
    area: OptimizationArea;
    /** Заголовок */
    title: string;
    /** Описание */
    description: string;
    /** Потенциальный эффект */
    potential_impact: string;
    /** Усилия для внедрения */
    implementation_effort: ImplementationEffort;
    /** Связанные факты */
    related_facts: string[];
}

/**
 * Отчёт по оптимизациям
 */
export interface IOptimizationReport {
    /** Краткое резюме */
    summary: string;
    /** Предложения по оптимизации */
    optimizations: IOptimization[];
    /** Предположения */
    assumptions: string[];
    /** Disclaimer */
    disclaimer: string;
}

/**
 * Потеря / неэффективность
 */
export interface IWaste {
    /** Категория потерь */
    category: WasteCategory;
    /** Описание */
    description: string;
    /** Оценка потерь */
    estimated_loss: string;
    /** Затронутые события */
    affected_event_ids: string[];
}

/**
 * Отчёт по потерям (Waste)
 */
export interface IWasteReport {
    /** Краткое резюме */
    summary: string;
    /** Найденные потери */
    waste_items: IWaste[];
    /** Всего событий проанализировано */
    total_events_analyzed: number;
    /** Предположения */
    assumptions: string[];
    /** Disclaimer */
    disclaimer: string;
}

// =============================================================================
// AI OPS ADVISOR INPUTS (READ-ONLY)
// =============================================================================

/**
 * Вход для suggestOptimizations
 */
export interface ISuggestOptimizationsInput {
    /** События для анализа */
    events: IEventSummary[];
    /** История KPI */
    kpi_history: IKPIRecord[];
    /** Период анализа */
    period_start: Date;
    period_end: Date;
    /** Области для анализа (опционально) */
    focus_areas?: OptimizationArea[];
}

/**
 * Вход для identifyWaste
 */
export interface IIdentifyWasteInput {
    /** События для анализа */
    events: IEventSummary[];
    /** Период анализа */
    period_start: Date;
    period_end: Date;
    /** Категории для поиска (опционально) */
    categories?: WasteCategory[];
}

// =============================================================================
// AI ORCHESTRATOR TYPES (Phase 3)
// =============================================================================

/**
 * Тип AI агента
 */
export type AgentType = 'analyst' | 'coach' | 'auditor' | 'ops_advisor';

/**
 * Статус сценария
 */
export type ScenarioStatus = 'NOT_EXECUTED' | 'APPROVED' | 'REJECTED';

/**
 * Verbatim output от агента (БЕЗ интерпретации)
 */
export interface IAgentOutput {
    /** Какой агент */
    agent: AgentType;
    /** Метод который вызывали */
    method: string;
    /** Сырой ответ агента (verbatim) */
    raw_response: unknown;
    /** Timestamp вызова */
    called_at: Date;
}

/**
 * Вариант действия (ТОЛЬКО если явно от агента)
 */
export interface IScenarioOption {
    /** ID опции */
    option_id: string;
    /** Заголовок (verbatim от агента) */
    title: string;
    /** Описание (verbatim от агента) */
    description: string;
    /** Источник (какой агент) */
    source_agent: AgentType;
}

/**
 * ScenarioProposal — контейнер для агрегированных outputs
 * 
 * ORCHESTRATOR НЕ ИНТЕРПРЕТИРУЕТ.
 * Orchestrator = collect → tag → order → attach
 */
export interface IScenarioProposal {
    /** Уникальный ID */
    scenario_id: string;
    /** Время создания */
    created_at: Date;

    /** Исходный запрос (verbatim) */
    original_request: string;

    /** Какие агенты участвовали */
    involved_agents: AgentType[];

    /** Сырые outputs от агентов (verbatim, без обработки) */
    agent_outputs: IAgentOutput[];

    /** Опции (ТОЛЬКО если явно от агентов) */
    options: IScenarioOption[];

    /** Риски (ТОЛЬКО если явно указаны агентами) */
    risks: string[];

    /** Что требуется от человека */
    required_human_action: string;

    /** Статус: NOT_EXECUTED по умолчанию */
    status: ScenarioStatus;

    /** Disclaimer */
    disclaimer: string;
}

/**
 * Trace агрегации (без reasoning)
 */
export interface IAggregationTrace {
    /** ID сценария */
    scenario_id: string;
    /** Исходный запрос */
    request: string;
    /** Порядок вызовов агентов */
    call_order: Array<{
        agent: AgentType;
        method: string;
        timestamp: Date;
    }>;
    /** Время создания */
    created_at: Date;
}

// =============================================================================
// AI ORCHESTRATOR INPUTS
// =============================================================================

/**
 * Вход для createScenario
 */
export interface ICreateScenarioInput {
    /** Запрос пользователя (verbatim) */
    request: string;
    /** Какие агенты вызвать */
    agents_to_call: AgentType[];
    /** Контекст для агентов */
    context: IScenarioContext;
}

/**
 * Контекст для сценария
 */
export interface IScenarioContext {
    /** ID пользователя (опционально) */
    user_id?: string;
    /** События */
    events?: IEventSummary[];
    /** KPI история */
    kpi_history?: IKPIRecord[];
    /** Квалификация */
    qualification?: IQualificationSummary;
    /** Период */
    period_start?: Date;
    period_end?: Date;
}



