# RAI AI System — Исследование архитектуры платформы

> **Версия:** 1.0 | **Дата:** 2026-03-04  
> **Автор:** AI Systems Architect  
> **Статус:** Фаза 1 — Исследовательский документ

---

## 1. Обзор архитектуры RAI_EP

### 1.1 Общая топология

RAI_EP — корпоративная агро-управленческая платформа, представляющая собой монорепозиторий (pnpm workspaces + Turborepo) со следующей структурой:

```
RAI_EP/
├── apps/
│   ├── api/           — NestJS бэкенд (GraphQL/Apollo, 35+ модулей)
│   ├── web/           — React фронтенд (AntDesign)
│   └── telegram-bot/  — Telegram Mini App для полевых работников
├── packages/
│   ├── prisma-client/  — Prisma ORM (5139 строк, 50+ моделей, pgvector)
│   ├── agro-orchestrator/ — Движок агрономических правил (RuleEngine)
│   ├── risk-engine/    — Мульти-коллекторный движок рисков (FSM)
│   ├── legal-engine/   — Юридическо-правовой движок
│   ├── rd-engine/      — Движок R&D
│   ├── regenerative-engine/ — Регенеративная оптимизация
│   └── vector-store/   — pgVector абстракция для эмбеддингов
├── contracts/          — JSON-схемы контрактов (ADAPT-стиль)
├── adapters/           — Адаптеры внешних систем (AI Advisory, Economy, Task, Registry)
├── inference/          — Python/FastAPI сервис для ML-инференса
├── ingestion/          — Node.js сервис для приёма внешних данных
└── infra/              — Инфраструктура (Docker, CI/CD)
```

### 1.2 Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Бэкенд | NestJS (Node.js), GraphQL (Apollo), REST |
| СУБД | PostgreSQL + pgvector |
| Кэш / Очереди | Redis, BullMQ |
| ORM | Prisma (5139 строк схемы) |
| События | EventEmitter (NestJS), Outbox-паттерн + ConsumerIdempotency |
| Объектное хранилище | MinIO (S3-совместимое) |
| ML-инференс | Python / FastAPI |
| Фронтенд | React, AntDesign |
| Мобильные | Telegram Mini Apps |
| CI/CD | GitHub Actions |

### 1.3 Два контура системы

Система чётко разделена на два операционных контура:

1. **Back-Office (Enterprise):** CRM & Scoring, HR & Talent, Finance & Economy, GR & Reporting, Legal & Compliance
2. **Front-Office (Field):** Agro Process Layer, Digital Agronomist, Operations (склад, техника), Satellites (NDVI/NDRE)

Контуры связаны финансовыми потоками: бюджет → план (Back → Front), факт → себестоимость (Front → Back).

---

## 2. Анализ доменных модулей

### 2.1 Карта модулей (35+ NestJS модулей)

**Ядро агрономии:**
- `tech-map` — Технологические карты (710 строк сервис, FSM статусов, DAG-валидация, 7 правил проверки, калькуляторы, adaptive-rules, change-orders, evidence, economics)
- `consulting` — Консалтинг & Оркестрация (budget-plan, deviation, kpi, scenario-simulation, yield, strategic-advisory)
- `season` — Управление сезонами
- `field-registry` — Реестр полей (GeoJSON-полигоны, soil-type)
- `crop-variety` — Каталог культур и сортов
- `rapeseed` — Специализированный модуль рапса
- `agro-events` — Агро-события (черновик → фиксация → коммит → эскалация)
- `agro-audit` — Агрономический аудит

**Бэк-офис:**
- `finance-economy` — Финансы & Экономика (EconomicEvent, LedgerEntry, CashAccount, Budget)
- `hr` — Кадры (PulseSurvey, OKR, KPI)
- `crm` — CRM & Скоринг клиентов
- `legal` — Юридический блок (LegalDocument, ComplianceCheck)
- `cmr` — Управленческие решения (CmrDecision, CmrRisk)
- `commerce` — Коммерция (контракты, обязательства, платежи, инвойсы, stock-moves)
- `risk` — Управление рисками (RiskSignal, RiskAssessment, RiskStateHistory)
- `strategic` — Стратегическое управление (StrategicGoal)
- `rd` — Научно-исследовательские программы
- `satellite` — Спутниковый мониторинг (NDVI/NDRE)
- `vision` — Computer Vision (VisionObservation)

