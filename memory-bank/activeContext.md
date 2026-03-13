# Активный контекст RAI_EP

## Текущая задача (2026-03-12)
- [x] Введён `Architecture Growth Governance` как следующий слой после foundation remediation.
- [x] Выполнен первый практический boundary-refactor после ввода growth-governance: thread/transport/binding слой `front-office` вынесен в `apps/api/src/shared/front-office`.
- [x] Добавлены `FrontOfficeSharedModule`, `FrontOfficeThreadingService`, `FrontOfficeCommunicationRepository`, `FrontOfficeOutboundService`; `FrontOfficeDraftService` сокращён до domain orchestration.
- [x] `front-office-draft` уменьшен до `8` файлов и `4246` строк по `architecture-budget-gate` (было `10` файлов и `5684` строк).
- [x] Выполнен второй практический boundary-refactor: `rai-chat` interaction contracts вынесены в `apps/api/src/shared/rai-chat/agent-interaction-contracts.ts`.
- [x] В `apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts` оставлен re-export bridge; прямые импорты `supervisor/intent-router/response-composer/explainability` переведены на shared-path.
- [x] Выполнен третий практический boundary-refactor: `rai-chat.dto`, `rai-tools.types` и `rai-chat-widgets.types` вынесены в `apps/api/src/shared/rai-chat` с re-export bridge в старых путях.
- [x] Canonical imports для DTO/tool contracts переведены на shared-path в `shared/rai-chat`, `front-office-draft` и `explainability`.
- [x] Размер `rai-chat` по `architecture-budget-gate` поэтапно снижен с `34256` до `31316`, затем до `29605` строк.
- [x] Добавлены `scripts/architecture-budget-gate.cjs` и `scripts/architecture-budgets.json`: теперь контролируются размер `schema.prisma`, число top-level модулей и watch-list тяжёлых hotspots.
- [x] В `package.json` добавлены `pnpm gate:architecture` и `pnpm gate:architecture:enforce`; guideline зафиксирован в `docs/05_OPERATIONS/DEVELOPMENT_GUIDELINES/ARCHITECTURE_GROWTH_GUARDRAILS.md`.
- [x] `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md` и `memory-bank/progress.md` синхронизированы: module complexity переведён в `частично закрыто / growth-governance введён`.
- [x] Закрыт `Compliance-Grade WORM S3 Rollout` без возврата к auth/outbox потокам.
- [x] `apps/api/src/level-f/worm/worm-storage.service.ts` переведён в fail-closed режим для `s3_compatible|dual`: startup теперь проверяет `Versioning=Enabled`, `Object Lock=Enabled`, default retention `COMPLIANCE / Years / 7` и запрещает `filesystem` в `production` без явного override.
- [x] `scripts/setup-minio.ts` теперь поднимает `rai-audit-worm` bucket с `Object Lock` и default retention, а `pnpm storage:minio:setup` стал canonical bootstrap командой.
- [x] `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md`, `memory-bank/progress.md` и `docs/05_OPERATIONS/WORKFLOWS/WORM_S3_COMPLIANCE_ROLLOUT.md` синхронизированы с новым состоянием WORM/S3 контура.
- [x] Закрыт отдельный remediation-поток `Audit Log Immutability` без пересечения с текущим auth rollout.
- [x] Добавлена DB-level append-only защита для `audit_logs` через миграцию `packages/prisma-client/migrations/20260312170000_audit_log_append_only_enforcement/migration.sql`.
- [x] Добавлен `apps/api/src/shared/audit/audit.service.spec.ts` для фиксации create-only контракта и tamper-evident metadata на уровне сервиса.
- [x] Синхронизированы статусные артефакты: `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md`, `docs/FOUNDATION_STABILIZATION_CHECKLIST_RU.md`, `memory-bank/*`.
- [x] Закрыт `Raw SQL Governance Phase 1` без захода в auth rollout.
- [x] Добавлены `scripts/raw-sql-governance.cjs` и `scripts/raw-sql-allowlist.json`; inventory/gate проходит в `enforce` без review-required путей и без `Unsafe` usage.
- [x] Убраны `Prisma.$queryRawUnsafe/$executeRawUnsafe` из operational scripts `scripts/backfill-outbox-companyid.cjs` и `scripts/verify-task-fsm-db.cjs`.
- [x] Продолжен `Raw SQL Hardening Phase 2` без захода в auth rollout.
- [x] `PrismaService.safeQueryRaw()/safeExecuteRaw()` расширены executor-aware режимом для transaction client.
- [x] Прямой raw SQL убран из `apps/api/src/shared/memory/consolidation.worker.ts` и `apps/api/src/shared/memory/default-memory-adapter.service.ts`; allowlist сужен.
- [x] Обновлены baseline audit, delta audit, главный stabilization checklist и memory-bank по состоянию на 2026-03-12.
- [x] Частично закрыт `Outbox Productionization` без захода в auth rollout.
- [x] В `apps/api/src/shared/outbox/outbox.relay.ts` включены bootstrap drain и cron scheduler wiring через env flags `OUTBOX_RELAY_ENABLED`, `OUTBOX_RELAY_SCHEDULE_ENABLED`, `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED`.
- [x] Добавлены targeted tests на bootstrap/scheduler contract в `apps/api/src/shared/outbox/outbox.relay.spec.ts`.
- [x] Продвинут `Broker-Native Outbox Evolution` без захода в auth rollout.
- [x] `apps/api/src/shared/outbox/outbox-broker.publisher.ts` переведён на transport abstraction `http | redis_streams`; добавлены env-configs `OUTBOX_BROKER_TRANSPORT`, `OUTBOX_BROKER_REDIS_STREAM_KEY`, `OUTBOX_BROKER_REDIS_STREAM_MAXLEN`, `OUTBOX_BROKER_REDIS_TENANT_PARTITIONING`.
- [x] Введён broker-native Redis Streams publish path через `XADD` и optional tenant-partitioned stream keys; legacy HTTP path сохранён как backward-compatible fallback.
- [x] `apps/api/src/shared/outbox/outbox.relay.ts` теперь transport-aware по broker config hint, а targeted specs `apps/api/src/shared/outbox/outbox.relay.spec.ts` и `apps/api/src/shared/outbox/outbox-broker.publisher.spec.ts` проходят.
- [x] Закрыт `External Front-Office Route-Space Debt`.
- [x] В API введён viewer-only namespace `apps/api/src/modules/front-office/front-office-external.controller.ts` с canonical path `/api/portal/front-office/*`.
- [x] В web введён canonical внешний portal route-space `/portal/front-office` + `/portal/front-office/threads/[threadKey]`; onboarding и success redirects переведены на него через `apps/web/lib/front-office-routes.ts`.
- [x] Старые `/front-office/login|activate` переведены в redirect-only alias, а внутренний `apps/api/src/modules/front-office/front-office.controller.ts` больше не обслуживает `FRONT_OFFICE_USER`.
- [x] Частично закрыт `Memory Hygiene Scheduling` без захода в auth rollout.
- [x] В `apps/api/src/shared/memory/consolidation.worker.ts` включены cron scheduler paths для consolidation/pruning через `MEMORY_HYGIENE_ENABLED`, `MEMORY_CONSOLIDATION_SCHEDULE_ENABLED`, `MEMORY_PRUNING_SCHEDULE_ENABLED`.
- [x] Добавлены targeted tests на scheduler contract в `apps/api/src/shared/memory/consolidation.worker.spec.ts`.
- [x] Частично закрыт `Memory Hygiene Observability` без захода в auth rollout.
- [x] В `apps/api/src/shared/invariants/invariant-metrics.controller.ts` добавлен memory hygiene snapshot + Prometheus gauges для backlog/freshness/active engrams.
- [x] Alert/runbook контур отражён в `infra/monitoring/prometheus/invariant-alert-rules.yml` и `docs/INVARIANT_ALERT_RUNBOOK_RU.md`; targeted spec `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts` проходит.
- [x] Частично закрыт `Memory Hygiene Bootstrap Maintenance` без захода в auth rollout.
- [x] В `apps/api/src/shared/memory/consolidation.worker.ts` добавлены startup maintenance paths через `MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED` и `MEMORY_PRUNING_BOOTSTRAP_ENABLED`.
- [x] `apps/api/src/shared/memory/consolidation.worker.spec.ts` расширен bootstrap contract tests; scheduler и bootstrap path проходят совместно.
- [x] Частично закрыт `Broader Engram Lifecycle Scheduling` без захода в auth rollout.
- [x] В `apps/api/src/shared/memory/engram-formation.worker.ts` добавлены bootstrap/scheduler paths для engram formation и pruning через `MEMORY_ENGRAM_FORMATION_*` и `MEMORY_ENGRAM_PRUNING_*`.
- [x] Добавлен targeted spec `apps/api/src/shared/memory/engram-formation.worker.spec.ts` на lifecycle wiring и pruning thresholds.
- [x] Частично закрыт `Engram Lifecycle Observability` без захода в auth rollout.
- [x] В `apps/api/src/shared/invariants/invariant-metrics.controller.ts` добавлены L4 metrics/alerts для `latestEngramFormationAgeSeconds` и `prunableActiveEngramCount`.
- [x] Alert/runbook контур обновлён в `infra/monitoring/prometheus/invariant-alert-rules.yml` и `docs/INVARIANT_ALERT_RUNBOOK_RU.md`; targeted spec `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts` проходит.
- [x] Частично закрыт `Controlled Memory Backfill Policy` без захода в auth rollout.
- [x] В `apps/api/src/shared/memory/consolidation.worker.ts` и `apps/api/src/shared/memory/engram-formation.worker.ts` добавлены bounded bootstrap catch-up loops через `*_BOOTSTRAP_MAX_RUNS`.
- [x] Targeted specs расширены на drain-until-empty и respect-max-runs поведение для S-tier и L4 lifecycle workers.
- [x] Частично закрыт `Engram Lifecycle Throughput Visibility` без захода в auth rollout.
- [x] В `apps/api/src/shared/invariants/invariant-metrics.ts` и `apps/api/src/shared/memory/engram.service.ts` добавлены counters `memory_engram_formations_total` и `memory_engram_pruned_total` с Prometheus export через `apps/api/src/shared/invariants/invariant-metrics.controller.ts`.
- [x] В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлен alert `RAIMemoryEngramPruningStalled`; targeted specs `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts` и `apps/api/src/shared/memory/engram.service.spec.ts` проходят.
- [x] Частично закрыт `Memory Lifecycle Operator Pause Windows` без захода в auth rollout.
- [x] В `apps/api/src/shared/memory/consolidation.worker.ts` и `apps/api/src/shared/memory/engram-formation.worker.ts` добавлены time-boxed pause windows `*_PAUSE_UNTIL` / `*_PAUSE_REASON` для scheduler/bootstrap path, без блокировки manual maintenance path.
- [x] В `apps/api/src/shared/invariants/invariant-metrics.controller.ts` добавлены pause gauges и remaining-seconds export для `consolidation`, `pruning`, `engram formation`, `engram pruning`; targeted specs на workers и observability проходят.
- [x] Частично закрыт `Memory Lifecycle Error Budget View` без захода в auth rollout.
- [x] В `apps/api/src/shared/invariants/invariant-metrics.controller.ts` добавлены `memory_engram_formation_budget_usage_ratio` и `memory_engram_pruning_budget_usage_ratio` как ранний budget-usage contour до hard breach.
- [x] В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены `RAIMemoryEngramFormationBudgetBurnHigh` и `RAIMemoryEngramPruningBudgetBurnHigh`; runbook/SLO/dashboard синхронизированы под burn-high phase.
- [x] Частично закрыт `Memory Lifecycle Multi-Window Burn-Rate Escalation` без захода в auth rollout.
- [x] В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены `RAIMemoryEngramFormationBurnRateMultiWindow` и `RAIMemoryEngramPruningBurnRateMultiWindow` для sustained degradation по `6h/24h` окнам.
- [x] `docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/INVARIANT_SLO_POLICY_RU.md`, `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md` и memory-bank синхронизированы с новым escalation contour.
- [x] Частично закрыт `Tenant-Scoped Memory Manual Control Plane` без захода в auth rollout.
- [x] Добавлены `apps/api/src/shared/memory/memory-maintenance.service.ts`, `apps/api/src/shared/memory/dto/run-memory-maintenance.dto.ts` и endpoint `POST /api/memory/maintenance/run` в `apps/api/src/shared/memory/memory.controller.ts`.
- [x] Manual corrective action теперь идёт только в company-scoped path: `ConsolidationWorker`, `EngramFormationWorker` и `EngramService.pruneEngrams()` принимают tenant-scope для ручного maintenance run.
- [x] Добавлены targeted specs `apps/api/src/shared/memory/memory-maintenance.service.spec.ts` и `apps/api/src/shared/memory/memory.controller.spec.ts`; статусные артефакты синхронизированы.
- [x] Закрыт большой эпик `Production-Grade Operational Control for Memory Lifecycle` без пересечения с auth rollout.
- [x] Введён operator control-plane state `GET /api/memory/maintenance/control-plane`: snapshot, playbooks, recommendations, automation state и recent audit-backed runs.
- [x] Введён `apps/api/src/shared/memory/memory-auto-remediation.service.ts` с automatic corrective action, cooldown policy и safety caps `MEMORY_AUTO_REMEDIATION_*`.
- [x] `/api/invariants/metrics` и Prometheus export расширены deeper lifecycle signals: `memory_oldest_prunable_consolidated_age_seconds`, `memory_engram_formation_candidates`, `memory_oldest_engram_formation_candidate_age_seconds`, `invariant_memory_auto_remediations_total`, `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled`.
- [x] `apps/api/src/shared/memory/engram-formation.worker.ts` приведён к тому же candidate contour, что и observability/control-plane: уже сформированные `engramFormed=true` техкарты исключаются из formation path.
- [x] Delta audit, baseline audit, stabilization checklist, runbook, maturity dashboard, SLO policy и memory-bank синхронизированы с закрытием memory lifecycle operational control блока.

