---
id: DOC-INS-AGENTS-INSTRUCTION-FRONT-OFFICE-BACK-OFFIC-4WYM
layer: Instructions
type: Instruction
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — МАРШРУТИЗАЦИЯ КОММУНИКАЦИИ FRONT OFFICE ↔ BACK OFFICE

## 1. Назначение

Документ фиксирует рабочую схему общения между хозяйством-клиентом, `front_office_agent`, `A-RAI` и back-office менеджером.

Это инструкция не про профиль агента и не про общий enablement, а именно про то, как правильно устроить и поддерживать production-canon коммуникации.

## 2. Когда применять

Использовать документ, когда:

- меняется Telegram-first contour;
- меняется routing входящих сообщений от хозяйства;
- подключается direct reply от `RAI` в client-facing контур;
- меняется роль менеджера в Mini App;
- проверяется, не нарушена ли граница между Front Office и Back Office.

## 3. Предварительные условия

Перед применением этой инструкции нужно опираться на:

- [Front-Office_Function_Admission_Rules.md](/root/RAI_EP/docs/01_ARCHITECTURE/PRINCIPLES/Front-Office_Function_Admission_Rules.md)
- [RAI_FRONT_OFFICE_AGENT_CANON.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)

## 4. Каноническая модель общения

### 4.1 Кто является субъектами контура

- `Хозяйство-клиент` общается с платформой через Front Office.
- `front_office_agent` является owner входящего client-facing ingress.
- `A-RAI` даёт direct reply только в safe informational/read-only scope.
- `Менеджер` является субъектом Back Office, а не Front Office.

### 4.2 Один правильный входной контур

Каноника:

`Хозяйство -> Telegram bot -> front_office_agent -> policy decision -> outcome`

Запрещённые модели:

- `Хозяйство -> менеджер -> A-RAI`
- `Хозяйство -> напрямую в A-RAI мимо front_office_agent`
- `Менеджер -> raw text в общий бот -> хозяйство`

### 4.3 Роль менеджера

Менеджер не должен быть посредником для каждого сообщения хозяйства.

Менеджер подключается только если:

- нужен `HUMAN_HANDOFF`;
- есть explicit escalation;
- direct reply запрещён policy;
- auto-reply/clarification path не смог завершиться безопасно.

## 5. Минимальный состав реализации

Коммуникационный контур считается реализованным правильно, если есть:

- общий Telegram bot ingress;
- `front_office_agent` на входе всех сообщений хозяйства;
- policy layer с 4 outcomes;
- in-process path `front_office -> RaiChatService -> owner-agent -> client reply`;
- единый outbound pipeline для всех исходящих сообщений хозяйству;
- manager Mini App для human-owned кейсов;
- отдельная вкладка `A-RAI` для внутреннего advisory-диалога менеджера.

## 6. Пошаговый алгоритм маршрутизации

### 6.1 Входящее сообщение от хозяйства

Каждое входящее сообщение хозяйства обязано пройти такой путь:

1. Telegram bot принимает сообщение.
2. Сообщение отправляется в `POST /api/front-office/intake/message`.
3. `FrontOfficeDraftService.intakeMessage()` фиксирует inbound thread/message.
4. `front_office_agent` классифицирует диалог.
5. `FrontOfficeReplyPolicyService` принимает решение по outcome.
6. Далее выполняется одна из 4 веток.

### 6.2 Outcome `AUTO_REPLY`

Использовать только если ответ:

- informational;
- read-only;
- grounded;
- относится к данным самого хозяйства;
- не создаёт обязательств;
- не меняет технологию, договор, цену, оплату или операцию.

Путь:

1. `front_office_agent` классифицирует сообщение.
2. policy разрешает `AUTO_REPLY`.
3. `FrontOfficeClientResponseOrchestrator` вызывает `RaiChatService.handleChat()` in-process.
4. В request передаётся `audience = client_front_office`.
5. Ответ отправляется хозяйству через `FrontOfficeOutboundService`.
6. Менеджер по умолчанию не уведомляется.

### 6.3 Outcome `REQUEST_CLARIFICATION`

Использовать, если для безопасного ответа не хватает контекста.

Путь:

1. policy фиксирует `missingContext`.
2. `FrontOfficeClientResponseOrchestrator` формирует уточняющий вопрос.
3. Вопрос уходит хозяйству через единый outbound pipeline.
4. Менеджер не пейджится.

### 6.4 Outcome `PROCESS_DRAFT`

Использовать, если сообщение является process/task signal.

Примеры:

- observation;
- deviation;
- фото с поля;
- голосовой факт;
- подтверждение или неподтверждение операции;
- context/process signal.

Путь:

1. сообщение проходит через intake;
2. создаётся draft;
3. сохраняется текущий `fix/link/confirm/commit` flow;
4. direct reply по существу не обязателен.

### 6.5 Outcome `HUMAN_HANDOFF`

Использовать, если сообщение:

- требует человеческой ответственности;
- связано с договором, ценой, оплатой, обещанием, обязательством;
- требует change/approval;
- не имеет достаточного safe context;
- попадает в explicit escalation.

Путь:

1. создаётся governed handoff;
2. хозяйству отправляется receipt;
3. назначенный менеджер получает уведомление;
4. менеджер работает уже из Mini App.

## 7. Правило по Back Office и A-RAI

### 7.1 Что делает менеджер

Менеджер в raw Telegram bot не должен вести свободный диалог с хозяйством.

Правильный режим:

- raw bot для менеджера работает как launcher/notifier;
- рабочее место менеджера находится в Mini App;
- ответ хозяйству менеджер отправляет только из thread view.

### 7.2 Что делает A-RAI для менеджера

`A-RAI` для менеджера является внутренним advisory-ассистентом.

Правильный режим:

- `manager -> Mini App -> вкладка A-RAI -> advisory dialog`

Неправильный режим:

- `A-RAI` автоматически отвечает хозяйству от имени менеджера;
- `A-RAI` обходит `front_office_agent`.

### 7.3 Как менеджер отвечает хозяйству

Правильный путь:

`manager -> Mini App -> thread reply -> FrontOfficeOutboundService -> Telegram representative`

То есть даже manager reply хозяйству должен проходить через общий communication layer, а не через отдельный bypass.

## 8. Жёсткие запреты

Нельзя:

- пропускать входящее сообщение хозяйства мимо `front_office_agent`;
- делать менеджера обязательным посредником для всех client messages;
- отвечать хозяйству напрямую из `A-RAI` без routing decision;
- делать direct AI reply для change/approval/commitment scenarios;
- давать `front_office_agent` write ownership в CRM, contracts, finance, legal;
- пускать raw text менеджера в общий client ingress;
- строить peer-to-peer вызов `front_office_agent -> owner-agent` вне оркестратора/runtime spine.

## 9. Что должно получиться на выходе

На выходе должна работать такая схема:

- хозяйство пишет в Telegram;
- сообщение всегда проходит через `front_office_agent`;
- safe informational вопрос получает прямой ответ `RAI`;
- process signal попадает в draft/process flow;
- human-owned вопрос уходит в governed handoff;
- менеджер отвечает из Mini App;
- `A-RAI` остаётся внутренним advisory-контуром менеджера.

## 10. Критические ошибки и признаки неправильной схемы

Схема считается сломанной, если:

- сообщение хозяйства приходит менеджеру, минуя `front_office_agent`;
- менеджер обязан вручную разбирать каждый технический вопрос;
- хозяйство не может получить direct informational answer от `RAI`;
- manager raw-chat снова становится рабочим способом общения с хозяйством;
- ответы хозяйству уходят разными независимыми transport paths;
- back-office очередь засоряется safe informational запросами, которые должен закрывать `RAI`.

## 11. Проверка готовности

Считать схему корректной можно только если проходят все проверки:

1. Любой inbound message хозяйства проходит через `front_office_agent`.
2. Safe technical/status question получает direct reply в том же Telegram thread.
3. Недостаток контекста приводит к clarification, а не к silent failure.
4. Observation/deviation signal остаётся в process draft-flow.
5. Human-owned запрос создаёт handoff и уведомляет менеджера.
6. Менеджер не может вести raw text диалог с хозяйством в общем боте.
7. Manager reply хозяйству проходит через единый outbound pipeline.
8. `A-RAI` в manager Mini App не отправляет сообщения хозяйству автоматически.

## 12. Требования к тестам

Обязательны:

- unit tests на `AUTO_REPLY`, `REQUEST_CLARIFICATION`, `PROCESS_DRAFT`, `HUMAN_HANDOFF`;
- tests на запрет dangerous direct replies;
- tests на suppression дублей в Telegram transport;
- tests на manager raw-text denial;
- e2e tests на сценарий:
  - `хозяйство -> front_office_agent -> direct RAI reply`
  - `хозяйство -> handoff -> manager -> reply`

## 13. Связанные файлы и точки кода

- [front-office-draft.service.ts](/root/RAI_EP/apps/api/src/modules/front-office-draft/front-office-draft.service.ts)
- [front-office-reply-policy.service.ts](/root/RAI_EP/apps/api/src/modules/front-office-draft/front-office-reply-policy.service.ts)
- [front-office-client-response.orchestrator.service.ts](/root/RAI_EP/apps/api/src/modules/front-office-draft/front-office-client-response.orchestrator.service.ts)
- [front-office-outbound.service.ts](/root/RAI_EP/apps/api/src/modules/front-office-draft/front-office-outbound.service.ts)
- [front-office-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/front-office-agent.service.ts)
- [rai-chat.dto.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts)
- [response-composer.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.ts)
- [telegram.update.ts](/root/RAI_EP/apps/telegram-bot/src/telegram/telegram.update.ts)
- [RAI_FRONT_OFFICE_AGENT_CANON.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)
