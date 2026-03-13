# SYSTEM AUDIT DELTA — RAI_EP

**BASELINE AUDIT:** `RAI_EP_SYSTEM_AUDIT.md`  
**BASELINE DATE:** 2026-03-11  
**DELTA DATE:** 2026-03-12  
**PURPOSE:** зафиксировать расхождения между аудитом от 2026-03-11 и текущим состоянием кода после выполненных remediation-изменений.

---

## 1. КРАТКИЙ ВЫВОД

Аудит от 2026-03-11 по-прежнему полезен как **описание классов рисков**, но уже не является точным статусным документом.

На 2026-03-12:

- несколько audit-блокеров уже **закрыты или существенно снижены**;
- часть проблем остаётся **частично закрытой**: фундамент уже есть, но продакшен-контур ещё не доведён;
- ряд архитектурных рисков всё ещё **актуален** и требует целенаправленного устранения.

Главная причина расхождений: после аудита команда уже начала и продолжает реализацию remediation plan.

---

## 2. DELTA ПО КЛЮЧЕВЫМ ПУНКТАМ АУДИТА

| Область | Тезис аудита от 2026-03-11 | Статус на 2026-03-12 | Доказательство в коде | Остаточный риск |
| --- | --- | --- | --- | --- |
| Multi-tenancy middleware | Prisma middleware отсутствует | **Устарело / частично закрыто** | `apps/api/src/shared/prisma/prisma.service.ts`, `apps/api/src/shared/tenant-context/tenant-context.service.ts` | Модельная изоляция держится на allowlist tenant-scoped моделей |
| PostgreSQL RLS | RLS отсутствует | **Устарело / частично закрыто** | `packages/prisma-client/migrations/20260223000000_zero_trust_rls_hardening/migration.sql`, `packages/prisma-client/migrations/20260311173000_rls_memory_governance_hardening/migration.sql` | RLS есть, но нужно подтверждать покрытие новых таблиц при каждой миграции |
| Ledger DB constraints | Нет double-entry enforcement | **Устарело / закрыто по фундаменту** | `packages/prisma-client/migrations/20260215201500_ledger_db_enforcement_poc/migration.sql`, `packages/prisma-client/migrations/20260215213000_double_entry_symmetry_poc/migration.sql`, `apps/api/src/modules/finance-economy/economy/application/economy.service.ts` | Нужно удерживать контракт при новых финансовых сценариях |
| FSM на уровне БД | FSM зависит только от бизнес-логики | **Устарело / частично закрыто** | `packages/prisma-client/migrations/20260215193000_task_fsm_db_enforcement_poc/migration.sql`, `packages/prisma-client/migrations/20260311190000_fsm_lifecycle_db_guards/migration.sql` | DB-level graph есть не для всех жизненных циклов системы |
| Outbox idempotency | Слабая идемпотентность, нет защиты от дублей | **Логически закрыто / event-stream-native relay введён** | `apps/api/src/shared/outbox/outbox.relay.ts`, `apps/api/src/shared/outbox/outbox-broker.publisher.ts`, `apps/api/src/shared/outbox/outbox-wakeup.service.ts`, `apps/api/src/shared/outbox/outbox.service.ts`, `apps/api/src/shared/outbox/outbox.relay.spec.ts`, `apps/api/src/shared/outbox/outbox-broker.publisher.spec.ts`, `apps/api/src/shared/outbox/outbox.service.spec.ts`, `apps/api/src/shared/outbox/outbox-wakeup.service.spec.ts`, `packages/prisma-client/migrations/20260215235500_event_consumption_idempotency_store/migration.sql`, `packages/prisma-client/migrations/20260312193000_outbox_delivery_checkpoints/migration.sql` | Per-destination checkpointing, partial-delivery resume, Redis Streams transport, consumer-group provisioning, Redis Pub/Sub wakeup и producer-path wakeup hints уже введены; если позже понадобится Debezium/Kafka-class внешний CDC, это уже следующий infra-layer, а не незакрытый foundation-gap |
| Outbox polling / scaling | Нужно `SKIP LOCKED`, сейчас polling every second | **Логически закрыто / cron переведён в safety fallback** | `apps/api/src/shared/outbox/outbox.relay.ts`, `apps/api/src/shared/outbox/outbox-broker.publisher.ts`, `apps/api/src/shared/outbox/outbox-wakeup.service.ts`, `apps/api/src/shared/outbox/outbox.relay.spec.ts`, `apps/api/src/shared/outbox/outbox-broker.publisher.spec.ts` | `FOR UPDATE SKIP LOCKED`, batch-size control, stale-`PROCESSING` recovery, full-batch auto-drain continuation и Redis Pub/Sub wakeup уже убрали зависимость от cron-only polling; 1-second schedule остаётся как safety fallback, а не как единственный production-механизм |
| Rate limiting | Нет rate limiting для API/GraphQL | **Устарело / закрыто по базовому слою** | `apps/api/src/app.module.ts`, `apps/api/src/shared/guards/throttler.guard.ts` | Базовый rate limiting есть, но fine-grained policy можно усилить |
| Agent hard-stop | Нет hard-stop кроме текстового confirmation | **Устарело / частично закрыто** | `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/security/pending-action.service.ts`, `apps/api/src/modules/rai-chat/pending-actions.controller.ts` | Не все write-paths системы обязаны проходить через один governance gateway |
| Secrets / KMS / Vault | Нет реальной интеграции с Vault/KMS | **Логически закрыто / с единым secret-provider слоем** | `apps/api/src/level-f/crypto/hsm.service.ts`, `apps/api/src/shared/config/secrets.service.ts`, `apps/api/src/shared/config/secrets.module.ts`, `apps/api/src/shared/auth/auth.module.ts`, `apps/api/src/shared/auth/jwt.strategy.ts`, `apps/api/src/shared/s3/s3.service.ts`, `apps/api/src/shared/outbox/outbox-broker.publisher.ts`, `apps/api/src/modules/rai-chat/agent-platform/openrouter-gateway.service.ts`, `apps/api/src/modules/rai-chat/agent-platform/nvidia-gateway.service.ts`, `apps/api/src/modules/health/health.controller.ts` | `Vault Transit`, `kid` propagation, `*_FILE` loading и platform-wide `SecretsService` для `JWT`, `MinIO`, `INTERNAL_API_KEY`, `CORE_API_KEY`, broker/LLM токенов уже введены; остаток — это обычный config/env debt и будущие новые интеграции, а не незакрытый secret-gap |
| RBAC / ABAC middleware | Проверки выполняются вручную и неполно | **Логически закрыто / с точечными policy-долгами** | `apps/api/src/shared/auth/roles.guard.ts`, `apps/api/src/shared/auth/authorized.decorator.ts`, `apps/api/src/shared/auth/authorized-gql.decorator.ts`, `apps/api/src/shared/auth/rbac.constants.ts`, `apps/api/src/shared/auth/auth-boundary.decorator.ts`, `apps/api/src/shared/auth/internal-api-key.guard.ts`, `apps/api/src/modules/consulting/consulting-access.guard.ts`, `apps/api/src/modules/consulting/consulting.controller.ts`, `apps/api/src/modules/front-office/front-office.controller.ts`, `apps/api/src/modules/task/task.resolver.ts` | Ordinary tenant-user surface закрыт role-gate, специальные internal boundary формализованы через явные decorators/metadata, manual role-check в `consulting` вынесен в policy-guard; отдельные более глубокие domain-ABAC policy при желании можно усиливать дальше, но это уже не базовый audit-gap |
| External front-office auth boundary | Внешние пользователи контрагентов не отделены от обычных tenant users | **Закрыто** | `apps/api/src/shared/auth/front-office-auth.controller.ts`, `apps/api/src/shared/auth/front-office-auth.service.ts`, `apps/api/src/modules/front-office/front-office.controller.ts`, `apps/api/src/modules/front-office/front-office-external.controller.ts`, `apps/api/src/modules/front-office-draft/front-office-draft.service.ts`, `apps/web/app/(app)/portal/front-office/page.tsx`, `apps/web/app/(app)/portal/front-office/threads/[threadKey]/page.tsx`, `apps/web/app/(auth)/portal/front-office/login/page.tsx`, `apps/web/lib/front-office-routes.ts`, `apps/web/components/party-assets/parties/hub/tabs/PartyContactsTab.tsx` | Внешний пользователь вынесен в отдельные `/portal/front-office` и `/api/portal/front-office`; старые `/front-office/login|activate` стали redirect-only alias, а внутренний `/api/front-office/*` больше не обслуживает `FRONT_OFFICE_USER` |
| Audit logs immutability | Нет immutable storage для audit logs | **Логически закрыто / compliance-grade S3 path введён** | `apps/api/src/shared/audit/audit.service.ts`, `apps/api/src/shared/audit/audit-notarization.service.ts`, `apps/api/src/level-f/worm/worm-storage.service.ts`, `apps/api/src/shared/audit/audit.controller.ts`, `apps/api/src/modules/health/health.controller.ts`, `packages/prisma-client/migrations/20260312170000_audit_log_append_only_enforcement/migration.sql`, `packages/prisma-client/migrations/20260312201500_audit_notarization_worm_layer/migration.sql`, `apps/api/src/shared/audit/audit.service.spec.ts`, `apps/api/src/shared/audit/audit-notarization.service.spec.ts`, `apps/api/src/level-f/worm/worm-storage.service.spec.ts`, `scripts/setup-minio.ts`, `docs/05_OPERATIONS/WORKFLOWS/WORM_S3_COMPLIANCE_ROLLOUT.md` | `audit_logs` и `audit_notarization_records` уже append-only, proof вынесен во внешний WORM object, есть HSM-подписанный hash-chain, proof endpoint, health-readiness, fail-closed `production`-политика для `filesystem` и проверка `Object Lock`/default retention для `s3_compatible|dual`; фактический rollout в конкретное production-окружение теперь сводится к конфигурации и запуску bootstrap/runbook, а не к недостающему engineering-блоку |
| Raw SQL bypass | `$queryRaw` обходит типизацию и контур безопасности | **Логически закрыто / с одобренными исключениями** | `scripts/raw-sql-governance.cjs`, `scripts/raw-sql-allowlist.json`, `scripts/invariant-gate.cjs`, `apps/api/src/shared/prisma/prisma.service.ts`, `apps/api/src/shared/memory/consolidation.worker.ts`, `apps/api/src/shared/memory/default-memory-adapter.service.ts`, `scripts/backfill-outbox-companyid.cjs`, `scripts/verify-task-fsm-db.cjs` | Policy layer введён, `Unsafe`-варианты убраны, memory path переведён на safe wrappers; approved production raw SQL остаётся только в finance/outbox/vector-store и считается контролируемым исключением, а не незакрытой дырой |
| Engram pruning | Без регулярного прунинга память деградирует | **Логически закрыто / production-grade control-plane введён** | `apps/api/src/shared/memory/engram.service.ts`, `apps/api/src/shared/memory/engram.service.spec.ts`, `apps/api/src/shared/memory/engram-formation.worker.ts`, `apps/api/src/shared/memory/engram-formation.worker.spec.ts`, `apps/api/src/shared/memory/consolidation.worker.ts`, `apps/api/src/shared/memory/consolidation.worker.spec.ts`, `apps/api/src/shared/memory/memory-lifecycle-control.util.ts`, `apps/api/src/shared/memory/memory-maintenance.service.ts`, `apps/api/src/shared/memory/memory-auto-remediation.service.ts`, `apps/api/src/shared/invariants/invariant-metrics.ts`, `apps/api/src/shared/invariants/invariant-metrics.controller.ts`, `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts`, `infra/monitoring/prometheus/invariant-alert-rules.yml`, `docs/INVARIANT_ALERT_RUNBOOK_RU.md` | Scheduler, bootstrap recovery, observability, pause windows, error-budget, burn-rate escalation, tenant-scoped manual control-plane и auto-remediation уже введены; дальше возможен только следующий UX/operational layer, а не незакрытый foundation-gap |
| Prisma schema size | Схема почти 6000 строк | **Актуально** | `packages/prisma-client/schema.prisma` = 5958 строк | Высокая стоимость миграций, генерации клиента и ревью |
| Module complexity | 38+ модулей, высокий coupling | **Частично закрыто / growth-governance введён** | `apps/api/src/modules/` содержит 38 top-level доменных директорий, `packages/prisma-client/schema.prisma`, `scripts/architecture-budget-gate.cjs`, `scripts/architecture-budgets.json`, `docs/05_OPERATIONS/DEVELOPMENT_GUIDELINES/ARCHITECTURE_GROWTH_GUARDRAILS.md` | Сложность никуда не делась, но теперь есть явный budget-gate для `schema.prisma`, количества top-level модулей и тяжёлых hotspots; следующий шаг — уже реальный boundary refactor, а не слепой рост |