## Текущая задача (2026-03-11)
- [x] Исправление ебучего пиздеца с кодировкой (mojibake) после `git pull`. Какая-то падла запушила файлы в кривой кодировке.
- [x] Разрешение конфликтов — локальные изменения (stash) восстановлены, кодировка поправлена.
- [x] Запуск и проверка API/Web/TG. Всё взлетело, порты 4000, 3000, 4002 активны. Прод-режим (dist) в работе.
- [x] Проектирование `chief_agronomist` (Цифровой Мега-Агроном) — expert-tier роль, вшитая в ядро консалтинга. Полный профиль v1.1: Dual mode (Lightweight + Full PRO), энграмный контур, проактивность через алерты, ethical guardrail D+E.
- [x] **RAI Memory Architecture v2** — спроектирована 6-уровневая когнитивная система памяти: L1 Reactive → L2 Episodic → L3 Semantic → L4 Engrams → L5 Institutional → L6 Network. Документ: `docs/07_EXECUTION/MEMORY_SYSTEM/RAI_MEMORY_ARCHITECTURE_v2.md`.
- [x] **Реализация когнитивной памяти + Expert Agents (ALL PHASES DONE):**
    - Phase 1: Prisma Engram+SemanticFact, EngramService, WorkingMemoryService, ConsolidationWorker, EngramFormationWorker, MemoryFacade.
    - Phase 2: MemoryCoordinatorService parallel recall, SupervisorAgent → AgentMemoryContext.
    - Phase 3: ExpertInvocationEngine + ChiefAgronomistService (Lightweight tips + Full PRO expertise + Ethical guardrail).
    - Phase 4: SeasonalLoopService (End-of-season batch, Cross-partner sharing, Trust Score).
    - Phase 5.1-5.3: DataScientistService (Yield Prediction, Disease Risk, Cost Optimization, Seasonal Reports, Pattern Mining, Network Benchmarking, What-If Simulator).
    - Phase 5.4: FeatureStoreService + ModelRegistryService (ML Pipeline + A/B Testing Framework).
    - **Integration**: `ChiefAgronomistAgent` & `DataScientistAgent` registered in `AgentRegistryService` & `AgentExecutionAdapterService`.
    - **TypeScript 0 ошибок.** Архитектура "Expert-tier" полностью вшита в рантайм.
