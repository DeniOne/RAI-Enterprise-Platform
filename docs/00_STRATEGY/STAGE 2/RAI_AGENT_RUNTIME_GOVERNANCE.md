# RAI Agent Runtime Governance

> Версия: 1.0  
> Дата: 2026-03-09  
> Статус: Active Canon  
> Назначение: зафиксировать канон runtime-governance слоя для агентной платформы `RAI_EP`.

---

## 1. Назначение документа

Этот документ фиксирует единый канон для:

- `agent budgets`;
- `runtime concurrency`;
- `governed escalation`;
- `agent reliability`;
- `hallucination scoring`;
- `swarm telemetry`.

Документ нужен, потому что сейчас эти правила уже частично реализованы в коде, но распределены по нескольким сервисам и канонам:

- runtime spine;
- anti-hallucination contour;
- incidents/governance contour;
- performance and queue telemetry;
- trace quality contour.

Без отдельного runtime-governance документа платформа рискует получить разрыв между:

- тем, как агент исполняется;
- тем, как агент ограничивается;
- тем, как качество агента оценивается;
- тем, как platform operators видят деградацию.

---

## 2. Когда применять

Документ обязателен, когда:

- создаётся новый canonical agent;
- расширяется tool surface существующего агента;
- включается новый write path;
- проектируется fan-out между несколькими owner-агентами;
- вводятся новые quality gates;
- обсуждаются runtime budgets, hallucination policy или telemetry.

---

## 3. Канонические источники

Этот документ нужно читать вместе с:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AI_SYSTEM_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AI_SYSTEM_ARCHITECTURE.md)
- [RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)

И с текущими runtime/governance источниками в коде:

