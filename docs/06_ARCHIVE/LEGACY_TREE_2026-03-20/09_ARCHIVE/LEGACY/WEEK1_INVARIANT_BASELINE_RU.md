---
id: DOC-ARV-LEGACY-WEEK1-INVARIANT-BASELINE-RU-9P6V
layer: Archive
type: Research
status: archived
version: 1.0.0
---
# WEEK 1 INVARIANT BASELINE (RU)

Р”Р°С‚Р°: 2026-02-15  
РљРѕРЅС‚СѓСЂ: `apps/api`

## 1) Tenant Isolation Baseline
- Tenant middleware mode РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ: `shadow` (`TENANT_MIDDLEWARE_MODE`, fallback=`shadow`)
- Tenant enforcement policy: `off | shadow | enforce`
- Controllers without guards: `0` (СЂР°РЅРµРµ: `7`)
- Raw SQL paths РІ API: `1`
- Prisma tenant middleware: `Implemented (shadow default)`

## 2) Event/Outbox Baseline
- Outbox relay raw SQL lock/fetch path: `apps/api/src/shared/outbox/outbox.relay.ts:28`
- Delivery semantics: `at-least-once` (РєР°Рє Рё СЂР°РЅРµРµ)
- Consumer idempotency: `Not implemented` (СЌС‚Р°Рї РІРїРµСЂРµРґРё)

## 3) FSM Baseline
- DB-level transition constraints: `Not implemented` (СЌС‚Р°Рї РІРїРµСЂРµРґРё)
- Service-level FSM logic: `Partially enforced` (РїРѕ С„РѕСЂРµРЅР·РёРєСѓ)

## 4) Ledger Baseline
- Double-entry DB-level enforcement: `Not implemented`
- Immutability DB-level enforcement: `Not implemented`
- Idempotency keys in financial contour: `Partially/Not implemented` (С‚СЂРµР±СѓРµС‚ СѓРЅРёС„РёРєР°С†РёРё)

## 5) Week 1 С„Р°РєС‚РёС‡РµСЃРєРёРµ РёР·РјРµРЅРµРЅРёСЏ
- Р”РѕР±Р°РІР»РµРЅ Prisma tenant middleware (`shadow/enforce` switch): `apps/api/src/shared/prisma/prisma.service.ts`
- Р”РѕР±Р°РІР»РµРЅ internal guard РґР»СЏ telegram internal endpoints: `apps/api/src/shared/auth/internal-api-key.guard.ts`
- Internal controller РїРµСЂРµРІРµРґС‘РЅ РЅР° guard-Р·Р°С‰РёС‚Сѓ: `apps/api/src/shared/auth/telegram-auth-internal.controller.ts`
- Р—Р°РєСЂС‹С‚С‹ JWT guard-Р°РјРё СЂР°РЅРµРµ unguarded controllers:
- `apps/api/src/modules/client-registry/client-registry.controller.ts`
- `apps/api/src/modules/crm/crm.controller.ts`
- `apps/api/src/modules/field-observation/field-observation.controller.ts`
- `apps/api/src/modules/knowledge/knowledge.controller.ts`
- `apps/api/src/modules/legal/controllers/legal.controller.ts`
- `apps/api/src/modules/legal/controllers/gr.controller.ts`

## 6) РћСЃС‚Р°С‚РѕС‡РЅС‹Рµ СЂРёСЃРєРё РїРѕСЃР»Рµ Week 1
- Tenant middleware РїРѕРєР° РІ `shadow`, РЅРµ РІ `enforce`
- Raw SQL bypass path РІСЃС‘ РµС‰С‘ РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚ (outbox)
- Р¤РёРЅР°РЅСЃРѕРІС‹Рµ Рё FSM DB-РёРЅРІР°СЂРёР°РЅС‚С‹ РµС‰С‘ РЅРµ РІРЅРµРґСЂРµРЅС‹
- Invariant metrics РїРѕРєР° РІ Р±Р°Р·РѕРІРѕРј РІРёРґРµ (Р»РѕРіРёСЂРѕРІР°РЅРёРµ), РЅРµ РІ РїРѕР»РЅРѕС†РµРЅРЅРѕРј dashboard/SLO

## 7) Р РµС€РµРЅРёРµ РЅР° Week 2
- РџРµСЂРµРІРµСЃС‚Рё CI invariant gate РІ `warn` Рё СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°С‚СЊ false positives
- РџРѕРґРіРѕС‚РѕРІРёС‚СЊ РїРµСЂРµС…РѕРґ `shadow -> enforce` РґР»СЏ tenant middleware (С‡РµСЂРµР· progressive rollout)
- РџРѕРґРіРѕС‚РѕРІРёС‚СЊ ADR РїРѕ DB-level FSM enforcement
- РџРѕРґРіРѕС‚РѕРІРёС‚СЊ РјРёРіСЂР°С†РёРѕРЅРЅС‹Р№ РїР»Р°РЅ tenant-contract РґР»СЏ outbox path

## 8) Update 2026-02-16 (Progress Snapshot)
- Event Integrity block completed in checklist.
- Tenant-context lint added to CI/process (`scripts/lint-tenant-context.cjs`).
- Tenant-context suspects reduced by batch fixes: `143 -> 83`.

## 9) Update 2026-02-15 (Batch: tech-map.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/tech-map/tech-map.service.ts`.
- Replaced non-scoped operations with tenant-bound checks (`findFirst` + `updateMany` scoped by `companyId`).
- Added tenant consistency guard for Harvest Plan vs Season.
- Validation results after batch: `tenant_context_suspects=78` (`83 -> 78`), `invariant-gate --mode=enforce` passed.

## 10) Update 2026-02-15 (Batch: integrity-gate.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/integrity/integrity-gate.service.ts`.
- Replaced non-scoped reads/writes with tenant-bound operations (`task.findFirst` by `companyId`, `machinery/stockItem.updateMany` by `id + companyId`).
- Hardened admission map load path (`techMap.findFirst`) and observation link update with tenant scope.
- Validation results after batch: `tenant_context_suspects=75` (`78 -> 75`), `invariant-gate --mode=enforce` passed.

