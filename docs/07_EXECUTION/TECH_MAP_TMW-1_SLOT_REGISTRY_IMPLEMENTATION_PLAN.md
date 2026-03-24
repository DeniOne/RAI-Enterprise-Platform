---
id: DOC-EXE-TECH-MAP-TMW-1-SLOT-REGISTRY-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-24
claim_id: CLAIM-EXE-TECH-MAP-TMW-1-SLOT-REGISTRY-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-24
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;apps/api/src/shared/tech-map/tech-map-slot-registry.ts;apps/api/src/shared/tech-map/tech-map-slot-registry.spec.ts;apps/api/src/shared/tech-map/tech-map-governed-draft.helpers.ts;apps/api/src/shared/tech-map/tech-map-governed-draft.helpers.spec.ts;apps/api/src/shared/tech-map/tech-map-governed-clarify.types.ts;apps/api/src/shared/tech-map/tech-map-governed-state.types.ts;apps/api/src/shared/tech-map/tech-map-governed-artifact.types.ts
---
# TECH MAP TMW-1 Slot Registry Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-1-SLOT-REGISTRY-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-24

## 0. Цель пакета

`TMW-1` превращает slot-matrix Техкарты из текстового spec-раздела в machine-oriented registry contract.

Целевой результат:

- readiness, `clarify`, basis checks, freshness rules и publication impact начинают жить на одном registry source;
- slot-policy перестаёт расползаться по orchestrator, trust-gate, review-gate и composer;
- команда получает typed основу для deterministic `readiness/scoring/clarify`.

## 1. Что уже есть

Сейчас уже зафиксировано:

- slot matrix и readiness levels в основном spec
- severity classes для missing context
- assumption/freshness/publication semantics по смыслу

Текущий разрыв:

- нет отдельного canonical `TechMapSlotRegistryEntry`
- нет typed slot registry как first-class shared layer
- нет runtime helper-слоя для stage-based slot queries

## 2. Канонический registry contract

Целевой registry entry обязан включать:

- `slot_key`
- `group`
- `severity`
- `stage_required_from`
- `allowed_sources`
- `freshness_policy`
- `assumption_policy`
- `impact`

Канонический runtime результат пакета:

- shared registry file
- query helpers:
  - `get entry by key`
  - `list slots by readiness`
  - `list publication-critical slots`
- unit-tests на uniqueness и policy expectations

## 3. File-level scope

Файлы:

- [tech-map-slot-registry.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-slot-registry.ts)
- [tech-map-slot-registry.spec.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-slot-registry.spec.ts)
- [tech-map-governed-clarify.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-clarify.types.ts)
- [tech-map-governed-state.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-state.types.ts)
- [index.ts](/root/RAI_EP/apps/api/src/shared/tech-map/index.ts)

Будущие consumers:

- semantic ingress readiness scoring
- missing-context triage
- explainability gap disclosure
- review/publication slot checks

## 4. PR-срезы

## 4.1 PR A — Registry schema and initial data

Checklist:

- [x] ввести `TechMapSlotRegistryEntry`
- [x] собрать initial registry по текущей slot-matrix
- [x] зафиксировать groups/source types/policies как typed unions

Эффект:

- slot logic получает единый machine-readable реестр

## 4.2 PR B — Registry query helpers

Checklist:

- [x] добавить helpers для readiness-based slot filtering
- [x] добавить helpers для publication-critical slot extraction
- [x] не плодить дублирующие slot lists в соседних сервисах

Эффект:

- orchestrator и review gates начнут запрашивать slot policy из одного места

## 4.3 PR C — First consumers

Checklist:

- [x] подключить registry к readiness scoring
- [x] подключить registry к `clarify` packet assembly
- [x] подготовить trust/composition consumers

Эффект:

- `clarify` и readiness перестанут быть частично эвристическими

## 5. Acceptance criteria

- один slot = одна registry entry
- публикационная критичность slot-а определяется registry, а не локальным if
- freshness и assumption policies доступны как typed data
- tests подтверждают уникальность и stage-ожидания registry

## 6. Definition of Done

Пакет `TMW-1` считается закрытым, когда:

- registry существует в shared layer
- есть query helpers
- хотя бы один runtime consumer использует registry
- `docs` и `memory-bank` синхронизированы
- `api` и `docs` проверки зелёные
