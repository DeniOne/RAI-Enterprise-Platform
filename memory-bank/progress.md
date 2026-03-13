# Progress Report - Prisma, Agro Domain & RAI Chat Integration

## 2026-03-12

81. **Architecture Growth Governance** [DONE]:
    *   Введён `scripts/architecture-budget-gate.cjs` как отдельный control-layer для роста архитектурной сложности.
    *   Бюджеты зафиксированы в `scripts/architecture-budgets.json`: отдельно контролируются `schema.prisma`, количество top-level модулей и watch-list тяжёлых hotspots (`rai-chat`, `explainability`, `generative-engine`, `tech-map`, `front-office-draft`, `consulting`, `finance-economy`, `commerce`).
    *   В корневой `package.json` добавлены команды `pnpm gate:architecture` и `pnpm gate:architecture:enforce`.
    *   Добавлен guideline `docs/05_OPERATIONS/DEVELOPMENT_GUIDELINES/ARCHITECTURE_GROWTH_GUARDRAILS.md`; `delta audit` синхронизирован: блок module complexity переведён из “просто актуально” в “частично закрыто / growth-governance введён”.
    *   Верификация: `pnpm gate:architecture` PASS; `pnpm gate:architecture:enforce` PASS; текущий отчёт фиксирует `schema.prisma=6107`, `top-level modules=38` и основные hotspots.

80. **Foundation Remediation — Compliance-Grade WORM S3 Rollout** [DONE]:
    *   `WormStorageService` переведён в fail-closed режим для `s3_compatible|dual`: на старте теперь проверяются `Versioning=Enabled`, `Object Lock=Enabled` и default retention `COMPLIANCE / Years / 7`, а `filesystem` в `production` запрещён без явного override.
    *   `WORM` upload path усилен до фактической retention verification: объект пишется в `S3-compatible` storage, затем retention читается и подтверждается; если контур не подтвердился, запись считается неуспешной.
    *   `scripts/setup-minio.ts` теперь поднимает `rai-audit-worm` bucket с `Object Lock` и default retention, а в корневой `package.json` добавлен запуск `pnpm storage:minio:setup`.
    *   `delta audit` и новый runbook `docs/05_OPERATIONS/WORKFLOWS/WORM_S3_COMPLIANCE_ROLLOUT.md` синхронизированы: WORM-блок переведён из “остался production rollout” в логически закрытый runtime/bootstrap слой.
    *   Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/level-f/worm/worm-storage.service.spec.ts src/shared/audit/audit-notarization.service.spec.ts src/shared/audit/audit.service.spec.ts` PASS; `pnpm exec tsx scripts/setup-minio.ts` PASS; live self-test `WormStorageService` подтвердил `provider=s3_compatible`, `objectLock=enabled`, `versioning=enabled`, `defaultRetention=COMPLIANCE:Years:7`, `accessible=true`.

79. **Foundation Remediation — Event-Stream-Native Outbox Evolution** [DONE]:
    *   `OutboxRelay` перестал быть cron-only контуром: введён `Redis Pub/Sub` wakeup через `OutboxWakeupService`, а scheduler теперь играет роль safety fallback, а не единственного production-механизма движения очереди.
    *   Producer-path централизован через `OutboxService.persistEvent()` / `persistPreparedEvents()`: `task`, `consulting`, `economy`, `reconciliation` теперь после записи outbox публикуют wakeup hint без разрозненного прямого `outboxMessage.create/createMany`.
    *   `redis_streams` transport усилен до broker-native topology: `OutboxBrokerPublisher` теперь не только пишет в stream, но и поднимает configured consumer groups через `OUTBOX_BROKER_REDIS_CONSUMER_GROUPS`; relay логирует broker receipt и продолжает drain немедленно при полном batch.
    *   `delta audit` синхронизирован: outbox-блок переведён в логически закрытый как event-stream-native relay; если позже понадобится Debezium/Kafka-class внешний CDC, это уже следующий infra-layer, а не незакрытый foundation-gap.
    *   Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/outbox/outbox.service.spec.ts src/shared/outbox/outbox-wakeup.service.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts src/shared/outbox/outbox.relay.spec.ts` PASS; live self-test с `OUTBOX_RELAY_SCHEDULE_ENABLED=false` и `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED=false` перевёл outbox-сообщение в `PROCESSED` только через wakeup-контур.

78. **Foundation Remediation — Audit Log Notarization / WORM** [DONE]:
    *   `AuditService` переведён на create-only путь через `AuditNotarizationService`: каждая audit-запись теперь получает `entryHash`, company-scoped `chainHash`, HSM-подпись и отдельную proof-запись в `audit_notarization_records`.
    *   Введён `WormStorageService` / `WormModule` с внешним immutable storage вне основной БД: поддерживаются `filesystem`, `s3_compatible` и `dual`, а default path больше не зависит от `cwd` процесса и стабильно разрешается от корня workspace.
    *   Добавлены `GET /api/audit/logs/:id/proof` и `health`-readiness по `audit_notarization`; readiness теперь проверяет не только БД-запись proof, но и доступность последнего WORM object.
    *   `delta audit` синхронизирован: блок `Audit log notarization / WORM` переведён в логически закрытый по коду. Остаток теперь инфраструктурный: для production-retention уровня compliance нужно включить `AUDIT_WORM_PROVIDER=s3_compatible|dual` и object-lock bucket.
    *   Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/audit/audit.service.spec.ts src/shared/audit/audit-notarization.service.spec.ts src/level-f/worm/worm-storage.service.spec.ts src/level-f/crypto/hsm.service.spec.ts` PASS; `curl -s http://127.0.0.1:4000/api/health` -> `audit_notarization.status=up`; живой self-test создал внешний WORM object `/root/RAI_EP/var/audit-worm/audit-logs/default-rai-company/2026-03-12/2026-03-12T20:08:58.992Z_337c2c81-2627-4a77-aaaf-88595e20d83e_903f72c49b9f2f8d.json`.

77. **Foundation Remediation — External Front-Office Route-Space Separation** [DONE]:
    *   Введён отдельный viewer-only API namespace `portal/front-office` через `src/modules/front-office/front-office-external.controller.ts`; внешний контур больше не живёт только внутри общего `front-office.controller.ts`.
    *   Canonical web portal вынесен в `/portal/front-office` и `/portal/front-office/threads/[threadKey]`, а onboarding/success redirects и activation links переведены на новый route-space.
    *   Старые `/front-office/login|activate` переведены в redirect-only alias, а внутренний `/api/front-office/*` больше не обслуживает `FRONT_OFFICE_USER`.
    *   Обновлены baseline audit, delta audit, stabilization checklist и memory-bank: блок `External front-office auth boundary` переведён из `частично закрыто` в `закрыто`.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/modules/front-office/front-office-external.controller.spec.ts src/shared/auth/front-office-auth.service.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS; `pnpm --filter web exec tsc --noEmit --pretty false` PASS.

76. **Foundation Remediation — Broader Secrets Centralization** [DONE]:
    *   Введён глобальный `SecretsService` / `SecretsModule` как единый provider-layer поверх `resolveSecretValue()` и `*_FILE` secret mounts.
    *   На централизованный secret-read переведены `JWT`, `MinIO`, `INTERNAL_API_KEY`, `CORE_API_KEY`, `OUTBOX_BROKER_AUTH_TOKEN`, `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`, а также `AuditService` и `HsmService`.
    *   `JwtModule`, `JwtStrategy`, `S3Service`, `InternalApiKeyGuard`, `CustomThrottlerGuard`, `OutboxBrokerPublisher`, `TelegramAuthService`, `FrontOfficeAuthService`, `ProgressService`, `TelegramNotificationService`, `NvidiaGatewayService` и `OpenRouterGatewayService` больше не читают runtime-secrets напрямую из разрозненного `process.env`.
    *   `delta audit` синхронизирован: блок `Broader secrets centralization` переведён в логически закрытый, а остаток теперь трактуется как обычный config/env debt, а не как открытый audit-gap.
    *   Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/config/secrets.service.spec.ts src/shared/auth/internal-api-key.guard.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts src/shared/audit/audit.service.spec.ts src/level-f/crypto/hsm.service.spec.ts src/shared/auth/front-office-auth.service.spec.ts` PASS; `curl -s http://127.0.0.1:4000/api/health` -> `status=ok`; `curl -s http://127.0.0.1:4000/api/invariants/metrics` -> валидный `JSON`.

75. **Foundation Remediation — Broker-Native Outbox Transport** [DONE]:
    *   `OutboxBrokerPublisher` переведён на transport abstraction `http | redis_streams` вместо единственного generic HTTP webhook path.
    *   Введён broker-native Redis Streams publish path через `XADD`, safety env-configs `OUTBOX_BROKER_TRANSPORT`, `OUTBOX_BROKER_REDIS_STREAM_KEY`, `OUTBOX_BROKER_REDIS_STREAM_MAXLEN`, `OUTBOX_BROKER_REDIS_TENANT_PARTITIONING` и rudimentary tenant partitioning по stream key.
    *   `OutboxRelay` теперь transport-aware по broker config hint; legacy HTTP path сохранён как backward-compatible fallback.
    *   Обновлены baseline audit, delta audit, stabilization checklist, outbox replay runbook и memory-bank: тезис про "generic HTTP-only broker publisher" переведён в устаревший.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS.

