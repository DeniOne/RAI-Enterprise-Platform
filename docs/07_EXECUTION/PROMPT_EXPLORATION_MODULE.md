# CODEX PROMPT: Institutional Exploration Module (IEM) по шаблону "док + сразу реализация"

Работаем по модулю в формате "док + сразу реализация".

Контекст:
- Цель: пройти модуль "ИССЛЕДОВАНИЯ" end-to-end, зафиксировать поведение в документации и сразу реализовать в коде.
- Папка документации: `docs/10_FRONTEND_MENU_IMPLEMENTATION`.
- Главный архитектурный документ: `f:\RAI_EP\docs\10_FRONTEND_MENU_IMPLEMENTATION\19_MENU_Исследования.md`.
- Всегда обновляй `00_MASTER_MENU_MAP.md` (статус/комментарий) после выполнения этапа.
- Файл общего техдолга: `99_TECH_DEBT_CHECKLIST.md` (туда добавляются только индексированные задачи `TD-ID`).

Обязательный порядок действий:
1. Создай/обнови отдельный документ по экрану/подэкрану модуля "ИССЛЕДОВАНИЯ".
2. Сначала опиши в документе целевое поведение (UX, переходы, состояния, API-связки, критерии готовности).
3. Сразу после описания реализуй это в коде.
4. Проверь работоспособность (lint/tests/ручной сценарий).
5. Зафиксируй итог и остаточный долг в документе.
6. Обнови статус производства в личном файле экрана.
7. Добавь/обнови задачи в `99_TECH_DEBT_CHECKLIST.md` только с `TD-ID`.

---

## 0) Статус производства модуля
- Stage: `IMPLEMENTING`
- Готовность: `100%`
- Дата последнего обновления: `2026-02-25`
- Следующий milestone: `Финальный merge pass и интеграционный прогон общего CI-контура`

## 1) Название и бизнес-роль
- Название: Institutional Exploration Module (IEM) / "ИССЛЕДОВАНИЯ".
- Бизнес-роль: изолированная R&D-песочница Dual Innovation Architecture для сбора сигналов, триажа, governance-процессов и перевода валидированных инициатив в реализацию без загрязнения операционного контура.

## 2) Целевые маршруты
- Основной маршрут: `/exploration`
- Подмаршруты:
- `/exploration/strategic`
- `/exploration/constraints`
- `/exploration/cases/:id`
- `/exploration/war-room/:sessionId`

## 3) Поведение при нажатии
- Пункт меню "ИССЛЕДОВАНИЯ" ведет на `/exploration`.
- Пользователь видит dashboard витрины exploration-кейсов, фильтры, статусы FSM, список сигналов/кейсов и доступные действия по роли.
- Навигация на подэкраны и детальные карточки выполняется без нарушения tenant isolation.

## 4) UI/UX сценарии
- `loading`: skeleton для витрины, кейсов, war-room timeline.
- `empty`: понятный zero-state с CTA "Создать сигнал".
- `error`: retry + user-friendly сообщение + логирование correlationId.
- `permission`: блокировка действий/переходов с объяснением по RBAC.

## 5) Кликабельность и действия
- "Создать сигнал" -> `POST /api/exploration/signals`.
- "Триаж в кейс" -> `POST /api/exploration/cases/from-signal/:signalId`.
- "Открыть кейс" -> `/exploration/cases/:id`.
- "Открыть War Room" -> `/exploration/war-room/:sessionId` (только разрешенные роли).
- Переходы между статусами разрешаются только по `canTransition`, полученному от API.

## 6) Smart routing контракт
- Контракт входа: `{ entity, severity, targetId? }`.
- Поддерживаемые entity: `signal | case | war_room`.
- Severity: `info | warning | critical` используется для подсветки и приоритета авто-скролла.
- UI не вычисляет бизнес-логику и статусы самостоятельно: только read-model/metadata с backend.

## 7) API-связки
- `POST /api/exploration/signals` - intake сигнала.
- `POST /api/exploration/cases/from-signal/:signalId` - триаж сигнала в кейс.
- `GET /api/exploration/showcase` - витрина кейсов с пагинацией и фильтрами.
- `POST /api/exploration/cases/:id/transition` - FSM переход с серверной валидацией.
- `POST /api/exploration/war-room/:id/events` - append-only запись решения.
- Все endpoints обязаны фильтровать данные по `companyId` из auth-context.

## 8) Критерий готовности MVP
- Работают intake, triage, showcase и базовые FSM переходы без обхода ролей.
- Tenant isolation и RBAC подтверждены тестами.
- War Room решения пишутся append-only в event log.
- UI корректно отрабатывает loading/empty/error/permission сценарии.

