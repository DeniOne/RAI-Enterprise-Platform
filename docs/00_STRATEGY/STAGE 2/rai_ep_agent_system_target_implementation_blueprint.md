---
id: DOC-STR-STAGE-2-RAI-EP-TARGET-IMPLEMENTATION-BLUEPRINT-20260403
layer: Strategy
type: Roadmap
status: active
version: 1.30.0
owners: [@techlead]
last_updated: 2026-04-05
claim_id: CLAIM-STR-STAGE2-TARGET-IMPLEMENTATION-BLUEPRINT-20260403
claim_status: asserted
verified_by: manual
last_verified: 2026-04-05
evidence_refs: docs/00_STRATEGY/STAGE 2/INDEX.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md;docs/00_STRATEGY/STAGE 2/rai_ep_agent_system_ideal_canon.md;docs/07_EXECUTION/AGENT_SYSTEM_ASIS_TOBE_2026-04-03.md;docs/07_EXECUTION/AGENT_TARGET_BLUEPRINT_IMPLEMENTATION_SLICE_CLOSEOUT_2026-04-04.md;apps/api/src/modules/rai-chat;apps/api/src/shared/rai-chat
---
# RAI_EP — Target Implementation Blueprint

## CLAIM
id: CLAIM-STR-STAGE2-TARGET-IMPLEMENTATION-BLUEPRINT-20260403
status: asserted
verified_by: manual
last_verified: 2026-04-05

Bridge-документ `Stage 2`: маршрут `current state → gaps → target state`. Он не подменяет `RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`, но по состоянию на `2026-04-05` его repo-side target-gap закрыт кодом, тестами, control-tower surface и execution/runbook-пакетом. После `2026-04-05` repo ушёл ещё дальше к `ideal canon`: live runtime/telemetry path больше не эмитит `legacyClassification` / `legacyRouteKey`, server-side и web primary vocabulary очищены от historical execution/routing aliases, а compatibility-слой сжат до historical-read fallback. Формальный execution closeout вынесен в [AGENT_TARGET_BLUEPRINT_IMPLEMENTATION_SLICE_CLOSEOUT_2026-04-04.md](/root/RAI_EP/docs/07_EXECUTION/AGENT_TARGET_BLUEPRINT_IMPLEMENTATION_SLICE_CLOSEOUT_2026-04-04.md).

---

## Навигационное правило

Ниже остаётся capability-snapshot для навигации между стратегией и кодом:

- `[x]` означает, что в репозитории есть реализация и автоматизированная опора в `code/tests/gates`;
- `[~]` означает частичное закрытие или сознательно незамкнутый контракт;
- `[ ]` означает, что target-gap ещё не закрыт.

Этот snapshot помогает читать разрыв до target-state, но не заменяет отдельный execution closeout.

---

## Соответствие коду (жёстко)

1. Любая строка с `[x]` должна иметь **якорь в коде** и **проверку** (unit/integration/eval, `pnpm gate:*`, workflow), перечисленную в `evidence_refs` или явно в примечании строки.
2. Если поведение есть только в проде / в голове — строка **`[~]`** или **`[ ]`**, пока не появится артефакт в репо.
3. Строки про control-tower / rollout / JSON-only слой переводятся в **`[x]`** только при наличии кода, тестов и repo-side execution evidence packet. Для этого документа таким пакетом считаются runtime/web спеки, planner/control-tower gates, explainability/control-tower UI smoke и runbook-документы `Phase D/E`.

---

## Роли и ограничения (без изменений смысла)

1. Главный active canon Stage 2: `RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`.
2. Факт runtime: код, тесты, `docs/07_EXECUTION/AGENT_SYSTEM_ASIS_TOBE_2026-04-03.md`.
3. Не перезапускать платформу «с нуля»; доращивать spine `Supervisor → SemanticIngress → AgentRuntime → ResponseComposer → Truthfulness`.
4. UI execution surface не подменяет ядро; TechMap-loop — центр декомпозиции.

---