**AI-специфичные:**
- `generative-engine` — Генеративный движок (Level B + Level C)
- `rai-chat` — AI-чат с SupervisorAgent
- `advisory` — Консультативный AI-модуль
- `knowledge` — База знаний
- `knowledge-graph` — Граф знаний (KnowledgeNode, KnowledgeEdge)
- `adaptive-learning` — Адаптивное обучение (ModelVersion, TrainingRun, DriftReport)
- `exploration` — Институциональная разведка (StrategicSignal, ExplorationCase, WarRoom)

**Инфраструктура:**
- `health` — Healthcheck
- `integrity` — Контроль целостности
- `task` — Управление задачами
- `identity-registry` — Реестр идентификаторов
- `client-registry` — Реестр клиентов
- `field-observation` — Полевые наблюдения
- `telegram` — Telegram-интеграция

### 2.2 Level-система (многослойная архитектура)

Система демонстрирует эволюционную многослойную архитектуру:

| Уровень | Назначение | Статус |
|---------|-----------|--------|
| **Level B** | Generative Engine: Domain, Deterministic, FSM, Record, Validation, Explainability | Реализован |
| **Level C** | Contradiction-Resilient Intelligence: DivergenceTracker, CounterfactualEngine, ConflictMatrix, SpearmanCorrelation | Реализован |
| **Level D** | Adaptive Self-Learning: ModelVersion, TrainingRun, DriftReport, LearningEvent | Реализован (модели) |
| **Level E** | Regenerative Optimization: SoilMetric, SustainabilityBaseline, BiodiversityMetric, GovernanceLock, OverrideRequest | Реализован (модели и пакет) |
| **Level F** | Institutional Oracle Standard: Certification, Crypto, Gateway, Snapshot, Worm (WORM-storage), QuorumProcess, GovernanceCommittee | Реализован (частично) |

---

## 3. Анализ бэкенд-сервисов

### 3.1 SupervisorAgent (текущий AI-уровень)

Центральный AI-компонент — `SupervisorAgent` (474 строки), реализующий:

```
Поток: Запрос → detectIntent → buildAutoToolCall → executeToolCalls → buildSuggestedActions → Ответ
```

**Зависимости:**
- `RaiToolsRegistry` — реестр инструментов (6 зарегистрированных тулов)
- `MemoryAdapter` — адаптер памяти (append/retrieve/getProfile/updateProfile)
- `ExternalSignalsService` — внешние сигналы
- `RaiChatWidgetBuilder` — построитель виджетов

**Текущие инструменты (RaiToolName):**
1. `echo_message` — Эхо-сообщение
2. `workspace_snapshot` — Снимок рабочего пространства
3. `compute_deviations` — Расчёт отклонений
4. `compute_plan_fact` — План-факт анализ
5. `emit_alerts` — Генерация алертов
6. `generate_tech_map_draft` — Создание черновика техкарты (STUB)

### 3.2 RaiToolsRegistry

Архитектура Tool Registry (338 строк):
- Типизированные `Payload` и `Result` для каждого инструмента
- Joi-валидация входных данных
- `ActorContext` с `companyId` и `traceId` (tenant isolation)
- Логирование каждого вызова инструмента в БД
- `RegisteredTool<TName>` — обобщённая регистрация с handler callback

### 3.3 GenerativeEngine

Сложный многослойный модуль с подуровнями:

**Level B провайдеры:**
- `EntropyController` — контроль энтропии
- `DraftFactory` — фабрика черновиков
- `MetadataBuilder` — построитель метаданных
- `ConstraintPropagator` — распространение ограничений
- `ImmutabilityGuard` — гарантия неизменяемости
- `SeedManager` — управление seed для детерминизма
- `CanonicalSorter` — каноническая сортировка
- `StableHasher` — стабильное хеширование
- `DeterministicGenerator` — детерминированная генерация
- `DraftStateManager` — FSM состояний черновика
- `GenerationRecordService` — запись поколений
- `IntegrityGateGenerative` — проверка целостности

