---
id: DOC-EXE-07-EXECUTION-WEB-CHAT-FEASIBILITY-AND-IMPLEMENTATION-PLAN-2026-03-15
layer: Execution
type: Research
status: draft
version: 0.1.0
owners: [@codex]
last_updated: 2026-03-15
---
# Собственный Web-Chat в RAI_EP

## 1. Короткий ответ

Да, свой web-чат для RAI_EP не только возможен, он у вас уже частично существует.

По коду видно, что:

- в доменной модели уже есть канал `web_chat`;
- front-office intake принимает `web_chat` как штатный канал;
- есть внешний `portal/front-office` с login/activate;
- есть API для `threads`, `messages`, `reply`, `read`;
- есть клиентский компонент внешнего диалога.

Поэтому задача формулируется не как “написать чат с нуля”, а как:

- довести уже существующий web front-office контур до полноценного customer-facing чата;
- сделать его каноническим резервным или даже основным каналом вместо Telegram.

## 2. Что уже есть в системе

## 2.1. Backend уже готов к каналу web_chat

В типах и API `web_chat` уже предусмотрен как полноценный канал:

- `FrontOfficeChannel = "telegram" | "web_chat" | "internal"`;
- `POST /front-office/intake/message` принимает `channel: "telegram" | "web_chat" | "internal"`;
- классификация, draft, thread, handoff и reply policy работают поверх канала, а не только поверх Telegram.

Это означает, что ядро front-office коммуникации уже в значительной степени `channel-agnostic`.

## 2.2. Есть API для внешнего клиента

Для внешнего front-office пользователя уже существуют:

- `GET /portal/front-office/threads`;
- `GET /portal/front-office/threads/:threadKey`;
- `GET /portal/front-office/threads/:threadKey/messages`;
- `POST /portal/front-office/threads/:threadKey/reply`;
- `POST /portal/front-office/threads/:threadKey/read`.

То есть thread-centric web chat API уже есть.

## 2.3. Есть web auth/onboarding

В системе уже присутствует внешний auth contour:

- создание приглашения для front-office пользователя;
- preview invitation;
- activation;
- password login.

Также в web-приложении уже есть страницы:

- `/portal/front-office/activate`;
- `/portal/front-office/login`;
- `/portal/front-office`;
- `/portal/front-office/threads/[threadKey]`.

Значит базовый сценарий “менеджер пригласил представителя хозяйства -> тот открыл портал -> вошел -> пишет в чат” уже архитектурно поддержан.

## 2.4. Есть внешний thread client

Компонент `ExternalFrontOfficeThreadClient` уже умеет:

- показывать историю сообщений;
- отправлять reply;
- ставить read marker.

Это уже не прототип на бумаге, а реальный задел для web-chat UI.

## 3. Что это значит practically

Свой web-чат можно сделать быстрее, чем замену на новый внешний мессенджер, потому что:

- вам не нужен внешний bot API, чтобы стартовать;
- не нужно ждать одобрения/доступа от внешнего вендора;
- не нужно подстраиваться под ограничения платформы;
- все ключевые процессы остаются внутри вашей архитектуры.

### Главный плюс

`Web chat` убирает зависимость от блокировки канала связи.

Если Telegram или другой мессенджер деградирует, `portal/front-office` продолжает работать.

### Главный минус

Consumer UX у собственного web-чата обычно слабее, чем у мессенджера:

- нет привычного входящего чата в уже установленном приложении;
- сложнее вернуть пользователя без push-уведомлений;
- нужен login/session management;
- мобильный web UX нужно доводить отдельно.

## 4. Реалистичная оценка: что уже сделано, а чего не хватает

## 4.1. Уже сделано

- channel `web_chat` есть в доменной модели;
- intake/reply/thread APIs уже существуют;
- внешний auth flow уже существует;
- страницы `portal/front-office` уже есть;
- внешний thread UI уже существует;
- thread history/read markers уже реализованы.

## 4.2. Не хватает до полноценного чата

Чтобы это было не “портал с перепиской”, а полноценный рабочий web-chat, нужно добавить:

- старт нового inbound диалога с web-клиента через `intake/message`;
- realtime-обновления или хотя бы стабильный polling;
- мобильный UX уровня “удобно с телефона”;
- загрузку фото/голоса/файлов;
- web notifications;
- удобный список диалогов и возврат в активный thread;
- канонический route namespace, не завязанный на Telegram;
- отдельную delivery-логику для `web_chat`, а не только для `telegram`.