## Чеклист: карта разрывов → закрытие

| Разрыв | Статус | Примечание (якорь в коде / что намеренно не закрыто) |
|--------|--------|------------------------------------------------------|
| `SubIntentGraph` как first-class объект | [x] | `buildSubIntentGraphFromSemanticFrame`, `SemanticIngressService.buildFrame`, `explicitPlannerToolCalls`, `validateSubIntentGraphAntiTunnel`; спеки: `sub-intent-graph.*`, `semantic-ingress.service.spec.ts`. Отдельный standalone graph snapshot в audit без ingress — **не** реализован (см. Track 1). |
| `ExecutionPlan` + planner-driven оркестрация | [x] | `BranchSchedulerService`, `SupervisorAgent` + `RAI_PLANNER_RUNTIME_ENABLED`; carry-forward `continueSameGraph`; `planner-thread-continuity.spec.ts`, `runtime-spine.integration.spec.ts`. Один primary `executeAgent` на HTTP-запрос — **текущий контракт** (не баг чеклиста). |
| Строгие branch contracts / JSON-слой | [x] | `AgentExecutionResult` больше не содержит runtime-поля `text`; runtime adapters, `AgentRuntimeService` и planner/composite aggregate пишут summary только в `structuredOutput`. Human-facing prose собирается в `ResponseComposer` через `resolveAgentExecutionSummary` / `extractStructuredRuntimeSummary`. Server-side `IntentClassification.method`, execution-path contracts и web primary DTO/label maps очищены от historical aliases; старые literals живут только в historical-read fallback. Спеки: `agent-execution-summary.spec.ts`, `agent-execution-adapter.service.spec.ts`, `agent-runtime.service.spec.ts`, `response-composer.service.spec.ts`, `supervisor-agent.service.spec.ts`, `ui-language.spec.ts`, `control-tower-trace-page.spec.tsx`. |
| Единый branch-state plane + replay | [x] | `BranchStatePlaneService`, `execution-surface-runtime.ts` (`advanceRunnableRootsToRunning`, `finalizeSurfaceFromExecution`, `propagateCancelledForBlockedDependencies`), FSM `PLANNED→CANCELLED`; тесты: `execution-surface-runtime.spec.ts`, `execution-branch-lifecycle.spec.ts`, `planner-thread-continuity.spec.ts`, `branch-state-plane.persistence.spec.ts`, `runtime-spine.integration.spec.ts`. Связка **replay ↔ plane** слабая — см. Track 3. |
| Trust taxonomy → target contract | [x] | `execution-target-state.bridge.ts`, `branch-verdict-rules.ts`, wiring в `TruthfulnessEngineService` / `ResponseComposerService`; спеки: `execution-target-state.bridge.spec.ts`, `branch-verdict-rules.spec.ts`, `supervisor-agent.service.spec.ts`, `response-composer.service.spec.ts`. |
| Execution surface в UI sense | [x] | Backend `executionSurface`/`executionExplainability`, chat store/panel approve-resume path, `rai-chat-thread-response-smoke`, `ai-chat-store.spec.ts`, `control-tower-trace-page.spec.tsx`, `control-tower-page.spec.tsx`, `lint:ui-language`. Repo-side acceptance packet заменяет отдельный ручной visual sign-off. |
| Governance / control tower × multi-intent | [x] | `plannerBranchTelemetry`, `metadata.controlTowerPlannerEnvelope`, `metadata.controlTowerSubIntentGraphSnapshot`, explainability timeline/forensics service, Control Tower web pages и ops/runbook контур `Phase D/E`. Live telemetry и divergence path больше не эмитят `legacyClassification` / `legacyRouteKey`; эти поля сохранены только как historical-read fallback. Гейты и тесты: `gate:api:control-tower-planner-envelope`, `explainability-panel.service.spec.ts`, `control-tower-*.spec.tsx`, `runtime-spine.integration.spec.ts`, `supervisor-agent.service.spec.ts`. |
| Model strategy после runtime proof | [x] | `eval/model-routing.regression.eval.spec.ts`; baseline gate `eval/model-routing.baseline.ts` + `model-routing.baseline.spec.ts`, `pnpm gate:api:model-routing-baseline` (p95 локального `buildPlan`+`topo`, proxy cost = ветки+`dependsOn`); **реальные** LLM latency/tokens в CI — вне этого gate. |

