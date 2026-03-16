---
id: DOC-EXE-07-EXECUTION-PWA-FRONT-OFFICE-COMMUNICATOR-IMPLEMENTATION-PLAN-2026-03-16
layer: Execution
type: Implementation Plan
status: draft
version: 0.1.0
owners: [@codex]
last_updated: 2026-03-16
---
# PWA Front-Office Communicator: единый план реализации

## 1. Назначение документа

Этот документ фиксирует единый план реализации блока `PWA Front-Office Communicator` в RAI_EP.

Под блоком понимается:

- мобильный и desktop `web/PWA` интерфейс без публикации в `Google Play` и `App Store`;
- клиентский контур для представителя хозяйства;
- менеджерский контур для работы с чатами хозяйств и переключением в `A-RAI`;
- временное сосуществование с `Telegram`, без немедленного отключения Telegram-канала.

Документ объединяет:

- продуктовое описание;
- UX/визуальную концепцию;
- технический план;
- поэтапную реализацию;
- критерии готовности.

## 2. Целевое решение

## 2.1. Общая идея

RAI_EP получает собственный `PWA communicator`, который пользователь может:

- открыть по ссылке;
- добавить как иконку на экран смартфона;
- использовать как “квази-приложение” без стора.

Этот `PWA communicator` становится:

- каноническим устойчивым `web`-каналом связи;
- основным резервом при деградации Telegram;
- основой для дальнейшего перехода на независимый customer-facing контур.

Telegram при этом:

- пока не убирается;
- остается входным каналом и резервом;
- используется как мост в период миграции;
- может содержать кнопку `Открыть рабочее место`.

## 2.2. Две главные роли

### Клиент

Представитель хозяйства:

- открывает иконку на телефоне;
- попадает сразу в свой диалоговый контур;
- пишет сообщения, прикладывает фото, получает ответы;
- не думает про Telegram, если web-канал уже освоен.

### Менеджер

Сотрудник бэкофиса:

- открывает иконку или web workspace;
- переключается между:
  - `Клиенты`;
  - `A-RAI`;
- читает и ведет клиентские диалоги;
- переходит из клиентского контекста в AI-контур без смены инструмента.

## 3. Целевой UX

## 3.1. Клиентский сценарий

### Сценарий входа

1. Менеджер отправляет приглашение.
2. Клиент открывает ссылку.
3. Проходит `activate/login`.
4. Видит предложение:
   - `Открыть чат`;
   - `Добавить на экран`.
5. После добавления запускает интерфейс через иконку.

### Сценарий использования

Клиент попадает не в общий кабинет, а сразу в простой communicator:

- верхняя часть: хозяйство / статус канала / доступность менеджера;
- центральная часть: лента сообщений;
- нижняя часть: поле ввода и вложения.

Ключевой принцип:

- минимум лишней навигации;
- ощущение “это чат”, а не “ERP-кабинет”.

## 3.2. Менеджерский сценарий

Менеджерский PWA/workspace открывает рабочее место с двумя основными вкладками:

- `Клиенты`;
- `A-RAI`.

### Вкладка `Клиенты`

Содержит:

- список хозяйств;
- список диалогов;
- состояние handoff;
- unread badges;
- быстрый ответ;
- контекст поля/сезона/задачи;
- системные статусы.

### Вкладка `A-RAI`

Содержит:

- AI workspace / чат ассистента;
- контекст выбранного хозяйства;
- возможность работать с конкретным клиентским кейсом;
- быстрый возврат в клиентский диалог.

Это уже соответствует текущей логике workspace, где у вас есть переключение `farms | ai`.

## 3.3. Роль Telegram в переходный период

Telegram в переходный период используется так:

- пользователь может написать в Telegram;
- менеджер получает push/ссылку;
- из Telegram можно открыть `рабочее место`;
- сам полноценный рабочий сценарий постепенно переносится в `PWA`.

Целевое состояние:

- Telegram становится дополнительным ingress-каналом;
- канонический интерфейс и канонический UX живут в `PWA communicator`.

## 4. Информационная архитектура

## 4.1. Клиентская часть

Минимальная структура:

- `Главный экран / активный чат`
- `История диалогов`
- `Профиль / доступ`
- `Помощь / контакты`

Для MVP допустимо даже проще:

- один активный экран чата;
- вторичный список диалогов;
- минимальные настройки.

## 4.2. Менеджерская часть

Структура:

- `Клиенты`
- `A-RAI`
- `Назначенные хозяйства`
- `Треды`
- `Текущий диалог`
- `Контекст кейса`

На мобильном:

- нижняя или верхняя tab-навигация;
- drill-down в один активный поток.

На desktop:

- 3 колонки:
  - хозяйства;
  - темы/треды;
  - текущий диалог и контекст.

## 5. Визуальная концепция

## 5.1. Общий принцип

Это должен быть не “ещё один кабинет RAI_EP”, а намеренно легкий `communicator-first` интерфейс.

Тон визуала:

- чистый;
- спокойный;
- быстрый;
- не перегруженный ERP-деталями;
- с ясным различием между:
  - сообщениями клиента;
  - ответами менеджера;
  - AI/system events.

