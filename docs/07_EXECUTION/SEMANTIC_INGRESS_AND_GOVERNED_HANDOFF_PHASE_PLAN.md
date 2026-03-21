---
id: DOC-EXE-SEMANTIC-INGRESS-GOVERNED-HANDOFF-20260321
layer: Execution
type: Phase Plan
status: draft
version: 0.1.22
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-EXE-SEMANTIC-INGRESS-GOVERNED-HANDOFF-20260321
claim_status: asserted
verified_by: manual
last_verified: 2026-03-21
evidence_refs: docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md;docs/00_STRATEGY/STAGE 2/RAI_FRONT_OFFICE_AGENT_CANON.md;docs/00_STRATEGY/STAGE 2/RAI_ROUTING_LEARNING_LAYER_PROBLEM_AND_PROPOSAL.md;docs/00_STRATEGY/STAGE 2/RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_RUNTIME_GOVERNANCE.md;docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md;docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md;apps/api/src/modules/rai-chat/supervisor-agent.service.ts;apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts;apps/api/src/modules/rai-chat/supervisor-forensics.service.ts;apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts;apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts;apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts;apps/api/src/modules/rai-chat/truthfulness-engine.service.ts;apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts;apps/api/src/modules/rai-chat/trace-summary.service.ts;apps/api/src/modules/rai-chat/trace-summary.service.spec.ts;apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts;apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.spec.ts;apps/api/src/modules/rai-chat/composer/response-composer.service.ts;apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts;apps/api/src/modules/rai-chat/eval/branch-trust.eval.spec.ts;apps/api/src/modules/explainability/explainability-panel.service.ts;apps/api/src/modules/explainability/explainability-panel.service.spec.ts;apps/api/src/modules/explainability/dto/trace-summary.dto.ts;apps/api/src/modules/explainability/dto/trace-forensics.dto.ts;apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts;apps/api/src/shared/rai-chat/agent-interaction-contracts.ts;apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts;apps/api/src/shared/rai-chat/branch-trust.types.ts;apps/api/src/modules/rai-chat/agent-platform/agent-platform.types.ts;apps/api/src/shared/rai-chat/rai-chat.dto.ts;apps/web/lib/api.ts;apps/web/app/(app)/control-tower/page.tsx;apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx;apps/web/__tests__/control-tower-page.spec.tsx;apps/web/__tests__/control-tower-trace-page.spec.tsx;packages/prisma-client/schema.prisma
---
# Semantic Ingress And Governed Handoff Phase Plan

## CLAIM
id: CLAIM-EXE-SEMANTIC-INGRESS-GOVERNED-HANDOFF-20260321
status: asserted
verified_by: manual
last_verified: 2026-03-21

## 0. Исполнительный вывод

Целевой результат для `RAI_EP` должен выглядеть так:

- пользователь пишет свободной фразой, без командного синтаксиса;
- система сначала понимает тип входящего общения и смысл действия;
- затем оркестратор определяет `primary owner-agent` по semantic intent, а не по route и не по словарю триггеров;
- после этого запускается governed execution path: `clarify / confirm / execute / block`;
- branch-results от доменных агентов приходят в typed `JSON` и проходят trust/evidence verification до финальной композиции ответа;
- `route` и `workspaceContext` остаются сильными подсказками, но перестают быть главным источником смысла;
- адаптеры агентов перестают повторно угадывать intent из текста;
- write-безопасность обеспечивается policy-слоем, а не набором глаголов в regex.

Эффект этого плана:

- пользователь перестаёт подстраиваться под внутренний словарь системы;
- качество реального чата начинает определяться смыслом запроса, а не удачностью формулировки;
- оркестратор перестаёт слепо доверять agent-ответам и начинает собирать финальный ответ только из проверенных branch-данных;
- кодовая база теряет часть дублирующего routing-шума и становится предсказуемее для развития;
- governed runtime сохраняется, но перестаёт блокировать естественный ingress.

## 1. Целевое состояние

### 1.1 Что должно уметь пользовательское взаимодействие

Пользователь должен иметь право:

- открыть чат в рабочем продукте;
- написать запрос свободной человеческой фразой;
- не знать названия intent-а, tool-а, role-а или нужной страницы;
- получить корректный следующий шаг:
  - короткий ответ;
  - clarification;
  - confirmation;
  - governed execution;
  - честный `fallback` или `manual-human-required`.

### 1.2 Что должно происходить внутри платформы

Канонический путь должен стать таким:

```text
Пользователь
  -> semantic ingress parse
  -> classification of interaction mode
  -> owner-intent selection
  -> governed policy/risk decision
  -> owner-agent execution
  -> typed result / clarification / confirmation / handoff
```

### 1.2.1 Как должен обрабатываться сложносочленённый запрос

Для составного пользовательского запроса система не должна делать вид, что это один плоский intent.

Она должна:

1. распознать, что запрос `composite`;
2. разложить его на подзадачи;
3. определить зависимости между подзадачами;
4. определить `lead owner-agent` для всей сессии;
5. решить, какие шаги можно выполнять параллельно, а какие только последовательно;
6. вернуть единый агрегированный результат или единый clarification-plan.

Канонический путь для такого запроса:

```text
Пользователь
  -> semantic ingress parse
  -> composite detection
  -> sub-intent graph
  -> lead owner selection
  -> policy/risk check per subtask
  -> parallel or sequential execution
  -> aggregated result / clarification / confirmation plan
```

### 1.2.2 Правило `lead owner-agent`

Даже если в запросе несколько подзадач, разговор не должен терять одного координирующего владельца.

`lead owner-agent` определяется по таким правилам:

1. побеждает домен, который даёт финальный бизнес-эффект, которого хочет пользователь;
2. если есть write-подзадача и read-only подзадачи, `lead owner-agent` берётся из write-домена;
3. если есть несколько write-доменов, оркестратор не исполняет их как одну неразделённую команду, а строит staged plan с confirmation;
4. если все подзадачи read-only, `lead owner-agent` берётся из домена финального пользовательского вопроса, а остальные идут как evidence/advisory branches.

Эффект этого правила:

- пользователь видит один сквозной сценарий, а не распад диалога на хаотические agent-ответы;
- orchestration остаётся управляемым;
- multi-agent сценарий не превращается в скрытую `all-to-all` mesh-сеть.

### 1.2.3 Правило зависимостей между подзадачами

Подзадачи должны делиться на три типа:

- `independent`
- `dependent`
- `blocking`

`independent`:

- можно выполнять параллельно;
- обычно это read-only retrieval, evidence enrichment, safe analysis.

`dependent`:

- следующий шаг возможен только после результата предыдущего;
- типичный пример: `зарегистрировать контрагента -> создать CRM account -> создать связь -> открыть карточку`.

