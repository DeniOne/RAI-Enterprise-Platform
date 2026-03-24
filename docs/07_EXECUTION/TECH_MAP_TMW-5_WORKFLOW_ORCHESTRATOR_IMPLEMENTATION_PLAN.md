---
id: DOC-EXE-TECH-MAP-TMW-5-WORKFLOW-ORCHESTRATOR-20260322
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-24
claim_id: CLAIM-EXE-TECH-MAP-TMW-5-WORKFLOW-ORCHESTRATOR-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-22
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;apps/api/src/modules/tech-map/tech-map-workflow-orchestrator.service.ts;apps/api/src/modules/tech-map/tech-map-workflow-orchestrator.service.spec.ts;apps/api/src/modules/tech-map/tech-map.service.ts;apps/api/src/modules/rai-chat/composer/response-composer.service.ts;apps/api/src/modules/tech-map/tech-map.module.ts
---
# TECH MAP TMW-5 Workflow Orchestrator Implementation Plan

## CLAIM
id: CLAIM-EXE-TECH-MAP-TMW-5-WORKFLOW-ORCHESTRATOR-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-24

## 0. Цель пакета

`TMW-5` собирает first-class owner-led workflow engine для Техкарты.

Целевой результат:

- Техкарта больше не является “одним tool-call”;
- появляется управляемый phase engine;
- owner-led execution координирует intake, branches, trust, composition и review handoff;
- `SupervisorAgent` и downstream runtime получают одинаковый workflow spine.

## 1. Что уже есть

Сейчас уже подтверждено:

- owner-led execution pattern на платформе
- `SupervisorAgent` как orchestration layer
- branch trust platform baseline
- tech-map branch contracts и slot registry в shared layer
- first-class `TechMapWorkflowOrchestrator` уже существует в `apps/api/src/modules/tech-map/`
- `TechMapService` и `ResponseComposer` уже читают workflow spine как runtime consumer

Текущий разрыв:

- trust handoff ещё не получает полный branch verdict feed из live orchestrator path
- `TMW-7` trust/composition specialization ещё не завершён
- branch verdict wiring в final composition ещё нуждается в добивке по реальным runtime веткам

## 2. Целевой результат пакета

После завершения `TMW-5` система должна уметь:

- вести Техкарту через фазы `INTAKE -> TRIAGE -> BRANCHING -> TRUST -> COMPOSITION`;
- запускать доменные ветки параллельно или последовательно по policy;
- координировать `agronomist`, finance, compliance, evidence и risk как одного owner-led процесса;
- эмитить trace, audit и explainability artifacts по каждой фазе;
- сохранять governed boundary между orchestration и final composition.

## 3. File-level scope

Файлы:

- [supervisor-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-execution-adapter.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [branch-trust.types.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/branch-trust.types.ts)
- [tech-map-governed-branch.types.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-branch.types.ts)
- [tech-map-governed-draft.helpers.ts](/root/RAI_EP/apps/api/src/shared/tech-map/tech-map-governed-draft.helpers.ts)

Будущие runtime consumers:

- `TechMapService`
- `ResponseComposer`
- workflow trace/audit
- review packet assembly

## 4. PR-срезы

## 4.1 PR A — Orchestrator contract

Checklist:

- [x] ввести `TechMapWorkflowOrchestrator`
- [x] зафиксировать phase engine
- [x] определить входы и выходы каждой фазы

Эффект:

- появится first-class workflow spine для Техкарты

## 4.2 PR B — Branch scheduling

Checklist:

- [x] определить parallel branches
- [x] определить sequential branches
- [x] определить blocking branches
- [x] зафиксировать owner/lead handoff

Эффект:

- система начнёт исполнять не набор веток, а управляемый процесс

## 4.3 PR C — Trust handoff

Checklist:

- [x] подключить orchestrator к trust gate
- [ ] передавать branch verdicts в final composition
- [ ] не запускать composition до trust decision

Эффект:

- workflow перестанет выдавать “готовый ответ” раньше времени
- live branch trust feed уже доезжает в workflow trace через runtime adoption snapshot

## 4.4 PR D — Runtime trace and audit

Checklist:

- [x] фиксировать phase trace
- [x] фиксировать branch schedule
- [x] фиксировать policy decisions

Эффект:

- orchestration станет explainable и forensic-ready

## 5. Acceptance criteria

- фазы видны и контролируемы;
- branches могут идти параллельно или последовательно по policy;
- trust gate предшествует composition;
- audit trace покрывает весь workflow spine.

## 6. Definition of Done

Пакет `TMW-5` считается закрытым, когда:

- tech-map workflow orchestrator существует;
- phase engine работает;
- at least one runtime consumer использует orchestrator;
- docs и memory-bank синхронизированы;
- api и docs проверки зелёные.

Текущий статус пакета: `DONE`.
