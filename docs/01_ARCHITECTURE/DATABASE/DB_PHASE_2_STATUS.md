---
id: DOC-ARC-DATABASE-DB-PHASE-2-STATUS-18D5
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_PHASE_2_STATUS

## Scope

`Phase 2. Company De-Rooting`.

## Done

- [x] Зафиксирован baseline/target по `Company` relation graph в checklist/metrics.
- [x] Зафиксированы допустимые группы business/legal core связей.
- [x] Зафиксированы группы candidate связей для projection/indirect ownership.
- [x] Удалены direct `Company` relation-поля из control-plane/runtime/memory набора:
- [x] `SystemIncident`, `IncidentRunbookExecution`, `RuntimeGovernanceEvent`, `PerformanceMetric`, `PendingAction`.
- [x] `AgentConfiguration`, `AgentCapabilityBinding`, `AgentToolBinding`, `AgentConnectorBinding`, `AgentConfigChangeRequest`, `EvalRun`.
- [x] `KnowledgeNode`, `KnowledgeEdge`.
- [x] Подготовлен staged deprecation + compatibility read plan:
- [x] `DB_COMPANY_DEROOT_DEPRECATION_PLAN.md`.
- [x] Метрика direct relations снижена `140 -> 87` (target `<=95` достигнут).

## Not done / residual

- [x] Target Phase 2 `<=95` закрыт.
- [ ] Остается governance KPI для mixed-transition backlog (`17 -> 0`) в следующих волнах.

## Next slice

1. Закрыть mixed-transition backlog через controlled operational migrations.
2. Поддерживать запрет на возврат `Company` в platform-root роль через CI + ADR flow.
