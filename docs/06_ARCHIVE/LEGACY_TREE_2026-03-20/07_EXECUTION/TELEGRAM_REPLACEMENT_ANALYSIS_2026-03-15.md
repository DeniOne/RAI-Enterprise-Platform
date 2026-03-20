---
id: DOC-EXE-07-EXECUTION-TELEGRAM-REPLACEMENT-ANALYSIS-3N8K
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@codex]
last_updated: 2026-03-15
---
# Анализ замены Telegram в RAI_EP

## 1. Executive Summary

`Telegram` в текущей архитектуре RAI_EP нельзя считать надежным базовым каналом для работы фронт-офиса и бэкофиса в РФ. По состоянию на `15 марта 2026` риск уже операционный: частичное ограничение звонков подтверждалось `13 августа 2025`, а `10 февраля 2026` фиксировалось замедление работы Telegram.

Для RAI_EP замена должна учитывать не только переписку. В системе Telegram уже используется как:

- канал входящего фронт-офисного `ingress`;
- транспорт для `outbound`-ответов клиенту;
- канал оповещений назначенных менеджеров;
- точка входа в `Mini App / workspace`;
- механизм `login confirmation` и Telegram WebApp auth;
- канал доставки `invite` для внешнего front-office пользователя.

Главный вывод:

- `MAX` стоит запускать как кандидат на замену именно для `внешнего фронт-офисного канала` и bot/mini-app сценариев;
- для `внутренних рабочих коммуникаций` сотрудников сильнее выглядят `VK Teams` и `eXpress`;
- если нужен один более универсальный компромиссный вариант, ближе всего к задаче находится `Compass`;
- архитектурно системе нужен не “новый бот вместо Telegram”, а `channel abstraction`, чтобы Telegram больше не был зашит в модель идентичности и outbound-слой.

## 2. Что говорит документация и код RAI_EP

### 2.1. Бизнесовая логика платформы

По канонической документации RAI_EP состоит из двух основных контуров:

- `Back-Office`: CRM, финансы, HR, управление компанией;
- `Front-Office`: работа с хозяйствами, полями, задачами, отклонениями, консультациями и оперативными сигналами.

Во фронт-офисе коммуникация не является побочной функцией. Это часть производственного процесса: сигнал от хозяйства попадает в intake, классифицируется, связывается с хозяйством/полем/сезоном/задачей, затем либо:

- получает автоответ;
- требует уточнения;
- уходит в human handoff;
- фиксируется как observation/deviation/consultation/context update.

### 2.2. Реальная архитектура канала связи

По актуальному коду Telegram уже вынесен в отдельный `bot gateway`:

- `apps/telegram-bot` принимает входящие события, команды, фото, voice;
- `apps/api` содержит фронт-офисный `draft/thread/handoff` контур;
- `apps/web/app/telegram/workspace` и `TelegramWorkspaceClient` являются менеджерским рабочим местом в Mini App/web;
- `apps/api/src/shared/front-office/front-office-outbound.service.ts` отправляет ответы в тред обратно через бот-шлюз;
- `apps/api/src/shared/auth/telegram-auth.service.ts` реализует login approval и Telegram WebApp auth;
- `apps/api/src/shared/auth/front-office-auth.service.ts` умеет отправлять front-office invite через бот.

Это важный момент: Telegram в RAI_EP уже не system of record, но он является `transport + launcher + identity hook`.

## 3. Как у нас сейчас реализован Telegram-бот

### 3.1. Общая схема

Текущий Telegram-контур устроен так:

1. Пользователь пишет боту.
2. `apps/telegram-bot/src/telegram/telegram.update.ts` определяет профиль пользователя и туннель:
   - `front_office_rep`;
   - `back_office_operator`.
3. Для внешнего фронт-офиса бот принимает:
   - обычный текст;
   - фото;
   - voice;
   - callback-кнопки `confirm/fix/link`.
4. Бот вызывает `apps/api` через `ApiClientService` и создает front-office draft.
5. `apps/api/src/modules/front-office-draft/front-office-draft.service.ts`:
   - классифицирует сообщение;
   - формирует `threadKey`;
   - строит `draft`;
   - синхронизирует thread/message state;
   - применяет reply policy;
   - запускает auto-reply, clarification или handoff.
6. Ответ клиенту уходит обратно через `FrontOfficeOutboundService -> TelegramNotificationService -> bot internal endpoint`.
7. Менеджер бэкофиса не ведет свободный диалог прямо в чате: ему предлагается открыть `workspace`/Mini App.

### 3.2. Что конкретно завязано на Telegram

