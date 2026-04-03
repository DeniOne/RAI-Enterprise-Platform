---
id: DOC-EXE-AGENT-SYSTEM-ASIS-TOBE-20260403
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-04-03
claim_id: CLAIM-EXE-AGENT-SYSTEM-ASIS-TOBE-20260403
claim_status: asserted
verified_by: manual
last_verified: 2026-04-03
evidence_refs: docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md;docs/07_EXECUTION/AGENT_MODULE_RACI_AND_REPORTING_LINES.md;docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md;docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md;docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md;docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INDEX.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md;docs/00_STRATEGY/STAGE 2/A_RAI_AGENT_INTERACTION_BLUEPRINT.md;docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;apps/api/src/modules/rai-chat/supervisor-agent.service.ts;apps/api/src/modules/rai-chat/semantic-ingress.service.ts;apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts;apps/api/src/modules/rai-chat/agent-registry.service.ts;apps/api/src/shared/rai-chat/agent-interaction-contracts.ts;apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts;apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts;apps/api/src/modules/rai-chat/composer/response-composer.service.ts;apps/api/src/modules/rai-chat/truthfulness-engine.service.ts
---
# Фиксация факта и идеальной картины агентной системы

## CLAIM
id: CLAIM-EXE-AGENT-SYSTEM-ASIS-TOBE-20260403
status: asserted
verified_by: manual
last_verified: 2026-04-03

## 0. Назначение

Этот документ фиксирует две опоры:

- **Факт (AS-IS)**: подтверждённое кодом устройство агентной платформы и оркестрации.
- **Идеальная картина (To-Be)**: целевое состояние полного контура агентной системы, описанное в действующих стратегиях и инструкциях.

Документ используется как исходная точка для выравнивания системы к целевому состоянию.

## 1. Факт (AS-IS)

### 1.1 Канонический orchestration spine

Текущий путь исполнения запроса в `rai-chat` соответствует связке:

`RaiChatController -> RaiChatService -> SupervisorAgent -> SemanticRouter/SemanticIngress -> AgentRuntime -> AgentExecutionAdapter -> Agent -> Tools -> ResponseComposer -> Trustfulness`.

Подтверждение в коде: `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`, `apps/api/src/modules/rai-chat/semantic-ingress.service.ts`, `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`, `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`.

### 1.2 Канонические runtime-агенты и expert-tier роли

По коду канонические runtime-агенты:

- `agronomist`, `economist`, `knowledge`, `monitoring`, `crm_agent`, `front_office_agent`, `contracts_agent`.

Также существуют expert-tier роли:

- `chief_agronomist`, `data_scientist`.

Подтверждение: `apps/api/src/modules/rai-chat/agent-registry.service.ts` и соответствующие сервисы агентов в `apps/api/src/modules/rai-chat/agents/`.

### 1.3 Где используются LLM-компоненты

Факт по коду:

- LLM используется для уточнения маршрута в `SemanticRouterService` при включённом `RAI_SEMANTIC_ROUTER_LLM_ENABLED`.
- LLM используется для синтеза текста в `agronomist`, `economist`, `knowledge`, `monitoring`, `crm_agent`.
- `contracts_agent` и `front_office_agent` исполняются по детерминированному tool-path без LLM-синтеза.

Подтверждение: `apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts`, `apps/api/src/modules/rai-chat/agents/*-agent.service.ts`.

### 1.4 Semantic ingress и intent contracts

Факт по коду:

- `SemanticIngressService` формирует `SemanticIngressFrame` из legacy классификации и semantic-router сигналов.
- `agent-interaction-contracts` задаёт intent-ы, required context, guardrails и UI action surface.
- `execution-adapter-heuristics` остаётся источником вспомогательных эвристик.

Подтверждение: `apps/api/src/modules/rai-chat/semantic-ingress.service.ts`, `apps/api/src/shared/rai-chat/agent-interaction-contracts.ts`, `apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts`.

### 1.5 Composite и multi-source сценарии

Факт по коду:

- Реализованы только два compositе сценария.
- CRM: `register_counterparty -> create_crm_account -> review_account_workspace`.
- Агро-финансы: `compute_deviations -> compute_plan_fact`.
- Исполнение идёт последовательными стадиями в `SupervisorAgent`, без общего `sub-intent graph`.

Подтверждение: `apps/api/src/modules/rai-chat/semantic-ingress.service.ts`, `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`.

### 1.6 Trust, evidence и governance