- [x] **Документация**: TDP BLOCK 4, чеклист, профили agentов, каталог, матрица ответственности, матрица связей обновлены.


## Созданные документы

### RAI_AI_SYSTEM_RESEARCH.md (Фаза 1)
- Полный анализ архитектуры RAI_EP
- 12 секций: обзор архитектуры, доменные модули, бэкенд-сервисы, event-driven компоненты, операционные потоки, точки интеграции AI, риски, ограничения, инварианты, оценка осуществимости мульти-агентной архитектуры, стратегия интеграции, архитектурное заключение
- Путь: `/root/RAI_EP/docs/RAI_AI_SYSTEM_RESEARCH.md`

### RAI_AI_SYSTEM_ARCHITECTURE.md (Фаза 2)
- Production-grade архитектурный документ мульти-агентной AI системы
- 14 секций + самоаудит: принципы (7 шт.), Swarm-структура, 5 типов агентов (Supervisor, Agro, Economist, Monitoring, Knowledge), runtime FSM (8 состояний), правила оркестрации (6 правил), Tool Registry (14 инструментов), event-driven AI (6 триггеров), трёхслойная память (рабочая/эпизодическая/институциональная), контроль стоимости (4 тира моделей), безопасность (4 слоя защиты), наблюдаемость (9 метрик), graceful degradation (4 уровня), Human-in-the-Loop (8 уровней автономности), дорожная карта (3 стадии: 4-6 + 6-10 + 10-16 недель)
- Путь: `/root/RAI_EP/docs/RAI_AI_SYSTEM_ARCHITECTURE.md`