В коде зафиксированы Telegram-specific зависимости:

- поле `User.telegramId` и `Invitation.telegramId` в Prisma-схеме;
- поиск пользователя по `telegramId`;
- `TelegramAuthService` строит login flow вокруг Telegram push и `initData`;
- `FrontOfficeOutboundService` умеет доставлять ответ только если `thread.channel === "telegram"`;
- в thread binding используется `representativeTelegramId`;
- manager notify идет через `notifyFrontOfficeThread` в бот-гейтвей;
- внешний onboarding использует `https://t.me/<bot>?start=...`;
- web workspace привязан к пути `/telegram/workspace`.

### 3.3. Что это означает practically

Заменить Telegram “просто новым мессенджером” нельзя. Нужно закрыть весь текущий контракт:

- `inbound webhook/event delivery`;
- `chat user identity`;
- `file/photo/voice ingress`;
- `inline actions/buttons`;
- `deep link / mini app launch`;
- `workspace auth context`;
- `outbound reply to thread`;
- `manager notification`;
- `invite delivery`.

Иначе фронт-офисный workflow сломается на полпути.

## 4. Требования к замене именно для RAI_EP

### 4.1. Обязательные требования

Для вашей системы кандидат должен уметь:

- стабильную работу в РФ без высокого риска внезапной недоступности;
- `bot API` или аналог с webhook/event delivery;
- отправку обычных сообщений и rich messages с кнопками;
- передачу фото, файлов, voice или ссылок на медиа;
- `deep link` в веб-интерфейс или встроенное mini app/web app;
- идентификацию пользователя на стороне канала;
- массовые уведомления менеджерам;
- работу на mobile + desktop/web;
- приемлемый UX для внешних представителей хозяйств.

### 4.2. Желательные требования

- `on-prem` или self-hosted опция;
- `LDAP/AD/SSO/OIDC/SAML`;
- роли и админка enterprise-уровня;
- DLP/SIEM/антивирусные интеграции;
- встроенные мини-приложения;
- российская юрисдикция и локальная поддержка;
- понятный API для собственных ботов и интеграций.

## 5. Разбор альтернатив

## 5.1. MAX

### Где подходит лучше всего

`MAX` лучше всего выглядит как замена текущего `внешнего Telegram-канала`:

- чат-боты;
- callback-кнопки;
- `open_app`;
- `request_contact`;
- `request_geo_location`;
- mini apps через `MAX Bridge`;
- production webhook-only модель;
- российская платформа и фокус на коммуникации с клиентом.

### Почему он близок к текущему Telegram-сценарию

С точки зрения текущего RAI_EP-контракта это самый похожий вариант:

- есть bot API;
- есть webhook;
- есть inline keyboard;
- есть mini app, который открывается из бота;
- mini app умеет работать через bridge API;
- платформа для партнеров явно заточена на работу бизнеса с клиентами.

### Ограничения

По публичным материалам `MAX` пока не выглядит самым зрелым решением для `внутреннего корпоративного контура`:

- я не нашел в открытых источниках такого же явного enterprise-пакета по `on-prem + LDAP/AD + DLP + admin governance`, как у `VK Teams` или `eXpress`;
- mini app в MAX привязан к боту, то есть логика все равно строится вокруг bot-based entrypoint;
- платформа для партнеров доступна юрлицам и ИП-резидентам РФ;
- есть региональные ограничения для части пользовательских сценариев.

### Вывод по MAX

`MAX` стоит брать в пилот немедленно, но как:

- `основной кандидат на замену Telegram для внешнего front-office ingress`;
- `резервный/параллельный канал для клиентов и представителей хозяйств`.

Я не рекомендую делать `MAX` единственным корпоративным мессенджером для всего фронта и бэка без отдельной валидации enterprise-функций.

## 5.2. VK Teams

### Сильные стороны

`VK Teams` выглядит самым сильным кандидатом на `внутренний рабочий контур`:

- облако и `on-prem`;
- клиенты для Android, iOS, Windows, macOS, Linux и web;
- `LDAP`;
- `SSO` по `SAML`, `OIDC`, `Kerberos`;
- `Bot API`;
- mini apps;
- DLP/антивирусные интеграции;
- российский контур данных.

### Ограничения для вашего кейса

Для коммуникации именно с представителями хозяйств есть риск, что UX будет тяжелее, чем у public messenger:

- внешних пользователей сложнее затаскивать в корпоративную среду;
- сценарий “написал в привычный мессенджер с телефона” менее нативен, чем у Telegram/MAX;
- канал лучше подходит для сотрудников и назначенных менеджеров, чем для широкого внешнего фронт-офиса.

