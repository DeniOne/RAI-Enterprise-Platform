# PLAN — S2.2 WorkspaceContext Load Rule
Дата: 2026-03-03  
Статус: ACCEPTED (by TECHLEAD)
Промпт-источник: `interagency/prompts/2026-03-03_s2-2_workspace-context-load-rule.md`  
Чеклист-источник: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (п. 2.2)  
Decision-ID: AG-WORKSPACE-CONTEXT-EXPAND-001

## Результат
- В `apps/web/lib/stores/workspace-context-store.ts` появится обязательный слой sanitation/validation перед записью в store.
- `WorkspaceContext` перестанет принимать тяжёлые и невалидные данные “как есть”: длинные строки будут обрезаться до лимитов, вложенные объекты в `filters` будут отклоняться, избыток `activeEntityRefs` будет отсекаться.
- Появится unit-тест `apps/web/__tests__/workspace-context-load-rule.spec.ts`, который доказывает три ключевых правила load control.

## Границы
- Входит: только hardening `workspace-context-store.ts`, локальная утилита sanitation, unit-тест на load rule, прогон `jest` и `tsc` для `apps/web`.
- Входит: переиспользование существующих Zod-контрактов из `apps/web/shared/contracts/workspace-context.ts` как единственного источника лимитов.
- Не входит: изменение контракта `WorkspaceContext`, изменение страниц-публикаторов, изменение backend DTO, добавление новых полей, UI-полировка.
- Не входит: silent mutation всего объекта контекста вне текущих set-акшенов; scope ограничен `setActiveEntityRefs`, `setFilters`, `setSelectedRowSummary`, `setLastUserAction`.

## Риски
- Есть риск сломать текущие страницы, если sanitation будет не локальным и начнёт сбрасывать валидные данные целиком вместо точечной нормализации.
- Есть риск расхождения между store-логикой и Zod-контрактом, если лимиты будут продублированы вручную вместо опоры на существующие схемы.
- Есть риск скрыть ошибку интеграции, если fail-safe на невалидный payload не будет явно логироваться в `console.warn` в dev-режиме.

## План работ
- [ ] Прочитать и зафиксировать текущие лимиты из `WorkspaceContextSchema`, `SelectedRowSummarySchema` и `WorkspaceEntityRefSchema`, не вводя новые значения “от себя”.
- [ ] Добавить в `workspace-context-store.ts` утилиту `sanitizeContextData`, которая:
  - обрезает строки для `title`, `subtitle`, `lastUserAction`,
  - ограничивает массив `activeEntityRefs` первыми 10 элементами,
  - проверяет `filters` как плоский объект без вложенных значений,
  - валидирует результат через `.safeParse()` на базе существующих Zod-схем.
- [ ] Обернуть `setActiveEntityRefs`, `setFilters`, `setSelectedRowSummary`, `setLastUserAction` в sanitation-слой так, чтобы при невалидном payload запись не меняла store и в dev-режиме писала `console.warn`.
- [ ] Оставить `setRoute` и `setRouteAndReset` вне жёсткого fail-safe для нецелевых правил, но не нарушить существующий контракт `route`.
- [ ] Добавить `apps/web/__tests__/workspace-context-load-rule.spec.ts` с тремя сценариями:
  - `title` длиной 500 символов сохраняется как 160,
  - вложенный объект в `filters` не попадает в store,
  - больше 10 `activeEntityRefs` усекаются до первых 10.
- [ ] Прогнать целевые проверки: `jest` по новому тесту и `tsc` по `apps/web`.
- [ ] Подготовить review packet: отчёт, лог тестов, `git status`, ключевой `git diff`, статус в `interagency/INDEX.md` = `READY_FOR_REVIEW`.

## DoD
- [ ] Store гарантирует load rule независимо от того, что передала страница.
- [ ] Автоматическая обрезка строк подтверждена тестом.
- [ ] Вложенные объекты в `filters` не попадают в store.
- [ ] Избыток `activeEntityRefs` усекается до 10.
- [ ] `apps/web` проходит целевой `tsc`.
- [ ] `workspace-context-load-rule.spec.ts` проходит.
