---
id: DOC-STR-STAGE-2-RAI-ROUTING-LEARNING-LAYER-PROBLEM-1JTB
layer: Strategy
type: Vision
status: draft
version: 0.1.0
---
# RAI Routing Learning Layer: Problem Statement and Controlled Migration Blueprint

## Verdict

Текущее направление развития выбрано правильно: системе нужен не бесконечный рост phrase-bound туннелей, а semantic-first routing поверх контрактного исполнения.

Но в исходном виде эта идея была скорее сильным архитектурным манифестом, чем полным production design. Чтобы она стала рабочим blueprint'ом, в неё нужно добавить:
- state-aware routing, а не только message-aware routing;
- explicit `proceed / clarify / confirm / abstain` bands;
- capability gating и reduction tool-surface;
- shadow mode и online diffing старого и нового router;
- versioned routing memory и строгую таксономию ошибок.

Итоговый статус: `одобрить как целевое направление и запускать как controlled migration program`.

Критическое усиление до старта:
- telemetry schema нельзя откладывать на потом, она входит в первую итерацию вместе с DTO и shadow router;
- versioning routing-компонентов обязателен с первого дня;
- redaction и PII-безопасность логов должны быть встроены до накопления dataset.

## Summary

Проблема платформы заключается не в недостатке отдельных агентов, а в том, что routing-слой всё ещё частично живёт по логике Stage 2:
- через фразы;
- через regex-перехваты;
- через точечные исключения;
- через локальные туннельные фиксы.

При росте количества агентов, доменов, UI-поверхностей и пользовательских формулировок такой подход становится хрупким, дорогим и плохо контролируемым.

Правильная эволюция:
- выделить единый `Routing Learning Layer`;
- сделать его state-aware и schema-driven;
- оставить governance и runtime guards детерминированными;
- улучшать routing через telemetry, evals, case memory и controlled adaptation.

## Problem Statement

### 1. Phrase-bound routing instead of semantic routing

Сейчас система слишком часто принимает решение на основании совпадения слов, а не на основании структурированного намерения.

Следствие:
- `read-only` запросы попадают в `create-flow`;
- `navigation` запросы превращаются в `clarification`;
- одинаковый пользовательский смысл даёт разное поведение на соседних wording-вариантах.

### 2. Stage 2 heuristics still dominate Stage 3 tool calling

В Stage 3 контуре всё ещё живут legacy-перехватчики и fallback-пути, которые были полезны раньше, но теперь конфликтуют с contract-first orchestration.

Следствие:
- semantic intent определяется нестабильно;
- tool calling теряет приоритет;
- orchestration становится трудно предсказуемой и трудно тестируемой.

### 3. Local tunnel fixes do not scale

Каждый локальный фикс в духе "добавим ещё один special-case" чинит один кейс, но системно ухудшает платформу.

Следствие:
- стоимость поддержки растёт быстрее качества;
- появляется большое количество хрупких исключений;
- regressions мигрируют по соседним формулировкам и сценариям.

### 4. No true learning loop

Ошибки маршрутизации и реальные user corrections не превращаются автоматически в:
- нормализованный routing dataset;
- eval corpus;
- repeatable improvement cycle.

Следствие:
- знания о сбоях остаются в голове команды и в чатах;
- система не учится на собственных ошибках;
- улучшение качества остаётся ручным и реактивным.

### 5. Message-only reasoning is insufficient

Routing нельзя строить только по одной реплике пользователя. Для production нужны:
- текущий workspace;
- открытый объект;
- активный flow;
- pending clarification;
- текущая цель диалога;
- уже собранный context;
- предыдущие corrections.

Следствие:
- routing, который понимает только текст, будет семантическим только формально.

### 6. Tool surface grows faster than human maintainability

Чем больше инструментов, агентов и доменных режимов, тем сильнее модель путается, если ей заранее отдавать весь zoo возможностей.

Следствие:
- растёт стоимость inference;
- падает точность выбора;
- увеличивается риск ложного tool selection и неверной оркестрации.

## Core Thesis

Нужно строить не "обучение всех агентов сразу", а единый `Routing Learning Layer`, который:
- преобразует `message + state + workspace context` в structured routing intent;
- принимает bounded route decision;
- сужает допустимый набор возможностей;
- передаёт исполнение в контрактный runtime;
- пишет audit trail и correction signals обратно в learning loop.

## Why the First Draft Was Not Enough

