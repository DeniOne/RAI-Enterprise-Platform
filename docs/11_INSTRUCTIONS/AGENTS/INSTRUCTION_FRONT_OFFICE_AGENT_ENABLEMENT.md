---
id: DOC-INS-AGENTS-INSTRUCTION-FRONT-OFFICE-AGENT-ENAB-1NZ4
layer: Instructions
type: Instruction
status: approved
version: 1.2.0
owners: [@techlead]
last_updated: 2026-03-25
---
# ИНСТРУКЦИЯ — ВКЛЮЧЕНИЕ FRONT_OFFICE_AGENT

## 1. Назначение

Документ описывает, как правильно довести `front_office_agent` от стратегического канона до production-ready owner-agent платформы.

Жёсткая граница документа:

- `front_office_agent` включается как owner только для `front-office communication ingress`;
- этот документ не делает `front_office_agent` общим коммуникатором для `rai-chat` и back-office business scenarios.

## 2. Когда применять

Использовать документ, когда принято решение запускать `front_office_agent` как новый owner-domain.

## 3. Предварительные условия

Перед началом нужно опираться на:

- [RAI_FRONT_OFFICE_AGENT_CANON.md](../../00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md](./INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md)
- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](./INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [AGENT_MODULE_ORG_STRUCTURE.md](../../07_EXECUTION/AGENT_MODULE_ORG_STRUCTURE.md)
- [AGENT_MODULE_RACI_AND_REPORTING_LINES.md](../../07_EXECUTION/AGENT_MODULE_RACI_AND_REPORTING_LINES.md)

Trigger-level routing, handoff и границы ingress против downstream owner-domain нужно сверять с:

- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)

## 4. Минимальный состав реализации

Нужно реализовать минимум:

- canonical runtime role `front_office_agent`;
- responsibility contract;
- intent catalog;
- communicator intake tool surface;
- dialogue log model;
- classification path `free_chat / task_process / client_request / escalation`;
- governed handoff path в owner-domains;
- front-office UI surface.

Нужно не реализовывать в рамках `front_office_agent`:

- ownership для `rai-chat` business ingress;
- primary routing для CRM, агро, финансов и договоров без front-office handoff;
- роль общего message gateway для всей платформы.

## 5. Точки интеграции

- `telegram` channel intake
- `task` module
- `advisory` module
- `client-registry`
- `front-office` web page

Уточнение по `rai-chat`:

- `rai-chat` является back-office business ingress и идёт в `semantic ingress -> SupervisorAgent`;
- `front_office_agent` может участвовать в общем orchestration governance только как соседний ingress-контур, но не как первый receiver `rai-chat`.

## 6. Пошаговый алгоритм

1. Зафиксировать domain ownership в `RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md`.
2. Поддерживать `front_office_agent` как canonical runtime role и синхронизировать ownership map.
3. Поддерживать responsibility profile:
   - `Focus Contract`
   - `Intent Catalog`
   - `Required Context Contract`
   - `UI Action Surface Contract`
   - `Guardrails`
4. Поддерживать runtime role в agent registry.
5. Поддерживать `FrontOfficeAgent`.
6. Поддерживать tools первой волны:
   - логирование сообщения
   - классификация thread
   - выделение task/process
   - эскалация
   - handoff summary
7. Подключить Telegram как первый communicator adapter.
8. Подключить task/escalation write path только в своих границах.
9. Добавить и расширять UI:
   - thread list
   - conversation log
   - markers
   - escalation queue
10. Подключить eval и smoke.
11. Проверить, что `rai-chat` business scenarios не попадают в `front_office_agent` как primary owner.

## 7. Требования к тестам

- unit tests для conversation classification;
- tests на `free_chat` против `task_process`;
- tests на handoff в `crm_agent`, `agronomist`, `economist`;
- tests на отсутствие чужого domain write;
- tests на то, что `rai-chat` не маршрутизируется в `front_office_agent` как business owner;
- Telegram-first smoke.

## 8. Критерии production-ready

- agent family зарегистрирована;
- маршрутизация работает;
- conversation log персистентен;
- handoff governed и traceable;
- free chat не превращается в задачу без основания;
- Telegram flow работает end-to-end;
- `rai-chat` business ingress не захватывается `front_office_agent`.

## 9. Что должно получиться на выходе

На выходе платформа получает отдельного owner-agent для communication ingress, который:

- владеет front-office domain;
- отличает общение от процесса;
- создаёт structured handoff;
- не подменяет чужие домены.

Отдельный результат:

- `front_office_agent` остаётся front-office ingress owner;
- back-office business path остаётся в `rai-chat -> semantic ingress -> SupervisorAgent -> owner-agent`.

## 10. Критические ошибки и запреты

- Нельзя делать `front_office_agent` вторым `crm_agent`.
- Нельзя смешивать его с `personal_assistant`.
- Нельзя давать ему чужую operational write authority.
- Нельзя запускать агента без persistent dialogue log.
- Нельзя делать его общим receiver для `rai-chat`.

## 11. Проверка готовности

Инструкция считается закрытой, если:

- есть runtime role;
- есть contract layer;
- есть communicator ingestion;
- есть thread classification;
- есть task/escalation path;
- есть handoff в owner-domains;
- есть smoke-tests.

## 12. Связанные файлы и точки кода

- [RAI_FRONT_OFFICE_AGENT_CANON.md](../../00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)
- [telegram.update.ts](../../apps/telegram-bot/src/telegram/telegram.update.ts)
- [task.service.ts](../../apps/api/src/modules/task/task.service.ts)
- [advisory.service.ts](../../apps/api/src/modules/advisory/advisory.service.ts)
- [client-registry.service.ts](../../apps/api/src/modules/client-registry/client-registry.service.ts)
- [page.tsx](../../apps/web/app/(app)/front-office/page.tsx)