**Level C провайдеры:**
- `DivergenceTrackerService` — отслеживание расхождений
- `CounterfactualEngine` — контрфактуальный анализ
- `ConflictMatrixService` — матрица конфликтов
- `SpearmanCorrelationService` — корреляция Спирмена
- `ConflictExplainabilityBuilder` — объяснимость конфликтов
- `RiskMetricCalculator` — расчёт метрик риска
- `OverrideRiskAnalyzer` — анализ рисков переопределения

**Подмодули:** ExplainabilityModule, YieldModule, ProbabilityModule

### 3.4 Memory-система

Текущая архитектура памяти (глобальный `MemoryModule`):

| Компонент | Назначение |
|-----------|-----------|
| `MemoryManager` | Координатор операций с памятью |
| `DefaultMemoryAdapter` | Реализация MemoryAdapter (Prisma + pgvector) |
| `EpisodicRetrievalService` | Семантический поиск по эпизодической памяти |
| `ShadowAdvisoryService` | Теневой консультант (фоновый анализ) |
| `ShadowAdvisoryMetricsService` | Метрики теневого консультанта |
| `ContextService` (Redis) | Рабочая память (кэш контекста) |

**Интерфейс MemoryAdapter:**
```typescript
interface MemoryAdapter {
  appendInteraction(ctx, interaction): Promise<void>;
  retrieve(ctx, embedding, options): Promise<EpisodicRetrievalResponse>;
  getProfile(ctx): Promise<Record<string, unknown>>;
  updateProfile(ctx, patch): Promise<void>;
}
```

**Prisma-модели памяти:**
- `MemoryInteraction` — записи диалогов
- `MemoryEpisode` — эпизоды
- `MemoryProfile` — профили пользователей

### 3.5 Risk-Engine (пакет)

Мульти-коллекторная архитектура:
- `RiskSignalCollector` — базовый коллектор сигналов
- `LegalRiskCollector` — юридические риски
- `RndRiskCollector` — R&D риски
- `OpsRiskCollector` — операционные риски
- `FinanceRiskCollector` — финансовые риски
- `RegenerativeRiskCollector` — регенеративные риски
- `RiskFsm` — конечный автомат состояний риска
- `VerdictRules` — правила вынесения вердикта
- `RiskNormalizer` — нормализация метрик
- `RiskAggregator` — агрегация рисков

---

## 4. Анализ event-driven компонентов

### 4.1 Event-Bus (EventEmitter)

Система использует `@nestjs/event-emitter` для внутренней событийной шины. Основные паттерны:

1. **ConsultingOrchestrator** — обрабатывает `consulting.operation.completed`:
   - Связывает StockTransaction с бюджетами
   - Атомарно обновляет BudgetItem через Prisma-транзакции
   - Инжестит EconomicEvent через EconomyService
   - Синхронизирует бюджеты и создаёт отклонения

2. **AgroEventsOrchestrator** — паттерн Draft → Fix → Link → Confirm → Commit:
   - Валидация через `AgroEventsMustValidator`
   - Эскалация через `AgroEscalationLoopService`
   - Хеширование provenance для аудиторского следа

### 4.2 Outbox-паттерн

`OutboxModule` обеспечивает гарантированную доставку событий:
- `OutboxService` — сервис записи
- `OutboxRelay` — ретрансляция (cron-based)
- `ConsumerIdempotencyService` — идемпотентность потребителей
- `OutboxBrokerPublisher` — публикация во внешний брокер

### 4.3 BullMQ

Асинхронные фоновые задачи через BullMQ + Redis. Используется для:
- Отложенной обработки тяжёлых операций
- Retry-логики
- Расписания (ScheduleModule)

---

## 5. Анализ операционных потоков

### 5.1 Поток технологической карты (TechMap)

```
Черновик (DRAFT)
  → Валидация (7 правил + DAG) 
  → Утверждение (FSM: DRAFT → ACTIVE)
  → Версионирование (createNextVersion)
  → Исполнение (ExecutionRecord + StockTransaction)
  → Бюджетный контроль (ConsultingOrchestrator)
  → Отклонения (DeviationService)
```

**FSM состояний:** DRAFT → REVIEW → ACTIVE → COMPLETED / ARCHIVED

### 5.2 Поток AI-чата (RAI Chat)

