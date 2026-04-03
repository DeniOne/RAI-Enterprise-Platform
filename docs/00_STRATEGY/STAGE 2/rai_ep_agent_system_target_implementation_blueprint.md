---
id: DOC-STR-STAGE-2-RAI-EP-TARGET-IMPLEMENTATION-BLUEPRINT-20260403
layer: Strategy
type: Roadmap
status: draft
version: 1.0.0
owners: [@techlead]
last_updated: 2026-04-03
claim_id: CLAIM-STR-STAGE2-TARGET-IMPLEMENTATION-BLUEPRINT-20260403
claim_status: asserted
verified_by: manual
last_verified: 2026-04-03
evidence_refs: docs/00_STRATEGY/STAGE 2/INDEX.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_RUNTIME_GOVERNANCE.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md;docs/00_STRATEGY/STAGE 2/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md;docs/00_STRATEGY/STAGE 2/rai_ep_agent_system_ideal_canon.md;docs/07_EXECUTION/AGENT_SYSTEM_ASIS_TOBE_2026-04-03.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_NEW_CHAT_MEMO.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_IMPLEMENTATION_PLAN.md;apps/api/src/modules/rai-chat
---
# RAI_EP — Target Implementation Blueprint

## CLAIM
id: CLAIM-STR-STAGE2-TARGET-IMPLEMENTATION-BLUEPRINT-20260403
status: asserted
verified_by: manual
last_verified: 2026-04-03

Этот документ является активным bridge-документом `Stage 2`: он переводит текущий подтверждённый runtime, действующий `master-plan` и идеальный канон агентной системы в один согласованный маршрут `current state -> gaps -> target state`. Документ не подменяет `RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md` как главный active canon и не утверждает, что целевая картина уже реализована в коде.

## 0. Роль документа

Этот blueprint нужен не для перезапуска `Stage 2` “с нуля”, а для устранения разрыва между:

- текущим подтверждённым agent runtime в `apps/api/src/modules/rai-chat`;
- активной стратегией `Stage 2`;
- идеальной картиной из `rai_ep_agent_system_ideal_canon.md`.

Правило чтения:

1. Главный active canon `Stage 2` остаётся `RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`.
2. Факт текущего состояния фиксируется через код, тесты и [AGENT_SYSTEM_ASIS_TOBE_2026-04-03.md](/root/RAI_EP/docs/07_EXECUTION/AGENT_SYSTEM_ASIS_TOBE_2026-04-03.md).
3. Этот blueprint задаёт путь закрытия разрывов до target-state.
4. `rai_ep_agent_system_ideal_canon.md` используется как north-star reference, а не как утверждение о текущем runtime.

## 1. Подтверждённая точка старта

Стартовая база уже не нулевая.

| Контур | Подтверждённое состояние | Что это означает для плана |
|---|---|---|
| Agent platform и governance | Платформенный каркас `Stage 2` в основном собран: registry, budget/runtime governance, incidents, eval/evidence, audit/trace, control-plane. | Blueprint не должен повторять программу build-out “с нуля”. |
| Канонический orchestration spine | `SupervisorAgent -> SemanticRouter/SemanticIngress -> AgentRuntime -> ResponseComposer -> Truthfulness` уже работает как основной backend-контур. | Внедрение идёт через доращивание текущего spine, а не через его замену. |
| Owner-агенты и доменный runtime | `agronomist`, `economist`, `knowledge`, `monitoring`, `crm_agent`, `front_office_agent`, `contracts_agent` уже являются реальными runtime-участниками. | Следующий шаг не в расширении зоопарка ролей, а в углублении orchestration semantics. |
| Governed write-path | Risk policy, pending actions, confirmation path и audit trail уже существуют. | Нужно не изобретать новый safety contour, а унифицировать его под branch/runtime-модель target-state. |
| Work windows и clarification UX | Первый reusable execution-surface slice уже живой в backend и UI. | `Phase C` должна потреблять готовое execution-state ядра, а не подменять собой ядро. |
| TechMap-centered core-loop | Активная стратегия `One Big Phase` закрепляет Техкарту как центр ядра и выводит `execution / deviation / result` loop в `Phase B`. | Decomposition/planner slice должен строиться вокруг TechMap-loop, а не вокруг абстрактного chat-demo. |
| Lifecycle, control tower и pilot-hardening | Для lifecycle, canary/rollback, control tower и `Phase D` уже есть активные каноны и implementation-планы. | Production governance и ops-путь нельзя считать “потом разберёмся”; они уже часть активной стратегии. |