### 1. Flat `SemanticIntent` was too weak

Поля `domain/entity/action/filters/confidence` полезны как старт, но недостаточны для production routing.

Недостающие измерения:
- текущий режим взаимодействия;
- мутабельность и риск;
- объект в фокусе;
- состояние диалога и flow;
- resolvability;
- ambiguity type;
- рекомендуемый execution mode.

### 2. One confidence score is not enough

Одного числового `confidence` недостаточно. Router обязан дисциплинированно уметь:
- продолжать;
- задавать bounded clarification;
- требовать confirmation;
- явно abstain.

### 3. Case memory without governance is dangerous

Case memory может стать источником застывших ошибок, если не контролировать:
- schema version;
- contract version;
- TTL / freshness;
- correction signals;
- deprecation старой routing logic.

### 4. Offline loop alone is insufficient

Offline evals обязательны, но без shadow mode и online diffing платформа не увидит часть production-regressions до удара по пользователю.

### 5. Router should not become a new monolith too early

На первой итерации не нужен отдельный микросервис routing. Сначала нужен встроенный structured routing step внутри текущего supervisor/orchestrator path, но уже:
- с DTO;
- с telemetry;
- с shadow comparison;
- с bounded fallback;
- с deterministic runtime guards.

Эффект:
- быстрый выигрыш без лишней распределённой сложности;
- появление production dataset до выноса router в отдельный сервис.

## Target Architecture

### 1. Intent Parsing Layer

Первый слой должен быть state-aware и возвращать строгий structured output.

```ts
type InteractionMode =
  | "read_only"
  | "write_candidate"
  | "navigation"
  | "analysis";

type MutationRisk =
  | "safe_read"
  | "side_effecting_write"
  | "irreversible_write";

type Resolvability =
  | "resolved"
  | "missing_context"
  | "multiple_candidates"
  | "conflicting_state"
  | "no_match";

type AmbiguityType =
  | "none"
  | "missing_context"
  | "multiple_candidates"
  | "current_flow_conflict"
  | "route_conflict"
  | "unsupported_request";

type RecommendedExecutionMode =
  | "answer_directly"
  | "navigate"
  | "fetch_read"
  | "propose_write"
  | "dry_run"
  | "ask_clarification"
  | "ask_confirmation"
  | "abstain";

type ConfidenceBand = "high" | "medium" | "low";

type SemanticIntent = {
  domain: "agro" | "finance" | "crm" | "knowledge" | "governance";
  entity:
    | "techmap"
    | "field"
    | "season"
    | "plan"
    | "contract"
    | "party"
    | "invoice"
    | "alert"
    | "document"
    | "unknown";
  action:
    | "list"
    | "open"
    | "create"
    | "update"
    | "delete"
    | "analyze"
    | "compare"
    | "search"
    | "answer";
  interactionMode: InteractionMode;
  mutationRisk: MutationRisk;
  focusObject?: {
    kind: string;
    id?: string;
    title?: string;
    source: "workspace" | "dialog_state" | "user_reference";
  };
  dialogState: {
    activeFlowId?: string;
    pendingClarification?: string;
    waitingForField?: string;
  };
  filters?: Record<string, unknown>;
  requiredContext?: string[];
  resolvability: Resolvability;
  ambiguityType: AmbiguityType;
  recommendedExecutionMode: RecommendedExecutionMode;
  confidence: number;
  confidenceBand: ConfidenceBand;
  candidateRoutes?: Array<{
    routeId: string;
    score: number;
    reason: string;
  }>;
};
```

Эффект:
- routing начинает понимать не только тему, но и режим взаимодействия;
- похожие фразы перестают путать `read`, `write`, `navigation` и `analysis`.

### 2. Route Decision Layer

Второй слой не должен решать "какой tool вызвать из текста". Он должен решать, какой execution mode в принципе разрешён.

```ts
type RouteDecision = {
  decisionType:
    | "execute"
    | "navigate"
    | "clarify"
    | "confirm"
    | "block"
    | "abstain";
  executionMode?:
    | "answer_directly"
    | "fetch_read"
    | "propose_write"
    | "dry_run"
    | "open_route";
  ownerRole: string | null;
  eligibleFlows: string[];
  eligibleTools: string[];
  reason: string;
  abstainReason?: string;
  policyBlockReason?: string;
  requiresHumanGate: boolean;
  requiresConfirmation: boolean;
  preconditions: string[];
  requiredContextMissing: string[];
  idempotencyPolicy?: "required" | "optional" | "not_applicable";
};
```

