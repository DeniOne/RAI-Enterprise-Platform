[2026-03-20] Routing Learning Layer — controlled migration стартован
- Принято решение не вводить отдельный routing-сервис и новый Prisma-store на первой волне.
- Источник правды для routing telemetry: `AiAuditEntry.metadata.routingTelemetry`.
- Основной migration pattern: `shadow-first`, затем selective primary cutover.
- Первый production slice для primary-cutover: `agro.techmaps.list-open-create`.
- Runtime enforcement на этой волне ограничен coarse capability gating; dynamic gating и case memory отложены.

[2026-03-20] Techmaps routing eval gate включён
- Для `SemanticRouterService` добавлен fixture-driven корпус `techmaps-routing-eval-corpus.json`.
- Введён отдельный quality gate `pnpm gate:routing:techmaps`, который выполняет `semantic-router.eval.spec.ts`.
- Gate добавлен в `.github/workflows/invariant-gates.yml` как hard-fail шаг, чтобы коллизии `read/open/create` ловились до релиза.

[2026-03-20] Agent-level routing divergence drilldown включён
- Endpoint `/api/rai/explainability/routing/divergence` расширен полем `agentBreakdown`.
- Aggregation теперь группирует routing telemetry по `targetRole` и считает `divergenceRatePct`, `semanticPrimaryCount`, `decisionBreakdown`, `topMismatchKinds`.
- `Control Tower` показывает самый шумный агентный контур и его mismatch-профиль без доступа к raw payload.

[2026-03-20] Failure-cluster triage включён
- Endpoint `/api/rai/explainability/routing/divergence` расширен полем `failureClusters`.
- Read-model теперь группирует повторяющиеся mismatch-группы по `targetRole + decisionType + mismatchKinds` и считает `caseMemoryReadiness`.
- `Control Tower` показывает повторяющиеся кластеры сбоев и их готовность к памяти кейсов, чтобы следующий шаг по `case memory` опирался на production-повторы.

[2026-03-20] Versioned case memory candidates включены
- Endpoint `/api/rai/explainability/routing/divergence` расширен полем `caseMemoryCandidates`.
- Read-model теперь группирует version-aware кандидатов по `sliceId + targetRole + decisionType + mismatchKinds + routerVersion + promptVersion + toolsetVersion`.
- Для каждого кандидата считаются `traceCount`, `firstSeenAt`, `lastSeenAt`, `ttlExpiresAt` и readiness; `Control Tower` показывает их без отдельной таблицы и отдельного ingestion-store.

[2026-03-20] Routing case memory capture path включён
- Добавлен operator endpoint `POST /api/rai/explainability/routing/case-memory-candidates/capture` с `Idempotency-Key` и `RolesGuard`.
- Persisted capture path построен на append-only `AuditLog` action `ROUTING_CASE_MEMORY_CANDIDATE_CAPTURED`; отдельный Prisma-store по-прежнему не вводился.
- Read-model `routing/divergence` теперь возвращает `captureStatus / capturedAt / captureAuditLogId`, а `Control Tower` даёт кнопку `зафиксировать` только для `ready_for_case_memory` кандидатов.

[2026-03-20] Routing case memory retrieval и lifecycle включены
- Добавлен `RoutingCaseMemoryService`, который читает captured cases из `AuditLog`, фильтрует их по `TTL`, считает relevance-score и активирует релевантные кейсы через action `ROUTING_CASE_MEMORY_CASE_ACTIVATED`.
- `SemanticRouterService` теперь получает `retrievedCaseMemory[]` до `LLM refine` и может выполнить safe override только для low-risk read-only сценариев.
- Explainability и `Control Tower` различают lifecycle `not_captured / captured / active`, поэтому память кейсов перестала быть пассивной аналитикой и стала runtime-входом для маршрутизации.

[2026-03-20] Case memory gate ужесточён
- `pnpm gate:routing:techmaps` теперь включает `semantic-router.eval.spec.ts`, `semantic-router.service.spec.ts` и `routing-case-memory.service.spec.ts`.
- В gate добавлен negative write-guard: case memory не может перевести `abstain` в `write execute`, даже если similarity у captured case высокий.

