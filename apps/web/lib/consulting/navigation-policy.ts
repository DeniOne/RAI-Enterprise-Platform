import { UserRole } from '../config/role-config';

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
                id: 'farms',
                label: 'Хозяйства',
                path: '/consulting/crm/farms',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
            {
                id: 'plans',
                label: 'Планы',
                path: '/consulting/plans',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
            {
                id: 'techmaps',
                label: 'Техкарты',
                path: '/consulting/techmaps',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
            {
                id: 'budgets',
                label: 'Бюджеты',
                path: '/consulting/budgets',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
            {
                id: 'deviations',
                label: 'Отклонения',
                path: '/consulting/deviations',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
            {
                id: 'decisions',
                label: 'Решения',
                path: '/consulting/decisions',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
            {
                id: 'advisory',
                label: 'Advisory',
                path: '/consulting/advisory',
                domain: 'crop',
                roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'],
            },
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
export function getVisibleNavigation(role: UserRole, context?: DomainUiContext): NavItem[] {
    const filterItems = (items: NavItem[]): NavItem[] => {
        return items.reduce((acc, item) => {
            // 1. RBAC Check
            const hasRole = item.roles.includes(role);
            if (!hasRole) return acc;

            // 2. Specific RBAC-aware rules from Audit
            if (role === 'MANAGER' && item.id === 'advisory') {
                // MANAGER не видит Advisory (в данном случае Hub, т.к. Company Advisory тоже там)
                // Согласно аудиту: "MANAGER не видит Advisory Company"
                // Если разделим Hub на части, можно тоньше. Пока скроем весь, если MANAGER.
                return acc;
            }
            if (role === 'USER' && (item.id === 'decisions' || item.domain === 'gr')) {
                return acc;
            }

            const updatedItem = { ...item };

            // 3. Context-aware visibility/state
            if (context) {
                if (item.id === 'advisory' && context.plansCount === 0) {
                    updatedItem.disabled = true;
                }
            }

            // 4. Recursive filter for subItems
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