74. **Foundation Remediation — Production-Grade Operational Control for Memory Lifecycle** [DONE]:
    *   `MemoryMaintenanceService` доведён до production-grade control-plane: playbook catalog, tenant-scoped recommendations, audit-backed recent runs и `GET /api/memory/maintenance/control-plane`.
    *   Введён `MemoryAutoRemediationService` с scheduled automatic corrective action, cooldown policy, auto-eligible playbooks only и safety caps `MEMORY_AUTO_REMEDIATION_*`.
    *   `InvariantMetricsController` и Prometheus export расширены deeper lifecycle signals и automation counters: `memory_oldest_prunable_consolidated_age_seconds`, `memory_engram_formation_candidates`, `memory_oldest_engram_formation_candidate_age_seconds`, `invariant_memory_auto_remediations_total`, `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled`.
    *   `EngramFormationWorker` переведён на тот же candidate contour, что и observability/control-plane: уже помеченные `generationMetadata.memoryLifecycle.engramFormed=true` техкарты исключаются из formation path.
    *   Обновлены baseline audit, delta audit, stabilization checklist, alert runbook, maturity dashboard, SLO policy и memory-bank: блок `production-grade operational control for memory lifecycle` переведён в closed.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/memory-maintenance.service.spec.ts src/shared/memory/memory.controller.spec.ts src/shared/memory/memory-lifecycle-observability.service.spec.ts src/shared/memory/memory-auto-remediation.service.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS.

73. **Foundation Remediation — Special Internal Boundaries + Consulting Policy Guard** [DONE]:
    *   Специальные внутренние boundary формализованы через явные decorators/metadata: `RequireMtls`, `RequireInternalApiKey`, `PublicHealthBoundary`.
    *   `InternalApiKeyGuard` переведён в fail-closed режим по boundary metadata и использует timing-safe compare; `adaptive-learning` и `telegram-auth-internal` переведены на единый decorator вместо разрозненного `UseGuards`.
    *   Ручные `ensureStrategicAccess()` / `ensureManagementAccess()` удалены из `ConsultingController` и заменены на `ConsultingAccessGuard` как централизованный policy-layer для strategic/management действий.
    *   `delta audit` и runtime-проверка синхронизированы: локальный `start:prod` успешен, `/api/health` отвечает `ok`.
    *   Верификация: `pnpm --filter api test -- --runInBand --silent src/shared/auth/auth-boundary.decorator.spec.ts src/shared/auth/internal-api-key.guard.spec.ts src/modules/consulting/consulting-access.guard.spec.ts` PASS, `pnpm -C apps/api build` PASS.

72. **Foundation Remediation — Tenant-Scoped Memory Manual Control Plane** [DONE]:
    *   Введён guarded endpoint `POST /api/memory/maintenance/run` и отдельный `MemoryMaintenanceService` для controlled corrective action по `consolidation`, `pruning`, `engram formation`, `engram pruning`.
    *   Manual path сделан tenant-safe: `ConsolidationWorker`, `EngramFormationWorker` и `EngramService.pruneEngrams()` теперь поддерживают company-scoped runs без изменения глобального scheduler/bootstrap contour.
    *   Добавлен audit trail `MEMORY_MAINTENANCE_RUN_COMPLETED` / `MEMORY_MAINTENANCE_RUN_FAILED`, а runbook/checklist/audit delta синхронизированы с новым operator control-plane.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/memory-maintenance.service.spec.ts src/shared/memory/memory.controller.spec.ts src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/memory/engram.service.spec.ts` PASS. `pnpm --filter api exec tsc --noEmit` остаётся заблокирован уже существующей несвязанной ошибкой в `src/modules/health/health.controller.ts`.

71. **Foundation Remediation — Memory Lifecycle Multi-Window Burn-Rate Escalation** [DONE]:
    *   В Prometheus alert-rules добавлены `RAIMemoryEngramFormationBurnRateMultiWindow` и `RAIMemoryEngramPruningBurnRateMultiWindow` как sustained degradation contour по `6h/24h` окнам.
    *   Runbook и SLO policy расширены: теперь есть явное разделение между `burn-high`, `multi-window burn-rate` и `hard breach`.
    *   Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard и memory-bank, чтобы новый escalation layer был отражён как текущий remediation-state.
    *   Верификация: `python3` + `PyYAML` load для `infra/monitoring/prometheus/invariant-alert-rules.yml` PASS, `node scripts/invariant-gate.cjs --mode=warn` PASS.

70. **Foundation Remediation — Memory Lifecycle Error Budget View** [DONE]:
    *   В `InvariantMetricsController` добавлены derived gauges `memory_engram_formation_budget_usage_ratio` и `memory_engram_pruning_budget_usage_ratio` поверх текущих L4 thresholds.
    *   В Prometheus alert-rules добавлены ранние burn-high сигналы `RAIMemoryEngramFormationBudgetBurnHigh` и `RAIMemoryEngramPruningBudgetBurnHigh`, а runbook/SLO/dashboard расширены под early-warning contour.
    *   Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы error-budget view был отражён как текущий remediation-state, а не оставался открытым пунктом.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.

69. **Foundation Remediation — Memory Lifecycle Operator Pause Windows** [DONE]:
    *   В `ConsolidationWorker` и `EngramFormationWorker` добавлены time-boxed operator pause windows `*_PAUSE_UNTIL` / `*_PAUSE_REASON` для scheduler/bootstrap path.
    *   Manual maintenance path сохранён доступным, а `/api/invariants/metrics` и Prometheus export расширены pause flags и remaining-seconds gauges для всех четырёх lifecycle paths.
    *   Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy, alert runbook и memory-bank, чтобы operator control был отражён как текущий remediation-state.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.

68. **Foundation Remediation — Engram Lifecycle Throughput Visibility** [DONE]:
    *   В `InvariantMetrics` и `EngramService` добавлены L4 throughput counters `memory_engram_formations_total` и `memory_engram_pruned_total`.
    *   Prometheus export расширен метриками `invariant_memory_engram_formations_total` и `invariant_memory_engram_pruned_total`, а в alert-rules добавлен `RAIMemoryEngramPruningStalled`.
    *   Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы throughput visibility был отражён как текущий remediation-state.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts src/shared/memory/engram.service.spec.ts` PASS.

67. **Foundation Remediation — Controlled Memory Backfill Policy** [DONE]:
    *   В `ConsolidationWorker` и `EngramFormationWorker` добавлены bounded bootstrap catch-up loops для controlled recovery после простоя.
    *   Введены env-config caps `MEMORY_CONSOLIDATION_BOOTSTRAP_MAX_RUNS`, `MEMORY_PRUNING_BOOTSTRAP_MAX_RUNS`, `MEMORY_ENGRAM_FORMATION_BOOTSTRAP_MAX_RUNS`, `MEMORY_ENGRAM_PRUNING_BOOTSTRAP_MAX_RUNS`.
    *   Targeted specs расширены на stop-on-drain и respect-max-runs поведение.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts` PASS.

66. **Foundation Remediation — Engram Lifecycle Observability** [DONE]:
    *   `InvariantMetricsController` расширен L4 metrics/alerts для `latestEngramFormationAgeSeconds` и `prunableActiveEngramCount`.
    *   Добавлены Prometheus alerts `RAIMemoryEngramFormationStale` и `RAIMemoryPrunableActiveEngramsHigh`, а также runbook-процедуры для их triage.
    *   Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы engram lifecycle observability был отражён как текущий remediation-state.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.

65. **Foundation Remediation — Broader Engram Lifecycle Scheduling** [DONE]:
    *   `EngramFormationWorker` переведён в background lifecycle worker с bootstrap/scheduler wiring для L4 engram formation и pruning.
    *   Добавлены env-config flags `MEMORY_ENGRAM_FORMATION_*`, `MEMORY_ENGRAM_PRUNING_*`, а также pruning thresholds `MEMORY_ENGRAM_PRUNING_MIN_WEIGHT` и `MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS`.
    *   Добавлен targeted spec `apps/api/src/shared/memory/engram-formation.worker.spec.ts` на bootstrap/scheduler contract и pruning thresholds.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/engram-formation.worker.spec.ts` PASS.

64. **Foundation Remediation — Raw SQL Hardening Phase 2 (Memory Path)** [DONE]:
    *   `PrismaService.safeQueryRaw()/safeExecuteRaw()` расширены executor-aware режимом для transaction client.
    *   `ConsolidationWorker` и `DefaultMemoryAdapter` переведены с прямого raw SQL на safe wrappers.
    *   `scripts/raw-sql-allowlist.json` сужен: memory path больше не требует отдельного approved raw SQL entry.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/memory-adapter.spec.ts` PASS, `node scripts/raw-sql-governance.cjs --mode=enforce` PASS.

63. **Foundation Remediation — Memory Hygiene Bootstrap Maintenance** [DONE]:
    *   В `ConsolidationWorker` добавлены startup maintenance paths для consolidation/pruning через `MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED` и `MEMORY_PRUNING_BOOTSTRAP_ENABLED`.
    *   S-tier memory hygiene теперь не зависит только от первого cron после рестарта: при старте приложения возможен controlled bootstrap drain.
    *   Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы bootstrap closeout был отражён как текущий статус remediation.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts` PASS.

62. **Foundation Remediation — Memory Hygiene Observability** [DONE]:
    *   В `InvariantMetricsController` добавлен memory hygiene snapshot в `/api/invariants/metrics` и Prometheus gauges для backlog/freshness/active engrams.
    *   Контур alerting/runbook отражён в `infra/monitoring/prometheus/invariant-alert-rules.yml` и `docs/INVARIANT_ALERT_RUNBOOK_RU.md`.
    *   Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы observability closeout был виден как текущий статус, а не скрывался в коде.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.

