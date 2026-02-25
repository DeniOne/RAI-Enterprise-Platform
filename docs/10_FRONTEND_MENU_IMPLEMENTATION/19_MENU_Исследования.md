# 19_MENU_Исследования.md

## 0. Статус производства кнопки/экрана
- **Stage:** DISCOVERY
- **Готовность:** 0%
- **Дата последнего обновления:** 2026-02-25
- **Следующий milestone:** Реализация базового роутинга и страницы-витрины (Блок прототипов)

## 1. Название кнопки/экрана и бизнес-роль
- **Название:** ИССЛЕДОВАНИЯ (Institutional Exploration Module / Лаба)
- **Расположение:** Главное меню сайдбара (рядом с блоком "ЗНАНИЯ")
- **Бизнес-роль:** R&D контур предприятия, изолированная песочница инноваций (Dual Innovation Architecture). Контур собирает сигналы рынка, ИИ и пользователей, перерабатывая их в системные изменения без засорения операционного бэклога.

## 2. Целевые маршруты (основной + подмаршруты)
- Основной маршрут: `/exploration` (ведет на дашборд-витрину "Блок прототипов")
- Подмаршрут 1: `/exploration/strategic` (Блок стратегических исследований / SEU)
- Подмаршрут 2: `/exploration/constraints` (Блок растворения ограничений / CDU)

## 3. Поведение при нажатии
При клике на "ИССЛЕДОВАНИЯ" пользователь попадает на главную дашборд-витрину (`/exploration`), где отображается "Блок прототипов" (витрина концептов и идей — Raw Stream).
Внутри раздела доступна навигация (табы или внутреннее меню):
- **Стратегические исследования (SEU)**: Трансформационные проекты, поиск новых рынков, регуляторные сдвиги. Доступ строго регламентирован (Board). Требует бюджетирования, расчёта ROI и формального согласования.
- **Растворение ограничений (CDU)**: Ликвидация системных аномалий, архитектурных багов и узких мест. SLA жесткий, бюджет утверждается проще, фокус на исполнение.

## 4. UI/UX-сценарий
- **loading:** Скелетон карточек гипотез/прототипов (согласно UI Design Canon: светлая тема, скругления `rounded-2xl`).
- **empty:** Иллюстрация "Нет активных гипотез" с кнопкой "Предложить идею" (Raw Stream вход).
- **error:** Стандартный ErrorBoundary компонент платформы "Ошибка загрузки данных модуля".
- **permission:** Проверка прав доступа. В "Витрину прототипов" имеют доступ все участники, в "Стратегические исследования" (SEU) - ограниченный доступ (governance role / Board).

## 5. Кликабельность блоков и действия, пути переходов
- **Подача сигнала (Raw Stream):** Кнопка "Создать запрос/идею" открывает Triage Input Form. Сигнал уходит в буфер `StrategicSignal` без немедленного создания кейса.
- **Витрина (Showcase):** Клик по карточке открывает базовый summary: описание, источник, рейтинг/голосование.
- **Deep Work Workspace (для SEU/CDU):** При переходе в сам кейс (доступно решателям) открывается полноценная среда:
  - *Hypothesis Tree* (Дерево гипотез)
  - *Decision Log* (Журнал принятых решений)
  - *AI Reasoning Trace* (Лог рассуждений ИИ по проблеме)
- **Triage Officer View:** Интерфейс перевода `StrategicSignal` в `ExplorationCase` через кластеризацию и оценку импакта.

## 6. Smart routing контракт
- `entity`: `exploration-case`
- Подсветка активной гипотезы при переходе по прямой ссылке, автоскролл к нужной карточке на витрине инноваций.

## 7. API-связки (какие endpoints предполагаются)
- `GET /api/exploration/showcase` — список активных прототипов и идей.
- `GET /api/exploration/strategic` — список крупных исследований (SEU).
- `GET /api/exploration/constraints` — список алертов и аналитики ограничений (CDU).
- `POST /api/exploration/signals` — подача новой идеи/боли (создает `StrategicSignal`).
- `POST /api/exploration/cases/from-signal/:signalId` — перевод сигнала в кейс (Triage -> ExplorationCase).

## 8. Критерий готовности MVP
- Добавлен пункт `ИССЛЕДОВАНИЯ` в главный сайдбар.
- Настроен роутинг `/exploration`, `/exploration/strategic`, `/exploration/constraints` в приложении.
- Реализованы страницы-обертки с заглушками (Mock data) строго в рамках UI Design Canon.

