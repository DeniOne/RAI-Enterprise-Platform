---
id: DOC-EXE-TECH-MAP-TMW-2-CANONICAL-ARTIFACT-SCHEMA-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-22
claim_id: CLAIM-EXE-TECH-MAP-TMW-2-CANONICAL-ARTIFACT-SCHEMA-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-22
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;apps/api/src/modules/tech-map/tech-map.service.ts;apps/api/src/modules/tech-map/tech-map.controller.ts;apps/api/src/modules/tech-map/fsm/tech-map.fsm.ts;packages/prisma-client/schema.prisma;apps/api/src/shared/tech-map/tech-map-governed-artifact.types.ts;apps/api/src/shared/tech-map/tech-map-governed-state.types.ts;apps/api/src/shared/tech-map/tech-map-governed-conflict.types.ts;apps/api/src/shared/tech-map/tech-map-governed-clarify.types.ts
---
# TECH MAP TMW-2 Canonical Artifact Schema Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-2-CANONICAL-ARTIFACT-SCHEMA-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-22

## 0. Цель пакета

`TMW-2` превращает каноническую доменную модель Техкарты из engineering-spec в исполнимый backend-пакет.

Целевой результат:

- у платформы появляется единый typed source для артефакта Техкарты;
- `DB`, `API`, orchestrator, explainability и review-пакеты начинают опираться на один и тот же shape;
- исчезает риск, что runtime-пайплайн живёт отдельно от persisted доменной модели.

## 1. Что уже подтверждено кодом

Текущий код уже содержит:

- persisted модель `TechMap` и связанные сущности в `Prisma`
- `DRAFT -> REVIEW -> APPROVED -> ACTIVE -> ARCHIVED` lifecycle
- version-поля `version` и `isLatest`
- operational snapshots `operationsSnapshot` и `resourceNormsSnapshot`
- controller/service/FSM-контур Техкарты

Текущий разрыв:

- нет отдельного typed корневого объекта уровня `TechMapCanonicalDraft`
- нет единого shared-layer для artifact/state/conflict/clarify contracts
- `DB`-модель, runtime-логика и будущий governed workflow пока связаны только документом, а не кодовым contract-layer

## 2. Целевой результат пакета

После завершения `TMW-2` система должна иметь:

- shared types:
  - `TechMapCanonicalDraft`
  - `TechMapVariant`
  - `TechMapOperation`
  - `TechMapInputPlan`
  - `TechMapFinancialSummary`
  - `TechMapRiskRegisterItem`
  - `TechMapEvidenceBundle`
  - `TechMapApprovalPacket`
- shared supporting types:
  - state taxonomy
  - conflict records
  - clarify contracts
- mapping layer:
  - `Prisma -> canonical artifact`
  - `canonical artifact -> explainability / review packet`

## 3. File-level scope

### 3.1 Shared contract-layer

Файлы:

- [tech-map-governed-artifact.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-artifact.types.ts)
- [tech-map-governed-state.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-state.types.ts)
- [tech-map-governed-conflict.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-conflict.types.ts)
- [tech-map-governed-clarify.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-clarify.types.ts)
- [index.ts](/root/RAI_EP/apps/api/src/shared/tech-map/index.ts)

Что должно появиться:

- канонический object graph артефакта
- supporting enums/unions для state/conflict/clarify
- helper-слой для persisted status mapping

### 3.2 Runtime touchpoints

Файлы:

- [tech-map.service.ts](/root/RAI_EP/apps/api/src/modules/tech-map/tech-map.service.ts)
- [tech-map.controller.ts](/root/RAI_EP/apps/api/src/modules/tech-map/tech-map.controller.ts)
- [tech-map.fsm.ts](/root/RAI_EP/apps/api/src/modules/tech-map/fsm/tech-map.fsm.ts)

Что должно быть сделано:

- заменить локальные ad-hoc shape/проверки на shared contracts там, где это безопасно
- ввести mapping helpers вместо повторного определения status/editability правил
- подготовить service/controller к появлению governed draft read-model

### 3.3 Persistence touchpoints

