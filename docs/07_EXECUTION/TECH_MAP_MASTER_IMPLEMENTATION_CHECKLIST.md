---
id: DOC-EXE-TECH-MAP-MASTER-IMPLEMENTATION-CHECKLIST-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-22
claim_id: CLAIM-EXE-TECH-MAP-MASTER-IMPLEMENTATION-CHECKLIST-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-22
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md;docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-1_SLOT_REGISTRY_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md;apps/api/src/shared/tech-map;apps/api/src/modules/tech-map
---
# TECH MAP Master Implementation Checklist

## CLAIM
id: CLAIM-EXE-TECH-MAP-MASTER-IMPLEMENTATION-CHECKLIST-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-22

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
| `TMW-1` | slot registry | `IN_PROGRESS` | shared registry и первый runtime-consumer уже есть, rollout ещё не завершён |
| `TMW-2` | canonical artifact schema | `IN_PROGRESS` | shared artifact/state/conflict/clarify types готовы, canonical mapper ещё не завершён |
| `TMW-3` | clarify loop engine | `PLANNED` | в spec описан, runtime subprocess ещё не собран |
| `TMW-4` | semantic frame extension | `PLANNED` | tech-map specialization в spec есть, кодовый ingress-frame пакет ещё не собран |
| `TMW-5` | workflow orchestrator | `PLANNED` | first-class owner-led phase engine ещё не реализован |
| `TMW-6` | branch contracts + conflict authority | `IN_PROGRESS` | shared contracts/helpers готовы, runtime adoption ещё не доведён |
| `TMW-7` | trust + composition | `PLANNED` | platform trust layer уже есть, tech-map specialization ещё не собрана |
| `TMW-8` | persistence / versioning gate | `IN_PROGRESS` | shared state helpers, `FSM` и write-guards начаты, immutable snapshots ещё не завершены |
| `TMW-9` | expert review gate | `PLANNED` | spec есть, runtime gate ещё не собран |

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
- [ ] Подключить registry к `clarify batch assembly`
- [ ] Подключить registry к readiness scoring в `Supervisor/ingress`
- [ ] Подключить registry к publication/review checks

### 5.2 `TMW-2` — Canonical Artifact Schema

Пакет: [TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md)

- [x] Ввести shared contracts `artifact/state/conflict/clarify`
- [x] Собрать barrel export
- [ ] Ввести canonical mapper `Prisma -> TechMapCanonicalDraft`
- [ ] Ввести invariant checks для root aggregate и variants
- [ ] Подключить canonical draft к explainability / review packet read-model
- [ ] Подготовить API-read contract для governed draft

### 5.3 `TMW-3` — Clarify Loop Engine

- Пакет: [TECH_MAP_TMW-3_CLARIFY_LOOP_ENGINE_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-3_CLARIFY_LOOP_ENGINE_IMPLEMENTATION_PLAN.md)

- [ ] Ввести persisted `clarify batch`
- [ ] Ввести `resume token` и `resume state`
- [ ] Ввести `ONE_SHOT / MULTI_STEP` логику
- [ ] Ввести `TTL / expiration / recheck`
- [ ] Подключить `clarify` к tech-map intake path
- [ ] Подключить `clarify` к workflow resume path

### 5.4 `TMW-4` — Semantic Frame Extension

- Пакет: [TECH_MAP_TMW-4_SEMANTIC_FRAME_EXTENSION_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-4_SEMANTIC_FRAME_EXTENSION_IMPLEMENTATION_PLAN.md)

- [ ] Расширить semantic ingress frame для tech-map workflow
- [ ] Развести `new_draft / rebuild / compare / revise / resume_clarify`
- [ ] Научить ingress frame отдавать `required_actions`, `policy posture`, `workflow stage`
- [ ] Подключить frame к owner handoff для Техкарты

### 5.5 `TMW-5` — Workflow Orchestrator

- Пакет: [TECH_MAP_TMW-5_WORKFLOW_ORCHESTRATOR_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-5_WORKFLOW_ORCHESTRATOR_IMPLEMENTATION_PLAN.md)

- [ ] Ввести first-class `TechMapWorkflowOrchestrator`
- [ ] Собрать phase engine `INTAKE -> TRIAGE -> BRANCHING -> TRUST -> COMPOSITION`
- [ ] Развести `parallel / sequential / blocking` ветки
- [ ] Ввести owner-led coordination между `agronomist`, finance, compliance, evidence, risk
- [ ] Подключить workflow trace/audit artifacts

