---
id: DOC-EXE-TECH-MAP-MASTER-IMPLEMENTATION-CHECKLIST-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-24
claim_id: CLAIM-EXE-TECH-MAP-MASTER-IMPLEMENTATION-CHECKLIST-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-24
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md;docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-1_SLOT_REGISTRY_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md;apps/api/src/shared/tech-map;apps/api/src/modules/tech-map
---
# TECH MAP Master Implementation Checklist

## CLAIM
id: CLAIM-EXE-TECH-MAP-MASTER-IMPLEMENTATION-CHECKLIST-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-24

## 0. Зачем нужен этот документ

Этот документ является верхнеуровневым execution-checklist для `TECH_MAP_GOVERNED_WORKFLOW`.

Его задача:

- показать полный маршрут реализации Техкарты от spec до runtime;
- развести `что уже сделано`, `что в работе`, `что ещё не начинали`;
- убрать ситуацию, когда отдельные `TMW`-пакеты понятны локально, но нет общей карты движения;
- дать техлиду и разработке единый чеклист прохождения пакетов и зависимостей.

## 1. Текущее состояние программы

| Блок | Смысл | Статус | Комментарий |
|---|---|---|---|
| `TMW-0` | spec и execution decomposition | `DONE` | основной spec и частные execution-пакеты уже собраны |
| `TMW-1` | slot registry | `DONE` | shared registry, query helpers and runtime consumers for clarify/readiness/publication are closed |
| `TMW-2` | canonical artifact schema | `DONE` | shared artifact/state/conflict/clarify types, canonical mapper и read-model consumer закрыты |
| `TMW-3` | clarify loop engine | `DONE` | clarify batch/resume helper, explicit resume endpoint, audit trail и supervisor intake wiring закрыты |
| `TMW-4` | semantic frame extension | `DONE` | specialization frame, compare/review/publication edge-cases и runtime handoff consumer закрыты |
| `TMW-5` | workflow orchestrator | `DONE` | first-class orchestrator service, live trust feed и final composition wiring уже закрыты, пакет завершён |
| `TMW-6` | branch contracts + conflict authority | `DONE` | shared contracts/helpers + runtime adoption snapshot wired, package closed |
| `TMW-7` | trust + composition | `DONE` | tech-map specialization, branch-gated composition и variant comparison report wired end-to-end |
| `TMW-8` | persistence / versioning gate | `DONE` | shared state helpers, `FSM`, persistence boundary read-model, head-draft write-guards и immutable snapshot storage/migration path уже завершены |
| `TMW-9` | expert review gate | `DONE` | policy-trigger helper, review packet contract, audit/publication chain и runtime adoption consumer закрыты |

## 2. Внешние зависимости программы

До полного закрытия Техкарты используются два платформенных контура:

| Внешний пакет | Для чего нужен | Статус |
|---|---|---|
| [SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md) | свободный вход -> semantic frame -> governed handoff | `IN_PROGRESS` |
| [BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md) | branch trust, verdicts, honest composition platform-уровня | `DONE` как platform baseline |

Норматив:

- `TMW-4`, `TMW-5`, `TMW-7`, `TMW-9` не должны собираться в отрыве от этих платформенных зависимостей;
- tech-map runtime обязан специализировать platform-baseline, а не дублировать его параллельной логикой.

## 3. Порядок реализации

Реальный порядок прохождения пакетов должен быть таким:

1. `TMW-0` — spec и execution decomposition
2. `TMW-1` — slot registry
3. `TMW-2` — canonical artifact schema
4. `TMW-6` — branch contracts + conflict authority
5. `TMW-4` — semantic frame extension
6. `TMW-3` — clarify loop engine
7. `TMW-5` — workflow orchestrator
8. `TMW-7` — trust + composition
9. `TMW-8` — persistence / versioning gate
10. `TMW-9` — expert review gate

Причина такого порядка:

- сначала фиксируются канонические contracts и registry;
- затем строятся ingress/clarify/orchestration слои;
- только потом замыкаются trust/composition/persistence/review boundaries.

## 4. Dependency map

| Пакет | Зависит от | Разблокирует |
|---|---|---|
| `TMW-1` | `TMW-0` | `TMW-3`, `TMW-4`, `TMW-5`, `TMW-7` |
| `TMW-2` | `TMW-0` | `TMW-5`, `TMW-7`, `TMW-8`, `TMW-9` |
| `TMW-3` | `TMW-1`, `TMW-4` | `TMW-5`, `TMW-7`, `TMW-9` |
| `TMW-4` | platform semantic ingress baseline, `TMW-1` | `TMW-3`, `TMW-5` |
| `TMW-5` | `TMW-1`, `TMW-2`, `TMW-3`, `TMW-4`, `TMW-6` | `TMW-7`, `TMW-8`, `TMW-9` |
| `TMW-6` | `TMW-0` | `TMW-5`, `TMW-7`, `TMW-9` |
| `TMW-7` | branch trust platform baseline, `TMW-2`, `TMW-5`, `TMW-6` | `TMW-8`, `TMW-9` |
| `TMW-8` | `TMW-2`, `TMW-5`, `TMW-7` | publication boundary |
| `TMW-9` | expert tier baseline, `TMW-5`, `TMW-7`, `TMW-8` | full governed review path |

