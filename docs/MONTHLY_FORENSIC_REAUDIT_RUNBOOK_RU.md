---
id: DOC-OPS-RUN-135
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# MONTHLY FORENSIC RE-AUDIT RUNBOOK (RU)

Дата: 2026-02-16  
Частота: ежемесячно, первая рабочая неделя месяца.

## 1. Цель
- Выявлять регрессии инвариантов после стабилизации.
- Подтверждать, что tenant/ledger/FSM/events остаются в enforce-состоянии без деградации.

## 2. Scope re-audit
- Tenant isolation: middleware, guards, bypass-paths (jobs/events/raw SQL).
- Ledger safety: immutability, double-entry symmetry, idempotency replay-protection.
- FSM integrity: illegal transitions, race/conflict paths, side-effects atomicity.
- Event integrity: outbox ordering, dedupe, retry/DLQ, replay safety.

## 3. Процедура
1. Снять текущий snapshot метрик и alerts:
- `/api/invariants/metrics`
- `infra/monitoring/prometheus/invariant-alert-rules.yml`
2. Запустить обязательные гейты:
- `pnpm lint:tenant-context:enforce`
- `pnpm gate:invariants:enforce`
- `pnpm gate:rollout -- --input <snapshot.json>`
3. Проверить runbooks/ADR на drift:
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md`
- `docs/INVARIANT_SLO_POLICY_RU.md`
- `docs/ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_011_LEDGER_REDESIGN_STRATEGY.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_012_FINANCE_JOURNAL_POSTING_SETTLEMENT.md`
4. Зафиксировать findings и corrective actions.
5. Обновить weekly/monthly dashboard артефакты.

## 4. Stop/No-Go критерии
- Любой `P0`/critical invariant alert.
- Рост cross-tenant attempts или financial invariant failures.
- Непрохождение любого hard-fail gate.

## 5. Выходные артефакты
- Отчёт `forensic re-audit` (дата, findings, owner, сроки).
- Обновлённый риск-регистр с приоритетами remediation.
- Решение: `Continue rollout | Hold | Rollback`.