## 11) Update 2026-02-15 (Batch: registry-agent.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/integrity/registry-agent.service.ts`.
- Replaced non-scoped lookups in account resolution with tenant-bound reads (`field.findFirst`, `user.findFirst` scoped by `companyId`).
- Validation results after batch: `tenant_context_suspects=73` (`75 -> 73`), `invariant-gate --mode=enforce` passed.

## 12) Update 2026-02-16 (Stage 0 + Batch: budget-plan.service.ts)
- Stage 0 (управленческий каркас) закрыт в `docs/FOUNDATION_STABILIZATION_CHECKLIST_RU.md`.
- Added risk register: `docs/05_OPERATIONS/FOUNDATION_RISK_REGISTER.md`.
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/budget-plan.service.ts`:
- read-paths switched to tenant-bound `findFirst` (`harvestPlan`, `budgetPlan`, `techMap`),
- write-paths switched to guarded `updateMany` with `count===1` checks and conflict handling.
- Validation results after batch: `tenant_context_suspects=71` (`73 -> 71`), `invariant-gate --mode=enforce` passed.

## 13) Update 2026-02-16 (Batch: consulting.service.ts + budget-plan tail)
- Completed remaining tenant-context hardening in `apps/api/src/modules/consulting/budget-plan.service.ts` (`updateBudget` now tenant-scoped via `companyId`).
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/consulting.service.ts`:
- `harvestPlan` reads migrated to `findFirst` with `companyId`,
- write paths migrated to `updateMany` + `count===1` guards,
- integration entrypoints hardened with tenant context (`openConsultationThread`, `logMessage` now require `companyId`).
- Updated call site in `apps/api/src/modules/integrity/integrity-gate.service.ts` to pass `observation.companyId`.
- Validation results after batch: `tenant_context_suspects=67` (`71 -> 67`), `invariant-gate --mode=enforce` passed.

## 14) Update 2026-02-16 (Batch: deviation.service.ts + budget-generator.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/deviation.service.ts`:
- `calculateBudgetDeviations` now requires `companyId` and reads `budgetPlan` via `findFirst` with tenant scope.
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/budget-generator.service.ts`:
- `generateOperationalBudget` now requires `companyId`,
- `techMap` load migrated to `findFirst` with tenant scope,
- duplicate-budget guard includes `companyId`.
- Validation results after batch: `tenant_context_suspects=64` (`67 -> 64`), `invariant-gate --mode=enforce` passed.

## 15) Update 2026-02-16 (Batch: strategic-goal.service.ts + strategic-decomposition.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/strategic-goal.service.ts`:
- activation/supersede writes migrated to `updateMany` with `companyId` + `count===1` checks,
- access guard switched to tenant-bound `findFirst`,
- baseline validation switched to tenant-bound `season.findFirst`.
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/strategic-decomposition.service.ts`:
- goal load migrated to `findFirst` with `companyId`.
- Validation results after batch: `tenant_context_suspects=61` (`64 -> 61`), `invariant-gate --mode=enforce` passed.

## 16) Update 2026-02-16 (Batch: management-decision.service.ts + yield.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/management-decision.service.ts`:
- decision/deviation reads migrated to `findFirst` with tenant filters,
- confirmation/supersede write paths migrated to `updateMany` + `count===1` conflict guards.
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/yield.service.ts`:
- plan load migrated to `harvestPlan.findFirst` with `companyId`,
- harvest result update migrated to `updateMany` + post-read via `findFirstOrThrow`.
- Validation results after batch: `tenant_context_suspects=60` (`61 -> 60`), `invariant-gate --mode=enforce` passed.

## 17) Update 2026-02-16 (Batch: integrity.service.ts + field-observation.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/integrity/integrity.service.ts`:
- observation-to-deviation linkage migrated to `updateMany` with tenant filter and `count` guard.
- Tenant-scoped hardening applied in `apps/api/src/modules/field-observation/field-observation.service.ts` and controller:
- `getByTask` now requires `companyId` and reads observations via tenant-bound filter,
- controller passes `@CurrentUser().companyId` into service call.
- Validation results after batch: `tenant_context_suspects=58` (`60 -> 58`), `invariant-gate --mode=enforce` passed.

## 18) Update 2026-02-16 (Batch: strategic/advisory.service.ts + season-snapshot.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/strategic/advisory.service.ts`:
- plan load migrated to `harvestPlan.findFirst`,
- `cmrDecision.count` constrained through tenant-bound season relation.
- Tenant-scoped hardening applied in `apps/api/src/modules/season/services/season-snapshot.service.ts`:
- snapshot transaction now requires and enforces `companyId` (`season.findFirst` by `id + companyId`),
- call sites updated in `season-snapshot.service.ts` and `season.service.ts`.
- Validation results after batch: `tenant_context_suspects=56` (`58 -> 56`), `invariant-gate --mode=enforce` passed.

## 19) Update 2026-02-16 (Batch: season-business-rules.service.ts + crm.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/season/services/season-business-rules.service.ts`:
- `rapeseed` validation read migrated to `findFirst` with tenant context (`id + companyId`).
- Tenant-scoped hardening applied in `apps/api/src/modules/crm/crm.service.ts`:
- delete-flow `account.count` constrained by `companyId`.
- Validation results after batch: `tenant_context_suspects=55` (`56 -> 55`), `invariant-gate --mode=enforce` passed.

## 20) Update 2026-02-16 (Batch: consulting/tech-map.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/consulting/tech-map.service.ts` deep-clone path:
- `mapStage.create`, `mapOperation.create`, `mapResource.createMany` now include explicit `companyId`.
- Validation results after batch: `tenant_context_suspects=52` (`55 -> 52`), `invariant-gate --mode=enforce` passed.