## 5. Master checklist

### 5.0 `TMW-0` — Canonical spec baseline

- [x] Собрать основной spec [TECH_MAP_GOVERNED_WORKFLOW.md](/root/RAI_EP/docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md)
- [x] Добавить canonical domain model
- [x] Добавить state taxonomy
- [x] Добавить clarify subprocess model
- [x] Добавить conflict/source authority policy
- [x] Добавить finance/compliance constraints
- [x] Добавить expert review layer
- [x] Добавить diagrams и MVP slice

### 5.1 `TMW-1` — Slot Registry

Пакет: [TECH_MAP_TMW-1_SLOT_REGISTRY_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-1_SLOT_REGISTRY_IMPLEMENTATION_PLAN.md)

- [x] Ввести `TechMapSlotRegistryEntry`
- [x] Собрать initial registry
- [x] Добавить query helpers
- [x] Покрыть registry unit-spec
- [x] Подключить первый runtime-consumer к `generate_tech_map_draft`
- [x] Подключить registry к `clarify batch assembly`
- [x] Подключить registry к readiness scoring в `Supervisor/ingress`
- [x] Подключить registry к publication/review checks

### 5.2 `TMW-2` — Canonical Artifact Schema

Пакет: [TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md)

- [x] Ввести shared contracts `artifact/state/conflict/clarify`
- [x] Собрать barrel export
- [x] Ввести canonical mapper `Prisma -> TechMapCanonicalDraft`
- [x] Ввести invariant checks для root aggregate и variants
- [x] Подключить canonical draft к explainability / review packet read-model
- [x] Подготовить API-read contract для governed draft

### 5.3 `TMW-3` — Clarify Loop Engine

- Пакет: [TECH_MAP_TMW-3_CLARIFY_LOOP_ENGINE_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-3_CLARIFY_LOOP_ENGINE_IMPLEMENTATION_PLAN.md)

- [x] Ввести persisted `clarify batch`
- [x] Ввести `resume token` и `resume state`
- [x] Ввести `ONE_SHOT / MULTI_STEP` логику
- [x] Ввести `TTL / expiration / recheck`
- [x] Подключить `clarify` к tech-map intake path
- [x] Подключить `clarify` к workflow resume path
- [x] Подключить `clarify` к supervisor intake

### 5.4 `TMW-4` — Semantic Frame Extension

- Пакет: [TECH_MAP_TMW-4_SEMANTIC_FRAME_EXTENSION_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-4_SEMANTIC_FRAME_EXTENSION_IMPLEMENTATION_PLAN.md)

- [x] Расширить semantic ingress frame для tech-map workflow
- [x] Развести `create_new / rebuild_existing / compare_variants / review_draft / approve_publish / resume_clarify / explain_block`
- [x] Научить ingress frame отдавать `required_actions`, `policy posture`, `workflow stage`
- [x] Подключить frame к owner handoff для Техкарты
- [x] Закрыть compare / review / publication edge-cases и variant-count extraction

### 5.5 `TMW-5` — Workflow Orchestrator

- Пакет: [TECH_MAP_TMW-5_WORKFLOW_ORCHESTRATOR_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-5_WORKFLOW_ORCHESTRATOR_IMPLEMENTATION_PLAN.md)

- [x] Ввести first-class `TechMapWorkflowOrchestrator`
- [x] Собрать phase engine `INTAKE -> TRIAGE -> BRANCHING -> TRUST -> COMPOSITION`
- [x] Развести `parallel / sequential / blocking` ветки
- [x] Ввести owner-led coordination между `agronomist`, finance, compliance, evidence, risk
- [x] Подключить workflow trace/audit artifacts

### 5.6 `TMW-6` — Branch Contracts + Conflict Authority

Пакет: [TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md)

- [x] Ввести `TechMapBranchResultContract`
- [x] Ввести `TechMapExpertReviewResult`
- [x] Ввести helper агрегации `workflow verdict`
- [x] Ввести helper `source authority`
- [x] Покрыть helpers unit-spec
- [x] Подключить verdict aggregation в orchestrator/composer
- [x] Подключить authority helper в context assembly/conflict resolution
- [x] Подключить branch contracts к реальным tech-map веткам

### 5.7 `TMW-7` — Trust + Composition

- Пакет: [TECH_MAP_TMW-7_TRUST_COMPOSITION_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-7_TRUST_COMPOSITION_IMPLEMENTATION_PLAN.md)

