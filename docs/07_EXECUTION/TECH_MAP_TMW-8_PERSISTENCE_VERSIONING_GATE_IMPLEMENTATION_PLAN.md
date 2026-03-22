---
id: DOC-EXE-TECH-MAP-TMW-8-PERSISTENCE-VERSIONING-GATE-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-22
claim_id: CLAIM-EXE-TECH-MAP-TMW-8-PERSISTENCE-VERSIONING-GATE-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-22
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;packages/prisma-client/schema.prisma;apps/api/src/modules/tech-map/fsm/tech-map.fsm.ts;apps/api/src/modules/tech-map/fsm/tech-map.fsm.spec.ts;apps/api/src/modules/tech-map/tech-map.service.ts;apps/api/src/modules/tech-map/tech-map.controller.ts;apps/api/src/shared/tech-map/tech-map-governed-state.types.ts;apps/api/src/shared/tech-map/tech-map-governed-status.helpers.ts
---
# TECH MAP TMW-8 Persistence Versioning Gate Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-8-PERSISTENCE-VERSIONING-GATE-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-22

## 0. Цель пакета

`TMW-8` превращает правила `draft/review/approval/publication` из spec-текста в enforceable runtime boundary.

Целевой результат:

- write-path Техкарты начинает подчиняться явным phase/state/versioning rules
- `FSM`, service-layer и `DB` snapshots перестают быть частично неявными
- публикация и review получают immutable boundary, а не просто смену `status`

## 1. Текущий кодовый baseline

Сейчас подтверждено кодом:

- есть persisted `TechMapStatus`
- есть `version`, `isLatest`
- `FSM` управляет переходами `DRAFT / REVIEW / APPROVED / ACTIVE / ARCHIVED`
- `updateDraft(...)` разрешает правку в `DRAFT` и `REVIEW`
- `ACTIVE` map пишет production snapshots и link в `HarvestPlan`

Текущие gaps:

- нет отдельной state taxonomy поверх persisted `TechMapStatus`
- нет immutable `review packet snapshot`
- нет approval snapshot как first-class boundary
- нет write-guard, который различает `workflow state`, `publication state` и `persistence state`

## 2. Целевое состояние пакета

После `TMW-8` платформа должна уметь enforce:

- кто и когда может править head draft
- где создаётся новая версия вместо patch
- где создаётся immutable snapshot
- где публикация блокируется независимо от “красивого ответа”
- как `publication_state` маппится на текущий persisted `TechMapStatus`

## 3. Канонические правила, которые нужно реализовать

### 3.1 Write boundaries

Правила:

1. `WORKING_DRAFT`
   - может оставаться ephemeral
   - не создаёт published side effects

2. `GOVERNED_DRAFT`
   - создаёт persisted draft version
   - editable только как head version

3. `REVIEW_REQUIRED`
   - создаёт immutable review snapshot
   - содержательные изменения только через новую version

4. `APPROVAL_REQUIRED`
   - хранит approval decisions отдельно от content patching

5. `PUBLISHED`
   - создаёт publication lock
   - не может патчиться in place

### 3.2 Versioning rules

Нужно enforce:

- `DRAFT` patch только для head version
- change после review submission = новая version
- publication нового baseline = `supersede` старого `ACTIVE`
- архивирование не должно терять publication trail

## 4. File-level scope

Файлы:

- [tech-map-governed-state.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-state.types.ts)
- [tech-map-governed-status.helpers.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-status.helpers.ts)
- [tech-map.fsm.ts](/root/RAI_EP/apps/api/src/modules/tech-map/fsm/tech-map.fsm.ts)
- [tech-map.fsm.spec.ts](/root/RAI_EP/apps/api/src/modules/tech-map/fsm/tech-map.fsm.spec.ts)
- [tech-map.service.ts](/root/RAI_EP/apps/api/src/modules/tech-map/tech-map.service.ts)
- [tech-map.controller.ts](/root/RAI_EP/apps/api/src/modules/tech-map/tech-map.controller.ts)
- [schema.prisma](/root/RAI_EP/packages/prisma-client/schema.prisma)

## 5. PR-срезы

## 5.1 PR A — Shared state taxonomy and helpers

Checklist:

- [ ] зафиксировать transition matrix и editable statuses
- [ ] зафиксировать mapping `publication_state -> TechMapStatus`
- [ ] покрыть helper-слой unit-тестами

Эффект:

- `FSM` и service-layer начинают говорить через один state source

## 5.2 PR B — FSM hardening

Checklist:

- [ ] перевести `FSM` на shared transition matrix
- [ ] явно зафиксировать unsupported statuses `GENERATED_DRAFT / OVERRIDE_ANALYSIS`
- [ ] сохранить текущий `RBAC`-контур без регрессии

Эффект:

- правила переходов перестанут жить только в `switch`

## 5.3 PR C — Service write guards

Checklist:

- [ ] отделить editable head draft от immutable snapshots
- [ ] запретить patch review/publication snapshots in place
- [ ] подготовить service к новой version при post-review изменениях

Эффект:

- write-path станет governed, а не просто “обнови запись, если статус похож на черновик”

## 5.4 PR D — Persistence extensions

Checklist:

- [ ] определить поля/таблицы для review snapshot
- [ ] определить поля/таблицы для approval snapshot
- [ ] определить publication lock / supersede trail
- [ ] подготовить migration без destructive rewrite текущего `TechMap`

Эффект:

- `DB` начнёт хранить юридически и audit-значимые границы как first-class данные

## 6. Тестовый пакет

Обязательные проверки:

- `FSM` spec:
  - допустимые persisted transitions
  - недопустимые skip transitions
  - `RBAC` guardrails
- service tests:
  - editable status guard
  - immutable snapshot guard
  - `ACTIVE -> ARCHIVED` link cleanup
- compile:
  - `pnpm --filter api exec tsc --noEmit --pretty false`

## 7. Definition of Done

Пакет `TMW-8` считается закрытым, когда:

- state taxonomy и helper-layer существуют в коде
- `FSM` опирается на shared transition source
- service write guards различают editable draft и immutable boundaries
- migration path для review/approval/publication snapshots определён
- tests подтверждают отсутствие regressions в текущем lifecycle