[2026-03-20] Второй bounded slice `agro.deviations.review` включён
- `SemanticRouterService` получил отдельный `sliceId` для `deviations`; primary promotion включается только внутри `/consulting/deviations*`, а вне этого route-space `compute_deviations` остаётся в `shadow`.
- Исправлен приоритет slice-resolver: явный `deviations`-контур теперь побеждает раньше общего `techmaps/field` сигнала, поэтому поле в контексте страницы отклонений больше не уводит routing в `agro.techmaps.list-open-create`.
- `AgentExecutionAdapterService` теперь честно отдаёт `executionPath = semantic_router_primary` для agronomist-интентов, если они пришли из первичного semantic-routing.
- Eval/gate расширены до уровня `agro-slices`: добавлен `deviations-routing-eval-corpus.json`, введён канонический `pnpm gate:routing:agro-slices`, старый `pnpm gate:routing:techmaps` сохранён как compatibility alias.

[2026-03-20] Третий bounded slice `finance.plan-fact.read` включён
- `SemanticRouterService` получил entity `plan_fact` и отдельный bounded slice `finance.plan-fact.read`.
- Primary promotion для `compute_plan_fact` ограничен `yield/finance`-контуром; вне него semantic-router считает маршрут, но не перехватывает production-primary path.
- `selectedRowSummary.kind = yield` теперь используется как источник `planId`, поэтому в `yield`-контуре `compute_plan_fact` может уходить в `execute`, а при пустом контексте — в честный `clarify`.
- Канонический gate переименован в `pnpm gate:routing:primary-slices`; старые `pnpm gate:routing:agro-slices` и `pnpm gate:routing:techmaps` сохранены как совместимые алиасы.

[2026-03-20] Четвёртый bounded finance-wave `scenario + risk` включён
- `SemanticRouterService` получил ещё два finance-slice: `finance.scenario.analysis` и `finance.risk.analysis`.
- `RoutingEntity` расширен значениями `scenario` и `risk_assessment`; LLM-prompt и case-memory intent mapping синхронизированы с новыми сущностями.
- Primary promotion для `simulate_scenario` и `compute_risk_assessment` ограничен `yield/finance`-контуром, а вне него сохранён `shadow` по явным finance-сигналам.
- `AgentExecutionAdapterService` теперь явно резолвит economist-intent из `semanticRouting.routeDecision.eligibleTools/sliceId`, поэтому primary semantic-routing больше не деградирует обратно в `compute_plan_fact`.
- Общий gate `pnpm gate:routing:primary-slices` подтверждает все текущие bounded slice: `techmaps`, `deviations`, `plan-fact`, `scenario`, `risk`.

[2026-03-20] Пятый bounded slice `crm.account.workspace-review` включён
- `SemanticRouterService` получил новый bounded read-only slice `crm.account.workspace-review` для `review_account_workspace`.
- `RoutingEntity` расширен значением `account`; primary promotion для CRM-карточки ограничен route-space `/parties | /consulting/crm | /crm`.
- Закрыт runtime-gap между chat-routing и CRM runtime: `CrmAgent` и `AgentExecutionAdapterService` теперь реально поддерживают `query` для `review_account_workspace`, а не только `accountId`.
- `RoutingCaseMemoryService.inferSliceId()` расширен CRM-slice логикой, поэтому будущая case-memory retrieval не смешает карточку контрагента с finance/agro маршрутами.
- Общий gate `pnpm gate:routing:primary-slices` теперь подтверждает шесть bounded slice, включая `crm-workspace`.

[2026-03-20] Шестой bounded slice `contracts.registry-review` включён
- `SemanticRouterService` получил новый bounded read-only slice `contracts.registry-review` для `list_commerce_contracts` и `review_commerce_contract`; primary promotion ограничен route-space `/commerce/contracts`.
- `ContractsAgentInput`, `GetCommerceContractPayload` и `getCommerceContractSchema` расширены read-only полем `query`; review договора теперь возможен по `contractId` или `query`.
- `ContractsToolsRegistry` реализует safe lookup по `contractId / number / quoted query / party legalName`, не расширяя write-surface и не вводя новый store.
- `AgentExecutionAdapterService` теперь резолвит contracts-intent из `semanticRouting.routeDecision.eligibleTools` и прокидывает `query` в `ContractsAgent`.
- `detectContractsIntent()` больше не валит `покажи договор DOG-001` в `list_commerce_contracts`.
- Одновременно закрыт междоменный конфликт `CRM vs Contracts`: generic `карточка` не может активировать CRM read-only контур поверх `/commerce/contracts`.
- `contracts-routing-eval-corpus.json` добавлен в общий `pnpm gate:routing:primary-slices`; gate подтверждает уже семь bounded slice.