---

## Track 0 — Contract convergence

- [x] Типы `SubIntentGraph`, `ExecutionPlan`, `ExecutionSurfaceState`, `ExecutionBranchResult`, `MutationPacket`, `ConfirmationRequest`, `TargetPolicyDecision` в `apps/api/src/shared/rai-chat/`
- [x] `ExecutionBranchLifecycle` + `MutationConfirmationState` + `applyExecutionBranchTransition` + `execution-branch-lifecycle.spec.ts`
- [x] Bridge: `execution-target-state.bridge.ts` + `execution-target-state.bridge.spec.ts`
- [x] `MutationPacket`: guard `isMutationPacketEligibleForApply` + `mutation-packet.guard.spec.ts`
- [x] Единая taxonomy-таблица на shared-слое: `execution-branch-lifecycle.ts`, `execution-target-state.bridge.ts`, `branch-verdict-rules.ts`; parity/whitelist покрыты `execution-surface.dto.spec.ts`, `execution-branch-lifecycle.spec.ts`, `branch-verdict-rules.spec.ts`
- [x] Миграция межагентного слоя на JSON-only без потери совместимости: runtime-контракт `AgentExecutionResult` больше не содержит `text`; structured summary живёт в `structuredOutput.summary` и резолвится в composer через `agent-execution-summary.ts`; live path больше не пишет historical execution/routing aliases в новые runtime/telemetry payload, а web/UI читает их только через alias-normalization fallback; спеки: `agent-execution-summary.spec.ts`, `agent-execution-adapter.service.spec.ts`, `agent-runtime.service.spec.ts`, `response-composer.service.spec.ts`, `supervisor-agent.service.spec.ts`, `semantic-router.service.spec.ts`, `semantic-ingress.service.spec.ts`, `explainability-panel.service.spec.ts`, `ui-language.spec.ts`
- [x] Регрессия: supervisor / semantic-ingress specs в CI (как часть `pnpm`/workflow репозитория)

---

## Track 1 — TechMap-centered SubIntentGraph

- [x] `buildSubIntentGraphFromSemanticFrame` + вызов из `SemanticIngressService.buildFrame`
- [x] Классы веток в builder: informational / analytical / read_action / cross_domain / tech_map_core
- [x] Сценарий `context → TechMap → execution → deviation → result` как **один** связный snapshot: `runtime/tech-map-loop-state-object.integration.spec.ts` (describe = имя сценария), фикстура `eval/tech-map-rebuild-draft-ingress.params.ts`; в snapshot входят `SemanticIngressFrame` (TechMap), `ExecutionPlan`, `initialSurface`, топопорядок, `deviationFollowUp` (hook по `seasonId`), ожидаемый артефакт. Дополнительно: узкий **HTTP** smoke `apps/api/test/a_rai-live-api-smoke.spec.ts` — resume `tech_map_draft` при `RAI_PLANNER_RUNTIME_ENABLED`, `executionSurface.branches`, audit `metadata.controlTowerPlannerEnvelope` + `plannerBranchTelemetry`. **Нет** полного HTTP e2e с вызовом deviation tool в одном запросе — вне этого чеклиста.
- [x] Graph в trace/forensics как отдельное поле: полный ingress по-прежнему в `metadata.semanticIngressFrame`; компактный **graph-only** снимок — `metadata.controlTowerSubIntentGraphSnapshot` (`schemaVersion: control_tower.sub_intent_graph.v1`), `buildControlTowerSubIntentGraphSnapshotV1` в `control-tower-planner-envelope.ts`, wiring в `SupervisorForensicsService.writeAiAuditEntry`; тесты: `control-tower-planner-envelope.spec.ts`, `supervisor-agent.service.spec.ts`, HTTP smoke `a_rai-live-api-smoke.spec.ts` (planner block).
- [x] Тесты: `sub-intent-graph.builder.spec.ts`, `eval/sub-intent-graph.eval.spec.ts`
- [x] Anti-tunnel: `validateSubIntentGraphAntiTunnel` в `buildFrame` + `sub-intent-graph.mixed-intent-invariants.spec.ts`, builder/eval, `semantic-ingress.service.spec.ts`