61. **Foundation Remediation — Memory Hygiene Scheduling** [DONE]:
    *   В `ConsolidationWorker` включены cron-based scheduler paths для регулярной консолидации и prune S-tier memory.
    *   Добавлены feature flags `MEMORY_HYGIENE_ENABLED`, `MEMORY_CONSOLIDATION_SCHEDULE_ENABLED`, `MEMORY_PRUNING_SCHEDULE_ENABLED`, а также cron overrides для безопасного rollout.
    *   Добавлен targeted spec `apps/api/src/shared/memory/consolidation.worker.spec.ts` на scheduler contract.
    *   Baseline audit, delta audit, stabilization checklist и memory-bank синхронизированы с новым статусом partial closeout по memory hygiene.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts` PASS.

60. **Foundation Remediation — Outbox Productionization (Scheduler Wiring)** [DONE]:
    *   В `OutboxRelay` включены bootstrap drain и cron-based scheduler wiring через `OUTBOX_RELAY_ENABLED`, `OUTBOX_RELAY_SCHEDULE_ENABLED`, `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED`.
    *   Manual `processOutbox()` path сохранён, но теперь relay больше не зависит от неявного внешнего вызова для базового фонового запуска.
    *   Добавлены targeted tests на bootstrap/scheduler contract в `apps/api/src/shared/outbox/outbox.relay.spec.ts`.
    *   Baseline audit, delta audit, stabilization checklist и memory-bank синхронизированы с новым статусом partial closeout по outbox productionization.
    *   Верификация: `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts` PASS.

59. **Foundation Remediation — Raw SQL Governance Phase 1** [DONE]:
    *   Добавлены `scripts/raw-sql-governance.cjs` и `scripts/raw-sql-allowlist.json` для inventory/allowlist approved raw SQL paths.
    *   `scripts/invariant-gate.cjs` теперь включает raw SQL governance section и умеет работать в `warn/enforce` режиме без декоративного bypass.
    *   Удалены `Prisma.$queryRawUnsafe/$executeRawUnsafe` из `scripts/backfill-outbox-companyid.cjs` и `scripts/verify-task-fsm-db.cjs`.
    *   Baseline audit, delta audit, stabilization checklist и memory-bank синхронизированы с новым статусом remediation.
    *   Верификация: `node scripts/raw-sql-governance.cjs --mode=enforce` PASS, `node scripts/invariant-gate.cjs --mode=warn` PASS.

58. **Foundation Remediation — Audit Log Immutability** [DONE]:
    *   Введён DB-level append-only enforcement для `audit_logs` через миграцию `20260312170000_audit_log_append_only_enforcement`.
    *   Триггер `trg_audit_logs_append_only` жёстко блокирует `UPDATE/DELETE`, переводя audit trail из "tamper-evident only" в "tamper-evident + append-only at DB layer".
    *   Добавлен `apps/api/src/shared/audit/audit.service.spec.ts`, который фиксирует create-only path и наличие `_tamperEvident` metadata.
    *   Обновлены текущие статусные документы: `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md`, `docs/FOUNDATION_STABILIZATION_CHECKLIST_RU.md`, `memory-bank/activeContext.md`, `memory-bank/TRACELOG.md`.
    *   Верификация: targeted jest для `AuditService`.

## 2026-03-07

51. **A_RAI S23 — Live API Smoke** [APPROVED]:
    *   Добавлен live HTTP smoke suite `apps/api/test/a_rai-live-api-smoke.spec.ts`, который поднимает реальный feature-module graph `RaiChatModule + ExplainabilityPanelModule` и ходит в него через `supertest`.
    *   Покрыт канонический Stage 2 API slice: `GET /api/rai/explainability/queue-pressure`, `GET /api/rai/incidents/feed`, `GET /api/rai/agents/config`, `POST /api/rai/agents/config/change-requests`, плюс negative case `POST /api/rai/agents/config -> 404`.
    *   Smoke вскрыл и помог закрыть реальные wiring gaps: `RaiChatModule -> MemoryModule`, `MemoryModule -> AuditModule`, export `AutonomyPolicyService`.
    *   Пункт readiness `Есть smoke tests на живые API маршруты` переведён в `[x]`.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles test/a_rai-live-api-smoke.spec.ts` PASS.

50. **A_RAI S22 — Queue & Backpressure Visibility** [APPROVED]:
    *   `AgentRuntimeService` теперь пишет per-instance live queue snapshots в `QueueMetricsService`, а `QueueMetricsService` агрегирует tenant-wide latest state по `queueName + instanceId` из persisted `PerformanceMetric`.
    *   Добавлен live API `GET /rai/explainability/queue-pressure`; `Control Tower` показывает runtime pressure, backlog depth, freshness и queue contour без synthetic fallback.
    *   Добавлен producer-side proof на multi-instance semantics: backlog не схлопывается до последнего snapshot одной ноды.
    *   Пункт readiness `Есть queue/backpressure visibility` переведён в `[x]`.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted API jest PASS, targeted web jest PASS.

49. **A_RAI S21 — Runtime Spine Integration Proof** [APPROVED]:
    *   Добавлен integration suite `runtime-spine.integration.spec.ts`, который гоняет реальный путь `Supervisor -> Runtime -> Registry/Governance/Budget/Policy -> Audit/Trace`.
    *   Доказаны три сценария: happy path, `budget deny` с persisted incident/audit/trace, и governed registry block path через effective runtime state.
    *   Пункт readiness `Есть integration tests на runtime spine` переведён в `[x]`.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` PASS.

48. **A_RAI S20 — Agent Configurator Closeout** [APPROVED]:
    *   `control-tower/agents` больше не строится вокруг `global/tenantOverrides + toggle`, а читает runtime-aware `agents[]` read model с `runtime.source`, `bindingsSource`, `tenantAccess`, `capabilities`, `tools` и `isActive`.
    *   Client contract больше не экспортирует configurator `toggle`, а legacy backend route `PATCH /rai/agents/config/toggle` удалён.
    *   Configurator surface оставляет только governed `createChangeRequest`; HTTP proof подтверждает effective registry-aware read model и `404` для старого toggle path.
    *   Claim `Agent Configurator существует как UI + API настройки агентов` переведён в `CONFIRMED`.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.

47. **A_RAI S19 — Quality Governance Loop** [APPROVED]:
    *   `ExplainabilityPanelService` теперь считает `Correction Rate` по decision-scoped persisted advisory feedback с дедупликацией по `traceId`, а не по декоративной или потенциально раздуваемой модели.
    *   `AutonomyPolicyService` форсирует `QUALITY_ALERT -> QUARANTINE` при активном `BS_DRIFT`, а runtime enforcement по-прежнему идёт через `RaiToolsRegistry`, без обхода через UI/config path.
    *   `IncidentOpsService` отдаёт lifecycle-aware governance counters/feed с breakdown по quality/autonomy/policy incidents.
    *   Claims `Quality & Evals Panel`, `Автономность регулируется по BS% и quality alerts`, `Governance counters и incidents feed реально живые` переведены в `CONFIRMED`.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.

46. **A_RAI S18 — Budget Controller Runtime** [APPROVED]:
    *   `BudgetControllerService` перестал быть боковым сервисом и теперь читает persisted `agentRegistry.maxTokens`, возвращая реальные runtime outcomes `ALLOW / DEGRADE / DENY`.
    *   `AgentRuntimeService` применяет budget decision до fan-out: `DEGRADE` режет execution set, `DENY` останавливает выполнение до вызова tools.
    *   `ResponseComposerService` и `SupervisorAgent` довозят `runtimeBudget` до response и `AiAuditEntry.metadata`.
    *   На degraded/denied path через `IncidentOpsService` пишутся budget incidents.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.

45. **A_RAI S17 — Control Tower Honesty** [APPROVED]:
    *   Persisted evidence trail доведён до честного контура `evidence -> audit -> forensics/dashboard`.
    *   `TruthfulnessEngineService` больше не рисует synthetic fallback для `BS%` и возвращает честные nullable/pending quality-метрики.
    *   `ExplainabilityPanelService` и `/control-tower` показывают `Acceptance Rate`, `BS%`, `Evidence Coverage`, `qualityKnown/pending` counters и `criticalPath`.
    *   `Correction Rate` честно оставлен как `null/N/A`, потому что отдельный live source ещё не инструментирован.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.

44. **A_RAI S16 — Eval Productionization** [APPROVED]:
    *   Добавлен persisted `EvalRun` и живая связь с `AgentConfigChangeRequest` через реальные Prisma relations и DB-level foreign keys.
    *   `GoldenTestRunnerService` усилен до run-level evidence: `corpusSummary`, `caseResults`, `verdictBasis`, явные verdicts `APPROVED / REVIEW_REQUIRED / ROLLBACK`.
    *   `AgentConfigGuardService` и `AgentPromptGovernanceService` теперь пишут и используют candidate-specific eval evidence как gate.
    *   Golden corpus расширен для канонических агентов.
    *   Верификация: `pnpm --filter @rai/prisma-client run db:generate` PASS, `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.

43. **A_RAI S15 — Registry Persisted Bindings** [APPROVED]:
    *   Введены persisted Prisma-модели `AgentCapabilityBinding` и `AgentToolBinding`, а `AgentRegistryService` теперь строит effective runtime bindings из БД.
    *   `AgentRuntimeConfigService` переведён на deny-by-default для governed tools без owner/binding; primary authority больше не идёт через `TOOL_RUNTIME_MAP`.
    *   `UpsertAgentConfigDto` получил explicit `tools`, а governed sync перестал автогенерировать tool bindings только из дефолтов роли.
    *   Persisted `agent -> tools/capabilities` mapping стал реальной authority-моделью для runtime и management path.
    *   Верификация: `pnpm --filter @rai/prisma-client run db:generate` PASS, `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.

42. **A_RAI S14 — Prompt Governance Closeout** [APPROVED]:
    *   Canonical control-plane contract переведён на `POST /rai/agents/config/change-requests` и `.../change-requests/:id/...`.
    *   Legacy direct-write path `POST /rai/agents/config` убран; controller-level HTTP proof подтверждает, что старый write path отсутствует.
    *   Добавлены controller-level проверки на create change request, degraded canary rollback outcome и tenant-bypass denial.
    *   Client contract `apps/web/lib/api.ts` и control-plane surface `control-tower/agents` переведены на governed semantics вместо direct CRUD-иллюзии.
    *   Claim `PromptChange RFC` переведён из `PARTIAL` в `CONFIRMED`.
    *   Верификация: `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.