[2026-03-20] Седьмой bounded slice `knowledge.base.query` включён
- `SemanticRouterService` получил новый bounded read-only slice `knowledge.base.query`; primary promotion ограничен route-space `/knowledge*`.
- Для knowledge-контуров принят route-priority подход: внутри `/knowledge/base` запросы по техкартам и другим доменам трактуются как `QueryKnowledge`, а не как cross-domain execution.
- Вне `/knowledge*` semantic-router не перехватывает knowledge-запросы в `primary`; сохраняется безопасный `shadow`, чтобы knowledge не расползался по междоменному routing.
- `collectToolIdentifiers()`, `buildDialogState()`, `resolveIntentFromCaseMemory()` и `RoutingCaseMemoryService.inferSliceId()` синхронизированы с новым slice.
- `knowledge-routing-eval-corpus.json` добавлен в общий `pnpm gate:routing:primary-slices`; gate подтверждает уже восемь bounded slice.

[2026-03-20] Восьмой bounded slice `crm.counterparty.lookup` включён
- `SemanticRouterService` получил новый bounded read-only slice `crm.counterparty.lookup` для `lookup_counterparty_by_inn`; primary promotion ограничен CRM route-space `/parties | /consulting/crm | /crm`.
- Закрыт баг смешения с CRM workspace-review: фразы `по ИНН` без цифр больше не утекают в `crm.account.workspace-review`, а идут в `crm.counterparty.lookup` с `clarify` по `inn`.
- `execution-adapter-heuristics.ts`, `AgentExecutionAdapterService` и `CrmAgent` синхронизированы под новый intent/tool (`LookupCounterpartyByInn`) с приоритетом semantic routing и fallback-добором `inn` из текста.
- Добавлен eval-corpus `crm-inn-lookup-routing-eval-corpus.json`; `pnpm gate:routing:primary-slices` подтверждает новый slice вместе с существующими девятью bounded read-only маршрутами.

[2026-03-20] Девятый bounded slice `contracts.ar-balance.review` включён
- `SemanticRouterService` получил новый bounded read-only slice `contracts.ar-balance.review` для `review_ar_balance`; primary promotion ограничен route-space `/commerce/contracts`.
- AR-контур выделен отдельно от `contracts.registry-review`: запросы по дебиторке больше не смешиваются с `list/review_commerce_contract`.
- Для нового slice включён deterministic `execute|clarify`: при наличии `invoiceId` идёт `GetArBalance`, при отсутствии — `clarify` с `requiredContextMissing = [invoiceId]`.
- `RoutingCaseMemoryService.inferSliceId()` и `AgentExecutionAdapterService.resolveContractsIntent()` синхронизированы под `contracts.ar-balance.review` и semantic-priority route.
- Добавлен eval-corpus `contracts-ar-balance-routing-eval-corpus.json`; `pnpm gate:routing:primary-slices` подтверждает уже десять bounded read-only slice.

[2026-03-15 08:40Z] Git Pull / Manual Repo Sync
- Запуск `git pull` для синхронизации локальной копии с `origin/main`.

[2026-03-15 09:15Z] RAI_EP SWOT Analysis
- Проведен SWOT-анализ системы RAI_EP на основе рыночного исследования (РФ/СНГ).
- Создан документ `RAI_EP_SWOT_ANALYSIS.md`.
- Зафиксированы ключевые преимущества (мультиагентность, детерминизм) и рыночные ниши (CFO-layer).

