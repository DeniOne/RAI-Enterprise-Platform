/**
 * БЛОКИ C–E: Тесты существования всех подроутов (page.tsx)
 * Проверяет, что ВСЕ 34 подроута из CODEX_PROMPT реально созданы на диске.
 * Это гарантирует Ноль-404 (ШАГ 7, критерий приёмки №1).
 */
import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.resolve(__dirname, '..', 'app', '(app)');

// Полный перечень подроутов из CODEX_PROMPT → navigation-policy.ts
const REQUIRED_ROUTES: Record<string, string[]> = {
    'finance': ['cashflow', 'performance', 'invoices', 'reporting'],
    'economy': ['crop', 'unit', 'aggregation', 'safety', 'forecast'],
    'strategy': ['overview', 'portfolio', 'risks', 'scenarios', 'log'],
    'gr': ['regulatory', 'limits', 'contracts', 'compliance', 'decisions'],
    'production': ['procurement', 'storage', 'manufacturing', 'quality', 'logistics', 'analytics'],
    'knowledge': ['base', 'cases', 'patterns', 'evolution'],
    'settings': ['users', 'access', 'audit', 'integrations', 'params'],
};

describe('Блоки C–E: Ноль-404 — все подроуты существуют', () => {
    for (const [module, subroutes] of Object.entries(REQUIRED_ROUTES)) {
        describe(`Модуль: ${module}`, () => {
            it(`директория ${module}/ должна существовать`, () => {
                const dir = path.join(APP_DIR, module);
                expect(fs.existsSync(dir)).toBe(true);
            });

            for (const sub of subroutes) {
                it(`/${module}/${sub}/page.tsx должен существовать`, () => {
                    const file = path.join(APP_DIR, module, sub, 'page.tsx');
                    expect(fs.existsSync(file)).toBe(true);
                });
            }
        });
    }
});

describe('Блок A: Commerce — страницы CRUD существуют', () => {
    const COMMERCE_DIR = path.join(APP_DIR, 'commerce');

    const commercePages = [
        'contracts/page.tsx',
        'contracts/create/page.tsx',
        'fulfillment/page.tsx',
        'fulfillment/create/page.tsx',
        'invoices/page.tsx',
        'invoices/create/page.tsx',
        'payments/page.tsx',
        'payments/create/page.tsx',
        'parties/page.tsx',
    ];

    for (const p of commercePages) {
        it(`/commerce/${p} должен существовать`, () => {
            const file = path.join(COMMERCE_DIR, p);
            expect(fs.existsSync(file)).toBe(true);
        });
    }
});

describe('Блок B: CRM — страницы существуют', () => {
    const CONSULTING_CRM = path.resolve(__dirname, '..', 'app', 'consulting', 'crm');

    const crmPages = [
        'page.tsx',           // Главная CRM
        'farms/page.tsx',     // Реестр хозяйств
        'fields/page.tsx',    // Поля
        'history/page.tsx',   // История сезонов
    ];

    for (const p of crmPages) {
        it(`/consulting/crm/${p} должен существовать`, () => {
            const file = path.join(CONSULTING_CRM, p);
            expect(fs.existsSync(file)).toBe(true);
        });
    }
});