- [agent-runtime.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [tool-call.planner.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [budget-controller.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/budget-controller.service.ts)
- [risk-policy-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts)
- [pending-action.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/pending-action.service.ts)
- [incident-ops.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/incident-ops.service.ts)
- [performance-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/performance-metrics.service.ts)
- [queue-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/queue-metrics.service.ts)
- [truthfulness-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/truthfulness-engine.service.ts)
- [trace-summary.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/trace-summary.service.ts)
- [quality-alerting.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/quality-alerting.service.ts)

---

## 4. Базовый принцип

Runtime governance в `RAI_EP` должен работать по цепочке:

```text
intent -> runtime plan -> budget check -> policy check -> execution -> evidence -> trace quality -> incident/alert -> governance decision
```

Это означает:

- агент не просто “выполняет запрос”;
- каждый execution проходит через budget и policy слой;
- каждый результат должен быть наблюдаем, измерим и ретроспективно проверяем;
- quality drift должен переходить из telemetry в governance, а не оставаться на уровне логов.

---

## 5. Agent Budgets

### 5.1 Что считается budget governance

`Agent budgets` включают:

- token budget на tool call;
- runtime budget на запрос;
- owner-role budget inheritance;
- degrade / deny policy;
- replay bypass policy.

### 5.2 Что подтверждено кодом

Подтверждено в [budget-controller.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/budget-controller.service.ts):

- есть `TOOL_TOKEN_COST` по каждому `RaiToolName`;
- runtime может вернуть `ALLOW`, `DEGRADE`, `DENY`;
- есть `allowedToolNames`, `droppedToolNames`, `ownerRoles`;
- `replayMode` обходит enforcement как особый режим;
- budget enforcement идёт до фактического выполнения tool calls.

### 5.3 Нормативные правила

1. Каждый tool обязан иметь формализованный token cost.
2. Каждый новый canonical agent обязан входить в budget ownership map.
3. `DEGRADE` должен быть предпочтительнее `DENY`, если можно безопасно отбросить вторичные tool calls.
4. `DENY` обязателен, если даже минимальный write/read path превышает допустимый runtime budget owner-а.
5. Safe replay может обходить runtime budget только как служебный режим, а не как обычный продуктовый путь.

### 5.4 Что запрещено

- запуск нового tool без budget cost;
- write tool без owner budget attribution;
- silent drop без явного `droppedToolNames`;
- скрытый over-budget execution.

---

## 6. Concurrency

### 6.1 Как трактовать concurrency в этой платформе

Платформа использует не `all-to-all swarm`, а `hub-and-spoke orchestration`.

Значит `concurrency` здесь означает:

- параллельный fan-out по группам инструментов;
- ограничение по runtime deadline;
- queue pressure monitoring;
- controlled parallelism, а не свободный peer-to-peer mesh.

### 6.2 Что подтверждено кодом

Подтверждено в:

- [tool-call.planner.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-runtime.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [queue-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/queue-metrics.service.ts)

По факту:

- tool calls группируются по agent-groups;
- группы исполняются параллельно;
- есть hard deadline `30_000 ms`;
- partial response допустим при deadline exceeded;
- runtime queue pressure считается по `activeRuns` и `activeToolCalls`.

### 6.3 Нормативные правила

1. Concurrency допускается только через `ToolCallPlanner` и `AgentRuntimeService`.
2. Агенты не должны спавнить друг друга напрямую.
3. Fan-out допускается только для независимых execution branches.
4. При насыщении очередей runtime обязан сохранять telemetry, а не “молча тормозить”.
5. Queue pressure должен классифицироваться как минимум в состояния:
   - `IDLE`
   - `STABLE`
   - `PRESSURED`
   - `SATURATED`

### 6.4 Что запрещено

- uncontrolled nested fan-out;
- скрытый parallel write path;
- обход orchestration spine ради “быстрого” peer-to-peer handoff.

---

## 7. Escalation Governance

### 7.1 Что сюда входит

`Escalation` в runtime governance включает:

- policy-blocked actions;
- pending human confirmations;
- autonomy quarantine;
- incident creation;
- governed handoff в owner-domains.

### 7.2 Что подтверждено кодом

Подтверждено в:

- [risk-policy-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts)
- [pending-action.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/pending-action.service.ts)
- [incident-ops.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/incident-ops.service.ts)
- [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts)

По факту:

- `WRITE/CRITICAL` инструменты проходят через `RiskPolicy`;
- блокировки порождают `PendingAction` или incident;
- `QUARANTINE` и `TOOL_FIRST` режимы автономности уже поддерживаются;
- инциденты пишутся в persisted governance contour.

### 7.3 Нормативные правила

1. Любой blocked critical path должен оставлять machine-readable след:
   - incident;
   - pending action;
   - trace attribution.
2. Эскалация должна быть объяснимой:
   - почему заблокировано;
   - кто должен подтвердить;
   - какой owner-domain затронут.
3. Handoff в другой owner-domain не равен прямому execution в этом домене.
4. `front_office_agent`, `monitoring` и подобные маршрутизирующие роли могут инициировать escalation, но не подменять owner execution.

### 7.4 Что запрещено

- скрытая блокировка без incident/pending trace;
- escalation без owner attribution;
- обход human gate для governed write.

---

## 8. Agent Reliability

### 8.1 Что считается reliability

`Agent reliability` включает:

- success rate;
- latency;
- p95 latency;
- error rate;
- fallback rate;
- no-evidence rate;
- budget denial rate;
- policy block rate.

### 8.2 Что подтверждено кодом

Подтверждено в:

- [performance-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/performance-metrics.service.ts)
- [agent-runtime.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [golden-test-runner.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts)

По факту:

- latency и errors записываются;
- агрегаты считаются по времени и по agent-role;
- golden-set eval уже участвует в governance change path;
- runtime допускает partial result при timeout/error.

### 8.3 Нормативные правила

1. У каждого canonical agent должна быть наблюдаемая reliability baseline.
2. Любой новый canonical agent должен иметь:
   - golden set;
   - minimum token budget;
   - observable latency/error profile.
3. Fallback mode не считается success без отдельного учёта.
4. “Ответ был получен” не равен “agent reliability ok”.

### 8.4 Минимальный reliability профиль canonical agent

Минимум нужно отслеживать:

- `successRatePct`
- `avgLatencyMs`
- `p95LatencyMs`
- `errorCount`
- `fallbackUsedRate`
- `budgetDeniedRate`
- `policyBlockedRate`

---

## 9. Hallucination Scoring

### 9.1 Как трактовать hallucination в этой платформе

В `RAI_EP` hallucination governance не должен строиться на субъективной “магии качества”.

Базовый канон:

- low evidence coverage;
- invalid claims;
- low confidence claims;
- BS drift;
- отсутствие grounding при требуемом evidence.

### 9.2 Что подтверждено кодом

Подтверждено в:

- [truthfulness-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/truthfulness-engine.service.ts)
- [trace-summary.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/trace-summary.service.ts)
- [quality-alerting.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/quality-alerting.service.ts)

По факту:

- считается `bsScorePct`;
- считается `evidenceCoveragePct`;
- считается `invalidClaimsPct`;
- trace summary обновляется quality-показателями;
- `BS_DRIFT` уже может переходить в quality alert и incident.

### 9.3 Нормативные правила

1. Hallucination scoring должен быть trace-level и aggregate-level.
2. Для runtime-governance обязательны минимум 3 метрики:
   - `bsScorePct`
   - `evidenceCoveragePct`
   - `invalidClaimsPct`
3. Если output contract требует evidence, отсутствие evidence не должно маскироваться как качественный success.
4. Рост `BS%` должен быть связан с governance alerts, а не только с offline аналитикой.

### 9.4 Что запрещено

- считать hallucination только по user complaints;
- скрывать `PENDING_EVIDENCE` как “нормальный ответ”;
- допускать новый canonical agent без hallucination observability.

---

## 10. Swarm Telemetry

### 10.1 Что здесь значит swarm telemetry

Для `RAI_EP` `swarm telemetry` означает не telemetry свободного peer-to-peer swarm.

Правильная трактовка:

- telemetry orchestration spine;
- telemetry runtime fan-out;
- telemetry agent groups;
- telemetry tool execution;
- telemetry quality/incidents;
- telemetry ownership attribution.

### 10.2 Что подтверждено кодом

Подтверждено в:

- [trace-summary.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/trace-summary.service.ts)
- [performance-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/performance-metrics.service.ts)
- [queue-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/queue-metrics.service.ts)
- [incident-ops.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/incident-ops.service.ts)

### 10.3 Нормативный минимальный telemetry spine

Каждый execution trace должен уметь ответить на вопросы:

1. Какой agent-role был owner?
2. Какие tools были запрошены?
3. Что было разрешено, что dropped, что denied?
4. Какой budget применился?
5. Были ли incidents?
6. Какая latency?
7. Какой quality score получился?
8. Был ли fallback?

### 10.4 Обязательные telemetry группы

- `runtime`
- `budget`
- `queue`
- `tool execution`
- `incidents`
- `quality`
- `ownership / owner role attribution`

---

## 11. Governance Decision Rules

### 11.1 Новый canonical agent нельзя считать production-ready, если

- нет budget policy;
- нет concurrency boundaries;
- нет incident/escalation path;
- нет reliability baseline;
- нет hallucination scoring;
- нет telemetry spine.

### 11.2 Новый tool нельзя включать в canonical role, если

- нет `TOOL_TOKEN_COST`;
- нет `TOOL_RISK_MAP`;
- нет owner-role attribution;
- нет trace visibility;
- нет degradation semantics.

### 11.3 Quality drift должен вести к действию

Если `BS%` или related quality metrics деградируют, governance должен иметь минимум три режима:

- `observe`
- `review_required`
- `rollback / quarantine`

---

## 12. Разрывы текущего состояния

### 12.1 Что уже в основном закрыто

- runtime budgets;
- queue telemetry;
- incident governance;
- trace quality scoring;
- quality drift alerting;
- canonical ownership budgets для существующих runtime roles.

### 12.2 Что ещё остаётся разрывом

- нет единого central canon-документа по runtime governance до текущего момента;
- не все operational dashboards синхронизированы с этими метриками;
- `swarm telemetry` термин не был до конца формализован;
- не все future roles имеют заранее определённые runtime-governance envelopes;
- часть fallback UX ещё может визуально маскировать runtime/governance gaps.

---

## 13. Практические требования к новым агентам

Каждый новый canonical agent обязан перед production-ready получить:

1. `responsibility contract`
2. `tool risk map`
3. `token cost map`
4. `runtime deadline and concurrency fit`
5. `incident policy`
6. `trace quality metrics`
7. `golden eval coverage`
8. `telemetry visibility by owner-role`

---

## 14. Связанные файлы и точки кода

- [RAI_AI_SYSTEM_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AI_SYSTEM_ARCHITECTURE.md)
- [RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
- [budget-controller.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/budget-controller.service.ts)
- [agent-runtime.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [tool-call.planner.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [risk-policy-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts)
- [pending-action.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/pending-action.service.ts)
- [incident-ops.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/incident-ops.service.ts)
- [performance-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/performance-metrics.service.ts)
- [queue-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/queue-metrics.service.ts)
- [truthfulness-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/truthfulness-engine.service.ts)
- [trace-summary.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/trace-summary.service.ts)
- [quality-alerting.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/quality-alerting.service.ts)