### 5.6 `TMW-6` — Branch Contracts + Conflict Authority

Пакет: [TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md)

- [x] Ввести `TechMapBranchResultContract`
- [x] Ввести `TechMapExpertReviewResult`
- [x] Ввести helper агрегации `workflow verdict`
- [x] Ввести helper `source authority`
- [x] Покрыть helpers unit-spec
- [ ] Подключить verdict aggregation в orchestrator/composer
- [ ] Подключить authority helper в context assembly/conflict resolution
- [ ] Подключить branch contracts к реальным tech-map веткам

### 5.7 `TMW-7` — Trust + Composition

- Пакет: [TECH_MAP_TMW-7_TRUST_COMPOSITION_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-7_TRUST_COMPOSITION_IMPLEMENTATION_PLAN.md)

- [ ] Собрать tech-map specialization поверх platform `Branch Trust Gate`
- [ ] Развести `facts / derived metrics / assumptions / recommendations / gaps`
- [ ] Подключить composition только из разрешённых branch payloads
- [ ] Подключить honest disclosure по `PARTIAL / UNVERIFIED / BLOCKED`
- [ ] Подключить variant comparison composition

### 5.8 `TMW-8` — Persistence / Versioning Gate

Пакет: [TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md)

- [x] Ввести shared state taxonomy и helpers
- [x] Начать `FSM` hardening
- [x] Начать service write-guards
- [ ] Ввести immutable review snapshot
- [ ] Ввести approval snapshot
- [ ] Ввести publication lock / supersede trail
- [ ] Подготовить migration path для persistence extensions

### 5.9 `TMW-9` — Expert Review Gate

- Пакет: [TECH_MAP_TMW-9_EXPERT_REVIEW_GATE_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/TECH_MAP_TMW-9_EXPERT_REVIEW_GATE_IMPLEMENTATION_PLAN.md)

- [ ] Ввести policy-driven invocation `chief_agronomist`
- [ ] Подключить `TechMapExpertReviewResult` в orchestrator
- [ ] Зафиксировать `APPROVE_WITH_NOTES / REVISE / BLOCK` как governed review decision
- [ ] Подключить review result к audit/explainability
- [ ] Запретить bypass human agronomy authority

## 6. Что уже делается прямо сейчас

Текущий активный execution-срез:

1. `TMW-1`
   Уже сделано:
   - shared slot registry
   - helpers
   - первый runtime-consumer в `generate_tech_map_draft`

2. `TMW-2`
   Уже сделано:
   - shared canonical contracts
   Следующий незакрытый узел:
   - canonical mapper

3. `TMW-6`
   Уже сделано:
   - branch contracts
   - verdict aggregation helper
   - conflict authority helper
   Следующий незакрытый узел:
   - runtime adoption в orchestrator/composer

4. `TMW-8`
   Уже сделано:
   - shared state helpers
   - `FSM` и service write-guards
   Следующий незакрытый узел:
   - immutable review/approval/publication snapshots

## 7. Что нельзя делать вне очереди

- не начинать `TMW-5 Workflow Orchestrator`, пока не зафиксированы `TMW-1`, `TMW-2` и runtime adoption `TMW-6`
- не начинать persistence-heavy `TMW-8 PR D`, пока не готов canonical mapper из `TMW-2`
- не включать `TMW-9 Expert Review Gate`, пока нет честного `TMW-7 Trust + Composition`
- не выдавать пользователю “готовую Техкарту”, пока `TMW-7` и publication boundary `TMW-8` не закрыты

## 8. Ближайший управляемый маршрут

Следующая последовательность работ должна быть такой:

1. закрыть `TMW-2 PR B` — canonical mapper
2. закрыть `TMW-6 PR D` — runtime adoption authority/verdict helpers
3. собрать `TMW-4` — semantic frame extension
4. собрать `TMW-3` — clarify loop engine
5. после этого переходить к `TMW-5` orchestrator

Причина:

- это минимальный путь, после которого Техкарта начнёт быть не набором helper-ов и spec-доков, а реальным governed workflow runtime.

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
- explainability и audit показывают basis, gaps, assumptions, verdicts и approvals