`blocking`:

- выполнение невозможно без дополнительного контекста или confirmation;
- типичный пример: в одном сообщении есть два write-домена или отсутствует ключевая сущность для одной из веток.

Эффект этого правила:

- оркестратор получает явную execution strategy;
- исчезает соблазн исполнять сложный запрос как один непрозрачный tool-call;
- UI может показывать пошаговый статус и честно объяснять, почему часть сценария ждёт контекст или подтверждение.

### 1.2.4 Multi-source analytical question

Нужно отдельно различать:

- `multi-action request`
- `multi-source analytical question`

`multi-action request`:

- пользователь просит выполнить несколько действий;
- пример: `зарегистрируй контрагента, создай карточку и открой её`.

`multi-source analytical question`:

- пользователь задаёт один вопрос;
- но для ответа нужно собрать данные из нескольких доменных источников;
- пример: `покажи сколько было вылито селитры на поле 2 у Казьминский и сколько это стоило`.

Для `multi-source analytical question` действуют правила:

- это один пользовательский вопрос, а не несколько отдельных команд;
- должен быть один `lead owner-agent`;
- остальные агенты работают как `read / evidence / advisory branches`;
- итогом должен быть один агрегированный ответ, а не набор разрозненных agent-replies.

Эффект этого правила:

- сложные аналитические вопросы начинают обрабатываться как единый сценарий;
- для пользователя сохраняется цельный диалог;
- orchestration остаётся управляемым даже при нескольких источниках данных.

### 1.2.5 JSON-first branch contract

Для multi-source вопроса межагентный обмен не должен идти через промежуточные текстовые ответы.

Каноническое правило:

- каждый agent-branch возвращает оркестратору typed `JSON payload`;
- оркестратор собирает итоговый ответ из нескольких `JSON payload`;
- текст для пользователя генерируется только на финальном слое orchestration/composition.

Минимальные поля branch-result:

- `source_agent`
- `domain`
- `entity_scope`
- `facts`
- `metrics`
- `money`
- `evidence_refs`
- `confidence`
- `assumptions`
- `data_gaps`

Эффект `JSON-first` схемы:

- уменьшается расход токенов на межагентный обмен;
- оркестратор получает структурированные данные вместо prose;
- проще строить deterministic aggregation;
- проще разделять факт, расчёт, оценку и отсутствие данных.

### 1.2.6 `Branch Trust Gate`

Typed `JSON payload` сам по себе ещё не делает ответ достоверным. Валидный `JSON` тоже может содержать правдоподобную ложь, неверное допущение или перепутанный scope.

Поэтому между branch-result и финальной композиции ответа нужен отдельный слой:

- `Branch Trust Gate`

Оркестратор не должен доверять branch-result как тексту от "умного агента". Он должен относиться к нему как к набору утверждений, которые нужно проверить.

Минимальные проверки branch-level trust:

1. `schema check` — payload валиден по контракту;
2. `source resolution` — каждый `sourceId` существует и разрешён;
3. `ownership check` — агент не выдаёт чужой домен за свой без secondary evidence;
4. `deterministic recompute` — агрегаты, суммы, стоимость и derived metrics пересчитываются там, где это возможно;
5. `cross-branch consistency` — ветки не противоречат друг другу по `fieldId`, `seasonId`, `operationId`, материалу, валюте, единицам;
6. `freshness check` — evidence не протухло по SLA домена;
7. `gap disclosure` — отсутствие данных не маскируется как факт.

На выходе каждая branch-ветка должна получать один из статусов:

- `VERIFIED`
- `PARTIAL`
- `UNVERIFIED`
- `CONFLICTED`
- `REJECTED`

Каноническое правило композиции:

- `VERIFIED` можно включать в ответ как подтверждённый факт;
- `PARTIAL` можно включать только с явной маркировкой ограничений;
- `UNVERIFIED` нельзя подавать как установленный факт;
- `CONFLICTED` должен вести к честному conflict-disclosure;
- `REJECTED` не должен участвовать в финальной фактической композиции.

Эффект этого слоя:

- система получает реальный `anti-hallucination` контур, а не только красивый `JSON`;
- оркестратор начинает измерять доверие к branch-данным, а не к красноречию агента;
- сложные multi-source ответы становятся управляемыми и доказуемыми.

### 1.2.7 Latency budget для trust verification

`Branch Trust Gate` не должен превращать чат в медленный "безопасный, но непригодный" продукт.

Нормативный принцип:

- дешёвые deterministic проверки выполняются всегда;
- тяжёлый cross-check вторым агентом или дополнительным retrieval запускается только при branch-risk, conflict или low-trust verdict;
- cross-check не должен становиться обязательным second-pass для каждого запроса.

Рабочие latency-ориентиры для первой волны:

- `happy path` — добавка `100-300 ms`;
- `multi-source read` — добавка `300-800 ms`;
- `cross-check triggered` — допустимая добавка `1000-1500 ms`;
- постоянный second-pass LLM verifier на каждый branch считается анти-целью.

Эффект этого правила:

- антигаллюцинаторный контур получает engineering budget;
- команда не раздувает safety-механику до неприемлемой latency;
- пользователь получает быструю happy-path работу и более тяжёлую верификацию только там, где это действительно нужно.

### 1.3 Что не является целью

Этот план не должен приводить к следующим анти-результатам:

- свободная `all-to-all` mesh-сеть между агентами;
- исчезновение `governance`, `budget`, `policy` и `confirmation`;
- прямой `agent -> agent` peer-to-peer как скрытый runtime path;
- превращение оркестратора в ещё одного доменного агента;
- перенос всей логики в один LLM-вызов без deterministic guardrails;
- обязательный second-pass LLM verifier для каждого branch вне зависимости от риска и evidence.

## 2. Текущее отклонение от цели

Сейчас система имеет пять системных разрывов.

### 2.1 Нет одного канонического слоя понимания намерения

Смысл запроса сейчас определяется в нескольких местах:

- `IntentRouterService`;
- `agent-interaction-contracts.ts`;
- `SemanticRouterService`;
- `AgentExecutionAdapterService`;
- `execution-adapter-heuristics.ts`.

Эффект текущего состояния:

- intent может быть распознан по-разному на соседних этапах;
- добавление нового phrase-pattern лечит локальный кейс, но не исправляет архитектуру;
- реальный смысл запроса пользователя не является first-class объектом runtime.

### 2.2 Route-space до сих пор слишком сильно влияет на смысл

По части контуров semantic primary promotion завязан на route-space.

Эффект текущего состояния:

- одинаковый запрос на разных страницах ведёт себя по-разному;
- route превращается из контекстной подсказки в скрытый gate;
- свободный ingress ломается на уровне оркестрации.

