---
id: DOC-OPS-DASH-133
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# INVARIANT MATURITY DASHBOARD (RU)

Дата: 2026-02-16  
Область: tenant / ledger / FSM / events + shadow-mode violations.

## 1. Назначение
- Единая панель зрелости стабилизации по 4 инвариантным контурам.
- Отдельный вид нарушений `shadow-mode` для безопасного перехода `shadow -> enforce`.
- Основа для weekly `Green | Yellow | Red` решения и Go/No-Go.

## 2. Источники данных
- Runtime metrics: `/api/invariants/metrics`
- Prometheus endpoint: `/api/invariants/metrics/prometheus`
- Alert rules: `infra/monitoring/prometheus/invariant-alert-rules.yml`
- Weekly snapshot: `docs/WEEKLY_INVARIANT_TREND_REVIEW_RU.md`

## 3. Обязательные виджеты
1. `Tenant Isolation`
- `tenant_violation_rate`
- `cross_tenant_access_attempts_total`
- breakdown: `per-tenant`, `per-module`

2. `Ledger Safety`
- `financial_invariant_failures_total`
- `financial_panic_mode`
- reconciliation alerts

3. `FSM Integrity`
- `illegal_transition_attempts_total`
- illegal transition alerts

4. `Event Integrity`
- outbox retry/dead-letter индикаторы
- replay/duplicate prevention counters

5. `Shadow-Mode Violations`
- отдельный график нарушений middleware в `TENANT_MIDDLEWARE_MODE=shadow`
- top endpoints/modules по нарушениям
- динамика по canary cohort

## 4. Maturity Scorecard (еженедельно)
- `Green`: нет critical alerts, все 4 контура в пределах SLO.
- `Yellow`: есть degradations без P0, rollout ограничен/hold.
- `Red`: breach SLO/P0, rollout stop + rollback.

## 5. Операционное правило
- Дашборд обновляется на каждом weekly review.
- Решение `Continue rollout | Hold | Rollback` принимается только на основе dashboard + alert runbook.
