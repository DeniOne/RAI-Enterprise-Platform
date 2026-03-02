# PLAN — Расширение WorkspaceContext на Operations и Commerce
Дата: 2026-03-02  
Статус: draft  
Decision-ID: AG-WORKSPACE-CONTEXT-EXPAND-001  

## Результат (какой артефакт получим)
- Исполнимый план для `P2.1`: расширить уже существующий канонический `WorkspaceContext` с текущих CRM/TechMap на ещё минимум 2 рабочих зоны, чтобы чат получал релевантные `activeEntityRefs`, `selectedRowSummary` и `lastUserAction` не только из текущих внедрённых страниц.
- Зафиксированный минимальный frontend-scope: publisher-слой и summary wiring для выбранной страницы `Operations` и выбранной страницы `Commerce`, без переписывания экранов целиком.
- Явный admission-блокер: реализация запрещена, пока `AG-WORKSPACE-CONTEXT-EXPAND-001` не внесён в `DECISIONS.log` и не имеет статуса `ACCEPTED`.

## Границы (что входит / что НЕ входит)
- Входит: анализ текущего контракта `apps/web/shared/contracts/workspace-context.ts`, стора `apps/web/lib/stores/workspace-context-store.ts` и существующих publisher-референсов на CRM/TechMap как канонического образца.
- Входит: выбор минимальных боевых страниц для расширения:
  - `Commerce` — из реально существующих роутов `apps/web/app/(app)/commerce/*`
  - `Operations` — только после подтверждения точного маршрута/экрана в текущем repo
- Входит: для каждой целевой страницы публикация `activeEntityRefs`, краткого `selectedRowSummary` и `lastUserAction` при наличии пользовательского выбора.
- Входит: ограничение размера summaries и сохранение стабильности схемы, чтобы в чат уходили только refs + краткие summaries, без tenant identity и тяжёлого payload.
- Входит: smoke-путь “страница → выбор сущности → отправка сообщения → backend получает context”.
- Не входит: расширение контракта `WorkspaceContext` новыми тяжёлыми полями, переписывание layout/page architecture, UI-polish, доработка всех commerce/operations экранов за один проход.
- Не входит: любые изменения, где `companyId` попадает в payload контекста или выбирается из UI-state вместо доверенного backend context.

## Риски (что может пойти не так)
- Блокирующий admission-риск: `AG-WORKSPACE-CONTEXT-EXPAND-001` ещё не подтверждён в `DECISIONS.log`; до `ACCEPTED` допустимо только планирование.
- Риск ложного таргетинга: для `Operations` точный целевой экран пока не подтверждён простым путём в `apps/web/app`, поэтому сначала нужен факт-чекинг маршрута, иначе план упрётся в несуществующую страницу.
- Риск утечки и bloating: если summary начнут собираться напрямую из больших DTO/таблиц, контекст распухнет и станет нестабильным для чата.
- Риск несогласованности publisher-логики: разные страницы могут по-разному трактовать “выбранную сущность”, поэтому нужен единый минимум полей и ограничений длины.
- Риск регрессии sticky-context: если не сбрасывать страничные данные корректно при навигации, чат получит refs от предыдущего экрана.

## План работ (коротко, исполнимо)
- [ ] Проверить наличие `AG-WORKSPACE-CONTEXT-EXPAND-001` в `DECISIONS.log`; при отсутствии `ACCEPTED` остановить реализацию на admission-gate.
- [ ] Подтвердить фактические целевые страницы:
  - выбрать конкретный `Commerce` route из существующих `apps/web/app/(app)/commerce/*`;
  - найти и зафиксировать точный `Operations` route в текущем repo или явно остановить scope до появления такого экрана.
- [ ] Просмотреть существующие publisher-референсы в `FarmDetailsPage` и `consulting/techmaps/active/page.tsx`, чтобы использовать их как канон для новой интеграции.
- [ ] Для выбранной страницы `Commerce` спроектировать минимальный publisher:
  - какой entity становится `activeEntityRef`;
  - какой краткий summary уходит в `selectedRowSummary`;
  - какой `lastUserAction` фиксируется.
- [ ] Для выбранной страницы `Operations` спроектировать такой же publisher либо, если точная страница отсутствует, зафиксировать это как admission/scope blocker без выдумывания реализации.
- [ ] После `ACCEPTED` внедрить publisher wiring через `useWorkspaceContextStore` без изменения tenant-модели и без тяжёлых payload.
- [ ] После `ACCEPTED` ограничить размер summaries и проверить, что `AiChatStore` по-прежнему отправляет только канонический `WorkspaceContext`.
- [ ] После `ACCEPTED` подготовить smoke-доказательство: открыть страницу, выбрать сущность, отправить сообщение, показать пример payload `WorkspaceContext` для `Commerce` и `Operations`.

## DoD
- [ ] Минимум одна страница `Commerce` публикует корректные `activeEntityRefs` и `selectedRowSummary` в канонический `WorkspaceContext`.
- [ ] Минимум одна страница `Operations` публикует корректные `activeEntityRefs` и `selectedRowSummary`, либо её отсутствие зафиксировано как блокирующий scope-факт до начала реализации.
- [ ] Контекст по-прежнему уходит в каждый запрос чата через существующий store/API pipeline.
- [ ] Размер summaries ограничен; тяжёлые данные и `companyId` не попадают в payload.
- [ ] Есть минимум 2 примера payload `WorkspaceContext` для review: по одному на `Commerce` и `Operations` либо явный blocker по `Operations`.