[2026-03-05 23:59Z] R3 Truthfulness Runtime Trigger
- Решена гонка `writeAiAuditEntry` vs `calculateTraceTruthfulness` (добавлен await).
- Удален фальшивый fallback `bsScorePct ?? 0` (заменен на честные 100).
- Зафиксирована семантика _replayMode_ -> truthfulness pipeline skipping.
- Написано 5 тестов `Truthfulness runtime pipeline`.
[2026-03-05 00:13Z] R3 Truthfulness - Revision A
- Исправлена гонка traceSummary.record -> updateQuality (добавлен await перед record).
- Тест ordering доработан проверкой record -> audit -> updateQuality.
- Семантика replayMode стала честным read-only: отключены record и auditCreateSideEffects.

[2026-03-06] Rapeseed Grand Synthesis
- Успешно завершен кросс-анализ 5 документов-исследований по экономике и агрономии рапса в РФ.
- Создан финальный файл `GRAND_SYNTHESIS_FINAL.md` со строгой разметкой фактов, гипотез, конфликтов, с рейтингами консенсуса.
- TL;DR содержит 15 ключевых выводов, ТОП-10 проблем и ТОП-10 рычагов рентабельности.
- Все требования к структуре, терминологии и антигаллюцинационному контролю из промта выполнены.

[2026-03-07] Git Push
- Все локальные изменения добавлены в индекс.
- Закоммичены обновленные конфигурации агентов и документация.
- Выполнен git pull --rebase и git push в удаленный репозиторий.

[2026-03-07] Подъем API и Web
- Запущена команда `pnpm --filter api --filter web dev` для локальной разработки.
- Процессы api и web работают в фоне.

[2026-03-07] Git Push Master Plan
- Закомичен и запушен новый мастер-документ `RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`.
- Устаревшие доки перенесены в папку `Archive`.
- Изменения успешно залиты в `origin/main` (с предварительным `git pull --rebase`).

[2026-03-07] RAI Agent Interaction Blueprint Closeout
- Закрыт Stage 2 interaction blueprint как реализованный канон.
- Unified `workWindows[]` protocol подтверждён для `agronomist`, `economist`, `knowledge`, `monitoring`.
- В backend введён единый contract-layer: `Focus / Intent / Required Context / UI Action`.
- `IntentRouter`, `Supervisor resume-path` и `ResponseComposer` переведены на общий contract source.
- Левый `AI Dock` переведён в IDE-подобную композицию: компактная шапка, история чатов, новый чат, упрощённый ритм.
- Legacy `widgets[]` мигрируются в typed windows; работают `context_*`, `structured_result`, `related_signals`, `comparison`.
- Добавлены window capabilities: `inline / panel / takeover`, `collapse / restore / close / pin`, parent/related graph.
- В интерфейс добавлен голосовой ввод с Web Speech API, автоотправкой и выбором языка распознавания.
- Truth-sync обновлён в `blueprint`, `master-plan`, `addendum`, `handoff`, `interagency index`, создан финальный closeout-report.

[2026-03-07] Memory Bank Sync Before Push
- Memory-bank синхронизирован перед git push по итогам полного пакета Stage 2 Agent Platform / Interaction Blueprint.
- Зафиксировано, что blueprint закрыт как `implemented canon`, а не как draft/vision-only документ.
- Подтверждён production-ready слой `clarification -> overlay -> auto-resume -> result windows`.
- Зафиксирована унификация UI shell: IDE-подобный `AI Dock`, история чатов, `Новый чат`, compact header, overlay-only агентные окна.
- Зафиксирован platform contract-layer для reference families и truth-sync по стратегиям, handoff и closeout-отчётам.

[2026-03-09 18:15Z] Final Git Push (Real one)
- Собираю всю эту хуйню (Front Office, Runtime Governance, миграции) и пушу в ветку `main`.
- Исправляю "бумажные" пуши предыдущих итераций.

[2026-03-09] Подъем API и Web
- Запущена команда `pnpm --filter api --filter web dev` для локальной разработки. Оба сервиса крутятся в фоне.

