import { UserRole } from '../config/role-config';
import { CapabilityFlags, capabilitiesFromRole } from './capability-policy';

/**
 * Контракт Контекста UI Домена
 * Собирается на уровне Page/Hub и передаётся в UI Policy.
 */
export interface DomainUiContext {
    plansCount: number;
    activeTechMap: boolean;
    lockedBudget: boolean;
    criticalDeviations: number;
    advisoryRiskLevel: 'low' | 'medium' | 'high';
}

export type Domain =
    | 'crop'
    | 'commerce'
    | 'exploration'
    | 'strategy'
    | 'economy'
    | 'finance'
    | 'gr'
    | 'production'
    | 'knowledge'
    | 'settings';

export interface NavItem {
    id: string;
    label: string;
    path: string;
    icon?: string;
    roles: UserRole[];
    domain: Domain;
    subItems?: NavItem[];
    disabled?: boolean;
}

// ------------------------------------------------------------------
// CANONICAL NAVIGATION STRUCTURE (SINGLE SOURCE OF TRUTH)
// ------------------------------------------------------------------
export const CONSULTING_NAVIGATION: NavItem[] = [
    // 1. Управление Урожаем (CORE)
    {
        id: 'crop_dashboard',
        label: 'Управление Урожаем',
        path: '/consulting/dashboard',
        domain: 'crop',
        roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            {
                id: 'overview',
                label: 'Обзор',
                path: '/consulting/dashboard',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
            {
                id: 'crm',
                label: 'Хозяйства и Контрагенты',
                path: '/consulting/crm',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
                subItems: [
                    { id: 'farms', label: 'Реестр хозяйств', path: '/consulting/crm/farms', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'counterparties', label: 'Контрагенты', path: '/commerce/parties', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'fields', label: 'Поля / Объекты', path: '/consulting/crm/fields', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'seasons', label: 'История сезонов', path: '/consulting/crm/history', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                ]
            },
            {
                id: 'plans',
                label: 'Планы Урожая',
                path: '/consulting/plans',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
                subItems: [
                    { id: 'plans_drafts', label: 'Черновики', path: '/consulting/plans/drafts', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'plans_active', label: 'Активные', path: '/consulting/plans/active', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'plans_archive', label: 'Архив', path: '/consulting/plans/archive', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                ]
            },
            {
                id: 'techmaps',
                label: 'Техкарты Урожая',
                path: '/consulting/techmaps',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
                subItems: [
                    { id: 'tm_design', label: 'Проектирование', path: '/consulting/techmaps/design', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'tm_active', label: 'Активные', path: '/consulting/techmaps/active', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'tm_frozen', label: 'Замороженные', path: '/consulting/techmaps/frozen', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'tm_archive', label: 'Архив', path: '/consulting/techmaps/archive', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                ]
            },
            {
                id: 'execution',
                label: 'Исполнение Техкарт',
                path: '/consulting/execution',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'FIELD_WORKER', 'SYSTEM_ADMIN', 'FOUNDER'],
                subItems: [
                    {
                        id: 'exec_agro',
                        label: 'Контур Агронома',
                        path: '/consulting/execution/agronomist',
                        domain: 'crop',
                        roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
                        subItems: [
                            { id: 'exec_agro_consult', label: 'Консультирование', path: '/consulting/execution/agronomist#consult', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_agro_control', label: 'Контроль допущений', path: '/consulting/execution/agronomist#control', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_agro_dev', label: 'Фиксация отклонений', path: '/consulting/execution/agronomist#deviations', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                        ]
                    },
                    {
                        id: 'exec_manager',
                        label: 'Контур Менеджера Хозяйства',
                        path: '/consulting/execution/manager',
                        domain: 'crop',
                        roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'],
                        subItems: [
                            { id: 'exec_mgr_tasks', label: 'Задачи', path: '/consulting/execution/manager#tasks', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_mgr_events', label: 'События', path: '/consulting/execution/manager#events', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_mgr_alerts', label: 'Алерты', path: '/consulting/execution/manager#alerts', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_mgr_status', label: 'Статус выполнения', path: '/consulting/execution/manager#status', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                        ]
                    },
                ]
            },
            {
                id: 'deviations',
                label: 'Отклонения и Решения',
                path: '/consulting/deviations',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
                subItems: [
                    { id: 'dev_detected', label: 'Выявленные отклонения', path: '/consulting/deviations/detected', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'dev_analysis', label: 'Разбор', path: '/consulting/deviations/analysis', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'dev_decisions', label: 'Принятые решения', path: '/consulting/deviations/decisions', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                ]
            },
            {
                id: 'results',
                label: 'Результат и Эффект',
                path: '/consulting/results',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'],
                subItems: [
                    { id: 'res_actual', label: 'Фактический урожай', path: '/consulting/results/actual', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'res_plan_fact', label: 'Сравнение с планом', path: '/consulting/results/plan-fact', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                    { id: 'res_perf', label: 'Performance-оплата', path: '/consulting/results/performance', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                ]
            }
        ]
    },

    // 1.5. Коммерция
    {
        id: 'commerce',
        label: 'Коммерция',
        path: '/commerce/contracts',
        domain: 'commerce',
        roles: ['ADMIN', 'CEO', 'MANAGER', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'commerce_contracts', label: 'Договоры', path: '/commerce/contracts', domain: 'commerce', roles: ['ADMIN', 'CEO', 'MANAGER', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'commerce_fulfillment', label: 'Исполнение договоров', path: '/commerce/fulfillment', domain: 'commerce', roles: ['ADMIN', 'CEO', 'MANAGER', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'commerce_invoices', label: 'Документы', path: '/commerce/invoices', domain: 'commerce', roles: ['ADMIN', 'CEO', 'MANAGER', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'commerce_payments', label: 'Оплаты', path: '/commerce/payments', domain: 'commerce', roles: ['ADMIN', 'CEO', 'MANAGER', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 1.6. Исследования
    {
        id: 'exploration',
        label: 'Исследования',
        path: '/exploration',
        domain: 'exploration',
        roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'exploration_showcase', label: 'Витрина', path: '/exploration', domain: 'exploration', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'exploration_strategic', label: 'Стратегические', path: '/exploration/strategic', domain: 'exploration', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'exploration_constraints', label: 'Ограничения', path: '/exploration/constraints', domain: 'exploration', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 2. Стратегия
    {
        id: 'strategy',
        label: 'Стратегия',
        path: '/strategy',
        domain: 'strategy',
        roles: ['ADMIN', 'CEO', 'DIRECTOR_OFS', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'strat_overview', label: 'Стратегический обзор', path: '/strategy/overview', domain: 'strategy', roles: ['ADMIN', 'CEO', 'DIRECTOR_OFS', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'strat_portfolio', label: 'Портфель планов урожая', path: '/strategy/portfolio', domain: 'strategy', roles: ['ADMIN', 'CEO', 'DIRECTOR_OFS', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'strat_risks', label: 'Карта рисков', path: '/strategy/risks', domain: 'strategy', roles: ['ADMIN', 'CEO', 'DIRECTOR_OFS', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'strat_scenarios', label: 'Сценарное моделирование', path: '/strategy/scenarios', domain: 'strategy', roles: ['ADMIN', 'CEO', 'DIRECTOR_OFS', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'strat_log', label: 'Журнал стратегических решений', path: '/strategy/log', domain: 'strategy', roles: ['ADMIN', 'CEO', 'DIRECTOR_OFS', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 3. Экономика
    {
        id: 'economy',
        label: 'Экономика',
        path: '/economy',
        domain: 'economy',
        roles: ['ADMIN', 'CEO', 'DIRECTOR_ECONOMY', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'eco_crop', label: 'Экономика урожая', path: '/economy/crop', domain: 'economy', roles: ['ADMIN', 'CEO', 'DIRECTOR_ECONOMY', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'eco_aggregation', label: 'Агрегация эффекта', path: '/economy/aggregation', domain: 'economy', roles: ['ADMIN', 'CEO', 'DIRECTOR_ECONOMY', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'eco_unit', label: 'Юнит-экономика', path: '/economy/unit', domain: 'economy', roles: ['ADMIN', 'CEO', 'DIRECTOR_ECONOMY', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'eco_safety', label: 'Safety Net контроль', path: '/economy/safety', domain: 'economy', roles: ['ADMIN', 'CEO', 'DIRECTOR_ECONOMY', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'eco_forecast', label: 'Прогноз экономики', path: '/economy/forecast', domain: 'economy', roles: ['ADMIN', 'CEO', 'DIRECTOR_ECONOMY', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 4. Финансы
    {
        id: 'finance',
        label: 'Финансы',
        path: '/finance',
        domain: 'finance',
        roles: ['ADMIN', 'CEO', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'fin_cashflow', label: 'Денежные потоки', path: '/finance/cashflow', domain: 'finance', roles: ['ADMIN', 'CEO', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'fin_performance', label: 'Performance-начисления', path: '/finance/performance', domain: 'finance', roles: ['ADMIN', 'CEO', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'fin_invoices', label: 'Счета и расчёты', path: '/finance/invoices', domain: 'finance', roles: ['ADMIN', 'CEO', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'fin_reporting', label: 'Финансовая отчётность', path: '/finance/reporting', domain: 'finance', roles: ['ADMIN', 'CEO', 'DIRECTOR_FINANCE', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 5. GR
    {
        id: 'gr',
        label: 'GR',
        path: '/gr',
        domain: 'gr',
        roles: ['ADMIN', 'CEO', 'DIRECTOR_GR', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'gr_regulatory', label: 'Регуляторный контекст', path: '/gr/regulatory', domain: 'gr', roles: ['ADMIN', 'CEO', 'DIRECTOR_GR', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'gr_limits', label: 'Ограничения', path: '/gr/limits', domain: 'gr', roles: ['ADMIN', 'CEO', 'DIRECTOR_GR', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'gr_contracts', label: 'Контракты', path: '/gr/contracts', domain: 'gr', roles: ['ADMIN', 'CEO', 'DIRECTOR_GR', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'gr_compliance', label: 'Комплаенс', path: '/gr/compliance', domain: 'gr', roles: ['ADMIN', 'CEO', 'DIRECTOR_GR', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'gr_decisions', label: 'Юридически значимые решения', path: '/gr/decisions', domain: 'gr', roles: ['ADMIN', 'CEO', 'DIRECTOR_GR', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 6. Производство (Грипил)
    {
        id: 'production',
        label: 'Производство (Грипил)',
        path: '/production',
        domain: 'production',
        roles: ['ADMIN', 'CEO', 'DIRECTOR_PRODUCTION', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'prod_procure', label: 'Сырьё и закупки', path: '/production/procurement', domain: 'production', roles: ['ADMIN', 'CEO', 'DIRECTOR_PRODUCTION', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'prod_storage', label: 'Хранение', path: '/production/storage', domain: 'production', roles: ['ADMIN', 'CEO', 'DIRECTOR_PRODUCTION', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'prod_manufacturing', label: 'Производство', path: '/production/manufacturing', domain: 'production', roles: ['ADMIN', 'CEO', 'DIRECTOR_PRODUCTION', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'prod_quality', label: 'Контроль качества', path: '/production/quality', domain: 'production', roles: ['ADMIN', 'CEO', 'DIRECTOR_PRODUCTION', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'prod_logistics', label: 'Логистика', path: '/production/logistics', domain: 'production', roles: ['ADMIN', 'CEO', 'DIRECTOR_PRODUCTION', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'prod_analytics', label: 'Производственная аналитика', path: '/production/analytics', domain: 'production', roles: ['ADMIN', 'CEO', 'DIRECTOR_PRODUCTION', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 7. Знания
    {
        id: 'knowledge',
        label: 'Знания',
        path: '/knowledge',
        domain: 'knowledge',
        roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'know_base', label: 'База знаний', path: '/knowledge/base', domain: 'knowledge', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'know_cases', label: 'Кейсы урожая', path: '/knowledge/cases', domain: 'knowledge', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'know_patterns', label: 'Паттерны решений', path: '/knowledge/patterns', domain: 'knowledge', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'know_evolution', label: 'Эволюция техкарт', path: '/knowledge/evolution', domain: 'knowledge', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    },

    // 8. Настройки / Доступы
    {
        id: 'settings',
        label: 'Настройки',
        path: '/settings',
        domain: 'settings',
        roles: ['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER'],
        subItems: [
            { id: 'set_users', label: 'Пользователи и роли', path: '/settings/users', domain: 'settings', roles: ['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'set_access', label: 'Права доступа', path: '/settings/access', domain: 'settings', roles: ['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'set_audit', label: 'Аудит', path: '/settings/audit', domain: 'settings', roles: ['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'set_integrations', label: 'Интеграции', path: '/settings/integrations', domain: 'settings', roles: ['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER'] },
            { id: 'set_params', label: 'Системные параметры', path: '/settings/params', domain: 'settings', roles: ['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER'] },
        ]
    }
];

/**
 * Возвращает список видимых элементов навигации с учетом роли и контекста домена.
 */
export function getVisibleNavigation(
    roleOrCapabilities: UserRole | CapabilityFlags,
    context?: DomainUiContext
): NavItem[] {
    const capabilities =
        typeof roleOrCapabilities === 'string'
            ? capabilitiesFromRole(roleOrCapabilities)
            : roleOrCapabilities;
    const role = typeof roleOrCapabilities === 'string' ? roleOrCapabilities : undefined;

    const filterItems = (items: NavItem[]): NavItem[] => {
        return items.reduce((acc, item) => {
            // Keep role lists as compatibility matrix, but gate sensitive areas by capabilities.
            const hasRole = role ? item.roles.includes(role) : true;
            if (!hasRole) return acc;

            const canAccessGovernance = capabilities.canSign || capabilities.canOverride || capabilities.canEscalate;
            if (!canAccessGovernance && (item.id === 'decisions' || item.domain === 'gr' || item.id === 'advisory')) {
                return acc;
            }

            const updatedItem = { ...item };

            if (context) {
                if (item.id === 'advisory' && context.plansCount === 0) {
                    updatedItem.disabled = true;
                }
            }

            if (item.subItems) {
                const visibleSubItems = filterItems(item.subItems);
                if (visibleSubItems.length > 0) {
                    updatedItem.subItems = visibleSubItems;
                    acc.push(updatedItem);
                }
            } else {
                acc.push(updatedItem);
            }

            return acc;
        }, [] as NavItem[]);
    };

    return filterItems(CONSULTING_NAVIGATION);
}