### Вывод по VK Teams

`VK Teams` я бы рассматривал как кандидат №1 для:

- коммуникации `бэкофис <-> бэкофис`;
- коммуникации `менеджеры <-> внутренние front-office операторы`;
- единого рабочего пространства сотрудников.

Но не как самый удобный первый выбор для `массового внешнего farm-side ingress`.

## 5.3. eXpress

### Сильные стороны

`eXpress` выглядит самым сильным вариантом по ИБ и enterprise governance:

- `on-prem`;
- роль “корпоративный суперапп”;
- `SmartApps`;
- `BotX API` для ботов и smart apps;
- интеграции с внешними системами;
- акцент на SSO и внешние директории;
- публично заявленная сертификация `ФСТЭК`.

### Ограничения

- решение тяжелее по внедрению и эксплуатации;
- вероятно дороже и организационно сложнее, чем `VK Teams` или `Compass`;
- для внешнего пользователя-хозяйства UX может быть избыточным.

### Вывод по eXpress

Если приоритет №1 это:

- безопасность;
- контроль данных;
- enterprise-grade администрирование;
- свой защищенный контур для крупной компании,

тогда `eXpress` выглядит лучше всех.

Но для задачи “удобно заменить Telegram как быстрый фронт-офисный коммуникатор” это, скорее всего, не самый легкий старт.

## 5.4. Compass

### Сильные стороны

`Compass` выглядит как наиболее практичный компромисс:

- есть облако и `on-prem`;
- self-hosted версия на своем сервере;
- web/mobile/desktop;
- Smart Apps и чат-боты;
- `OIDC`, `LDAP`, `SMS`, email и SSO в on-prem документации;
- гостевое подключение в ВКС без приложения;
- comparatively легкий запуск.

### Почему это интересно именно для RAI_EP

Если вам нужен один инструмент, который:

- можно быстро внедрить;
- можно держать на своем сервере;
- поддерживает встроенные приложения и ботов;
- не выглядит слишком “тяжелым enterprise комбайном”,

то `Compass` очень близок к practical fit.

### Ограничения

- по масштабу enterprise-governance он выглядит слабее `VK Teams` и `eXpress`;
- меньше публичных свидетельств о глубокой зрелости enterprise security-интеграций;
- для bot/mini-app сценариев экосистема выглядит слабее и моложе, чем у Telegram или MAX.

### Вывод по Compass

Если нужен `один более универсальный и реалистичный компромисс`, я бы ставил `Compass` очень высоко.

## 5.5. Mattermost / Element (Matrix)

### Где они хороши

- максимальная независимость от вендора;
- self-hosted;
- открытая архитектура;
- хороший вариант для своей инженерной платформы коммуникаций.

### Почему не лучший первый выбор для вас

- больше операционной нагрузки на команду;
- придется строить и поддерживать много интеграционного слоя самостоятельно;
- внешний пользователь-хозяйство в таком канале обычно чувствует себя хуже, чем в consumer-friendly messenger.

### Вывод

Имеет смысл только если вы сознательно выбираете путь “собственный коммуникационный стек”, а не “быстро и удобно заменить Telegram”.

## 6. Рекомендация для RAI_EP

## 6.1. Не делать одну замену на всё

Для RAI_EP лучше не искать один “новый Telegram”, а разделить задачу на два контура.

### Контур A. Внешний front-office ingress

Цель:

- хозяйство пишет;
- сигнал попадает в thread/draft/handoff;
- менеджер отвечает из workspace;
- канал удобен с телефона.

Рекомендация:

- `MAX` как основной кандидат;
- `web portal / web chat` как обязательный fallback;
- Telegram временно оставить параллельным каналом на время миграции.

### Контур B. Внутренние коммуникации сотрудников

Цель:

- менеджеры;
- агрономы;
- админы;
- операторский контур;
- обсуждение handoff, координация и рабочие чаты.

Рекомендация:

- `VK Teams` как базовый default;
- `eXpress`, если приоритетом является ИБ и on-prem;
- `Compass`, если нужен более быстрый и менее тяжелый запуск.

## 6.2. Лучшая практическая конфигурация

Если выбирать прагматично, я рекомендую такой target state:

- `MAX` для внешнего канала хозяйство -> RAI_EP;
- `VK Teams` для внутренней коммуникации сотрудников;
- `portal/front-office` и web workspace оставить каноническим резервным каналом;
- Telegram перевести в статус временного legacy-канала до завершения миграции.

