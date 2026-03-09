---
id: DOC-STR-FO-009
type: Refactor Plan
layer: Strategy
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-09
---

# FRONT_OFFICE_REFACTOR_PLAN

## 1. Назначение документа

Этот документ фиксирует, что именно ещё нужно переделать в коде, чтобы `Front-Office` соответствовал канону проекта, а не упрощённой MVP-интерпретации.

Это не backlog “вообще”.  
Это точный план исправления уже сделанного слоя `Front-Office` до правильной модели:

`Free Chat Ingress -> Draft -> MUST Clarification -> Link/Fix -> Confirm -> Commit -> Integrity / Backend Reaction`

---

## 2. Что уже приведено в правильное направление

На текущий момент уже исправлено следующее:

- из `Telegram` убраны жёсткие режимы `Отклонение / Консультация / Контекст`;
- убран `pendingFrontOfficeAction`-подход;
- intake в API больше не создаёт domain object “сразу по сообщению”;
- `Front-Office` intake теперь работает как ingress draft с `classification`, `anchor`, `allowedActions`;
- `Web` уже можно использовать как control plane для структурированных объектов.

Это уже лучше прежнего состояния, но это ещё не канонический финал.

---

## 3. Что сейчас ещё неправильно

### 3.1. Нет first-class draft storage

Сейчас ingress draft фактически сидит на audit-backed записи.  
Это временное решение, но не каноническая модель.

Проблема:

- draft нельзя полноценно вести как отдельную сущность;
- нет ясного lifecycle draft-объекта;
- сложно хранить исправления, link history и confirmation state;
- audit log начинает выполнять не свою основную роль.

### 3.2. Нет first-class thread / conversation contour

Сейчас нет полноценного `Front-Office Thread`, который хранил бы:

- входящие сообщения;
- их связи между собой;
- промежуточные agent conclusions;
- handoff между агентом и доменным владельцем;
- историю уточнений и подтверждений.

Без этого свободный вход есть, а управляемого dialog contour пока нет.

### 3.3. Нет явного confirm-commit layer

Сейчас intake уже не создаёт final object сразу, но следующий канонический шаг ещё не выделен как самостоятельный слой.

Нужно разделить:

- `intake / draft`;
- `fix / link / clarify`;
- `confirm`;
- `commit into domain object`.

Иначе система всё ещё архитектурно “слишком плоская”.

### 3.4. Front-Office agent пока слишком тонкий

Сейчас agent ближе к ingress logger / classifier, чем к реальному owner of mediated intake.

Ему ещё не хватает:

- controlled clarification loop;
- handoff summary;
- явного отделения `suggestion` от `decision`;
- устойчивой работы с thread context.

### 3.5. Web пока больше показывает объекты, чем управляет очередью draft/thread

`Web` уже уместен как control plane, но ему не хватает канонических operator surfaces:

- queue новых ingress draft;
- queue требуемых подтверждений;
- queue объектов без якоря;
- queue handoff / escalation.

---

## 4. Целевое правильное состояние

`Front-Office` должен работать так:

1. Пользователь пишет или отправляет медиа в `Telegram` свободно.
2. Система создаёт `FrontOfficeThread` и `FrontOfficeDraftEvent`.
3. Агент делает только ограниченные вещи:
   - сохраняет raw trace;
   - предлагает `intent hypothesis`;
   - пытается найти якорь;
   - задаёт только `MUST`-уточнения;
   - предлагает `✅ Confirm`, `✏️ Fix`, `🔗 Link`.
4. До `Confirm` ничего не считается финальной operational truth.
5. После `Confirm` срабатывает commit layer:
   - `task event`
   - `observation`
   - `deviation`
   - `consultation`
   - `context update`
6. Все итоговые объекты проходят нормальный domain / integrity contour.
7. `Web UI` показывает:
   - confirmed operational truth;
   - draft queues;
   - thread trace;
   - evidence / history / context.