---

## Track 2 — Planner-driven runtime

- [x] `BranchSchedulerService`: `buildExecutionPlanFromIngress`, `resolveStrategy`, `computeTopologicalScheduleOrder`, `buildInitialSurface` + `branch-scheduler.service.spec.ts`
- [x] `SupervisorAgent` + `RAI_PLANNER_RUNTIME_ENABLED` + `supervisor-agent.service.spec.ts`
- [x] `execution-surface-runtime.ts` + `execution-surface-runtime.spec.ts` (в т.ч. `isPlannerSliceFullyTerminal`, propagate cancel)
- [x] `planner-thread-continuity.spec.ts`, `branch-state-plane.persistence.spec.ts`, supervisor planner-блок
- [x] Продолжение плана между сообщениями: `continueSameGraph`, `advanceRunnableRootsToRunning`, `recordThreadPlannerSlice` / `getThreadPlannerSlice`; **тесты:** `planner-thread-continuity.spec.ts`, `runtime-spine.integration.spec.ts` (sequential 4-tick, cap+второй тик). Carry-forward модель сохранена: текущий тик исполняет только те ветки, которые уже были `RUNNING` на его старте.
- [x] Non-composite multi-branch runtime: `executePlannerBranchesForTick` в `SupervisorAgent` исполняет `RUNNING` ветки branch-by-branch с отдельным `executeAgent`, нормализует per-branch `toolCalls`, агрегирует `branchResults` / `branchTrustAssessments` / `branchCompositions` и не схлопывает multi-explicit путь обратно в один пакетный runtime-вызов. **Тесты:** `supervisor-agent.service.spec.ts`, `runtime-spine.integration.spec.ts`.
- [x] TechMap planner-loop: `executePlannerBranchesForTick` теперь принимает `tech_map_core + tech_map_clarify`, сохраняет базовый `structuredOutput` core-ветки для `applyTechMapWorkflowFrame`, а `tool-less` clarify branch переводит виртуально через surface (`COMPLETED` или `RUNNING` при открытом `clarifyBatch`). **Тесты:** `supervisor-agent.service.spec.ts`, `runtime-spine.integration.spec.ts`.
- [x] `blocking_on_confirmation` / `mixed`: runtime-cycle `BLOCKED_ON_CONFIRMATION -> APPROVED_FINAL -> resume -> carry-forward next branch` подтверждён в `runtime-spine.integration.spec.ts`; чисто `tool-less` RUNNING ветки больше не отбрасываются (`supervisor-agent.service.spec.ts`); approve/resume path доведён до chat/web store
- [x] Composite: stage-driven generic executor в `SupervisorAgent` + `payloadBindings` / `resolveCompositeStagePayload` / `finalizeNamedBranchFromExecution`; CRM и agro→finance не держатся на workflow-specific ветвлениях, а supported planner contours закрыты одним runtime-loop
- [x] Интеграция planner в spine: `runtime-spine.integration.spec.ts` — sequential multi-tick (4× `executeAgent`); multi-explicit (2 ветки, snake_case id, branch-driven per tick); concurrency cap (deferral); второй тик при cap=1 (carry-forward, 2× `executeAgent` по двум тикам). Multi-explicit больше не зафиксирован как один primary runtime-call на сообщение.

---

## Track 3 — Governed trust, state, mutation closure