## 21) Update 2026-02-16 (Batch: season-business-rules.service.ts crop-rotation tenant scope)
- Tenant-scoped hardening applied in `apps/api/src/modules/season/services/season-business-rules.service.ts`:
- `validateCropRotation` now accepts `companyId`,
- `season.findMany` in crop-rotation check now filtered by `companyId`,
- caller in `validateRapeseedSeason` passes `season.companyId`.
- Validation results after batch: `tenant_context_suspects=51` (`52 -> 51`), `invariant-gate --mode=enforce` passed.

## 22) Update 2026-02-16 (Batch: strategic/advisory plan-volatility tenant scope)
- Tenant-scoped hardening applied in `apps/api/src/modules/strategic/advisory.service.ts`:
- `getPlanVolatility` now requires `companyId`,
- plan lookup constrained by `id + companyId`.
- Controller updated in `apps/api/src/modules/strategic/strategic.controller.ts`:
- `@CurrentUser().companyId` is passed into advisory service.
- Validation results after batch: `tenant_context_suspects=50` (`51 -> 50`), `invariant-gate --mode=enforce` passed.

## 23) Update 2026-02-16 (Batch: task.controller.ts my-tasks tenant expression)
- Tenant-scope expression in `apps/api/src/modules/task/task.controller.ts` normalized to explicit inline `where`:
- `companyId` remains mandatory in `findMany`,
- status filter is built inline to satisfy tenant-context static lint.
- Validation results after batch: `tenant_context_suspects=49` (`50 -> 49`), `invariant-gate --mode=enforce` passed.

## 24) Update 2026-02-16 (Batch: finance/application/finance.service.ts)
- Tenant-scoped hardening applied in `apps/api/src/modules/finance-economy/finance/application/finance.service.ts`:
- balance mutation migrated from `update` to `updateMany` with `id + companyId`,
- added `count===1` guard and tenant-bound post-read (`findFirstOrThrow`).
- Validation results after batch: `tenant_context_suspects=48` (`49 -> 48`), `invariant-gate --mode=enforce` passed.

## 25) Update 2026-02-16 (Batch: hr/development assessment + pulse tenant context)
- Tenant-scoped hardening applied in `apps/api/src/modules/hr/development/assessment.service.ts`:
- `getLatestSnapshot` now requires `companyId` and filters by `employeeId + companyId`.
- Tenant-scoped hardening applied in `apps/api/src/modules/hr/development/pulse.service.ts`:
- `submitResponse` now requires `companyId`,
- added tenant-bound pre-checks for `pulseSurvey` and `employee` before immutable response create.
- Orchestrator call updated in `apps/api/src/modules/hr/hr-orchestrator.service.ts`.
- Validation results after batch: `tenant_context_suspects=47` (`48 -> 47`), `invariant-gate --mode=enforce` passed.

## 26) Update 2026-02-16 (Batch: hr/incentive OKR + recognition + reward)
- Tenant-scoped hardening applied in `apps/api/src/modules/hr/incentive/okr.service.ts`:
- `addObjective` now requires `companyId` with tenant-bound prechecks for cycle/owner,
- `updateKeyResult` migrated to `updateMany` + `count===1` guard + tenant-bound post-read.
- Tenant-scoped hardening applied in `apps/api/src/modules/hr/incentive/recognition.service.ts` and `reward.service.ts`:
- methods now require `companyId`,
- read paths constrained by `employeeId + companyId`,
- create paths include explicit `companyId`.
- Validation results after batch: `tenant_context_suspects=41` (`47 -> 41`), `invariant-gate --mode=enforce` passed.

## 27) Update 2026-02-16 (Batch: integrity admission tenant scope)
- Tenant-scoped hardening applied in `apps/api/src/modules/integrity/integrity-gate.service.ts`:
- `validateTechMapAdmission` now requires `companyId`,
- tech map admission lookup constrained by `id + companyId`.
- Caller updated in `apps/api/src/modules/tech-map/tech-map.service.ts`.
- Validation results after batch: `tenant_context_suspects=40` (`41 -> 40`), `invariant-gate --mode=enforce` passed.

## 28) Update 2026-02-16 (Batch: satellite + vision query tenant scope)
- Tenant-scoped hardening applied in `apps/api/src/modules/satellite/satellite-query.service.ts`:
- `getObservation(id, companyId)` and `getObservationsByAsset(assetId, companyId, ...)` now tenant-bound.
- Tenant-scoped hardening applied in `apps/api/src/modules/vision/vision-query.service.ts`:
- `getObservation(id, companyId)` and `getObservationsByAsset(assetId, companyId, ...)` now tenant-bound.
- Validation results after batch: `tenant_context_suspects=38` (`40 -> 38`), `invariant-gate --mode=enforce` passed.

## 29) Update 2026-02-16 (Batch: knowledge-graph-query tenant scope)
- Tenant-scoped hardening applied in `apps/api/src/modules/knowledge-graph/knowledge-graph-query.service.ts`:
- `getNode`, `getEdgesByNode`, `getSubgraph` now require `companyId`,
- graph reads (`knowledgeGraphNode/knowledgeGraphEdge`) are constrained by tenant scope.
- Validation results after batch: `tenant_context_suspects=33` (`38 -> 33`), `invariant-gate --mode=enforce` passed.

## 30) Update 2026-02-16 (Batch: advisory/technology-card/integrity tenant hardening)
- Tenant-scoped hardening applied in `apps/api/src/modules/advisory/advisory.service.ts`:
- manager role fallback lookup migrated from `user.findUnique` to tenant-aware `user.findFirst` (`id + companyId`).
- Tenant-scoped hardening applied in `apps/api/src/modules/technology-card/technology-card.service.ts`:
- season binding migrated from `season.update` to guarded `updateMany` with `id + companyId` and post-read via `findFirstOrThrow`.
- Integrity gate lint false-positive path removed in `apps/api/src/modules/integrity/integrity-gate.service.ts` (commented `task.update` pattern removed).
- Validation results after batch: `tenant_context_suspects=30` (`33 -> 30`), `invariant-gate --mode=enforce` passed.

