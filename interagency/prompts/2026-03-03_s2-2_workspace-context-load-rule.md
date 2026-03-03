# PROMPT — 2.2 WorkspaceContext Load Rule (Gatekeeper)
Дата: 2026-03-03  
Статус: active  
Приоритет: P1  

## Цель
Внедрить механизмы принудительного ограничения объема данных (Load Rule) в `WorkspaceContext`, чтобы исключить передачу тяжелых объектов в AI-чат и предотвратить раздувание токенов.

## Контекст
- Основание: `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (п. 2.2).
- Проблема: Текущий стор `useWorkspaceContextStore` принимает данные «как есть», без предварительной валидации на объем. Если страница по ошибке запишет в фильтры или summary мегабайты данных, они улетят на бэкенд.

## Ограничения (жёстко)
- **Automatic Truncation**: Любая строка, превышающая лимит (Title > 160, Subtitle > 240, Action > 200), должна автоматически обрезаться ДО записи в стор.
- **Strict Filters**: Поле `filters` должно быть плоским объектом `Record<string, string | number | boolean | null>`. Вложенные объекты запрещены.
- **Fail-Safe**: При ошибке валидации (например, попытка пропихнуть вложенный объект) — стор должен отклонять запись (`noop`) и выводить `console.warn` (только в dev).

## Задачи (что сделать)
- [ ] **Frontend (Store Hardening)**:
    - Модернизировать `apps/web/lib/stores/workspace-context-store.ts`.
    - Обернуть все `set`-акшены (setActiveEntityRefs, setFilters, setSelectedRowSummary, setLastUserAction) в валидационный слой.
    - Использовать существующие Zod-схемы из `apps/web/shared/contracts/workspace-context.ts` для проверки типов и длины.
    - Реализовать утилиту `sanitizeContextData`, которая делает `.safeParse()` и возвращает обрезанные/валидные данные.
- [ ] **Testing**:
    - Добавить юнит-тест `apps/web/__tests__/workspace-context-load-rule.spec.ts`.
    - Тест должен проверять:
        - Попытка записи `title` длиной 500 символов → в сторе остается 160.
        - Попытка записи вложенного объекта в `filters` → данные в фильтрах не меняются (или вложенный объект отбрасывается).
        - Попытка записи более 10 `activeEntityRefs` → в сторе остается первые 10.

## Definition of Done (DoD)
- [ ] Стор `useWorkspaceContextStore` гарантирует соблюдение лимитов Zod независимо от действий страницы.
- [ ] Автоматическая обрезка строк работает (проверено тестом).
- [ ] `tsc` PASS.
- [ ] Тест `workspace-context-load-rule.spec.ts` проходит (3/3 теста).

## Что вернуть на ревью
- Измененный файл `workspace-context-store.ts`.
- Новый файл теста `workspace-context-load-rule.spec.ts`.
- Лог успешного выполнения теста.