## 9. Production-ready checklist
- [ ] заменить демо-данные на реальные API-метрики
- [ ] унифицировать/почистить кодировку текстов (без кракозябр)
- [ ] добавить e2e-сценарий “клик -> переход -> открытие карточки прототипа”

## 10. Технический долг
- **Что не доделано:** Подключение к реальному API, ролевая модель доступа к SEU, логика бэкенда для Signal Triage Engine.
- **Почему не сделано сейчас:** Этап DISCOVERY, бэкенд для Лабы ("Growth Engine") еще не спроектирован в `schema.prisma`.
- **Приоритет:** High
- **Следующий конкретный шаг:** Интегрировать UI-каркас в код фронтенда, вывести в меню 3 вкладки.

## 11. Ссылки на TD-ID в `99_TECH_DEBT_CHECKLIST.md`
- `TD-EXP-UI-001` (Базовый каркас UI для Исследований)
- `TD-EXP-API-001` (Проектирование Prisma Schema для Exploration Case)

## 12. Архитектура данных и FSM (Institutional Grade)

### Ролевая модель
- **Initiator (Отправитель)**: Любой авторизованный пользователь системы или ИИ-агент. Генерирует `StrategicSignal`.
- **Triage Officer (Триаж-Инженер)**: Эксперт (человек), анализирующий буфер сигналов, склеивающий дубли и инициирующий `ExplorationCase`.
- **SEU Board (Управляющий Совет)**: Ограниченный доступ к `/exploration/strategic`. Утверждает бюджеты, таймбоксы и просчитывает ROI стратегических исследований. Выполняет `BOARD_REVIEW`.
- **Solver (Решатель)**: Внутренний эксперт или ИИ, назначенный на ликвидацию ограничения в CDU или исследование в SEU.

### 1. Signal Layer (Слой сбора)
Сущность: `StrategicSignal` (Буфер интеллектуального пульса)
- `id`: CUID
- `companyId`: String (Zero Trust Tenant Isolation)
- `initiatorId`: String? (ID сотрудника-автора идеи/сигнала. Обязателен для `INTERNAL`, для расчёта вознаграждений)
- `source`: ENUM (`MARKET`, `CLIENT`, `AI`, `INTERNAL`)
- `rawPayload`: JSON (описание боли, контекст)
- `confidenceScore`: Int (оценка достоверности или критичности сигнала)
- `duplicateOf`: String? (ссылка на родительский сигнал при кластеризации)
- `status`: ENUM (`RAW`, `TRIAGED`, `ARCHIVED`)
- `createdAt`: DateTime

### 2. Deep Work Layer (Слой исследований)
Сущность: `ExplorationCase` (Рабочая область проекта)
- `id`: CUID
- `companyId`: String (Zero Trust Tenant Isolation)
- `signalId`: String? (Связь с первичным сигналом)
- `initiatorId`: String? (Автор первоначальной идеи, перенесенный для выплаты бонусов по ROI)
- `explorationMode`: ENUM (`SEU`, `CDU`)
- `type`: ENUM (`PROBLEM`, `IDEA`, `RESEARCH`, `REGULATORY`, `OPPORTUNITY`)
- `status` (FSM State): `DRAFT` -> `IN_TRIAGE` -> `BOARD_REVIEW` -> `ACTIVE_EXPLORATION` -> `WAR_ROOM`* -> `RESOLVED` / `REJECTED` / `IMPLEMENTED` -> `POST_AUDIT`

> *`WAR_ROOM` — опциональный статус. При его присвоении автоматически открывается режим «Дискуссионная Комната»: назначается состав участников, распределяются роли, фиксируется дедлайн. Никто не «расходится» до финального решения.*

**Экономическая и ресурсная модель (triageConfig -> JSON):**
- `economicImpactEstimate`: Decimal (ожидаемый финансовый эффект)
- `riskScore`: Int (оценка рисков)
- `resourceCost`: Decimal (стоимость времени/ресурсов на исследование)
- `expectedROI`: Decimal (расчетный ROI)
- `ownerId`: String (ответственный)
- `timeboxDeadline`: DateTime (дедлайн исследования)

### Разграничение SEU и CDU
| Параметр | SEU (Strategic) | CDU (Constraint) |
| :--- | :--- | :--- |
| **Обязателен timebox** | Да | Да |
| **Обязателен budget / ROI** | Да | Нет (фокус на фикс) |
| **Меняет бизнес-модель** | Да | Нет |
| **SLA исполнения** | Гибкий (исследование) | Жесткий (устранение блокера) |
| **Governance** | `BOARD_REVIEW` обязателен | Упрощенный апрув |