[2026-03-09] Front Office Agent Implementation
- Реализован `FrontOfficeAgent` в `apps/api` (сервис, тесты, инструменты).
- Обновлен `AgentRegistry` и конфигурации для поддержки Front Office.
- Добавлена документация: `RAI_FRONT_OFFICE_AGENT_CANON.md`, профиль агента, инструкции по энейблменту.
- Обновлены контракты взаимодействия и DTO для поддержки новых типов окон и интентов.
- Интегрированы `FrontOfficeTools` в общий реестр инструментов.

[2026-03-09] Agent Runtime Governance & Front Office Extensions
- Реализована система `Runtime Governance` для агентов (Prisma schema, миграции, read-model сервис).
- Добавлен контроллер и DTO для панели управления `Explainability`.
- Расширен `AgentConfigGuard` и `QualityAlertingService` для работы с новыми политиками управления.
- Реализованы расширения Front Office: `MASTER_PLAN`, `BACKLOG`, `USER_FLOWS` и контракты API.
- Обновлены тесты `SupervisorAgent`, `AgentRuntime` и реестра инструментов для поддержки новых сущностей.
- Запушен `RAI_AGENT_RUNTIME_GOVERNANCE.md` как основной канон управления жизненным циклом агентов.

[2026-03-11] Подъем API и Web
- Ебанул команду `pnpm --filter api --filter web dev` для локальной разработки.
- Процессы api и web хуярят в фоне (заметил пару TS ошибок в API из-за типизации Prisma, но хуйня, крутятся).

[2026-03-11] Подъем API, Web и Telegram Bot
- По просьбе юзера запустил заново `api` и `web` (после фиксов) вместе с `telegram-bot`.
- `pnpm --filter api --filter web run dev` и `pnpm --filter telegram-bot run start:dev` крутятся в фоне.

[2026-03-12 17:00Z] Audit Log Append-Only Hardening
- Добавлена миграция `20260312170000_audit_log_append_only_enforcement` для DB-level block на `UPDATE/DELETE` в `audit_logs`.
- Добавлен `AuditService` spec, который фиксирует create-only path и наличие tamper-evident metadata.
- Обновлены текущий delta-аудит, главный stabilization checklist и memory-bank, чтобы закрытие remediation не осталось только в коде.

[2026-03-12 18:10Z] Raw SQL Governance Phase 1
- Добавлены `scripts/raw-sql-governance.cjs` и `scripts/raw-sql-allowlist.json` для централизованного inventory/allowlist approved raw SQL paths.
- `scripts/invariant-gate.cjs` теперь печатает и проверяет raw SQL governance section в `warn/enforce`.
- Из operational scripts убраны `Prisma.$queryRawUnsafe/$executeRawUnsafe`: обновлены `scripts/backfill-outbox-companyid.cjs` и `scripts/verify-task-fsm-db.cjs`.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank по текущему статусу remediation.

[2026-03-12 21:43Z] Outbox Productionization — Scheduler Wiring
- В `apps/api/src/shared/outbox/outbox.relay.ts` включены bootstrap drain и cron scheduler wiring с env flags `OUTBOX_RELAY_ENABLED`, `OUTBOX_RELAY_SCHEDULE_ENABLED`, `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED`.
- Добавлены targeted tests на bootstrap/scheduler contract в `apps/api/src/shared/outbox/outbox.relay.spec.ts`.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы partial closeout по outbox productionization был виден как текущее состояние, а не скрывался в коде.

[2026-03-12 22:18Z] Memory Hygiene Scheduling
- В `apps/api/src/shared/memory/consolidation.worker.ts` включены cron scheduler paths для consolidation/pruning с env flags `MEMORY_HYGIENE_ENABLED`, `MEMORY_CONSOLIDATION_SCHEDULE_ENABLED`, `MEMORY_PRUNING_SCHEDULE_ENABLED`.
- Добавлен targeted spec `apps/api/src/shared/memory/consolidation.worker.spec.ts` на scheduler contract.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы partial closeout по memory hygiene был отражён как текущее состояние системы.

[2026-03-12 22:52Z] Memory Hygiene Observability
- Проверен и подтверждён memory hygiene snapshot в `apps/api/src/shared/invariants/invariant-metrics.controller.ts`.
- Подтверждён targeted spec `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts` (PASS), который фиксирует memory snapshot/alerts и Prometheus export.
- Синхронизированы baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы partial closeout по memory hygiene observability был отражён как source of truth.

