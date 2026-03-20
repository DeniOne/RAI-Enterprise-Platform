---
id: DOC-ARC-DECISIONS-ADR-013-EXTERNAL-FRONT-OFFICE-AC-1USV
layer: Architecture
type: ADR
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-12
---
# ADR 013: Внешний Front-Office доступ для представителей контрагентов

## Статус
**Предложено** | **Версия:** 0.1 | **Дата:** 2026-03-12

## Контекст

Платформе нужна поддерживаемая модель онбординга и доступа для внешних пользователей front-office, которые представляют контрагентов.

Бизнес-требование:

- приглашение стартует из карточки контрагента;
- действие приглашения доступно из строки `ЛОПР / ключевое лицо`;
- приглашающий вводит `Telegram ID`;
- система отправляет ссылку на бота и ссылку на регистрацию;
- контакт фиксируется в системе как Telegram-контакт этого `ЛОПР`;
- основной логин идет через `Telegram`;
- дополнительный логин идет через `login + password`.

Текущие ограничения системы:

1. У `User` нет отдельной роли для внешнего front-office пользователя.
2. `Invitation` уже привязан к `Account` и подходит как база для invite-only onboarding, но отдельного внешнего portal flow пока нет.
3. Текущая видимость во front-office уже фактически завязана на `Account` через `user.accountId` и `thread.farmAccountId`.
4. Контакты контрагентов в UI сейчас живут внутри `Party.registrationData.contacts`, а это плохой источник истины для identity binding.
5. Текущие auth token несут только `companyId`, `role` и `accountId`.
6. Текущий password login не production-grade и не должен переиспользоваться для внешнего доступа без отдельного hardening.

Система должна жестко разделять:

- внутренних пользователей тенанта;
- внешних представителей контрагентов;
- role-based permissions;
- scope binding к конкретному контрагенту.

## Решение

### 1. Ввести отдельную security-role для внешнего доступа

Добавить новую security-role:

- `FRONT_OFFICE_USER`

Эта роль обязательна. Внешних пользователей нельзя моделировать как обычный `USER`.

Причины:

- внешние пользователи находятся в другом trust boundary;
- если считать их просто generic authenticated users, они попадут в слишком широкий API surface за обычным `JwtAuthGuard`;
- для них авторизация должна быть `deny-by-default`.

### 2. В v1 использовать `Account` как канонический authorization scope

Для v1 внешний front-office доступ привязывается к `Account`, а не напрямую к `Party`.

Это означает:

- точка входа приглашения может начинаться из карточки контрагента `Party`;
- фактический scope доступа задается связанным operational `Account`;
- все проверки доступа к сообщениям и тредам продолжают опираться на `accountId`;
- `Party` остается legal/commercial model, а не primary runtime auth scope.

Если у карточки контрагента нет связанного `Account`, приглашение должно блокироваться до создания такой связи.

### 3. Приглашение является единственным разрешенным способом регистрации

Открытая self-registration запрещена.

Разрешенный flow:

1. Внутренний оператор открывает карточку контрагента.
2. В строке `ЛОПР / ключевое лицо` оператор нажимает `Пригласить в систему`.
3. Оператор вводит:
   - `Telegram ID` — обязательно;
   - `login` — опционально на этапе приглашения, можно задать при активации;
   - `phone` / `email` — если есть.
4. Система создает приглашение и отправляет:
   - deep link в Telegram-бота;
   - опциональную web activation link.
5. Приглашенный пользователь сначала активирует доступ через Telegram.
6. После Telegram-верификации пользователь может задать дополнительный `login + password`.

### 4. Telegram является основным способом аутентификации

Primary auth для внешних front-office пользователей:

- Telegram bot / Telegram WebApp identity

Secondary auth допустим как fallback:

- `login + password`

Обязательные ограничения:

- Telegram identity является primary proof of possession;
- `login + password` включается только после принятия приглашения и Telegram-верификации;
- password auth до rollout должен использовать реальное password hashing и reset flows.

### 5. Строка контакта в UI является точкой входа, но не authority для identity

Приглашение стартует из строки контакта в карточке контрагента, но identity binding не должен жить только внутри `Party.registrationData.contacts`.

Решение:

- строка контакта в UI является источником operator intent;
- authoritative binding хранится в нормализованных таблицах;
- строка контакта отображает статус, но доступ выдается только на основании нормализованных invite/binding records.

### 6. Для внешних пользователей нужен отдельный portal/API surface

Внешние пользователи не должны использовать текущий внутренний front-office controller как есть.

Требуется явное разделение:

- internal front-office API для сотрудников и операторов;
- external front-office portal/API для представителей контрагентов.

Внешний surface должен давать только:

- список только своих тредов;
- сообщения только своих тредов;
- отправку сообщений и evidence;
- отметку сообщений как прочитанных;
- действия со своим профилем и сессией.

## Каноническая модель пользователей

### Внутренние пользователи

- `ADMIN`
- `CLIENT_ADMIN`
- `CEO`
- `CFO`
- `MANAGER`
- `AGRONOMIST`
- `FIELD_WORKER`
- `USER`

### Внешние пользователи

- `FRONT_OFFICE_USER`

`FRONT_OFFICE_USER` всегда действует в рамках привязанного scope контрагента.

## Изменения модели данных

### 1. Расширить `UserRole`

Добавить:

- `FRONT_OFFICE_USER`

### 2. Добавить стабильное поле логина

Нужно добавить явную поддержку username/login вместо перегрузки email:

- `User.username String? @unique`

Обоснование:

- у многих внешних пользователей может не быть верифицированного email;
- fallback auth запрошен именно как `login + password`, а не `email + password`;
- синтетический email не должен становиться долгосрочным identity contract.

### 3. Добавить нормализованное хранение приглашений

Ввести `CounterpartyPortalInvite`:

- `id`
- `companyId`
- `partyId`
- `accountId`
- `partyContactId`
- `telegramId`
- `proposedLogin`
- `phone`
- `email`
- `status` = `PENDING | SENT | ACCEPTED | EXPIRED | REVOKED`
- `invitedBy`
- `sentAt`
- `acceptedAt`
- `expiresAt`
- `contactSnapshotJson`
- `metadataJson`

Эта запись является audit trail для онбординга.

### 4. Добавить нормализованную привязку пользователя

Ввести `CounterpartyUserBinding`:

- `id`
- `companyId`
- `userId`
- `partyId`
- `accountId`
- `partyContactId`
- `telegramId`
- `status` = `ACTIVE | SUSPENDED | REVOKED`
- `isPrimary`
- `invitedBy`
- `invitedAt`
- `activatedAt`
- `revokedAt`
- `sourceInviteId`

Эта запись является runtime authorization binding.

### 5. Дать контактам контрагента стабильный идентификатор

Текущие строки контактов контрагентов не дают устойчивого identity contract, пригодного для auth binding.

Для v1 система обязана добавить стабильный идентификатор контактной строки:

- `partyContactId`

Минимально допустимые варианты:

1. Добавить стабильный `id` каждому элементу внутри `Party.registrationData.contacts`.
2. Позже перенести контакты в отдельную таблицу `PartyContact`.

Без стабильного `partyContactId` приглашение из конкретной строки `ЛОПР` будет неоднозначным и небезопасным.

### 6. Явно маркировать ЛОПР

Системе нужен явный маркер decision-maker на строке контакта.

Обязательное поле:

- `isDecisionMaker: boolean`

Кнопка приглашения показывается для:

- текущего `ЛОПР`;
- нового контакта, у которого `isDecisionMaker = true`.

## Authentication Flows

### Flow A: Приглашение из карточки контрагента

1. Внутренний пользователь открывает `[карточку контрагента]`.
2. Во вкладке `Ключевые лица / ЛОПР` пользователь нажимает `Пригласить в систему`.
3. Система открывает invite drawer.
4. Оператор вводит `Telegram ID`.
5. Система создает `CounterpartyPortalInvite`.
6. Бот отправляет deep link:
   - `https://t.me/<bot>?start=fo_invite_<code>`
7. UI сохраняет invite status и показывает его в той же строке контакта.

### Flow B: Первая активация через Telegram

1. Приглашенный пользователь открывает deep link бота.
2. Бот проверяет:
   - приглашение существует;
   - приглашение не истекло и не отозвано;
   - `Telegram ID` совпадает с приглашением;
   - не существует конфликтующей активной Telegram-привязки.