## 2. Что этот blueprint обязан исправить

Предыдущая версия blueprint была полезна как общая архитектурная программа, но имела стратегический drift. Эта версия вводит жёсткие ограничения:

1. Нельзя начинать с `Wave 0` как будто platform/governance ещё не построены.
2. Нельзя ставить user-facing `UI execution surface` раньше explainability/evidence/state core.
3. Нельзя делать вид, что TechMap-loop вторичен относительно общего chat-orchestration.
4. Нельзя выносить ownership map, runtime governance, lifecycle и control tower за рамки target-state.
5. Нельзя трактовать этот документ как второй “главный canon” рядом с `master-plan`.

Итоговое правило:

- `master-plan` отвечает за главный активный замысел;
- этот blueprint отвечает за путь закрытия разрыва до идеального канона;
- `code/tests/gates` остаются источником runtime truth.

## 3. Карта разрывов `AS-IS -> IDEAL`

| Целевой компонент | Что уже есть | Главный разрыв | Чем закрывается |
|---|---|---|---|
| `SubIntentGraph` как first-class объект | `SemanticIngressFrame`, `CompositeWorkflowPlan`, intent contracts, limited composites | Нет общего graph-object для mixed-intent runtime | `Track 1` |
| Planner-driven orchestration | `SupervisorAgent` и special-case composites | Нет общего `ExecutionPlan + BranchScheduler` для `parallel / sequential / blocking` | `Track 2` |
| Строгие branch contracts | Сильная типизация runtime уже есть, но `AgentExecutionResult` всё ещё несёт `text` | Межагентный слой ещё не полностью `JSON-only` | `Track 0` и `Track 2` |
| Governed branch state и replay | Есть pending actions, audit, trustfulness, partial execution state | Нет единого branch-state plane, который одинаково держит graph, verdicts, confirmations и replay | `Track 3` |
| Trust/verdict canon | Есть `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED` и branch trust artifacts | Таксономия и runtime mapping ещё не сведены в единый target contract | `Track 0` и `Track 3` |
| Execution surface | `workWindows`, clarification loop и richer outputs уже существуют | UI пока частично отражает специальные сценарии, а не общий planner-state | `Track 4` |
| Production-managed multi-agent runtime | Есть governance, lifecycle, control tower, `Phase D` hardening path | Эти контуры ещё не увязаны с будущим multi-intent runtime как единый rollout path | `Track 5` |
| Model strategy | Есть registry/config-driven LLM wiring и hybrid режимы | Модельная специализация ещё опережает planner/runtime maturity только локально | `Track 6` |

## 4. Реализационные треки

### Track 0 — Contract Convergence Over Current Runtime

Цель:
- ввести канонический `target-state` язык без слома текущего runtime.

Что входит:
- унификация типов `SubIntentGraph`, `ExecutionPlan`, `ExecutionBranchResult`, `ExecutionSurfaceState`, `MutationPacket`, `ConfirmationRequest`, `PolicyDecision`;
- bridge-layer между новыми контрактами и существующими `SemanticIngressFrame`, `CompositeWorkflowPlan`, branch trust types, pending actions;
- единая taxonomy mapping-таблица для `branch status`, `trust verdict`, `mutation risk`, `confirmation state`;
- стратегия миграции от частично текстовых agent results к структурированным branch payload.

Definition of Done:
- shared-контракты живут в коде и используются без ломки текущего `SupervisorAgent` пути;
- новые типы не спорят с активными `Phase B` и `Stage 2` канонами;
- появляется явный compatibility-layer, а не скрытая вторая схема данных.

Стратегическая привязка:
- это foundation-пакет для `Phase B`, но не рестарт платформы с нуля.

### Track 1 — TechMap-Centered Sub-Intent Graph

Цель:
- сделать `SubIntentGraph` первым реальным объектом исполнения для ядрового TechMap-loop.