### 2.3 Адаптеры агентов повторно маршрутизируют запрос

`AgentExecutionAdapterService` не только исполняет уже принятое решение, но и сам доопределяет intent.

Эффект текущего состояния:

- появляется второй и третий routing-слой внутри execution path;
- semantic plan не является окончательным источником истины;
- отладка regressions усложняется, потому что intent может поменяться после оркестратора.

### 2.4 Write-policy смешана с lexical signal

Сейчас write-смысл во многом выводится из слов вроде `создай`, `зарегистрируй`, `обнови`.

Эффект текущего состояния:

- свободные фразы нестабильны;
- policy и natural-language parsing смешаны;
- невозможно масштабировать write-контур только расширением trigger-словаря.

### 2.5 `front_office_agent` ещё не занял роль полноценного ingress-owner

По канону именно `front_office_agent` должен разделять:

- `free_chat`;
- `task_process`;
- `client_request`;
- `escalation_signal`.

Но текущий runtime всё ещё не использует этот слой как основной semantic ingress-owner для общего чата.

Эффект текущего состояния:

- свободное общение не получает отдельный first-class intake path;
- доменные owner-агенты слишком рано сталкиваются с сырой фразой пользователя;
- весь ingress фактически деградирует обратно в routing by hints.

### 2.6 Truthfulness в коде уже есть, но он слишком поздний и слишком coarse

В текущем runtime уже существуют полезные элементы trust-contour:

- `TruthfulnessEngineService` считает `bsScorePct`, `evidenceCoveragePct`, `invalidClaimsPct`;
- `SupervisorAgent` умеет запускать скрытый cross-check по low-trust heuristic;
- output validation умеет требовать `evidence` и `deterministic basis`.

Но этого недостаточно для целевой схемы.

Эффект текущего состояния:

- truthfulness считается в основном на `trace-level`, уже после ответа;
- подозрительный branch-result может быть включён в композицию раньше полноценной branch-level проверки;
- contract validation проверяет форму и наличие evidence, но не решает, можно ли branch-данным доверять как факту;
- нет единого `branch verdict`, по которому composer понимает, что можно показывать как факт, а что только как ограниченную оценку.

## 3. Delivery Doctrine

### 3.1 Главный принцип

Нужно не «дописать словари», а перевести платформу от модели:

```text
phrase -> contract match -> fallback heuristics -> tool
```

к модели:

```text
free phrase -> semantic ingress frame -> policy/governance -> owner-agent execution
```

### 3.2 Инженерное правило

Новый semantic ingress нельзя внедрять большим одномоментным переписыванием.

Нужен controlled migration program:

- сначала вводится единый semantic contract;
- затем на него переводится один proof-slice;
- затем из execution path вынимается повторное угадывание intent;
- только после этого остальные контуры массово мигрируются на новый путь.

Эффект такого подхода:

- снижается риск поломки всего чата;
- появляется доказуемая quality baseline на каждом переходе;
- можно мигрировать по slice, а не войной против всего `rai-chat`.

## 4. Фазовая программа

## 4.1 Фаза 0 — Truth Baseline и freeze точек принятия intent

### Действие

Зафиксировать текущие точки принятия routing-решений и сделать их явными в коде и тестах:

- `IntentRouterService`;
- `SemanticRouterService`;
- `SupervisorAgent.planExecution()`;
- `AgentExecutionAdapterService`;
- `execution-adapter-heuristics.ts`.

### Ожидаемый эффект

Команда получает один подтверждённый baseline текущего поведения. Это уменьшит спорность последующих изменений и позволит мерить реальный прогресс, а не ориентироваться на ощущения.

### Артефакты

- audit-таблица `current routing decision points`;
- список duplicate intent resolvers;
- golden-set из свободных пользовательских формулировок, которые сейчас ведут себя нестабильно.

### Критерий завершения

- есть документированный inventory всех мест, где runtime ещё интерпретирует смысл запроса;
- есть набор regression-примеров минимум для `crm`, `contracts`, `agro`, `finance`.

## 4.2 Фаза 1 — Ввести канонический `Semantic Ingress Frame`

### Действие

Создать единый типизированный semantic contract первого слоя для общего чата.

Минимальные поля:

- `interaction_mode`
- `request_shape`
- `domain_candidates`
- `goal`
- `entities`
- `requested_operation`
- `missing_slots`
- `risk_class`
- `requires_confirmation`
- `confidence_band`
- `explanation`

Для composite-режима обязательны дополнительные поля:

- `sub_requests`
- `dependency_edges`
- `lead_owner_agent`
- `execution_strategy`
- `aggregation_mode`
- `branch_result_contract`

### Ожидаемый эффект

Смысл запроса впервые станет first-class runtime object. Это позволит перестать разбрасывать intent по `contracts`, `heuristics`, `adapter` и `route guards`.

Дополнительный эффект:

- составные запросы перестанут сплющиваться в один intent;
- появится формальная основа для multi-agent orchestration без скрытой mesh-логики.
- multi-source аналитические вопросы начнут собираться через typed branch-results, а не через промежуточный текст.
- появится место, куда можно типизированно привязать branch trust verdict и anti-hallucination policy.

### Кодовые точки

- новый typed contract в `shared/rai-chat`
- новый parser service рядом с orchestration spine
- telemetry schema для semantic ingress
- branch-result contract в `shared/rai-chat`

### Критерий завершения

- `SupervisorAgent` умеет получить `Semantic Ingress Frame` как отдельный объект;
- frame логируется и виден в explainability/forensics;
- текущий runtime ещё не переведён полностью, но frame уже существует как общий объект решения.

## 4.3 Фаза 2 — Поднять `front_office_agent` как ingress-owner для общего чата

### Действие

Сделать `front_office_agent` owner-слоем именно для общего входящего общения, а не только для communicator-сценариев.

Он должен first-class различать:

- `free_chat`
- `task_process`
- `client_request`
- `escalation_signal`

### Ожидаемый эффект

Пользовательский свободный текст перестанет сразу падать в доменный routing. Сначала он будет нормализован как ingress-событие, а уже потом аккуратно передан в owner-domain.

### Кодовые точки

- `front_office_agent.service.ts`
- `SupervisorAgent`
- contract source для interaction mode
- AI Dock chat path

### Критерий завершения

- общий чат имеет явный ingress-classification step;
- доменный owner-agent определяется после классификации ingress-mode, а не до неё;
- обычные человеческие фразы больше не требуют command-style формулировки для первичного понимания.

## 4.4 Фаза 3 — Перевернуть `SupervisorAgent` в `semantic-first`

### Действие

Перестроить `SupervisorAgent.planExecution()` так, чтобы canonical order стал таким:

1. `semantic ingress frame`
2. owner selection
3. policy/risk verdict
4. requested execution plan
5. runtime execution

Legacy `IntentRouterService` должен стать fallback/compatibility layer, а не главным интерпретатором.

### Ожидаемый эффект

Оркестратор начнёт принимать решение по смыслу запроса, а не по словарным совпадениям. Это уменьшит зависимость от phrase-формы и уберёт часть спонтанных routing regressions.

Дополнительный эффект:

- `SupervisorAgent` сможет сначала строить sub-intent graph для сложного вопроса, а уже потом решать `parallel / sequential / clarification`;
- multi-agent сценарии получат единый orchestration-plan вместо серии случайных fallback-переходов.

### Кодовые точки

- `supervisor-agent.service.ts`
- `intent-router.service.ts`
- `semantic-router.service.ts`

### Критерий завершения

- для мигрированных slice canonical classification source = `semantic ingress frame`;
- legacy router участвует только как fallback или compatibility verdict;
- `requestedToolCalls` рождаются из semantic plan, а не из contract-trigger по умолчанию.

## 4.5 Фаза 4 — Вытащить повторное угадывание intent из execution path

### Действие

Сделать `AgentExecutionAdapterService` тупым исполнителем уже принятого плана.

Нужно убрать из критического пути:

- `resolveCrmIntent()` как повторный router;
- `resolveEconomistIntent()` как повторный router;
- `resolveContractsIntent()` как повторный router;
- аналогичные text-driven fallback-ветки, если semantic plan уже существует.

### Ожидаемый эффект

Execution path станет предсказуемым: адаптер перестанет менять intent после оркестратора. Это уменьшит скрытые коллизии и сильно упростит отладку и тестирование.

### Кодовые точки

- `agent-execution-adapter.service.ts`
- `execution-adapter-heuristics.ts`

### Критерий завершения

- адаптер принимает `operation + payload + policy mode`, а не текст и догадки;
- повторный routing в адаптере остаётся только как временный compatibility path для немигрированных intent-ов.

## 4.6 Фаза 5 — Разделить `semantic meaning` и `policy for writes`

### Действие

Перенести решение о `clarify / confirm / execute / block` в отдельный policy-слой, работающий уже по semantic plan.

Write-path должен опираться на:

- тип операции;
- риск операции;
- источник действия;
- наличие прямой пользовательской команды;
- governance policy;
- tenant/company scope.

### Ожидаемый эффект

Платформа начнёт безопасно поддерживать свободные write-фразы без бесконечного роста trigger-словаря. Пользовательский опыт улучшится, а safety останется управляемым.

Дополнительный policy-rule для composite-запросов:

- один `write-domain` + дополнительные read-only ветки допускаются в одном orchestrated scenario;
- несколько `write-domain` в одной фразе должны уходить в staged execution plan с отдельным confirmation boundary;
- irreversible или high-risk подзадачи не должны сливаться в одно подтверждение без пошаговой прозрачности.

### Кодовые точки

- runtime policy layer
- CRM/contracts write confirmation paths
- actor context propagation

### Критерий завершения

- write-policy не выводится напрямую из наличия слова `создай/обнови/зарегистрируй`;
- прямое ручное действие пользователя отличается от автономного действия агента.

## 4.7 Фаза 6 — Понизить роль `route` с gate до prior

### Действие

Перестроить routing так, чтобы `route` и `workspaceContext`:

- повышали вес кандидатов;
- доставали выбранную сущность;
- помогали disambiguation;
- но не решали, «можно ли вообще понять этот intent».

### Ожидаемый эффект

Одинаковая свободная фраза перестанет радикально менять смысл в зависимости от открытой страницы. Это сделает чат по-настоящему сквозным продуктовым входом.

### Кодовые точки

- `semantic-router.service.ts`
- slice detection
- `workspaceContext` resolvers

### Критерий завершения

- route-space не является обязательным условием понимания ключевых owner-intent-ов;
- route остаётся сильным contextual prior, а не скрытым production gate.

## 4.8 Фаза 7 — Миграция доменов по proof-slice

### Действие

Переводить домены не все сразу, а в таком порядке:

1. `crm.register_counterparty`
2. `crm.review_account_workspace`
3. `contracts.review_commerce_contract`
4. `finance.compute_plan_fact`
5. `agro.tech_map_draft`

### Ожидаемый эффект

Каждый следующий домен будет мигрировать уже по проверенному шаблону. Это уменьшит стоимость внедрения и быстрее даст видимый пользовательский эффект на реальных сценариях.

### Почему первый slice = `register_counterparty`

Потому что он одновременно:

- user-visible;
- болезненный по текущему UX;
- write-sensitive;
- хорошо показывает разницу между свободной фразой и командным стилем.

### Критерий завершения первой волны

Фраза уровня:

`Давай зарегаем контрагента по ИНН 2636041493`

должна стабильно проходить путь:

```text
free phrase
  -> semantic ingress
  -> crm owner intent
  -> confirmation policy
  -> execute
  -> honest result
```

без обязательной ручной подстройки phrasing.

## 4.9 Фаза 8 — Composite / multi-agent orchestration

### Действие

После стабилизации single-intent proof-slice нужно ввести controlled support для составных запросов.

Первая волна composite-сценариев:

1. `crm write -> crm read follow-up`
2. `crm write -> contracts read advisory`
3. `contracts read -> finance advisory`
4. `agro read -> finance advisory`
5. `agro execution fact -> finance cost aggregation`

### Ожидаемый эффект

Система начнёт поддерживать реальные пользовательские фразы, в которых человек просит не одну атомарную операцию, а рабочий мини-сценарий. Это заметно повысит ценность чата как продукта, а не как набора отдельных intent-команд.

Дополнительный эффект:

- сложные вопросы с несколькими источниками данных получат отдельный first-class execution path;
- orchestration начнёт собирать ответ из branch `JSON payload`, а не из текстовых ответов агентов.

### Критерий завершения

- составной запрос сначала превращается в sub-intent graph;
- есть `lead owner-agent`;
- есть явное решение `parallel / sequential / blocking`;
- branch-results между агентами и оркестратором идут через typed `JSON`, а не через промежуточный текст;
- итоговый ответ показывает status по подзадачам, а не один размытый result.

## 4.10 Фаза 9 — Branch Trust Gate и anti-hallucination verification

### Действие

Ввести first-class слой branch-level trust verification между execution и user-facing composition.

Минимальные элементы первой волны:

- typed `BranchResultContract`;
- `BranchTrustAssessment`;
- `BranchVerdict = VERIFIED | PARTIAL | UNVERIFIED | CONFLICTED | REJECTED`;
- selective cross-check path только для low-trust branch;
- deterministic recompute для агрегатов и стоимости там, где есть basis;
- composer rule: user-facing факты собираются только из разрешённых branch verdict.