## 5. Архитектурный вывод

Сейчас у вас есть `front-office portal with messaging capabilities`.

Чтобы он стал `каноническим web chat`, нужно сделать две вещи:

### 1. Сделать web_chat равноправным ingress-каналом

Не только reply в существующий thread, но и:

- новый inbound message;
- новый диалог без Telegram;
- media-first intake;
- прикрепление к хозяйству/полю/сезону/задаче прямо из web UI.

### 2. Сделать web_chat равноправным outbound-каналом

Сейчас outbound-слой фактически ориентирован на Telegram:

- доставка ответа в thread происходит через `TelegramNotificationService`, если `thread.channel === "telegram"`.

Для web-chat надо добавить собственный delivery mode:

- сообщения сохраняются в thread;
- клиент видит их через polling/SSE/WebSocket;
- при наличии web-push отправляется уведомление;
- при необходимости дублируется email/SMS.

## 6. Какой web-chat имеет смысл именно для RAI_EP

Для вашей системы web-chat должен быть не generic messenger, а `operational front-office communicator`.

Это означает, что в чате должны жить не только сообщения, но и контекст:

- хозяйство;
- поле;
- сезон;
- задача;
- статус handoff;
- кто сейчас владелец кейса;
- какие уточнения нужны;
- какие сигналы уже committed.

Именно это уже заложено в вашем `draft/thread/handoff` backend, поэтому web-chat здесь архитектурно естественнее, чем интеграция “чужого” мессенджера.

## 7. Предлагаемый продуктовый scope

## 7.1. MVP

Минимально полезный web-chat для запуска:

- список тредов внешнего пользователя;
- страница конкретного диалога;
- отправка текста;
- polling новых сообщений раз в `5-10` секунд;
- отметка прочтения;
- открытие по invite link;
- mobile-friendly UI;
- привязка ответа к существующему thread;
- новый стартовый экран “Написать в поддержку/консультанту”.

### Что это уже даст

- fallback при проблемах Telegram;
- рабочий канал для front-office без стороннего мессенджера;
- базу для последующего white-label customer portal.

## 7.2. Stage 2

- фото upload;
- voice upload;
- drag-and-drop файлов;
- быстрый выбор поля/сезона/задачи;
- системные карточки handoff/status;
- фильтры тредов;
- unread badges;
- email notifications.

## 7.3. Stage 3

- SSE или WebSocket вместо polling;
- Web Push;
- PWA installability;
- offline/reconnect behavior;
- вложения с preview;
- co-browsing с внутренним workspace;
- единый route namespace `/communicator`.

## 8. Что менять в коде

## 8.1. Нужна точка создания inbound web message

Сейчас для внешнего портала уже есть reply в thread. Но для полноценного чата нужен ещё сценарий:

- пользователь открывает портал;
- создает новый диалог или новое сообщение в активный диалог;
- backend принимает это как `channel = "web_chat"`, `direction = "inbound"`;
- дальше запускается обычный `draft/thread/handoff` flow.

То есть web UI должен использовать `intake/message`, а не только `reply`.

## 8.2. Нужен web delivery path

Текущий outbound-слой завязан на транспорт Telegram.

Для `web_chat` нужно:

- при `thread.channel === "web_chat"` не пытаться отправлять в Telegram;
- просто сохранять outbound в thread store;
- отдавать сообщение клиенту через poll/SSE/WebSocket;
- позже добавить web push/email fallback.

## 8.3. Нужен realtime strategy

Сейчас явного realtime chat transport в коде не видно.

Самый прагматичный MVP:

- polling `GET /portal/front-office/threads/:threadKey/messages` каждые `5-10` секунд.

Потом:

- `SSE` как следующий шаг;
- `WebSocket` только если действительно понадобится двусторонний live transport.

Для вашей задачи `SSE` скорее предпочтительнее:

- проще;
- дешевле в сопровождении;
- хорошо подходит для thread timeline.

## 8.4. Нужен media ingress

Для достижения паритета с Telegram нужны:

- image upload;
- voice/file upload;
- безопасное хранение media;
- передача ссылок в `photoUrl`, `voiceUrl` или generic attachment model.

Если хотите быстрый старт, можно:

- сначала сделать только текст;
- затем фото;
- voice оставить третьим этапом.

## 9. Как это лучше встроить в текущую архитектуру