- [x] `BranchStatePlaneService` (in-memory snapshot по `traceId`) + использование в supervisor
- [x] Персистенция среза: `rai_planner_thread_states`, `RAI_PLANNER_THREAD_PERSIST`, `branch-state-plane.persistence.spec.ts`; ошибки БД → лог, in-memory фолбэк
- [x] `PENDING` / resume: `pendingActionId` на поверхности, `APPROVED_FINAL` gate, planner resume payload в API, chat/web store approve-only continuation; тесты: `runtime-spine.integration.spec.ts`, `pending-action.service.spec.ts`, `ai-chat-store.spec.ts`
- [x] `MutationPacket` guard + spec
- [x] `executionExplainability` в `RaiChatResponseDto` + `execution-surface-projection.spec.ts`
- [x] Replay: `replayMode` + registry + `BranchStatePlaneService` snapshot/persistence; live write-path при этом не дублирует `legacyClassification` / `legacyRouteKey` в новые planner/telemetry события, а historical-read fallback сохранён в explainability и shared types; тесты: `replay-resume.integration.spec.ts`, `branch-state-plane.persistence.spec.ts`, `planner-thread-continuity.spec.ts`, `explainability-panel.service.spec.ts`

---

## Track 4 — Phase C consumption

- [x] `executionSurface` / `workWindows` / `ResponseComposer` + projection spec
- [x] `executionExplainability` в DTO + whitelist `execution-surface.dto.spec.ts`
- [x] POST `/rai/chat`: whitelist + `rai-chat.request-body.validation.spec.ts`; паритет `ClarificationResumeCollectedContextDto` с `buildResumeExecutionPlan` (в т.ч. `batchId`/`itemId`/`uom`/`qty` для fulfillment resume) + live smoke `a_rai-live-api-smoke.spec.ts`
- [x] Web smoke: `apps/web/__tests__/rai-chat-thread-response-smoke.spec.ts` + `pnpm gate:web:rai-chat-smoke` в `package.json` / workflow
- [x] `pnpm lint:ui-language` + `apps/web/__tests__/ui-language.spec.ts` + CI. Полный визуальный обход UI — **вне** репо.

---

## Track 5 — Governance, lifecycle, production

- [x] `plannerBranchTelemetry` + `buildBranchPlannerTelemetrySnapshot` + `branch-runtime-telemetry.spec.ts`
- [x] `runtime-governance-policy.service.spec.ts` (planner + branch slice)
- [x] Branch concurrency: `advanceRunnableRootsToRunning`, `plannerAdvanceMeta`, `executionExplainability.concurrencyDeferral` + `policyDecision: branch_concurrency_cap`; audit deferral через telemetry snapshot (`plannerConcurrencyDeferredBranchIds` / `plannerConcurrencyCap`); интеграция: `runtime-spine.integration.spec.ts` (cap e2e)
- [x] Canary / rollback для promote planner-path: `planner-promotion-policy.ts` (`resolvePlannerRuntimePathEnabled`); env `RAI_PLANNER_ROLLBACK` (kill-switch), `RAI_PLANNER_CANARY_COMPANY_IDS` (allowlist), `RAI_PLANNER_CANARY_PERCENT` (детерминированный bucket по `companyId`); wiring в `SupervisorAgent` + `plannerPromotion` в `plannerBranchTelemetry`; гейт `pnpm gate:api:planner-promotion-policy`. **Нет** отдельного UI/ops-playbook «promote wave» в репо.
- [x] Control tower: stable audit-contract `buildControlTowerPlannerEnvelopeV1` + graph snapshot + explainability timeline/forensics + Control Tower web pages + repo-side rollout/runbook packet (`PHASE_D_IMPLEMENTATION_PLAN.md`, `PHASE_E_IMPLEMENTATION_PLAN.md`, `RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md`). Отдельный внешний bus не требуется для repo-side closeout

---

## Track 6 — Model specialization