Обязательные поля branch-contract сверх обычного `structuredOutput`:

- `derived_from`
- `evidence_refs`
- `confidence`
- `assumptions`
- `data_gaps`
- `freshness`
- `scope`

### Ожидаемый эффект

Оркестратор перестанет слепо склеивать ответы агентов. Появится реальный `anti-hallucination` контур, который работает не только на уровне постфактум-метрик, но и до финального пользовательского ответа.

Дополнительный эффект:

- `trace-level truthfulness` сохранится как системная метрика качества;
- `branch-level trust gate` добавит inline-проверку там, где она нужна для пользовательской достоверности;
- скрытый second-pass будет вызываться только на подозрительных ветках, а не на каждом запросе.

### Latency budget первой волны

- `happy path` trust-gate overhead: `100-300 ms`
- `multi-source read` trust-gate overhead: `300-800 ms`
- `cross-check triggered` trust-gate overhead: `1000-1500 ms`

Нарушение budget допускается только для специально помеченных high-risk сценариев.

### Кодовые точки

- `supervisor-agent.service.ts`
- `truthfulness-engine.service.ts`
- `response-composer.service.ts`
- `trace-summary.service.ts`
- `runtime-governance-policy.service.ts`
- shared branch contract types

### Критерий завершения

- каждый branch-result получает типизированный verdict;
- composer не выводит `UNVERIFIED / CONFLICTED / REJECTED` как установленный факт;
- cross-check path не активируется на каждый запрос по умолчанию;
- latency budgets измеряются и попадают в telemetry/eval.

## 4.11 Фаза 10 — UI, telemetry и eval closure

### Действие

После миграции каждого slice нужно доводить три вещи одновременно:

- UX surface
- telemetry / divergence
- eval corpus

### Ожидаемый эффект

Команда получит не только более умный routing, но и управляемую систему доказательства качества. Это снизит риск тихой деградации после рефакторинга.

### Обязательные артефакты

- paraphrase corpus
- regression corpus
- route-independence checks
- `clarify / confirm / execute / block` coverage
- explainability panel для migrated slice

## 5. Рабочий backlog по модулям

| Модуль | Что менять | Ожидаемый эффект |
|---|---|---|
| `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` | перевести на semantic-first planning | оркестратор перестаёт зависеть от legacy lexical classification как от главного источника смысла |
| `apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts` | превратить из bounded deterministic overlay в semantic planning core | routing начинает опираться на смысл и состояние, а не на route-first ветвление |
| `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts` | убрать повторное распознавание intent | execution path становится стабильным и дебажимым |
| branch result contract | перевести межагентные ответы в typed `JSON payload` | оркестратор собирает сложный ответ из структурированных данных с меньшим расходом токенов |
| `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts` | расширить от post-trace scoring к branch-level trust inputs | anti-hallucination контур начнёт работать не только как ретроспективная метрика, но и как часть inline orchestration |
| `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` | собирать user-facing факты только из branch verdict, разрешённых policy | финальный ответ перестанет маскировать сомнительные ветки под подтверждённые факты |
| `apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts` | добавить trust/latency budgets для selective verification | safety-контур останется управляемым по времени ответа и не раздуется до always-on second-pass |
| `apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts` | оставить extractor/normalizer helpers, а не semantic router | regex перестаёт быть скрытым вторым оркестратором |
| `apps/api/src/shared/rai-chat/agent-interaction-contracts.ts` | сместить роль к ownership/contracts/UI surface | contracts начинают описывать доменные границы, а не тащить на себе весь natural-language слой |
| orchestration planner для composite-запросов | ввести `sub-intent graph`, `lead owner`, `execution strategy` | сложные вопросы начинают исполняться как прозрачный mini-workflow, а не как сломанный single-intent |
| `front_office_agent` контур | сделать first-class ingress classifier | свободное общение получает отдельный owner-path до handoff |
| policy/risk слой | отделить policy verdict от lexical signal | write safety становится расширяемой и менее хрупкой |

## 6. Метрики готовности

План считается успешным, когда выполнены все условия ниже.

### 6.1 Пользовательские метрики

- пользовательские фразы по proof-slice проходят без command-style формулировки;
- соседние paraphrase-варианты ведут себя одинаково;
- чат не требует “правильной страницы” для понимания базового owner-intent.

### 6.2 Архитектурные метрики

- в migrated slice есть один канонический semantic source of truth;
- adapter не переписывает intent после оркестратора;
- route больше не является hard gate для понимания migrated intent-а.
- composite-запрос имеет явный `lead owner-agent`, а не теряется между несколькими routing-ветками;
- execution strategy (`parallel / sequential / blocking`) выводится типизированно, а не ad-hoc.
- каждый branch-result получает типизированный trust verdict до финального composer;
- `trace-level truthfulness` и `branch-level trust gate` не противоречат друг другу и не дублируют ответственность вслепую.

### 6.3 Governance-метрики

- все write-операции проходят через явный `policy verdict`;
- direct user command и autonomous agent action различаются типизированно;
- explainability показывает semantic parse, policy verdict и итоговое execution decision.
- low-trust ветки не маскируются как подтверждённые факты;
- hidden cross-check активируется селективно, а не как глобальный second-pass по умолчанию.

### 6.4 Performance-метрики

- `happy path` trust verification укладывается в добавку `100-300 ms`;
- `multi-source read` trust verification укладывается в добавку `300-800 ms`;
- `cross-check triggered` укладывается в добавку `1000-1500 ms`;
- всегда-включённый LLM verifier на каждый branch отсутствует как системный паттерн.

## 7. Первый исполняемый пакет

Первым исполняемым пакетом должна стать ветка:

`free ingress -> crm register_counterparty -> confirm/execute`

### Действия пакета

- ввести `Semantic Ingress Frame`;
- провести его через `SupervisorAgent`;
- убрать повторный `crm` intent routing из adapter для этого slice;
- отделить `direct_user_command` от autonomous write-path;
- добавить eval corpus на свободные формулировки регистрации контрагента.

### Ожидаемый эффект пакета

Этот пакет даст самый быстрый и наглядный выигрыш для продукта:

- чат начнёт принимать естественные CRM write-запросы;
- исчезнет часть ручной подстройки phrasing;
- команда получит рабочий шаблон для миграции остальных owner-intent-ов.

### Статус пакета на 2026-03-21

Checklist:

- [x] введён shared contract `SemanticIngressFrame` в `apps/api/src/shared/rai-chat/semantic-ingress.types.ts`
- [x] `SupervisorAgent` строит frame и прокидывает его в `AgentExecutionRequest` и `AiAuditEntry.metadata`
- [x] `crm.register_counterparty` начал читать frame в `AgentExecutionAdapterService` до локального heuristic fallback
- [x] `Trace Forensics` и `Control Tower` показывают `semanticIngressFrame` как отдельный explainability-артефакт
- [x] `direct_user_command` отделён от delegated/autonomous write-path через `SemanticIngressFrame.operationAuthority -> RaiToolActorContext.userIntentSource -> RaiToolsRegistry`
- [x] отдельный eval corpus на свободные CRM register-перефразы вынесен в самостоятельный gate `semantic-ingress.eval.spec.ts`

Текущий эффект:

- смысл proof-slice впервые живёт как отдельный typed ingress-object до runtime execution;
- `register_counterparty` перестаёт зависеть только от phrase-routing и локального regex в execution path;
- оператор уже видит ingress normalization в forensics без чтения сырого `routingTelemetry`;
- governed write-boundary теперь различает прямую пользовательскую команду и delegated/autonomous write-path типизированно, а не по косвенному `userId`;
- свободные CRM register-перефразы закреплены отдельным regression gate поверх `IntentRouter -> SemanticRouter -> SemanticIngressFrame`.

### Статус следующего пакета на 2026-03-21

Пакет:

- `crm composite flow: register_counterparty -> create_account -> open_workspace`

Checklist:

- [x] `Semantic Ingress Frame` расширен `compositePlan` для CRM follow-up flow
- [x] `SupervisorAgent` исполняет staged composite flow последовательно и собирает merged orchestration result
- [x] `ResponseComposer` отдаёт отдельный `crm_composite_flow` work window с owner/strategy/stage status
- [x] `Trace Forensics` показывает `Composite workflow` block в `Semantic Ingress Frame`
- [x] web DTO и UI синхронизированы по `crm_composite_flow` и composite ingress payload
- [x] targeted specs по `semantic-ingress`, `supervisor-agent`, `response-composer` и `Control Tower` проходят

Текущий эффект:

- платформа уже умеет проводить короткий governed CRM composite сценарий как один lead-owner workflow;
- staged execution больше не теряется в разрозненных CRM write/read переходах;
- operator UI и trace forensics видят составной план явно, без чтения сырого orchestration trace.

Следующий пакет после него:

- `crm composite flow: register_counterparty -> create_account -> open_workspace`

Ожидаемый эффект следующего пакета:

- платформа начнёт поддерживать не только одну атомарную CRM-команду, но и короткий составной сценарий, который ближе к реальной пользовательской задаче.

Следующий аналитический пакет:

- `agro execution fact -> finance cost aggregation`

Ожидаемый эффект аналитического пакета:

- пользователь сможет задавать один сложный вопрос про факт операции и её стоимость;
- оркестратор будет собирать ответ из `agro` и `finance` branch `JSON payload` без лишнего текстового межслоя.

Следующий trust-пакет после аналитического:

- `branch trust gate for agro execution fact -> finance cost aggregation`

Ожидаемый эффект trust-пакета:

- ответ про объём операции и её стоимость будет проходить не только через multi-source orchestration, но и через branch-level verification;
- конфликт между `agro` и `finance` источниками будет раскрываться честно, а не маскироваться синтетическим текстом;
- latency и accuracy tradeoff станет измеримым и управляемым.

### Статус аналитического trust-пакета на 2026-03-21

Checklist:

- [x] `Semantic Ingress Frame` нормализует `agro execution fact -> finance cost aggregation` в аналитический composite workflow
- [x] `SupervisorAgent` исполняет staged analytical workflow по `agronomist -> economist`
- [x] `ResponseComposer` отдаёт отдельный `multi_source_aggregation` work window для аналитического composite-flow
- [x] `Branch trust` corpus покрывает verified multi-source branches для agro/finance composite-case
- [x] targeted specs по `semantic-ingress`, `supervisor-agent`, `response-composer` и `branch-trust.eval` проходят

Текущий эффект:

- multi-source аналитический вопрос проходит через one-owner staged execution и branch-level trust verification;
- `agro` и `finance` branch payload теперь видны как подтверждённые факты, а не как разрозненный текст;
- trust/eval контур уже знает этот slice как отдельный regression case.

### 7.1 File-level backlog для `Branch Trust Gate`

Ниже зафиксирован первый исполнимый пакет работ по файлам.

#### Пакет A — shared contracts и типизация trust-layer

Файлы:

- новый shared contract file в `apps/api/src/shared/rai-chat/` для branch-level trust типов
- `apps/api/src/modules/rai-chat/agent-platform/agent-platform.types.ts`
- `apps/api/src/shared/rai-chat/rai-chat.dto.ts`

Действия:

- ввести типы `BranchResultContract`, `BranchTrustAssessment`, `BranchVerdict`
- определить обязательные поля:
  - `scope`
  - `derived_from`
  - `evidence_refs`
  - `assumptions`
  - `data_gaps`
  - `freshness`
  - `confidence`
- развести:
  - branch raw result
  - branch trust verdict
  - user-facing composed result

Checklist:

- [x] типы `BranchResultContract`, `BranchTrustAssessment`, `BranchVerdict` добавлены в shared layer
- [x] `AgentExecutionResult` умеет нести `branchResults / branchTrustAssessments / branchCompositions`
- [x] branch contract не конфликтует с текущим `structuredOutput`, а живёт рядом с ним
- [x] базовые DTO и текущий trust-path проходят типизацию и сборку

Ожидаемый эффект:

- trust-layer получит один канонический контракт;
- `SupervisorAgent`, `TruthfulnessEngine` и `ResponseComposer` начнут говорить на одном типизированном языке;
- исчезнет дрейф полей между агентами и оркестратором.

#### Пакет B — `SupervisorAgent` как orchestrator trust gate

Файл:

- `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`

Действия:

- вставить явную стадию `branch trust assessment` между execution и composer
- перевести текущий скрытый cross-check из эвристики "после structuredOutput" в типизированный selective trust path
- сделать так, чтобы cross-check запускался:
  - только на `low-trust`
  - только при `CONFLICTED`
  - только при `UNVERIFIED`
  - или по explicit policy для high-risk slice
- собирать branch verdicts в один orchestration result

Checklist:

- [x] trust stage встроен в основной orchestration path между execution и composer
- [x] happy path не получает обязательный second-pass
- [x] cross-check не запускается без trust signal
- [x] branch verdicts передаются дальше в composer и forensic telemetry

Ожидаемый эффект:

- trust verification станет first-class частью orchestration;
- скрытый second-pass перестанет быть размытым побочным поведением;
- multi-source ответы начнут собираться по branch verdict, а не только по наличию `structuredOutputs`.

#### Пакет C — `TruthfulnessEngine` как поставщик branch-trust inputs

Файл:

- `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`

Действия:

- выделить reusable helper-слой для branch-level классификации evidence
- перестать держать этот сервис только в режиме post-trace scoring
- добавить методы уровня:
  - `classifyBranchEvidence(...)`
  - `buildBranchTrustInputs(...)`
  - `resolveEvidenceStatus(...)`
- сохранить trace-level `bsScorePct / evidenceCoveragePct / invalidClaimsPct` как aggregate-quality слой

Checklist:

- [x] evidence classification вынесена в reusable методы
- [x] branch-level inputs можно использовать без ожидания full trace summary
- [x] trace-level scoring остаётся совместимым с текущим runtime
- [x] truthfulness unit-tests расширены и не деградируют

Ожидаемый эффект:

- текущий truthfulness-контур не будет выброшен, а станет основой для inline trust gate;
- система получит общий механизм оценки evidence как на branch-level, так и на trace-level;
- будет легче удержать единые правила доверия по всем доменам.

#### Пакет D — `ResponseComposer` и правила композиции фактов

Файл:

- `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`

Действия:

- запретить composer трактовать `UNVERIFIED / CONFLICTED / REJECTED` как подтверждённый факт
- ввести user-facing шаблоны для:
  - confirmed fact
  - partial fact with limitation
  - conflict disclosure
  - insufficient evidence
- собирать итоговый ответ из branch verdicts, а не из summary-текста каждого branch
- оставить prose только на финальном presentation-слое

Checklist:

- [x] composer видит `branchResults / branchTrustAssessments / branchCompositions`
- [x] `PARTIAL` всегда сопровождается disclosure ограничений
- [x] `CONFLICTED` приводит к честному описанию расхождения
- [x] подтверждённый факт собирается только из разрешённых веток

Ожидаемый эффект:

- финальный ответ станет честнее и прозрачнее;
- пользователь перестанет получать синтетический "гладкий" текст поверх конфликтующих данных;
- объяснимость качества ответа вырастет без ручного forensic-разбора.

#### Пакет E — telemetry и governance для trust-path

Файлы:

- `apps/api/src/modules/rai-chat/trace-summary.service.ts`
- `apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts`
- `apps/api/src/shared/rai-chat/runtime-governance-policy.types.ts`

Действия:

- добавить в telemetry агрегаты по branch verdict:
  - `verifiedBranchCount`
  - `partialBranchCount`
  - `unverifiedBranchCount`
  - `conflictedBranchCount`
  - `rejectedBranchCount`
- завести latency accounting для trust-gate path
- выразить latency budget и trust budget как policy-driven ограничения
- подготовить explainability/read-model к отображению branch verdict и selective cross-check

Checklist:

- [x] trace summary хранит persisted trust-агрегаты и trust latency accounting
- [x] runtime governance policy хранит trust/latency budget caps `300 / 800 / 1500 ms`
- [x] explainability/read-model видит branch trust summary и branch verdict артефакты
- [x] integration/eval контур подтверждает trace summary telemetry и selective cross-check

Ожидаемый эффект:

- tradeoff между скоростью и достоверностью станет измеримым;
- `Control Tower` и explainability получат наблюдаемость не только по trace quality, но и по branch quality;
- trust-проверка не расползётся бесконтрольно по времени ответа.

#### Пост-спринтовое замыкание UI/read-model слоя

Файлы:

- `apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts`
- `apps/api/src/modules/explainability/explainability-panel.service.ts`
- `apps/web/lib/api.ts`
- `apps/web/app/(app)/control-tower/page.tsx`
- `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx`

Checklist:

- [x] dashboard read-model агрегирует branch trust verdict counts, `cross-check` trace count и budget compliance
- [x] `Control Tower` показывает trust aggregates в операторском quality surface без чтения raw trace summary
- [x] trace forensics page показывает trust summary, budget verdict и branch verdict cards
- [x] web tests подтверждают rendering нового trust consumption-layer

Ожидаемый эффект:

- оператор видит trust-path как first-class observability слой, а не как скрытую forensic metadata;
- branch quality перестаёт быть доступной только через backend trace JSON;
- sprint closure доходит до реально потребляемого UI, а не заканчивается на persistence.

#### Tenant-facing замыкание `AI chat / work windows`

Файлы:

- `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`
- `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts`
- `apps/api/src/shared/rai-chat/rai-chat.dto.ts`
- `apps/web/lib/stores/ai-chat-store.ts`
- `apps/web/lib/api.ts`
- `apps/web/lib/rai-chat-response-adapter.ts`
- `apps/web/lib/rai-chat-response-state.ts`
- `apps/web/components/ai-chat/ai-work-window-types.ts`
- `apps/web/components/ai-chat/AiChatPanel.tsx`
- `apps/web/__tests__/ai-chat-store.spec.ts`
- `apps/web/__tests__/ai-signals-strip.spec.tsx`
- `apps/web/__tests__/structured-result-window.spec.tsx`

Checklist:

- [x] `ai-chat-store` переведён на единый типобезопасный post-processing path для chat response
- [x] `ResponseComposer` отдаёт canonical `branch_trust_summary` work windows и trust signals прямо в chat response
- [x] `web` оставляет только fallback-генерацию trust windows, если backend ещё не прислал canonical payload
- [x] `RaiChatResponseDto` теперь несёт first-class `trustSummary`, а `web` предпочитает backend summary вместо локальной агрегации
- [x] `apps/web/lib/api.ts` экспортирует typed `RaiChatResponseDto` и `UserFacingTrustSummaryDto`, а `ai-chat-store` больше не держит `trustSummary` на `unknown`-контракте
- [x] transport для `/api/rai/chat` вынесен в общий typed helper внутри `apps/web/lib/api.ts`, а `ai-chat-store` больше не дублирует `fetch/json/idempotency` path
- [x] post-processing `/api/rai/chat` вынесен в `apps/web/lib/rai-chat-response-adapter.ts`, а `ai-chat-store` больше не держит inline legacy widget migration, trust-window derivation и pending-clarification hydration
- [x] response-state reducer вынесен в `apps/web/lib/rai-chat-response-state.ts`, а `ai-chat-store` больше не собирает response window/application semantics вручную в `submitRequest(...)`
- [x] assistant bubble показывает verdict и disclosure прямо в рабочем диалоге
- [x] `pnpm --filter api exec tsc --noEmit --pretty false`, targeted composer spec, `pnpm --filter web exec tsc --noEmit --pretty false` и targeted chat-window tests подтверждают новый tenant-facing trust surface

Ожидаемый эффект:

