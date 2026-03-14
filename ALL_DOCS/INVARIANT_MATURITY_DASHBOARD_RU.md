---
id: DOC-MET-INVARIANT-MATURITY-DASHBOARD-RU-I6C5
layer: Metrics
type: Report
status: approved
version: 1.0.0
---
# INVARIANT MATURITY DASHBOARD (RU)

Дата: 2026-02-16  
Область: tenant / ledger / FSM / events / memory hygiene + shadow-mode violations.

## 1. Назначение
- Единая панель зрелости стабилизации по 5 инвариантным контурам.
- Отдельный вид нарушений `shadow-mode` для безопасного перехода `shadow -> enforce`.
- Основа для weekly `Green | Yellow | Red` решения и Go/No-Go.

## 2. Источники данных
- Runtime metrics: `/api/invariants/metrics`
- Prometheus endpoint: `/api/invariants/metrics/prometheus`
- Operator control-plane: `/api/memory/maintenance/control-plane`
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

5. `Memory Hygiene`
- `memory_unconsolidated_interactions`
- `memory_oldest_unconsolidated_age_seconds`
- `memory_prunable_consolidated_interactions`
- `memory_oldest_prunable_consolidated_age_seconds`
- `memory_active_engrams`
- `memory_latest_engram_formation_age_seconds`
- `memory_engram_formation_candidates`
- `memory_oldest_engram_formation_candidate_age_seconds`
- `memory_prunable_active_engrams`
- `invariant_memory_engram_formations_total`
- `invariant_memory_engram_pruned_total`
- `invariant_memory_auto_remediations_total`
- `invariant_memory_auto_remediation_failures_total`
- `memory_engram_formation_budget_usage_ratio`
- `memory_engram_pruning_budget_usage_ratio`
- `memory_auto_remediation_enabled`
- `burn-high / multi-window burn-rate alert state`
- `memory_consolidation_paused`
- `memory_consolidation_pause_remaining_seconds`
- `memory_pruning_paused`
- `memory_pruning_pause_remaining_seconds`
- `memory_engram_formation_paused`
- `memory_engram_formation_pause_remaining_seconds`
- `memory_engram_pruning_paused`
- `memory_engram_pruning_pause_remaining_seconds`
- `GET /api/memory/maintenance/control-plane` как operator view: `playbooks`, `recommendations`, `recentRuns`, `automation`

6. `Shadow-Mode Violations`
- отдельный график нарушений middleware в `TENANT_MIDDLEWARE_MODE=shadow`
- top endpoints/modules по нарушениям
- динамика по canary cohort

## 4. Maturity Scorecard (еженедельно)
- `Green`: нет critical alerts, все 5 контуров в пределах SLO/operational thresholds.
- `Yellow`: есть degradations без P0, rollout ограничен/hold.
- `Red`: breach SLO/P0, rollout stop + rollback.

## 5. Операционное правило
- Дашборд обновляется на каждом weekly review.
- Решение `Continue rollout | Hold | Rollback` принимается только на основе dashboard + alert runbook.
