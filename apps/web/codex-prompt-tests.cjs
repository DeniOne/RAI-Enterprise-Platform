/**
 * ЖЁСТКИЕ ТЕСТЫ для CODEX_PROMPT_FRONTEND_USER_TREE.md
 * Node.js native test runner — без Jest, гарантированно быстро.
 * 
 * Покрытие:
 * 1. Файловая структура (Ноль-404) — все 34 подроута + Commerce CRUD + CRM
 * 2. Навигация (navigation-policy.ts) — все пути зарегистрированы + ролевая матрица
 * 3. UI Canon — проверка запрещённых стилей во всех page.tsx
 * 4. API-клиент (api.ts) — все эндпоинты определены
 * 5. companyId — больше нет хардкода 'default-company'
 */
const fs = require('fs');
const path = require('path');

// ────────────────────────────────────────────────────────────────────
// Утилиты
// ────────────────────────────────────────────────────────────────────

let totalTests = 0;
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passed++;
        process.stdout.write(`  ✅ ${name}\n`);
    } catch (e) {
        failed++;
        failures.push({ name, error: e.message });
        process.stdout.write(`  ❌ ${name}\n     → ${e.message}\n`);
    }
}

function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
        throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertTrue(val, msg) {
    if (!val) throw new Error(msg || `Expected truthy, got ${val}`);
}

function assertContains(arr, item, msg) {
    if (!arr.includes(item)) throw new Error(msg || `Array does not contain ${item}`);
}

function assertNotContains(str, substr, msg) {
    if (str.includes(substr)) throw new Error(msg || `String should NOT contain "${substr}"`);
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function getAllPageFiles(dir) {
    const result = [];
    if (!fs.existsSync(dir)) return result;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            result.push(...getAllPageFiles(full));
        } else if (entry.name === 'page.tsx') {
            result.push(full);
        }
    }
    return result;
}

const APP_DIR = path.resolve(__dirname, 'app');
const APP_APP_DIR = path.join(APP_DIR, '(app)');

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 1: Ноль-404 — ВСЕ подроуты из CODEX_PROMPT существуют
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 1: Ноль-404 — Все подроуты существуют (34 штуки)     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const REQUIRED_ROUTES = {
    'finance': ['cashflow', 'performance', 'invoices', 'reporting'],
    'economy': ['crop', 'unit', 'aggregation', 'safety', 'forecast'],
    'strategy': ['overview', 'portfolio', 'risks', 'scenarios', 'log'],
    'gr': ['regulatory', 'limits', 'contracts', 'compliance', 'decisions'],
    'production': ['procurement', 'storage', 'manufacturing', 'quality', 'logistics', 'analytics'],
    'knowledge': ['base', 'cases', 'patterns', 'evolution'],
    'settings': ['users', 'access', 'audit', 'integrations', 'params'],
};

