---
id: DOC-STR-STAGE-2-RAI-FRONT-OFFICE-AGENT-CANON-1QLG
layer: Strategy
type: Vision
status: draft
version: 0.1.0
---
# RAI Front Office Agent Canon

> Версия: 1.0  
> Дата: 2026-03-09  
> Статус: Active Target Canon  
> Назначение: зафиксировать роль, границы, первичный функционал и точки интеграции будущего `front_office_agent`.

---

## 1. Зачем нужен Front Office Agent

В Stage 2 резко растёт значение входного коммуникационного контура.

Сейчас у платформы уже есть:

- Telegram как реальный канал;
- task-контур;
- advisory-контур;
- CRM-контур;
- `front-office` UI surface;
- живой чат и оркестрация.

Но нет отдельного owner-agent, который владеет именно коммуникационным ingress-layer:

- фильтрацией входящих и исходящих сообщений;
- логом всех диалогов;
- разделением “свободного общения” и “процесса / задачи”;
- первичной эскалацией задач;
- handoff из коммуникации в доменный owner-agent.

Без этого платформа остаётся слепой к одному из самых важных каналов реальной работы консультингового бизнеса: к входящим и исходящим коммуникациям.

---

## 2. Бизнес-роль агента

`front_office_agent` — это не CRM-агент, не personal assistant и не generic chat-bot.

Это отдельный owner-agent для коммуникационного фронта.

Его задача:

- принимать поток сообщений из коммуникатора;
- нормализовать коммуникацию в поток диалогов и событий;
- фиксировать лог;
- отделять бытовой разговор от процессного сигнала;
- выделять задачи, поручения, клиентские запросы и эскалации;
- принимать решение по ingress-outcome;
- либо передавать задачу в нужный owner-domain через оркестратор,
- либо возвращать хозяйству governed direct reply в безопасном informational scope.

Первый канал:

- Telegram

Целевая расширяемость:

- WhatsApp
- email
- web messenger
- internal communicator

---

## 3. Что агент должен уметь в первой волне

### 3.1 Коммуникационный intake

- принимать входящие сообщения;
- учитывать исходящие сообщения платформы;
- хранить сквозной лог диалогов;
- группировать сообщения в `thread / dialogue / conversation`.

### 3.2 Классификация типа общения

Агент должен различать минимум 4 режима:

1. `free_chat`
2. `task_process`
3. `client_request`
4. `escalation_signal`

### 3.3 Process detection

Агент должен уметь отличать:

- просто разговор;
- поручение;
- задачу с исполнителем;
- запрос клиента;
- риск/эскалацию;
- необходимость handoff в другой домен.

### 3.4 Лог и контекст

Агент должен:

- вести журнал диалогов;
- привязывать сообщения к контрагенту, пользователю, чату, задаче или процессу;
- сохранять контекст для повторного входа в разговор;
- уметь формировать summary диалога для handoff.

### 3.5 Эскалация

Агент должен:

- создавать или инициировать задачу, если разговор перешёл в процесс;
- эскалировать доменному owner-agent;
- не брать чужой бизнес-domain в собственное исполнение.

### 3.6 Resolution outcomes

Любое входящее сообщение хозяйства-клиента должно завершаться одним из 4 outcomes:

1. `AUTO_REPLY`
2. `REQUEST_CLARIFICATION`
3. `PROCESS_DRAFT`
4. `HUMAN_HANDOFF`

Правило:

- `AUTO_REPLY` допустим только для read-only, grounded, client-safe ответа;
- `HUMAN_HANDOFF` обязателен для любого change/approval/commitment scenario;
- менеджер не является обязательным посредником для каждого сообщения хозяйства.

---

## 4. Чего агент делать не должен

`front_office_agent` не должен:

- становиться owner-agent для CRM-карточек;
- заменять `crm_agent`, `agronomist`, `economist`, `contracts_agent`;
- выполнять domain writes в чужом контуре;
- превращать любой message stream в задачу по умолчанию;
- работать как свободный universal assistant без governance.

Его роль:

- communication owner;
- routing owner для ingress-layer;
- process detector;
- escalation initiator.

Но не:

- final domain executor.
- source of new commitments от лица компании.

---

## 5. Текущая кодовая база, на которую можно опереться

### 5.1 Уже существующие контуры

- Telegram bot и message intake:
  - [telegram.update.ts](/root/RAI_EP/apps/telegram-bot/src/telegram/telegram.update.ts)
  - [telegram.module.ts](/root/RAI_EP/apps/telegram-bot/src/telegram/telegram.module.ts)
- API telegram integration:
  - [telegram.module.ts](/root/RAI_EP/apps/api/src/modules/telegram/telegram.module.ts)
  - [telegram-notification.service.ts](/root/RAI_EP/apps/api/src/modules/telegram/telegram-notification.service.ts)
- Task contour:
  - [task.service.ts](/root/RAI_EP/apps/api/src/modules/task/task.service.ts)
  - [task.controller.ts](/root/RAI_EP/apps/api/src/modules/task/task.controller.ts)
- Advisory contour:
  - [advisory.service.ts](/root/RAI_EP/apps/api/src/modules/advisory/advisory.service.ts)
- Client / account context:
  - [client-registry.service.ts](/root/RAI_EP/apps/api/src/modules/client-registry/client-registry.service.ts)
- UI surface:
  - [page.tsx](/root/RAI_EP/apps/web/app/(app)/front-office/page.tsx)

### 5.2 Что уже реализовано и чего пока не хватает

Уже реализовано:

- canonical runtime role `front_office_agent`;
- responsibility contract;
- intent catalog первой волны;
- audit-backed dialogue log;
- conversation classification pipeline первой волны;
- canonical onboarding template.

Пока не хватает:

- отдельного thread storage contract вне `auditLog`;
- полного governed handoff map в исполнении, а не только в canonic docs;
- Telegram adapter end-to-end через owner-agent;
- rich front-office workspace с очередями и статусами.

---

## 6. Целевой ownership агента

### 6.1 Domain owner

Домен:

- `front_office`

Primary owner:

- `front_office_agent`

### 6.2 Primary ownership scope

- message intake;
- client-facing ingress decision;
- direct client-safe reply orchestration;
- dialogue logging;
- conversation classification;
- process detection;
- escalation initiation;
- routing to owner-domain.

### 6.3 Secondary owners

`Secondary read / evidence owner`:

- `knowledge`

`Secondary advisory owners`:

- `crm_agent` для клиентского контекста;
- `personal_assistant` для личной координации;
- `monitoring` для escalation-signals.

### 6.4 Write authority

У `front_office_agent` должна быть write authority только на:

- собственный лог диалогов;
- теги и статус thread;
- escalations / pending tasks / routing records;
- коммуникационные summaries.

Не должно быть write authority на:

- CRM-карточки;
- договоры;
- агро-операции;
- финансовые данные;
- юридические сущности.

При этом прямой ответ хозяйству допустим только как:

- informational/read-only output;
- grounded explanation по данным самого хозяйства;
- advisory answer без изменения обязательств, цены, договора, технологии или операции.

---

## 7. Целевой intent catalog первой волны

Первая обязательная волна intent-ов:

- `log_dialog_message`
- `classify_dialog_thread`
- `detect_task_process`
- `detect_free_chat`
- `detect_client_request`
- `create_front_office_escalation`
- `handoff_dialog_to_owner`
- `summarize_dialog_context`

Эти intent-ы не означают, что агент исполняет бизнес-задачу.
Они означают, что он:

- распознаёт коммуникационный тип;
- создаёт structured ingress event;
- инициирует handoff;
- либо запускает governed direct reply path через owner-agent.

---

## 8. Нормативные handoff paths

### 8.1 Обязательные handoff paths

- `front_office_agent -> crm_agent`
  - когда разговор касается клиента, контрагента, карточки, взаимодействия, follow-up
- `front_office_agent -> agronomist`
  - когда разговор содержит агрономическую задачу, полевой вопрос, техкарту, агро-сигнал
- `front_office_agent -> economist`
  - когда разговор касается plan/fact, сценариев, финансовых оценок
- `front_office_agent -> contracts_agent`
  - когда разговор переходит в договорный процесс
- `front_office_agent -> legal_advisor`
  - когда есть юридический риск или интерпретация условий
- `front_office_agent -> monitoring`
  - когда сообщение является escalation signal
- `front_office_agent -> personal_assistant`
  - когда это персональный организационный контур без business ownership

### 8.1.1 Direct reply paths

Помимо handoff, `front_office_agent` имеет право инициировать direct reply path через оркестратор:

- `front_office_agent -> agronomist`
  - factual agronomy status, field/season context, deviations explanation
- `front_office_agent -> economist`
  - read-only plan/fact, budget/risk/status explanation
- `front_office_agent -> contracts_agent`
  - read-only contract status, сроки, документы, объяснение текущих условий
- `front_office_agent -> monitoring`
  - alerts, risk interpretation, monitoring summary
- `front_office_agent -> knowledge`
  - policy/legal explanation без binding advice

Жёсткое ограничение:

- этот path не даёт права на direct domain write;
- этот path не даёт права на обещание, подтверждение или изменение от лица компании.

### 8.2 Запрещённые paths

- `front_office_agent` не должен напрямую вызывать чужой агент без оркестратора.
- `front_office_agent` не должен сам замыкать процесс в чужом домене.
- `front_office_agent` не должен становиться “универсальным исполнителем”.

---

## 9. Минимальный продуктовый функционал

Минимальный продовый набор:

1. Приём Telegram сообщений как универсального communication ingress.
2. Логирование всех диалогов и thread state.
3. Базовая классификация:
   - free chat
   - task/process
   - client request
   - escalation
4. Выделение structured handoff summary.
5. Policy-gated выбор между auto-reply, clarification, process draft и human handoff.
6. Создание task/escalation record в управляемом виде.
7. Передача в owner-domain через orchestration layer.

---

## 10. Основные риски

- Front Office Agent станет вторым CRM-агентом.
- Front Office Agent станет вторым Personal Assistant.
- Любой разговор будет ошибочно считаться задачей.
- Эскалации начнут создаваться без достаточного контекста.
- Коммуникационный лог превратится в неструктурированную свалку без ownership и traceability.

---

## 11. Следствие для архитектуры платформы

После появления `front_office_agent` у платформы появится отдельный owner для первого касания коммуникации.

Это даёт:

- закрытие ingress ownership gap;
- нормальный bridge между communicator и domain agents;
- единый журнал диалогов;
- снижение хаоса в Telegram / communicator flows;
- возможность отделять “разговор” от “процесса”.

---

## 12. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [telegram.update.ts](/root/RAI_EP/apps/telegram-bot/src/telegram/telegram.update.ts)
- [task.service.ts](/root/RAI_EP/apps/api/src/modules/task/task.service.ts)
- [advisory.service.ts](/root/RAI_EP/apps/api/src/modules/advisory/advisory.service.ts)
- [client-registry.service.ts](/root/RAI_EP/apps/api/src/modules/client-registry/client-registry.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/front-office/page.tsx)
