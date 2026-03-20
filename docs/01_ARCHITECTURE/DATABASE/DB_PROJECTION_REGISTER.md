---
id: DOC-ARC-DATABASE-DB-PROJECTION-REGISTER-1IZK
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_PROJECTION_REGISTER

## Purpose

Канонический registry read-model/projection слоя.
Projection без записи в этом файле создавать запрещено.

## Metadata contract

Для каждой projection обязательно:
- `owner_domain`
- `source_of_truth`
- `refresh_sla`
- `refresh_mechanism`
- `staleness_tolerance`
- `deterministic_rebuild`
- `deletion_reconciliation_semantics`
- `retention_policy`
- `consumers`
- `rollback_strategy`

## Registry

| Projection | Owner domain | Source of truth | Refresh SLA | Refresh mechanism | Staleness tolerance | Deterministic rebuild | Deletion/reconciliation semantics | Retention | Consumers | Rollback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `planning_workspace_projection` | `agri_execution` | `HarvestPlan`, `TechMap`, `BudgetPlan`, `DeviationReview`, `HarvestResult` | `<= 5 min` | outbox consumer + periodic reconcile | `up to 10 min` | `yes` | hard delete source => tombstone + rebuild sweep | `rolling 180 days` | planning workspace UI | fallback to bounded direct read |
| `party_workspace_projection` | `crm_commerce` | `Party`, `PartyRelation`, `CommerceContract`, `Invoice`, `Payment` | `<= 3 min` | outbox consumer + nightly full rebuild | `up to 5 min` | `yes` | source merge/delete => soft tombstone + relation compaction | `rolling 365 days` | CRM/front-office | fallback to domain APIs |
| `frontoffice_operator_projection` | `crm_commerce` | `FrontOfficeThread`, `FrontOfficeThreadMessage`, `FrontOfficeHandoffRecord` | `<= 1 min` | event-driven incremental updater | `up to 2 min` | `yes` | thread/archive => mark hidden + async cleanup | `rolling 90 days` | operator console | fallback to thread repository |
| `runtime_governance_projection` | `ai_runtime` | `RuntimeGovernanceEvent`, `SystemIncident`, `PendingAction` | `<= 30 sec` | event-driven projection worker | `up to 60 sec` | `yes` | incident merge/resolve => status fold + immutable event trail | `rolling 365 days` | governance dashboards | fallback to raw control-plane tables |

## Hard rules

- projection не может быть write model;
- projection не может иметь уникальный business invariant;
- projection owner обязан обеспечить deterministic rebuild path и reconciliation job.