## Ключевые архитектурные решения

1. **AI — советник, не авторитет** (P-01)
2. **Детерминированное ядро** — расчёты выполняются кодом, не LLM (P-02)
3. **Tool-gated access** — агенты не трогают БД напрямую (P-03)
4. **5 агентов** вместо «агентного зоопарка» (обосновано)
5. **3-стадийная дорожная карта** — итеративная эволюция

- **R5. Forensics Timeline Depth**: В процессе. Сегодня переходим к восстановлению глубокой причинной цепочки в Forensics.
  - Промт: [2026-03-06_a_rai-r5_trace-forensics-depth.md](file:///root/RAI_EP/interagency/prompts/2026-03-06_a_rai-r5_trace-forensics-depth.md)
  - Статус: В процессе (Step 3: Анализ текущей реализации timeline и topology).
- **СБОР И АНАЛИЗ ДАННЫХ**: Форматирование и структурирование результатов исследования проблематики рапса (Gemini Research).
  - Файлы: `CEMINI#1.md` (готово), `GEMINI#2.md` (в процессе).
- **В ОЖИДАНИИ**: Реакция техлида на ревью-паки R1-R3.

## 2026-03-07 — Stage 2 Interaction Blueprint закрыт

- Stage 2 interaction blueprint доведён до состояния `implemented canon`.
- Backend:
  - unified `agent interaction contracts`
  - contract-backed `IntentRouter`
  - contract-backed `clarificationResume`
  - contract-backed `clarification/result windows`
- Frontend:
  - IDE-like `AI Dock`
  - история чатов и `Новый чат`
  - unified overlay windows
  - `collapse / restore / close / pin`
  - `inline / panel / takeover`
  - voice input scaffold с выбором языка
- Reference families, подтверждённые live/runtime path:
  - `agronomist / tech_map_draft`
  - `economist / compute_plan_fact`
  - `knowledge / query_knowledge`
  - `monitoring / emit_alerts`
- Следующий слой после этого закрытия:
  - расширение platform contracts на future/non-canonical roles
  - platform-wide intent catalog beyond reference agents

## 2026-03-09 — Front Office & Runtime Governance Ready for Push

- **Front Office Agent**: Реализована система Threads и Handoffs для гибридного взаимодействия.
- **Runtime Governance**: Добавлен контроль жизненного цикла агентов (FROZEN/RETIRED) и manual overrides.
- **Telegram Workspace**: Реализован гибридный режим WebApp + Bot для менеджеров.
- **Push**: Завершён второй этап пуша (Front Office Threads + Agent Lifecycle).

## Текущее операционное состояние:
- Stage 2 Interaction Blueprint: **Confirmed**.
- Front Office Threads: **Implemented**.
- Agent Lifecycle Control: **Active**.
- Master Plan: **Updated**.
- Git Status: **Synced ✅ (2026-03-13 08:55)**
