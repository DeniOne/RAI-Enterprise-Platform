# RAI_EP — Target architecture map

**Назначение:** зафиксировать целевую карту слоёв, границ и потоков системы.

---

## 1. Архитектурный принцип

Архитектура `RAI_EP` строится не вокруг интерфейсов и не вокруг AI, а вокруг управляемого доменного ядра, где техкарта является центральным исполнимым артефактом.

---

## 2. Целевые слои системы

### Layer 1. Interaction Layer
- web
- telegram
- internal chat / operator surfaces
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
- legal/audit-significant events

### Layer 4. AI / Agent Runtime Layer
- semantic routing
- evidence-first generation
- governed tool access
- uncertainty handling
- HITL
- incidents / scorecards / evals

### Layer 5. Data / Evidence / Audit Layer
- primary domain data
- audit trail
- explainability traces
- incidents
- retention metadata
- immutable evidence artifacts

### Layer 6. Governance / Security / Compliance Layer
- release gates
- secrets / licenses / SBOM
- privacy/legal controls
- access review
- support and ownership model

### Layer 7. Deployment / Operations Layer
- self-host topology
- managed topology
- backup / restore / DR
- install / upgrade pack
- monitoring and support boundaries

---

## 3. Главная архитектурная ось

```text
Interaction -> Application Governance -> Domain Core -> Evidence/Audit -> Release/Operations
                           \-> AI Runtime (только как governed усилитель)
```

Смысл: AI не должен становиться параллельной системой принятия решений вне доменного ядра и policy.

---

## 4. Boundaries

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

---

## 5. Source-of-truth map

### Истина по замыслу
`docs/00_STRATEGY/*`

### Истина по архитектурным границам
`docs/01_ARCHITECTURE/*`

### Истина по domain lifecycle
`docs/02_DOMAINS/*`

### Истина по AI rules
`docs/04_AI_SYSTEM/*`

### Истина по release/compliance
`docs/05_OPERATIONS/*`

### Истина по фактическому поведению
`code / tests / gates / generated artifacts`

### Истина по датированным audit snapshots
`docs/_audit/*`

---

## 6. Deployment topologies

### Базовый реалистичный путь
`self-host / localized`

### Частично готовые
- managed deployment
- controlled pilot

### Не считать канонически готовым без отдельного закрытия
- external SaaS rollout
- hybrid variants без формальной data-boundary карты

---

## 7. Архитектурные запреты

- не строить новые каналы поверх обхода policy;
- не давать агентам универсальный доступ к tools;
- не держать доменную логику в UI;
- не подменять architecture docs датированными audit snapshots;
- не расширять perimeter быстрее, чем закрываются release controls.
