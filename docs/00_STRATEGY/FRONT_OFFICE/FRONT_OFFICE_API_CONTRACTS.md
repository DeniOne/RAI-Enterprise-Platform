---
id: DOC-STR-FO-005
type: API Contracts
layer: Strategy
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-09
---

# FRONT_OFFICE_API_CONTRACTS

## 1. Назначение документа

Этот документ фиксирует API-контракты блока `Front-Office`:

- какие контракты уже реально существуют в коде;
- какие контракты нужны для канонического `Front-Office`;
- где есть разрывы между `frontend`, `Telegram` и `backend`.

Документ нужен как bridge между:

- `Scope`;
- `IA`;
- `User Flows`;
- `apps/web`;
- `apps/api`;
- `Telegram`-каналом.

---

## 2. Базовый принцип

`Front-Office` должен работать через ограниченный и явный набор API-контрактов.

Контракт должен:

- быть привязан к конкретной сущности;
- отражать реальные user flows;
- давать read/write границу без двусмысленности;
- быть одинаково понятным для `Web UI`, `Telegram` и агентного слоя.

---

## 3. Канонические доменные группы API

Для `Front-Office` нужны следующие группы контрактов:

- `Fields`
- `Seasons`
- `Tech Maps`
- `Tasks`
- `Observations`
- `Deviations`
- `Consultations`
- `Context Updates`
- `Orchestrator`
- `Evidence`

Из них часть уже реализована, часть пока только вытекает из product-модели.

---

## 4. Фактически существующие backend контракты

## 4.1 Fields

### Реально есть

- `GET /api/registry/fields`
- `POST /api/registry/fields`

### Использование

- список полей;
- создание поля.

### Gap

Для канонического `Front-Office` не хватает:

- `GET /api/registry/fields/:id`
- возможно `PATCH /api/registry/fields/:id` для ограниченных контекстных правок

---

## 4.2 Tasks

### Реально есть

- `GET /api/tasks/my`
- `GET /api/tasks/:id`
- `POST /api/tasks/:id/start`
- `POST /api/tasks/:id/complete`
- `POST /api/tasks/:id/cancel`

### Использование

- мои задачи;
- карточка задачи;
- старт;
- завершение;
- отмена.

### Комментарий

Это одно из самых зрелых API-направлений для `Front-Office`.

---

## 4.3 Tech Maps

### Реально есть

- `GET /api/tech-map`
- `GET /api/tech-map/:id`
- `GET /api/tech-map/season/:seasonId`
- `POST /api/tech-map/generate`
- `PATCH /api/tech-map/:id/draft`
- `PATCH /api/tech-map/:id/transition`

### Использование

- список техкарт;
- карточка техкарты;
- техкарты сезона;
- генерация;
- работа с draft;
- переходы FSM.

### Комментарий

Для продуктового `Front-Office` важен не весь lifecycle, а:

- просмотр;
- согласование;
- отображение статуса;
- переход в связанные задачи и отклонения.

### Gap

Во frontend-клиенте уже ожидается:

- `POST /api/tech-map/:id/activate`

Но в реальном controller-слое сейчас exposed:

- `PATCH /api/tech-map/:id/transition`

То есть нужен либо:

- единый канонический контракт переходов,

либо:

- frontend-layer, который скрывает различие.

---

## 4.4 Orchestrator

### Реально есть

- `GET /api/orchestrator/stages`
- `GET /api/orchestrator/seasons/:id/stage`
- `GET /api/orchestrator/seasons/:id/transitions`
- `GET /api/orchestrator/seasons/:id/history`
- `POST /api/orchestrator/seasons/:id/initialize`
- `POST /api/orchestrator/seasons/:id/transition`
- `POST /api/orchestrator/seasons/:id/event`

### Использование

- чтение текущей стадии;
- чтение истории;
- доступные переходы;
- применение события;
- запуск lifecycle.

### Комментарий