- [x] Собрать tech-map specialization поверх platform `Branch Trust Gate`
- [x] Развести `facts / derived metrics / assumptions / recommendations / gaps`
- [x] Подключить composition только из разрешённых branch payloads
- [x] Подключить honest disclosure по `PARTIAL / UNVERIFIED / BLOCKED`
- [x] Подключить variant comparison composition

### 5.8 `TMW-8` — Persistence / Versioning Gate

Пакет: [TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md)

- [x] Ввести shared state taxonomy и helpers
- [x] Начать `FSM` hardening
- [x] Начать service write-guards
- [x] Ввести immutable review snapshot read-model
- [x] Ввести approval snapshot read-model
- [x] Ввести publication lock / supersede trail read-model
- [x] Подготовить migration path для persistence extensions

### 5.9 `TMW-9` — Expert Review Gate

- Пакет: [TECH_MAP_TMW-9_EXPERT_REVIEW_GATE_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-9_EXPERT_REVIEW_GATE_IMPLEMENTATION_PLAN.md)

- [x] Ввести policy-trigger helper для `chief_agronomist`
- [x] Подключить `TechMapExpertReviewResult` в orchestrator
- [x] Зафиксировать `APPROVE_WITH_NOTES / REVISE / BLOCK` как governed review decision
- [x] Подключить review result к orchestration summary и runtime adoption consumer
- [x] Подключить review result к full audit/explainability trail
- [x] Запретить bypass human agronomy authority в full publication path

## 6. Что уже делается прямо сейчас

Текущий активный execution-срез:

1. `TMW-1`
   Уже сделано:
   - shared slot registry
   - query helpers
   - first runtime-consumer in governed draft scoring
   - clarify/readiness/publication consumers
   Статус:
   - завершён, slot registry wired end-to-end

2. `TMW-2`
   Уже сделано:
   - shared canonical contracts
   - canonical mapper
   - governed draft read-model route
   - explainability/review read-model consumption
   Статус:
   - завершён, canonical schema closed end-to-end

3. `TMW-3`
   Уже сделано:
   - clarify batch builder
   - resume state builder
   - draft runtime consumer emits clarify lifecycle metadata
   - composer surfaces batch/resume metadata
   Статус:
   - завершён, clarify subprocess wired end-to-end

4. `TMW-4`
   Уже сделано:
   - semantic ingress frame specialization
   - workflow intent/stage/policy normalization
   - owner handoff consumer through supervisor runtime
   Статус:
   - завершён, runtime frame slice wired end-to-end

5. `TMW-6`
   Уже сделано:
   - branch contracts
   - verdict aggregation helper
   - conflict authority helper
   - runtime adoption snapshot consumer
   Следующий незакрытый узел:
   - нет, пакет `TMW-6` закрыт
   Статус:
   - завершён, runtime adoption wired end-to-end

6. `TMW-8`
   Уже сделано:
   - shared state helpers
   - `FSM` и service write-guards
   - persistence boundary read-model
   - create-next-version route
   Следующий незакрытый узел:
   - нет, пакет `TMW-8` закрыт
   Статус:
   - завершён, immutable storage/migration path реализован end-to-end

`TMW-4`, `TMW-5`, `TMW-7`, `TMW-8` и `TMW-9` уже завершены как runtime slices; `TMW-9` закрывает policy trigger helper, review packet contract, full audit/explainability trail и publication path.

## 7. Что нельзя делать вне очереди

- не начинать `TMW-5 Workflow Orchestrator` как отдельный новый пакет, пока не зафиксированы `TMW-1`, `TMW-2`, `TMW-3`, `TMW-4` и `TMW-6`
- не перепрыгивать через уже закрытые runtime slices и держать master-checklist как каноническую очередь работ

## 8. Ближайший управляемый маршрут

Следующая последовательность работ должна быть такой:

1. продолжать по master-checklist с ближайшего незакрытого узла, не перепрыгивая через текущий runtime status
2. держать `TMW-9` как закрытый governed slice и не размывать его обратно в execution-doc-only уровень

Причина:

- это сохраняет порядок чеклиста и доводит expert review до честной governed границы, не перепутывая её с human approval.

## 9. Definition of Done для всей программы

Программу `TECH_MAP_GOVERNED_WORKFLOW` можно считать доведённой до operational implementation baseline, когда одновременно выполнено всё ниже:

- все пакеты `TMW-1..TMW-9` имеют execution-доки и закрытые кодовые критерии
- semantic ingress понимает tech-map workflow как first-class intent
- missing context идёт через controlled `clarify`, а не через додумывание
- branch execution идёт через typed contracts
- overall verdict агрегируется детерминированно
- final composition строится только из разрешённых branch results
- review/approval/publication границы enforce-ятся в runtime и persistence
- expert-review слой не bypass-ит human authority
- explainability и audit показывают basis, gaps, assumptions, verdicts, expert-review packet и approvals