---

## 3. ЧТО МОЖНО СЧИТАТЬ УЖЕ ЗАКРЫТЫМ ИЛИ СУЩЕСТВЕННО СНИЖЕННЫМ

### 3.1 Tenant Isolation Foundation

В системе уже есть:

- `AsyncLocalStorage`-контекст тенанта;
- Prisma query extension с принудительным `companyId` для tenant-scoped моделей;
- session-level `set_config('app.current_company_id', ...)`;
- PostgreSQL RLS для большого числа tenant-таблиц;
- дополнительное RLS-hardening для memory/governance/agent-control таблиц.

Вывод: тезис аудита "изоляция только на фильтрах в коде, Prisma middleware отсутствует" больше не соответствует текущему коду.

### 3.2 Финансовые инварианты

В системе уже есть:

- idempotency enforcement для финансового ingestion path;
- ledger immutability trigger;
- double-entry symmetry validation trigger;
- panic перевод tenant в `READ_ONLY` при integrity violation;
- advisory lock и security-definer path для записи в ledger.

Вывод: аудит корректно поймал проблему как класс риска, но по состоянию на 2026-03-12 фундамент уже существенно усилен.

### 3.3 FSM Guards

На уровне БД уже реализованы:

- task FSM enforcement;
- lifecycle guards для `TechMap`, `HarvestPlan`, `BudgetPlan`, `Budget`.