41. **A_RAI S13 — Autonomy/Policy Incidents & Runbooks** [APPROVED]:
    *   `SystemIncident` расширен explicit lifecycle `status`; добавлены live autonomy/policy incident types.
    *   Добавлена persisted модель `IncidentRunbookExecution`.
    *   `RaiToolsRegistry` теперь пишет live incidents для `QUARANTINE`, `TOOL_FIRST` и `RiskPolicy` blocked critical actions.
    *   `AgentPromptGovernanceService` пишет live `PROMPT_CHANGE_ROLLBACK` incident.
    *   Реализован endpoint `POST /rai/incidents/:id/runbook` с исполняемыми actions `REQUIRE_HUMAN_REVIEW` и `ROLLBACK_CHANGE_REQUEST`.
    *   Governance feed/counters теперь учитывают autonomy/policy incidents отдельно и возвращают explicit incident status.
    *   Верификация: `pnpm prisma:generate` PASS, `pnpm prisma:build-client` PASS, `pnpm --dir apps/api exec tsc --noEmit` PASS, targeted jest PASS.

43. **A_RAI R12 — Prompt Governance Reality** [READY_FOR_REVIEW]:
    *   Добавлен persisted workflow `AgentConfigChangeRequest` для agent prompt/model/config changes.
    *   Реализован `AgentPromptGovernanceService` с обязательным путём `create change -> eval -> canary start -> canary review -> promote/rollback`.
    *   `POST /rai/agents/config` больше не пишет production config напрямую; production activation выполняется только через `promoteApprovedChange()`.
    *   Прямой bypass через `toggle(true)` заблокирован; enable требует governed workflow.
    *   `GoldenTestRunnerService` расширен до agent-aware режима: добавлены golden sets для `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`, eval привязан к реальному change candidate (`promptVersion`, `modelName`).
    *   В `CanaryService` добавлена rejection-rate evaluation для prompt/config canary path; degraded canary уводит workflow в rollback и quarantine outcome.
    *   Верификация: `pnpm prisma:generate` PASS, `pnpm prisma:build-client` PASS, `pnpm --dir apps/api exec tsc --noEmit` PASS, targeted jest PASS.

## 2026-03-07

42. **A_RAI R10 — Registry Domain Model** [APPROVED]:
    *   Добавлен `AgentRegistryService` как first-class доменный слой authority для агентов `agronomist`, `economist`, `knowledge`, `monitoring`.
    *   Registry теперь явно собирает `AgentDefinition`, effective runtime policy и `AgentTenantAccess` (`INHERITED` / `OVERRIDE` / `DENIED`).
    *   `AgentRuntimeConfigService` больше не читает `AgentConfiguration` напрямую; runtime решения идут через registry-domain layer.
    *   `AgentConfiguration` переведён в роль legacy storage / projection, а management API (`AgentManagementService`) теперь отдаёт доменную read model `agents`.
    *   Исправлены замечания техлида: убрано `catalog` auto-enable без persisted authority; `role` замкнут на канонический домен `agronomist|economist|knowledge|monitoring`.
    *   Верификация: `pnpm --dir apps/api exec tsc --noEmit` PASS; targeted jest PASS (26 tests); execution path подтверждает `agent_disabled` и `capability_denied`.

43. **A_RAI R12 — Prompt Governance Reality** [APPROVED]:
    *   Введён persisted safe-evolution workflow: `AgentConfigChangeRequest` + `AgentPromptGovernanceService` со state machine `change request -> eval -> canary -> promote/rollback`.
    *   Прямой production write через `POST /rai/agents/config` убран; `toggle(true)` и service-level bypass на запись production config заблокированы.
    *   `GoldenTestRunnerService` усилен до agent/candidate-aware eval logic: verdict теперь зависит от role, activation, prompt/model metadata, budget и capability/tool bindings, а не от одного `IntentRouter`.
    *   Верификация: `pnpm --dir apps/api exec tsc --noEmit` PASS; targeted jest PASS (15 tests).

## 2026-03-10

61. **Service Startup Verification (API/WEB/TG)** [DONE]:
    *   API (порт 4000), Web (порт 3000) и Telegram (порт 4002) подтверждены как запущенные.
    *   Процессы висят, порты слушаются, `pnpm dev` не требуется, так как всё уже и так пиздато работает.
58. **Chief Agronomist (Мега-Агроном) — Expert-Tier Agent Design** [DONE]:
    *   Спроектирован и документирован новый класс агента — expert-tier `chief_agronomist` (Цифровой Мега-Агроном).
    *   Создан полный профильный паспорт: `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CHIEF_AGRONOMIST.md` (v1.1.0).
    *   Архитектурное решение: Мега-Агроном находится **вне** стандартного orchestration spine, работает на PRO/Heavy моделях ИИ по запросу (on-demand).
    *   Введён новый класс ролей — expert-tier — отличный от канонических runtime-агентов и обычных template roles.
    *   Отношение к `agronomist`: иерархически выше, но архитектурно независим. `agronomist` — исполнитель рутины, `chief_agronomist` — стратегический эксперт.
    *   Связи: `marketer` (информационный feed) → `chief_agronomist` (экспертиза) → `knowledge` (прецедентная база) → `consulting` (кейсы партнёров).
    *   Определены 10 целевых intent-ов, 10 expert-tier tools, модельная стратегия и cost control.
    *   Обновлены: `INDEX.md`, `INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md` (матрица ответственности + матрица связей).
    *   **[v1.1]** Dual Operation Mode: Lightweight (фоновый, дешёвый, engram curator) + Full PRO (on-demand, тяжёлый).
    *   **[v1.1]** Энграмный контур: Мега-Агроном = главный потребитель И производитель агро-энграмм (Formation→Strengthening→Recall→Feedback).
    *   **[v1.1]** Проактивность: monitoring → alert → chief_agronomist Lightweight → мини-тип → человек → Full PRO (если нужно).
    *   **[v1.1]** Этический guardrail COMMERCIAL_TRANSPARENCY (модель D+E): ТОП-3 альтернативы, тег [ПАРТНЁР], наука > коммерция, performance-based commission.
    *   **[v1.1]** Кросс-партнёрские энграмы (сетевой эффект) + Engram-Backed Trust Score (для банков/страховых).

59. **Memory System: Cognitive Memory Architecture v2** [DONE — ALL PHASES 1-5.4]:
    *   Спроектирована и полностью реализована 6-уровневая когнитивная система памяти.
    *   **Implementation**: L1 Working Memory, L2 Episodic, L4 Engrams (Vector HNSW), L6 Network Effect / Trust Score.
    *   **Background Workers**: ConsolidationWorker, EngramFormationWorker.
    *   **Seasonal Loop**: SeasonalLoopService (batch processing, cross-partner knowledge share).
    *   **Expert Integration**: MemoryCoordinatorService + MemoryFacade + AgentMemoryContext.
    *   **TypeScript 0 ошибок.** Архитектура готова к работе с PRO-моделями.

60. **Expert-Tier Agents: Chief Agronomist & Data Scientist** [DONE — Phase 3-5 IMPLEMENTED]:
    *   Реализованы сервисы и агенты: `ChiefAgronomistAgent` & `DataScientistAgent`.
    *   **Chief Agronomist**: ExpertInvocationEngine (PRO-mode, cost control), Expert Opinion, Alert Tips, Ethical Guardrail.
    *   **Data Scientist**: Core Analytics, Feature Store, Model Registry (ML Pipeline), Yield Prediction, Disease Risk Model, Cost Optimization, A/B Testing.
    *   **Integration**: Полная интеграция в `AgentRegistryService` и `AgentExecutionAdapterService`.
    *   **Memory Integration**: Агенты используют все уровни памяти (L1-L6) для экспертных выводов.
    *   **Status**: Вшиты в рантайм, компилируются без ошибок.


52. **GIT PUSH Stage 2 & Front Office & Runtime Governance** [DONE]:
    *   Все локальные изменения по Stage 2 Interaction Blueprint, Front Office Agent и Runtime Governance (миграции Prisma, сервисы, контроллеры) запушены в мастер.
    *   Репозиторий синхронизирован.
    *   Добавлены новые гайдлайны по эволюции агентов и GAP-анализ по Control Tower.

53. **Front Office Threads & Handoffs Implementation** [DONE]:
    *   Реализована модель `FrontOfficeThread` и `FrontOfficeHandoff` в Prisma.
    *   Добавлен `FrontOfficeCommunicationRepository` и `FrontOfficeHandoffOrchestratorService`.
    *   Поддерживается перевод чата из режима "Agent Only" в "Manager Assisted".
    *   Верификация: tsc PASS, prisma migrations PASS.

54. **Agent Lifecycle Runtime Control** [DONE]:
    *   Реализован `AgentLifecycleControlService` для форсирования состояний FROZEN и RETIRED.
    *   Добавлена поддержка `agentLifecycleOverride` в runtime governance.
    *   Обновлен канон `RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md`.
    *   Верификация: unit tests PASS.

55. **Telegram Hybrid Manager Workspace** [DONE]:
    *   Добавлена поддержка Telegram WebApp для управления воркспейсом менеджера.
    *   Реализован `TelegramPollingConflictGuard` для безопасной работы бота в гибридном режиме.
    *   Внедрена авторизация `telegram-webapp` в `apps/web`.

56. **Application Services Startup** [DONE]:
    *   Подняты API (порт 4000) и Web (порт 3000) серверы через `pnpm dev`.
    *   Prisma client перегенерирован для обеспечения актуальности типов.

