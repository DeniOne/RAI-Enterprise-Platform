---
id: DOC-EXE-TECH-MAP-TMW-6-BRANCH-CONTRACTS-CONFLICT-AUTHORITY-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-24
claim_id: CLAIM-EXE-TECH-MAP-TMW-6-BRANCH-CONTRACTS-CONFLICT-AUTHORITY-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-24
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;apps/api/src/shared/rai-chat/branch-trust.types.ts;apps/api/src/shared/tech-map/tech-map-governed-branch.types.ts;apps/api/src/shared/tech-map/tech-map-governed-verdict.helpers.ts;apps/api/src/shared/tech-map/tech-map-conflict-authority.helpers.ts;apps/api/src/shared/tech-map/tech-map-governed-conflict.types.ts;apps/api/src/shared/tech-map/tech-map-runtime-adoption.helpers.ts;apps/api/src/shared/tech-map/tech-map-governed-verdict.helpers.spec.ts;apps/api/src/shared/tech-map/tech-map-conflict-authority.helpers.spec.ts
---
# TECH MAP TMW-6 Branch Contracts Conflict Authority Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-6-BRANCH-CONTRACTS-CONFLICT-AUTHORITY-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-24

## 0. Цель пакета

`TMW-6` превращает branch architecture Техкарты в formal contract-layer с детерминированной authority и verdict aggregation model.

Целевой результат:

- каждая tech-map ветка имеет свой typed contract поверх generic `BranchResultContract`
- conflict authority становится machine-checkable policy, а не только spec-текстом
- workflow verdict агрегируется формальной функцией, а не prose-логикой composer-а

## 1. Что уже есть

Сейчас уже подтверждено:

- generic branch trust layer существует в `rai-chat`
- slot/conflict/state/artifact contracts для Техкарты уже начаты
- source authority policy и verdict aggregation rules описаны в основном spec

Текущий разрыв:

- нет отдельного tech-map branch contract file
- нет formal `workflow verdict aggregation` helper
- нет typed authority helper для source precedence, recency и scope specificity

## 2. Целевой результат пакета

После завершения `TMW-6` платформа должна иметь:

- `TechMapBranchResultContract`
- `TechMapExpertReviewResult`
- `TechMapWorkflowVerdictAggregationInput`
- `aggregateTechMapWorkflowVerdict(...)`
- `compare/select authority source` helpers

Эффект:

- trust/conflict/composition перестанут зависеть от рассеянной логики в нескольких местах

## 3. File-level scope

Файлы:

- [tech-map-governed-branch.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-branch.types.ts)
- [tech-map-governed-verdict.helpers.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-verdict.helpers.ts)
- [tech-map-governed-verdict.helpers.spec.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-verdict.helpers.spec.ts)
- [tech-map-conflict-authority.helpers.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-conflict-authority.helpers.ts)
- [tech-map-conflict-authority.helpers.spec.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-conflict-authority.helpers.spec.ts)
- [index.ts](/root/RAI_EP/apps/api/src/shared/tech-map/index.ts)

Будущие runtime consumers:

- tech-map orchestrator
- trust gate
- comparison/composer layer
- review packet assembly

## 4. PR-срезы

## 4.1 PR A — Branch contract types

Checklist:

- [x] ввести `TechMapBranchResultContract`
- [x] ввести `TechMapExpertReviewResult`
- [x] развести `publication_critical`, `assumptions_detail`, `gaps_detail`, `conflicts`

Эффект:

- tech-map branch payloads станут first-class typed contracts

## 4.2 PR B — Workflow verdict aggregation helper

Checklist:

- [x] зафиксировать `TechMapWorkflowVerdictAggregationInput`
- [x] реализовать formal aggregation helper
- [x] покрыть cases:
  - critical `BLOCKED`
  - advisory-only `PARTIAL`
  - selected variant `UNVERIFIED`
  - `expert_review = REVISE/BLOCK`
  - `comparison_report`

Эффект:

- overall workflow verdict станет детерминированным и тестируемым

## 4.3 PR C — Conflict authority helper

Checklist:

- [x] ввести authority classes
- [x] ввести precedence by slot family
- [x] реализовать compare/select helper с учётом:
  - authority rank
  - recency
  - scope specificity

Эффект:

- conflict resolution станет не только честно disclosed, но и формально разрешаемым

## 4.4 PR D — Runtime adoption

Checklist:

- [x] подключить aggregation helper в runtime adoption snapshot
- [x] подключить authority helper в conflict resolution stage
- [x] не ломать generic `rai-chat` trust layer
- [x] добавить runtime consumer `TechMapService.getRuntimeAdoptionSnapshot(...)`

Эффект:

- tech-map governed runtime начнёт реально опираться на новый contract-layer

## 5. Acceptance criteria

- branch contract не дублирует смысл generic `BranchResultContract`, а доменно уточняет его
- authority helper детерминированно выбирает winner или показывает отсутствие winner
- workflow verdict helper покрывает publication-critical и comparison semantics
- tests явно фиксируют aggregation and authority behavior

## 6. Definition of Done

Пакет `TMW-6` считается закрытым, когда:

- branch contract layer существует в shared code
- есть verdict aggregation helper и authority helper
- helpers покрыты unit-tests
- хотя бы один runtime consumer использует их
- `docs` и `memory-bank` синхронизированы
- `api` и `docs` проверки зелёные

Статус пакета:

- `TMW-6` закрыт как runtime adoption slice и more runtime consumers use the shared contract-layer.