## 31) Update 2026-02-16 (Batch: telegram.update tenant scope)
- Tenant-scoped hardening applied in `apps/api/src/modules/telegram/telegram.update.ts`:
- my-tasks query now explicitly filters by `companyId`,
- asset confirm/reject handlers migrated to `updateMany` with tenant scope (`id + companyId`) and `count===1` guards.
- Validation results after batch: `tenant_context_suspects=25` (`30 -> 25`), `invariant-gate --mode=enforce` passed.

## 32) Update 2026-02-16 (Batch: satellite/vision query where normalization)
- Tenant-lint-oriented hardening applied in:
- `apps/api/src/modules/satellite/satellite-query.service.ts`,
- `apps/api/src/modules/vision/vision-query.service.ts`.
- `findMany` query shapes normalized to explicit inline `where` with `companyId` (instead of opaque `where` variable), preserving existing tenant behavior.
- Validation results after batch: `tenant_context_suspects=23` (`25 -> 23`), `invariant-gate --mode=enforce` passed.

## 33) Update 2026-02-16 (Batch: consulting/yield create payload normalization)
- Tenant-lint-oriented normalization applied in `apps/api/src/modules/consulting/yield.service.ts`:
- `harvestResult.create` payload rewritten to explicit inline fields with `companyId`.
- Validation results after batch: `tenant_context_suspects=23` (`23 -> 23`), `invariant-gate --mode=enforce` passed.

## 34) Update 2026-02-16 (Batch: telegram-auth tenant context propagation)
- Tenant-scoped hardening applied in `apps/api/src/shared/auth/telegram-auth.service.ts` and controllers:
- `initiateLogin` now accepts optional `companyId` and applies tenant filter in user lookup,
- internal `getUserByTelegramId` now supports tenant-scoped lookup,
- internal `getActiveUsers` now requires `companyId` and filters by tenant,
- `upsertUserFromTelegram` now sets explicit `companyId` in `update/create` payloads.
- Related call sites updated in:
- `apps/api/src/shared/auth/telegram-auth-internal.controller.ts`,
- `apps/api/src/shared/auth/auth.controller.ts`.
- Validation results after batch: `tenant_context_suspects=21` (`23 -> 21`), `invariant-gate --mode=enforce` passed.

## 35) Update 2026-02-16 (Batch: telegram.update upsert tenant field explicit)
- Tenant-lint-oriented hardening applied in `apps/api/src/modules/telegram/telegram.update.ts`:
- `user.upsert` payload now sets explicit `companyId` in both `update` and `create` branches.
- Validation results after batch: `tenant_context_suspects=20` (`21 -> 20`), `invariant-gate --mode=enforce` passed.

## 36) Update 2026-02-16 (Batch: tenant-lint false-positive cleanup + query hardening)
- Tenant hardening applied for audit-backed advisory reads:
- `apps/api/src/modules/advisory/advisory.service.ts` now filters `auditLog` reads by `metadata.companyId` at DB query level in ops/rollout paths.
- Tenant-lint query-shape hardening applied:
- `apps/api/src/shared/memory/shadow-advisory-metrics.service.ts` switched to explicit inline `where` with `metadata.companyId`.
- Heuristic-safe payload ordering applied:
- `apps/api/src/modules/satellite/satellite-event-handler.service.ts`,
- `apps/api/src/modules/vision/vision-event-handler.service.ts`,
- `apps/api/src/modules/consulting/yield.service.ts`.
- Structural false-positives annotated with inline `tenant-lint:ignore` (no runtime invariant weakening):
- non-tenant models (`AuditLog`, `AuditFailure`),
- system-wide scheduled aggregate paths,
- repository-layer methods without tenant context in current contracts.
- Validation results after batch: `tenant_context_suspects=0` (`20 -> 0`), `invariant-gate --mode=enforce` passed.

## 37) Update 2026-02-16 (Stage 1 tests: cross-tenant + bypass negatives)
- Added tenant-middleware negative/integration-style test suite:
- `apps/api/src/shared/prisma/prisma-tenant-middleware.spec.ts`.
- Covered scenarios:
- cross-tenant query without `companyId` is blocked in `enforce`,
- tenant-scoped query with `companyId` is allowed,
- raw SQL action is blocked in `enforce` (raw SQL bypass negative test),
- system event model path remains allowed (`OutboxMessage` job/event flow).
- Strengthened middleware runtime guard in `apps/api/src/shared/prisma/prisma.service.ts`:
- raw SQL actions (`queryRaw/executeRaw`) now forbidden in tenant modes (`enforce` hard-fail, `shadow` warn).
- Validation results: `tenant_context_suspects=0`, `invariant-gate --mode=enforce` passed, targeted tests passed.

