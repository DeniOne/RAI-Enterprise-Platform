---
id: DOC-EXE-TECH-MAP-TMW-7-TRUST-COMPOSITION-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-24
claim_id: CLAIM-EXE-TECH-MAP-TMW-7-TRUST-COMPOSITION-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-24
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;apps/api/src/shared/rai-chat/branch-trust.types.ts;apps/api/src/shared/tech-map/tech-map-governed-artifact.types.ts;apps/api/src/shared/tech-map/tech-map-governed-branch.types.ts;apps/api/src/shared/tech-map/tech-map-governed-trust.helpers.ts;apps/api/src/shared/tech-map/tech-map-runtime-adoption.helpers.ts;apps/api/src/modules/rai-chat/composer/response-composer.service.ts;apps/api/src/shared/tech-map/tech-map-governed-trust.helpers.spec.ts
---
# TECH MAP TMW-7 Trust Composition Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-7-TRUST-COMPOSITION-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-24

## 0. Цель пакета

`TMW-7` применяет trust gate и final composition rules к Техкарте как к governed workflow.

Целевой результат:

- final response не собирается до trust verdict;
- branch verdicts определяют, что можно включить в composition;
- `facts / derived metrics / assumptions / recommendations / gaps` разводятся жестко;
- ложная “готовая техкарта” перестаёт проходить как финальный результат.

## 1. Что уже есть

Сейчас уже подтверждено:

- platform-level branch trust gate
- `BranchResultContract`, `BranchTrustAssessment`, `BranchVerdict`
- honest composition rules в response composer
- tech-map canonical artifact and branch contracts в shared layer

Текущий разрыв:

- нет tech-map-specific trust specialization
- нет formal composition contract поверх tech-map branches
- нет variant-aware publication composition rules

## 2. Целевой результат пакета

После завершения `TMW-7` система должна уметь:

- проверять publication-critical branch truth до compose;
- собирать результат только из разрешённых statement-классов;
- честно маркировать `PARTIAL / UNVERIFIED / BLOCKED`;
- строить variant comparison report;
- показывать gaps and assumptions как отдельные классы, а не как prose-заметки.

## 3. File-level scope

Файлы:

- [branch-trust.types.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/branch-trust.types.ts)
- [tech-map-governed-artifact.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-artifact.types.ts)
- [tech-map-governed-branch.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-branch.types.ts)
- [response-composer.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.ts)
- [tech-map-governed-verdict.helpers.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-verdict.helpers.ts)

Будущие runtime consumers:

- tech-map trust gate
- response composer
- review packet assembly
- comparison report generator

## 4. PR-срезы

## 4.1 PR A — Trust specialization

Checklist:

- [x] ввести tech-map-specific trust checks
- [x] определить publication-critical branch requirements
- [x] связать trust с slot registry and conflict policy

Эффект:

- trust начнёт работать по доменной логике Техкарты

## 4.2 PR B — Composition contract

Checklist:

- [x] зафиксировать `facts / derived / assumptions / recommendations / gaps`
- [x] развести `selected variant` и `comparison report`
- [x] запретить composition из untrusted payloads

Эффект:

- финальный ответ станет честным и типизированным

## 4.3 PR C — Blocking disclosure

Checklist:

- [x] корректно показывать `PARTIAL`, `UNVERIFIED`, `BLOCKED`
- [x] показать unresolved basis gaps
- [x] показать assumption disclosure

Эффект:

- пользователю станет видно, почему результат не может считаться готовым

## 4.4 PR D — Runtime consumers

Checklist:

- [x] подключить tech-map trust gate к orchestrator
- [x] подключить composition к composer
- [x] подключить composition к explainability

Эффект:

- trust/composition перестанут быть только spec-идеей

## 5. Acceptance criteria

- composition строится только после trust verdict;
- protected sections не смешиваются с assumptions/gaps;
- comparison report и draft response различаются;
- tests подтверждают честный disclosure path.

## 6. Definition of Done

Пакет `TMW-7` считается закрытым, когда:

- tech-map trust specialization существует;
- final composition contract существует;
- at least one runtime consumer использует trust/composition path;
- docs и memory-bank синхронизированы;
- api и docs проверки зелёные.

Пакет `TMW-7` закрыт: trust specialization, branch-gated composition, honest disclosure и variant comparison runtime path уже собраны.
