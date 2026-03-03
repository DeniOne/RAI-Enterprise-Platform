# ПЛАН — S2.1 WorkspaceContext Contract
Дата: 2026-03-03
Промт: `interagency/prompts/2026-03-03_s2-1_workspace-context-contract.md`
Decision-ID: `AG-WORKSPACE-CONTEXT-EXPAND-001`
Статус: ACCEPTED (by TECHLEAD)

## 1. Цель
Довести блок `S2.1 / WorkspaceContext contract` до фактического закрытия, чтобы агентный чат стабильно получал канонический структурированный `workspaceContext` на каждом запросе, а страничный контекст не протекал между роутами.

## 2. Текущее состояние (truth-sync)
- Канонический frontend-контракт уже существует: `apps/web/shared/contracts/workspace-context.ts`.
- Zustand-store уже существует: `apps/web/lib/stores/workspace-context-store.ts`.
- Отправка `workspaceContext` из чата уже реализована: `apps/web/lib/stores/ai-chat-store.ts`.
- Публикация контекста уже частично внедрена на ряде страниц: CRM/Contracts, TechMap, Execution Manager, Farm Details.
- Backend endpoint `/api/rai/chat` уже принимает `workspaceContext` через DTO.
- Незакрытые зазоры:
  - в shell-контуре не зафиксирована гарантированная очистка page-level контекста при смене маршрута;
  - observability на backend пока логирует факт запроса, но не структурный `workspaceContext`;
  - нужно добрать или формально подтвердить coverage ключевых страниц под `S2.1`;
  - нужно собрать доказательства закрытия DoD.

## 3. Границы
- Входит:
  - route-lifecycle для `WorkspaceContext` в shell/layout-контуре;
  - проверка и доведение отправки `workspaceContext` из чата;
  - публикация контекста на ключевых страницах `CRM / TechMap / Yield-KPI` или ближайших канонических экранах, закрывающих этот сценарий;
  - backend-логирование принятого `workspaceContext` без чувствительных данных;
  - typecheck/tests и доказательная база для truth-sync.
- Не входит:
  - редизайн shell/UI;
  - изменение доменной модели агента;
  - расширение контракта тяжёлыми данными, таблицами или tenant-полями;
  - browser-automation или большой e2e-контур.

## 4. Архитектурные ограничения
- В `workspaceContext` запрещены тяжёлые данные: только `refs`, короткие `summary`, фильтры и маркеры действий.
- `companyId` не передаётся из frontend payload и не хранится в `workspaceContext`.
- `selectedRowSummary` не должен содержать чувствительные данные.
- `WorkspaceContext` должен оставаться page-scoped: при смене маршрута страничные поля сбрасываются, а новый route становится источником истины.

## 5. План работ

### Шаг 1. Shell lifecycle
- Проверить текущую связку `AppShell`/route hooks/`AiChatRoot`.
- Ввести гарантированный `resetPageContext` или `setRouteAndReset` при навигации, чтобы `activeEntityRefs`, `filters`, `selectedRowSummary`, `lastUserAction` не переносились на новый экран.
- Убедиться, что после навигации новый route сразу фиксируется в store как актуальный.

### Шаг 2. Chat integration
- Подтвердить, что `sendMessage` всегда забирает актуальный `workspaceContext` из `useWorkspaceContextStore` в момент отправки сообщения.
- Проверить отсутствие регрессии после route-reset.
- При необходимости добавить точечный тест на то, что чат отправляет текущий route и refs из store.

### Шаг 3. Page registration coverage
- Провести truth-sync по текущим страницам, где уже публикуется контекст.
- Добрать недостающий сценарий `Yield/KPI Page` или зафиксировать канонический экран-заменитель, если в продукте этот сценарий представлен под другим route.
- Проверить, что каждая ключевая страница публикует только:
  - `activeEntityRefs`
  - `filters`
  - `selectedRowSummary`
  - `lastUserAction`
- Исключить передачу тяжёлых таблиц и произвольных payload-объектов.

### Шаг 4. Backend observability
- Доработать `RaiChatController` или соседний слой так, чтобы при запросе логировался структурный факт получения `workspaceContext`.
- Лог должен быть безопасным: без `companyId` из payload, без секретов, без тяжёлых dumps.
- Если контекст уже подмешивается в prompt-composition, зафиксировать это как доказательство; если нет, достаточно подтвердить приём и логирование.

### Шаг 5. Верификация и отчёт
- Прогнать `tsc` и релевантные тесты frontend/backend.
- Получить воспроизводимое доказательство, что в запросе `/api/rai/chat` уходит `workspaceContext`.
- Выпустить interagency-report по `S2.1`.
- Обновить `PROJECT_EXECUTION_CHECKLIST.md` и `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` только после фактического прохождения DoD.

## 6. Риски
- Если route-reset будет реализован слишком агрессивно, можно случайно сбрасывать контекст до того, как страница успеет опубликовать новый `selectedRowSummary`.
- Если ключевой `Yield/KPI` сценарий в коде отсутствует или размыт между несколькими страницами, потребуется явно выбрать канонический экран для закрытия `S2.1`.
- Логирование полного объекта без фильтрации может привести к утечке лишних данных и нарушить security-policy.
- На грязном git-дереве есть риск зацепить несвязанные пользовательские правки, поэтому изменения должны быть точечными.

## 7. Проверка / DoD
- При отправке сообщения в чат запрос `/api/rai/chat` содержит `workspaceContext` с актуальными `route` и `activeEntityRefs`.
- После навигации на другой route старые `activeEntityRefs` и прочие page-level поля не протекают в новый экран.
- Ключевые сценарии `CRM / TechMap / Yield-KPI` закрыты кодом или формально подтверждены каноническими экранами-заменителями.
- Frontend и backend типизация синхронизированы, `tsc` проходит.
- Сообщения чата уходят без ошибок.
- Выпущен interagency-report с доказательствами и truth-sync-статусом.