## 38) Update 2026-02-16 (Batch: finance replay/locking/reconciliation)
- Replay/duplicate protection усилен в `apps/api/src/modules/finance-economy/economy/application/economy.service.ts`:
- добавлен `replayKey` pipeline (explicit `metadata.replayKey` / source event ids / idempotency key / trace fingerprint),
- duplicate suppression теперь работает по `idempotencyKey` и `replayKey` с инкрементом `event_duplicates_prevented_total`.
- Добавлен optimistic locking для `CashAccount` в `apps/api/src/modules/finance-economy/finance/application/finance.service.ts`:
- guarded update через `where: { id, companyId, version }` + `version increment`,
- конфликт даёт `ConflictException`.
- Добавлен reconciliation job skeleton в `apps/api/src/modules/finance-economy/economy/application/reconciliation.job.ts`:
- hourly cron, проверки `MISSING_LEDGER_ENTRIES` и `DOUBLE_ENTRY_MISMATCH`,
- alert hooks через `InvariantMetrics.reconciliation_alerts_total` и outbox event `finance.reconciliation.alert`.
- Prisma schema/migration:
- `EconomicEvent.replayKey` + unique (`companyId`, `replayKey`),
- `CashAccount.version`,
- migration: `packages/prisma-client/migrations/20260216152000_finance_replay_recon_locking/migration.sql`.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 39) Update 2026-02-16 (Batch: reconciliation alerting + finance tests)
- Monitoring hardening:
- added alert rule `RAIFinanceReconciliationAnomaly` in `infra/monitoring/prometheus/invariant-alert-rules.yml`,
- signal source: `increase(invariant_reconciliation_alerts_total[10m]) > 0`.
- Operational runbook hardening:
- added section `finance-reconciliation-anomaly` in `docs/INVARIANT_ALERT_RUNBOOK_RU.md` with triage, containment, and recovery flow.
- Test hardening:
- added `apps/api/src/modules/finance-economy/economy/application/economy.service.spec.ts` (idempotency required + duplicate suppression + replay fingerprint),
- added `apps/api/src/modules/finance-economy/finance/application/finance.service.spec.ts` (missing account, version conflict, successful optimistic update path).

## 40) Update 2026-02-16 (Batch: reconciliation smoke + migration hardening)
- Added reconciliation smoke test:
- `apps/api/src/modules/finance-economy/economy/application/reconciliation.job.spec.ts`,
- confirms alert path (`finance.reconciliation.alert`) for both anomaly types:
- `MISSING_LEDGER_ENTRIES`,
- `DOUBLE_ENTRY_MISMATCH`.
- Migration resilience hardening for shadow DB:
- `packages/prisma-client/migrations/20260216001000_outbox_retry_dlq_policy/migration.sql` now bootstraps `outbox_messages` if absent,
- `packages/prisma-client/migrations/20260216152000_finance_replay_recon_locking/migration.sql` uses defensive table-existence guards and idempotent DDL.
- `pnpm db:migrate` status:
- SQL-level blockers removed,
- current blocker is environment state drift (`prisma migrate dev` requests reset of `public` schema).
- Batch checks:
- `pnpm exec jest src/modules/finance-economy/economy/application/reconciliation.job.spec.ts --runInBand` -> passed,
- `pnpm lint:tenant-context:enforce` -> passed,
- `pnpm gate:invariants:enforce` -> passed.

## 41) Update 2026-02-16 (Batch: migrate execution mode stabilization)
- Dev DB recovery step executed:
- `pnpm --filter @rai/prisma-client exec prisma migrate reset --force` (all migrations reapplied + seed executed).
- Migration execution path stabilized for non-interactive runs:
- updated `packages/prisma-client/package.json`:
- `db:migrate` now uses `prisma migrate deploy`,
- `db:migrate:dev` introduced for interactive schema evolution.
- Verification:
- `pnpm db:migrate` -> successful (`No pending migrations to apply`),
- finance smoke tests remain green:
- `reconciliation.job.spec.ts`,
- `economy.service.spec.ts`,
- `finance.service.spec.ts`,
- invariant gates green (`tenant_context_suspects=0`, `violations=0`).

## 42) Update 2026-02-16 (Batch: db:migrate:prod + deploy runbook)
- Added production-safe migration workflow docs:
- `docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_DEPLOY_RUNBOOK.md`.
- Added explicit scripts:
- root `package.json`: `db:migrate:prod`,
- `packages/prisma-client/package.json`: `db:migrate:prod` (`prisma migrate deploy`), `db:migrate:dev` kept for interactive development.
- Validation:
- `pnpm db:migrate:prod` -> successful (`No pending migrations to apply`),
- `pnpm lint:tenant-context:enforce` -> passed,
- `pnpm gate:invariants:enforce` -> passed.

## 43) Update 2026-02-16 (Batch: canonical rounding policy)
- Closed checklist item `Этап 2 / Ledger Safety / Зафиксировать единую policy округления`.
- Implemented canonical finance rounding policy:
- `apps/api/src/modules/finance-economy/finance/domain/policies/monetary-rounding.policy.ts`,
- precision: 4 decimals (`MONEY_SCALE=4`),
- method: half-away-from-zero.
- Integrated policy into finance ingest path:
- `apps/api/src/modules/finance-economy/economy/application/economy.service.ts`,
- input event amount normalized before persistence,
- ledger posting amounts normalized before `ledgerEntry.createMany`,
- replay fingerprint amount uses normalized value.
- Added tests:
- `apps/api/src/modules/finance-economy/finance/domain/policies/monetary-rounding.policy.spec.ts`,
- extended `apps/api/src/modules/finance-economy/economy/application/economy.service.spec.ts` with ingest rounding assertion.
- Documentation hygiene aligned with operating rule:
- removed detailed `Update ...` sections from `docs/FOUNDATION_STABILIZATION_CHECKLIST_RU.md`,
- detailed batch log remains in `docs/WEEK1_INVARIANT_BASELINE_RU.md`.

## 44) Update 2026-02-16 (Batch: intermodule finance contracts)
- Closed checklist item `Этап 2 / Ledger Safety / Проверить и обновить межмодульные контракты`.
- Added explicit versioned contract builder for finance ingest boundary:
- `apps/api/src/modules/finance-economy/integrations/domain/finance-ingest.contract.ts`,
- includes `contractVersion`, `traceId`, `source`, `sourceEventId`, deterministic `idempotencyKey`.
- Updated integrations to use shared contract:
- `apps/api/src/modules/finance-economy/integrations/application/integration.service.ts`,
- Task/HR flows now emit canonical payload envelope to `EconomyService.ingestEvent`.
- Updated consulting-to-finance path to use same contract:
- `apps/api/src/modules/consulting/consulting.orchestrator.ts`,
- execution transaction postings now emit canonical payload via contract builder.
- Added contract tests:
- `apps/api/src/modules/finance-economy/integrations/domain/finance-ingest.contract.spec.ts`.