- пользователь видит подтверждённость ответа в том же рабочем диалоге, где принимает решение;
- `signal strip` и `work windows` получают trust surface как first-class backend payload, а не как вторичную фронтендовую сборку;
- `assistant bubble`, `work windows` и следующие клиенты читают один и тот же backend summary-контракт без повторной сборки branch verdict на frontend;
- compile-time контракт между API и `web` перестаёт расходиться по trust summary, поэтому следующий consumer-layer не должен гадать о форме payload;
- chat transport и DTO оказываются в одном client-layer, поэтому изменения `/api/rai/chat` больше не нужно синхронизировать вручную между `api.ts` и store;
- post-processing ответа перестаёт жить только в zustand-store, поэтому следующий consumer-layer может переиспользовать ту же логику без копирования chat-store кода;
- response window/application state становится отдельным shared слоем, поэтому chat-state transitions можно тестировать и переиспользовать отдельно от zustand-store;
- frontend остаётся backward-compatible, но перестаёт быть единственным местом, где рождаются trust windows.

### 7.2 Тестовый пакет для `Branch Trust Gate`

#### Unit tests

Файлы:

- `apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts`
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`
- `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts`
- новые spec для shared branch contract при необходимости

Проверить:

- evidence без `sourceId` не проходит как `VERIFIED`
- `confidence` без evidence не даёт branch стать подтверждённым фактом
- cross-check не запускается на happy path
- cross-check запускается только на `low-trust / conflicted`
- composer не маскирует `CONFLICTED` как обычный answer
- `PARTIAL` выводится с disclosure ограничений

Ожидаемый эффект:

- базовые правила trust-layer станут регрессионно защищены;
- команда перестанет ломать anti-hallucination контур незаметными локальными правками.

#### Integration tests

Файлы:

- `apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`
- `apps/api/src/modules/rai-chat/eval/branch-trust.eval.spec.ts`

Проверить:

- multi-source вопрос идёт через branch `JSON payload`
- conflict между `agro` и `finance` не скрывается composer-ом
- `UNVERIFIED` ветка не превращается в user-facing факт
- trace summary получает trust telemetry
- selective cross-check подтверждается отдельным eval corpus

Ожидаемый эффект:

- trust-gate будет проверяться не только в изоляции, но и в реальном orchestration path;
- сложные вопросы уровня "объём + стоимость" станут целевым регрессионным сценарием.

#### Eval corpus

Артефакты:

- отдельный corpus для `multi-source analytical question`
- отдельный corpus для `branch conflict disclosure`
- отдельный corpus для `trust cross-check selective triggering`

Стартовые пользовательские фразы:

- `Покажи сколько было вылито селитры на поле 2 у Казьминский и сколько это стоило`
- `Сколько потратили на КАС по полю 5 и сколько фактически внесли`
- `Покажи факт по обработке поля и финансовый итог`

Ожидаемый эффект:

- проверка trust-layer будет привязана к реальным рабочим вопросам, а не к искусственным тестовым фразам;
- качество multi-source orchestration начнёт измеряться в форме, понятной продукту.

### 7.3 Рекомендуемый порядок реализации `Branch Trust Gate`

1. Пакет A — типы и shared contracts
2. Пакет C — reusable branch-trust inputs в `TruthfulnessEngine`
3. Пакет B — orchestration gate в `SupervisorAgent`
4. Пакет D — composer rules
5. Пакет E — telemetry и governance
6. Unit tests
7. Integration tests
8. Eval corpus

Ожидаемый эффект:

- реализация пойдёт от типизации и инвариантов к orchestration и presentation;
- риск переписывать behaviour без наблюдаемости и тестов существенно снизится.

## 8. Definition of Done

Документ считается отработанным как execution-plan, когда:

- по первой волне есть отдельные таски и PR-срезы;
- для proof-slice есть tests + eval corpus + telemetry;
- migrated slice реально проходит через свободную фразу пользователя;
- команда больше не лечит этот класс проблем расширением trigger-словаря как основным методом;
- branch-results не попадают в пользовательский ответ как "факты" без явного trust verdict;
- anti-hallucination контур имеет измеримый latency budget и не превращён в глобальный always-on second-pass.

### 8.1 Текущее состояние на 2026-03-21

- file-level trust-пакет для фазы `Branch Trust Gate` закрыт end-to-end:
  - shared contracts
  - reusable truthfulness inputs
  - orchestration trust stage
  - honest composition rules
  - telemetry/governance/eval
  - operator UI и tenant-facing chat trust surfaces
  - typed chat transport/adapter/state closure для `AI chat`
- proof-slice `crm.register_counterparty` дополнительно усилен на текущем pre-semantic-ingress слое:
  - разговорные write-фразы `зарегим/зарепим/заведи` распознаются консистентно в `agent-interaction-contracts`, `execution-adapter-heuristics` и `semantic-router`
  - CRM write-запрос по ИНН больше не деградирует в read-only `crm.counterparty.lookup`
  - targeted `api`-тесты и `tsc` подтверждают этот bounded fix-slice
- следующий незакрытый tranche уже выходит за границы текущего trust rollout:
  - ввести first-class `Semantic Ingress Frame`
  - поднять `front_office_agent` как ingress-owner
  - no-route процессные и safe free-chat сообщения уже проходят через `front_office_agent` ingress-layer; greeting acknowledge сохранён, а fail-open path не сломан
  - `SupervisorAgent` уже выбирает runtime owner role из `SemanticIngressFrame` первым, а legacy classification оставляет fallback-слоем
  - `AgentExecutionAdapter` уже берёт intent из `SemanticIngressFrame` первым для migrated roles, а phrase heuristics оставляет только compatibility fallback; `chief_agronomist` и `data_scientist` тоже gated в primary semantic routing
  - `agronomist` primary semantic routing тоже переведён на safe draft default `generate_tech_map_draft`, чтобы adapter не возвращался к phrase guessing на agronomist path
  - `SemanticIngressFrame` уже несёт typed `writePolicy`, отделяя confirm/execute/clarify/block от lexical signal
  - `writePolicy` уже отдельным полем возвращается в trace forensics response, чтобы policy decision был видим в наблюдаемом API
  - `RaiToolActorContext.writePolicy` уже используется в CRM direct-write gating, чтобы прямой write-path решался по typed policy, а не по `userIntentSource`
  - approved pending-action execution тоже уже несёт typed `writePolicy`, а строковый `workflow_resume` там больше не выступает source of truth
  - approved pending-action execution прикрыт unit-spec, который фиксирует typed policy contract
  - CRM и contracts primary routing теперь тоже закрыты safe read defaults вместо text-based intent guessing, чтобы adapter не пересобирал intent по фразе там, где upstream semantic plan уже обязан был прийти
  - `front_office_agent` в primary routing тоже уже использует `classify_dialog_thread` как safe default вместо message-based fallback
  - `route` и `workspaceContext` в semantic-router уже работают как contextual prior для ключевых owner-intents, а не как обязательный gate понимания запроса
