---
id: DOC-INS-AGT-003
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# ИНСТРУКЦИЯ — АРХИТЕКТУРА ВЗАИМОДЕЙСТВИЯ АГЕНТНОЙ ПЛАТФОРМЫ

## 1. Назначение

Этот документ фиксирует:

- как фактически устроена текущая агентная платформа `RAI_EP`;
- как должна выглядеть целевая схема по канону `Stage 2`;
- где между стратегическим замыслом и кодом уже есть разрывы;
- как правильно интерпретировать связи между оркестратором, агентами, инструментами и доменными модулями.

Документ нужен как рабочий стандарт для:

- проектирования новых agent flows;
- выделения owner-agent для доменных контуров;
- проверки, не маскирует ли UI fallback отсутствие реального agent-owner;
- проектирования governed handoff между агентами.

---

## 2. Когда применять

Использовать документ обязательно, когда:

- создаётся новый агент;
- расширяется зона ответственности существующего агента;
- подключается новый доменный модуль к AI-контуру;
- проектируется handoff между агентами;
- выявлен сценарий, где чат показывает fallback вместо реальной агентной работы;
- нужно понять, является ли проблема “ошибкой агента” или “отсутствием owner-agent”.

---

## 3. Предварительные условия

Перед использованием этого документа нужно опираться на:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](../00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](../00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-execution-adapter.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Нормативное разделение source of truth:

- trigger-level routing, primary owner и handoff rules фиксируются в [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md);
- границы конкретного агента, его `current / max allowed / handoff boundaries` фиксируются в соответствующем профильном паспорте в `AGENT_PROFILES`.

---

## 4. Стратегический канон Stage 2 по агентной платформе

### 4.1 Что задумано в стратегическом каноне

По `Stage 2` агентная платформа должна быть не набором LLM-ботов, а governed product-layer системой, где:

- есть единый orchestration spine;
- агент определяется не только `prompt` и `model`, а через product contracts;
- у агента есть first-class зона ответственности;
- чат не должен скрывать архитектурные дыры красивым fallback-ответом;
- правая рабочая зона должна получать typed work windows, а не декоративные текстовые заглушки.

Это зафиксировано в:

- master-plan как переход от `platform mostly done` к `functional agentization`;
- addendum по `Focus / Intent / Required Context / UI Action Surface`;
- interaction blueprint как канон `пользователь <-> оркестратор <-> агент <-> рабочие окна`;
- readiness checklist как требование к реальному owner на каждый критичный трек.

### 4.2 Что стратегический канон запрещает

Стратегически запрещено считать нормой:

- свободную `all-to-all` mesh-сеть между агентами;
- “агент без owner-domain и без explicit contracts”;
- UI fallback, который выглядит как рабочий результат при отсутствии agent-owner;
- прямой обход orchestration spine ad-hoc вызовами доменных сервисов.

---

## 5. Текущее фактическое устройство по коду

### 5.1 Канонические runtime-агенты

По коду текущими каноническими runtime-ролями являются:

- `agronomist`
- `economist`
- `knowledge`
- `monitoring`
- `crm_agent`
- `front_office_agent`
- `contracts_agent`

Источник: [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)

### 5.2 Центральный orchestration spine

Фактический путь исполнения запроса выглядит так:

```text
Пользователь
  -> UI / AI Dock
  -> RaiChatController
  -> RaiChatService
  -> SupervisorAgent
  -> IntentRouterService
  -> AgentRuntimeService
  -> AgentExecutionAdapterService
  -> конкретный агент
  -> tools registry / deterministic services / domain modules
  -> ResponseComposerService
  -> чат + work windows
```

Источники:

- [rai-chat.module.ts](../../apps/api/src/modules/rai-chat/rai-chat.module.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)

### 5.3 Как реально сгруппированы вызовы в runtime

На уровне planner fan-out идёт по группам:

- `agronom`
- `economist`
- `knowledge`
- `crm`
- `contracts`
- `other`

Источник: [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)

Это означает:

- orchestration идёт через единый hub;
- прямой свободной сети `агент -> агент -> агент` сейчас в коде нет;
- агентный контур ближе к `hub-and-spoke`, чем к `mesh`.

---

## 6. Схема связей: текущее состояние

### 6.1 Общая схема

```text
UI / AI Dock
  -> SupervisorAgent
    -> IntentRouterService
    -> MemoryCoordinatorService
    -> AgentRuntimeService
      -> AgentExecutionAdapterService
        -> AgronomAgent
        -> EconomistAgent
        -> KnowledgeAgent
        -> MonitoringAgent
        -> CrmAgent
        -> FrontOfficeAgent
        -> ContractsAgent
      -> typed tool calls
      -> domain registries
    -> ResponseComposerService
  -> чат + work windows + structured output
```

### 6.2 Кто с кем связан сейчас

#### Один со всеми

В текущей реализации роль “один со всеми” выполняет orchestration spine:

- `SupervisorAgent`
- `AgentRuntimeService`
- `AgentExecutionAdapterService`

Именно они знают:

- какой агент должен быть выбран;
- какой tool должен быть вызван;
- какой runtime budget действует;
- как собрать итоговый ответ.

#### Все с одним

Все специализированные агенты фактически связаны с единым центром:

- `AgronomAgent`
- `EconomistAgent`
- `KnowledgeAgent`
- `MonitoringAgent`
- `CrmAgent`

Они не являются независимой peer-to-peer сетью.

#### Все со всеми

В текущем коде полноценной модели `все со всеми` нет.

То есть неверно описывать текущую платформу как:

- “каждый агент может свободно разговаривать с каждым”;
- “агенты образуют mesh без центрального координатора”.

### 6.3 Что сейчас считается нормой

Нормой считается:

- `все с одним`
- `один со всеми`
- `governed orchestration через центральный spine`

Не считается нормой:

- uncontrolled peer-to-peer;
- скрытый прямой вызов чужого домена как будто это handoff.

---

## 7. Схема связей: целевое состояние

### 7.1 Целевая модель Stage 2

Целевая архитектура должна выглядеть так:

```text
Пользователь
  -> единый оркестратор
  -> классификация по Focus / Intent / Context contracts
  -> owner-agent по домену
  -> governed tool / connector path
  -> typed result / clarification / work windows
  -> при необходимости governed handoff обратно через оркестратор
```

### 7.2 Целевой handoff

Допустимый handoff в целевой модели:

- не прямой `agent A -> agent B` как скрытый вызов;
- а `agent A -> orchestration decision -> agent B`.

Иными словами:

- handoff допустим;
- скрытая mesh-модель не допустима.

### 7.3 Что должно быть у каждого домена

Чтобы домен считался нормально подключённым к платформе, у него должны быть:

- owner-agent;
- `Focus Contract`;
- `Intent Catalog`;
- `Required Context Contract`;
- `UI Action Surface Contract`;
- tool surface;
- rich-output path;
- governance path;
- тесты и smoke-proof.

---

## 8. Типы связности

### 8.1 Все с одним

Это текущий основной паттерн платформы.

Смысл:

- все агенты работают через единый координационный центр;
- оркестратор решает, кто owner;
- orchestration spine управляет execution path.

Статус:

- реализовано;
- является каноническим текущим режимом.

### 8.2 Один со всеми

Это вторая сторона текущей же модели.

Смысл:

- центральный orchestration hub знает все подключённые agent families;
- он выбирает и активирует конкретного исполнителя.

Статус:

- реализовано;
- является нормой.

### 8.3 Все со всеми

Смысл:

- любой агент может напрямую вызывать любого другого;
- orchestration center перестаёт быть обязательным.

Статус:

- не реализовано;
- не должно считаться текущей архитектурой;
- не должно описываться как действующая норма.

### 8.4 Управляемый handoff через центральный узел

Это целевой безопасный паттерн.

Смысл:

- межагентная передача возможна;
- но только через оркестрационный spine;
- owner-agent и принимающий агент должны быть явными;
- handoff должен быть governed и traceable.

Статус:

- частично поддержан концептуально;
- не является ещё полностью реализованным platform-wide стандартом.

---

## 9. Разрывы между текущим и целевым состоянием

### 9.1 Доменные модули без owner-agent

Подтверждённые примеры:

- `legal`
- `strategy`

Факт:

- доменные контуры и template roles уже существуют;
- advisory ownership зафиксирован;
- canonical runtime owner-agent ещё не реализован.

### 9.2 Плановые роли не равны каноническим runtime-агентам

В системе уже есть template/future roles:

- `marketer`
- `strategist`
- `finance_advisor`
- `legal_advisor`
- `controller`
- `personal_assistant`

Но они не являются полноценными canonical runtime families.

### 9.3 Не у всех доменов есть first-class ownership map

Разрыв:

- доменные модули и стратегические роли Stage 2 уже описаны;
- но не для каждого домена зафиксирован owner-agent;
- из-за этого часть UX сценариев попадает в fallback вместо реального исполнения.

### 9.4 Fallback может маскировать архитектурную дыру

Если intent-owner отсутствует, пользователь может увидеть:

- backlog;
- route-based task list;
- видимость “система что-то поняла”.

Но это не означает, что домен реально подключён к агентной платформе.

---

## 10. Критические ошибки и запреты

- Запрещено описывать текущую платформу как свободную `all-to-all` агентную сеть.
- Запрещено считать наличие backend-модуля доказательством того, что у домена уже есть owner-agent.
- Запрещено считать UI fallback рабочим агентным сценарием.
- Запрещено называть future/template role полноценным canonical runtime-agent, если она не подключена как отдельная runtime family.
- Запрещено проектировать direct peer-to-peer handoff как default-модель без orchestration spine.

---

## 11. Проверка готовности

Документ считается оформленным правильно, если:

- явно описано текущее состояние по коду;
- явно описана целевая схема по Stage 2;
- разобраны режимы `все с одним`, `один со всеми`, `все со всеми`;
- показано, что текущая модель = `hub-and-spoke`;
- перечислены реальные архитектурные разрывы;
- не смешаны стратегический канон и фактическая реализация;
- приведены конкретные точки кода.

---

## 12. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [rai-chat.module.ts](../../apps/api/src/modules/rai-chat/rai-chat.module.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-runtime.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [agent-execution-adapter.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [response-composer.service.ts](../../apps/api/src/modules/rai-chat/composer/response-composer.service.ts)

