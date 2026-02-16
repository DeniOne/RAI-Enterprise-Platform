---
id: DOC-OPS-STD-132
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# INVARIANT SLO POLICY (RU)

Дата: 2026-02-15
Область: tenant, FSM, finance, rollout safety.

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

## 3. Recovery SLA
- `P0` (tenant leak, financial panic): containment до 5 минут, recovery до 60 минут.
- `P1` (illegal FSM transitions without leak): containment до 30 минут, recovery до 4 часов.
- Любой breach SLO: автоматический halt rollout + обязательный incident ticket.

## 4. Rollout stop conditions
- Если breached любой инвариант из раздела 2 -> `STOP`.
- Если активирован `financial_panic_mode` -> `STOP`.
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
- Prometheus counters/rules:
- `invariant_tenant_violation_rate`
- `invariant_cross_tenant_access_attempts_total`
- `invariant_illegal_transition_attempts_total`
- `invariant_financial_failures_total`