3. Система создает или активирует `User` с:
   - `role = FRONT_OFFICE_USER`;
   - `accountId = привязанный account`.
4. Система создает `CounterpartyUserBinding`.
5. Приглашение переходит в состояние `ACCEPTED`.

### Flow C: Настройка secondary login/password

1. После Telegram-активации пользователь может задать:
   - `username`;
   - `password`.
2. Пароль хранится только как `passwordHash`.
3. Алгоритм хеширования должен быть `argon2id`.
4. Password reset разрешен только через:
   - повторную Telegram-верификацию;
   - внутренний admin reset flow.

## JWT Contract

Внешний JWT должен нести достаточно контекста для `deny-by-default` авторизации.

Обязательные claims:

- `sub`
- `companyId`
- `role`
- `accountId`
- `subjectClass = external`
- `bindingId`

Опциональные claims:

- `partyId`
- `telegramIdVerified = true`

## Правила авторизации

### Что может `FRONT_OFFICE_USER`

- читать только свои треды;
- читать сообщения только в своих тредах;
- отправлять входящие сообщения и evidence только в свои треды;
- читать состояние своего приглашения, профиля и сессии.

### Что не может `FRONT_OFFICE_USER`

- листать все tenant threads;
- получать доступ к queues;
- получать доступ к drafts;
- получать доступ к handoffs;
- получать доступ к assignments;
- получать доступ к manager bootstrap;
- получать доступ к CRM, consulting, finance, strategy, governance или глобальным tenant endpoints.

### Runtime access rule

Доступ разрешается только если:

- роль в JWT равна `FRONT_OFFICE_USER`;
- `subjectClass` в JWT равен `external`;
- существует активный `CounterpartyUserBinding`;
- `binding.accountId == thread.farmAccountId`.

Одной роли никогда недостаточно.

## UI Contract

### Карточка контрагента

В таблице `Ключевые лица / ЛОПР` у каждой подходящей строки должно быть одно из действий:

- `Пригласить в систему`
- `Переотправить приглашение`
- `Доступ активен`
- `Приостановить доступ`
- `Отозвать доступ`

Строка также должна показывать:

- статус приглашения;
- замаскированный `Telegram ID`;
- статус связанного portal user;
- время последнего приглашения.

### Создание нового контакта

Для нового `ЛОПР` UI может предлагать:

- `Сохранить`
- `Сохранить и пригласить`

Система обязана сначала сохранить контакт, а затем создавать приглашение.

## Инварианты безопасности

1. Внешняя self-signup запрещена.
2. Одна Telegram identity не может незаметно привязаться к нескольким активным пользователям.
3. Внешние пользователи не получают доступ вне своего scope контрагента.
4. Срок действия приглашения обязателен.
5. Повторное приглашение не должно обходить правила отзыва доступа.
6. Password login отключен, пока пользователь не завершил Telegram-верификацию.
7. External portal endpoints обязаны использовать отдельный guard/policy layer.
8. Для приглашения, активации, приостановки, отзыва и сброса пароля обязаны писаться audit events.

## Последствия

### Положительные

- внешний доступ получает четкую и аудируемую trust boundary;
- приглашение естественно встраивается в workflow карточки контрагента;
- Telegram-first onboarding соответствует operating model front-office коммуникации;
- авторизация остается согласованной с уже существующей `Account`-scoped логикой front-office.

### Отрицательные

- системе нужны новые schema и API surface;
- модели контактов контрагента нужен стабильный идентификатор;
- fallback через login/password требует реального credential hardening до релиза.

## Заметки по реализации

Рекомендуемый порядок:

1. Добавить `FRONT_OFFICE_USER` и `username`.
2. Добавить `partyContactId` и `isDecisionMaker` в контракт контакта контрагента.
3. Добавить `CounterpartyPortalInvite`.
4. Добавить `CounterpartyUserBinding`.
5. Реализовать `/auth/front-office/*`.
6. Реализовать внешний portal controller и отдельные guards.
7. Добавить invite actions в карточку контрагента.
8. Добавить audit events и authorization tests.

## Явные non-goals для v1

- multi-account внешние пользователи;
- один Telegram-аккаунт, управляющий несколькими активными external principal;
- прямой runtime authorization через `Party`;
- открытая регистрация;
- password-only onboarding без Telegram-верификации.