Факт по коду:

- В `SupervisorAgent` встроен trust-stage и запись branch-level артефактов.
- `TruthfulnessEngine` участвует в проверке и финальном составе ответа.
- Tool allowlist и runtime-политики ограничивают автономию.

Подтверждение: `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`, `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`, `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`.

### 1.7 UX work windows

Факт по коду:

- Ответы компонуются через `ResponseComposer` с поддержкой `workWindows`.
- Объекты work window используются для UI-слоёв и explainability.

Подтверждение: `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`.

### 1.8 Ограничения AS-IS

Факт по коду:

- Нет универсального механизма разбиения свободного запроса на `sub-intent graph`.
- Нет общего orchestration-planner для `parallel/sequential/blocking`.
- Идея `multi-source` реализована только в одном аналитическом композитном сценарии.

Подтверждение: отсутствие соответствующих механизмов в `semantic-ingress.service.ts` и `supervisor-agent.service.ts`.

## 2. Идеальная картина (To-Be, intent canon)

Целевое состояние фиксируется действующими стратегиями и инструкциями и не является подтверждённым runtime-фактом. Идеальная картина для A-RAI в твоей формулировке выглядит так:

1. **Оркестратор понимает смысл и разбивает запрос.** Он получает свободную фразу, понимает намерение, раскладывает на задачи и решает, кто главный агент и какие агенты подключаются параллельно.
2. **Мультиагентность без “туннеллирования”.** Оркестратор не залипает на один домен и не превращает всё в один путь. Он умеет распределять части запроса между агентами и удерживать общий смысл.
3. **Обмен между агентами — только JSON.** Агенты общаются между собой и с оркестратором структурированными JSON-ответами, а оркестратор превращает это в развёрнутое человеческое сообщение.
4. **Нелинейная оркестрация.** Задачи могут идти параллельно, последовательно или ждать контекст/подтверждение. Оркестратор выбирает стратегию под смысл запроса, а не по жёсткой схеме.
5. **Управление контекстом как рабочей памятью.** Система помнит тему и факты до логического завершения темы, и при необходимости подтверждает, что контекст корректен.
6. **Управление данными в UI.** Агенты вносят и обновляют информацию в блоках интерфейса. Изменения делятся по риску: низкий риск (например, заполнение реквизитов при валидированной карточке) выполняется сразу с аудитом и быстрым откатом; удаление и высокорисковые изменения — только после явного подтверждения.
7. **Многоуровневые разрешения.** У разных агентов и разных сессий свои профили доступа к инструментам и данным, а политики безопасности применяются контекстно.
8. **LLM как мозг оркестратора.** Оркестратор подключён к LLM, чтобы минимизировать туннеллирование и лучше понимать свободную речь.
9. **Единый “входной каркас” для оркестратора.** Есть описанный входной контур с правилами взаимодействия агентов, чтобы любая LLM могла корректно работать в роли оркестратора.
10. **Безопасность и ограничения по интернету.** Запрещены несанкционированные действия и доступ в интернет; рискованные операции — только с подтверждением.
11. **Результат = точное выполнение запроса.** Информационный запрос должен дать точный ответ, запрос на действие — завершённое действие.
12. **Контроль прогресса вне чата.** В чате достаточно сообщений, а детальная статистика и контроль — в отдельном UX-разделе.

Подтверждение intent-канона: `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md`, `docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`, `docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md`, `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md`.

## 3. Правило разделения факт/намерение

- Любой тезис о текущем поведении должен иметь опору в коде или тестах.
- Любой тезис о целевом состоянии помечается как intent-канон и не трактуется как runtime-истина.

## 4. Критерии готовности перехода

1. Для всех owner-агентов описан и применён единый `Intent Catalog` и `Required Context Contract`.
2. `Semantic ingress` строит `sub-intent graph` и передаёт его в `SupervisorAgent`.
3. `SupervisorAgent` исполняет multi-intent запросы по стратегии `parallel/sequential/blocking`.
4. `Branch Trust Gate` валидирует multi-source ветки и допускает в финальный ответ только `VERIFIED` и `PARTIAL` с disclosure.
5. Governed write-path работает через policy и HITL, без скрытых bypass.
6. UI получает единый work window с статусами стадий и возможностью управляемого продолжения.

## 5. Связанные документы

- `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md`
- `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md`
- `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md`
- `docs/07_EXECUTION/AGENT_MODULE_RACI_AND_REPORTING_LINES.md`
- `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