[2026-03-12 23:07Z] Memory Hygiene Bootstrap Maintenance
- В `apps/api/src/shared/memory/consolidation.worker.ts` добавлены startup maintenance paths через `MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED` и `MEMORY_PRUNING_BOOTSTRAP_ENABLED`.
- `apps/api/src/shared/memory/consolidation.worker.spec.ts` расширен bootstrap contract tests; targeted jest PASS.
- Синхронизированы baseline audit, delta audit, stabilization checklist и memory-bank, чтобы bootstrap maintenance по memory hygiene не оставался только в коде.

[2026-03-12 23:39Z] Raw SQL Hardening Phase 2 — Memory Path
- `PrismaService.safeQueryRaw()/safeExecuteRaw()` расширены executor-aware режимом для transaction client.
- `apps/api/src/shared/memory/consolidation.worker.ts` и `apps/api/src/shared/memory/default-memory-adapter.service.ts` переведены с прямого raw SQL на safe wrappers.
- `scripts/raw-sql-allowlist.json` сужен: memory path удалён из approved direct raw SQL paths.
- Подтверждены `node scripts/raw-sql-governance.cjs --mode=enforce` и targeted jest для `consolidation.worker` + `memory-adapter`.

[2026-03-12 23:51Z] Broader Engram Lifecycle Scheduling
- `apps/api/src/shared/memory/engram-formation.worker.ts` переведён в bootstrap/scheduler lifecycle worker для engram formation и pruning.
- Добавлены env-config flags `MEMORY_ENGRAM_FORMATION_*`, `MEMORY_ENGRAM_PRUNING_*` и pruning thresholds `MEMORY_ENGRAM_PRUNING_MIN_WEIGHT`, `MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS`.
- Добавлен targeted spec `apps/api/src/shared/memory/engram-formation.worker.spec.ts`; bootstrap/scheduler wiring и pruning thresholds подтверждены.
- Синхронизированы baseline audit, delta audit, stabilization checklist и memory-bank, чтобы broader engram lifecycle closeout был отражён как текущий статус remediation.

[2026-03-12 23:59Z] Engram Lifecycle Observability
- `apps/api/src/shared/invariants/invariant-metrics.controller.ts` расширен L4 metrics/alerts для `latestEngramFormationAgeSeconds` и `prunableActiveEngramCount`.
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены `RAIMemoryEngramFormationStale` и `RAIMemoryPrunableActiveEngramsHigh`.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/INVARIANT_MATURITY_DASHBOARD_RU.md` и `docs/INVARIANT_SLO_POLICY_RU.md` синхронизированы с новым L4 observability contour.
- Подтверждён targeted spec `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts` (PASS).

[2026-03-12 12:02Z] Controlled Memory Backfill Policy
- В `apps/api/src/shared/memory/consolidation.worker.ts` и `apps/api/src/shared/memory/engram-formation.worker.ts` добавлены bounded bootstrap catch-up loops с `*_BOOTSTRAP_MAX_RUNS`.
- Targeted specs расширены на drain-until-empty и respect-max-runs поведение для S-tier и L4 lifecycle workers.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md` уточнён: triage memory alerts теперь включает проверку bootstrap backfill caps.
- Синхронизированы baseline audit, delta audit, stabilization checklist и memory-bank, чтобы controlled backfill policy не оставался только в коде.

[2026-03-12 12:19Z] Engram Lifecycle Throughput Visibility
- В `apps/api/src/shared/invariants/invariant-metrics.ts` добавлены counters `memory_engram_formations_total` и `memory_engram_pruned_total`, а `resetForTests()` обнуляет их между spec runs.
- `apps/api/src/shared/memory/engram.service.ts` теперь инкрементирует formation/pruning throughput counters; Prometheus export в `apps/api/src/shared/invariants/invariant-metrics.controller.ts` расширен метриками `invariant_memory_engram_formations_total` и `invariant_memory_engram_pruned_total`.
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлен alert `RAIMemoryEngramPruningStalled`, `docs/INVARIANT_ALERT_RUNBOOK_RU.md` синхронизирован с triage steps по stalled pruning.
- Подтверждены `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts src/shared/memory/engram.service.spec.ts`; статусные документы синхронизированы с новым L4 throughput contour.

