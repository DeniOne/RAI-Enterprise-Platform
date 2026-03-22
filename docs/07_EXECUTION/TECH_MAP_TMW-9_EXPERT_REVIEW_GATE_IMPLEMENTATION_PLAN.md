---
id: DOC-EXE-TECH-MAP-TMW-9-EXPERT-REVIEW-GATE-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-22
claim_id: CLAIM-EXE-TECH-MAP-TMW-9-EXPERT-REVIEW-GATE-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-22
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;apps/api/src/modules/rai-chat/agents/chief-agronomist-agent.service.ts;apps/api/src/modules/rai-chat/expert-review.service.ts;apps/api/src/modules/rai-chat/expert/expert-invocation.engine.ts;apps/api/src/shared/tech-map/tech-map-governed-branch.types.ts
---
# TECH MAP TMW-9 Expert Review Gate Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-9-EXPERT-REVIEW-GATE-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-22

## 0. Цель пакета

`TMW-9` встраивает `chief_agronomist` как policy-driven expert-review слой перед human agronomy approval.

Целевой результат:

- `chief_agronomist` не подменяет owner workflow;
- экспертный слой даёт structured findings, revision requests и block reasons;
- human agronomy authority остаётся обязательным final authority;
- спорные и high-impact техкарты получают дополнительный governed review.

## 1. Что уже есть

Сейчас уже подтверждено:

- `chief_agronomist` как отдельная роль в runtime
- expert invocation engine для expert-tier agents
- conditional expert-review semantics в основном spec
- `TechMapExpertReviewResult` в branch contract layer

Текущий разрыв:

- нет policy-triggered review gate для tech-map workflow
- нет end-to-end review packet path для expert findings
- нет explicit invariant, что expert review не пишет canonical content напрямую

## 2. Целевой результат пакета

После завершения `TMW-9` платформа должна уметь:

- запускать `chief_agronomist` только по policy trigger;
- возвращать structured review verdict `APPROVE_WITH_NOTES / REVISE / BLOCK`;
- поднимать expert findings в audit/explainability;
- требовать human review before publication;
- сохранять invariant против role inflation.

## 3. File-level scope

Файлы:

- [chief-agronomist-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/chief-agronomist-agent.service.ts)
- [expert-review.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/expert-review.service.ts)
- [expert-invocation.engine.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/expert/expert-invocation.engine.ts)
- [tech-map-governed-branch.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-branch.types.ts)
- [tech-map-governed-workflow.md](/root/RAI_EP/docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md)

Будущие runtime consumers:

- orchestrator
- trust gate
- human review packet
- audit / explainability

## 4. PR-срезы

## 4.1 PR A — Review trigger policy

Checklist:

- [ ] ввести policy triggers для expert review
- [ ] определить cases for `BLOCK / REVISE / APPROVE_WITH_NOTES`
- [ ] связать triggers с publication-critical branches

Эффект:

- expert review перестанет запускаться на каждую техкарту подряд

## 4.2 PR B — Review packet contract

Checklist:

- [ ] ввести structured expert findings packet
- [ ] сохранить challenged assumptions and required revisions
- [ ] привязать packet к workflow and variant IDs

Эффект:

- экспертный ответ станет машинно-потребляемым и audit-ready

## 4.3 PR C — Guard against role inflation

Checklist:

- [ ] запретить expert review direct canonical writes
- [ ] разрешить только findings/revisions
- [ ] сохранить human agronomy authority как обязательный слой

Эффект:

- system won’t silently promote expert review into an owner role

## 4.4 PR D — Runtime adoption

Checklist:

- [ ] подключить expert review gate к orchestrator
- [ ] подключить review results к explainability/audit
- [ ] подключить review packet к publication path

Эффект:

- complex or risky tech maps получат additional governed scrutiny before approval

## 5. Acceptance criteria

- review вызывается по policy trigger;
- review returns structured verdict and findings;
- expert review не пишет canonical content напрямую;
- human agronomy authority cannot be bypassed;
- tests подтверждают trigger and invariant behavior.

## 6. Definition of Done

Пакет `TMW-9` считается закрытым, когда:

- expert review gate существует;
- policy triggers работают;
- at least one runtime consumer использует expert-review path;
- docs и memory-bank синхронизированы;
- api и docs проверки зелёные.
