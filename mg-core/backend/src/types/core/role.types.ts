/**
 * Core Role Types - Phase 0.2
 * 
 * Canon: RoleContract = API между человеком и системой
 * 
 * Эти типы описывают структуру контракта роли (МДР + Мотивация).
 * Используются для валидации и типизации во всей системе.
 */

// =============================================================================
// ROLE INTERFACE
// =============================================================================

/**
 * Базовый интерфейс роли
 */
export interface IRole {
    id: string;
    name: string;
    code: string; // e.g., "PHOTOGRAPHER", "RETOUCHER", "SELLER"
    description?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

// =============================================================================
// ROLE CONTRACT SUB-TYPES
// =============================================================================

/**
 * KPI Definition внутри контракта
 * 
 * Описывает один KPI с формулой, целью и порогами.
 * Canon: KPI — датчики, не цели.
 */
export interface IKPIDefinition {
    /** Название KPI */
    name: string;
    /** Формула расчёта (e.g., "sessions_completed / sessions_planned * 100") */
    formula: string;
    /** Целевое значение */
    target: number;
    /** Порог предупреждения (жёлтая зона) */
    threshold_warning: number;
    /** Критический порог (красная зона) */
    threshold_critical: number;
    /** Единица измерения */
    unit: string;
    /** Период расчёта */
    calculation_period: 'daily' | 'weekly' | 'monthly';
}

/**
 * Permission внутри контракта
 * 
 * Описывает разрешение на действие с ресурсом.
 */
export interface IPermission {
    /** Ресурс (e.g., "sessions", "reports", "employees") */
    resource: string;
    /** Разрешённые действия */
    actions: ('create' | 'read' | 'update' | 'delete')[];
    /** Условия применения (опционально) */
    conditions?: Record<string, unknown>;
}

/**
 * Growth Path внутри контракта
 * 
 * Описывает путь роста от одного уровня квалификации к другому.
 */
export interface IGrowthPath {
    /** Начальный уровень квалификации (1-5) */
    from_level: number;
    /** Целевой уровень квалификации (1-5) */
    to_level: number;
    /** Требования для перехода */
    requirements: string[];
    /** Ожидаемая длительность в месяцах */
    estimated_duration_months: number;
}

// =============================================================================
// ROLE CONTRACT INTERFACE
// =============================================================================

/**
 * Полный RoleContract - контракт роли
 * 
 * Canon: RoleContract = API между человеком и системой.
 * 
 * Включает:
 * - Миссию и ЦКП (Целевой Конечный Продукт)
 * - Зоны ответственности
 * - KPI с формулами и порогами
 * - Права доступа
 * - Пути роста
 * 
 * Версионирование позволяет отслеживать изменения контрактов.
 */
export interface IRoleContract {
    id: string;
    /** ID роли */
    role_id: string;
    /** Миссия роли */
    mission: string;
    /** ЦКП - Целевой Конечный Продукт */
    value_product: string;
    /** Зоны ответственности */
    responsibility_zones: string[];
    /** Определения KPI */
    kpi_definitions: IKPIDefinition[];
    /** Права доступа */
    permissions: IPermission[];
    /** Пути роста */
    growth_paths: IGrowthPath[];
    /** Версия контракта */
    version: number;
    /** Активен ли контракт */
    is_active: boolean;
    /** Дата начала действия */
    effective_from: Date;
    /** Дата окончания действия (null = бессрочно) */
    effective_to?: Date;
    created_at: Date;
    updated_at: Date;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Тип для создания Role (без системных полей)
 */
export type CreateRoleInput = Pick<IRole, 'name' | 'code' | 'description'>;

/**
 * Тип для создания RoleContract (без системных полей)
 */
export type CreateRoleContractInput = Pick<
    IRoleContract,
    | 'role_id'
    | 'mission'
    | 'value_product'
    | 'responsibility_zones'
    | 'kpi_definitions'
    | 'permissions'
    | 'growth_paths'
    | 'effective_from'
>;

/**
 * Calculation Period enum-like type
 */
export const CalculationPeriods = ['daily', 'weekly', 'monthly'] as const;
export type CalculationPeriod = typeof CalculationPeriods[number];

/**
 * Permission Action enum-like type
 */
export const PermissionActions = ['create', 'read', 'update', 'delete'] as const;
export type PermissionAction = typeof PermissionActions[number];
