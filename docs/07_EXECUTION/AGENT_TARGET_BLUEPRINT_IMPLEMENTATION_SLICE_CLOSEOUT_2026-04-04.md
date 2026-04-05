---
id: DOC-EXE-AGENT-TARGET-BLUEPRINT-IMPLEMENTATION-SLICE-CLOSEOUT-20260404
layer: Execution
type: Phase Plan
status: active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-04-05
claim_id: CLAIM-EXE-AGENT-TARGET-BLUEPRINT-IMPLEMENTATION-SLICE-CLOSEOUT-20260404
claim_status: asserted
verified_by: manual
last_verified: 2026-04-05
evidence_refs: docs/00_STRATEGY/STAGE 2/rai_ep_agent_system_target_implementation_blueprint.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md;docs/07_EXECUTION/AGENT_SYSTEM_ASIS_TOBE_2026-04-03.md;apps/api/src/shared/rai-chat;apps/api/src/modules/rai-chat/planner;apps/api/src/modules/rai-chat/semantic-ingress.service.ts;apps/api/src/modules/rai-chat/supervisor-agent.service.ts;apps/api/src/modules/rai-chat/supervisor-forensics.service.ts;apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts;apps/api/src/modules/rai-chat/planner-thread-continuity.spec.ts;apps/api/src/modules/rai-chat/branch-state-plane.persistence.spec.ts;apps/api/src/modules/rai-chat/rai-chat.request-body.validation.spec.ts;apps/api/test/a_rai-live-api-smoke.spec.ts;apps/web/__tests__/rai-chat-thread-response-smoke.spec.ts;apps/web/__tests__/ui-language.spec.ts;.github/workflows/invariant-gates.yml;package.json
---
# AGENT TARGET BLUEPRINT CLOSEOUT 2026-04-04

## CLAIM
id: CLAIM-EXE-AGENT-TARGET-BLUEPRINT-IMPLEMENTATION-SLICE-CLOSEOUT-20260404
status: asserted
verified_by: manual
last_verified: 2026-04-05

Этот документ фиксирует полный **repo-side closeout** bridge-документа `rai_ep_agent_system_target_implementation_blueprint.md`. Он не заявляет внешний production rollout или внешнюю pilot-эксплуатацию, но утверждает, что в границах репозитория target blueprint закрыт кодом, тестами, control-tower surface и execution/runbook-пакетом. По состоянию на `2026-04-05` этот closeout расширен ideal-alignment pass: канонический runtime/telemetry vocabulary очищен от historical aliases, live semantic request/build API переведён на `baselineClassification`-only, а compatibility для старых `legacyClassification` / `legacyRouteKey` изолирована в historical-read helper'ах и eval loader-bridge.

## 0. Что именно закрывается этим closeout

Этот closeout относится к полному repo-side target contour:

1. shared target-state contracts и JSON-first межагентный слой;
2. `SubIntentGraph` / `ExecutionPlan` / universal planner runtime;
3. branch-state / replay / governed resume / execution surface;
4. chat/web/control-tower consumption layer;
5. canary / rollback / control-tower / runbook packet для repo-side acceptance.

То есть документ отвечает на вопрос:

- чем именно доказано, что bridge до target-state закрыт внутри репозитория.

И он сознательно **не** отвечает на вопрос:

- произошёл ли уже внешний production rollout вне репо.

## 1. Что считается доставленным

- `AgentExecutionResult.text` больше не является обязательным контрактом; runtime/composer опираются на structured summary (`agent-execution-summary.ts`).
- `SemanticIngressService` строит `SubIntentGraph`, `BranchSchedulerService` — `ExecutionPlan`, а `SupervisorAgent` закрывает branch-driven planner runtime для `sequential / parallel / blocking / mixed / tool-less / composite / TechMap`.
- `BranchStatePlaneService`, persisted thread slice, replay/resume snapshots и governed mutation continuation работают как один planner-thread контур.
- `executionSurface`, `executionExplainability`, approve/resume path и pending-action state доходят до API, chat store, chat panel и control-tower forensics/dashboard.
- `plannerBranchTelemetry`, `controlTowerPlannerEnvelope`, graph snapshot, explainability timeline и trace forensics составляют operator-plane внутри репозитория.
- planner canary/rollback, ops/runbook документы и Phase D/E execution packet образуют repo-side rollout evidence.

## 2. Чем это подтверждено

Критический evidence packet:

1. Runtime:
   - `runtime-spine.integration.spec.ts`
   - `supervisor-agent.service.spec.ts`
   - `planner-thread-continuity.spec.ts`
   - `branch-state-plane.persistence.spec.ts`
   - `replay-resume.integration.spec.ts`
   - `agent-execution-summary.spec.ts`