---

## 5. Целевые сущности

Нужно ввести first-class сущности:

- `FrontOfficeThread`
- `FrontOfficeMessage`
- `FrontOfficeDraftEvent`
- `FrontOfficeDraftLink`
- `FrontOfficeClarification`
- `FrontOfficeConfirmation`
- `FrontOfficeCommitResult`

Минимальный draft lifecycle:

- `INGESTED`
- `NEEDS_LINK`
- `NEEDS_MUST_CLARIFICATION`
- `READY_TO_CONFIRM`
- `CONFIRMED`
- `COMMITTED`
- `HANDOFF_REQUIRED`
- `REJECTED`

---

## 6. Точные изменения по коду

### 6.1. API: выделить draft/thread модуль

Нужно добавить новый модуль:

- `apps/api/src/modules/front-office-draft/*`

Минимальный состав:

- `front-office-draft.module.ts`
- `front-office-draft.service.ts`
- `front-office-draft.controller.ts`
- `dto/*`
- `entities/*` или persistence adapters

Ответственность модуля:

- создание draft из свободного ingress;
- хранение raw trace;
- хранение clarification state;
- link / fix / confirm operations;
- подготовка commit payload для domain modules.

### 6.2. API: облегчить текущий front-office service

Файл:

- `apps/api/src/modules/front-office/front-office.service.ts`

Нужно превратить его в orchestration facade, а не в место смешения всех операций.

Он должен:

- агрегировать overview;
- вызывать draft service;
- вызывать commit service;
- отдавать read-model;
- не хранить сам draft lifecycle внутри себя.

### 6.3. API: ввести отдельный confirm / commit service

Нужно добавить слой вида:

- `apps/api/src/modules/front-office-draft/front-office-commit.service.ts`

Он должен:

- принимать только `CONFIRMED` draft;
- определять целевой domain owner;
- вызывать нужный domain write contract;
- возвращать `commitResult` с ссылкой на созданный объект.

Важно:

- `deviation` не закрывается здесь;
- изменение плана не происходит здесь;
- финальное управленческое решение не принимается здесь.

### 6.4. API: эволюция front-office agent

Файлы:

- `apps/api/src/modules/rai-chat/agents/front-office-agent.service.ts`
- `apps/api/src/modules/rai-chat/tools/front-office-tools.registry.ts`

Нужно дать агенту строго ограниченный набор обязанностей:

- распознать тип сигнала как гипотезу;
- найти вероятный anchor;
- сформировать минимальный список `MUST`-уточнений;
- подготовить handoff summary;
- не создавать final domain object самостоятельно.

Нужные tool-capabilities:

- `detect_intent_hypothesis`
- `detect_anchor_candidates`
- `extract_must_clarifications`
- `summarize_thread_for_handoff`
- `detect_task_process_signal`

### 6.5. Telegram: оставить только transport + confirm actions

Файл:

- `apps/telegram-bot/src/telegram/telegram.update.ts`

Целевое состояние:

- любой текст / фото / голос / документ уходит как free ingress;
- Telegram не спрашивает “какой это режим?”;
- Telegram не держит продуктовые mode-state;
- Telegram показывает только универсальные действия:
  - `✅ Confirm`
  - `✏️ Fix`
  - `🔗 Link`
- task-specific CTA допустимы только там, где уже есть явная задача.

### 6.6. Telegram API client: перейти на draft contracts

Файл:

- `apps/telegram-bot/src/shared/api-client/api-client.service.ts`

Нужны методы:

- `createFrontOfficeDraftFromMessage`
- `confirmFrontOfficeDraft`
- `fixFrontOfficeDraft`
- `linkFrontOfficeDraft`
- `getFrontOfficeThread`

Не нужны mode-driven create методы.

### 6.7. Web: показывать не только объекты, но и mediation queues

Файлы:

- `apps/web/app/(app)/front-office/page.tsx`
- `apps/web/app/(app)/front-office/*`
- `apps/web/lib/api/front-office.ts`

Нужно добавить surfaces:

- `New Ingress`
- `Needs Clarification`
- `Needs Link`
- `Ready to Confirm`
- `Recent Commits`

Карточка draft / thread должна показывать:

- исходный trace;
- suggested intent;
- anchor candidates;
- must clarifications;
- историю `Fix / Link / Confirm`;
- commit result.

### 6.8. Contracts: выделить канонический draft API

Нужны публичные контракты:

- `POST /front-office/intake/message`
- `GET /front-office/drafts/:draftId`
- `POST /front-office/drafts/:draftId/fix`
- `POST /front-office/drafts/:draftId/link`
- `POST /front-office/drafts/:draftId/confirm`
- `GET /front-office/threads/:threadId`
- `GET /front-office/queues`

Семантика:

- `intake/message` создаёт только draft;
- `confirm` делает commit;
- `fix` меняет draft data;
- `link` якорит draft на object graph;
- `queues` даёт операторский read-model для `Web`.

---

## 7. Порядок рефакторинга

### Этап 1. Выделить draft storage и lifecycle

Сначала:

- создать `front-office-draft` модуль;
- перенести туда intake draft persistence;
- убрать зависимость от audit как primary storage;
- ввести draft statuses.

### Этап 2. Выделить thread contour

Дальше:

- ввести `threadId`;
- хранить входящие сообщения цепочкой;
- хранить agent hypotheses и clarification history;
- связать thread с draft.

### Этап 3. Ввести explicit confirm / commit

После этого:

- отделить `confirm` от `commit orchestration`;
- сделать commit routing в domain modules;
- привязать `commitResult` к draft / thread.

### Этап 4. Достроить Web mediation surfaces

После стабилизации backend:

- добавить queues;
- добавить thread / draft cards;
- показать operator workflow поверх draft lifecycle.

### Этап 5. Закрыть e2e и pilot readiness

В конце:

- Telegram free ingress e2e;
- draft clarification e2e;
- confirm -> domain object e2e;
- Web queue visibility e2e;
- demo / pilot flows.

---

## 8. Что оставить, а что не трогать

Оставить как основу:

- `apps/api/src/modules/front-office/front-office.controller.ts`
- `apps/api/src/modules/front-office/front-office.service.ts` как facade после упрощения
- `apps/api/src/modules/rai-chat/agents/front-office-agent.service.ts`
- `apps/api/src/modules/rai-chat/tools/front-office-tools.registry.ts`
- `apps/web/app/(app)/front-office/*`

Не возвращать:

- Telegram mode buttons для `deviation / consultation / context`;
- `pendingFrontOfficeAction`;
- прямое создание final object из одного свободного сообщения;
- навязывание `requestedIntent` со стороны клиента как финальной истины.

---

## 9. Definition of Done для правильного состояния

`Front-Office` считается приведённым в правильное состояние, если:

- `Telegram` работает как свободный ingress-канал;
- любой релевантный сигнал сначала становится `draft`;
- classification существует только как hypothesis;
- система умеет `Fix / Link / Confirm`;
- только `Confirm` может привести к commit;
- итоговый object всегда anchored и traceable;
- `Web` показывает и queues, и final operational truth;
- `Front-Office` не принимает финальные управленческие решения вне своей зоны полномочий.

---

## 10. Что делать следующим практическим шагом

Следующий правильный инженерный шаг:

1. Создать `front-office-draft` модуль в API.
2. Перенести туда текущую intake draft логику из `front-office.service.ts`.
3. Добавить `draftId`, `threadId`, `status`, `mustClarifications`, `anchorCandidates`.
4. Ввести `confirm / fix / link` endpoints.
5. После этого уже достраивать `Web queues`.

Без этого дальнейшее наращивание `Front-Office` будет снова строиться на временной схеме, а не на каноническом основании.