Эффект:
- router выбирает не "ответ по фразе", а допустимый режим исполнения или отказа;
- write-сценарии становятся безопаснее и прозрачнее.

### 3. Capability Gating Layer

На вход execution не должен попадать весь набор инструментов платформы.

Принцип:
- router сначала выбирает route class;
- затем формируется узкий allowlist допустимых tools и flows;
- вниз передаётся только релевантный capability subset.

Порядок внедрения gating:
- сначала `coarse route-class allowlist`;
- потом `entity-specific allowlist`;
- только после этого тонкая динамическая фильтрация.

Эффект:
- уменьшается tool confusion;
- падает token cost;
- повышается качество tool selection.

### 4. Deterministic Runtime Guards

Даже идеальный router не может заменять runtime governance.

Обязательные проверки:
- ownership;
- mutability;
- required context completeness;
- policy gates;
- human approval;
- idempotency;
- audit requirements.

Эффект:
- write-path остаётся governed;
- система не превращается в "уверенно ошибающуюся".

### 5. Execution and Audit Layer

Исполнение должно писать назад в telemetry и learning loop:
- выбранный маршрут;
- candidate routes;
- execution path;
- фактический outcome;
- policy blocks;
- fallback overrides;
- user corrections.

Эффект:
- каждая ошибка становится материалом для следующего улучшения.

## Confidence Policy

### High confidence

Действие:
- идти дальше по contract router и capability gating.

Ожидаемый эффект:
- быстрый и прямой happy-path.

### Medium confidence

Действие:
- запускать bounded clarification или dry-run.

Ожидаемый эффект:
- система не делает опасный скачок в неверное исполнение.

### Low confidence or conflict

Действие:
- явно `abstain`, показать причину и ограниченный список безопасных направлений.

Ожидаемый эффект:
- уменьшается число уверенных misroutes.

## Case Memory Design

Case memory допустима только при строгой дисциплине.

Для каждого routing case нужны:
- `router_schema_version`;
- `tool_contract_version`;
- `agent_contract_version`;
- `created_at`;
- `expires_at`;
- `user_correction`;
- `final_outcome`;
- `deprecated_logic_source`.

Правило:
- кейсы из deprecated routing logic не участвуют в retrieval;
- старые кейсы вытесняются по freshness и correction quality;
- retrieval не должен иметь права переопределять deterministic policy.

Эффект:
- case memory помогает обобщать wording;
- платформа не тащит в будущее старые ошибки.

## Telemetry Schema

Минимальная telemetry-запись должна включать:

```ts
type RoutingTelemetryEvent = {
  traceId: string;
  threadId: string;
  userQuery: string;
  routerVersion: string;
  promptVersion: string;
  toolsetVersion: string;
  workspaceRoute?: string;
  workspaceStateDigest?: string;
  activeFlow?: string;
  semanticIntent: SemanticIntent;
  routeDecision: RouteDecision;
  candidateRoutes: Array<{
    routeId: string;
    score: number;
    reason: string;
  }>;
  executionPath:
    | "semantic_primary"
    | "tool_call_primary"
    | "heuristic_fallback"
    | "policy_blocked";
  fallbackReason?: string;
  abstainReason?: string;
  policyBlockReason?: string;
  requiredContextMissing?: string[];
  userCorrection?: string;
  policyBlocked: boolean;
  finalOutcome:
    | "success"
    | "clarified"
    | "confirmed"
    | "abstained"
    | "misrouted"
    | "blocked";
  latencyMs: number;
};
```

Эффект:
- собирается не просто выбор маршрута, а причинность выбора и его исход;
- датасет становится пригодным для evals и adaptation.

## Telemetry Safety Rules

Telemetry не может писаться "как есть". До старта сбора production dataset должны существовать:
- redaction rules для PII, договорных данных, документов, реквизитов и свободного текста;
- hashing / digest для чувствительного workspace state вместо сырого дампа;
- allowlist полей, которые разрешено отправлять в eval pipeline;
- раздельное хранение raw operational logs и training-ready normalized events;
- retention policy и TTL для routing dataset.

Эффект:
- dataset не становится compliance-проблемой;
- learning loop остаётся безопасным для enterprise-контура.

## Eval Matrix

Минимальный eval harness нельзя ограничивать только перефразировками.