- [x] `eval/model-routing.regression.eval.spec.ts`
- [x] Явные пороги baseline (latency p95, structural cost proxy) с падением CI: `model-routing.baseline.ts`, `model-routing.baseline.spec.ts`, фикстура `model-routing.fixtures.ts`, гейт `pnpm gate:api:model-routing-baseline`; порог p95: env `RAI_MODEL_ROUTING_BASELINE_P95_MS_MAX` (default 300 ms). Пороги **по факту вызовов LLM** — не этот артефакт.
- [x] Стабильность `BranchVerdict` без сети: `branch-verdict-rules.ts` (агрегация recommended/overall из учёта truthfulness) + `branch-verdict-rules.spec.ts`; wiring в `TruthfulnessEngineService` / `ResponseComposerService`; гейт `pnpm gate:api:branch-verdict-rules` (`jest --runInBand`, без LLM). Полноразмерный «корпус» под eval — вне этого пункта.

---

## Первый delivery-пакет (§6 blueprint) — чеклист

- [x] (1) Shared contracts в `apps/api/src/shared/rai-chat`
- [x] (2) Graph builder в semantic ingress (first-wave)
- [x] (3) `ExecutionPlan` + planner-path в supervisor (под флагом) + интеграционные тесты spine
- [x] (4) Branch state / trust / mutation в supervisor + composer; персистенция среза, pending-action UX и approve/resume continuation подтверждены runtime/web тестами

---

## Критерии сближения с идеалом (§7) — чеклист

- [x] (1) Mixed-intent → несколько веток: `subIntentGraph` + anti-tunnel для фикстур (TechMap+clarify, composite parity, multi-explicit); прочие multi-intent **вне** инвариантов — осознанно.
- [x] (2) `sequential / parallel / blocking / mixed` без stitched hardcode в прод-пути — supported runtime contours закрыты planner-first loop, включая `TechMap`, composite, governed resume и чисто `tool-less` running branches
- [x] (3) Структурированные контракты + prose на оркестраторе — runtime опирается на structured-core; prose остаётся только как optional summary и финальный user-facing composition
- [x] (4) Governed write-path для мутаций — код + registry/policy путь
- [x] (5) Branch state между сообщениями и при персистенции — `BranchStatePlaneService`, thread persistence, replay/resume snapshots и planner continuity подтверждены тестами
- [x] (6) Explainability как structured core по целевому контуру — `executionExplainability`, branch trust artifacts, planner telemetry, explainability timeline и trace forensics используют structured runtime artifacts
- [x] (7) Phase C из ядра: chat/web surface, approve/resume UX, control-tower trace/dashboard smoke и execution closeout packet подтверждают repo-side consumption без отдельного manual blocker
- [x] (8) Rollout / canary / rollback / control tower × multi-intent — planner promotion policy, kill-switch/canary, control-tower surface, explainability timeline и ops/runbook packet в репо закрывают target-контур для repo-side acceptance

---

## Привязка к фазам (кратко)

| Фаза | Треки |
|------|--------|
| Phase B | 0–3 |
| Phase C | 4 |
| Phase D / E | 5 (ops) |
| После доказательства runtime | 6 |

---

## Execution Reference

Repo-side closeout по состоянию на `2026-04-04` зафиксирован отдельно в:

- [AGENT_TARGET_BLUEPRINT_IMPLEMENTATION_SLICE_CLOSEOUT_2026-04-04.md](/root/RAI_EP/docs/07_EXECUTION/AGENT_TARGET_BLUEPRINT_IMPLEMENTATION_SLICE_CLOSEOUT_2026-04-04.md)

Именно execution-документ отвечает на вопросы:

- чем именно подтверждено полное repo-side закрытие bridge;
- какие acceptance артефакты и runbook-пакеты составляют финальное evidence packet;
- где проходит граница между repo-side closeout и внешним production rollout.

## Управленческое правило (сохранено)

- Не раздувать роли хаотично; не переписывать spine ради «чистоты»; не путать UI с ядром; governance и pilot не в хвост.
- Целевая цепочка: `SubIntentGraph → ExecutionPlan → governed branch state → execution surface` — наращивать по шагам согласно master-plan и Phase B/C/D.