Вывод: тезис "FSM целиком живёт в бизнес-логике" уже устарел.

### 3.4 Events / Outbox Integrity

Уже реализованы:

- `FOR UPDATE SKIP LOCKED` claim-паттерн;
- consumer idempotency store;
- retry / backoff / dead-letter metadata;
- event contract checks;
- ordering defer guard;
- bootstrap drain и cron-based scheduler wiring с feature flags.
- per-destination delivery checkpoints (`brokerDeliveredAt`, `localDeliveredAt`);
- broker-first delivery order для `dual`-режима;
- recovery зависших `PROCESSING` сообщений обратно в `PENDING`;
- production guard: в `production` дефолтный delivery mode теперь не `local_only`, а broker-required режим, и `local_only` требует явного override.
- broker-native Redis Streams publish path с optional consumer-group provisioning через `OUTBOX_BROKER_REDIS_CONSUMER_GROUPS`;
- Redis Pub/Sub wakeup-контур для relay через `OutboxWakeupService`, чтобы новые outbox-записи не ждали только следующую секунду cron;
- producer-path больше не пишет outbox-события разрозненно: `OutboxService.persistEvent()/persistPreparedEvents()` публикуют wakeup hint централизованно;
- relay теперь умеет продолжать drain немедленно, если был взят полный batch, вместо жёсткого ожидания следующего cron-тика.

Вывод: event-layer уже не является просто polling-based relay из baseline-аудита. В проекте теперь есть event-stream-native wakeup и broker-native stream topology; cron остаётся safety fallback, а не единственным механизмом движения очереди.

### 3.5 Agent Governance

Уже реализованы:

- runtime governance policy;
- budget deny/degrade;
- autonomy quarantine;
- human approval queue (`PendingAction`);
- explicit block на risky write-tools.

Вывод: тезис "кроме текстового confirmation hard-stop нет" больше не актуален для текущего agent-tool execution path.

### 3.6 Audit Log Append-Only Foundation

Для `audit_logs` теперь есть:

- tamper-evident подпись в `AuditService`;
- DB-level append-only enforcement через trigger block на `UPDATE/DELETE`;
- локальный service-level spec на create-only контракт и tamper-evident metadata.

Вывод: тезис аудита "audit log можно менять обычным UPDATE" больше не соответствует текущему фундаменту приложения.

### 3.7 Raw SQL Governance Phase 1 + Memory Path Hardening

Для raw SQL контура теперь есть:

- inventory/allowlist разрешённых raw SQL paths;
- отдельный governance script для учёта approved vs review-required usage;
- интеграция в `invariant-gate`;
- устранение `Unsafe`-вариантов в operational scripts;
- executor-aware `safeQueryRaw()/safeExecuteRaw()` в `PrismaService`;
- вынос memory path (`ConsolidationWorker`, `DefaultMemoryAdapter`) из прямого raw SQL в safe wrappers;
- сужение allowlist за счёт удаления прямых raw SQL вызовов из memory-контура.

Вывод: блок логически закрыт. Тезис "raw SQL живёт без централизованного policy-контура и размазан по обычным сервисам" уже неверен. Governance layer появился, memory path больше не использует raw SQL напрямую, `Unsafe=0`, `review_required=0`, а оставшийся raw SQL оформлен как контролируемые approved exceptions.

### 3.8 Memory Hygiene Scheduling & Bootstrap Maintenance

Для memory hygiene контура теперь есть:

- cron-based scheduler для регулярной консолидации S-tier памяти;
- cron-based scheduler для регулярного prune уже консолидированных interactions;
- bootstrap maintenance path при старте приложения для consolidation/pruning;
- feature flags для безопасного enable/disable scheduler path;
- отдельные bootstrap flags для безопасного enable/disable startup drain;
- targeted spec на scheduler contract.

Вывод: тезис "механизмы есть только как методы в коде без регулярного запуска и без startup recovery path" уже не полностью верен для S-tier memory hygiene path.

### 3.9 Memory Hygiene Observability

Для memory hygiene контура теперь есть:

- snapshot памяти в `/api/invariants/metrics`;
- Prometheus-export gauges по backlog/freshness/active engrams;
- пороговые alerts для stale consolidation и pruning backlog;
- runbook-процедуры на memory hygiene alerts;
- targeted spec на invariant metrics controller.

Вывод: тезис "деградация memory hygiene остаётся невидимой до ручного разбора БД" уже не соответствует текущему S-tier observability-контуру.

### 3.10 Engram Lifecycle Scheduling

Для broader engram lifecycle теперь есть:

- bootstrap path для L4 engram formation;
- cron-based scheduler для регулярного formation path;
- bootstrap и cron-based path для pruning неактивных/слабых engrams;
- env-config thresholds для pruning (`minWeight`, `maxInactiveDays`);
- targeted spec на lifecycle wiring.

