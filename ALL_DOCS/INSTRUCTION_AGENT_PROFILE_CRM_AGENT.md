---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-C-H6WG
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА CRM_AGENT

## 1. Назначение

Документ фиксирует текущий и целевой профиль `crm_agent` как owner-agent для CRM-контура.

## 2. Когда применять

Использовать документ, когда:

- расширяется CRM scope;
- подключаются новые CRM tools и connectors;
- обсуждается граница между CRM и contracts/legal;
- проектируются AI-сценарии по контрагентам и клиентским данным.

## 3. Статус агента

- Статус: канонический runtime-агент.
- Runtime family: реализована.
- Owner domain: `crm`.
- Adapter role: `crm_agent`.

## 4. Стратегический образ агента в Stage 2

По Stage 2 `crm_agent` должен быть first-class owner-agent для:

- контрагентов и карточек;
- CRM-аккаунтов;
- контактов;
- взаимодействий;
- обязательств;
- структуры связей и клиентского контекста.

Агент должен работать через governed CRM write-path, не выходя в:

- финансы;
- агрономию;
- мониторинг ownership;
- договорный и legal ownership без отдельной формализации.

## 5. Фактическое состояние агента по коду

Подтверждён через:

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [crm-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/crm-agent.service.ts)
- [crm-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/crm-tools.registry.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Фактически сейчас покрывает:

- регистрацию контрагента;
- создание связи контрагентов;
- создание CRM-аккаунта;
- обзор workspace аккаунта;
- обновление профиля аккаунта;
- create/update/delete контактов;
- create/update/delete взаимодействий;
- create/update/delete обязательств.

Также роль уже включена в:

- `Runtime Governance` как canonical write-capable business agent;
- `Control Tower` как часть reliability, fallback и queue telemetry;
- `Lifecycle Board` как canonical lifecycle role с freeze/retire surface.

## 6. Домены ответственности

- `party` и контрагенты;
- CRM-аккаунты;
- контакты;
- interactions;
- obligations;
- holding / farm / связанные активы в CRM-контексте;
- read/write path по карточкам в governance-гранях.

## 7. Что агент обязан делать

- Проверять контрагента и регистрировать карточку через CRM tool chain.
- Работать с карточками и связями как CRM owner.
- Уходить в `NEEDS_MORE_DATA`, если для write-операции не хватает обязательного контекста.
- Сохранять explainability и evidence.
- Не подменять договорный, финансовый и legal ownership.

## 8. Что агенту запрещено делать

- Выполнять finance, agronomy и monitoring intent-ы.
- Брать ownership договора только потому, что договор связан с контрагентом.
- Выходить в legal commitments.
- Маскировать handoff в `contracts_agent` или пытаться незаметно захватывать commerce ownership.

## 9. Текущий фактический функционал

- `register_counterparty`
- `create_counterparty_relation`
- `create_crm_account`
- `review_account_workspace`
- `update_account_profile`
- `create_crm_contact`
- `update_crm_contact`
- `delete_crm_contact`
- `log_crm_interaction`
- `update_crm_interaction`
- `delete_crm_interaction`
- `create_crm_obligation`
- `update_crm_obligation`
- `delete_crm_obligation`

## 10. Максимально допустимый функционал

В пределах CRM-домена агент может покрывать:

- полный цикл client record management;
- onboarding новых контрагентов;
- customer context enrichment;
- follow-up и activity management;
- relation graph и account workspace;
- CRM handoff в contracts/legal/finance только через оркестратор.

Агент не должен автоматически расширяться до:

- `commerce/contracts` ownership;
- full legal review;
- финансового исполнения;
- общего controller или monitoring ownership.

## 11. Связи с оркестратором

- Маршрутизируется через `SupervisorAgent -> Runtime -> Adapter`.
- Получает owner-статус только по CRM-intent-ам.
- Handoff в другие домены допустим только через центральный spine.

## 12. Связи с другими агентами

- С `knowledge`: для policy / corpus grounding по CRM-сценарию.
- С `economist`: для финансового follow-up по клиентскому контексту.
- С `monitoring`: для incident/risk escalation, но не наоборот по ownership.
- С `contracts_agent`: для договорного и commerce handoff по контрагенту.
- С `legal_advisor`: для правового advisory handoff.

## 13. Связи с доменными модулями

- `CrmToolsRegistry`
- `CrmModule`
- `CommerceModule` для `parties`
- карточки, связи, активы и workspace CRM-контуров

## 14. Required Context Contract

По intent-ам нужен разный контекст:

- для регистрации контрагента: `inn` и тип/юрисдикция по необходимости;
- для связей: `fromPartyId`, `toPartyId`, `relationType`;
- для аккаунта: `accountId` или `accountPayload`;
- для контактов, взаимодействий и обязательств: соответствующие `accountId`, `contactId`, `interactionId`, `obligationId`.

## 15. Intent Catalog

- `register_counterparty`
- `create_counterparty_relation`
- `create_crm_account`
- `review_account_workspace`
- `update_account_profile`
- `create_crm_contact`
- `update_crm_contact`
- `delete_crm_contact`
- `log_crm_interaction`
- `update_crm_interaction`
- `delete_crm_interaction`
- `create_crm_obligation`
- `update_crm_obligation`
- `delete_crm_obligation`

## 16. Tool surface

- `LookupCounterpartyByInn`
- `RegisterCounterparty`
- `CreateCounterpartyRelation`
- `CreateCrmAccount`
- `GetCrmAccountWorkspace`
- `UpdateCrmAccount`
- `CreateCrmContact`
- `UpdateCrmContact`
- `DeleteCrmContact`
- `CreateCrmInteraction`
- `UpdateCrmInteraction`
- `DeleteCrmInteraction`
- `CreateCrmObligation`
- `UpdateCrmObligation`
- `DeleteCrmObligation`

## 17. UI surface

- CRM work windows;
- карточка результата регистрации контрагента;
- переход в карточку и workspace аккаунта;
- actions по контактам, взаимодействиям и обязательствам;
- governed write feedback.

## 18. Guardrails

- Запрещённые домены: `agronomy`, `finance`, `monitoring`.
- Запрещённые intent-ы: agro, finance, knowledge-owner, monitoring-owner.
- Запрещённый scope: contracts execution ownership вынесен в отдельный канонический профиль `contracts_agent`.

## 19. Основные риски и failure modes

- Некорректная маршрутизация в CRM вместо `contracts_agent` на договорных сценариях.
- Ложный успех при blocked/governed write, если composer скрывает статус.
- Неполный контекст для CRM write path.
- Расширение CRM ownership на legal/contracts по инерции маршрута.

## 20. Требования к тестам

- Intent routing по каждому CRM-intent.
- Регистрация контрагента по ИНН и защита от дублей.
- CRM workspace retrieval.
- CRUD по контактам, взаимодействиям и обязательствам.
- Guardrails против `contracts`, finance и agronomy.

## 21. Критерии production-ready

- Все заявленные CRM-intent-ы реально исполняются.
- CRM write path governed и честно отражает gate status.
- UI не скрывает blocked / pending / failed состояния.
- Есть smoke-набор на новых и существующих контрагентов.
- Договорные сценарии честно уходят в `contracts_agent`, а не размываются в CRM scope.
- Роль видна в `Runtime Governance`, `Swarm Control Tower` и `Lifecycle Board`.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [crm-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/crm-agent.service.ts)
- [crm-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/crm-tools.registry.ts)