## 5.2. Визуальные роли

### Клиентский интерфейс

Должен ощущаться:

- дружелюбно;
- просто;
- “как чат поддержки/оператора”, а не как сложная система.

Рекомендуется:

- крупный текст;
- крупные зоны нажатия;
- короткие системные статусы;
- минимум второстепенных элементов;
- карточки событий для handoff/подтверждений.

### Менеджерский интерфейс

Должен ощущаться:

- как рабочий стол оператора;
- с быстрой навигацией;
- с четким приоритетом непрочитанных/критичных тредов;
- с быстрым переключением в `A-RAI`.

## 5.3. Визуальные блоки MVP

### Клиент

- шапка с названием хозяйства или организации;
- таймлайн сообщений;
- поле ввода;
- кнопка вложения;
- системная карточка статуса;
- пустое состояние “Напишите сообщение”.

### Менеджер

- список хозяйств;
- счетчик непрочитанного;
- список тем;
- активный диалог;
- панель быстрого контекста:
  - поле;
  - сезон;
  - задача;
  - owner role;
  - handoff status;
- tab switch `Клиенты / A-RAI`.

## 5.4. PWA-поведение

Визуально и поведенчески нужно обеспечить:

- splash-like стартовый экран;
- корректную работу в standalone mode;
- app-like header;
- отсутствие ощущения “это просто сайт в браузере”.

## 6. Техническая архитектура

## 6.1. Что уже есть

В текущей системе уже существуют:

- канал `web_chat` в front-office типах;
- intake endpoint для `channel = web_chat`;
- thread/message/reply/read APIs;
- внешний `portal/front-office`;
- auth flow `invite -> activate -> login`;
- менеджерский workspace с логикой `farms | ai`;
- thread-centric front-office backend.

Это позволяет строить решение не с нуля, а поверх существующего контракта.

## 6.2. Целевые технические контуры

### Клиентский PWA contour

- `portal/front-office`
- login/activation
- список диалогов
- чат
- вложения
- polling/SSE
- PWA install

### Менеджерский PWA/workspace contour

- unified workspace
- список хозяйств
- клиентские треды
- AI tab
- reply + context + handoff

### Коммуникационный backend contour

- front-office draft/thread/handoff remains canonical;
- `web_chat` becomes equal transport;
- Telegram remains side transport during migration.

## 6.3. Обязательные технические изменения

### 1. Нейтральный communicator namespace

Нужно уйти от Telegram-specific UI naming:

- заменить `/telegram/workspace` на нейтральный route;
- рекомендованный вариант:
  - `/communicator/workspace`
  - или `/front-office/workspace`.

### 2. Равноправная обработка `web_chat`

Нужно сделать `web_chat` полноценным transport mode:

- inbound;
- outbound;
- read states;
- notifications.

### 3. Realtime strategy

Для MVP:

- polling `messages`.

Для следующего этапа:

- `SSE`.

WebSocket нужен только если после MVP появится реальный запрос на live bi-directional transport beyond timeline refresh.

### 4. PWA shell

Нужно добавить:

- `manifest`;
- icons;
- standalone mode;
- install prompt;
- mobile safe area handling;
- offline fallback page.

### 5. Web notifications

На раннем этапе:

- email fallback;
- возможно Telegram push как bridge.

На следующем:

- Web Push, где это реально поддерживается.

## 7. Реализация по слоям

## 7.1. Backend

### Этап B1. Harden web_chat transport

- проверить все ветки `web_chat` в `front-office-draft` и outbound;
- убедиться, что `replyToThread` и inbound intake не завязаны на Telegram-only assumptions;
- добавить канонический delivery path для `web_chat`.

### Этап B2. New inbound web entry

- добавить сценарий создания нового обращения из внешнего портала;
- использовать `POST /front-office/intake/message` с `channel = "web_chat"`;
- обеспечить формирование thread/draft по тем же правилам, что и у Telegram.

### Этап B3. Media

- upload endpoint;
- storage strategy;
- ссылки на media в payload/evidence;
- image-first support;
- затем voice/file.

### Этап B4. Realtime

- polling API hardening;
- ETag/If-Modified-Since или last message marker при необходимости;
- затем `SSE`.

## 7.2. Frontend

### Этап F1. Клиентский PWA MVP

- PWA shell;
- install prompt;
- mobile-first chat screen;
- список диалогов;
- reply flow;
- loading/error/empty states.

### Этап F2. Менеджерский unified workspace

- вынести workspace из Telegram-specific namespace;
- сохранить паттерн `Клиенты / A-RAI`;
- добавить быстрый переход между тредом и AI;
- улучшить мобильный режим менеджера.

### Этап F3. Visual polish

- app-like shell;
- ясные message roles;
- handoff/system cards;
- аккуратные badges статусов;
- UX install guidance.

## 7.3. Auth and Access

### Для клиента

- invite;
- activate;
- login;
- password/session;
- optional quick re-entry via magic link later.

### Для менеджера

- existing internal auth;
- direct entry into communicator workspace;
- route-based access according to roles.