Вывод: тезис "broader engram hygiene существует только как ручные методы без background wiring" уже не соответствует текущему memory lifecycle контуру.

### 3.11 Engram Lifecycle Observability

Для broader engram lifecycle теперь есть:

- Prometheus gauges по freshness последнего engram formation и объёму prune candidates;
- throughput counters `invariant_memory_engram_formations_total` и `invariant_memory_engram_pruned_total`;
- пороговые alerts для stale engram formation и роста prunable active engrams;
- stalled-pruning alert, который сигнализирует о наличии prune backlog без фактического pruning throughput;
- runbook-процедуры для triage по L4 lifecycle alerts;
- coverage в invariant metrics controller spec и отдельный service-level spec для `EngramService`.

Вывод: тезис "L4 engram lifecycle остаётся невидимым и диагностируется только по логам/БД вручную" уже не соответствует текущему observability-контуру. Теперь видны не только freshness/backlog gauges, но и базовый throughput formation/pruning.

### 3.12 Controlled Memory Backfill Policy

Для memory/engram lifecycle теперь есть:

- bounded bootstrap catch-up loops для consolidation/pruning;
- bounded bootstrap catch-up loops для engram formation/pruning;
- env-config limits `*_BOOTSTRAP_MAX_RUNS` для controlled recovery после простоя;
- stop-on-drain semantics, чтобы bootstrap catch-up не крутился бесконтрольно;
- targeted specs на drain-until-empty и respect-max-runs поведение.

Вывод: тезис "после длительного простоя recovery держится на одном случайном bootstrap run или ручном вмешательстве" уже не соответствует текущему bootstrap recovery-контуру.

### 3.13 Фундамент авторизации и широкое внедрение

Для authorization-контура теперь есть:

- единый `@Authorized(...)` для REST;
- единый `@AuthorizedGql(...)` для GraphQL;
- канонические role-groups в `rbac.constants.ts`;
- `RolesGuard`, который корректно работает и для HTTP, и для GraphQL-контекста;
- закрытие role-based gate для большинства приоритетных пользовательских surface.

Локальный срез по коду на текущий момент:

- найдено `53` controller/resolver surface;
- `48` из них уже имеют явный `@Roles(...)`, `@Authorized(...)` или `@AuthorizedGql(...)`;
- оставшиеся `5` surface относятся не к обычному tenant-user API, а к специальным boundary: `mTLS`, `InternalApiKeyGuard`, `health`.

Вывод: baseline-тезис аудита про массово непокрытый `RBAC` уже устарел для основного пользовательского API-контура. Специальные internal boundary и базовый policy/`ABAC` layer теперь тоже логически закрыты; дальше здесь возможен только следующий слой более глубокого domain-specific policy hardening.

### 3.14 Окна операторской паузы для memory lifecycle

Для memory/engram lifecycle теперь есть:

- time-boxed operator pause windows для `consolidation`, `pruning`, `engram formation`, `engram pruning`;
- отдельные env-controls `*_PAUSE_UNTIL` и `*_PAUSE_REASON` без необходимости грубо выключать весь memory hygiene contour;
- scheduler и bootstrap path уважают pause windows, но manual maintenance path остаётся доступным;
- snapshot `/api/invariants/metrics` и Prometheus export теперь показывают pause flags и remaining seconds;
- targeted specs на skip semantics для workers и observability export.

Вывод: тезис "оператор не может аккуратно заморозить часть memory lifecycle без полного disable всего background path" уже не соответствует текущему operational contour.

### 3.15 Memory Lifecycle Error Budget View

Для memory/engram lifecycle теперь есть:

- runtime/Prometheus gauges `memory_engram_formation_budget_usage_ratio` и `memory_engram_pruning_budget_usage_ratio`;
- early-warning alerts `RAIMemoryEngramFormationBudgetBurnHigh` и `RAIMemoryEngramPruningBudgetBurnHigh`;
- runbook-процедуры на burn-high state до перехода в hard breach;
- dashboard/SLO contour, который теперь показывает не только breach-состояния, но и фазу приближения к ним.

Вывод: открытый тезис "по L4 lifecycle видны только hard breach alerts, но нет раннего error-budget / burn-high сигнала" уже не соответствует текущему observability-контуру.

### 3.16 Multi-Window Burn-Rate Escalation

Для memory/engram lifecycle теперь есть:

- multi-window burn-rate alerts `RAIMemoryEngramFormationBurnRateMultiWindow` и `RAIMemoryEngramPruningBurnRateMultiWindow`;
- escalation-критерий не только по текущему budget usage, но и по sustained росту ratios в `6h` и `24h` окнах;
- отдельные runbook-процедуры для same-day maintenance до hard breach;
- явное разделение между `burn-high`, `burn-rate escalation` и `hard breach` фазами деградации.

Вывод: open item "у memory lifecycle есть только single-threshold warning, но нет sustained burn-rate escalation contour" уже не соответствует текущему observability-пакету.

### 3.17 Tenant-Scoped Memory Manual Control Plane

Для memory/engram lifecycle теперь есть:

- tenant-scoped manual control-plane endpoint `POST /api/memory/maintenance/run`;
- отдельный `MemoryMaintenanceService`, который выполняет controlled run по `consolidation`, `pruning`, `engram formation`, `engram pruning`;
- явный `maxRuns` cap и stop-on-drain semantics для manual corrective action;
- audit trail `MEMORY_MAINTENANCE_RUN_COMPLETED` / `MEMORY_MAINTENANCE_RUN_FAILED`;
- company-scoped manual execution path в `ConsolidationWorker`, `EngramFormationWorker` и `EngramService.pruneEngrams()`, без изменения глобального bootstrap/scheduler contour;
- targeted specs на controller/service и tenant-scope path.

Вывод: open item "у memory lifecycle нет operator-facing control plane поверх env-based pause windows" уже не соответствует текущему operational contour.

### 3.18 Broker-Native Outbox Transport

Для outbox relay теперь есть не только generic HTTP publisher, но и broker-native transport layer:

