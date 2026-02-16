---
id: DOC-OPS-REP-003
layer: Operations
type: Report
status: draft
version: 0.1.0
---

# WEEK 2 PROGRESS (RU)

Дата: 2026-02-15

## Выполнено
- Добавлен invariant gate с режимами `warn/enforce`: `scripts/invariant-gate.cjs`.
- Подключены npm-команды `gate:invariants:*` в `package.json`.
- Добавлены базовые runtime-метрики инвариантов:
  - `tenant_violation_rate`
  - `cross_tenant_access_attempts_total`
  - `illegal_transition_attempts_total`
  - `financial_invariant_failures_total`
- Добавлен защищённый endpoint метрик:
  - `GET /api/invariants/metrics` (JWT guard).
  - В endpoint добавлены `thresholds/alerts` и breakdown:
    - `tenantViolationsByTenant`
    - `tenantViolationsByModule`
- Добавлен Ledger DB-enforcement PoC:
  - immutability triggers на `ledger_entries` (block UPDATE/DELETE when `isImmutable=true`)
  - unique index для idempotency (`economic_events.companyId + metadata.idempotencyKey`)
  - check constraint для `ledger_entries.type IN ('DEBIT','CREDIT')`
  - deferred constraint trigger для double-entry symmetry (`DEBIT sum == CREDIT sum` по `economicEventId`)
- Усилен idempotency flow в финансовом ingest:
  - обработка `P2002` дублей по `metadata.idempotencyKey` с возвратом существующего `EconomicEvent`
  - флаг строгого режима `FINANCIAL_REQUIRE_IDEMPOTENCY=true`
- Outbox relay переведён с `$queryRaw` на Prisma claim pattern (raw SQL bypass закрыт)
- Добавлен financial panic mode (PoC):
  - auto-block `EconomyService.ingestEvent` при достижении порога `FINANCIAL_PANIC_THRESHOLD`
  - panic-state возвращается в `/api/invariants/metrics`
- Добавлен Prometheus-совместимый экспорт инвариант-метрик:
  - `GET /api/invariants/metrics/prometheus`
  - включает counters + breakdown labels (`tenant`, `module`)

## Технические точки
- Реестр метрик: `apps/api/src/shared/invariants/invariant-metrics.ts`
- Controller: `apps/api/src/shared/invariants/invariant-metrics.controller.ts`
- Module: `apps/api/src/shared/invariants/invariant-metrics.module.ts`
- Инкременты в tenant middleware: `apps/api/src/shared/prisma/prisma.service.ts`
- Инкремент illegal FSM transition: `apps/api/src/shared/state-machine/state-machine.interface.ts`

## Осталось до full observability
- Перенести counters в Prometheus/OpenTelemetry.
- Добавить dashboard и алерты по порогам.
- Добавить полноценные per-tenant/per-module labels в внешней метрик-системе.