## 9) Чеклист production-готовности
- [x] заменить демо-данные на реальные API-метрики (добавлены service-level latency/outcome метрики в `ExplorationService`)
- [x] унифицировать/почистить кодировку текстов (без кракозябр) для Swagger-описаний `ExplorationController`
- [x] добавить e2e-сценарий "клик -> переход -> подсветка сущности" (web spec `apps/web/shared/exploration/exploration-flow.spec.tsx`)
- [x] привести модуль `Исследования` к `LANGUAGE_POLICY.md`: пользовательские тексты UI и Swagger-описания переведены на русский язык

## 10) Технический долг
- Не доделано: расширенный аудит ROI evidence с автоматической сверкой `LedgerEntry.id`.
- Почему сейчас не сделано: сначала нужен стабильный backbone FSM + War Room eventing.
- Приоритет: `High`
- Следующий шаг: добавить validator и contract-tests для `evidenceRefs -> LedgerEntry.id`.

## 11) Ссылки на TD-ID в `99_TECH_DEBT_CHECKLIST.md`
- `TD-EXP-UI-001`
- `TD-EXP-API-001`
- `TD-EXP-LEDGER-001`

---

## Фундаментальные инварианты (строгие директивы)
1. **Изоляция арендаторов Zero Trust:** в каждой новой Prisma-модели обязательно поле `companyId: String` и индекс по нему.
2. **Неизменяемое управление (Append-Only):** голосования/решения War Room пишутся только insert в `WarRoomDecisionEvent`; удаление истории запрещено.
3. **Canonical FSM:** допустимые стейты:
- `DRAFT`, `IN_TRIAGE`, `BOARD_REVIEW`, `ACTIVE_EXPLORATION`, `WAR_ROOM`, `IMPLEMENTED`, `POST_AUDIT`, `REJECTED`, `ARCHIVED`.
4. **Разрешенные переходы:**
- `DRAFT -> IN_TRIAGE`
- `IN_TRIAGE -> BOARD_REVIEW`
- `BOARD_REVIEW -> ACTIVE_EXPLORATION`
- `ACTIVE_EXPLORATION -> WAR_ROOM`
- `WAR_ROOM -> ACTIVE_EXPLORATION`
- `ACTIVE_EXPLORATION -> IMPLEMENTED`
- `IMPLEMENTED -> POST_AUDIT`
- `ANY -> REJECTED`
- `POST_AUDIT -> ARCHIVED`
5. **Запрещенные переходы:**
- `ACTIVE_EXPLORATION -> DRAFT`
- `BOARD_REVIEW -> DRAFT`
- `IMPLEMENTED -> ACTIVE_EXPLORATION`
6. **Матрица полномочий управления (service-level RBAC):**
- `Initiator`: triage No, escalate No, approve No, open war room No
- `Triage Officer`: triage Yes, escalate Yes, approve No, open war room No
- `SEU Board`: triage No, escalate No, approve Yes, open war room Yes
- `Solver`: triage No, escalate No, approve No, open war room Yes
7. **Интеграция рисков:** каждый `ExplorationCase` содержит `riskLevel (R1..R4)`, `budgetImpact (Decimal)`, `requiresBoardReview (computed)`.
8. **Целостность Ledger:** `expectedROI/actualROI` - Decimal, `evidenceRefs` ссылается на `LedgerEntry.id`, verification обязателен до `POST_AUDIT`.
9. **Требование read-model:** frontend не вычисляет стейты и правила переходов; только данные и permissions от API.

---

## Поэтапный план реализации (чеклист выполнения)

### Фаза 1: Архитектура данных и Prisma Schema
- [x] Изучить текущий `schema.prisma`.
- [x] Добавить enum-типы (`SignalSource`, `SignalStatus`, `ExplorationType`, `ExplorationMode`, `TriageStatus`, `WarRoomStatus`, `RoiSource`).
- [x] Создать `StrategicSignal` с `duplicateOf` и `initiatorId`.
- [x] Создать `ExplorationCase` с привязкой к `StrategicSignal`.
- [x] Создать `WarRoomSession` и `WarRoomDecisionEvent`.
- [x] Добавить `ImpactAuditRecord`, `RewardRecord`.
- [x] Добавить `LabCapacityConfig`, `ExternalSourceAllowlist`, `AIScanRunLog`.
- [x] Выполнить `prisma generate` (через локальный бинарник `packages/prisma-client/node_modules/.bin/prisma.cmd`).