## 6.3. Если нужен один инструмент без двухсоставной схемы

Тогда самым реалистичным компромиссом выглядит `Compass`.

Причина:

- он ближе к “удобному мессенджеру”;
- имеет on-prem;
- имеет SSO/LDAP/OIDC;
- имеет Smart Apps и чат-боты;
- выглядит проще для запуска, чем eXpress.

Но с точки зрения `внешнего public-like ingress` я все равно считаю `MAX` более естественным кандидатом.

## 7. Что придется менять в коде

## 7.1. Самая большая архитектурная проблема

Сейчас Telegram зашит в доменную модель сильнее, чем хотелось бы:

- `User.telegramId`;
- `Invitation.telegramId`;
- `representativeTelegramId`;
- Telegram-specific auth service;
- outbound через `TelegramNotificationService`;
- пути вида `/telegram/workspace`.

Это значит, что миграция на новый канал без техдолга приведет к дублированию логики.

## 7.2. Что нужно сделать правильно

### 1. Вынести канал в абстракцию

Создать слой вида `CommunicatorGateway` с capability-методами:

- `sendMessage`;
- `sendRichMessage`;
- `sendThreadReply`;
- `notifyAssignedManagers`;
- `sendInvite`;
- `getUserProfile`;
- `resolveWebAppIdentity`;
- `buildWorkspaceLaunchPayload`;
- `getMediaUrl`.

### 2. Отвязать идентичность от Telegram

Нужна отдельная таблица наподобие:

- `user_messenger_binding`
  - `userId`
  - `channel`
  - `externalUserId`
  - `externalChatId`
  - `isPrimary`
  - `status`
  - `metadataJson`

Иначе каждый новый канал будет ломать `User` и `Invitation`.

### 3. Обобщить FrontOfficeChannel

Сейчас тип ограничен:

- `telegram`
- `web_chat`
- `internal`

Его нужно расширить хотя бы до:

- `telegram`
- `max`
- `vk_teams`
- `compass`
- `web_chat`
- `internal`

### 4. Обобщить thread binding

Нужно убрать `representativeTelegramId` в сторону более общего поля:

- `representativeChannelUserId`
- или отдельной связанной сущности channel binding.

### 5. Вынести workspace из telegram namespace

Текущий `/telegram/workspace` лучше переименовать в нейтральный маршрут, например:

- `/communicator/workspace`
- или `/front-office/workspace`.

Тогда запускать его сможет не только Telegram/MAX Mini App, но и обычный web launcher.

## 8. Как переносится текущий Telegram-ботовый сценарий на MAX

С точки зрения архитектуры RAI_EP перенос на `MAX` возможен без слома концепции:

- отдельный gateway-сервис остается;
- webhook-модель остается;
- callback-кнопки остаются;
- launch mini app остается;
- запрос контакта/геопозиции остается;
- bot-first сценарий остается;
- web app может работать через bridge.

То есть `MAX` позволяет перенести текущий паттерн почти 1:1 лучше, чем VK Teams или eXpress.

Но:

- это не снимает необходимости отвязать доменную модель от `telegramId`;
- это не доказывает автоматически, что MAX заменит внутренний корпоративный мессенджер;
- это не отменяет необходимость web fallback, если любой внешний канал даст сбой.

## 9. Практический план

## Этап 0. Немедленно

- Зафиксировать `web front-office portal` как обязательный резервный канал.
- Прекратить проектировать новые фичи с жесткой зависимостью от `telegramId`.
- Подготовить архитектурный ADR на `channel abstraction`.

## Этап 1. Пилот 2-4 недели

- Поднять `MAX` pilot для внешнего front-office ingress.
- Параллельно поднять `VK Teams` или `Compass` для внутренней операторской коммуникации.
- Сравнить:
  - скорость онбординга;
  - стабильность доставки;
  - удобство менеджера;
  - качество mobile UX;
  - возможность открыть workspace;
  - удобство уведомлений и handoff.

## Этап 2. Техдолг 2-6 недель

- Вынести `CommunicatorGateway`.
- Ввести `messenger bindings`.
- Обобщить `thread channel`.
- Обобщить invite flow.
- Переименовать `/telegram/workspace` в нейтральный маршрут.

## Этап 3. Cutover

- Сначала перевести внешние новые подключения на `MAX`.
- Telegram оставить read-only / legacy fallback.
- После стабилизации перевести manager notifications на новый gateway.
- Потом удалить Telegram-specific ветки из auth и outbound.

## 10. Итоговое решение

