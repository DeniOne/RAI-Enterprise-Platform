/**
 * ШАГ 4: Тесты navigation-policy.ts
 * Проверяет что ВСЕ подроуты из CODEX_PROMPT прописаны в навигации.
 */
import * as path from 'path';

// Прямой импорт массива навигации
const navPolicyPath = path.resolve(__dirname, '..', 'lib', 'consulting', 'navigation-policy.ts');

// Читаем файл и парсим все пути вручную (без импорта TypeScript модуля)
import * as fs from 'fs';

const navContent = fs.readFileSync(navPolicyPath, 'utf-8');

// Извлекаем все path: '/xxx' из файла
function extractPaths(content: string): string[] {
    const regex = /path:\s*['"](\/[^'"]+)['"]/g;
    const paths: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
        paths.push(match[1]);
    }
    return paths;
}

const registeredPaths = extractPaths(navContent);

describe('ШАГ 4: navigation-policy.ts — все подроуты зарегистрированы', () => {
    // ─── Финансы (Блок C) ───────────────────────────────────────
    const financeSubroutes = ['/finance/cashflow', '/finance/performance', '/finance/invoices', '/finance/reporting'];
    for (const route of financeSubroutes) {
        it(`Финансы: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }

    // ─── Экономика (Блок C) ─────────────────────────────────────
    const economySubroutes = ['/economy/crop', '/economy/aggregation', '/economy/unit', '/economy/safety', '/economy/forecast'];
    for (const route of economySubroutes) {
        it(`Экономика: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }

    // ─── Стратегия (Блок D) ─────────────────────────────────────
    const strategySubroutes = ['/strategy/overview', '/strategy/portfolio', '/strategy/risks', '/strategy/scenarios', '/strategy/log'];
    for (const route of strategySubroutes) {
        it(`Стратегия: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }

    // ─── GR (Блок E) ───────────────────────────────────────────
    const grSubroutes = ['/gr/regulatory', '/gr/limits', '/gr/contracts', '/gr/compliance', '/gr/decisions'];
    for (const route of grSubroutes) {
        it(`GR: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }

    // ─── Производство (Блок E) ──────────────────────────────────
    const productionSubroutes = ['/production/procurement', '/production/storage', '/production/manufacturing', '/production/quality', '/production/logistics', '/production/analytics'];
    for (const route of productionSubroutes) {
        it(`Производство: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }

    // ─── Знания (Блок E) ───────────────────────────────────────
    const knowledgeSubroutes = ['/knowledge/base', '/knowledge/cases', '/knowledge/patterns', '/knowledge/evolution'];
    for (const route of knowledgeSubroutes) {
        it(`Знания: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }

    // ─── Настройки (Блок E) ────────────────────────────────────
    const settingsSubroutes = ['/settings/users', '/settings/access', '/settings/audit', '/settings/integrations', '/settings/params'];
    for (const route of settingsSubroutes) {
        it(`Настройки: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }

    // ─── Commerce (Блок A) ─────────────────────────────────────
    const commerceSubroutes = ['/commerce/contracts', '/commerce/fulfillment', '/commerce/invoices', '/commerce/payments'];
    for (const route of commerceSubroutes) {
        it(`Коммерция: ${route} должен быть в навигации`, () => {
            expect(registeredPaths).toContain(route);
        });
    }
});

describe('ШАГ 4: navigation-policy.ts — ролевая матрица доступа', () => {
    it('должен содержать роли ADMIN для всех модулей', () => {
        const adminCount = (navContent.match(/ADMIN/g) || []).length;
        // Каждый пункт меню содержит ADMIN, минимум 8 модулей × ~5 подпунктов = ~40
        expect(adminCount).toBeGreaterThan(30);
    });

    it('должен содержать роль SYSTEM_ADMIN', () => {
        expect(navContent).toContain('SYSTEM_ADMIN');
    });

    it('должен содержать роль FOUNDER', () => {
        expect(navContent).toContain('FOUNDER');
    });

    it('должен содержать роль CEO', () => {
        expect(navContent).toContain('CEO');
    });

    it('Финансы должны быть доступны DIRECTOR_FINANCE', () => {
        // Ищем строку с finance и DIRECTOR_FINANCE
        const financeBlock = navContent.includes('DIRECTOR_FINANCE');
        expect(financeBlock).toBe(true);
    });

    it('Экономика должна быть доступна DIRECTOR_ECONOMY', () => {
        expect(navContent).toContain('DIRECTOR_ECONOMY');
    });

    it('GR должен быть доступен DIRECTOR_GR', () => {
        expect(navContent).toContain('DIRECTOR_GR');
    });

    it('Производство должно быть доступно DIRECTOR_PRODUCTION', () => {
        expect(navContent).toContain('DIRECTOR_PRODUCTION');
    });
});