### FSM Переходы (Governance-Hardened Lab FSM)
- `SUBMIT_SIGNAL`: `null` -> `StrategicSignal {status: RAW}`
- `TRIAGE`: `StrategicSignal` -> `ExplorationCase {status: DRAFT}`
  - *Правило:* Сигнал получает `status: TRIAGED` и фиксируется `clusterId`/`duplicateOf`.
  - *Правило дублей:* Если сигнал признан дублем, он остаётся `RAW`, но получает ссылку `duplicateOf` (на существующий сигнал или кейс).
- `PROPOSE`: `DRAFT` -> `IN_TRIAGE`
- `ESCALATE_TO_BOARD` (Обязательно для SEU): `IN_TRIAGE` -> `BOARD_REVIEW`
- `APPROVE` (Budget Lock & Governance Signature): `BOARD_REVIEW` / `IN_TRIAGE` -> `ACTIVE_EXPLORATION`
- `ESCALATE_TO_WAR_ROOM`: `ACTIVE_EXPLORATION` -> `WAR_ROOM` (открывает Дискуссионную Комнату, назначает участников)
- `RESOLVE_WAR_ROOM`: `WAR_ROOM` -> `ACTIVE_EXPLORATION` (возврат с решением)
- `REJECT`: `BOARD_REVIEW` / `IN_TRIAGE` -> `REJECTED` (с обязательной экономической мотивацией отказа)
- `FINALIZE`: `ACTIVE_EXPLORATION` -> `RESOLVED` / `IMPLEMENTED`
- `AUDIT`: `IMPLEMENTED` -> `POST_AUDIT` (автоматически через 30/60/90 дней, сравнение expectedROI vs actualROI)

### 3. War Room Layer (Дискуссионная Комната)
Сущность: `WarRoomSession` (Сессия закрытой рабочей группы)
- `id`: CUID
- `companyId`: String (Zero Trust Tenant Isolation)
- `explorationCaseId`: String (Кейс исследования)
- `facilitatorId`: String (Ответственный / ведущий сессии)
- `participants`: JSON ([список {userId, role: EXPERT | OBSERVER | DECISION_MAKER}])
- `deadline`: DateTime (Дедлайн до которого нужно принять решение)
- `status`: ENUM (`ACTIVE`, `RESOLVED_WITH_DECISION`, `TIMEOUT`)
- `resolutionLog`: JSON? (Итоговая сводка решения)

Сущность: `WarRoomDecisionEvent` (Иммутабельный лог для аудита)
- `id`: CUID
- `companyId`: String
- `warRoomSessionId`: String
- `participantId`: String
- `decisionData`: JSON (голос, позиция, аргумент)
- `signatureHash`: String (криптографическая подпись или хеш)
- `createdAt`: DateTime

**Правила War Room:**
1. Нельзя закрыть сессию без финального `resolutionLog` (который является сводной производной от событий `WarRoomDecisionEvent`)
2. Каждый `DECISION_MAKER` обязан зафиксировать свою позицию (создать `WarRoomDecisionEvent` — append-only)
3. При статусе `TIMEOUT` — эскалация на CEO автоматически

---

## 13. Архитектура расширений (полная)

### 13.1. Impact Tracker (Пост-внедренческий аудит) — P0 ✅
Встроен в FSM как статус `POST_AUDIT`.

Сущность: `ImpactAuditRecord`
- `id`: CUID
- `companyId`: String
- `explorationCaseId`: String
- `auditWindowDays`: Int (30 / 60 / 90)
- `expectedROI`: Decimal (из `triageConfig`)
- `actualROI`: Decimal (фактические данные)
- `actualRoiSource`: ENUM (`LEDGER`, `FINANCE_REPORT`, `MANUAL_CONFIRMED`)
- `evidenceRefs`: JSON (ссылки на транзакции/отчёты/артефакты для доказательной базы)
- `delta`: Decimal (отклонение)
- `verdict`: ENUM (`SUCCESS`, `PARTIAL`, `FAILED`)
- `auditedAt`: DateTime

**Правила:**
1. Автоматический переход `IMPLEMENTED` → `POST_AUDIT` через 30 дней
2. Если `actualROI < 50% * expectedROI` → автоалерт SEU Board + повторный анализ
3. Данные `ImpactAuditRecord` используются для расчёта вознаграждения (`RewardRecord`)