2. UX / web:
   - `ai-chat-store.spec.ts`
   - `rai-chat-thread-response-smoke.spec.ts`
   - `control-tower-page.spec.tsx`
   - `control-tower-trace-page.spec.tsx`
3. Operator plane / explainability:
   - `explainability-panel.service.spec.ts`
   - `control-tower-planner-envelope.spec.ts`
   - `branch-runtime-telemetry.spec.ts`
4. Governance / HITL:
   - `pending-action.service.spec.ts`
   - `runtime-governance-policy.service.spec.ts`
5. Ops / rollout:
   - `PHASE_D_IMPLEMENTATION_PLAN.md`
   - `PHASE_E_IMPLEMENTATION_PLAN.md`
   - `RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md`
   - `PHASE_A3_RUNTIME_DRILL_REPORT_2026-03-31.md`

## 3. Что означает полное закрытие в границах репозитория

Полное закрытие blueprint в этом документе означает:

- target-gap между текущим кодом и target blueprint снят в пределах repo artifacts;
- оставшиеся различия с “внешним продом” лежат не в архитектурном хвосте blueprint, а в обычном operational применении уже существующих runbook/process документов;
- отдельный внешний event bus или manual-only visual sign-off не требуются как условие этого closeout, пока operator-plane и rollout evidence представлены в репо.

Именно поэтому closeout совместим одновременно с двумя утверждениями:

- blueprint закрыт repo-side;
- production rollout по-прежнему регулируется отдельными Phase D/E процедурами и не подменяется этим документом.

## 4. Связь с текущими фазами

- С точки зрения `Stage 2` это repo-side sign-off bridge-документа.
- С точки зрения `One Big Phase` это использует уже существующие `Phase B/C/D/E` артефакты как acceptance evidence, а не переписывает их.
- `Phase C` подтверждает consumption layer (`chat/web/control tower`), а `Phase D/E` подтверждают rollout/runbook контур.

## 5. Граница этого closeout

Документ не утверждает:

1. что внешний pilot уже проведён;
2. что за пределами репозитория уже поднят отдельный event bus/operator backend;
3. что любые будущие расширения доменов не потребуют новых implementation wave.

Документ утверждает ровно одно: blueprint как repo-side bridge к target-state закрыт и подтверждён evidence packet внутри текущего репозитория.

## 6. Ideal-Alignment Addendum (2026-04-05)

После исходного closeout-пакета репозиторий был дополнительно доведён ближе к `rai_ep_agent_system_ideal_canon.md` без смены базового тезиса документа.

### 6.1 Что именно дополнительно закрыто

- `AgentExecutionResult` и live runtime path работают как structured-first / JSON-only по execution-контракту; prose остаётся только в `ResponseComposer`.
- canonical execution/routing vocabulary очищен от `tool_call_primary`, `heuristic_fallback`, `semantic_router_*`;
- live semantic/planner path больше не эмитит `legacyClassification` / `legacyRouteKey`;
- `SemanticRoutingRequest` и `SemanticIngressService.buildFrame()` принимают только `baselineClassification` как live request/build contract;
- historical compatibility с legacy literals и полями локализована в:
  - web alias-normalization;
  - explainability historical-read helper'ах;
  - eval corpus loader-bridge.

### 6.2 Чем это подтверждено

Дополнительный evidence packet этого addendum:

1. API/runtime and semantic:
   - `supervisor-agent.service.spec.ts`
   - `runtime-spine.integration.spec.ts`
   - `rai-chat.service.spec.ts`
   - `semantic-router.service.spec.ts`
   - `semantic-router.eval.spec.ts`
   - `semantic-ingress.service.spec.ts`
   - `semantic-ingress.eval.spec.ts`
   - `tech-map-loop-state-object.integration.spec.ts`
   - `explainability-panel.service.spec.ts`
2. Web:
   - `control-tower-page.spec.tsx`
   - `control-tower-trace-page.spec.tsx`
   - `ui-language.spec.ts`
   - `rai-chat-thread-response-smoke.spec.ts`
   - `ai-chat-store.spec.ts`
3. Gates:
   - `pnpm --filter api exec tsc -p tsconfig.json --noEmit`
   - `pnpm lint:docs`
   - `pnpm lint:docs:matrix:strict`

### 6.3 Честный остаток

После финального ideal-alignment pass от `2026-04-05`:

- в non-test code больше не осталось `legacyClassification` / `legacyRouteKey`;
- historical routing corpora читаются только через eval loader-bridge в test/eval контуре;
- legacy literals больше не участвуют ни в primary runtime contract, ни в live emitted telemetry, ни в read-side service logic.

То есть compatibility-хвост больше не является runtime-хвостом системы, а остаётся только частью исторического test/eval слоя.