- `OutboxBrokerPublisher` переведён на transport abstraction `http | redis_streams`;
- broker-native path `redis_streams` пишет события напрямую в Redis Streams через `XADD`, а не через generic HTTP webhook;
- введены env-controls `OUTBOX_BROKER_TRANSPORT`, `OUTBOX_BROKER_REDIS_STREAM_KEY`, `OUTBOX_BROKER_REDIS_STREAM_MAXLEN`, `OUTBOX_BROKER_REDIS_TENANT_PARTITIONING`;
- relay validation теперь transport-aware и требует корректный config hint в зависимости от выбранного broker transport;
- появился rudimentary broker-native partitioning layer: optional tenant-partitioned Redis stream keys;
- legacy HTTP broker path сохранён как backward-compatible fallback, а targeted specs покрывают и relay-side validation, и broker publisher transport contract.

Вывод: тезис "broker publisher всё ещё только generic HTTP-based" уже не соответствует текущему коду. Broker-native transport, consumer-group provisioning и event-stream-native wakeup уже введены; если позже понадобится Debezium/Kafka-class внешний CDC, это будет уже следующим infra-layer, а не незакрытым foundation-gap.

### 3.19 Production-Grade Operational Control for Memory Lifecycle

Для memory/engram lifecycle теперь есть связанный production-grade operational contour, а не набор разрозненных feature flags:

- control-plane endpoint `GET /api/memory/maintenance/control-plane`, который отдаёт tenant-scoped snapshot, playbooks, recommendations, automation state и recent audit-backed runs;
- playbook catalog `consolidation_only`, `pruning_only`, `engram_formation_only`, `engram_pruning_only`, `s_tier_backlog_recovery`, `engram_lifecycle_recovery`, `full_memory_lifecycle_recovery` с bounded `defaultMaxRuns` / `maxAllowedRuns`;
- automated corrective action через `MemoryAutoRemediationService`: candidate discovery, auto-eligible playbooks only, cooldown policy, caps `maxCompaniesPerRun` / `maxPlaybooksPerCompany`, audit-backed execution path;
- deeper lifecycle signals в `/api/invariants/metrics` и Prometheus: `memory_oldest_prunable_consolidated_age_seconds`, `memory_engram_formation_candidates`, `memory_oldest_engram_formation_candidate_age_seconds`, `invariant_memory_auto_remediations_total`, `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled`;
- новые alert contours `RAIMemoryEngramFormationCandidatesStale` и `RAIMemoryAutoRemediationFailures`, поверх уже существующих burn-high / burn-rate / stalled-pruning сигналов;
- alignment между observability и runtime execution path: `EngramFormationWorker` теперь работает по тому же candidate contour, что и control-plane snapshot, исключая уже помеченные `engramFormed=true` техкарты;
- targeted specs на control-plane state, playbook execution, auto-remediation, deeper observability signals и candidate filter alignment.

Вывод: большой эпик `production-grade operational control for memory lifecycle` логически закрыт. Дальнейший operator UI поверх этого API-контура возможен как следующий UX-layer, но уже не является незавершённым foundation remediation.

### 3.20 External Front-Office Route-Space Separation

Архитектурный долг общего route-space для внешнего front-office контура существенно снижен:

- внешний viewer-контур вынесен в отдельный API namespace `portal/front-office` через `FrontOfficeExternalController`;
- canonical web portal вынесен в `/portal/front-office` и `/portal/front-office/threads/[threadKey]`, вместо жизни внутри общего `/front-office`;
- onboarding переведён на новый canonical path: activation links теперь указывают на `/portal/front-office/activate`, а login/success redirects ведут в новый portal route-space;
- старые `/front-office/login|activate` переведены в redirect-only alias на новый portal route-space;
- viewer API отделён от internal API не только namespace-контуром, но и policy-фактом: `/api/front-office/*` больше не обслуживает `FRONT_OFFICE_USER`.

Вывод: задача `External Front-Office Route-Space Debt` закрыта. Внешний contour вынесен из общего `front-office` route-space и больше не живёт во внутреннем API namespace.

### 3.21 Front-Office Draft Storage And Telegram Runtime Cleanup

Дополнительно в этом проходе закрыт ещё ряд front-office техдолгов:

- first-class draft storage введён в `packages/prisma-client/schema.prisma` через таблицы `rai_front_office_drafts` и `rai_front_office_committed`, а `FrontOfficeDraftRepository` переключён с generic `agro_event_*` storage на dedicated front-office persistence;
- API-side legacy Telegram ingress больше не участвует в product path front-office: `FrontOfficeDraftModule` и `IntegrityModule` переведены на `TelegramNotificationModule`, то есть в API остался notifier-layer, а не второй живой ingress runtime;
- self-service `request_access -> approve_user` flow в Telegram отключён; канонический доступ теперь снова строго invite-only через `front-office-auth` и CRM contact invite flow;
- `pendingFrontOfficeAction` удалён из bot session state; `Fix/Link` переведены на stateless команды `/fofix <draftId> ...` и `/folink <draftId> ...`;
- внешний portal thread page теперь использует reply/read contracts, а не остаётся статичной viewer-only витриной.

Вывод: блок `Front-Office runtime split + draft storage debt` существенно снижен и по основным пунктам закрыт. Остаток теперь уже не в foundation-gap, а в эволюции richer lifecycle/history и operator UX.

---

## 4. ОСТАТОЧНЫЕ ФОКУСЫ И ЭКСПЛУАТАЦИОННЫЙ СЛОЙ

### 4.1 Покрытие авторизации

Для обычного tenant-user API массовый `RBAC`-gap уже в основном закрыт:

- `RolesGuard` и `@Roles(...)` есть;
- поверх них введены единые `@Authorized(...)` и `@AuthorizedGql(...)` с каноническими role-groups;
- `RolesGuard` теперь работает и для GraphQL;
- приоритетные REST-контроллеры и GraphQL resolver-ы уже закрыты role-based gate.

Это означает, что baseline-тезис про массово неполный `RBAC` уже не соответствует текущему коду. Открытый вопрос стал заметно уже.

Текущий локальный срез по коду:

- найдено `53` controller/resolver surface;
- `48` из них уже имеют явный `@Roles(...)`, `@Authorized(...)` или `@AuthorizedGql(...)`;
- `5` surface остаются без такого role gate.

Основные доменные surface, где role-based gate уже есть:

