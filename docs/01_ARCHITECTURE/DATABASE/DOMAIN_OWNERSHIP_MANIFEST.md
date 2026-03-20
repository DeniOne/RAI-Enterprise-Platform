---
id: DOC-ARC-DATABASE-DOMAIN-OWNERSHIP-MANIFEST-ZVPM
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DOMAIN_OWNERSHIP_MANIFEST

## Purpose

Это канонический ownership-manifest для schema fragmentation и boundary governance.

Жесткие правила:
- каждая модель принадлежит одному owner domain;
- cross-domain relation без ADR запрещён;
- domain ownership важнее расположения модели в текущем `schema.prisma`;
- `MG-Core` не может быть owner для current contour.

## Top-level domains for first iteration

В первой итерации фиксируются только 8 верхнеуровневых доменов:
- `platform_core`
- `org_legal`
- `agri_planning`
- `agri_execution`
- `finance`
- `crm_commerce`
- `ai_runtime`
- `integration_reliability`

Подконтуры:
- `ai_runtime/knowledge_memory`
- `ai_runtime/risk_governance`
- `quarantine_sandbox/research_rd`
- `legacy_bridge`

## Ownership table

| Domain | Ownership type | Current contour ownership | Allowed outbound | Forbidden direct coupling | File target |
| --- | --- | --- | --- | --- | --- |
| `platform_core` | authoritative | identities, auth, tenant context, audit | none except technical helpers | нельзя делать surrogate business root через `TenantState` или `User` | `01_platform_core.prisma` |
| `org_legal` | authoritative | `Company`, legal/compliance/regulatory models | `platform_core` | нельзя быть hidden tenant root | `02_org_legal.prisma` |
| `agri_planning` | authoritative | `Field`, `Season`, `TechMap`, planning catalogs and rules | `platform_core`, limited refs to `crm_commerce` | нельзя отдавать deep planning graph во все остальные домены | `03_agri_planning.prisma` |
| `agri_execution` | authoritative | `Task`, `HarvestPlan`, `DeviationReview`, `CmrDecision`, `CmrRisk`, observations/results | `agri_planning`, `platform_core` | нельзя давать finance и AI писать в execution state напрямую | `04_agri_execution.prisma` |
| `finance` | authoritative | `EconomicEvent`, `LedgerEntry`, budgets, balances, finance scenarios | `platform_core` and source aggregate IDs only | нельзя читать agronomy через deep traversal | `05_finance.prisma` |
| `crm_commerce` | authoritative | parties, contracts, obligations, front-office business workspace | `platform_core`, `org_legal` | нельзя собирать operator workspaces из deep legal/commerce graph | `06_crm_commerce.prisma` |
| `ai_runtime` | authoritative for control-plane, supporting for recommendations | agent config, incidents, evals, governance events | governed commands only | нельзя владеть business aggregates | `07_ai_runtime.prisma` |
| `integration_reliability` | cross-cutting | outbox, idempotency, transport, delivery control | none | нельзя превращать technical tables в business source-of-truth | `08_integration_reliability.prisma` |
| `quarantine_sandbox/research_rd` | quarantine | research, experimentation, exploration | derived findings only | нельзя встраивать sandbox lifecycle в live operational graph | `09_quarantine_sandbox.prisma` |
| `legacy_bridge` | migration-only | compatibility mappings, archive adapters, MG-Core bridges | none | нельзя использовать как постоянный ownership layer | `10_legacy_bridge.prisma` |

## Subcontours inside `ai_runtime`

### `ai_runtime/knowledge_memory`
Owns:
- `MemoryEntry`
- `MemoryInteraction`
- `MemoryEpisode`
- `MemoryProfile`
- `Engram`
- `SemanticFact`
- `KnowledgeNode`
- `KnowledgeEdge`

Rule:
- memory не становится параллельным source of truth для business domains.

### `ai_runtime/risk_governance`
Owns:
- `RiskSignal`
- `RiskAssessment`
- `RiskStateHistory`
- `DecisionRecord`
- `GovernanceLock`
- `OverrideRequest`
- `ApprovalRequest`
- governance-adjacent AI/runtime policy objects

Rule:
- risk/governance reasoning идёт по фактам и событиям, а не через ownership чужих lifecycle.

## Cross-domain rules

Разрешено:
- `finance` читает facts/projections из `agri_execution`;
- `ai_runtime` читает projections из business domains;
- `crm_commerce` использует legal projections из `org_legal`;
- `integration_reliability` принимает технические события от всех доменов.

Запрещено:
- `Company` как транзитивный корень всех связей;
- `finance` через `Season -> HarvestPlan -> TechMap -> Task` graph walks;
- `ai_runtime` с прямой записью в business aggregates;
- `integration_reliability` с hidden business ownership;
- `research_rd` с прямой мутацией operational tables.

## Required checks

Нужно проверять в CI:
- новая модель имеет owner domain;
- новая relation не нарушает ownership rules;
- новый fragment file не вводит второй owner для модели;
- subcontours `knowledge_memory` и `risk_governance` не дрейфуют в отдельные top-level domains без ADR.

## Per-model coverage

Per-model owner coverage (current contour) ведется в:
- `docs/01_ARCHITECTURE/DATABASE/MODEL_SCOPE_MANIFEST.md`

Текущее покрытие:
- `195/195` моделей active `schema.prisma` имеют `owner_domain`.

## Phase gate

Переход к schema fragmentation запрещён, пока:
- manifest не покрывает все high-risk модели;
- ownership по `Company`, `Tenant`, `TenantCompanyBinding`, `TenantState`, `AgentConfiguration`, `EventConsumption`, `OutboxMessage` не зафиксирован;
- policy для read models не утверждена.