57. **Git Pull & Encoding Fix (P1.5)** [DONE]:
    *   Сделан `git pull origin main`. В мастере оказался лютый пиздец с кодировкой (mojibake).
    *   Локальные изменения были заначены (`git stash`).
    *   Конфликты разрешены в пользу сташа, кодировка восстановлена до человеческой.
    *   Все файлы из `docs/` и `apps/` приведены в порядок.
    *   Верификация: `grep` по "Р˜РќРЎРў" ничего не находит, русский текст читается.

## Status: Refactoring Tenant Isolation & Fixing Type Resolution

### Completed:
1.  **Schema Refactoring**:
    *   Renamed `tenantId` to `companyId` in `AgroEventDraft` and `AgroEventCommitted` for 10/10 tenant isolation compliance.
    *   Updated models to include relations to the `Company` model.
2.  **Prisma Client Regeneration**:
    *   Regenerated Prisma Client after schema changes.
    *   Confirmed `agroEventCommitted` exists in `generated-client/index.d.ts`.
3.  **PrismaService Modernization**:
    *   Implemented a **Transparent Proxy** in `PrismaService` constructor to automatically route all model delegates through the isolated `tenantClient`.
    *   Removed 70+ manual model getters.
    *   Updated `tenantScopedModels` to include Agro Event models.
4.  **Automation & Contracts**:
    *   Added `db:client` and `postinstall` scripts to root `package.json`.
    *   Created `docs/01_ARCHITECTURE/PRISMA_CLIENT_CONTRACT.md`.
5.  **IDE Fixes**:
    *   Created root `tsconfig.json` to resolve `@nestjs/common` and package paths for files in `docs/` and other non-app directories.
    *   Added path mapping for `@nestjs/*` to `apps/api/node_modules`.

6.  **RAI Chat Integration (P0.1)** ✅:
    *   Реализован эндпоинт `POST /api/rai/chat` в API с изоляцией тенентов.
    *   Веб-чат переключен на бэкенд, моки в Next.js заменены прокси.
    *   Unit-тесты пройдены (4/4).

7.  **Agro Draft→Commit (P0.3)** ✅:
    *   Добавлен боевой модуль `apps/api/src/modules/agro-events/*` с операциями draft/fix/link/confirm/commit.
    *   Tenant isolation: `companyId` берётся из security context, не из payload.
    *   Проверка MUST-gate: `apps/api/jest.agro-events.config.js` → PASS (4/4).

8.  **Telegram Bot → Agro API (P0.4)** ✅:
    *   Бот подключён к `/api/agro-events/*`: intake text/photo/voice → draft, кнопки ✅✏️🔗, callback `ag:<action>:<draftId>`, вызовы fix/link/confirm.
    *   Unit + smoke-скрипт пройдены. Ревью APPROVED. Живой e2e не прогнан — приёмка с риском.

9.  **AgroEscalation + controller loop (P0.5)** ✅:
    *   `AgroEscalationLoopService` подключён после commit в `agro-events`; пороги S3 (delayDays≥4), S4 (delayDays≥7); идемпотентность по eventId+metricKey.
    *   Unit 7/7, tenant из committed. Ревью APPROVED. Живой интеграционный прогон не прогнан.

10. **Typed tools registry (P1.1)** ✅:
    *   `RaiToolsRegistry` (joi, register/execute), 2 инструмента (echo_message, workspace_snapshot), типизированные DTO (toolCalls, suggestedActions, widgets[].payload Record<string, unknown>).
    *   Unit 4/4 (jest direct; pnpm test 137). Ревью APPROVED.

11. **WorkspaceContext (P0.2)** ✅:
    *   Канонический контракт `workspace-context.ts` (Zod) + store + паблишеры (FarmDetailsPage, TechMap active). AiChatStore передаёт context в POST /api/rai/chat; API- ## 2026-03-03 (Session Start)
- [x] Чтение текущего состояния проекта (INDEX.md, Checklist)
- [x] Ревью готовых отчетов (S4.1) [APPROVED]
- [x] Финализация S4.1 (INDEX, Report, MB) [DONE]
- [x] Ревью и финализация S5.1 (Memory Adapter) [DONE]
- [ ] Определение следующего шага по Stage 2 Plan [PENDING]
[x] Подготовить план создания промта `implementation_plan.md`
- [x] Создать файл промта `interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md`
- [x] Обновить `interagency/INDEX.md`
- [ ] Реализация и отчет S4.1 [ ]
- [ ] Уведомить пользователя
ская типизированная схема `widgets[]` v1.0 (API/Web). `RaiChatService` возвращает `DeviationList` и `TaskBacklog` виджеты. Ревью APPROVED (2026-03-02).

13. **Interagency Synchronization** ✅:
    *   Изучены и приняты к исполнению `ORCHESTRATOR PROMPT` и `STARTER PROMPT`.
    *   Установлен жесткий приоритет `interagency/` ворклоу.

14. **Agent Chat Memory (P1.3)** ✅:
    *   Решение AG-CHAT-MEMORY-001 ПРИНЯТО.
    *   Реализованы retrieve + append в RAI Chat; лимиты/timeout/fail-open, denylist секретов.
    *   Unit-тесты пройдены (5/5), изоляция проверена.