Что входит:
- graph builder поверх `SemanticIngressService`;
- декомпозиция запросов классов `informational`, `analytical`, `read + action`, `cross-domain`, `confirmation-gated`;
- first-wave поддержка сценария `context -> TechMap -> execution -> deviation -> result`;
- сохранение graph в state-plane и выдача inspectable trace для разработчика и explainability-core.

Definition of Done:
- mixed-intent запросы перестают туннелироваться в одну owner-ветку;
- graph строится минимум для канонических TechMap-centered сценариев;
- graph можно увидеть, восстановить и использовать дальше в planner-runtime.

Стратегическая привязка:
- это прямое продолжение `Phase B1/B2`, а не отдельный абстрактный AI-эксперимент.

### Track 2 — Planner-Driven Runtime On Top Of Supervisor

Цель:
- дорастить `SupervisorAgent` до planner-driven оркестрации без разрыва текущего spine.

Что входит:
- `ExecutionPlan` поверх `SubIntentGraph`;
- `BranchScheduler` с режимами `sequential`, `parallel`, `blocking_on_confirmation`, `mixed`;
- запуск read-only mixed flows сначала на ограниченном core-срезе;
- перенос composite special-cases в общий planner-path;
- постепенный переход от role-owned prose к structured branch payload с финальной композицией только на уровне orchestrator.

Definition of Done:
- хотя бы часть mixed-intent core-flow реально исполняется по плану, а не через hardcoded sequence;
- blocking-ветки корректно ждут confirmation и возобновляются;
- orchestration decisions трассируются как first-class runtime artifacts;
- новый planner-path доказан таргетированными eval/spec, прежде чем менять default runtime mode.

Стратегическая привязка:
- это ядро незакрытого разрыва между текущим `tool-first/hybrid` состоянием и идеальным каноном.

### Track 3 — Governed Trust, State And Mutation Closure

Цель:
- замкнуть branch-level state, policy, trust и replay в один честный execution contour.

Что входит:
- branch-state store для graph, statuses, confirmation state, mutation state и trust artifacts;
- единый `MutationPacket` поверх уже существующего governed write-path;
- mapping current trust taxonomy к target-state contract без потери детализации;
- recovery/replay/resume для confirmation-gated и multi-step сценариев;
- explainability как structured artifact, а не только как prose.

Definition of Done:
- любая ветка имеет восстанавливаемый статус, verdict и след policy-решений;
- write-actions не обходят governed path и не теряют rollback/evidence metadata;
- explainability/evidence встроены в core-flow до начала UI-polish.

Стратегическая привязка:
- это закрывает `Phase B4` и удерживает правило: explainability-core раньше user-facing оболочки.

### Track 4 — Execution Surface Consumption In Phase C

Цель:
- сделать `Phase C` слоем потребления уже собранного execution-state, а не местом, где придумывается логика оркестрации.

Что входит:
- проекция planner-state в `workWindows`, pending confirmations, mutation feedback и branch disclosures;
- стабилизация пути `thread -> message -> response` для governed web-chat;
- пользовательская визуализация branch state, evidence и continuation points;
- сохранение жёсткой границы: UI не определяет runtime truth, а читает её.

Definition of Done:
- `Phase C` отражает реальный execution-state ядра;
- пользователь видит не только финальный prose, но и управляемый progress веток;
- ни один critical runtime invariant не живёт только в frontend.

Стратегическая привязка:
- этот трек полностью соответствует границе `Phase C`, заданной в `PHASE_B_IMPLEMENTATION_PLAN.md` и `PHASE_C_NEW_CHAT_MEMO.md`.

### Track 5 — Runtime Governance, Lifecycle And Production Hardening

Цель:
- связать будущий multi-intent runtime с уже активными контурами ownership, lifecycle, control tower и pilot-hardening.

Что входит:
- увязка planner-runtime с `RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md`;
- budgets, concurrency, escalation и reliability policies на уровне branch execution;
- canary/promote/rollback path для planner/runtime изменений;
- operator-plane telemetry и control-tower visibility по новым branch artifacts;
- привязка `Phase D` и последующих rollout-контуров к real multi-agent behavior, а не только к инфраструктуре.