- `commerce`, `consulting`, `tech-map`, `task`, `season`, `field-registry`, `field-observation`;
- `front-office`, включая отдельный viewer-scoped контур для `FRONT_OFFICE_USER`;
- `advisory`, `strategic`, `risk`, `exploration`, `rai-chat`, `rd`;
- `legal`, `gr`, `ofs`, `strategy-forecasts`, `crm`, `identity-registry`, `knowledge`;
- GraphQL resolver-ы: `task`, `season`, `technology-card`, `rapeseed`.

Оставшиеся `5` непокрытых surface:

- `apps/api/src/level-f/gateway/replay/replay.controller.ts`
- `apps/api/src/level-f/snapshot/snapshot.controller.ts`
- `apps/api/src/modules/adaptive-learning/adaptive-learning.controller.ts`
- `apps/api/src/modules/health/health.controller.ts`
- `apps/api/src/shared/auth/telegram-auth-internal.controller.ts`

Эти `5` surface не являются обычным tenant-user API:

- `replay` и `snapshot` закрыты `mTLS`;
- `adaptive-learning` и `telegram-auth-internal` закрыты `InternalApiKeyGuard`;
- `health` является техническим health-check endpoint.

Что уже закрыто в этом проходе:

- введены канонические role-groups в `apps/api/src/shared/auth/rbac.constants.ts`;
- введены единые декораторы `apps/api/src/shared/auth/authorized.decorator.ts` и `apps/api/src/shared/auth/authorized-gql.decorator.ts`;
- `RolesGuard` расширен на GraphQL-контекст;
- специальные internal boundary формализованы через явные metadata/decorators: `RequireMtls`, `RequireInternalApiKey`, `PublicHealthBoundary`;
- `InternalApiKeyGuard` переведён в fail-closed режим по boundary metadata;
- ручные `ensureStrategicAccess()` / `ensureManagementAccess()` убраны из `consulting.controller.ts` и заменены на `ConsultingAccessGuard`;
- закрыты приоритетные audit-surfaces: `commerce`, `consulting`, `tech-map`, `task`, `field-registry`, `field-observation`, `season`, `legal`, `gr`, `ofs`, `audit`, `invariants`, `identity-registry`, `knowledge`, `crm`, `rai-chat`, `strategic`, `risk`, `advisory`, `exploration`, `rd` и GraphQL resolver-ы;
- `front-office` разделён по ролям: внутренние операции отдельно, `FRONT_OFFICE_USER` допущен только в viewer-scoped thread path.

Вывод: блок `специальные internal boundary + базовый ABAC/policy layer` логически закрыт. Оставшийся следующий слой здесь уже не про незавершённый remediation, а про возможное дальнейшее усиление более глубоких domain-specific policy-check'ов.

### 4.1.1 Внешний контур Front-Office

После baseline-аудита введён отдельный контур для внешних пользователей контрагентов:

- отдельная роль `FRONT_OFFICE_USER`;
- invite-only onboarding;
- отдельные `auth/front-office/*` endpoint'ы;
- canonical активация по ссылке в `/portal/front-office/activate`;
- привязка пользователя к конкретному `Account`/контрагенту;
- запись статуса инвайта и активации в строку `ЛОПР`;
- отдельный canonical web route-space `/portal/front-office` для внешнего пользователя;
- отдельный viewer-only API namespace `/api/portal/front-office/*`.

Вывод:

- baseline-risk про "внешний пользователь как обычный аутентифицированный пользователь" уже существенно снижен;
- viewer-scoped thread access, reply и read-path теперь принудительно ограничены привязкой к контрагенту;
- внешний портал больше не живёт внутри общего `/front-office` route-space: он вынесен в `/portal/front-office`, а внутренний `/api/front-office/*` больше не обслуживает `FRONT_OFFICE_USER`;
- сам route-space debt здесь закрыт; отдельно остаётся только более широкий `RBAC coverage` по внутреннему API-контуру.

### 4.2 Outbox Productionization

Блок больше не является открытым foundation-gap и логически закрыт.

Что теперь реально есть:

- relay всё ещё сохраняет `cron` как safety fallback, но больше не зависит от него как от единственного механизма wakeup;
- новые записи в outbox публикуют `Redis Pub/Sub` wakeup hint через централизованный producer-path `OutboxService.persistEvent()/persistPreparedEvents()`;
- relay поднимает wakeup-listener и запускает drain почти сразу после появления новой записи;
- при полном batch relay сам продолжает drain без обязательного ожидания следующей секунды;
- broker-native `redis_streams` path теперь не просто пишет в stream, но и поднимает configured consumer groups;
- live self-test показал, что при `OUTBOX_RELAY_SCHEDULE_ENABLED=false` и `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED=false` сообщение ушло в `PROCESSED` примерно за `170ms`, то есть только за счёт wakeup-контура.

Остаток теперь уже не remediation-долг, а эволюционный выбор инфраструктуры:

- если позже понадобится Debezium/Kafka-class внешний CDC, это будет следующим уровнем platform architecture;
- текущий Redis Streams + Pub/Sub contour уже делает outbox event-driven и production-usable внутри текущего стека.

### 4.3 Raw SQL Governance

В проекте уже есть phase-1 governance:

- allowlist разрешённых raw SQL paths;
- report/enforce-ready inventory script;
- включение raw SQL inventory в `invariant-gate`;
- удаление `Unsafe`-вызовов из operational remediation scripts;
- memory path переведён на `PrismaService.safeQueryRaw()/safeExecuteRaw()`.

Практический вывод:

- блок логически закрыт как policy/control-layer;
- `Unsafe`-вызовов больше нет;
- `review_required=0`;
- remaining production raw SQL живёт только в approved paths и не считается открытой дырой.

Если захочется усиливать дальше, то это уже следующий слой hardening, а не незавершённый базовый remediation:

- перевести максимум remaining non-transactional вызовов на `PrismaService.safeQueryRaw()/safeExecuteRaw()`;
- по возможности сузить allowlist до transaction-bound и pgvector-only path;
- добавить CI enforcement как обязательный merge gate для новых raw SQL точек.

### 4.4 Secrets / HSM / Vault

Блок уже не является заглушкой и теперь логически закрыт как foundation remediation.

Практический вывод:

