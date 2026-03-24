---
id: DOC-EXE-TECH-MAP-TMW-4-SEMANTIC-FRAME-EXTENSION-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-24
claim_id: CLAIM-EXE-TECH-MAP-TMW-4-SEMANTIC-FRAME-EXTENSION-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-24
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md;apps/api/src/modules/rai-chat/semantic-ingress.service.ts;apps/api/src/modules/rai-chat/semantic-ingress.service.spec.ts;apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts;apps/api/src/shared/rai-chat/semantic-ingress.types.ts
---
# TECH MAP TMW-4 Semantic Frame Extension Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-4-SEMANTIC-FRAME-EXTENSION-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-24

## 0. Цель пакета

`TMW-4` расширяет semantic ingress так, чтобы Техкарта распознавалась как отдельный governed workflow-frame, а не как generic chat intent.

Целевой результат:

- ingress начинает различать `create_new / rebuild_existing / compare_variants / review_draft / approve_publish / resume_clarify / explain_block`;
- orchestrator получает `policy posture`, `workflow stage` и `required actions`;
- semantic frame становится первым typed объектом, а не побочным текстовым сигналом;
- свободный UX остаётся свободным, но execution становится управляемым.

## 1. Что уже есть

Сейчас уже подтверждено:

- общий semantic ingress / governed handoff plan
- tech-map intent detection и legacy routing path
- master-checklist, где `TMW-4` стоит как отдельный пакет после canonical contracts baseline

Текущий разрыв:

- нет отдельного tech-map ingress frame contract
- нет нормализованной workflow-stage модели для Техкарты
- нет typed distinction между `create_new`, `rebuild_existing`, `compare_variants`, `review_draft`, `approve_publish`, `resume_clarify` и `explain_block`

## 2. Целевой результат пакета

После завершения `TMW-4` платформа должна уметь:

- строить semantic frame для техкарты из свободной фразы;
- понимать, что именно хочет пользователь: создать, пересобрать, сравнить или продолжить;
- отдавать orchestrator-у route-ready typed payload;
- передавать policy posture и blocked actions без guesswork;
- сохранять compatible UX для свободного ввода.

## 3. File-level scope

Файлы:

- [semantic-ingress.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/semantic-ingress.service.ts)
- [semantic-router.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts)
- [semantic-ingress.types.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/semantic-ingress.types.ts)
- [semantic-routing.types.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/semantic-routing.types.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/agent-interaction-contracts.ts)

Будущие runtime consumers:

- SupervisorAgent
- tech-map orchestrator
- review / clarify / publication gates

## 4. PR-срезы

## 4.1 PR A — Tech-map semantic frame contract

Checklist:

- [x] ввести tech-map specialization frame
- [x] зафиксировать `intent / stage / policy posture / required actions`
- [x] развести `create_new / rebuild_existing / compare_variants / review_draft / approve_publish / resume_clarify / explain_block`

Эффект:

- chat intent перестанет быть единственным источником семантики

## 4.2 PR B — Ingress normalization

Checklist:

- [x] подключить frame build в semantic ingress
- [x] отдать frame как typed output
- [x] сохранить free-form UX

Эффект:

- вход остаётся свободным, но internal execution becomes governed

## 4.3 PR C — Resume and compare semantics

Checklist:

- [x] научить ingress frame понимать `resume_clarify`
- [x] научить frame понимать `compare_variants`
- [x] обеспечить branch-aware next actions

Эффект:

- system can resume or compare without falling back to generic chat behavior

## 4.4 PR D — Runtime consumers

Checklist:

- [x] подключить frame к supervisor handoff
- [x] подключить frame к workflow selection
- [x] подключить frame к explainability/audit

Эффект:

- semantic frame станет first-class runtime artifact

## 5. Acceptance criteria

- tech-map intent нормализуется в typed frame;
- frame различает create/rebuild/compare/revise/resume;
- policy posture и required actions доступны downstream;
- tests подтверждают deterministic frame extraction.

## 6. Definition of Done

Пакет `TMW-4` считается закрытым, когда:

- semantic frame contract существует;
- ingress его строит;
- at least one runtime consumer использует frame;
- docs и memory-bank синхронизированы;
- api и docs проверки зелёные.

Статус пакета:

- `TMW-4` закрыт как runtime slice с compare/review/publication edge-cases и boundary-aware variant-count extraction.
