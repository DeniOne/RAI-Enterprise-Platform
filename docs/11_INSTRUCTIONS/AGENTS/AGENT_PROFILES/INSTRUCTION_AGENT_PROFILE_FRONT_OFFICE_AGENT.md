---
id: DOC-INS-AGT-PROFILE-012
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-09
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА FRONT_OFFICE_AGENT

## 1. Назначение

Документ фиксирует профиль `front_office_agent` как owner-agent для коммуникационного ingress-контура.

## 2. Когда применять

Использовать документ, когда:

- проектируется communicator ingress;
- обсуждается Telegram-first routing;
- нужно определить границу между общением и задачей-процессом;
- проектируется эскалация из коммуникации в доменные owner-агенты.

## 3. Статус агента

- Статус: canonical first-wave role.
- Runtime family: реализована.
- Template role: зафиксирована в onboarding templates.
- Owner domain: `front_office`.

## 4. Стратегический образ агента в Stage 2

`front_office_agent` является отдельным owner-agent для:

- входящих и исходящих коммуникаций;
- логирования диалогов;
- классификации общения;
- выделения task/process signal;
- первичной эскалации и handoff в целевой домен.

## 5. Фактическое состояние агента по коду

По коду агент уже реализован как каноническая runtime-роль первой волны.

Подтверждено:

- `front_office_agent` добавлен в canonical agent registry;
- есть native `FrontOfficeAgent`;
- есть `FrontOfficeToolsRegistry`;
- есть intent-и:
  - `log_dialog_message`
  - `classify_dialog_thread`
  - `create_front_office_escalation`
- есть onboarding template;
- есть audit-backed dialogue log и escalation trail.

При этом в текущую первую волну пока не входят:

- полноценный Telegram adapter handoff path;
- отдельный thread state storage вне `auditLog`;
- полноценное создание универсальных задач в `task` module;
- rich front-office workspace с очередями и статусами handoff.

## 6. Домены ответственности

- `front_office`
- communicator ingress
- dialogue threads
- message logs
- task/process detection
- escalation routing

## 7. Что агент обязан делать

- Логировать сообщения и диалоги.
- Разделять `free_chat` и `task_process`.
- Выделять клиентские запросы и сигналы эскалации.
- Делать governed handoff в owner-domain через оркестратор.

## 8. Что агенту запрещено делать

- Подменять CRM, agronomy, finance, contracts, legal ownership.
- Самостоятельно закрывать процесс в чужом домене.
- Записывать чужие бизнес-сущности как primary owner.

## 9. Текущий фактический функционал

- логирование входящих и исходящих сообщений через `auditLog`;
- классификация диалога:
  - `free_chat`
  - `task_process`
  - `client_request`
  - `escalation_signal`
- определение целевого owner-role для handoff;
- создание front-office escalation record;
- routing/ownership через общий orchestration spine;
- onboarding template для Control Tower.

## 10. Максимально допустимый функционал

- Telegram-first communication routing
- conversation log
- dialogue summary
- client signal extraction
- task/process detection
- escalation creation
- governed handoff to domain owners

## 11. Связи с оркестратором

- Агент должен работать только через центральный orchestration spine.
- Он не должен напрямую дергать чужих owner-agent.

## 12. Связи с другими агентами

- `crm_agent` — клиентские и account-related handoff
- `agronomist` — агрономические задачи и сигналы
- `economist` — финансовые запросы
- `contracts_agent` — договорные процессы
- `legal_advisor` — юридические риски
- `monitoring` — escalation signals
- `personal_assistant` — личная координация без business ownership

## 13. Связи с доменными модулями

- `telegram`
- `task`
- `advisory`
- `client-registry`
- `front-office`

## 14. Required Context Contract

Минимально нужны:

- channel / communicator source
- dialog or chat identifier
- message payload
- sender / recipient context
- thread state

## 15. Intent Catalog

Целевой минимальный набор:

- `log_dialog_message`
- `classify_dialog_thread`
- `detect_task_process`
- `detect_free_chat`
- `detect_client_request`
- `create_front_office_escalation`
- `handoff_dialog_to_owner`
- `summarize_dialog_context`

## 16. Tool surface

Будущий минимальный tool surface:

- communicator intake adapter
- dialogue log registry
- thread classifier
- escalation creator
- task link / create adapter
- owner handoff adapter

## 17. UI surface

- `front-office` workspace
- thread list
- message log
- process/task markers
- escalation queue
- handoff status

## 18. Guardrails

- Никаких direct writes в чужие домены.
- Никакого peer-to-peer bypass оркестратора.
- Никакого превращения любого диалога в задачу по умолчанию.

## 19. Основные риски и failure modes

- Смешение роли с `crm_agent`.
- Смешение роли с `personal_assistant`.
- Потеря границы между free chat и process.
- Шумные эскалации.
- Неуправляемый лог без структуры.

## 20. Требования к тестам

- classification tests по типам диалогов;
- routing tests из communicator в owner-domain;
- tests на free_chat vs task_process;
- escalation tests;
- audit/log persistence tests.

## 21. Критерии production-ready

- Есть canonical runtime family.
- Есть ясный communication contract.
- Есть conversation log и thread state.
- Есть governed handoff.
- Telegram-first smoke работает end-to-end.

## 22. Связанные файлы и точки кода

- [RAI_FRONT_OFFICE_AGENT_CANON.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [front-office-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/front-office-agent.service.ts)
- [front-office-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/front-office-tools.registry.ts)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [telegram.update.ts](/root/RAI_EP/apps/telegram-bot/src/telegram/telegram.update.ts)
- [task.service.ts](/root/RAI_EP/apps/api/src/modules/task/task.service.ts)
- [advisory.service.ts](/root/RAI_EP/apps/api/src/modules/advisory/advisory.service.ts)
- [client-registry.service.ts](/root/RAI_EP/apps/api/src/modules/client-registry/client-registry.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/front-office/page.tsx)