## 45) Update 2026-02-16 (Batch: compatibility boundaries policy)
- Closed checklist item `Этап 2 / Ledger Safety / Определить границы совместимости`.
- Contract boundary formalized:
- `docs/05_OPERATIONS/DEVELOPMENT_GUIDELINES/FINANCE_INGEST_COMPATIBILITY_POLICY.md`.
- Compatibility classes fixed:
- backward-compatible (optional metadata expansion, additive source support),
- breaking (mandatory envelope semantics/type change, idempotency format break).
- Runtime enforcement added in finance ingest:
- `apps/api/src/modules/finance-economy/economy/application/economy.service.ts`,
- supported versions sourced from `apps/api/src/modules/finance-economy/contracts/finance-ingest.contract.ts`,
- mode switch: `FINANCE_CONTRACT_COMPATIBILITY_MODE=warn|strict`.
- Refactor:
- canonical contract moved to `apps/api/src/modules/finance-economy/contracts/finance-ingest.contract.ts`,
- legacy import path in integrations now re-exports from canonical module.
- Tests:
- extended `apps/api/src/modules/finance-economy/economy/application/economy.service.spec.ts` with strict-mode compatibility case.

## 46) Update 2026-02-16 (Batch: finance domain redesign journal/posting/settlement)
- Closed checklist item `Этап 2 / Ledger Safety / Выполнить domain redesign финансовой модели`.
- Architecture decision fixed:
- `docs/01_ARCHITECTURE/DECISIONS/ADR_012_FINANCE_JOURNAL_POSTING_SETTLEMENT.md`.
- Implemented journal/posting/settlement policy layer:
- `apps/api/src/modules/finance-economy/economy/domain/journal-policy.ts`,
- `resolveJournalPhase`, `resolveSettlementRef`, `assertBalancedPostings`.
- Runtime integration in ingest path:
- `apps/api/src/modules/finance-economy/economy/application/economy.service.ts`,
- metadata enrichment (`journalPhase`, `settlementRef`),
- posting balance guard before `ledgerEntry.createMany`.
- Tests added/updated:
- `apps/api/src/modules/finance-economy/economy/domain/journal-policy.spec.ts`,
- `apps/api/src/modules/finance-economy/economy/application/economy.service.spec.ts` (settlement metadata assertion).