[2026-03-12 12:39Z] Memory Lifecycle Operator Pause Windows
- В `apps/api/src/shared/memory/memory-lifecycle-control.util.ts` добавлен utility для time-boxed pause windows, а `ConsolidationWorker` и `EngramFormationWorker` теперь уважают `*_PAUSE_UNTIL` / `*_PAUSE_REASON` на scheduler/bootstrap path.
- Manual maintenance path оставлен доступным; scheduled/bootstrap skip логируется отдельно для `consolidation`, `pruning`, `engram formation`, `engram pruning`.
- `apps/api/src/shared/invariants/invariant-metrics.controller.ts` расширен pause flags и remaining-seconds gauges для всех четырёх lifecycle paths; `docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/INVARIANT_MATURITY_DASHBOARD_RU.md` и `docs/INVARIANT_SLO_POLICY_RU.md` синхронизированы с новым operator-control contour.
- Подтверждены `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts`; статусные документы обновлены.

[2026-03-12 12:58Z] Memory Lifecycle Error Budget View
- В `apps/api/src/shared/invariants/invariant-metrics.controller.ts` добавлены derived gauges `memory_engram_formation_budget_usage_ratio` и `memory_engram_pruning_budget_usage_ratio` как ранний L4 budget-usage contour.
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены burn-high alerts `RAIMemoryEngramFormationBudgetBurnHigh` и `RAIMemoryEngramPruningBudgetBurnHigh` с исключением pause-state.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/INVARIANT_MATURITY_DASHBOARD_RU.md`, `docs/INVARIANT_SLO_POLICY_RU.md`, baseline audit и checklist синхронизированы с новым early-warning contour.
- Подтверждён `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts`; remediation-state обновлён в memory-bank.

[2026-03-12 13:12Z] Memory Lifecycle Multi-Window Burn-Rate Escalation
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены `RAIMemoryEngramFormationBurnRateMultiWindow` и `RAIMemoryEngramPruningBurnRateMultiWindow` как sustained degradation contour по `6h/24h` окнам.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md` расширен процедурами для multi-window burn-rate escalation; `docs/INVARIANT_SLO_POLICY_RU.md` теперь отделяет `burn-high`, `multi-window burn-rate` и `hard breach`.
- Baseline audit, delta audit, checklist, maturity dashboard и memory-bank синхронизированы с новым escalation layer.
- YAML alert-rules validated, `invariant-gate` повторно пройден.

[2026-03-12 18:30Z] Tenant-Scoped Memory Manual Control Plane
- Добавлены `apps/api/src/shared/memory/memory-maintenance.service.ts`, `apps/api/src/shared/memory/dto/run-memory-maintenance.dto.ts` и guarded endpoint `POST /api/memory/maintenance/run` в `apps/api/src/shared/memory/memory.controller.ts`.
- Manual corrective action по `consolidation`, `pruning`, `engram formation`, `engram pruning` теперь выполняется только в tenant-scoped path; `ConsolidationWorker`, `EngramFormationWorker` и `EngramService.pruneEngrams()` поддерживают company-scoped runs.
- Введён audit trail `MEMORY_MAINTENANCE_RUN_COMPLETED` / `MEMORY_MAINTENANCE_RUN_FAILED`; runbook, checklist, baseline audit, delta audit и memory-bank синхронизированы с новым operator control-plane.
- Targeted jest по `memory-maintenance.service`, `memory.controller`, `consolidation.worker`, `engram-formation.worker`, `engram.service` подтверждён; полный `apps/api` `tsc --noEmit` остаётся заблокирован уже существующей ошибкой в `src/modules/health/health.controller.ts`.

