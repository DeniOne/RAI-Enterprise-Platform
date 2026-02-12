
const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('test_results.txt', msg + '\n');
}

// Mock UserRole
const UserRoles = [
    'ADMIN', 'MANAGER', 'AGRONOMIST', 'FIELD_WORKER', 'CLIENT_ADMIN', 'USER',
    'SYSTEM_ADMIN', 'FOUNDER', 'CEO', 'DIRECTOR_HR', 'DIRECTOR_OFS',
    'DIRECTOR_ECONOMY', 'DIRECTOR_FINANCE', 'DIRECTOR_GR', 'DIRECTOR_PRODUCTION'
];

// Paste logic from navigation-policy.ts (adapted for JS)
// -----------------------------------------------------

const CONSULTING_NAVIGATION = [
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
                    { id: 'counterparties', label: 'Контрагенты', path: '/consulting/crm/counterparties', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
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
                            { id: 'exec_agro_consult', label: 'Консультирование', path: '/consulting/execution/agronomist/consulting', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_agro_control', label: 'Контроль допущений', path: '/consulting/execution/agronomist/control', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_agro_dev', label: 'Фиксация отклонений', path: '/consulting/execution/agronomist/deviations', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'SYSTEM_ADMIN', 'FOUNDER'] },
                        ]
                    },
                    {
                        id: 'exec_manager',
                        label: 'Контур Менеджера Хозяйства',
                        path: '/consulting/execution/manager',
                        domain: 'crop',
                        roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'],
                        subItems: [
                            { id: 'exec_mgr_tasks', label: 'Задачи', path: '/consulting/execution/manager/tasks', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_mgr_events', label: 'События', path: '/consulting/execution/manager/events', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_mgr_alerts', label: 'Алерты', path: '/consulting/execution/manager/alerts', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
                            { id: 'exec_mgr_status', label: 'Статус выполнения', path: '/consulting/execution/manager/status', domain: 'crop', roles: ['ADMIN', 'CEO', 'MANAGER', 'SYSTEM_ADMIN', 'FOUNDER'] },
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

    // 7. Знания (Everyone)
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

function getVisibleNavigation(role) {
    const filterItems = (items) => {
        return items.reduce((acc, item) => {
            const hasRole = item.roles.includes(role);
            if (!hasRole) return acc;

            if (item.subItems) {
                const visibleSubItems = filterItems(item.subItems);
                if (visibleSubItems.length > 0) {
                    acc.push({ ...item, subItems: visibleSubItems });
                }
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    };
    return filterItems(CONSULTING_NAVIGATION);
}

// Verification Logic
// ------------------

function printNav(items, depth = 0) {
    items.forEach(item => {
        log(`${'  '.repeat(depth)}[${item.domain}] ${item.label} (${item.path})`);
        if (item.subItems) {
            printNav(item.subItems, depth + 1);
        }
    });
}

log('>>> VERIFICATION START');

log('\n=== TESTING ROLE: CEO ===');
const ceoNav = getVisibleNavigation('CEO');
log('CEO should see all except Settings (partial) or similar? Checking...');
printNav(ceoNav);
// CEO has access to Strategy, Economy, Finance, etc.

log('\n=== TESTING ROLE: AGRONOMIST ===');
const agroNav = getVisibleNavigation('AGRONOMIST');
log('Agronomist should NOT see Strategy/Economy/Finance...');
printNav(agroNav);

log('\n=== TESTING ROLE: DIRECTOR_FINANCE ===');
const finNav = getVisibleNavigation('DIRECTOR_FINANCE');
printNav(finNav);

log('>>> VERIFICATION END');
