# REPORT — S2.2 WorkspaceContext Load Rule
Дата: 2026-03-03  
Статус: final  

## Что было целью
- Внедрить принудительное ограничение объёма данных в `WorkspaceContext` на уровне frontend-store.
- Исключить запись длинных строк, вложенных объектов в `filters` и избыточных `activeEntityRefs` до отправки в AI-чат.
- Подтвердить поведение unit-тестом и типовой проверкой `tsc`.

## Что сделано (факты)
- В [workspace-context-store.ts](/root/RAI_EP/apps/web/lib/stores/workspace-context-store.ts) добавлен sanitation/validation слой перед записью в store.
- `setActiveEntityRefs` теперь ограничивает массив первыми 10 элементами и валидирует их через `WorkspaceEntityRefSchema`.
- `setSelectedRowSummary` теперь автоматически обрезает `title` до 160 символов и `subtitle` до 240 символов перед `safeParse`.
- `setLastUserAction` теперь автоматически обрезает строку до 200 символов перед `safeParse`.
- `setFilters` теперь принимает только плоский объект; при вложенном значении запись отклоняется и в dev-режиме пишет `console.warn`.
- Добавлен unit-тест [workspace-context-load-rule.spec.ts](/root/RAI_EP/apps/web/__tests__/workspace-context-load-rule.spec.ts) на три обязательных сценария load rule.

## Изменённые файлы
- `apps/web/lib/stores/workspace-context-store.ts`
- `apps/web/__tests__/workspace-context-load-rule.spec.ts`
- `interagency/plans/2026-03-03_s2-2_workspace-context-load-rule.md`
- `interagency/reports/2026-03-03_s2-2_workspace-context-load-rule.md`
- `interagency/INDEX.md`

## Проверки/прогоны
- `pnpm --dir /root/RAI_EP/apps/web test -- --runInBand __tests__/workspace-context-load-rule.spec.ts` -> PASS
- `pnpm --dir /root/RAI_EP/apps/web exec tsc -p tsconfig.json --noEmit` -> PASS

## Что сломалось / что не получилось
- Manual check не требовался DoD и не выполнялся.
- Во время реализации был краткий локальный синтаксический дефект в `workspace-context-store.ts`; устранён до финального прогона, в итоговое состояние не попал.

## Что сделано дополнительно
- Fail-safe сделан без изменения публичного контракта `WorkspaceContext`: страницы продолжают вызывать прежние set-акшены.
- Лимиты не продублированы отдельной конфигурацией, а опираются на существующие Zod-схемы `workspace-context.ts`.

## Следующий шаг
- Передать пакет на внешнее ревью.
- После внешнего ревью обновить статус задачи и синхронизировать чеклисты только по факту принятия.

## Технические артефакты

### git status
```text
 M apps/web/lib/stores/workspace-context-store.ts
 M "docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md"
 M interagency/INDEX.md
 M interagency/plans/2026-03-02_p2-2_external-signals-advisory.md
?? apps/web/__tests__/workspace-context-load-rule.spec.ts
?? interagency/plans/2026-03-03_s2-2_workspace-context-load-rule.md
```

### git diff
```diff
diff --git a/apps/web/lib/stores/workspace-context-store.ts b/apps/web/lib/stores/workspace-context-store.ts
+const DEV_WARN_PREFIX = '[workspace-context-load-rule]';
+function truncateText(value: string, limit: number): string { ... }
+function sanitizeActiveEntityRefs(...) { ... }
+function sanitizeFilters(...) { ... }
+function sanitizeSelectedRowSummary(...) { ... }
+function sanitizeLastUserAction(...) { ... }
+setActiveEntityRefs: (refs) => set((state) => { ...sanitizedRefs... }),
+setFilters: (filters) => set((state) => { ...sanitizedFilters... }),
+setSelectedRowSummary: (summary) => set((state) => { ...sanitizedSummary... }),
+setLastUserAction: (action) => set((state) => { ...sanitizedAction... }),

diff --git a/apps/web/__tests__/workspace-context-load-rule.spec.ts b/apps/web/__tests__/workspace-context-load-rule.spec.ts
+it('обрезает title до 160 символов', ...)
+it('не принимает вложенный объект в filters', ...)
+it('усекает activeEntityRefs до первых 10', ...)
```

### Логи прогонов
```text
$ pnpm --dir /root/RAI_EP/apps/web test -- --runInBand __tests__/workspace-context-load-rule.spec.ts
console.warn
  [workspace-context-load-rule] filters rejected: nested values are forbidden { key: 'nested', value: { heavy: true } }

PASS __tests__/workspace-context-load-rule.spec.ts
  workspace-context load rule
    ✓ обрезает title до 160 символов
    ✓ не принимает вложенный объект в filters
    ✓ усекает activeEntityRefs до первых 10

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total

$ pnpm --dir /root/RAI_EP/apps/web exec tsc -p tsconfig.json --noEmit
PASS
```