Матрица должна покрывать:
- `domain × entity × action`;
- полноту контекста;
- multi-turn state;
- ambiguity;
- mutation risk;
- policy-sensitive writes;
- русский wording variants.

Для русского production-контура нужно отдельно включить:
- просторечие;
- телеграммный стиль;
- сокращения;
- мат;
- эллипсис;
- недосказанные запросы;
- смешанные команды вида "открой и сравни";
- ссылки на текущий объект типа "вот этот", "тот же", "как прошлый".

Эффект:
- routing проверяется на реальном пользовательском языке, а не на лабораторных фразах.

## Learning Strategy

Правильная последовательность не `train first`, а `adapt first`.

### Step 1. Structured contracts

Действие:
- ввести `SemanticIntent` и `RouteDecision`.

Ожидаемый эффект:
- появляется единый язык описания routing поведения.

### Step 2. Telemetry

Действие:
- логировать route decisions, candidate routes и outcomes.

Ожидаемый эффект:
- появляется production dataset.

### Step 3. Evals

Действие:
- построить eval corpus и graders.

Ожидаемый эффект:
- качество становится измеримым.

### Step 4. Retrieval-assisted case memory

Действие:
- добавить versioned case memory как bounded assist, а не как источник истины.

Ожидаемый эффект:
- улучшается обобщение формулировок без большой стоимости.

### Step 5. Prompt/router tuning

Действие:
- улучшать routing prompt и structured parsing на основе eval failures.

Ожидаемый эффект:
- быстрый прирост качества без fine-tuning.

### Step 6. Fine-tune or distill a small routing model

Действие:
- переходить к отдельной модели только после накопления достаточного корпуса и устойчивой таксономии.

Ожидаемый эффект:
- latency, cost и control улучшаются на зрелом фундаменте, а не на сырой схеме.

## Shadow Mode Requirement

Переход нельзя делать "в лоб".

Нужна controlled migration схема:
- старый router и новый router одновременно считают маршрут;
- в проде исполняется старый или безопасно оговорённый путь;
- divergence логируется;
- rollout идёт только после прохождения evals и shadow diff thresholds.

Эффект:
- regressions становятся видимыми до того, как сломают пользовательский сценарий.

## Practical Proposal

### Proposal A. Replace direct text-driven tool choice with state-aware SemanticIntent

Действие:
- перейти от `message -> tool` к `message + state + workspace context -> SemanticIntent`.

Ожидаемый эффект:
- routing перестаёт зависеть только от wording;
- появляется переносимый semantic contract.

### Proposal B. Separate execution mode inside contracts

Действие:
- зафиксировать `read / write / navigation / analysis` и `direct / clarification / confirmation / deny` в contract router.

Ожидаемый эффект:
- похожие по формулировке, но разные по риску действия начинают расходиться корректно.

### Proposal C. Add capability gating

Действие:
- перед execution сужать набор доступных инструментов до route-relevant allowlist.

Ожидаемый эффект:
- снижается путаница модели;
- уменьшается token footprint;
- повышается точность исполнения.

### Proposal D. Build full routing telemetry

Действие:
- логировать не только выбранный маршрут, но и candidate routes, fallback reason, policy block, correction и outcome.

Ожидаемый эффект:
- появляется причинно пригодный датасет;
- команда перестаёт диагностировать поведение по догадкам.

### Proposal E. Introduce shadow mode before full cutover

Действие:
- включить новый router сначала как shadow decision layer внутри текущего supervisor path.

Ожидаемый эффект:
- controlled migration без резкого production риска.

### Proposal F. Adapt router first, do not train the whole swarm

Действие:
- сначала улучшать только routing layer, а не все доменные агенты сразу.

Ожидаемый эффект:
- система масштабируется управляемо;
- стоимость внедрения остаётся рациональной.

## Sprint Rollout Plan

### Sprint 1. Taxonomy, DTO, telemetry, shadow router

Действие:
- зафиксировать базовые enum'ы для `entity`, `action`, `interactionMode`, `mutationRisk`, `ambiguityType`, `decisionType`, `confidenceBand`;
- внедрить `SemanticIntent`, `RouteDecision`, `RoutingTelemetryEvent`;
- добавить минимальную telemetry schema сразу с `routerVersion`, `promptVersion`, `toolsetVersion`;
- встроить shadow router в текущий supervisor/orchestrator path без влияния на основной execution path;
- включить redaction rules для routing telemetry.