Definition of Done:
- новый runtime меняется только через governed rollout path;
- control tower и lifecycle board видят planner/runtime-состояние как first-class operational signals;
- self-host/pilot контур готов валидировать не только shell, но и честную multi-intent оркестрацию.

Стратегическая привязка:
- этот трек удерживает связность `Stage 2`, `One Big Phase`, lifecycle и operator-plane, чтобы target-state не оторвался от production reality.

### Track 6 — Model Specialization Only After Runtime Proof

Цель:
- оптимизировать модельный слой только после того, как planner, state, governance и evals уже работают как система.

Что входит:
- orchestrator model strategy;
- cost-aware routing;
- domain specialization там, где уже есть доказанный runtime benefit;
- latency/cost optimization без ломки correctness.

Definition of Done:
- model changes сравниваются по eval, trustfulness stability, latency и cost;
- выбор модели перестаёт компенсировать архитектурные дыры planner/state plane.

Стратегическая привязка:
- этот трек всегда идёт последним и не подменяет собой `Track 1–5`.

## 5. Прямая привязка к активным execution-фазам

| Активная фаза | Что из blueprint относится к фазе | Что не должно в неё просачиваться |
|---|---|---|
| `Phase B` | `Track 0`, `Track 1`, `Track 2`, `Track 3` | `web`-breadth, installability, pilot hardening |
| `Phase C` | `Track 4` | изобретение core-логики на стороне UI |
| `Phase D` | ops/pilot часть `Track 5` | расширение продуктовой ширины вместо hardening |
| `Phase E` | managed deployment/governance continuation для `Track 5` | ранняя модельная гонка без operational proof |

Правило:

- если задача нужна, чтобы замкнуть `TechMap -> execution -> deviation -> result` loop и planner/state core, это `Phase B`;
- если задача нужна, чтобы показать это состояние в `web`, это `Phase C`;
- если задача нужна для installability, recovery, support и pilot, это `Phase D`.

## 6. Немедленный первый delivery-пакет

Первая практическая пачка не должна быть абстрактной. Она должна включать:

1. shared target-state contracts в `apps/api/src/shared/rai-chat`;
2. graph builder внутри `SemanticIngressService` с first-wave TechMap-centered покрытием;
3. `ExecutionPlan` и planner-path внутри `SupervisorAgent`;
4. branch state/trust/mutation mapping в `SupervisorAgent`, `ResponseComposer` и persistence/runtime слоях.

Ожидаемый эффект:

- текущий runtime остаётся рабочим;
- появляется первый честный `SubIntentGraph -> ExecutionPlan -> branch state` slice;
- специальные composite-сценарии получают путь миграции в общий target runtime.

## 7. Критерии сближения с идеальным каноном

Система может считаться реально движущейся к идеалу только если одновременно выполняются условия:

1. свободный mixed-intent запрос декомпозируется в несколько веток как first-class runtime object;
2. ветки исполняются в режимах `sequential / parallel / blocking / mixed` без hardcoded stitched flow;
3. межагентный слой опирается на структурированные контракты, а финальный prose собирается оркестратором;
4. governed write-path остаётся единственным путём мутаций и подтверждений;
5. branch state переживает confirmation wait, retry и restart;
6. explainability/evidence являются structured core-layer, а не декоративным текстом;
7. `Phase C` показывает execution-state, а не имитирует его;
8. runtime rollout, canary, rollback и pilot path встроены в lifecycle/control tower контур.

## 8. Финальное управленческое правило

Правильный путь к идеальной агентной системе RAI_EP выглядит так:

- не расширять хаотично число ролей;
- не переписывать работающий spine ради абстрактной “чистоты”;
- не путать `UI surface` с ядром оркестрации;
- не выносить governance, lifecycle и pilot в необязательный хвост;
- доращивать текущий runtime до `SubIntentGraph -> ExecutionPlan -> governed branch state -> execution surface` по шагам, согласованным с `master-plan` и `Phase B/C/D`.

Именно в этой роли данный blueprint и должен использоваться: как документ закрытия разрыва между текущим кодом и идеальным каноном, а не как параллельный манифест или как программа повторного старта `Stage 2`.
