---
id: DOC-OPS-POL-136
layer: Operations
type: Policy
status: approved
version: 1.0.0
---

# API / OUTBOX / FINANCE SLO-SLI + ERROR BUDGET POLICY (RU)

Дата: 2026-02-16  
Область: production reliability для API, outbox relay и finance ingestion/ledger.

## 1. SLI и SLO

### API
- `api_success_rate_30d` (2xx/3xx): SLO `>= 99.9%`
- `api_p95_latency_ms_30d`: SLO `<= 1200 ms`
- `api_5xx_rate_5m`: SLO `<= 1%`

### Outbox
- `outbox_delivery_success_rate_30d`: SLO `>= 99.9%`
- `outbox_oldest_pending_age_minutes`: SLO `<= 15`
- `outbox_dead_letter_rate_24h`: SLO `<= 0.1%`

### Finance
- `finance_command_success_rate_30d`: SLO `>= 99.95%`
- `financial_invariant_failures_delta_5m`: SLO `= 0`
- `financial_panic_mode`: SLO `OFF`

## 2. Error Budget

### API
- Monthly error budget: `0.1%` failed requests.
- Burn rules:
- `>50%` за 7 дней: freeze non-critical rollout.
- `>100%` за 30 дней: stop feature rollout, только reliability work.

### Outbox
- Monthly error budget: `0.1%` failed deliveries (после retries).
- Burn rules:
- `DLQ rate > 0.1%` за 24ч: incident `P1`, hold rollout.
- `oldest pending > 15m` устойчиво 30м: incident + containment.

### Finance
- Error budget: `0` для invariant breaches.
- Любой breach:
- auto-halt rollout,
- incident ticket (`P0/P1`),
- rollback/forward-fix по runbook.

## 3. Governance правила
- Решение `Go/No-Go` допускается только при green по SLO и invariant gates.
- При исчерпании бюджета приоритет roadmap автоматически смещается в reliability.
- Исключения только через явный incident command decision log.

## 4. Источники и enforcement
- Runtime: `/api/invariants/metrics`
- Alerts: `infra/monitoring/prometheus/invariant-alert-rules.yml`
- CI gates: `.github/workflows/invariant-gates.yml`
- Guard: `scripts/invariant-rollout-guard.cjs`