`Orchestrator` уже дает хороший каркас для карточки сезона и событийного журнала.

---

## 4.5 Observations

### Реально есть

- `GET /api/field-observation`
- `GET /api/field-observation/task/:taskId`

### Использование

- список наблюдений;
- наблюдения по задаче.

### Gap

Для канонического `Front-Office` пока не видно явно exposed REST endpoint-ов на:

- создание observation через web/API;
- получение observation по полю;
- получение observation по сезону.

---

## 4.6 Seasons

### Реально есть

В текущем срезе `Season` доступен в основном через GraphQL:

- `getSeasons`
- `getSeason`
- `createSeason`
- `updateSeason`
- `completeSeason`
- `transitionSeasonStage`

### Комментарий

Для `Front-Office` это означает, что сезон как продуктовая сущность уже существует, но REST read-model для web/telegram-контура еще не закреплен как канон.

### Gap

Для `Front-Office` нужен явный read contract уровня:

- `GET /api/seasons`
- `GET /api/seasons/:id`
- возможно `GET /api/seasons/:id/summary`

---

## 5. Целевые Front-Office read contracts

Эти контракты нужны для канонического `Front-Office` независимо от способа внутренней реализации.

## 5.1 Operational Center

- `GET /api/front-office/overview`

Должен возвращать:

- задачи, требующие действия;
- поля с проблемами;
- сезоны с риском;
- новые консультации;
- последние критические события;
- техкарты, ожидающие согласования.

---

## 5.2 Fields

- `GET /api/registry/fields`
- `GET /api/registry/fields/:id`
- `GET /api/registry/fields/:id/context`
- `GET /api/registry/fields/:id/events`

Карточка поля должна получать:

- базовую информацию;
- текущий сезон;
- связанные задачи;
- отклонения;
- observations;
- consultations;
- context updates.

---

## 5.3 Seasons

- `GET /api/seasons`
- `GET /api/seasons/:id`
- `GET /api/seasons/:id/tech-map`
- `GET /api/seasons/:id/tasks`
- `GET /api/seasons/:id/observations`
- `GET /api/seasons/:id/deviations`
- `GET /api/seasons/:id/history`

---

## 5.4 Tech Maps

- `GET /api/tech-map`
- `GET /api/tech-map/:id`
- `GET /api/tech-map/season/:seasonId`
- `GET /api/tech-map/:id/operations`
- `GET /api/tech-map/:id/approvals`

---

## 5.5 Tasks

- `GET /api/tasks/my`
- `GET /api/tasks/:id`
- `GET /api/tasks/:id/observations`
- `GET /api/tasks/:id/evidence`
- `GET /api/tasks/:id/history`

---

## 5.6 Deviations

Целевые read contracts:

- `GET /api/deviations`
- `GET /api/deviations/:id`
- `GET /api/deviations/:id/evidence`
- `GET /api/deviations/:id/history`

На текущем срезе эти контракты как отдельный `Front-Office` API еще не закреплены.

---

## 5.7 Consultations

Целевые read contracts:

- `GET /api/consultations`
- `GET /api/consultations/:id`
- `GET /api/consultations/by-task/:taskId`
- `GET /api/consultations/by-season/:seasonId`
- `GET /api/consultations/by-field/:fieldId`

---

## 5.8 Context

Целевые read contracts:

- `GET /api/front-office/context/farm/:id`
- `GET /api/front-office/context/field/:id`
- `GET /api/front-office/context/season/:id`
- `GET /api/front-office/context/history`

---

## 6. Целевые Front-Office write contracts

## 6.1 Tasks

Уже есть и должны остаться каноническими:

- `POST /api/tasks/:id/start`
- `POST /api/tasks/:id/complete`
- `POST /api/tasks/:id/cancel`

### Требование к payload

Write-contract должен поддерживать:

- evidence;
- комментарий;
- structured metadata;
- ссылку на канал (`telegram` / `web`);
- идентификатор исходного сообщения, если действие пришло из агента.