Файлы:

- [schema.prisma](/root/RAI_EP/packages/prisma-client/schema.prisma)
- [tech-map-prisma-includes.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-prisma-includes.ts)
- [tech-map-mapping.helpers.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-mapping.helpers.ts)

Что должно быть сделано:

- определить, какие поля остаются в текущих реляционных таблицах
- определить, какие governed-поля пойдут в `Json` snapshots/read-model
- подготовить canonical mapping path к `TechMapCanonicalDraft`

## 4. Каноническая схема артефакта

### 4.1 Root aggregate

Корневой объект:

- `TechMapCanonicalDraft`

Обязательные кластеры:

- `header`
- `readiness`
- `workflow_verdict`
- `publication_state`
- `review_status`
- `approval_status`
- `persistence_status`
- `assumptions`
- `gaps`
- `conflicts`
- `variants`
- `selected_variant_id`
- `approval_packet`

### 4.2 Variant graph

Каждый `variant` обязан содержать:

- operation graph
- input plan
- financial summary
- risk register
- evidence bundle
- overall verdict

Норматив:

- variant без `financial_summary` или `evidence_bundle` считается неполным
- `selected_variant_id` обязателен для review/publication траектории

## 5. Текущее `DB`-решение и целевой migration path

### 5.1 Что оставляем как есть на первом шаге

- таблицы `TechMap`, `MapStage`, `MapOperation`, `MapResource`
- поля `version`, `isLatest`, `status`
- текущие immutable production snapshots

### 5.2 Что добавляем без резкого слома

На первом проходе допускается не делать большой schema-reset, а использовать staged path:

1. shared contract-layer
2. canonical mapper из текущего `Prisma` shape в `TechMapCanonicalDraft`
3. read-model / snapshot поля для governed metadata
4. только потом точечные `Prisma`-расширения

Эффект:

- команда получает typed canonical artifact без тяжёлой миграции в одном `PR`
- backend может начать работать по будущей схеме до полного `DB`-разрезания

## 6. API и service contract changes

### 6.1 На этом пакете

Нужно подготовить:

- read contract для governed draft
- internal service contract для canonical draft mapping
- internal explainability contract для artifact sections

### 6.2 На следующем пакете

Будут использовать:

- orchestrator
- review packet assembly
- publication gate

Норматив:

- `API` не должен отдавать сырую смесь `Prisma` и prose как “канонический draft”
- канонический draft должен быть отдельным typed contract

## 7. PR-срезы

## 7.1 PR A — Shared canonical types

Checklist:

- [ ] добавить `artifact/state/conflict/clarify` shared contracts
- [ ] собрать barrel-export в `apps/api/src/shared/tech-map/`
- [ ] покрыть status helper unit-spec

Ожидаемый эффект:

- весь backend получает один общий typed source

## 7.2 PR B — Canonical mapper

Checklist:

- [ ] ввести mapper `Prisma TechMap -> TechMapCanonicalDraft`
- [ ] собрать invariant checks для variant/header/readiness clusters
- [ ] не ломать текущие controller responses

Ожидаемый эффект:

- runtime и explainability смогут читать один canonical object graph

## 7.3 PR C — Read-model consumption

Checklist:

- [ ] подготовить service-layer к отдаче governed draft read-model
- [ ] ввести первые internal consumers для explainability/review
- [ ] закрыть targeted `tsc` и `jest`

Ожидаемый эффект:

- новый artifact contract станет не только shared file, но и реально используемым read-model

## 8. Тестовый пакет

Обязательные проверки:

- unit:
  - status helpers
  - canonical mapper invariants
- service:
  - mapping текущего `Prisma` shape в canonical draft
- compile:
  - `pnpm --filter api exec tsc --noEmit --pretty false`

## 9. Definition of Done

Пакет `TMW-2` считается закрытым, когда:

- shared contract-layer существует в коде
- есть canonical mapper в backend
- хотя бы один runtime consumer использует `TechMapCanonicalDraft`
- docs и `memory-bank` синхронизированы
- проверки `docs` и `api` зелёные
