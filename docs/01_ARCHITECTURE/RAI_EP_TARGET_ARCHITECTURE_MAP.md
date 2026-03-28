---
id: DOC-ARC-RAI-EP-TARGET-ARCHITECTURE-MAP-20260328
layer: Architecture
type: Topology
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-ARC-RAI-EP-TARGET-ARCHITECTURE-MAP-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md;docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md;apps/api/src/main.ts;apps/web;apps/telegram-bot
---
# RAI_EP TARGET ARCHITECTURE MAP

## CLAIM
id: CLAIM-ARC-RAI-EP-TARGET-ARCHITECTURE-MAP-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Архитектурный принцип

Архитектура `RAI_EP` строится не вокруг интерфейсов и не вокруг AI, а вокруг управляемого доменного ядра, где техкарта является центральным исполнимым артефактом.

## Целевые слои системы

### Layer 1. Interaction Layer
- web
- telegram
- internal chat и operator surfaces
- administrative panels

### Layer 2. Governed Application Layer
- auth
- tenant context
- routing
- policy enforcement
- orchestration
- command/query split

### Layer 3. Core Domain Layer
- TechMap
- season execution
- finance/economy
- deviations and risk
- CRM/front-office entities
- legal and audit-significant events

### Layer 4. AI / Agent Runtime Layer
- semantic routing
- evidence-first generation
- governed tool access
- uncertainty handling
- HITL
- incidents, scorecards и evals

### Layer 5. Data / Evidence / Audit Layer
- primary domain data
- audit trail
- explainability traces
- incidents
- retention metadata
- immutable evidence artifacts

### Layer 6. Governance / Security / Compliance Layer
- release gates
- secrets, licenses, SBOM
- privacy/legal controls
- access review
- support and ownership model

### Layer 7. Deployment / Operations Layer
- self-host topology
- managed topology
- backup, restore и DR
- install and upgrade pack
- monitoring и support boundaries

## Главная архитектурная ось

```text
Interaction -> Application Governance -> Domain Core -> Evidence/Audit -> Release/Operations
                           \\-> AI Runtime (только как governed усилитель)
```

Смысл: AI не должен становиться параллельной системой принятия решений вне доменного ядра и policy.

## Boundaries

### Ядро
- TechMap
- season execution
- economics
- explainability
- multi-tenant integrity

### Усилители
- AI assistance
- CRM/front-office
- external integrations
- dashboards

### Внешние зависимости
- providers
- messaging platforms
- deployment infrastructure
- storage and backup contour

## Source-of-truth map

- замысел -> `docs/00_STRATEGY/*`
- архитектурные границы -> `docs/01_ARCHITECTURE/*`
- domain lifecycle -> `docs/02_DOMAINS/*`
- AI rules -> `docs/04_AI_SYSTEM/*`
- release/compliance -> `docs/05_OPERATIONS/*`
- фактическое поведение -> `code / tests / gates / generated artifacts`
- датированные audit snapshots -> `docs/_audit/*`

## Deployment topologies

### Базовый реалистичный путь
`self-host / localized`

### Частично готовые
- managed deployment
- controlled pilot

### Не считать канонически готовым без отдельного закрытия
- external SaaS rollout
- hybrid variants без формальной data-boundary карты

## Архитектурные запреты

- не строить новые каналы поверх обхода policy;
- не давать агентам универсальный доступ к tools;
- не держать доменную логику в UI;
- не подменять architecture docs датированными audit snapshots;
- не расширять perimeter быстрее, чем закрываются release controls.