## 9.1. Не делать отдельный второй backend

Не нужен новый “chat service с нуля”.

Правильнее:

- оставить текущий `front-office-draft` контур каноническим;
- использовать существующие `thread/message/handoff` сущности;
- поверх него добавить полноценный web chat client.

Иначе вы получите два разных коммуникационных стека и несходимость бизнес-логики.

## 9.2. Переименовать Telegram-specific UI namespace

Сейчас менеджерский workspace живет в `/telegram/workspace`.

Для долгосрочной чистоты лучше перейти к нейтральному namespace:

- `/communicator/workspace`;
- `/communicator/front-office`;
- или `/front-office/workspace`.

Тогда один и тот же UI сможет открываться:

- из Telegram;
- из MAX;
- из web portal;
- из внутреннего рабочего места менеджера.

## 9.3. Делать web-chat как канонический fallback

Правильная иерархия для RAI_EP:

- `web chat` как канонический, всегда доступный канал;
- Telegram/MAX как дополнительные ingress-каналы;
- внутренняя коммуникация сотрудников отдельно.

Это самый устойчивый вариант с точки зрения блокировок и vendor risk.

## 10. Рекомендуемый сценарий внедрения

## Этап 1. Harden Existing External Portal

- Довести `portal/front-office` до качества рабочего чата.
- Добавить стабильный mobile UI.
- Добавить polling новых сообщений.
- Проверить весь путь invite -> activate -> login -> thread -> reply.

## Этап 2. Add New Inbound Web Message

- Добавить UI для создания нового обращения из web.
- Подключить `POST /front-office/intake/message` c `channel = "web_chat"`.
- Формировать `threadKey` и draft по тем же правилам, что и для Telegram.

## Этап 3. Add Web Delivery

- Научить outbound-слой корректно обрабатывать `web_chat`.
- Не пытаться отправлять transport-level push в Telegram для web thread.
- Хранить и выдавать outbound только через thread store/API.

## Этап 4. Add Realtime and Notifications

- сначала polling;
- потом `SSE`;
- затем web push/email уведомления.

## Этап 5. Add Media

- image upload;
- attachments;
- voice как отдельный этап.

## 11. Что я рекомендую

Если вопрос стоит как “можем ли мы сделать свой чат вместо зависимости от мессенджеров”, мой ответ:

- да, и это одно из самых рациональных направлений для RAI_EP;
- более того, у вас уже есть примерно `50-70%` архитектурной базы;
- web-chat должен стать `каноническим fallback`, даже если вы параллельно пойдете в `MAX`.

Наиболее прагматичная стратегия:

- не противопоставлять `web chat` и `MAX`;
- сделать `web chat` как гарантированный собственный канал;
- использовать `MAX` как внешний удобный ingress для пользователей, которым нужен привычный messenger UX.

## 12. Итог

Свой web-chat в RAI_EP:

- возможен;
- уже частично реализован;
- логичен архитектурно;
- снижает зависимость от Telegram и любых внешних мессенджеров;
- может быть доведен до рабочего MVP сравнительно быстро.

Правильная постановка задачи:

- не “строим чат с нуля”;
- а “доводим уже существующий front-office portal до полноценного web communicator”.

## 13. Изученные артефакты

### Backend

- `apps/api/src/modules/front-office/front-office.controller.ts`
- `apps/api/src/modules/front-office/front-office-external.controller.ts`
- `apps/api/src/modules/front-office/front-office.service.ts`
- `apps/api/src/modules/front-office-draft/front-office-draft.service.ts`
- `apps/api/src/modules/front-office-draft/front-office-draft.types.ts`
- `apps/api/src/shared/front-office/front-office-threading.service.ts`
- `apps/api/src/shared/front-office/front-office-outbound.service.ts`
- `apps/api/src/shared/auth/front-office-auth.controller.ts`
- `apps/api/src/shared/auth/front-office-auth.service.ts`

### Web

- `apps/web/components/front-office/ExternalFrontOfficeThreadClient.tsx`
- `apps/web/lib/api/front-office.ts`
- `apps/web/lib/api/front-office-server.ts`
- `apps/web/app/(app)/portal/front-office/page.tsx`
- `apps/web/app/(app)/portal/front-office/threads/[threadKey]/page.tsx`
- `apps/web/app/(auth)/portal/front-office/activate/page.tsx`
- `apps/web/app/(auth)/portal/front-office/login/page.tsx`