---

### 13.2. Reward Engine (Система вознаграждений) — P0
Сущность: `RewardRecord`
- `id`: CUID
- `companyId`: String
- `explorationCaseId`: String
- `initiatorId`: String (автор идеи из `StrategicSignal`)
- `impactAuditId`: String (ссылка на `ImpactAuditRecord`)
- `rewardType`: ENUM (`BONUS`, `EQUITY_SHARE`, `CAREER_UPGRADE`, `RECOGNITION`)
- `rewardAmount`: Decimal? (денежный эквивалент, если применимо)
- `formula`: String (формула расчёта, например: `actualROI * 0.05`)
- `status`: ENUM (`PENDING`, `APPROVED`, `PAID`)
- `approvedBy`: String? (ID утвердившего выплату)

**Правила:**
1. `RewardRecord` создаётся автоматически при `POST_AUDIT.verdict = SUCCESS | PARTIAL`
2. Формула расчёта: `rewardAmount = actualROI * rewardCoefficient` (коэффициент задаётся в настройках компании)
3. Публичный лидерборд инноваторов: UI-виджет с топ-N авторов реализованных идей

---

### 13.3. Timebox Enforcement (Дисциплина сроков) — P1
Дополнительные поля в `ExplorationCase`:
- `timeboxStatus`: ENUM (`ON_TRACK`, `WARNING`, `OVERDUE`, `ARCHIVED_TIMEOUT`)

**Правила:**
1. Автоматические напоминания участникам за 7 / 3 / 1 день до `timeboxDeadline`
2. При просрочке: `timeboxStatus` → `OVERDUE`, алерт `ownerId` и SEU Board
3. Если `OVERDUE > 14 дней` без продления → автоматический `ARCHIVED_TIMEOUT` с причиной "Timeout"
4. Lab Capacity Limit: максимум N активных кейсов одновременно (конфигурируется на уровне `companyId`). Новые кейсы ждут в очереди

Сущность: `LabCapacityConfig`
- `companyId`: String (@@unique)
- `maxActiveSEU`: Int (по умолчанию 5)
- `maxActiveCDU`: Int (по умолчанию 10)
- `overdueGraceDays`: Int (по умолчанию 14)

---

### 13.4. Cross-Module Integration (Связь с другими модулями) — P1
Сущность: `ExplorationIntegrationEvent`
- `id`: CUID
- `companyId`: String
- `explorationCaseId`: String
- `targetModule`: ENUM (`COMMERCE`, `STRATEGY`, `PRODUCTION`, `KNOWLEDGE`, `FINANCE`)
- `integrationAction`: String (описание: "Обновить скрипты продаж", "Создать Knowledge Article")
- `targetEntityId`: String? (ID сущности в целевом модуле)
- `status`: ENUM (`PENDING`, `SYNCED`, `FAILED`)

**Маршрутизация по модулям:**
| Источник | Целевой модуль | Действие |
| :--- | :--- | :--- |
| CDU (решённое возражение клиента) | `/consulting/crm` | Обновление скриптов продаж |
| SEU (реализованная стратегия) | `/strategy/portfolio` | Новая карточка в портфеле |
| SEU/CDU (произв. исследование) | `/production/quality` | Задача в производственный бэклог |
| Любой `IMPLEMENTED` кейс | `/knowledge/cases` | Автогенерация Knowledge Article |

---

### 13.5. Discussion Thread (Дискуссионные треды) — P1 ✅
Встроен как `WarRoomSession` (см. раздел 12.3).

Дополнительная сущность для обычных (не War Room) обсуждений:

`DiscussionMessage`
- `id`: CUID
- `companyId`: String
- `explorationCaseId`: String
- `warRoomSessionId`: String? (опционально, если внутри War Room)
- `authorId`: String
- `content`: Text
- `attachments`: JSON? (файлы, ссылки)
- `aiAssisted`: Boolean (сообщение сгенерировано / дополнено ИИ)
- `createdAt`: DateTime

**Правила:**
1. Каждый `ExplorationCase` имеет тред по умолчанию
2. В War Room тред закрыт для внешних участников
3. ИИ-ассистент может участвовать в треде (помечается `aiAssisted: true`)

---

### 13.6. CEO Pulse Dashboard (Интеллектуальный пульс компании) — P2
Виджет на главном дашборде `/exploration` (или на CEO-уровне `/strategy`).