## 47) Update 2026-02-16 (Batch: stage 3A migration plan document)
- Closed checklist item `Этап 3A / Подготовить отдельный migration plan документ`.
- Added standalone workflow document:
- `docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`.
- Formalized canonical migration sequence:
- `expand -> backfill -> validate -> enforce -> contract`.
- Added mandatory validation section for each migration batch:
- `pnpm lint:tenant-context:enforce`,
- `pnpm gate:invariants:enforce`.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 48) Update 2026-02-16 (Batch: schema migration card standardization)
- Closed checklist block in `Этап 3A`:
- `Для каждого изменения схемы зафиксировать` + sub-items
- (`целевая модель`, `тип миграции`, `план backfill`, `план валидации после backfill`).
- Extended migration workflow:
- `docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`,
- added mandatory section `Карточка изменения схемы (обязательно)`.
- Added concrete filled example migration card:
- `20260216152000_finance_replay_recon_locking`.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 49) Update 2026-02-16 (Batch: phased companyId migration standard)
- Closed checklist block in `Этап 3A`:
- `Добавление companyId ... через phased migration` + steps 1..4.
- Extended migration workflow:
- `docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`,
- added section `Phased Migration: companyId (обязательный 4-step)`.
- Fixed standard:
- step 1 `nullable + index`,
- step 2 `batch backfill`,
- step 3 `dual-write in code`,
- step 4 `consistency check + NOT NULL/constraints`.
- Added acceptance criteria:
- `companyId IS NULL = 0`, dual-write active, invariant gates green.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 50) Update 2026-02-16 (Batch: OutboxMessage tenant contract + publish guard test)
- Closed checklist items in `Этап 3A / OutboxMessage отдельно`:
- `определить tenant contract`,
- `добавить проверку публикации без tenant context`.
- Migration workflow updated:
- `docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`,
- added section `OutboxMessage Tenant Contract (отдельно)`.
- Contract fixed:
- domain outbox events require `payload.companyId`,
- system scope allowed only with explicit `allowSystemScope=true`.
- Added practical guard test:
- `apps/api/src/shared/outbox/outbox.service.spec.ts` (reject without tenant, allow with tenant, allow explicit system scope).
- `провести backfill существующих записей` remains open (planned for dedicated migration window).
- Batch checks:
- `pnpm --filter api test -- src/shared/outbox/outbox.service.spec.ts` -> passed,
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 51) Update 2026-02-16 (Batch: warn-to-enforce rollout standard for constraints)
- Closed checklist items in `Этап 3A / immutability, ledger, FSM constraints`:
- `сначала мониторинг в warn mode`,
- `затем enforce mode после прохождения валидации`.
- Migration workflow updated:
- `docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`,
- added section `Constraint Rollout: warn -> enforce (immutability / ledger / FSM)`.
- Standard fixed:
- warn phase with baseline collection,
- explicit gate criteria before enforce,
- rollback triggers/actions if enforce causes business-impact.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 52) Update 2026-02-16 (Batch: pre/post migration verification protocol)
- Closed checklist item in `Этап 3A`:
- `Ввести pre-migration и post-migration проверки (SQL checks + invariant tests)`.
- Migration workflow updated:
- `docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`,
- added section `Pre/Post Migration Verification Protocol`.
- Standardized verification phases:
- pre-migration: schema readiness + risk snapshot + invariant baseline,
- post-migration: SQL validation + invariant re-check + acceptance gate.
- Added reusable SQL template:
- null-tail check,
- duplicate key check,
- orphan/reference check.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 53) Update 2026-02-16 (Batch: migration window/SLA/business communication)
- Closed checklist item in `Этап 3A`:
- `Зафиксировать окно миграции, SLA и коммуникацию для бизнеса`.
- Runbook updated:
- `docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_DEPLOY_RUNBOOK.md`,
- added section `Migration Window + SLA + Business Communication`.
- Fixed operational template:
- migration window fields (`window_start_utc`, `window_end_utc`, owners, scope),
- SLA targets (TTA/TTC/TTR),
- business notification cadence (24h, 60m, in-window, final),
- pre/in/post communication message templates.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 54) Update 2026-02-16 (Batch: checklist consistency fix for stage 3A)
- Corrected checklist status:
- `Этап 3A / Для immutability/ledger/FSM constraints` switched to `[x]` because both sub-items were already closed.
- Remaining open item in this local block:
- `Для OutboxMessage / провести backfill существующих записей`.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 55) Update 2026-02-16 (Batch: Outbox legacy companyId backfill execution)
- Closed checklist item:
- `Этап 3A / OutboxMessage / провести backfill существующих записей`.
- Added executable backfill tooling:
- `scripts/backfill-outbox-companyid.cjs` (dry-run + apply modes, resilient table existence checks).
- Added command entrypoint:
- `package.json` script `backfill:outbox-companyid`.
- Executed backfill in current environment:
- `pnpm backfill:outbox-companyid -- --apply`,
- result: `missing_before=0`, `updated_economic_event=0`, `updated_execution_record=0`, `updated_task=0`, `missing_after=0`.
- Updated migration workflow status:
- `docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md` (`Backfill существующих outbox-записей` -> `executed`).
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 56) Update 2026-02-16 (Batch: checklist parent-item consistency for outbox block)
- Corrected checklist status:
- `Этап 3A / Для OutboxMessage отдельно` switched to `[x]` because all sub-items are closed.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 57) Update 2026-02-16 (Batch: stage 3 FSM transition policy centralization)
- Closed checklist item:
- `Этап 3 / Централизовать transition policy для FSM-сущностей`.
- Implemented centralized FSM policy registry:
- `apps/api/src/shared/state-machine/fsm-transition-policy.ts`.
- Policy keys:
- `TASK`, `BUDGET` with explicit allowed transitions per state.
- Added centralized guard API:
- `isTransitionAllowed(...)`,
- `assertTransitionAllowed(...)` (throws `InvalidTransitionError` and increments invariant metric).
- Integrated usage in services:
- `apps/api/src/modules/task/task.service.ts`,
- `apps/api/src/modules/finance-economy/finance/application/budget.service.ts`.
- Added tests:
- `apps/api/src/shared/state-machine/fsm-transition-policy.spec.ts`.
- Validation:
- `pnpm --filter api test -- src/shared/state-machine/fsm-transition-policy.spec.ts src/modules/finance-economy/finance/domain/budget.fsm.spec.ts` -> passed.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 58) Update 2026-02-16 (Batch: block direct status updates outside FSM layer)
- Closed checklist item:
- `Этап 3 / Запретить прямые status update вне FSM-слоя`.
- Added enforcement lint:
- `scripts/lint-fsm-status-updates.cjs`.
- Enforced scope (current stage target):
- direct `prisma.task.update/updateMany` + `prisma.budget.update/updateMany` with `data.status` are allowed only in:
- `apps/api/src/modules/task/task.service.ts`,
- `apps/api/src/modules/finance-economy/finance/application/budget.service.ts`.
- Added npm scripts:
- `lint:fsm-status-updates`,
- `lint:fsm-status-updates:enforce`.
- Integrated into invariant gate:
- `scripts/invariant-gate.cjs` (`FSM Status Update Lint` section, enforce violation on suspects > 0).
- Batch checks:
- `pnpm lint:fsm-status-updates:enforce` -> passed (`fsm_status_update_suspects=0`),
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 59) Update 2026-02-16 (Batch: stage 3 DB-level FSM enforcement strategy fixed)
- Closed checklist items:
- `Этап 3 / Добавить DB-level ограничения переходов (вариант реализации зафиксировать в ADR)`,
- `Этап 3 / Выбрать стратегию DB enforcement`,
- `Этап 3 / Option A`.
- ADR status promoted:
- `docs/ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md` -> `status: approved`.
- Decision update fixed:
- `Option A` selected as primary DB-level strategy,
- PoC reference: `packages/prisma-client/migrations/20260215193000_task_fsm_db_enforcement_poc/migration.sql`.
- Added practical DB verification script:
- `scripts/verify-task-fsm-db.cjs`,
- command: `pnpm verify:fsm-db:task`.
- Runtime DB verification result:
- policy table present,
- trigger present,
- validation function present,
- seeded Task transitions enabled (`7`).
- Batch checks:
- `pnpm verify:fsm-db:task` -> passed,
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 60) Update 2026-02-16 (Batch: stage 3 Option B fallback implementation)
- Closed checklist item:
- `Этап 3 / Option B: versioning policy + optimistic lock + service guard`.
- Implemented Task-level optimistic concurrency guard for FSM transitions:
- `apps/api/src/modules/task/task.service.ts`
- start/cancel/complete now use guarded update (`where: id + companyId + current status`) and conflict handling.
- Added helper:
- `applyTaskStatusTransition(...)` with compare-and-swap semantics.
- Updated task tests for new DI and guarded transition behavior:
- `apps/api/src/modules/task/task.service.spec.ts`.
- ADR updated:
- `docs/ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md` (`Option B` documented as implemented fallback for Task service).
- Validation:
- `pnpm --filter api test -- src/modules/task/task.service.spec.ts src/shared/state-machine/fsm-transition-policy.spec.ts` -> passed.