Если отвечать коротко на вопрос “чем можно заменить Telegram в качестве удобного коммуникатора для RAI_EP”, то мой ответ такой:

- для `внешнего фронт-офисного канала` лучший кандидат сейчас `MAX`;
- для `внутренней рабочей коммуникации сотрудников` лучший кандидат `VK Teams`;
- если нужен один более универсальный компромиссный продукт, смотреть в первую очередь `Compass`;
- если приоритет — защищенный enterprise on-prem контур, смотреть `eXpress`.

Самое важное техническое действие не выбор продукта, а `де-телеграмизация архитектуры`: пока Telegram зашит в identity и outbound, любая замена останется хрупкой.

## 11. Изученные артефакты репозитория

### Канонические документы

- `docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM.md`
- `docs/01_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`
- `docs/1️⃣ Архитектурный профиль системы.md`
- `docs/03_PRODUCT/OFS_LEVEL_D_FEATURES.md`
- `docs/07_EXECUTION/AGRO_TELEGRAM_INTAKE_CHECKLIST.md`

### Ключевые файлы кода

- `apps/telegram-bot/src/telegram/telegram.update.ts`
- `apps/telegram-bot/src/shared/bot-internal.controller.ts`
- `apps/telegram-bot/src/shared/api-client/api-client.service.ts`
- `apps/api/src/modules/front-office/front-office.service.ts`
- `apps/api/src/modules/front-office/front-office.controller.ts`
- `apps/api/src/modules/front-office/front-office-external.controller.ts`
- `apps/api/src/modules/front-office-draft/front-office-draft.service.ts`
- `apps/api/src/modules/front-office-draft/front-office-client-response.orchestrator.service.ts`
- `apps/api/src/modules/front-office-draft/front-office-reply-policy.service.ts`
- `apps/api/src/shared/front-office/front-office-threading.service.ts`
- `apps/api/src/shared/front-office/front-office-outbound.service.ts`
- `apps/api/src/shared/auth/telegram-auth.service.ts`
- `apps/api/src/shared/auth/telegram-auth-internal.controller.ts`
- `apps/api/src/shared/auth/front-office-auth.service.ts`
- `apps/web/components/telegram/TelegramWorkspaceClient.tsx`
- `apps/web/app/telegram/workspace/page.tsx`
- `packages/prisma-client/schema.prisma`

## 12. Внешние источники

- MAX для бизнеса: https://business.max.ru/
- MAX help: https://max.ru/help
- MAX developer docs: https://dev.max.ru/docs
- MAX Bot API: https://dev.max.ru/docs-api
- MAX mini apps: https://dev.max.ru/help/miniapps
- MAX events/webhook: https://dev.max.ru/help/events
- VK Teams product: https://biz.mail.ru/teams/
- VK Teams LDAP: https://biz.mail.ru/docs/on-premises/vk-teams/ldap-integration/
- VK Teams SSO: https://biz.mail.ru/docs/on-premises/vk-teams/sso-authorization/
- VK Teams mini apps: https://biz.mail.ru/docs/on-premises/application/mini-apps-technical-description/vk-teams-mini-apps-technical-description.pdf
- eXpress product: https://express.ms/product-features/
- eXpress company/security: https://express.ms/company/
- eXpress SmartApps: https://express.ms/en/smartapps/
- eXpress bots and Smart Apps: https://express.ms/faq/bots-and-smartapps/
- eXpress admin guide: https://express.ms/admin_guide_install.pdf
- Compass product: https://getcompass.ru/
- Compass on-prem: https://getcompass.ru/on-premise
- Compass on-prem docs: https://doc-onpremise.getcompass.ru/
- Compass auth/on-prem setup: https://doc-onpremise.getcompass.ru/quick-start.html
- Compass Smart Apps: https://doc-onpremise.getcompass.ru/smart-apps.html
- Mattermost on-prem: https://mattermost.com/enterprise/on-prem/
- Element/Matrix docs: https://docs.element.io/latest/element-support/understanding-your-element-accounts/
- РБК, ограничение звонков в Telegram/WhatsApp, 13.08.2025: https://www.rbc.ru/politics/13/08/2025/689c8c7c9a79479b1087586d
- Amnesty, замедление Telegram, 10.02.2026: https://www.amnesty.org/ru/latest/news/2026/02/%D0%B7%D0%B0%D0%BC%D0%B5%D0%B4%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5-%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D1%8B-%D0%BC%D0%B5%D1%81%D1%81%D0%B5%D0%BD%D0%B4%D0%B6%D0%B5%D1%80%D0%B0-telegram/
