---
id: DOC-EXE-TECH-MAP-TMW-3-CLARIFY-LOOP-ENGINE-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-22
claim_id: CLAIM-EXE-TECH-MAP-TMW-3-CLARIFY-LOOP-ENGINE-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-22
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;apps/api/src/shared/tech-map/tech-map-governed-clarify.types.ts;apps/api/src/shared/tech-map/tech-map-slot-registry.ts;apps/api/src/modules/rai-chat/semantic-ingress.service.ts;apps/api/src/modules/rai-chat/supervisor-agent.service.ts
---
# TECH MAP TMW-3 Clarify Loop Engine Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-3-CLARIFY-LOOP-ENGINE-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-22

## 0. Цель пакета

`TMW-3` превращает clarify-поведение Техкарты в управляемый subprocess с batch/resume/expiration semantics.

Целевой результат:

- missing context перестаёт жить как разрозненный список вопросов;
- система получает controlled intake loop;
- `clarify` становится resumable процессом, а не разовым текстовым вопросом;
- пользователь и оператор видят batch-структуру, приоритет и срок жизни каждого блока уточнений.

## 1. Что уже есть

Сейчас уже подтверждено:

- clarify-слоты и severity-классы в shared types
- operational clarify model в основном spec
- master-checklist, где `TMW-3` стоит как следующий блок после registry/schema baseline

Текущий разрыв:

- нет persisted clarify batch
- нет runtime resume token/state
- нет one-shot / multi-step policy execution
- clarify до сих пор не является отдельным runtime subprocess в execution layer

## 2. Целевой результат пакета

После завершения `TMW-3` платформа должна уметь:

- группировать missing slots в clarify batches;
- отдавать batches с priority, `TTL` и `resume_token`;
- резюмировать workflow после дозаполнения контекста;
- различать machine-resolvable, user-resolvable и human-review-required gaps;
- честно блокировать branch execution, пока критичный clarify не закрыт.

## 3. File-level scope

Файлы:

- [tech-map-governed-clarify.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-clarify.types.ts)
- [tech-map-slot-registry.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-slot-registry.ts)
- [tech-map-governed-draft.helpers.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-draft.helpers.ts)
- [semantic-ingress.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/semantic-ingress.service.ts)
- [supervisor-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts)

Будущие runtime consumers:

- tech-map intake path
- workflow resume path
- clarify UI / work-window surface
- audit / forensics / explainability

## 4. PR-срезы

## 4.1 PR A — Clarify batch model

Checklist:

- [ ] ввести persisted clarify batch
- [ ] ввести `resume_token`
- [ ] ввести `batch_status`
- [ ] ввести `TTL / expires_at`

Эффект:

- clarify перестанет быть одноразовым списком вопросов

## 4.2 PR B — Clarify decision policy

Checklist:

- [ ] зафиксировать `ONE_SHOT / MULTI_STEP`
- [ ] ввести rule для `machine_resolvable / user_resolvable / human_review_required`
- [ ] привязать clarify severity к slot registry

Эффект:

- система начнёт управляемо решать, что можно закрывать автоматически, а что нельзя

## 4.3 PR C — Workflow resume integration

Checklist:

- [ ] подключить clarify к resume path
- [ ] проверить, что resumption requires fresh basis
- [ ] добавить policy на recheck при устаревшем контексте

Эффект:

- intake loop станет возобновляемым процессом, а не тупиком

## 4.4 PR D — Runtime consumers

Checklist:

- [ ] подключить clarify batches к supervisor intake
- [ ] подключить clarify disclosure к explainability
- [ ] подключить clarify audit trail

Эффект:

- все заинтересованные контуры будут видеть не только gap, но и его управляемый lifecycle

## 5. Acceptance criteria

- missing slots собираются в batches;
- batch имеет priority и expiration;
- clarify можно resume-ить;
- one-shot и multi-step режимы различаются;
- tests подтверждают batch lifecycle и policy gating.

## 6. Definition of Done

Пакет `TMW-3` считается закрытым, когда:

- clarify batch model существует в коде;
- resume token/state работает;
- at least one runtime consumer использует clarify subprocess;
- docs и memory-bank синхронизированы;
- api и docs проверки зелёные.
