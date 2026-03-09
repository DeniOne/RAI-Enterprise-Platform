---
id: DOC-INS-AGT-006
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-09
---

# ИНСТРУКЦИЯ — ВКЛЮЧЕНИЕ FRONT_OFFICE_AGENT

## 1. Назначение

Документ описывает, как правильно довести `front_office_agent` от стратегического канона до production-ready owner-agent платформы.

## 2. Когда применять

Использовать документ, когда принято решение запускать `front_office_agent` как новый owner-domain.

## 3. Предварительные условия

Перед началом нужно опираться на:

- [RAI_FRONT_OFFICE_AGENT_CANON.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md)
- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)

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

## 5. Точки интеграции

- `telegram` channel intake
- `task` module
- `advisory` module
- `client-registry`
- `rai-chat` runtime
- `front-office` web page

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

## 7. Требования к тестам

- unit tests для conversation classification;
- tests на `free_chat` против `task_process`;
- tests на handoff в `crm_agent`, `agronomist`, `economist`;
- tests на отсутствие чужого domain write;
- Telegram-first smoke.

## 8. Критерии production-ready

- agent family зарегистрирована;
- маршрутизация работает;
- conversation log персистентен;
- handoff governed и traceable;
- free chat не превращается в задачу без основания;
- Telegram flow работает end-to-end.

## 9. Что должно получиться на выходе

На выходе платформа получает отдельного owner-agent для communication ingress, который:

- владеет front-office domain;
- отличает общение от процесса;
- создаёт structured handoff;
- не подменяет чужие домены.

## 10. Критические ошибки и запреты

- Нельзя делать `front_office_agent` вторым `crm_agent`.
- Нельзя смешивать его с `personal_assistant`.
- Нельзя давать ему чужую operational write authority.
- Нельзя запускать агента без persistent dialogue log.

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

- [RAI_FRONT_OFFICE_AGENT_CANON.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)
- [telegram.update.ts](/root/RAI_EP/apps/telegram-bot/src/telegram/telegram.update.ts)
- [task.service.ts](/root/RAI_EP/apps/api/src/modules/task/task.service.ts)
- [advisory.service.ts](/root/RAI_EP/apps/api/src/modules/advisory/advisory.service.ts)
- [client-registry.service.ts](/root/RAI_EP/apps/api/src/modules/client-registry/client-registry.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/front-office/page.tsx)