---

## 6.2 Observations

Целевые write contracts:

- `POST /api/field-observation`

Payload должен позволять:

- привязку к `fieldId`, `seasonId`, `taskId`;
- тип observation;
- текст;
- attachments;
- source channel;
- provenance metadata.

---

## 6.3 Deviations

Целевые write contracts:

- `POST /api/deviations`
- `POST /api/deviations/:id/evidence`
- `POST /api/deviations/:id/escalate`

`Front-Office` может:

- создать отклонение;
- приложить evidence;
- эскалировать.

`Front-Office` не должен:

- окончательно закрывать deviation.

---

## 6.4 Consultations

Целевые write contracts:

- `POST /api/consultations`
- `POST /api/consultations/:id/message`
- `POST /api/consultations/:id/evidence`

Консультация должна создаваться только с привязкой к объекту:

- task;
- field;
- season;
- deviation.

---

## 6.5 Context updates

Целевые write contracts:

- `POST /api/front-office/context-updates`

Payload:

- target type;
- target id;
- text summary;
- attachments;
- extracted structured fields;
- source channel;
- source message id.

---

## 6.6 Tech Map approval

Целевой write contract:

- `POST /api/tech-map/:id/approve-by-farm`

Важно:

- это не изменение техкарты;
- это согласование без изменения содержания;
- если нужны правки, должен запускаться другой внешний процесс.

---

## 7. Адаптерный слой для Telegram

`Telegram` не должен напрямую жить на случайных backend маршрутах.

Нужен стабильный adapter layer, который:

- принимает сообщения и действия из `Telegram`;
- преобразует их в канонические `Front-Office` команды;
- обогащает payload метаданными канала;
- связывает исходное сообщение с созданным domain object.

Минимальные поля adapter payload:

- `channel = telegram`
- `userId`
- `companyId`
- `sourceMessageId`
- `chatId`
- `attachments`
- `detectedIntent`
- `confidence`

---

## 8. Текущие frontend/backend gaps

## 8.1 Fields gap

`apps/web/lib/api/front-office.ts` ожидает:

- `GET /api/registry/fields/:id`

Но controller сейчас дает только:

- `GET /api/registry/fields`
- `POST /api/registry/fields`

---

## 8.2 Tech Map transition gap

Frontend ожидает:

- `POST /api/tech-map/:id/activate`

Backend сейчас явно экспонирует:

- `PATCH /api/tech-map/:id/transition`

---

## 8.3 Seasons gap

`Front-Office` по продуктовой логике требует полноценного season read-model,
но в текущем срезе явного REST controller для этого не видно.

---

## 8.4 Observations gap

Чтение observation уже есть, но write-contract для `Front-Office` как канон еще не зафиксирован.

---

## 8.5 Deviations / Consultations / Context gaps

С точки зрения `Front-Office` эти объекты уже нужны по user flows,
но как единая контрактная поверхность в этом контуре они еще не оформлены.

---

## 9. Рекомендуемый контрактный принцип

Для `Front-Office` лучше держать не россыпь случайных endpoint-ов, а три уровня API:

### 9.1 Read layer

Для экранов и карточек:

- summary;
- list;
- detail;
- history;
- related objects.

### 9.2 Action layer

Для user flows:

- start;
- complete;
- report deviation;
- request consultation;
- approve tech map;
- update context.

### 9.3 Channel adapter layer

Для `Telegram` и агентного ввода:

- intake message;
- classify message;
- map to action;
- persist source trace.

---

## 10. Ключевой вывод

Контрактная модель `Front-Office` уже частично существует в коде, особенно вокруг:

- `tasks`;
- `fields`;
- `tech-map`;
- `orchestrator`;
- `field-observation`.

Но для канонического продуктового контура еще нужно дособрать единую поверхность API для:

- `seasons`;
- `deviations`;
- `consultations`;
- `context updates`;
- `Telegram adapter` flows.