Сущность: `PulseSnapshot` (генерируется еженедельно)
- `id`: CUID
- `companyId`: String
- `weekNumber`: Int
- `topSignalClusters`: JSON (топ-5 кластеров сигналов за неделю)
- `activeExplorations`: Int (количество активных кейсов)
- `resolvedThisWeek`: Int
- `overdueCount`: Int
- `totalImplementedROI`: Decimal (суммарный ROI от реализованных идей за квартал)
- `breakthroughCandidate`: String? (ID самого перспективного кейса)

**UI-компоненты:**
1. Кольцевая диаграмма: `RAW → TRIAGE → ACTIVE → IMPLEMENTED` (воронка)
2. Тепловая карта: откуда идут сигналы (Market / Client / AI / Internal)
3. Карточка "Breakthrough of the Week"
4. Лидерборд инноваторов (топ-3 по `RewardRecord`)

---

### 13.7. Knowledge Graph (Граф связей между кейсами) — P2
Дополнительные поля в `ExplorationCase`:
- `relatedCaseIds`: String[] (связи с другими кейсами)
- `parentCaseId`: String? (кейс-родитель, если порождён из другого исследования)

Сущность: `CaseRelation`
- `id`: CUID
- `companyId`: String
- `sourceCaseId`: String
- `targetCaseId`: String
- `relationType`: ENUM (`CAUSED_BY`, `SPAWNED`, `DUPLICATE`, `CONTRADICTS`, `DEPENDS_ON`)

**UI:** Визуализация графа (формат mind-map или force-directed graph) на странице `/exploration` — кликабельные узлы с переходом в кейс.

**Правила:**
1. При триаже `StrategicSignal` → AI предлагает потенциальные связи с существующими кейсами
2. При закрытии кейса: если из решения следуют новые вопросы → автоматическое создание дочерних `StrategicSignal`

---

### 13.8. AI Proactive Scanner (ИИ-Разведчик) — P3
Сущность: `AIScanConfig`
- `companyId`: String (@@unique)
- `internalScanEnabled`: Boolean (сканировать данные платформы)
- `externalScanEnabled`: Boolean (мониторить внешние источники)
- `scanFrequency`: ENUM (`DAILY`, `WEEKLY`, `MONTHLY`)
- `externalSources`: JSON? (список URL/API для мониторинга — sandboxed)

Сущность: `ExternalSourceAllowlist` (Управление доверенными источниками)
- `id`: CUID
- `companyId`: String (@@unique)
- `allowedDomains`: String[] (white-list)
- `approvedBy`: String (кто разрешил источник)

Сущность: `AIScanRunLog` (Аудит действий ИИ-разведчика)
- `id`: CUID
- `companyId`: String
- `sourceId`: String (какой источник сканировался)
- `timestamp`: DateTime
- `hashes`: String[] (хеши прочитанных документов)
- `countSignalsCreated`: Int

**Типы автоматического сканирования:**

| Тип | Источник | Генерирует |
| :--- | :--- | :--- |
| **Внутренний** | Данные платформы (урожай, финансы, отклонения) | `StrategicSignal {source: AI}` |
| **Внешний (sandboxed)** | Строго по `ExternalSourceAllowlist` | `StrategicSignal {source: MARKET}` |
| **Trend Detector** | Кластеризация 5+ сигналов за период | Алерт "Системный тренд обнаружен" |

**Правила безопасности:**
1. Внешний скан работает в sandbox (без доступа к чувствительным данным) и строго по `ExternalSourceAllowlist`
2. Каждый запуск внешнего сканирования логируется в `AIScanRunLog`
3. Каждый AI-сигнал имеет `confidenceScore` и логируемый `reasoning`
4. AI не создаёт `ExplorationCase` напрямую — только `StrategicSignal`, решение за человеком

---

## 14. Сводная таблица зрелости расширений
| # | Расширение | Приоритет | Статус |
|---|---|---|---|
| 1 | Impact Tracker (POST_AUDIT) | P0 | ✅ Архитектура описана |
| 2 | Reward Engine (вознаграждения) | P0 | ✅ Архитектура описана |
| 3 | Timebox Enforcement (OVERDUE) | P1 | ✅ Архитектура описана |
| 4 | Cross-Module Integration | P1 | ✅ Архитектура описана |
| 5 | Discussion Thread / War Room | P1 | ✅ Архитектура описана |
| 6 | CEO Pulse Dashboard | P2 | ✅ Архитектура описана |
| 7 | Knowledge Graph | P2 | ✅ Архитектура описана |
| 8 | AI Proactive Scanner | P3 | ✅ Архитектура описана |