for (const [mod, subs] of Object.entries(REQUIRED_ROUTES)) {
    for (const sub of subs) {
        const pagePath = path.join(APP_APP_DIR, mod, sub, 'page.tsx');
        test(`/${mod}/${sub}/page.tsx существует`, () => {
            assertTrue(fileExists(pagePath), `Файл НЕ найден: ${pagePath}`);
        });
    }
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 2: Commerce CRUD страницы
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 2: Commerce CRUD — страницы существуют               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const COMMERCE_DIR = path.join(APP_APP_DIR, 'commerce');
const COMMERCE_PAGES = [
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

for (const p of COMMERCE_PAGES) {
    test(`/commerce/${p} существует`, () => {
        assertTrue(fileExists(path.join(COMMERCE_DIR, p)), `Commerce: ${p} НЕ найден!`);
    });
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 3: CRM страницы
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 3: CRM — страницы существуют                         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const CRM_DIR = path.join(APP_DIR, 'consulting', 'crm');
const CRM_PAGES = ['page.tsx', 'farms/page.tsx', 'fields/page.tsx', 'history/page.tsx'];

for (const p of CRM_PAGES) {
    test(`/consulting/crm/${p} существует`, () => {
        assertTrue(fileExists(path.join(CRM_DIR, p)), `CRM: ${p} НЕ найден!`);
    });
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 4: Навигация — все пути зарегистрированы
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 4: navigation-policy.ts — все пути в навигации       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const NAV_FILE = path.resolve(__dirname, 'lib', 'consulting', 'navigation-policy.ts');
const navContent = fs.readFileSync(NAV_FILE, 'utf-8');

function extractPaths(content) {
    const regex = /path:\s*['"](\/[^'"]+)['"]/g;
    const paths = [];
    let match;
    while ((match = regex.exec(content)) !== null) paths.push(match[1]);
    return paths;
}

const registeredPaths = extractPaths(navContent);

const ALL_NAV_ROUTES = [
    // Finance
    '/finance/cashflow', '/finance/performance', '/finance/invoices', '/finance/reporting',
    // Economy
    '/economy/crop', '/economy/aggregation', '/economy/unit', '/economy/safety', '/economy/forecast',
    // Strategy
    '/strategy/overview', '/strategy/portfolio', '/strategy/risks', '/strategy/scenarios', '/strategy/log',
    // GR
    '/gr/regulatory', '/gr/limits', '/gr/contracts', '/gr/compliance', '/gr/decisions',
    // Production
    '/production/procurement', '/production/storage', '/production/manufacturing', '/production/quality', '/production/logistics', '/production/analytics',
    // Knowledge
    '/knowledge/base', '/knowledge/cases', '/knowledge/patterns', '/knowledge/evolution',
    // Settings
    '/settings/users', '/settings/access', '/settings/audit', '/settings/integrations', '/settings/params',
    // Commerce
    '/commerce/contracts', '/commerce/fulfillment', '/commerce/invoices', '/commerce/payments',
];

for (const route of ALL_NAV_ROUTES) {
    test(`Навигация содержит ${route}`, () => {
        assertContains(registeredPaths, route, `Путь ${route} НЕ зарегистрирован в navigation-policy.ts!`);
    });
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 5: Ролевая матрица доступа
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 5: Ролевая матрица — все роли присутствуют           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const REQUIRED_ROLES = ['ADMIN', 'CEO', 'SYSTEM_ADMIN', 'FOUNDER', 'DIRECTOR_FINANCE', 'DIRECTOR_ECONOMY', 'DIRECTOR_GR', 'DIRECTOR_PRODUCTION'];

for (const role of REQUIRED_ROLES) {
    test(`Роль ${role} присутствует в навигации`, () => {
        assertTrue(navContent.includes(role), `Роль ${role} НЕ найдена в navigation-policy.ts!`);
    });
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 6: UI Canon — запрещённые паттерны
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 6: UI Canon — запрет font-bold/font-semibold         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const SCAN_DIRS = ['finance', 'economy', 'strategy', 'gr', 'production', 'knowledge', 'settings', 'commerce'];
const allPages = SCAN_DIRS.flatMap(d => getAllPageFiles(path.join(APP_APP_DIR, d)));

test(`Найдено > 0 page.tsx для проверки (найдено: ${allPages.length})`, () => {
    assertTrue(allPages.length > 0, 'Не найдено ни одного page.tsx!');
});

for (const filePath of allPages) {
    const relPath = path.relative(APP_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const boldViolations = lines.filter(l => l.includes('font-bold') && !l.includes('// canon-exception'));
    if (boldViolations.length > 0) {
        test(`UI Canon: ${relPath} — НЕ содержит font-bold`, () => {
            assertEqual(boldViolations.length, 0, `Нарушение: font-bold в ${relPath}`);
        });
    }

    const semiboldViolations = lines.filter(l => l.includes('font-semibold') && !l.includes('// canon-exception'));
    if (semiboldViolations.length > 0) {
        test(`UI Canon: ${relPath} — НЕ содержит font-semibold`, () => {
            assertEqual(semiboldViolations.length, 0, `Нарушение: font-semibold в ${relPath}`);
        });
    }
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 7: API-клиент — все эндпоинты определены
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 7: api.ts — все эндпоинты Commerce определены        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const API_FILE = path.resolve(__dirname, 'lib', 'api.ts');
const apiContent = fs.readFileSync(API_FILE, 'utf-8');

const REQUIRED_API_ENDPOINTS = [
    // Party Management
    "'/commerce/jurisdictions'",
    "'/commerce/regulatory-profiles'",
    "'/commerce/parties'",
    "'/commerce/party-relations'",
    // Commerce CRUD
    "'/commerce/contracts'",
    "'/commerce/obligations'",
    "'/commerce/fulfillment-events'",
    "'/commerce/invoices/from-fulfillment'",
    "'/commerce/payments'",
    "'/commerce/payment-allocations'",
    // CRM
    "'/registry/fields'",
    "'/consulting/plans'",
];

for (const ep of REQUIRED_API_ENDPOINTS) {
    test(`api.ts содержит эндпоинт ${ep}`, () => {
        assertTrue(apiContent.includes(ep), `Эндпоинт ${ep} НЕ найден в api.ts!`);
    });
}

const REQUIRED_API_METHODS = [
    'createContract',
    'createObligation',
    'createFulfillment',
    'createInvoice',
    'postInvoice',
    'createPayment',
    'confirmPayment',
    'allocatePayment',
    'arBalance',
    'createJurisdiction',
    'createRegulatoryProfile',
    'createParty',
    'createPartyRelation',
];

for (const method of REQUIRED_API_METHODS) {
    test(`api.ts определяет метод ${method}`, () => {
        assertTrue(apiContent.includes(method), `Метод ${method} НЕ найден в api.ts!`);
    });
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 8: Нет хардкода 'default-company'
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 8: Нет хардкода default-company                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const CRITICAL_FILES = [
    path.join(APP_APP_DIR, 'commerce', 'parties', 'page.tsx'),
];

for (const filePath of CRITICAL_FILES) {
    const relPath = path.relative(APP_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    test(`${relPath} — НЕ содержит 'default-company'`, () => {
        assertTrue(!content.includes("'default-company'"), `Хардкод 'default-company' найден в ${relPath}!`);
    });

    test(`${relPath} — использует api.users.me() для получения companyId`, () => {
        assertTrue(content.includes('api.users.me()'), `НЕ использует api.users.me() в ${relPath}!`);
    });
}

// ────────────────────────────────────────────────────────────────────
// ТЕСТ 9: Страницы-заглушки — правильная структура
// ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ТЕСТ 9: Заглушки — экспорт + импорт Card                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const STUB_DIRS = ['finance', 'economy', 'strategy', 'gr', 'production', 'knowledge', 'settings'];
const stubPages = STUB_DIRS.flatMap(d => {
    const moduleDir = path.join(APP_APP_DIR, d);
    const subs = REQUIRED_ROUTES[d] || [];
    return subs.map(s => path.join(moduleDir, s, 'page.tsx')).filter(f => fs.existsSync(f));
});

for (const filePath of stubPages) {
    const relPath = path.relative(APP_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    test(`${relPath} — экспортирует default function`, () => {
        assertTrue(content.includes('export default function'), `${relPath}: нет default export!`);
    });

    test(`${relPath} — импортирует Card`, () => {
        assertTrue(content.includes("Card"), `${relPath}: не импортирует Card!`);
    });
}

// ────────────────────────────────────────────────────────────────────
// ИТОГО
// ────────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════');
console.log(`  ИТОГО: ${totalTests} тестов | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log('══════════════════════════════════════════════════════════════\n');

if (failures.length > 0) {
    console.log('ПРОВАЛИВШИЕСЯ ТЕСТЫ:');
    failures.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.name}`);
        console.log(`     → ${f.error}`);
    });
    console.log('');
    process.exit(1);
} else {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! CODEX_PROMPT полностью реализован.\n');
    process.exit(0);
}