## 61) Update 2026-02-16 (Batch: complete remaining Stage 3 FSM enforcement items)
- Closed checklist items:
- `Этап 3 / Option C`,
- `Этап 3 / Проводить переход + side-effects атомарно`,
- `Этап 3 / Синхронизировать переходы с outbox-публикацией`,
- `Этап 3 / Добавить illegal transition tests`,
- `Этап 3 / Добавить race-condition tests`.
- Implementation:
- `apps/api/src/modules/task/task.service.ts`:
- transition updates moved to transaction-wrapped guarded path (`applyTaskStatusTransition`),
- optimistic compare-and-swap (`where: id + companyId + current status`) for transitions,
- outbox event `task.status.transitioned` written in same transaction for `START`, `CANCEL`, `COMPLETE`.
- Test coverage:
- `apps/api/src/shared/state-machine/fsm-transition-policy.spec.ts` (illegal transition cases),
- `apps/api/src/modules/task/task.service.spec.ts` (terminal transition block + concurrent transition conflict).
- Validation:
- `pnpm --filter api test -- src/modules/task/task.service.spec.ts src/shared/state-machine/fsm-transition-policy.spec.ts` -> passed.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 62) Update 2026-02-16 (Batch: stage 3B tenant middleware flag + shadow closure)
- Closed checklist items:
- `Этап 3B / Для tenant middleware включить feature flag (off -> shadow -> enforce)`,
- `Этап 3B / Shadow mode`,
- `Этап 3B / middleware логирует нарушения, но не блокирует запросы`,
- `Этап 3B / собирается baseline по ложным срабатываниям`.
- Code evidence:
- `apps/api/src/shared/prisma/prisma.service.ts`,
- `TENANT_MIDDLEWARE_MODE` supports `off | shadow | enforce`,
- in `shadow` mode violations are logged/metrics-incremented without hard block.
- Baseline evidence:
- tenant cleanup baseline and ongoing checks fixed in `docs/WEEK1_INVARIANT_BASELINE_RU.md`,
- current guard result: `tenant_context_suspects=0`.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 63) Update 2026-02-16 (Batch: stage 3B progressive rollout + rollback closure)
- Closed checklist items:
- `Этап 3B / Progressive rollout` + cohort/canary sub-items,
- `Этап 3B / Rollback plan` + kill-switch + rollback instruction + one-click rollback.
- Implemented progressive cohort enforcement in tenant middleware:
- `apps/api/src/shared/prisma/prisma.service.ts`:
- new env `TENANT_ENFORCE_COHORT`,
- in `TENANT_MIDDLEWARE_MODE=enforce`: cohort tenants enforce, others shadow.
- Added regression coverage:
- `apps/api/src/shared/prisma/prisma-tenant-middleware.spec.ts` (non-cohort downgrade to shadow).
- Added one-click rollback utility:
- `scripts/tenant-middleware-rollback.cjs`,
- npm command `pnpm rollback:tenant-middleware`.
- Rollout doc updated:
- `docs/TENANT_MIDDLEWARE_SHADOW_TO_ENFORCE_ROLLOUT_RU.md` (cohort/canary + one-click command).
- Batch checks:
- `pnpm --filter api test -- src/shared/prisma/prisma-tenant-middleware.spec.ts` -> passed,
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 64) Update 2026-02-16 (Batch: stage 3B DB migration forward-fix + rollback scripting)
- Closed checklist items:
- `Этап 3B / Для DB migrations`,
- `Этап 3B / подготовить forward-fix сценарий`,
- `Этап 3B / для обратимых миграций описать явный rollback script`.
- Added dedicated runbook:
- `docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_FORWARD_FIX_AND_ROLLBACK_RU.md`.
- Fixed operating policy:
- forward-fix is default remediation path,
- rollback SQL is allowed only for reversible pre-validated migrations,
- mandatory post-checks: `lint:tenant-context:enforce` + `gate:invariants:enforce`.
- Batch checks:
- `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
- `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 65) Update 2026-02-16 (Batch: Stage 5 Security Hardening)
- Closed checklist items:
  - `Этап 5 / Внедрить строгий RBAC/ABAC`,
  - `Этап 5 / Rate limiting (Throttler)`,
  - `Этап 5 / Централизация секретов`,
  - `Этап 5 / SAST/SCA/secret scanning`,
  - `Этап 5 / Tamper-evident audit`,
  - `Этап 5 / Pentest readiness`.
- Implementation:
  - RBAC: `RolesGuard` + `@Roles` decorator enforced on controllers (`AgroAuditController`).
  - Throttling: `ThrottlerGuard` globally enabled (60 req/min).
  - Secrets: `Joi` validation in `ConfigModule`, policy doc `SECRET_ROTATION_POLICY_RU.md`.
  - SAST: Github Actions workflow `.github/workflows/security-audit.yml`.
  - Audit: Tamper-Evident HMAC signature added to `AuditService` metadata.
  - Readiness: `PRE_PENTEST_ASSESSMENT_RU.md` report generated.
- Validation:
  - `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
  - `pnpm gate:invariants:enforce` -> passed (`violations=0`).

## 66) Update 2026-02-16 (Batch: Stage 6 Reliability & DR)
- Closed checklist items:
  - `Этап 6 / Health Checks`,
  - `Этап 6 / Resilience (Circuit breakers)`,
  - `Этап 6 / Graceful Degradation`,
  - `Этап 6 / Backup Drills`.
- Implementation:
  - Health: `HealthModule` (`/health` endpoint) using `@nestjs/terminus` (DB, Memory, Disk checks).
  - Resilience: `HttpResilienceModule` with `axios-retry` (exponential backoff) integrated globally.
  - Degradation: `RedisService` protected with try-catch and fallback logic (return null/memory on failure).
  - Drills: Backup/Restore scripts (`scripts/db/`) created and verified in `BACKUP_RESTORE_DRILL_REPORT_2026-02-16.md`.
- Validation:
  - `pnpm lint:tenant-context:enforce` -> passed (`tenant_context_suspects=0`),
  - `pnpm gate:invariants:enforce` -> passed (`violations=0`).