```
Пользователь → RaiChatController
  → SupervisorAgent.orchestrate()
    → Загрузка памяти (MemoryAdapter.retrieve)
    → Загрузка профиля (MemoryAdapter.getProfile)
    → Определение намерения (detectIntent)
    → Автоматическое построение вызовов (buildAutoToolCall)
    → Исполнение инструментов (RaiToolsRegistry.execute)
    → Построение виджетов (RaiChatWidgetBuilder)
    → Формирование подсказок (buildSuggestedActions)
    → Сохранение в память (MemoryAdapter.appendInteraction)
  → RaiChatResponseDto
```

### 5.3 Поток агро-событий

```
createDraft → fix → link → confirm → commit
  → Эскалация (AgroEscalationLoopService)
  → Provenance Hash (SHA-256)
```

### 5.4 Поток финансовой оркестрации

```
Операция завершена (event)
  → ConsultingOrchestrator
    → Привязка транзакций к бюджету
    → EconomyService.ingestEvent()
    → BudgetPlanService.syncActuals()
    → Обнаружение отклонений
```

---

## 6. Точки интеграции AI в архитектуру

### 6.1 Уже существующие точки

| Точка интеграции | Текущий статус | AI-компонент |
|-----------------|---------------|-------------|
| RAI Chat | Работает | SupervisorAgent + RaiToolsRegistry |
| Генерация техкарт | Stub | TechMapService.createDraftStub |
| Память | Работает | MemoryAdapter (pgvector) |
| Теневой консультант | Работает | ShadowAdvisoryService |
| Внешние сигналы | Работает | ExternalSignalsService |
| Vision AI | Модели есть | VisionObservation (Prisma) |
| Knowledge Graph | Модели есть | KnowledgeNode/KnowledgeEdge |

### 6.2 Рекомендуемые точки расширения

| Область | Обоснование | Приоритет |
|---------|-------------|-----------|
| **Генерация техкарт** | Ядро платформы; текущий stub требует полноценного AI-агента для расчёта операций, дозировок, норм высева | КРИТИЧЕСКИЙ |
| **Агрономический анализ** | Интерпретация NDVI/NDRE, фитопатологический прогноз, рекомендации по защите растений | ВЫСОКИЙ |
| **Обнаружение аномалий** | Автоматическое выявление отклонений в план-факте, бюджете, погодных данных | ВЫСОКИЙ |
| **Экономическое моделирование** | What-if симуляция сценариев, прогноз ROI, оптимизация затрат | СРЕДНИЙ |
| **Юридический анализ** | Проверка контрактов, compliance-мониторинг, подготовка отчётности | СРЕДНИЙ |
| **HR-аналитика** | Прогноз выгорания, оптимизация расписаний, рекомендации по обучению | НИЗКИЙ |

---

## 7. Риски интеграции AI

### 7.1 Технические риски

| Риск | Описание | Митигация |
|------|----------|-----------|
| **Tenant Isolation** | AI-агенты должны строго работать в рамках companyId; утечка данных между тенантами — критическая уязвимость | ActorContext с companyId на каждом вызове; enforce в RaiToolsRegistry |
| **Token Explosion** | Рекурсивные вызовы агентов могут привести к неконтролируемому расходу токенов | Жёсткие лимиты на глубину, бюджет токенов |
| **Latency** | LLM-вызовы добавляют 1-10с к каждому запросу; для real-time операций неприемлемо | Tiered-модели (быстрые/дешёвые для рутины, мощные для сложных задач) |
| **Determinism** | Стохастическая природа LLM vs. требование воспроизводимости агрономических расчётов | Детерминированное ядро (GenerativeEngine.SeedManager) + AI-слой только для рекомендаций |
| **Стабильность промтов** | Изменение промтов может привести к регрессии качества рекомендаций | Версионирование промтов, A/B-тестирование |

### 7.2 Бизнес-риски

| Риск | Описание | Митигация |
|------|----------|-----------|
| **Ошибочные агрономические рекомендации** | Неправильная дозировка пестицидов или нормы высева может привести к потере урожая | Human-in-the-Loop: AI → Черновик → Агроном → Утверждение |
| **Стоимость LLM API** | При 100+ активных хозяйствах расходы на API могут превысить бюджет | Token-бюджеты, model tiering, кэширование ответов |
| **Зависимость от провайдера** | Привязка к одному LLM-провайдеру создаёт операционный риск | Абстракция через адаптеры, fallback на локальные модели |
| **Юридическая ответственность** | Кто отвечает за последствия AI-рекомендаций? | Явный disclaimer, аудит-лог всех рекомендаций, режим "AI как советник" |