- `HsmService` теперь поддерживает реальный `Vault Transit` transport вместо `throw` в production-path;
- есть fail-fast bootstrap/readiness, auto-create ключа при явном разрешении, `kid` propagation в JWT header и append-only audit вокруг подписания;
- введён глобальный `SecretsService` / `SecretsModule` как единый provider-layer для high-risk secret paths;
- `AuditService`, `HsmService`, `JwtModule`, `JwtStrategy`, `S3Service`, `InternalApiKeyGuard`, `CustomThrottlerGuard`, `OutboxBrokerPublisher`, `TelegramAuthService`, `FrontOfficeAuthService`, `ProgressService`, `TelegramNotificationService`, `NvidiaGatewayService` и `OpenRouterGatewayService` теперь читают секреты через единый слой, а не через разрозненный `process.env`;
- для `JWT_SECRET`, `MINIO_*`, `CORE_API_KEY`, `OUTBOX_BROKER_AUTH_TOKEN`, `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`, `INTERNAL_API_KEY`, `AUDIT_SECRET`, `HSM_*` поддержан `*_FILE`, что делает контур пригодным для Docker/K8s secret mounts;
- `health` теперь проверяет и `HSM`, а не только БД/память/диск.

Итог:

- блок `Broader secrets centralization` логически закрыт;
- прямые runtime-чтения секретов через `process.env` из `apps/api/src` для `SECRET/TOKEN/PASSWORD/API_KEY` путей устранены;
- открытым остаётся уже не audit-gap по secret centralization, а обычный эксплуатационный долг: дисциплина добавления новых интеграций в `SecretsService`, а также возможный второй backend-провайдер (`AWS KMS` / `CloudHSM`) поверх уже введённого HSM abstraction.

### 4.5 Внешняя нотариализация audit log / WORM

Блок больше не является открытым audit-gap и логически закрыт не только по коду, но и по production-bootstrap слою.

Что теперь реально есть в системе:

- `AuditService` больше не пишет запись напрямую в БД, а проводит её через `AuditNotarizationService`;
- введена отдельная append-only таблица `audit_notarization_records`, связанная `1:1` с `audit_logs`;
- для каждой записи строится `entryHash -> chainHash` с `prevChainHash` на компанию;
- `chainHash` подписывается через `HsmService`;
- notarization proof сериализуется во внешний WORM object вне основной БД;
- `AnchorService.anchorHash(...)` выдаёт anchor receipt, который попадает и в proof-таблицу, и в WORM object;
- `GET /api/audit/logs/:id/proof` отдаёт доказательство нотариализации;
- `/api/health` теперь валидирует не только БД, но и `audit_notarization`, включая доступность последнего WORM object;
- `WormStorageService` для `s3_compatible|dual` теперь fail-closed проверяет `Versioning=Enabled`, `Object Lock=Enabled` и default retention `COMPLIANCE/Years/7` на bucket;
- `production` больше не может тихо остаться на `AUDIT_WORM_PROVIDER=filesystem` без явного `AUDIT_WORM_ALLOW_FILESYSTEM_IN_PRODUCTION=true`;
- `scripts/setup-minio.ts` теперь поднимает `rai-audit-worm` bucket с `Object Lock` и default retention, а rollout-процедура зафиксирована в `docs/05_OPERATIONS/WORKFLOWS/WORM_S3_COMPLIANCE_ROLLOUT.md`.

Локально контур подтверждён живым self-test:

- запись `SYSTEM_AUDIT_NOTARIZATION_SELFTEST_STABLE_PATH` успешно создана;
- WORM object записан по пути `/root/RAI_EP/var/audit-worm/audit-logs/default-rai-company/2026-03-12/2026-03-12T20:08:58.992Z_337c2c81-2627-4a77-aaaf-88595e20d83e_903f72c49b9f2f8d.json`;
- `health` сейчас отвечает `audit_notarization.status=up`;
- live self-test `WormStorageService` на локальном `MinIO` подтвердил `provider=s3_compatible`, `objectLock=enabled`, `versioning=enabled`, `defaultRetention=COMPLIANCE:Years:7`, запись доступна по `s3://rai-audit-worm/...`.

Итог:

- локальный `filesystem` provider остаётся допустимым только для dev/self-test;
- compliance-grade S3 contour уже введён и проверяется на старте;
- фактический rollout в конкретное production-окружение теперь является обычной эксплуатационной процедурой по runbook, а не незакрытым engineering-gap;
- если потребуется жёсткая привязка к конкретному внешнему `L1/DLT`, это уже следующий слой compliance-эволюции, а не незавершённый foundation remediation.

### 4.6 Архитектурный рост схемы и модулей

Блок полного архитектурного упрощения ещё не закрыт, но больше не является “слепой зоной”.

Что теперь реально есть:

- введён отдельный growth-gate `scripts/architecture-budget-gate.cjs`;
- бюджеты зафиксированы в `scripts/architecture-budgets.json`;
- контролируются `schema.prisma` line-count, число top-level модулей и watch-list тяжёлых hotspots;
- для новых больших модулей появился не декоративный, а явный сигнал о том, что boundary уже вышел в опасную зону;
- developer-guideline зафиксирован в `docs/05_OPERATIONS/DEVELOPMENT_GUIDELINES/ARCHITECTURE_GROWTH_GUARDRAILS.md`.

Практический вывод:

- архитектурная сложность всё ещё остаётся реальной проблемой;
- но теперь рост этой сложности хотя бы инструментирован и не должен дальше происходить бесконтрольно;
- следующий инженерный шаг здесь — не ещё один guard-script, а целевой refactor самых тяжёлых boundary: прежде всего `rai-chat`, затем `tech-map` / `front-office-draft` / `consulting` / `finance-economy`.

## 5. ПРИОРИТЕТ УСТРАНЕНИЯ ОСТАВШИХСЯ РИСКОВ

Рекомендуемый порядок дальнейшей работы:

1. **Архитектурное упрощение схемы и модулей**
   - технический фундамент уже сильно усилен;
   - growth-governance для схемы и модулей уже введён;
   - следующий крупный выигрыш теперь лежит в реальном boundary-refactor самых тяжёлых модулей, а не в закрытии оставшихся foundation-gaps.

2. **Эволюционное сопровождение частично закрытых foundation-блоков**
   - `multi-tenancy`, `RLS`, `FSM`, `agent hard-stop` уже имеют фундамент, но требуют дисциплины при каждом новом модуле и migration path;
   - это уже не emergency-remediation, а постоянный engineering control-layer.

---

## 6. ЛОКАЛЬНАЯ ПРОВЕРКА, ВЫПОЛНЕННАЯ ПРИ СОСТАВЛЕНИИ DELTA