## 8. План реализации по фазам

## Фаза 0. Foundation

- утвердить `PWA communicator` как целевой канонический web fallback;
- утвердить нейтральный route namespace;
- зафиксировать, что Telegram сохраняется как legacy/bridge channel.

## Фаза 1. Клиентский MVP

- активировать полноценный `web_chat` flow;
- довести `portal/front-office` до mobile-ready состояния;
- добавить PWA installability;
- добавить старт нового обращения;
- добавить polling.

Результат:

- клиент может общаться с компанией через иконку на экране телефона.

## Фаза 2. Менеджерский workspace

- отвязать workspace от Telegram naming;
- собрать `Клиенты / A-RAI` в одном интерфейсе;
- добавить быстрые переходы между:
  - списком хозяйств;
  - тредами;
  - активным диалогом;
  - AI.

Результат:

- менеджер работает из одного пространства.

## Фаза 3. Delivery and Notifications

- улучшить web-chat outbound;
- ввести email/web push strategy;
- использовать Telegram как временный bridge.

Результат:

- клиент не теряется без постоянного открытия Telegram.

## Фаза 4. Media and Polish

- фото;
- вложения;
- статусы;
- refined mobile UX;
- install onboarding.

Результат:

- web communicator становится реальной операционной заменой внешнему чату.

## 9. Критерии готовности MVP

MVP считается готовым, если:

- клиент может открыть ссылку, активироваться и войти;
- клиент может добавить интерфейс на главный экран смартфона;
- клиент может открыть чат через иконку;
- клиент может написать сообщение в `web_chat`;
- менеджер видит это сообщение в workspace;
- менеджер отвечает из workspace;
- клиент получает ответ в PWA;
- менеджер может переключиться между `Клиенты` и `A-RAI`;
- Telegram при этом продолжает работать как параллельный канал.

## 10. Критерии готовности Stage 2

- есть список диалогов;
- есть polling или `SSE`;
- есть фото upload;
- есть устойчивый mobile UX;
- есть install guidance;
- есть понятные статусы handoff/system events;
- manager workflow не требует возвращаться в Telegram для основной работы.

## 11. Риски

## 11.1. Продуктовый риск

Пользователи могут продолжать предпочитать Telegram по привычке.

Снижение риска:

- не убивать Telegram сразу;
- сделать PWA проще и удобнее;
- давать прямую ценность внутри PWA.

## 11.2. UX-риск

PWA может ощущаться как “просто сайт”.

Снижение риска:

- app-like shell;
- минимализм;
- качественный mobile UI;
- быстрый старт в активный чат.

## 11.3. Технический риск

Часть логики still named around Telegram.

Снижение риска:

- нейтральный namespace;
- постепенная де-телеграмизация UI и transport contracts.

## 11.4. Уведомления

Web Push ограничен платформами, особенно на iOS.

Снижение риска:

- email fallback;
- Telegram bridge на переходный период;
- акцент на “иконка + быстрый возврат в чат”.

## 12. Рекомендуемое решение

Рекомендую принять следующий target state:

- `PWA communicator` становится собственным устойчивым каналом клиента;
- `менеджерский workspace` становится единым местом переключения `Клиенты / A-RAI`;
- `Telegram` сохраняется как дополнительный канал и переходный bridge;
- весь основной сценарий постепенно смещается в `PWA`.

Это самый прагматичный путь:

- без зависимости от сторов;
- без полной зависимости от внешнего мессенджера;
- с быстрым time-to-value;
- с опорой на уже существующую архитектуру RAI_EP.

## 13. Связанные документы

- `docs/07_EXECUTION/TELEGRAM_REPLACEMENT_ANALYSIS_2026-03-15.md`
- `docs/07_EXECUTION/WEB_CHAT_FEASIBILITY_AND_IMPLEMENTATION_PLAN_2026-03-15.md`

## 14. Артефакты, на которые опирается план

- `apps/api/src/modules/front-office/front-office.controller.ts`
- `apps/api/src/modules/front-office/front-office-external.controller.ts`
- `apps/api/src/modules/front-office/front-office.service.ts`
- `apps/api/src/modules/front-office-draft/front-office-draft.service.ts`
- `apps/api/src/modules/front-office-draft/front-office-draft.types.ts`
- `apps/api/src/shared/front-office/front-office-threading.service.ts`
- `apps/api/src/shared/front-office/front-office-outbound.service.ts`
- `apps/api/src/shared/auth/front-office-auth.controller.ts`
- `apps/api/src/shared/auth/front-office-auth.service.ts`
- `apps/web/components/front-office/ExternalFrontOfficeThreadClient.tsx`
- `apps/web/components/telegram/TelegramWorkspaceClient.tsx`
- `apps/web/lib/api/front-office.ts`
- `apps/web/lib/api/front-office-server.ts`
- `apps/web/app/(app)/portal/front-office/page.tsx`
- `apps/web/app/(app)/portal/front-office/threads/[threadKey]/page.tsx`
- `apps/web/app/(auth)/portal/front-office/activate/page.tsx`
- `apps/web/app/(auth)/portal/front-office/login/page.tsx`