15. **Status Truth Sync (P1.4)** ✅:
    *   Решение AG-STATUS-TRUTH-001 ПРИНЯТО.
    *   Truth-sync для PROJECT_EXECUTION_CHECKLIST, FULL_PROJECT_WBS, TECHNICAL_DEVELOPMENT_PLAN.
    *   Evidence/команды проверки для P0/P1; полный проход docs/07_EXECUTION/* — backlog.
    *   Ревью APPROVED (2026-03-02).

16. **WorkspaceContext Expand (P2.1)** ✅:
    *   Решение AG-WORKSPACE-CONTEXT-EXPAND-001 ПРИНЯТО.
    *   Commerce contracts + consulting/execution/manager публикуют contract/operation refs, summaries, filters.
    *   Web-spec PASS; tenant isolation сохранён. Ревью APPROVED (2026-03-02).

17. **External Signals Advisory (P2.2)** ✅:
    *   Решение AG-EXTERNAL-SIGNALS-001 ПРИНЯТО.
    *   Реализован тонкий срез `signals -> advisory -> feedback -> memory append` в RAI Chat; explainability, feedback, episodic memory.
    *   Unit 8/8 PASS; tenant isolation сохранён. Ревью APPROVED (2026-03-02).

18. **AppShell (S1.1)** ✅:
    *   Решение AG-APP-SHELL-001 ПРИНЯТО.
    *   AppShell + LeftRaiChatDock, чат не размонтируется при навигации; история и Dock/Focus сохраняются.
    *   tsc + unit PASS; manual smoke не выполнен. Ревью APPROVED (2026-03-02).

20. **TopNav Navigation (S1.2)** ✅:
    *   Решение AG-S1-2-TOPNAV-001 ПРИНЯТО.
    *   Внедрена горизонтальная навигация (TopNav), удален Sidebar.
    *   Реализована доменная группировка меню (Урожай, CRM, Финансы, Коммерция, Настройки).
    *   Интегрирован визуальный отклик в RAI Output (авто-скролл и подсветка виджетов из мини-инбокса).
    *   Тесты Кодекса PASS (189/189). Ревью APPROVED (2026-03-03).
21. **TopNav / Role Switch Hotfix (S1.3)** ✅:
    *   Внеплановые UI-правки проведены через отдельный canonical hotfix-контур.
    *   `TopNav`: иконки вынесены в головное меню, убран дублирующий заголовок в dropdown, длинные названия нормализованы под двухстрочный перенос.
    *   `GovernanceBar`: роль оставлена только в верхней control panel, dropdown ролей переведён на устойчивое open-state без hover-gap.
    *   Верификация: `apps/web` tsc PASS, manual check PASS. Ревью APPROVED (2026-03-03).

    *   Верификация: web-spec PASS (5 suites / 11 tests), `apps/web` tsc PASS, `apps/api` controller spec PASS. Ревью APPROVED (2026-03-03).

22. **WorkspaceContext Load Rule (S2.2)** ✅:
    *   Внедрен "gatekeeper" слой в `useWorkspaceContextStore`.
    *   Реализована автоматическая обрезка (truncate) строк: title (160), subtitle (240), lastUserAction (200).
    *   Введен лимит на 10 `activeEntityRefs`, избыток отсекается.
    *   `filters` защищены от вложенных объектов (fail-safe + console.warn в dev).
    *   Верификация: юнит-тесты PASS (3/3), `apps/web` tsc PASS. Ревью APPROVED (2026-03-03).

19. **Software Factory Reinforcement** ✅:
    *   Ре-верифицированы и приняты `STARTER PROMPT` (DOC-ARH-GEN-175) и `REVIEW & FINALIZE PROMPT` (DOC-ARH-GEN-176).
    *   TECHLEAD готов к работе по канону.

### Pending / Current Issues:
*   IDE still showing red files in the screenshot despite TS Server restart.
    *   Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
    *   Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
    *   Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

23. **Chat API v1 Protocol (S3.1)** ✅:
    *   Формализован контракт `POST /api/rai/chat` (V1).
    *   `RaiChatResponseDto` расширен полями `toolCalls` (типизированный список выполненных инструментов) и `openUiToken`.
    *   Реализован возврат фактически исполненных инструментов из `RaiChatService`.
    *   Верификация: сервисные тесты PASS (проверка контракта, traceId, threadId), `apps/api` tsc PASS. Ревью APPROVED (2026-03-03).

24. **Typed Tool Calls / Forensic (S3.2)** ✅:
    *   Усилен «Закон типизированных вызовов» (LAW).
    *   Внедрено принудительное Forensic-логирование пэйлоадов всех инструментов в `RaiToolsRegistry`.
    *   Гарантировано использование `execute()` как единственного шлюза к домену.
    *   Верификация: юнит-тесты PASS (проверка логов при успехе/валидации/ошибке), `apps/api` tsc PASS. Ревью APPROVED (2026-03-03).

25. **Chat Widget Logic / Domain Bridge (S4.1)** [x]:
    *   План принят (ACCEPTED). Предстоит разделение логики- [x] S4.1 Реализация динамической логики виджетов
- [x] Ревью и финализация S4.1
.

### Pending / Current Issues:
*   IDE still showing red files in the screenshot despite TS Server restart.
*   Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
*   Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
*   Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

### Next Steps:
1.  Полный truth-sync проход по docs/07_EXECUTION/* (backlog).
145: 2.  Перейти к **3.2 Typed Tool Calls only (LAW)** — инспекция и типизация всех инструментов.
146: 
147: 26. **Software Factory Adoption Reinforcement (2026-03-03)** ✅:
148:     *   Повторно принят `ORCHESTRATOR PROMPT` (DOC-ARH-GEN-173).
149:     *   Подтверждено следование `interagency/` воркфлоу.
150:     *   Активирована языковая политика «Русский + мат».
27. **Memory Adapter Contract (S5.1)** ✅:
    *   Внедрен `MemoryAdapter` в `shared/memory`.
    *   Рефакторинг `RaiChatService` и `ExternalSignalsService` на использование адаптера.
    *   Верифицировано 10/10 тестов, изоляция тенантов сохранена.

28. **Memory Storage Canon (S5.2)** ✅:
    *   Сформирован канон хранения долговременной памяти `MEMORY_CANON.md` (AG-MEMORY-CANON-001).
    *   Определены 3 уровня (S-Tier, M-Tier, L-Tier) и принцип "Carcass + Flex".
    *   Изоляция `companyId` формально закреплена во всех слоях.

29. **Memory Schema Implementation (S5.3)** ✅:
    *   Добавлены модели `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` в Prisma.
    *   Сохранена старая модель `MemoryEntry` для обратной совместимости.
    *   Созданы DTO типы в `memory.types.ts` и соблюдена изоляция.

30. **CI/CD Stability (pnpm fix)** ✅:
    *   Устранён конфликт версий pnpm в GitHub Actions (`Multiple versions of pnpm specified`).
    *   Ворклоу переведены на авто-детект версии из `package.json`.
    *   Обновлён `pnpm/action-setup@v4`.

31. **Memory Adapter Bugfixes (S5.4)** ✅:
    *   `DefaultMemoryAdapter.appendInteraction` переведен на новую таблицу `MemoryInteraction`.
    *   `userId` прокинут из JWT через `RaiChatController` / `RaiChatService` / `ExternalSignalsService` в carcass памяти.
    *   Внедрена recursive JSON sanitization для `attrs.metadata` и `attrs.toolCalls` без обнуления всего payload.
    *   `embedding` пишется транзакционно через `create + raw vector update`; невалидные векторы отсекаются.
    *   Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.

32. **SupervisorAgent API Integration (Phase B closeout)** ✅:
    *   Создан `SupervisorAgent` как отдельный orchestration layer для `rai-chat`.
    *   `RaiChatService` превращен в thin facade над `SupervisorAgent`.
    *   Сохранены typed tools, widgets, memory, advisory и append-flow без ломки API-контракта.
    *   Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.

33. **Episodes/Profile Runtime Integration (S5.5)** ✅:
    *   `DefaultMemoryAdapter.getProfile/updateProfile` больше не заглушки и работают с `MemoryProfile`.
    *   `appendInteraction` теперь пишет компактный `MemoryEpisode` рядом с raw interaction.
    *   `SupervisorAgent` использует profile context в ответе и обновляет профиль после interaction.
    *   Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.

34. **Memory Observability Debug Panel (S5.6)** ✅:
    *   В `RaiChatResponseDto` добавлено поле `memoryUsed`.
    *   `SupervisorAgent` возвращает безопасный summary по episode/profile context.
    *   В web chat добавлена debug-плашка `Memory Used` для привилегированного режима.
    *   Верификация: `apps/api` tsc PASS, `apps/api` targeted jest PASS, `apps/web` store test PASS.

35. **Agent-First Sprint 1 P1 — Tools Registry Domain Bridge (2026-03-03)** ✅:
    *   `RaiToolsRegistry` расширен 4 боевыми инструментами: `compute_deviations`, `compute_plan_fact`, `emit_alerts`, `generate_tech_map_draft`.
    *   Typed payload/result контракты добавлены в `rai-tools.types.ts`; `companyId` только из `RaiToolActorContext`, никогда из payload.
    *   `generate_tech_map_draft` замкнут на `TechMapService.createDraftStub()` — создаёт DRAFT с правильным tenant-scope (TODO: полная генерация — Sprint TechMap Intake).
    *   В `SupervisorAgent` добавлен `detectIntent()` — keyword routing по 4 паттернам (отклонения, kpi/план-факт, алерты, техкарта).
    *   DI: `DeviationService`, `ConsultingService`, `AgroEscalationLoopService`, `TechMapService` подключены в `RaiChatModule`.
    *   `axios` добавлен в `apps/api/package.json` (runtime-блокер `HttpResilienceModule` устранён).
    *   Верификация: `apps/api` tsc PASS, unit 14/14 PASS, smoke curl PASS. Ревью APPROVED.

36. **Agent-First Sprint 1 P2 — Tests, E2E Smoke & Telegram Linking (2026-03-03)** ✅:
    *   Прогнаны unit-тесты на все 4 tool-маршрута и `detectIntent` — 14/14 PASS.
    *   Выполнены 4 live smoke-проверки через `POST /api/rai/chat`: все 4 тула подтверждены.
    *   `generate_tech_map_draft` создал реальную запись `TechMap` в БД (`status=DRAFT`, `companyId=default-rai-company`, `crop=rapeseed`).
    *   Telegram linking cascade проверен: `telegram.update.ts` поддерживает link-patch для `AgroEventDraft`, но Telegram→`/api/rai/chat` маршрута нет — зафиксировано в backlog.
    *   `PROJECT_EXECUTION_CHECKLIST.md` обновлён с truth-sync по Sprint 1.
    *   Верификация: unit 14/14 PASS, smoke 4/4 PASS, TechMap DRAFT в БД подтверждён. Ревью APPROVED.

37. **Techmap Prompt Synthesis (2026-03-03)** ✅:
    *   Синтезирован мета-промт для создания Техкарты на основе 6 AI-отчетов.
    *   Объединены требования из `Промт_Гранд_Синтез.md` и `Промт_синтез.md`.
    *   Добавлены строгие критерии экстракции (Блоки A-H) из оригинального `Промт для исследования`, чтобы исключить "воду" и саммари.

38. **TechMap Grand Synthesis — Полный Синтез 6 AI-исследований (2026-03-03)** ✅:
    *   Прочитаны все 6 источников: ChatGPT, ChatGPT#2, CLUADE, COMET, GEMINI, GROK.
    *   Создан `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` — 770 строк, 8 частей:

39. **TM POST-A: TechMapService Consolidation + Docs (2026-03-04)** ✅:
    *   После `ACCEPTED` исполнен план `interagency/plans/2026-03-04_tm-post-a_consolidation.md`.
    *   Методы `activate` и `createNextVersion` перенесены в доменный `apps/api/src/modules/tech-map/tech-map.service.ts` без изменения сигнатур.
    *   `ConsultingModule` переведён на `TechMapModule`; локальный `apps/api/src/modules/consulting/tech-map.service.ts` удалён.
    *   В `TechMapModule` добавлены `TechMapValidator` и `UnitNormalizationService` (providers/exports) для единого сервиса.
    *   Документация TM-POST.5 обновлена: `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts` + `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-services-api.tm4-tm5.md`.
        - Часть 1: Executive Summary (7 фундаментальных аксиом, консенсус всех источников)
        - Часть 2: Модель данных (15+ сущностей с JSON-схемами, enum-словари, Provenance/Confidence)
        - Часть 3: Методология расчётов (нормы высева, окна GDD, дозы удобрений, ЭПВ, AdaptiveRules, валидация)
        - Часть 4: Юридическая и операционная модель (Contract Core + Execution Layer, ChangeOrder, Evidence, DAG, матрица делегирования ИИ↔Человек)
        - Часть 5: Регионализация (3 профиля) + Экономика (бюджет, KPI, правила перерасхода)
        - Часть 6: Карта противоречий (7 конфликтов с архитектурными вердиктами)
        - Часть 7: 10 инженерных слепых зон (мульти-полевая оптимизация, склад, офлайн-режим и др.)
        - Часть 8: Мини-пример (10 операций для озимого рапса MARITIME_HUMID)
    *   Документ готов как технический базис для имплементации модуля TechMap в RAI EP.

39. **TechMap Implementation Master Checklist (2026-03-03)** ✅:
    *   Проведён полный аудит кодовой базы: найдены существующие `TechMap`, `MapStage`, `MapOperation`, `MapResource`, `ExecutionRecord`, `Field`, `Season`, `Rapeseed`, `AgronomicStrategy`, `GenerationRecord`, `DivergenceRecord`.
    *   Gap-анализ: ~60% сущностей из GRAND_SYNTHESIS покрыты, недостаёт `SoilProfile`, `RegionProfile`, `InputCatalog`, `CropZone`, `Evidence`, `ChangeOrder`, `AdaptiveRule`.
    *   Создан `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` — мастер-чеклист на 5 спринтов (TM-1..TM-5) + пост-консолидация.
    *   Создана директория `docs/00_STRATEGY/TECHMAP/SPRINTS/` для промтов кодеру.

40. **TechMap Sprint TM-1 — Data Foundation CLOSED (2026-03-03)** ✅:
    *   Добавлены 4 новые Prisma-модели: `SoilProfile` (L1639), `RegionProfile` (L1666), `InputCatalog` (L1691), `CropZone` (L1712).
    *   Добавлены 5 Prisma enums: `SoilGranulometricType`, `ClimateType`, `InputType`, `OperationType`, `ApplicationMethod`.
    *   Расширены существующие модели nullable-полями: `Field` (+slope/drainage/protectedZones), `TechMap` (+budgetCap/hash/cropZoneId), `MapOperation` (+BBCH-окна/dependencies/evidenceRequired), `MapResource` (+inputCatalogId/rates/applicationMethod).
    *   Созданы Zod DTO: `apps/api/src/modules/tech-map/dto/` (4 файла + 4 spec).
    *   Верификация: `prisma validate` ✅, `db push` ✅, `tsc --noEmit` ✅, 8/8 DTO-тестов ✅.
    *   Ревью Orchestrator: APPROVED. Pre-existing failures в 8 модулях (NestJS DI) подтверждены как не scope TM-1.
    *   Decision-ID: `AG-TM-DATA-001` (DECISIONS.log).
    *   TM-2 промт создан: `interagency/prompts/2026-03-03_tm-2_dag-validation.md`.

41. **TechMap Sprint TM-2 — DAG + Validation CLOSED (2026-03-03)**:
    *   Реализованы `DAGValidationService` (DFS + CPM критический путь), `TechMapValidationEngine` (7 классов ошибок: HARD_STOP/WARNING), `TankMixCompatibilityService`.
    *   Реализованы 3 pure-function калькулятора: `SeedingRateCalculator`, `FertilizerDoseCalculator`, `GDDWindowCalculator`.
    *   Добавлены в `TechMapService`: `validateTechMap()`, `validateDAG()`, `getCalculationContext()`.
    *   Тесты: validation/ 15/15 PASS, calculators/ 9/9 PASS, tech-map/ 56/56 PASS. tsc PASS.
    *   Decision-ID: `AG-TM-DAG-002`.

42. **TechMap Sprint TM-3 — Evidence + ChangeOrder CLOSED (2026-03-03)** ✅:
    *   Добавлены Prisma-модели: `Evidence`, `ChangeOrder`, `Approval` + 5 enums.
    *   Расширены `Company`, `TechMap`, `MapOperation` relation-полями. `PrismaService` обновлён tenant-列表ом.
    *   Реализованы: `EvidenceService` (attachEvidence, validateOperationCompletion, getByOperation) и `ChangeOrderService` (5 методов с routing по ролям + $transaction).
    *   Zod DTO: evidence, change-order, approval + 6 spec.
    *   Тесты: 5 suites / 16/16 PASS. prisma validate/db push/tsc PASS.
    *   Ревью Orchestrator: APPROVED. `calculateContingency` с nullable-дефолтом, append-only через транзакции, FSM не переписан.
    *   Decision-ID: `AG-TM-EV-003`.
    *   TM-3 промт: `interagency/prompts/2026-03-03_tm-3_evidence-changeorder.md`.

43. **TechMap Sprint TM-4 — Adaptive Rules + Regionalization CLOSED (2026-03-04)** ✅:
    *   Модели: `AdaptiveRule` (triggerType, condition/changeTemplate Json, isActive, lastEvaluatedAt), `HybridPhenologyModel` (gddToStage Json, baseTemp, companyId optional).
    *   Enums: `TriggerType` (WEATHER/NDVI/OBSERVATION/PHENOLOGY/PRICE), `TriggerOperator` (GT/GTE/LT/LTE/EQ/NOT_EQ).
    *   Сервисы: `TriggerEvaluationService` (pure `evaluateCondition` + `evaluateTriggers` + `applyTriggeredRule` → ChangeOrderService), `RegionProfileService` (3 climate profile sowing windows, suggestOperationTypes: CONTINENTAL_COLD→DESICCATION mandatory, MARITIME_HUMID→2×FUNGICIDE), `HybridPhenologyService` (GDD→BBCH prediction, tenant→global lookup).
    *   DTO: adaptive-rule, hybrid-phenology.
    *   Тесты: 17/17 адресных PASS (5 suites). Регрессия tech-map/: 22 suites / 75 tests PASS.
    *   Fix: опечатка `tecmhMap` в `tech-map.concurrency.spec.ts` исправлена.
    *   Decision-ID: `AG-TM-AR-004`.

44. **TechMap Sprint TM-5 — Economics + Contract Core CLOSED (2026-03-04)** ✅:
    *   Модель: `BudgetLine` (TechMap-scoped: techMapId, category, plannedCost, actualCost, tolerancePct). Enum: `BudgetCategory` (9 категорий).
    *   Сервисы: `TechMapBudgetService` (calculateBudget с byCategory ledger/withinCap/overCap; checkOverspend: SEEDS 5%, остальные 10% tolerance → ChangeOrderService), `TechMapKPIService` (pure `computeKPIs`: C_ha, C_t, marginPerHa, marginPct, riskAdjustedMarginPerHa, variancePct), `ContractCoreService` (generateContractCore, inline recursive `stableStringify` → SHA-256 → `TechMap.basePlanHash`, verifyIntegrity), `RecalculationEngine` (event-driven: CHANGE_ORDER_APPLIED/ACTUAL_YIELD_UPDATED/PRICE_CHANGED/TRIGGER_FIRED).
    *   DTO: budget-line, tech-map-kpi.
    *   Тесты: 20/20 адресных PASS (6 suites). Регрессия: 28 suites / 95 tests PASS.
    *   Ревью: APPROVED. `computeKPIs` pure fn, `stableStringify` recursive без внешних dep, `basePlanHash` не дублировался.
    *   Decision-ID: `AG-TM-EC-005`.

## 2026-03-04 — Оркестратор: POST-B и POST-C промты

**Действие**: Создание промтов для пост-спринтов B и C

### POST-B: Season → CropZone + Rapeseed → CropVariety
- Файл: `interagency/prompts/2026-03-04_tm-post-b_season-cropzone-cropvariety.md`
- Decision-ID: AG-TM-POST-B-006
- Статус: READY_FOR_PLAN (🔴 Высокий риск — миграция данных, обязателен pg_dump)
- Ключевые ограничения: Season.fieldId → nullable, CropZone.cropZoneId → NOT NULL для TechMap, Rapeseed модель НЕ удаляется (deprecated)

### POST-C: UI TechMap Workbench v2
- Файл: `interagency/prompts/2026-03-04_tm-post-c_ui-workbench-v2.md`
- Decision-ID: AG-TM-POST-C-007
- Статус: DONE (Завершена конфигурация UI компонентов для техкарты)

46. **TM-POST-C: UI TechMap Workbench v2 CLOSED (2026-03-04)** ✅:
    * Отчет утвержден (APPROVED).
    * Реализована DAG-визуализация без внешних библиотек (на SVG).
    * Создана EvidencePanel (UI загрузки) и ChangeOrderPanel (запросы на изменения).
    * isFrozen режим жестко отключает интерфейс по Transition-политикам.
    * TypeScript (`tsc --noEmit`), Jest (`testPathPatterns=TechMapWorkbench`) PASS.

45. **TM-POST-B: Season → CropZone + Rapeseed → CropVariety CLOSED (2026-03-04)** ✅:
    *   Модели: `Season` (fieldId nullable), `CropZone` (primary link), `CropVariety`, `CropVarietyHistory`, `CropType` enum внедрены.
    *   `TechMapService` переключен на `CropZone` как основной источник связи.
    *   Data-migration: `Rapeseed` -> `CropVariety` и `Season` -> `CropZone` выполнены (idempotent скрипты).
    *   Backup: `backups/rai_platform_20260304T114020Z.dump` создан перед DDL.
    *   Верификация: tsc PASS, prisma validate PASS, tests (34 + 95) PASS. Ревью APPROVED.

47. **AI Multi-Agent Architecture Design (2026-03-04)** ✅:
    *   Проведено глубокое исследование (Phase 1) 35+ модулей и Prisma-схемы.
    *   Создан `docs/RAI_AI_SYSTEM_RESEARCH.md` (12 секций).
    *   Создан `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` (14 секций) — мульти-агентная система с 5 специализированными агентами.
    *   Спроектированы: Tool Registry (14 тулов), 3-слойная память, 4 тира моделей, HITL-матрица, Roadmap на 3 стадии.
    *   Обновлен `memory-bank/activeContext.md`.
    *   Ревью: DONE. Готов к имплементации Stage 1.

48. **A_RAI Фаза 1 — Старт декомпозиции SupervisorAgent (2026-03-04)** [IN_PROGRESS]:
    *   Принят к исполнению `CURSOR SOFTWARE FACTORY — STARTER PROMPT.md`.
    *   Прочитаны все обязательные документы: `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`, `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `PROJECT_EXECUTION_CHECKLIST.md`.
    *   Состояние: все задачи Фаза 1-3 A_RAI открыты; все Sprint S-серии и TM-серии DONE.
    *   Определён первый шаг: IntentRouter + AgroToolsRegistry + TraceId Binding.
    *   Создан промт: `interagency/prompts/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md`.
    *   Зарегистрированы Decision-ID: AG-ARAI-F1-001, AG-ARAI-F1-002, AG-ARAI-F1-003, AG-ARAI-F1-004, AG-ARAI-F2-001, AG-ARAI-F2-002, AG-ARAI-F2-003, AG-ARAI-F3-001, AG-ARAI-F3-002, AG-ARAI-F3-003 в `DECISIONS.log`.
    *   Обновлены: `A_RAI_IMPLEMENTATION_CHECKLIST.md` (пп. 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3 → `[/]`), `interagency/INDEX.md`, `memory-bank/task.md`.
    *   Промт F1-3: `interagency/prompts/2026-03-04_a_rai-f1-3_budget-deterministic-bridge.md`.
    *   Промт F1-4 (Декомпозиция SupervisorAgent: MemoryCoordinator, AgentRuntime, ResponseComposer): `interagency/prompts/2026-03-04_a_rai-f1-4_supervisor-decomposition.md`.
    *   Промт F2-1 (Parallel Fan-Out + ToolCall Planner): `interagency/prompts/2026-03-04_a_rai-f2-1_parallel-fan-out.md`.
    *   Промт F2-2 (EconomistAgent + KnowledgeAgent): `interagency/prompts/2026-03-04_a_rai-f2-2_economist-knowledge-agents.md`.
    *   Промт F2-3 (Eval & Quality: AgentScoreCard, GoldenTestSet): `interagency/prompts/2026-03-04_a_rai-f2-3_eval-quality.md`.
    *   Промт F3-1 (Мониторинг и автономность: MonitoringAgent, AutonomousExecutionContext): `interagency/prompts/2026-03-05_a_rai-f3-1_monitoring-agent.md`.
    *   Промт F3-2 (Политики рисков: RiskPolicyEngine, Two-Person Rule): `interagency/prompts/2026-03-05_a_rai-f3-2_risk-policy.md`.
    *   Промт F3-3 (Конфиденциальность: SensitiveDataFilter, Red-Team Suite): `interagency/prompts/2026-03-05_a_rai-f3-3_privacy-red-team.md`.
    *   Промт F4-1 (Explainability Panel): `interagency/prompts/2026-03-05_a_rai-f4-1_explainability-panel.md` [APPROVED].
    *   Промт F4-2 (TraceSummary Data Contract v1): `interagency/prompts/2026-03-05_a_rai-f4-2_tracesummary-contract.md` [APPROVED].
    *   Промт F4-3 (Evidence Tagging MVP): `interagency/prompts/2026-03-05_a_rai-f4-3_evidence-tagging.md` [APPROVED].
    *   Промт F4-4 (Truthfulness Engine BS%): `interagency/prompts/2026-03-05_a_rai-f4-4_truthfulness-engine.md` [APPROVED].
    *   Промт F4-5 (Truthfulness Panel API): `interagency/prompts/2026-03-05_a_rai-f4-5_truthfulness-panel-api.md` [APPROVED].
    *   Промт F4-6 (Drift Alerts): `interagency/prompts/2026-03-05_a_rai-f4-6_drift-alerts.md` [APPROVED].
    *   Промт F4-7 (Autonomy Policies): `interagency/prompts/2026-03-05_a_rai-f4-7_autonomy-policies.md` [APPROVED].
    *   Промт F4-8 (Agent Points): `interagency/prompts/2026-03-05_a_rai-f4-8_agent-points.md` [APPROVED].
    *   Промт F4-9 (Feedback Credibility): `interagency/prompts/2026-03-05_a_rai-f4-9_feedback-credibility.md` [APPROVED].
    *   Промт F4-10 (Explainability Explorer): `interagency/prompts/2026-03-05_a_rai-f4-10_explainability-explorer.md` [APPROVED].
    *   Промт F4-11 (Incident Ops): `interagency/prompts/2026-03-05_a_rai-f4-11_incident-ops.md` [ACTIVE].
    *   Промт F4-12 (Performance Metrics): `interagency/prompts/2026-03-05_a_rai-f4-12_performance-metrics.md` (добавлено в индекс).

- [2026-03-05 18:16:48] Проверен отчёт 2026-03-05_a_rai-f4-11_incident-ops.md по IncidentOps. Заебись.
- [2026-03-05 18:34:33] Проверен отчёт 2026-03-05_a_rai-f4-12_performance-metrics.md. Performance Metrics & SLO DONE.
- [2026-03-05 18:48:28] Проверен отчёт 2026-03-05_a_rai-f4-13_cost-workload-hotspots.md. Cost Decomposition DONE.
- [2026-03-05 18:57:10] Проверен отчёт 2026-03-05_a_rai-f4-14_connection-map-critical-path.md. Agent Connection Map DONE.
- [2026-03-05 19:17:34] Проверен отчёт 2026-03-05_a_rai-f4-15_safe-replay-trace.md. Safe Replay Trace DONE.
- [2026-03-05 19:24:27] Проверен отчёт 2026-03-05_a_rai-f4-16_agent-configurator.md. Agent Configurator API DONE.
- [2026-03-05 19:43:27] Проверен отчет 2026-03-05_a_rai-f4-17_control-tower-ui.md. Control Tower UI DONE.
- [2026-03-05 19:51:12] Запущены API (port 4000) и Web (port 3000) серверы.
- [2026-03-05 20:35:00] Исправлен баг в `TopNav.tsx`: добавлен таймаут 150мс на закрытие меню. Сука, зазор в 8 пикселей больше не ломает навигацию.

## 2026-03-05 — R2 TraceSummary Live Metrics (READY_FOR_REVIEW)
- `TraceSummaryService.updateQuality(traceId, companyId, bsScorePct, evidenceCoveragePct, invalidClaimsPct)` — новый метод для патча quality-полей
- `TruthfulnessEngineService.calculateTraceTruthfulness()` — сигнатура изменена с `Promise<void>` на `Promise<number>` (bsScorePct); убран внутренний `updateTraceSummary`
- `SupervisorAgent`: 2-шаговая запись TraceSummary — initial record (exe metadata) + updateQuality (quality после TruthfulnessEngine)
- Live поля: `toolsVersion` = список выполненных tools, `policyId` = classification.method, `bsScorePct` + `evidenceCoveragePct` из runtime
- tsc PASS | trace-summary.spec 4/4 | truthfulness-engine.spec 5/5 | supervisor-agent.spec 6/6

## 2026-03-05 — R3 Truthfulness Runtime Trigger (READY_FOR_REVIEW)
- Гонка устранена: `writeAiAuditEntry` дожидается выполнения перед `calculateTraceTruthfulness`.
- `replayMode` корректно блокирует вычет truthfulness.
- Убран фальшивый fallback `bsScorePct ?? 0` — движок теперь честно отдает 100 для пустых трейсов.
- Добавлено 5 тестов `Truthfulness runtime pipeline`.
- tsc PASS, targeted jest PASS.

## 2026-03-06 — R4 Claim Accounting and Coverage (DONE)
- Внедрена каноническая модель Claim Accounting: `total / evidenced / verified / invalid`.
- Формулы `evidenceCoveragePct` и `invalidClaimsPct` переведены на прозрачные знаменатели.
- `TruthfulnessEngineService` теперь возвращает `TruthfulnessResult` вместо `number`.
- `TraceSummary` теперь честно сохраняет `invalidClaimsPct`.
- Регрессия тестов (3 сюиты, 20 тестов) — PASS.
- Decision AG-RAI-R4-001 зафиксирован.

## 2026-03-06 — R5 Forensics Timeline Depth (STARTED)
- Взят промт `2026-03-06_a_rai-r5_trace-forensics-depth.md`.
- Цель: Восстановление полной причинной цепочки (`router -> summary -> audit -> truthfulness -> quality -> composer`).
- Анализ `TraceTopologyService` и `ExplainabilityPanelService` выявил расхождения в логике восстановления фаз.
## 2026-03-06 — Git Sync (DONE)
- Выполнен `git pull` для синхронизации с удаленным репозиторием.
- Обновлены файлы в `docs/09_ARCHIVE/`.
- Конфликтов нет, всё чики-пуки.

## 2026-03-06 — Сбор данных по рапсу (IN PROGRESS)
- [x] Форматирование `CEMINI#1.md` (ручная правка структуры и таблиц)
- [/] Реформатирование `GEMINI#2.md` (83KB). Применены Python-скрипты для первичной разбивки на секции.
- [ ] Окончательная очистка и фикс таблиц в `GEMINI#2.md`.
- [x] Создан финальный промт Гранд-Синтеза: `Promt_Grand_Sintez_FINAL.md` — объединяет роль/правила из шаблона с полной 11-секционной структурой + 6 приложений + 7 правил триангуляции + критерии качества.

## 2026-03-07 — Анализ готовности мультиагентов
- [x] Изучены чеклисты `STAGE 2` (Implementation, Readiness, Truth Sync).
- [x] Сопоставлен код с claims: обнаружено, что Agent Registry пока существует лишь как CRUD-иллюзия `AgentConfiguration` в Prisma.
- [x] Сформирован дальнейший roadmap: реализация `R10. Registry Domain Model`.

## 2026-03-07 — Stage 2 Interaction Blueprint Finalized ✅
- [x] Закрыт `clarification / overlay / auto-resume / result windows` как production-like path.
- [x] Unified window protocol подтверждён на reference families:
  - `agronomist`
  - `economist`
  - `knowledge`
  - `monitoring`
- [x] Введён backend contract-layer `Focus / Intent / Required Context / UI Action`.
- [x] `IntentRouter`, `Supervisor`, `ResponseComposer` переведены на общий interaction contract source.
- [x] `AI Dock` приведён к IDE-подобной композиции: header, history toggle, new chat, conversation, composer.
- [x] Legacy `widgets[]` переведены в compatibility path через `workWindows[]`.
- [x] Window layer поддерживает `context_*`, `structured_result`, `related_signals`, `comparison`.
- [x] Документация и handoff синхронизированы до состояния `DONE / implemented canon`.
- [x] Memory-bank синхронизирован перед публикацией в git.

## 2026-03-11 — CI/CD & Запуск
- [x] Запущены API/Web сервисы (через `pnpm dev` в фоне).
- [x] Создан файл полного системного аудита `RAI_EP_SYSTEM_AUDIT.md`.
- [x] Все локальные изменения закоммичены и отправлены в ремоут.
2026-03-12: Интеграция Nvidia Qwen LLM адаптера для Expert-tier агентов в режиме full_pro.