Были локально запущены и прошли:

- `pnpm -C packages/prisma-client exec prisma migrate deploy --schema schema.prisma`
- `pnpm -C packages/prisma-client exec prisma migrate status --schema schema.prisma` -> `Database schema is up to date`
- `pnpm prisma:generate`
- `pnpm prisma:build-client`
- `pnpm -C apps/api build`
- `pnpm -C apps/web build`
- `pnpm gate:architecture` -> growth-report показывает `schema.prisma=6107`, `top-level modules=38` и текущие hotspots `rai-chat`, `explainability`, `generative-engine`, `tech-map`, `front-office-draft`, `consulting`, `finance-economy`, `commerce`
- `pnpm gate:architecture:enforce` -> текущий budget проходит, но guard удерживает дальнейший рост выше согласованных лимитов
- `pnpm exec tsx scripts/setup-minio.ts` -> локально созданы/проверены `rai-model-registry`, `rai-datasets`, `rai-audit-worm`; для `rai-audit-worm` выставлен `Object Lock` default retention `COMPLIANCE/Years/7`
- `pnpm -C apps/api start:prod` -> локальный backend успешно поднялся на `http://0.0.0.0:4000/api`
- `curl -sS http://127.0.0.1:4000/api/health` -> `status=ok`, `database=up`, `memory_heap=up`, `storage=up`, `hsm=up`, `audit_notarization=up`
- `curl -sS http://127.0.0.1:4000/api/invariants/metrics` -> endpoint отвечает валидным `JSON` snapshot без немедленных критических сбоев bootstrap-пути
- outbox self-test с `OUTBOX_RELAY_SCHEDULE_ENABLED=false` и `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED=false` -> сообщение `finance.reconciliation.alert` перешло в `PROCESSED` через wakeup-контур без участия cron
- локальный self-test `AuditService.log({ action: "SYSTEM_AUDIT_NOTARIZATION_SELFTEST_STABLE_PATH", ... })` успешно создал внешний WORM object по пути `/root/RAI_EP/var/audit-worm/audit-logs/default-rai-company/2026-03-12/2026-03-12T20:08:58.992Z_337c2c81-2627-4a77-aaaf-88595e20d83e_903f72c49b9f2f8d.json`
- live self-test `WormStorageService` с `AUDIT_WORM_PROVIDER=s3_compatible` -> `provider=s3_compatible,bucket=rai-audit-worm,prefix=audit-worm,objectLock=enabled,versioning=enabled,defaultRetention=COMPLIANCE:Years:7`, запись `s3://rai-audit-worm/audit-worm/audit-logs/default-rai-company/selftest/...` доступна в локальном `MinIO`
- `src/shared/auth/auth-boundary.decorator.spec.ts`
- `src/shared/auth/internal-api-key.guard.spec.ts`
- `src/shared/config/secrets.service.spec.ts`
- `src/modules/consulting/consulting-access.guard.spec.ts`
- `src/level-f/crypto/hsm.service.spec.ts`
- `src/level-f/certification/jwt-minter.service.spec.ts`
- `src/shared/audit/audit.service.spec.ts`
- `src/shared/audit/audit-notarization.service.spec.ts`
- `src/level-f/worm/worm-storage.service.spec.ts`
- `src/shared/prisma/prisma-tenant-middleware.spec.ts`
- `src/shared/outbox/outbox.relay.spec.ts`
- `src/shared/outbox/outbox-broker.publisher.spec.ts`
- `src/shared/outbox/outbox.service.spec.ts`
- `src/shared/outbox/outbox-wakeup.service.spec.ts`
- `src/modules/finance-economy/economy/test/ledger-hardening.integration.spec.ts`
- `src/modules/front-office-draft/front-office-draft.service.spec.ts`
- `src/shared/auth/front-office-auth.service.spec.ts`
- `src/modules/front-office/front-office-external.controller.spec.ts`
- `pnpm --filter web exec tsc --noEmit --pretty false`
- `node scripts/raw-sql-governance.cjs --mode=enforce`
- `node scripts/invariant-gate.cjs --mode=warn`
- `src/shared/memory/consolidation.worker.spec.ts`
- `src/shared/invariants/invariant-metrics.controller.spec.ts`
- `src/shared/memory/memory-adapter.spec.ts`
- `src/shared/memory/engram-formation.worker.spec.ts`
- `src/shared/memory/engram.service.spec.ts`
- `src/shared/memory/memory-maintenance.service.spec.ts`
- `src/shared/memory/memory.controller.spec.ts`
- `src/shared/memory/memory-lifecycle-observability.service.spec.ts`
- `src/shared/memory/memory-auto-remediation.service.spec.ts`
- `pnpm --filter api exec tsc --noEmit`
- `src/modules/advisory/advisory.service.spec.ts`

Это не заменяет полную проверку готовности к production, но подтверждает, что часть remediation уже не только присутствует в коде, а и покрыта тестами.

---

## 7. РАБОЧИЙ ВЫВОД

Baseline-аудит от 2026-03-11 больше нельзя использовать как "текущее состояние системы".

Его нужно трактовать так:

- **базовая карта рисков** — полезна;
- **статусный отчёт на дату аудита** — уже устарел;
- **актуальный источник статуса remediation** — это этот delta-документ и последующие task-level изменения.

По состоянию на текущий код:

- основной tenant-user `RBAC` rollout практически доведён;
- специальные internal boundary и базовый policy/`ABAC` layer уже логически закрыты;
- outbox relay уже логически закрыт как event-stream-native контур: checkpoint delivery, stale-`PROCESSING` recovery, Redis Streams, consumer-group provisioning, Redis Pub/Sub wakeup и cron-only dependency убраны;
- блок `Secrets / HSM / broader secret centralization` логически закрыт: `Vault Transit` path, `kid` propagation, `*_FILE` secret loading и platform-wide `SecretsService` введены;
- блок `Audit log notarization / WORM` тоже логически закрыт как runtime/bootstrap слой: compliance-grade `s3_compatible` contour, `Object Lock` verification и fail-closed production-policy введены;
- архитектурная сложность теперь хотя бы поставлена под growth-control, но не устранена;
- главный следующий фокус уже логичнее смещать в сторону реального boundary-refactor тяжёлых модулей и постоянного discipline-control над частично закрытыми foundation-блоками.