[2026-03-12 19:05Z] Production-Grade Operational Control for Memory Lifecycle
- `MemoryMaintenanceService` доведён до полноценного tenant-scoped control-plane: playbook catalog, recommendations, audit-backed recent runs и endpoint `GET /api/memory/maintenance/control-plane`.
- Введён `MemoryAutoRemediationService`: scheduled automatic corrective action, cooldown policy, auto-eligible playbooks only и safety caps `MEMORY_AUTO_REMEDIATION_*`.
- `InvariantMetricsController` и Prometheus export расширены deeper lifecycle signals и automation counters: `memory_oldest_prunable_consolidated_age_seconds`, `memory_engram_formation_candidates`, `memory_oldest_engram_formation_candidate_age_seconds`, `invariant_memory_auto_remediations_total`, `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled`.
- `EngramFormationWorker` приведён к тому же candidate contour, что и observability/control-plane: техкарты с `generationMetadata.memoryLifecycle.engramFormed=true` больше не попадают в formation path.
- Обновлены baseline audit, delta audit, stabilization checklist, alert runbook, maturity dashboard, SLO policy и memory-bank, чтобы блок `production-grade operational control for memory lifecycle` был отмечен как закрытый.
- Подтверждены targeted jest для control-plane/automation/observability и `pnpm --filter api exec tsc --noEmit --pretty false`.

[2026-03-12 19:32Z] Broker-Native Outbox Transport
- `apps/api/src/shared/outbox/outbox-broker.publisher.ts` переведён на transport abstraction `http | redis_streams`; generic HTTP path больше не является единственным broker delivery path.
- Добавлен broker-native Redis Streams publish через `XADD` с env-configs `OUTBOX_BROKER_TRANSPORT`, `OUTBOX_BROKER_REDIS_STREAM_KEY`, `OUTBOX_BROKER_REDIS_STREAM_MAXLEN`, `OUTBOX_BROKER_REDIS_TENANT_PARTITIONING`.
- `apps/api/src/shared/outbox/outbox.relay.ts` теперь transport-aware по broker config hint; relay корректно валидирует transport-specific configuration before bootstrap.
- Обновлены baseline audit, delta audit, stabilization checklist, outbox replay runbook и memory-bank, чтобы тезис "outbox broker publisher всё ещё generic HTTP-only" был снят как устаревший.
- Подтверждены `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts` и `pnpm --filter api exec tsc --noEmit --pretty false`.

[2026-03-12 20:00Z] External Front-Office Route-Space Separation
- В API введён отдельный viewer-only namespace `apps/api/src/modules/front-office/front-office-external.controller.ts` с canonical path `/api/portal/front-office/*`; legacy internal operations остаются в `front-office.controller.ts`.
- В web введён canonical внешний portal route-space `/portal/front-office` и `/portal/front-office/threads/[threadKey]`; для `FRONT_OFFICE_USER` старые `/front-office` root/thread paths теперь работают как compatibility redirects.
- Onboarding переведён на новый внешний contour: `apps/api/src/shared/auth/front-office-auth.service.ts` теперь генерирует activation links на `/portal/front-office/activate`, а login/activate success redirects используют `apps/web/lib/front-office-routes.ts`.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы route-space debt по external front-office считался существенно сниженным, а остаток трактовался как legacy alias debt.
- Подтверждены `pnpm --filter api exec jest --runInBand src/modules/front-office/front-office-external.controller.spec.ts src/shared/auth/front-office-auth.service.spec.ts`, `pnpm --filter api exec tsc --noEmit --pretty false` и `pnpm --filter web exec tsc --noEmit --pretty false`.
- После финального добивания separation старые `/front-office/login|activate` переведены в redirect-only alias, а внутренний `apps/api/src/modules/front-office/front-office.controller.ts` больше не допускает `FRONT_OFFICE_USER` в `/api/front-office/*`; блок считается закрытым.

[2026-03-13 08:55Z] Massive Sync & Push
- Собираю в кучу все наработки за последние дни: Nvidia Qwen LLM integration, WORM S3 Compliance, Architecture Growth Governance, Outbox Evolution, Memory Lifecycle Control Plane и прочую годноту.
- Выполняю `git add .`, коммичу с матом и пушу в ремоут, как просил юзер.
- Репозиторий теперь в актуальном состоянии, всё пиздато.

[2026-03-14 07:02Z] Git Push
- Сделал `git add .`, забацал коммит на новые доки по агентам и чеклисты.
- Ебанул пуш в `main` удаленного репозитория, изменения залетели охуенно.