---

## 8. Архитектурные ограничения кодовой базы

### 8.1 Жёсткие ограничения

1. **Multi-tenancy:** Все запросы должны содержать `companyId`. Утечка данных между тенантами блокирована на уровне ESlint-плагина `eslint-plugin-tenant-security`.
2. **FSM-дисциплина:** Критические сущности (TechMap, Season, AgroEvent) управляются конечными автоматами — AI не может обходить FSM-переходы.
3. **Immutability:** После активации TechMap становится immutable, изменения — только через `createNextVersion`.
4. **Outbox-паттерн:** Внешние события обязаны проходить через Outbox для гарантии доставки.
5. **Idempotency:** Потребители событий используют `ConsumerIdempotencyService`.

### 8.2 Гибкие расширения

1. **Tool Registry:** `RaiToolsRegistry` проектирован для расширения — можно добавлять новые инструменты через `register()`.
2. **Event Bus:** Любой модуль может подписаться на доменные события через `@OnEvent()`.
3. **Memory Adapter:** Интерфейс `MemoryAdapter` допускает альтернативные реализации.
4. **Packages:** Независимые пакеты (risk-engine, legal-engine) легко оборачиваются в AI-инструменты.

---

## 9. Критические системные инварианты

1. **Tenant Isolation (I-01):** Каждый запрос к данным ОБЯЗАН фильтроваться по `companyId`
2. **FSM Integrity (I-02):** Переходы состояний допустимы ТОЛЬКО через валидные FSM-переходы
3. **Audit Trail (I-03):** Все критические операции ОБЯЗАНЫ протоколироваться (AuditLog)
4. **Budget Consistency (I-04):** Фактические затраты ОБЯЗАНЫ проходить через бюджетный оркестратор
5. **Idempotency (I-05):** Повторная обработка событий НЕ ДОЛЖНА создавать дубликаты
6. **Provenance (I-06):** Агро-события ОБЯЗАНЫ содержать хеш провенанса (SHA-256)
7. **Human-in-the-Loop (I-07):** Критические операционные действия ЗАПРЕЩЕНО комитить без человеческого подтверждения

---

## 10. Оценка осуществимости мульти-агентной архитектуры

### 10.1 Преимущества мульти-агентной архитектуры

1. **Разделение ответственности:** Каждый агент специализируется на своей предметной области (агрономия, экономика, юридика) — это отражает реальную организационную структуру сельхозпредприятия.
2. **Масштабируемость экспертизы:** Промты и знания каждого агента можно развивать независимо.
3. **Контролируемость:** Отдельный бюджет токенов, отдельные метрики качества, отдельные fallback-стратегии.
4. **Параллелизм:** Несколько агентов могут работать одновременно (например, агроном формирует техкарту, а экономист параллельно считает бюджет).
5. **Аудируемость:** Каждый агент оставляет свой trace — это упрощает пост-фактум анализ решений.

### 10.2 Недостатки мульти-агентной архитектуры

1. **Сложность оркестрации:** Необходим надёжный Supervisor для координации агентов.
2. **Стоимость:** Каждый вызов агента = дополнительные токены; мульти-агентный разговор в 3-5 раз дороже одиночного вызова.
3. **Latency:** Цепочка агентов добавляет задержку (2-10с на каждый шаг).
4. **Рекурсивный риск:** Агенты могут зациклиться, вызывая друг друга бесконечно.
5. **Консистентность:** Два агента могут прийти к противоречивым рекомендациям.

### 10.3 Когда одиночная модель лучше

- **Простые вопрос-ответы:** Пользователь спрашивает «Какая норма высева рапса?» — не нужен Swarm.
- **Детерминированные расчёты:** Калькуляция дозировок, GDD-окна — это НЕ задача LLM, это задача deterministic engine.
- **Потоковые операции:** Заполнение справочников, маршрутизация задач — достаточно одного intent-router.

### 10.4 Вывод по осуществимости

Мульти-агентная архитектура **архитектурно оправдана** для RAI_EP по следующим причинам:

1. Платформа УЖЕ имеет доменное разделение на 35+ модулей, что создаёт естественную карту специализации агентов.
2. Существующий `SupervisorAgent` + `RaiToolsRegistry` закладывает фундамент для мульти-агентной маршрутизации.
3. `MemoryAdapter` уже поддерживает контекстуальную память — критически важно для агентов.
4. Паттерн Draft → Review → Commit (Human-in-the-Loop) уже встроен в систему.

Однако необходимо **строго ограничить количество агентов** (5-7 максимум) и **запретить межагентные рекурсивные вызовы**.

---

## 11. Стратегия интеграции AI

### 11.1 Где AI должен находиться в архитектуре

```
┌─────────────────────────────────────────────┐
│            API Gateway (NestJS)              │
├─────────────────────────────────────────────┤
│         AI Orchestration Layer              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Supervisor│  │  Memory  │  │  Budget   │  │
│  │  Agent   │  │  System  │  │  Gate     │  │
│  └────┬─────┘  └──────────┘  └──────────┘  │
│       │                                      │
│  ┌────┴────────────────────────────┐        │
│  │     Tool Registry (RaiTools)    │        │
│  └────┬─────┬──────┬──────┬───────┘        │
├───────┼─────┼──────┼──────┼─────────────────┤
│  Domain Services (детерминированные)        │
│  ┌────┴──┐┌─┴───┐┌─┴───┐┌┴─────┐          │
│  │TechMap││Risk ││Legal││Finance│          │
│  └───────┘└─────┘└─────┘└──────┘          │
├─────────────────────────────────────────────┤
│              Prisma + PostgreSQL             │
└─────────────────────────────────────────────┘
```

**Принцип:** AI работает ПОВЕРХ доменных сервисов через Tool Registry, НИКОГДА не обращается к базе данных напрямую.

### 11.2 Что AI НЕ должен контролировать

| Зона | Обоснование |
|------|-------------|
| FSM-переходы TechMap | Бизнес-логика состояний должна оставаться детерминированной |
| Финансовые транзакции | Только оркестратор может создавать LedgerEntry |
| Tenant Isolation | companyId enforcement — это инфраструктурный инвариант |
| DAG-валидация операций | Алгоритмическая проверка, не требующая LLM |
| Outbox-публикация | Гарантии доставки — инфраструктурная задача |

### 11.3 Что должно оставаться детерминированной логикой

1. **Расчёт норм высева** — формула, не LLM
2. **Расчёт доз удобрений** — балансовый метод, не LLM
3. **GDD-окна** — тепловые модели, не LLM
4. **DAG-валидация** — топологическая сортировка, не LLM
5. **Бюджетный контроль** — арифметика, не LLM
6. **FSM-переходы** — конечный автомат, не LLM

AI должен **предлагать** параметры, а детерминированный движок **рассчитывает и валидирует**.

---

## 12. Архитектурное заключение

### 12.1 Текущая зрелость

RAI_EP находится на стадии **зрелой гибридной архитектуры** с элементами AI-интеграции:
- Существует SupervisorAgent с 6 инструментами (1 — stub)
- Реализована эпизодическая память через pgvector
- Работает теневой консультант (ShadowAdvisory)
- Заложен фундамент Knowledge Graph
- Есть Python inference service для ML-моделей

### 12.2 Рекомендуемая эволюция

Вместо «революции» (полного переписывания на мульти-агентную архитектуру) рекомендуется **итеративная эволюция**:

1. **Stage 1 — Усиление Supervisor'а:** Расширить RaiToolsRegistry новыми инструментами, обёртывающими существующие доменные сервисы. Добавить реальную LLM-интеграцию вместо intent-routing на regex.
2. **Stage 2 — Специализированные агенты:** Выделить 3-5 специализированных агентов (Agro, Finance, Risk, Legal, Knowledge) под управлением Supervisor'а.
3. **Stage 3 — Проактивный Swarm:** Добавить event-driven активацию агентов (агент мониторинга реагирует на NDVI-данные, агент рисков — на погодные аномалии).

### 12.3 Ключевой архитектурный принцип

> **AI — советник, бэкенд — исполнитель.** AI формирует рекомендации (черновики, предложения, аналитику), а детерминированные доменные сервисы валидируют, рассчитывают и исполняют. Человек принимает финальное решение.

Этот принцип полностью согласуется с уже существующим паттерном Draft → Review → Commit в архитектуре RAI_EP.
