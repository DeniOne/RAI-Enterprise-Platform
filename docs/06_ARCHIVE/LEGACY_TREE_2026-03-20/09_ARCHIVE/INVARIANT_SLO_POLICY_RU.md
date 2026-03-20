---
id: DOC-ARV-09-ARCHIVE-INVARIANT-SLO-POLICY-RU-1QT3
layer: Archive
type: Research
status: archived
version: 1.0.0
---
# INVARIANT SLO POLICY (RU)

Дата: 2026-02-15
Область: tenant, FSM, finance, memory hygiene, rollout safety.

## 1. Назначение
- Задать измеримые SLO/SLI для инвариантов.
- Ввести машинно-проверяемые stop-conditions для progressive rollout.
- Убрать ручные/субъективные решения Go/No-Go.

## 2. SLI и пороги (production)
- `tenant_violation_rate_delta_5m`: целевое значение `0`, допустимый порог `0`.
- `cross_tenant_access_attempts_delta_5m`: целевое значение `0`, допустимый порог `0`.
- `illegal_transition_attempts_delta_10m`: целевое значение `0`, допустимый порог `0`.
- `financial_invariant_failures_delta_5m`: целевое значение `0`, допустимый порог `0`.
- `financial_panic_mode`: всегда `OFF`.
- `memory_oldest_unconsolidated_age_seconds`: operational threshold `<= 21600` (warning contour, не auto-stop сам по себе).
- `memory_prunable_consolidated_interactions`: operational threshold `<= 1000` (warning contour, не auto-stop сам по себе).
- `memory_latest_engram_formation_age_seconds`: operational threshold `<= 604800` (warning contour, не auto-stop сам по себе).
- `memory_oldest_engram_formation_candidate_age_seconds`: operational threshold `<= 604800` when `memory_engram_formation_candidates > 0`.
- `memory_prunable_active_engrams`: operational threshold `<= 500` (warning contour, не auto-stop сам по себе).
- `memory_engram_formation_budget_usage_ratio`: target `< 0.8`, `0.8-1.0` = burn-high early warning, `> 1.0` = threshold breach.
- `memory_engram_pruning_budget_usage_ratio`: target `< 0.8`, `0.8-1.0` = burn-high early warning, `> 1.0` = threshold breach.
- `invariant_memory_auto_remediation_failures_total`: target `no increase over 1h` while `memory_auto_remediation_enabled = 1`.
- sustained positive delta across `6h + 24h` windows for those ratios = multi-window burn-rate escalation, even before hard breach.

## 3. Recovery SLA
- `P0` (tenant leak, financial panic): containment до 5 минут, recovery до 60 минут.
- `P1` (illegal FSM transitions without leak): containment до 30 минут, recovery до 4 часов.
- Любой breach SLO: автоматический halt rollout + обязательный incident ticket.

## 4. Rollout stop conditions
- Если breached любой release-blocking инвариант из раздела 2 (`tenant`, `FSM`, `finance`) -> `STOP`.
- Если активирован `financial_panic_mode` -> `STOP`.
- Breach memory hygiene operational thresholds сам по себе не равен `STOP`, но требует maintenance triage и corrective action.
- Multi-window burn-rate alerts по memory lifecycle сами по себе не равны `STOP`, но требуют same-day maintenance escalation и explicit owner assignment.
- `RAIMemoryAutoRemediationFailures` сам по себе не равен `STOP`, но переводит memory lifecycle в manual-ops mode до восстановления automation path.
- Если наблюдается деградация системных метрик (при наличии):
- `http_5xx_rate` > `0.01` (1%) -> `STOP`.
- `http_4xx_rate` > `0.10` (10%) -> `STOP`.
- `p95_latency_ms` > `1200` -> `STOP`.

## 5. Rollout resume conditions
- Все инвариантные breaches устранены.
- В течение 30 минут нет новых нарушений инвариантов.
- System health вернулся в пределы порогов.
- Пройден canary stage без новых critical alerts.

## 6. Enforcement
- Использовать `scripts/invariant-rollout-guard.cjs` как release gate.
- В CI/CD режим: `hard-fail`.
- Результат gate хранить как артефакт релиза.

## 7. Источник данных
- Runtime endpoint: `/api/invariants/metrics`
- Operator control-plane: `/api/memory/maintenance/control-plane`
- Prometheus counters/rules:
- `invariant_tenant_violation_rate`
- `invariant_cross_tenant_access_attempts_total`
- `invariant_illegal_transition_attempts_total`
- `invariant_financial_failures_total`
- `memory_oldest_unconsolidated_age_seconds`
- `memory_prunable_consolidated_interactions`
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
- `memory_consolidation_paused`
- `memory_consolidation_pause_remaining_seconds`
- `memory_pruning_paused`
- `memory_pruning_pause_remaining_seconds`
- `memory_engram_formation_paused`
- `memory_engram_formation_pause_remaining_seconds`
- `memory_engram_pruning_paused`
- `memory_engram_pruning_pause_remaining_seconds`