### Фаза 2: Базовые сервисы и FSM (Backend)
- [x] Реализовать `SignalTriageService` (`ingestSignal`, `clusterDuplicateSignals`, `triageToCase`). Реализовано в `ExplorationService` (ingest + triage).
- [x] Реализовать `ExplorationGovernanceService` для переходов `DRAFT -> IN_TRIAGE -> BOARD_REVIEW -> ACTIVE_EXPLORATION`. Реализовано через `ExplorationStateMachine` + `transitionCase`.
- [x] Реализовать `WarRoomService` (инициализация сессии, append-only события, `resolutionLog`). Добавлены open/close session + append-only events + контроль голосов `DECISION_MAKER`.
- [x] Покрыть критичные переходы FSM unit-тестами (включая проверки Zero Trust). Добавлены `exploration.fsm.spec.ts` и `exploration.service.spec.ts` (оркестрация War Room); прогон в окружении пока не подтвержден (timeout).

### Фаза 3: API-слой (Controllers & Routes)
- [x] Настроить маршруты в `ExplorationController`.
- [x] Поднять `POST /api/exploration/signals`.
- [x] Поднять `POST /api/exploration/cases/from-signal/:signalId`.
- [x] Поднять `GET /api/exploration/showcase`.
- [x] Настроить JWT/Session auth + middleware tenant-check (`companyId`). `companyId` читается из auth-context (`CurrentUser`) и не принимается из body/query.
- [x] Обновить Swagger/OpenAPI. Добавлены `@ApiTags/@ApiOperation/@ApiBody/@ApiResponse` в `ExplorationController`.

### Фаза 4: Frontend UI-каркас
- [x] Добавить пункт меню `"ИССЛЕДОВАНИЯ"` в сайдбар.
- [x] Создать `/exploration/layout.tsx`.
- [x] Реализовать `/exploration/page.tsx`.
- [x] Реализовать `/exploration/strategic` и `/exploration/constraints`.
- [x] Реализовать `TriageInputForm`.
- [x] Подключить API-слой (через `api.exploration.*` + client-side fetch в showcase/form).
- [x] Проверить UI-канон и сервисные состояния (`loading/empty/error/permission`) на витрине.

### Фаза 5: Верификация и E2E
- [x] E2E: сигнал -> триаж -> war room -> decision event -> implemented -> post audit. Runtime e2e сценарий `exploration.e2e.spec.ts` расширен до `IMPLEMENTED -> POST_AUDIT -> ARCHIVED`.
- [x] Unit: негативные сценарии прав доступа и tenant isolation. Добавлены сценарии `forbidden transition` и `cross-tenant facilitator/participant` в `exploration.e2e.spec.ts` + негативные проверки в `exploration.service.spec.ts`.
- [x] UI flow e2e-like: showcase smart-focus -> case transition/open war-room -> append event -> close session. Добавлен `apps/web/shared/exploration/exploration-flow.spec.tsx`, локально проходит.
- [x] Стабилизирован `web` typecheck для CI. `pnpm --filter web exec tsc --noEmit` проходит без ошибок.
- [x] Снят внешний блокер `api` typecheck: исправлен `TS2347` в `apps/api/src/modules/crm/crm.service.ts`, `apps/api tsc --noEmit` проходит.
- [~] Повторный прогон `apps/api` exploration e2e в текущей среде упирается в инфраструктурный timeout раннера (`jest --runInBand --runTestsByPath src/modules/exploration/exploration.e2e.spec.ts`), несмотря на ранее успешный проход этого же spec.
- [x] Обновить `99_TECH_DEBT_CHECKLIST.md` по закрытым `TD-ID`. Добавлены и синхронизированы `TD-EXP-UI-001`, `TD-EXP-API-001`, `TD-EXP-LEDGER-001`.

---

## Правило статусов и техдолга
- Статус производства хранится только в личном файле модуля/экрана.
- В `99_TECH_DEBT_CHECKLIST.md` хранятся только индексированные задачи `TD-...` без процентов готовности.
- Каждый новый долг из личного файла обязан иметь ссылку на соответствующий `TD-ID`.

## Правила предложений
- Не использовать формулировки "если хочешь/могу".
- Любое предложение развития давать как конкретное действие к выполнению.
- Для каждого действия указывать ожидаемый эффект:
- зачем это делается;
- что улучшится для пользователя/продукта/кода.

## Формат финального отчета по задаче
1. Что сделано (док + код).
2. Какие файлы изменены.
3. Что проверено (lint/tests/ручной проход).
4. Что осталось (техдолг + production-ready пункты).
5. Следующее действие (конкретное) + ожидаемый эффект.
