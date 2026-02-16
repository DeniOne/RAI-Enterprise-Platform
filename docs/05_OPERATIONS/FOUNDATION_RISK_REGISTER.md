---
id: DOC-OPS-RISK-001
layer: Operations
type: Report
status: approved
version: 1.0.0
---

# FOUNDATION RISK REGISTER (RU)

Дата: 2026-02-15
Область: Stabilization Program (tenant/ledger/FSM/events)

## Владельцы контуров
- Architecture: Platform Architecture Lead
- Security: Security Lead
- Data: Data/DB Lead
- SRE: Reliability Lead

## Weekly Risk Review
- Частота: еженедельно, понедельник 10:00 (UTC+3)
- Вход: `scripts/invariant-gate.cjs --mode=enforce`, `scripts/lint-tenant-context.cjs --format=summary`, инциденты P0/P1, тренды SLO
- Выход: обновление risk levels, список corrective actions, дедлайны, ответственные

## Definition of Done для инвариантов
- Изменение tenant/FSM/ledger/event-контуров имеет тесты на позитивный и негативный путь
- `invariant-gate --mode=enforce` проходит без нарушений
- Нет роста `tenant_context_suspects` относительно baseline батча
- Есть rollback/mitigation шаги в runbook при изменении критичного поведения
- Обновлены релевантные ADR/Runbook/Checklist документы

## Merge Rule
- Merge запрещен при провале любого из обязательных гейтов:
- `verify-invariants`
- `gate:invariants:enforce`
- `gate:rollout`
- PR без подтвержденного tenant/FSM/ledger/event-контроля не допускается к merge.

## Текущие риски (snapshot)
- RISK-TENANT-001 | Tenant context gaps в legacy сервисах | High | Mitigation: batch hardening + lint gate
- RISK-FSM-001 | Часть переходов защищена только на сервисном уровне | Medium | Mitigation: DB-level enforcement rollout
- RISK-LEDGER-001 | Поэтапное усиление double-entry и immutability | Medium | Mitigation: staged DB checks + panic mode
- RISK-EVENT-001 | Риск деградации при replay/retry | Low | Mitigation: idempotency store + DLQ + runbook