Ожидаемый эффект:
- появляется наблюдаемая карта расхождений между legacy и semantic routing;
- платформа начинает собирать пригодный для анализа dataset с первого дня.

Exit criteria:
- не менее 95% routing events пишутся по новой telemetry schema;
- shadow router считает маршрут минимум на целевом проценте трафика для выбранного slice;
- основной prod path не меняется по поведению;
- telemetry проходит redaction policy и не пишет запрещённые поля в raw dataset.

### Sprint 2. Candidate logging, divergence review, coarse gating, eval harness

Действие:
- логировать candidate routes и причины выбора победителя;
- поднять divergence review dashboard по top failure clusters;
- внедрить coarse route-class allowlist для capability gating;
- собрать eval harness по первому slice.

Ожидаемый эффект:
- команда видит не шум, а доминирующие классы routing-ошибок;
- execution surface начинает сужаться безопасным способом.

Exit criteria:
- dashboard показывает top-10 failure clusters по divergence;
- coarse capability gating покрывает первый выбранный slice;
- eval harness запускается в CI;
- candidate route logging стабилен и version-aware.

### Sprint 3. Techmaps slice migration

Действие:
- перевести `techmaps / list-open-create` на новую цепочку:
  `SemanticIntent -> RouteDecision -> Capability Gating -> Runtime Guards`;
- сохранить deterministic guards для write-path;
- оставить bounded fallback только как safety net.

Ожидаемый эффект:
- появляется первый доказанный production pattern новой архитектуры.

Exit criteria:
- `techmaps/list-open-create` проходит целевой quality threshold;
- write-path не исполняется без runtime guards;
- доля ложных create-flow на read-only запросах падает до целевого уровня;
- divergence между shadow и primary path стабильно уменьшается.

### Sprint 4. Versioned case memory for confirmed clusters

Действие:
- включить case memory только на подтверждённых failure clusters;
- добавить versioning, TTL, correction quality и deprecation filters.

Ожидаемый эффект:
- память начинает обобщать реальные повторы, а не закреплять случайный шум.

Exit criteria:
- case memory не использует deprecated routing logic;
- retrieval ограничен version-compatible кейсами;
- failure clusters с case memory показывают измеримое улучшение по evals.

### Sprint 5. Router tuning and optional distillation

Действие:
- улучшать routing prompt, retrieval policy и при необходимости distill/fine-tune малую routing model.

Ожидаемый эффект:
- обучение идёт уже на очищенном и versioned материале, а не на хаосе.

Exit criteria:
- tuning даёт измеримый прирост по eval corpus и shadow diff;
- latency и token cost не выходят за согласованные пределы;
- migration criteria для следующего domain slice формализованы.

## Important Boundaries

### 1. Governance is runtime infrastructure, not a model hope

Нельзя заменять policy, ownership, confirmation и human gates "умной моделью".

### 2. Routing memory must never override deterministic policy

Case memory может помогать routing, но не может обходить governance.

### 3. Router should not own business execution

Router определяет допустимый режим и владельца, но не подменяет собой contract runtime.

### 4. No uncontrolled self-training in production

Прод не должен обучать себя напрямую. Улучшение проходит через controlled adaptation cycle.

## Conclusion

Стратегически правильное решение для RAI_EP:
- отказаться от бесконечного роста tunnel-fixes;
- перейти к state-aware semantic-first routing;
- отделить route decision от runtime governance;
- построить telemetry/evals/shadow-mode pipeline;
- адаптировать сначала routing layer, а не весь swarm.

Это уже не просто "идея обучаемого роутера", а controlled migration blueprint, по которому можно проектировать:
- DTO;
- error taxonomy;
- telemetry schema;
- eval matrix;
- rollout plan;
- production-safe evolution path.

## References

- OpenAI Structured Outputs:
  - https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI Evaluation Best Practices:
  - https://developers.openai.com/api/docs/guides/evaluation-best-practices
- Anthropic Building Effective Agents:
  - https://www.anthropic.com/engineering/building-effective-agents
- Anthropic Writing Tools for Agents:
  - https://www.anthropic.com/engineering/writing-tools-for-agents
- Rasa Flows:
  - https://rasa.com/docs/pro/build/writing-flows/
- Rasa Command Generator:
  - https://rasa.com/docs/pro/customize/command-generator/
- Semantic Kernel Planning:
  - https://learn.microsoft.com/en-us/semantic-kernel/concepts/planning
