# RAI_EP — Операционная система управляемого агрорезультата

> **Версия документа:** 3.0 · **По состоянию на:** 2026-03-06
> Mono-repo · pnpm + Turborepo · NestJS + Next.js 14 · PostgreSQL/PostGIS/pgvector · Redis · MinIO

---

## 0. TL;DR

**RAI Enterprise Platform** — multi-tenant event-driven платформа для управления агробизнесом класса institutional-grade. Объединяет два контура: **Back-Office** (CRM, HR, Finance, GR, Legal) и **Front-Office** (цифровая агрономия, техкарты, полевые задачи, спутниковый мониторинг). Ядро построено на иммутабельных FSM, ledger-инвариантах и уровневой модели когнитивной эволюции AI (Level A → F).

**Текущий статус:** Phase Delta (Институционализация). Levels A–E стабильны. Level F (Trust Layer) — в финальном hardening.

---

## 1. Что это и зачем

RAI_EP решает три системные проблемы агроотрасли:

| Проблема | Механизм решения |
|---|---|
| **Разрыв «Офис ↔ Поле»** — финансисты не видят реальных затрат, агрономы не знают бюджета | Единая событийная шина: экономические факты генерируются операциями в поле автоматически |
| **Кадровый голод** — уход эксперта = потеря технологии | Когнитивная память (Unified Memory Architecture): семантический граф, эпизодический поиск, процедурная память |
| **Слепые решения** — инвестиции в технологии без расчёта ROI | What-if симуляции, детерминированный прогноз урожайности (Level B), контрфактуальное моделирование (Level C) |

**Генеральная цель:** максимизация урожая → максимизация прибыли клиента (хозяйства) и оператора (RAI).

> Источники: `docs/00_STRATEGY/VISION_SCOPE.md`, `docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM.md`, `docs/00_STRATEGY/Описание логики бизнеса.md`

---

## 2. Для кого и какой результат

### Персоны

| Роль | Что получает |
|---|---|
| **CEO / CFO** | EBITDA в реальном времени, портфельная аналитика, stress-test сценарии |
| **HR Director** | Пульс-опросы, выявление выгорания, OKR, матрица компетенций |
| **Агроном** | AI-подсказки, техкарта как точный протокол, фото/гео-валидация задач |
| **Механизатор** | Telegram-бот: «Старт / Стоп», получение нарядов |
| **Менеджер (наш)** | Карточка клиента, мониторинг исполнения техкарт, алерты, техсоветы |
| **Руководители (наши)** | Управленческий дашборд (экономика, финансы, HR), заключение договоров |

### Целевые KPI (3 года)

| Метрика | Цель | Источник |
|---|---|---|
| Урожайность клиента | +15–30% | `docs/00_STRATEGY/SUCCESS_METRICS.md` |
| Затраты клиента | –10–20% | `docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM.md` |
| SLA реакции | < 4 часов | `docs/00_STRATEGY/SUCCESS_METRICS.md` |
| DAU/MAU агрономов в сезон | 80% | `docs/00_STRATEGY/SUCCESS_METRICS.md` |
| Advisory Accuracy (принятие рекомендаций) | 70% | `docs/00_STRATEGY/SUCCESS_METRICS.md` |

---

## 3. Как проект зарабатывает (Business Model)

Модель подтверждена в `docs/00_STRATEGY/Описание логики бизнеса.md`, `docs/00_STRATEGY/BUSINESS/RAI STRATEGY v3.0.md`, `docs/00_STRATEGY/BUSINESS/RAI BUSINESS ARCHITECTURE v2.0.md`:

| Источник дохода | Описание | Подтверждение в репо |
|---|---|---|
| **Агроконсалтинг** | Формула: `Контекст → План Урожая → Техкарта → Исполнение → Δ → Вознаграждение`. Сейчас фокус — рапс | `docs/00_STRATEGY/Описание логики бизнеса.md` |
| **Поставка СЗР / ТМЦ** | Полный сервис: поставка средств защиты растений, аренда техники для исследований | Там же |
| **Производство «Грипил»** | Производство собственного препарата на аутсорсе | `docs/00_STRATEGY/Описание логики бизнеса.md` |
| **SaaS-подписка (стратегия)** | Seasonal → Advisory → Managed модели. Revenue share в Managed режиме | `docs/00_STRATEGY/EVOLUTION_ARCHITECTURE_MASTER_A_TO_F.md` (раздел Level F, таблица Revenue) |
| **Сертификация / страхование (Level F, гипотеза)** | ESG-сертификация, снижение страховых премий, carbon credits — только для Managed Regenerative | `docs/00_STRATEGY/EVOLUTION_ARCHITECTURE_MASTER_A_TO_F.md` |

**Стратегическая модель роста (v1 → v3):**

1. **v1.0 (0–12 мес):** Результатный консалтинг. Продаём рост урожая, контроль затрат. Скрыто используем FSM, RiskGate, Ledger.
2. **v2.0 (12–24 мес):** Управляемая дисциплина. Обязательное фото/гео-подтверждение, объяснимость решений, прозрачные кейсы.
3. **v3.0 (24–60 мес):** Институциональный оператор. 500+ хозяйств, мульти-юрисдикции, портфельная аналитика, международное масштабирование.

---

## 4. Продуктовые модули (Product Surface)

### 🏢 Контур 1: Back-Office (Enterprise Management)

| Модуль | Статус в коде | Ключевые файлы |
|---|---|---|
| **CRM & Scoring** | Реализован (Account, Contact, Interaction, Obligation, Deal, ScoreCard, Contract) | `apps/api/src/modules/crm/`, `apps/web/app/(app)/crm/`, Prisma: `Account`, `Contact` |
| **HR & Talent** | Реализован (PulseSurvey, OkrCycle, EmployeeProfile, HumanAssessmentSnapshot) | `apps/api/src/modules/hr/`, `apps/web/app/(app)/hr/`, Prisma: `PulseSurvey`, `OkrCycle` |
| **Finance & Economy** | Реализован (EconomicEvent → LedgerEntry → CashAccount → Budget) | `apps/api/src/modules/finance-economy/`, `apps/web/app/(app)/finance/`, `economy/` |
| **Legal AI** | Реализован (LegalDocument, LegalRequirement, ComplianceCheck) | `packages/legal-engine/`, `apps/api/src/modules/legal/` |
| **GR (Gov Relations)** | Реализован (RegulatoryBody, GrInteraction, PolicySignal) | `apps/web/app/(app)/gr/` |
| **Commerce** | Реализован (Party, CommerceContract, CommerceObligation, Invoice, Payment) | `apps/api/src/modules/commerce/`, `apps/web/app/(app)/commerce/` |

### 🚜 Контур 2: Front-Office (Field Management)

| Модуль | Статус в коде | Ключевые файлы |
|---|---|---|
| **Agro Process Layer (APL)** | Реализован (16 стадий рапса, Orchestrator, RuleEngine) | `packages/agro-orchestrator/src/`, `apps/api/src/modules/agro-orchestrator/` |
| **Tech Map Engine** | Реализован (TechMap → PlannedOperation → Input → CropZone → BudgetPlan) | `apps/api/src/modules/tech-map/` (61 файл) |
| **Task Engine** | Реализован (FSM: PENDING → IN_PROGRESS → COMPLETED/CANCELLED) | `apps/api/src/modules/task/` |
| **Season FSM** | Реализован (PLANNING → ACTIVE → HARVEST → CLOSED, Snapshot, StageProgress) | `apps/api/src/modules/season/` |
| **Field Registry** | Реализован (Field с GeoJSON, cadastreNumber, PostGIS) | `apps/api/src/modules/field-registry/` |
| **Satellite Ingestion** | Baseline (raw NDVI/NDRE, no analytics) | `apps/api/src/modules/satellite/`, `ingestion/` |
| **Vision AI** | Baseline (raw observations, IntegrityGate validation) | `apps/api/src/modules/vision/`, `inference/` |
| **Knowledge Graph** | Sprint 2 (KnowledgeNode, KnowledgeEdge, event-driven ingestion) | `apps/api/src/modules/knowledge-graph/` |
| **Consulting Module** | Реализован (consulting lifecycle, budget allocation, yield orchestrator) | `apps/api/src/modules/consulting/`, `apps/web/app/consulting/` |

---

## 5. Доменная модель (Core Entities & Relationships)

```
Company (tenant root)
  ├── Account (хозяйство-клиент / партнёр / поставщик)
  │     ├── Contact (контактное лицо)
  │     ├── Interaction (журнал взаимодействий)
  │     ├── Obligation (обязательства)
  │     ├── Field (поле с GeoJSON)
  │     │     ├── Season (сезон: FSM PLANNING→ACTIVE→HARVEST→CLOSED)
  │     │     │     ├── TechMap (технологическая карта)
  │     │     │     │     ├── PlannedOperation (запланированная операция)
  │     │     │     │     │     ├── Input (ресурс: семена/удобрения/СЗР)
  │     │     │     │     │     └── Evidence (фото/гео/лабораторный отчёт)
  │     │     │     │     ├── BudgetPlan → BudgetItem
  │     │     │     │     └── ChangeOrder → Approval
  │     │     │     ├── Task (полевая задача: FSM PENDING→COMPLETED)
  │     │     │     └── HarvestResult (факт урожая)
  │     │     ├── CropZone (зона посева = Field × Season × Crop)
  │     │     └── SoilProfile
  │     ├── Machinery (техника)
  │     └── StockItem → StockTransaction (склад)
  ├── User (JWT, роль, telegramId)
  │     └── EmployeeProfile → OkrCycle, PulseSurvey
  ├── Party → PartyRelation (контрагенты, юрлица)
  ├── Jurisdiction → RegulatoryProfile
  ├── EconomicEvent → LedgerEntry (append-only)
  ├── CashAccount → AccountBalance → Budget → BudgetLine
  ├── RiskSignal → RiskAssessment → RiskStateHistory
  ├── AiAuditEntry → TraceSummary → QualityAlert
  └── ModelVersion → TrainingRun → DriftReport → LearningEvent
```

> Источник: `packages/prisma-client/schema.prisma` (5364 строки, ~170 моделей)

---

## 6. Архитектура и технологии (Architecture)

### 6.1 Стек

| Слой | Технология | Прумечание |
|---|---|---|
| **Backend** | NestJS 10 (TypeScript), GraphQL (Apollo), REST (Swagger) | `apps/api/` |
| **Frontend** | Next.js 14 (App Router), React 18, TailwindCSS, Zustand, XState, Framer Motion | `apps/web/` |
| **Database** | PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7 | `infra/postgres/Dockerfile` |
| **Cache / Pub-Sub** | Redis 7, BullMQ | `docker-compose.yml` |
| **Object Storage** | MinIO (S3-совместимый) | `docker-compose.yml` |
| **Monorepo** | pnpm 9 + Turborepo | `pnpm-workspace.yaml`, `turbo.json` |
| **ORM** | Prisma (shared client в `packages/prisma-client`) | `schema.prisma` |
| **AI/ML** | Python (FastAPI, PyTorch) — inference/ingestion | `inference/`, `ingestion/` |
| **Telegram** | node-telegram-bot-api, Telegraf | `apps/telegram-bot/`, `telegram/` |
| **Auth** | JWT (passport-jwt), 2FA через Telegram, HttpOnly cookies | `apps/api/src/shared/auth/` |

### 6.2 Multi-tenant модель и изоляция

**Архитектурный инвариант (PHASE0-CORE-001):**

- `companyId` — обязательное поле для ВСЕХ tenant-scoped моделей.
- `companyId` ВСЕГДА извлекается из JWT security context, НИКОГДА из body/query/params.
- Tenant isolation реализована на уровне `PrismaService` через `$extends` + прозрачный `Proxy` (`TenantContextService`).
- Cross-tenant joins категорически запрещены.
- ESLint plugin: `packages/eslint-plugin-tenant-security/`.
- Lint-скрипт: `pnpm lint:tenant-context`.

### 6.3 Event-driven контуры

| Компонент | Назначение |
|---|---|
| **Outbox Pattern** | `apps/api/src/shared/outbox/` — гарантированная доставка доменных событий |
| **EventEmitter (NestJS)** | `@nestjs/event-emitter` — внутрипроцессная шина |
| **BullMQ** | Очереди задач (async processing) |
| **Agro Events** | `apps/api/src/modules/agro-events/` — Draft → Commit цикл для агрособытий |
| **Knowledge Graph Events** | Event-driven ingestion: `AgroEventCommitted → KnowledgeNode` |

### 6.4 Ledger / инварианты

- **Append-only Ledger:** `LedgerEntry` — запрет UPDATE/DELETE. Корректировки только через reversal entries.
- **Budget Integrity:** `BudgetPlan` привязан к `techMapId` (NOT NULL), версионирован, hash-защищён.
- **Execution Integrity:** `ExecutionRecord` ссылается на `planId` и `plannedOperationId`. Ad-hoc операции запрещены.
- **Immutable Decisions:** `DecisionRecord` — аудиторский след каждого блока или ограничения.
- **Invariant Gate:** `pnpm gate:invariants` — автоматическая проверка инвариантов.

> Источники: `DECISIONS.log` (PHASE0-CORE-001), `scripts/invariant-gate.cjs`, `scripts/verify-invariants.cjs`

### 6.5 FSM (State Machines)

| Сущность | Состояния |
|---|---|
| Season | `PLANNING → ACTIVE → HARVEST → CLOSED` |
| Task | `PENDING → IN_PROGRESS → COMPLETED / CANCELLED` |
| TechMap | `DRAFT → APPROVED → ACTIVE → COMPLETED` |
| Risk | FSM с состояниями `NONE → LOW → MEDIUM → HIGH → CRITICAL → BLOCKED` |
| Asset (Machinery/Stock) | `PENDING_CONFIRMATION → ACTIVE → ARCHIVED / REJECTED` |
| Budget | FSM с enforcement |
| AgroEventDraft | `DRAFT → COMMITTED / REJECTED` |

---

## 7. AI/Agents контур (Agent-First / Trust)

### 7.1 Когнитивная эволюция (Level A → F)

Система реализует шестиуровневую модель эволюции роли AI:

| Level | Роль AI | Статус |
|---|---|---|
| **A — Controlled Intelligence** | Советник / Аудитор. Нет генерации | ✅ Стабильно |
| **B — Generative Architect** | Генерация TechMap (GENERATED_DRAFT). Детерминизм (B1). Immutability. Probability (B2+) | ✅ Стабильно, 67 тестов + PBT |
| **C — Contradiction-Resilient** | ΔRisk при Human Override. Контрфактуальное моделирование. Divergence Tracking | ✅ Стабильно |
| **D — Adaptive Self-Learning** | Feedback Loop, Drift Detection, Model Lineage Registry, Controlled Retraining | ✅ Стабильно |
| **E — Regenerative Optimization** | Contract-Aware оптимизация. SRI мониторинг. Monte Carlo tail risk. Governance locks | ✅ Стабильно |
| **F — Industry Cognitive Standard** | Certification Engine, Farm Rating, Insurance API, WORM Storage, mTLS Gateway, Quorum Governance | 🚧 Final hardening |

> Источник: `docs/00_STRATEGY/EVOLUTION_ARCHITECTURE_MASTER_A_TO_F.md`

### 7.2 Мульти-агентная архитектура

Спроектирована и частично реализована:

| Компонент | Файлы |
|---|---|
| **Supervisor Agent** | `apps/api/src/modules/rai-chat/supervisor-agent.service.*` |
| **RAI Chat (Agent Shell)** | `apps/api/src/modules/rai-chat/` (86 файлов) |
| **AI Audit (Explainability)** | `apps/api/src/modules/explainability/` — timeline, topology, cost analytics |
| **Agent Reputation** | `agent-reputation.service.*` |
| **Autonomy Policy** | `autonomy-policy.service.*` |
| **Quality Alerting** | `quality-alerting.service.*` |
| **Safe Replay** | `safe-replay.service.*` |
| **Truthfulness Engine** | `truthfulness-engine.service.*` |
| **Trace Summary** | `trace-summary.service.*` — TraceSummary с bsScorePct, evidenceCoveragePct |

### 7.3 Memory Architecture (Unified Memory)

| Слой памяти | Реализация |
|---|---|
| **Working Memory** | Redis (context), `apps/api/src/shared/redis/` |
| **Episodic Memory** | pgvector, `packages/vector-store/`, `apps/api/src/shared/memory/episodic-retrieval.service.*` |
| **Semantic Memory** | Knowledge Graph (KnowledgeNode + KnowledgeEdge), `apps/api/src/modules/knowledge-graph/` |
| **Shadow Advisory** | `apps/api/src/shared/memory/shadow-advisory.service.*` — теневой контур рекомендаций |
| **Engram Rules** | `apps/api/src/shared/memory/engram-rules.*` |

### 7.4 Trust / Explainability / Forensics

| Принцип | Механизм |
|---|---|
| **AI — советник, не авторитет** | Human-in-the-Loop обязателен для всех критических решений |
| **Детерминированное ядро** | Расчёты выполняются кодом, не LLM. `EntropyController` запрещает `Date.now()` / `Math.random()` |
| **Tool-gated access** | Агенты не обращаются к БД напрямую — только через типизированные Tool Calls |
| **AiAuditEntry** | Каждое взаимодействие с AI записывается: traceId, модель, решение, объяснение |
| **TraceSummary** | Агрегация метрик качества: Brier Score, Evidence Coverage, Invalid Claims |
| **Explainability Panel** | UI для forensic-анализа. Timeline, Topology, Cost Analytics |

---

## 8. Безопасность, аудит, комплаенс

| Аспект | Реализация | Файлы |
|---|---|---|
| **Tenant Isolation** | Уровень Prisma proxy, обязательный `companyId` в JWT | `apps/api/src/shared/tenant-context/` |
| **RBAC** | UserRole enum: ADMIN, CEO, MANAGER, AGRONOMIST, FIELD_WORKER, CFO, CLIENT_ADMIN, USER | `schema.prisma` |
| **JWT Auth** | HttpOnly cookies, 2FA через Telegram polling session | `apps/api/src/shared/auth/` |
| **Audit Trail** | Immutable `AuditLog`, `AiAuditEntry`, `DecisionRecord` | `apps/api/src/shared/audit/` |
| **Security Canon** | Нормативный документ, обязательный перед каждым спринтом | `docs/01_ARCHITECTURE/PRINCIPLES/SECURITY_CANON.md` |
| **STRIDE Threat Model** | Документирован | `docs/04_ENGINEERING/SECURITY_THREAT_MODEL_STRIDE_RU.md` |
| **Secret Rotation** | Политика ротации секретов | `docs/04_ENGINEERING/SECRET_ROTATION_POLICY_RU.md` |
| **Level F: mTLS Gateway** | x.509, TokenBucket rate limiting, RFC 7807 | `apps/api/src/level-f/gateway/` |
| **Level F: WORM Storage** | Object Lock S3 на 10 лет для снимков | `apps/api/src/level-f/worm/` |
| **Level F: Crypto** | Ed25519 signing, Merkle DAG, HSM-ready | `apps/api/src/level-f/crypto/` |
| **Idempotency** | `apps/api/src/shared/idempotency/` | - |
| **Integrity Gate** | `apps/api/src/modules/integrity/` | - |

---

## 9. Быстрый старт (Run)

### Предварительные требования

- **Node.js** ≥ 20
- **pnpm** 9.x (`corepack enable && corepack prepare pnpm@9.0.0`)
- **Docker** + Docker Compose

### Шаги

```bash
# 1. Клонировать репозиторий
git clone <repo-url> && cd RAI_EP

# 2. Создать .env
cp .env.example .env
# Отредактировать DATABASE_URL, JWT_SECRET и др.

# 3. Поднять инфраструктуру (Postgres+PostGIS+pgvector, Redis, MinIO, pgAdmin)
docker-compose up -d

# 4. Установить зависимости + сгенерировать Prisma Client
pnpm install
# postinstall автоматически запускает pnpm db:client

# 5. Применить миграции (если есть)
pnpm db:migrate

# 6. (Опционально) Сид данных
pnpm db:seed

# 7. Запустить всё в dev-режиме
pnpm dev
```

> `pnpm dev` запускает Turborepo, который параллельно стартует:
> - `apps/api` — NestJS API на порту 3001
> - `apps/web` — Next.js на порту 3000

### Полезные скрипты

| Команда | Назначение |
|---|---|
| `pnpm dev` | Dev-сервер (API + Web) |
| `pnpm build` | Продакшн-билд |
| `pnpm test` | Запуск тестов через Turborepo |
| `pnpm db:client` | Регенерация Prisma Client |
| `pnpm gate:invariants` | Проверка инвариантов ядра |
| `pnpm lint:tenant-context` | Проверка tenant isolation в коде |
| `pnpm lint:fsm-status-updates` | Проверка корректности FSM-переходов |
| `pnpm docker:up` / `docker:down` | Управление Docker контейнерами |

> Источники: `package.json` (корневой), `docker-compose.yml`, `.env.example`

---

## 10. Разработка (Dev Workflow)

### Архитектурный канон

1. **CANON.md** — высший нормативный акт. Код следует Канону буквально.
2. **DECISIONS.log** — ни одна задача не принимается без зарегистрированного Decision-ID.
3. **Ролевая иерархия:** USER (Product Owner) → TECHLEAD (AI CTO) → CODER (AI Developer).
4. **Admission Principle:** ни один процесс не имеет доступа к системе без явного допуска.

### Правила разработки

- Все тексты интерфейса — **строго на русском**.
- Код, файлы, переменные, API endpoints — на **английском**.
- Каждое логическое действие записывается в `memory-bank/`.
- Обязательная проверка: `pnpm gate:invariants` перед мержем.
- UI следует `UI_DESIGN_CANON.md` (Geist, font-medium, no font-bold).

### Packages (библиотеки домена)

| Package | Назначение |
|---|---|
| `@rai/prisma-client` | Shared Prisma Client для всех apps |
| `@rai/agro-orchestrator` | Orchestrator + RuleEngine для 16 стадий APL |
| `@rai/legal-engine` | Legal compliance, document validation |
| `@rai/risk-engine` | Unified Risk FSM, collectors, signals |
| `@rai/rd-engine` | R&D engine (Research Programs) |
| `@rai/regenerative-engine` | Regenerative Optimization (SRI, Monte Carlo) |
| `@rai/vector-store` | pgvector adapter для episodic memory |
| `eslint-plugin-tenant-security` | ESLint правила для проверки tenant isolation |

### Contracts (Schema Registry)

- `contracts/schemas/` — JSON Schema (Draft 2020-12) для ingestion/inference.
- `contracts/examples/` — валидные примеры для каждой схемы.
- Семантическое версионирование: `MAJOR.MINOR.PATCH`.

---

## 11. Тестирование и качество

### Тестовое покрытие

- **Unit-тесты:** 54+ spec-файлов в `apps/api/src/` (Jest).
- **Integration-тесты:** `apps/api/test/` — budget concurrency, generative engine, Level F.
- **Property-Based тесты:** `test/generative-engine.pbt.spec.ts` — 10,000 образцов.
- **Adversarial-тесты:** `test/generative-engine.adversarial.spec.ts` — 14 атак.
- **Frontend-тесты:** `apps/web/__tests__/` — 14 тестовых файлов (Jest + Testing Library).

### Инварианты (автоматизированные)

| Скрипт | Назначение |
|---|---|
| `pnpm gate:invariants` | Проверка бюджетных, ledger, execution инвариантов |
| `pnpm gate:rollout` | Проверка rollout guards |
| `pnpm verify:fsm-db:task` | Верификация Task FSM на уровне БД |
| `scripts/verify-techmap-engine.cjs` | Smoke-тест TechMap Engine |
| `scripts/verify-full-traceability.ts` | Проверка полной трассируемости |
| `scripts/verify-level-d-hardened.ts` | Проверка hardening Level D |

---

## 12. Roadmap (по репо) + Гипотезы

### Из репозитория (подтверждено)

| Фаза | Описание | Статус |
|---|---|---|
| **Alpha: Architecture Foundation** | IAM, Structure, Task Engine, Field Passport, Crop Rotation, TG Bot v1, Web Dashboard v1 | ✅ Завершена |
| **Beta: Process Discipline** | APL (16 стадий рапса), Rule Engine, Tech Map, Supply/Machinery, Finance Basic, Unified Risk Engine | ✅ Завершена (reopened для Contour 2) |
| **Gamma: Cognitive Intelligence** | Episodic Retrieval, Shadow Advisory, Knowledge Graph, Vision AI, Satellite Ingestion, HR Module | ✅ Основное завершено |
| **Delta: Institutionalization** | Level F Trust Layer, Certification Engine, Farm Rating, mTLS Gateway, WORM Storage, Quorum Governance | 🚧 В процессе (Hardening) |

### Ближайшие 2–6 недель (тактика, из DECISIONS.log)

- **Agent OS Shell:** TopNav, LeftRaiChatDock, MainWorkspace, WorkspaceContext, MemoryAdapter.
- **R5 Trace Forensics:** Глубокая причинная цепочка, timeline и topology.
- **Truthfulness Runtime:** Race condition fix, fallback scenarios.
- **TraceSummary Live Metrics:** Nullable quality fields, потоковые обновления.

### Стратегические эпики (3–6 мес, из доков)

- **Phase Delta завершение:** Level F полный hardening, пилот с финансовой интеграцией (Q2 2025 → перенесён).
- **Consulting Core:** Полный цикл консалтинга, RBAC с FSM.
- **Commerce Core:** Контрактный жизненный цикл, обязательства, invoice/payment.

### Гипотезы (не подтверждены кодом)

- **Kubernetes оркестрация** — упоминается в `docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ ОПИСАНИЕ.md`, но Helm-чарты в `infra/helm/` пока минимальны.
- **React Native / PWA** — упоминается в стратегии, кода нет.
- **Голосовой интерфейс** — упоминается в Phase Delta, реализации нет.
- **Marketplace** (поставщики семян/техники) — упоминается в Phase Delta, реализации нет.
- **Финансовые сервисы** (страхование, кредитование на основе AI-скоринга) — упоминается в Level F, частично спроектировано.
- **Животноводство** — упоминается в `docs/00_STRATEGY/Описание логики бизнеса.md` как стратегическое намерение.

---

## 13. Риски и ограничения

### Технологические риски

| Риск | Митигация |
|---|---|
| **Mono-repo complexity** — 5364 строки в schema.prisma | Decomposition в packages, изоляция через workspace |
| **Single DB** — нет sharding | Level F предусматривает Federation, но не реализовано |
| **Python-services разрыв** — inference/ingestion на Python, core на TypeScript | JSON Schema contracts (`contracts/`), Dockerfile-изоляция |
| **AI hallucinations** | Deterministic Core (B1), IntegrityGate, Human-in-the-Loop, Truthfulness Engine |
| **Drift в моделях** | Level D: Mandatory Drift Detection, Governance Thresholds |
| **Bias amplification** | Level D: Bias Guard + обязательный rollback |

### Продуктовые риски

| Риск | Описание |
|---|---|
| **Низкая цифровая зрелость клиентов** | Стратегия «скрытой сложности» (v1.0 → v3.0) |
| **Недоверие к AI** | Advisory-only модель. AI не может блокировать решение человека (кроме Managed Regenerative) |
| **Сезонность** | Планируется диверсификация (животноводство), но не реализовано |

### Non-Goals (сознательно НЕ делаем сейчас)

- ❌ Тренд-аналитика спутниковых данных (Satellite = baseline only).
- ❌ Автоматические рекомендации Vision AI (наблюдения без интерпретаций).
- ❌ Mobile native app (только PWA + Telegram).
- ❌ Public API (только internal + mTLS для Level F партнёров).
- ❌ Multi-DB / Sharding.
- ❌ gRPC / NATS (упоминается в доках, не реализовано — используется HTTP + EventEmitter + BullMQ).

---

## 14. Глоссарий

| Термин | Определение |
|---|---|
| **TechMap (Техкарта)** | Цифровой контракт на урожай: граф операций, ресурсная ведомость, бюджет. Привязана к CropZone. Immutable после утверждения |
| **Season FSM** | Конечный автомат жизненного цикла сезона: `PLANNING → ACTIVE → HARVEST → CLOSED`. Переходы логируются в `SeasonHistory` |
| **CropZone** | Пересечение Field × Season × CropVariety/CropPlan. Атомарная единица привязки техкарты |
| **Party (Контрагент)** | Юридическое лицо или ИП, участвующее в коммерческих отношениях. Связано через `PartyRelation` |
| **RegulatoryProfile** | Профиль регуляторных требований юрисдикции. Определяет compliance-правила |
| **Ledger** | Append-only финансовый регистр. `LedgerEntry` — неизменяемая проводка. Корректировки через reversal |
| **EconomicEvent** | Атомарный экономический факт, порождённый доменным событием. Основа для Ledger-проекций |
| **IntegrityGate** | Сервис-барьер: блокирует данные, не прошедшие валидацию. Admission Principle в коде |
| **RiskGate** | Детерминированный контроль рисков на базе FSM. `RiskVerdict.BLOCKED` → физическая блокировка операции |
| **Outbox Pattern** | Гарантированная доставка доменных событий через таблицу-outbox с последующей публикацией |
| **Explainability (Объяснимость)** | Обязательное свойство: каждое AI-решение сопровождается объяснением факторов, ΔRisk, трассировкой |
| **Agent Swarm** | Мульти-агентная архитектура: Supervisor + специализированные агенты (Agro, Economist, Monitoring, Knowledge) |
| **Advisory Mode** | Режим AI: «Советует, но не решает». Все критические действия требуют Human approval |
| **Level A–F** | Шестиуровневая модель когнитивной эволюции AI: от Controlled Advisor до Industry Cognitive Standard |
| **Drift Detection** | Обнаружение деградации модели: PSI, KL divergence, скользящая ошибка. Обязательный и непрерывный процесс (Level D) |
| **Determinism B1** | Инвариант: `generate(P)₀ = generate(P)ₙ`. Побайтовая детерминированность генерации. Запрет `Date.now()`, `Math.random()` |
| **WORM (Write Once Read Many)** | Level F: Object Lock S3 хранение снимков на 10 лет без возможности изменения |
| **Quorum / Governance** | M-of-N подтверждение для критических операций (обновление протокола, отзыв сертификата) |
| **Shadow Advisory** | Предварительный (теневой) контур рекомендаций AI — работает в фоне, без влияния на пользователя |
| **ChangeOrder** | Запрос на изменение утверждённой операции в техкарте. Требует процедуры `Approval` |
| **BudgetPlan** | Связка Tech Map → Budget: плановые затраты по операциям и ресурсам |
| **Engram** | Единица когнитивной памяти: фиксация успешного/неуспешного опыта для последующего retrieval |

---

## Appendix A: Repo Map

```
RAI_EP/
├── apps/
│   ├── api/                    # NestJS Backend (708 файлов)
│   │   ├── src/
│   │   │   ├── modules/        # 36 доменных модулей
│   │   │   │   ├── rai-chat/           # AI Agent Shell (86 файлов)
│   │   │   │   ├── tech-map/           # TechMap Engine (61 файл)
│   │   │   │   ├── generative-engine/  # Level B Generative (73 файла)
│   │   │   │   ├── consulting/         # Consulting lifecycle (40 файлов)
│   │   │   │   ├── commerce/           # Party, Contracts, Invoices (34 файла)
│   │   │   │   ├── finance-economy/    # Ledger, Budget, Cash (31 файл)
│   │   │   │   ├── explainability/     # Forensics, Timeline, Topology (21 файл)
│   │   │   │   ├── hr/                 # HR module (13 файлов)
│   │   │   │   ├── season/             # Season FSM (12 файлов)
│   │   │   │   ├── agro-events/        # Draft→Commit event cycle (11 файлов)
│   │   │   │   ├── satellite/          # NDVI/NDRE ingestion (10 файлов)
│   │   │   │   ├── vision/             # Computer Vision baseline (10 файлов)
│   │   │   │   ├── knowledge-graph/    # Semantic memory (10 файлов)
│   │   │   │   ├── task/               # Task FSM Engine (9 файлов)
│   │   │   │   └── ... (crm, legal, risk, strategic, ...)
│   │   │   ├── shared/         # Инфраструктурные сервисы
│   │   │   │   ├── auth/               # JWT, Guards, Passport
│   │   │   │   ├── tenant-context/     # Multi-tenant isolation
│   │   │   │   ├── outbox/             # Event outbox pattern
│   │   │   │   ├── memory/             # Unified Memory (19 файлов)
│   │   │   │   ├── audit/              # Audit trail
│   │   │   │   ├── state-machine/      # FSM infrastructure
│   │   │   │   └── invariants/         # Runtime invariant checks
│   │   │   └── level-f/        # Level F: Trust Layer
│   │   │       ├── gateway/            # mTLS, Rate Limiting
│   │   │       ├── certification/      # Cert Engine
│   │   │       ├── crypto/             # Ed25519, Merkle
│   │   │       ├── snapshot/           # Immutable Snapshots
│   │   │       └── worm/              # WORM Storage
│   │   └── test/               # Integration & E2E tests
│   ├── web/                    # Next.js 14 Frontend (316 файлов)
│   │   ├── app/
│   │   │   ├── (app)/                  # Main app routes
│   │   │   │   ├── commerce/           # Contracts, Invoices UI
│   │   │   │   ├── production/         # Fields, Seasons, TechMaps
│   │   │   │   ├── finance/ & economy/ # Financial dashboards
│   │   │   │   ├── hr/                 # HR module UI
│   │   │   │   ├── exploration/        # Strategic exploration
│   │   │   │   ├── control-tower/      # Operations dashboard
│   │   │   │   └── ...
│   │   │   ├── consulting/             # Consulting UI (35 файлов)
│   │   │   ├── forensics/             # AI forensics UI
│   │   │   └── dashboard/             # Main dashboard
│   │   ├── components/         # UI components (73 файла)
│   │   ├── shared/             # Shared frontend logic (34 файла)
│   │   └── lib/                # API clients, stores (16 файлов)
│   └── telegram-bot/           # Standalone Telegram Bot
├── packages/
│   ├── prisma-client/          # Shared Prisma ORM Client (schema: 5364 строк)
│   ├── agro-orchestrator/      # APL Orchestrator + RuleEngine
│   ├── legal-engine/           # Legal compliance engine
│   ├── risk-engine/            # Unified Risk FSM
│   ├── rd-engine/              # R&D Programs engine
│   ├── regenerative-engine/    # Level E: SRI, Monte Carlo
│   ├── vector-store/           # pgvector adapter
│   └── eslint-plugin-tenant-security/  # Tenant isolation linter
├── contracts/                  # JSON Schema registry (ingestion, inference)
├── adapters/                   # Domain adapters (AI, Economy, Registry, Task, PSEE)
├── domain-rai/                 # RAI Domain Layer (isolated from mg-core)
├── mg-core/                    # MatrixGin kernel (read-only, frozen)
│   ├── backend/                # Original MatrixGin backend (712 файлов)
│   └── database/               # Original MatrixGin DB
├── inference/                  # Python: AI inference service (FastAPI)
├── ingestion/                  # TypeScript: Data ingestion service
├── interagency/                # AI agent prompts, plans, reports (183 файла)
├── risk-engine/                # Standalone risk engine (Python)
├── telegram/                   # Telegram integration layer
├── infra/
│   ├── postgres/               # Custom Dockerfile (PostGIS + pgvector)
│   ├── gateway/                # API gateway config
│   ├── helm/                   # Kubernetes Helm charts (minimal)
│   └── monitoring/             # Monitoring configs
├── scripts/                    # 46 scripts: invariants, linting, verification, migration
├── docs/                       # 489 файлов документации
│   ├── 00_STRATEGY/            # Vision, Business, Roadmap, Consulting
│   ├── 01_ARCHITECTURE/        # Principles, HLD, ADR, Level A–F specs
│   ├── 02_DOMAINS/             # Agro, Economy, Enterprise, Soil, Risk
│   ├── 03_PRODUCT/             # UI/UX specs, API specs, Telegram
│   ├── 04_ENGINEERING/         # Implementation plans, Security, MLOps
│   ├── 05_OPERATIONS/          # Runbooks, Incident response
│   ├── 06_METRICS/             # KPI formulas, Risk monitoring
│   ├── 07_EXECUTION/           # WBS, Sprint plans, Phase Alpha–Delta
│   └── 08_TESTING/             # Test specs, Coverage matrices
├── memory-bank/                # Project memory (active context, progress, decisions)
├── docker-compose.yml          # Postgres + Redis + MinIO + pgAdmin
├── package.json                # Root: pnpm workspace, Turborepo scripts
├── turbo.json                  # Turborepo task pipeline
├── DECISIONS.log               # Architectural Decision Register (1751 строк)
└── DOC_STRUCTURE.md            # Documentation taxonomy
```

---

## Appendix B: Evidence Map

| Тезис | Файлы-подтверждения |
|---|---|
| Multi-tenant isolation через `companyId` в JWT | `memory-bank/techContext.md`, `DECISIONS.log` (ARCH-DEBT-001), `apps/api/src/shared/tenant-context/`, `packages/eslint-plugin-tenant-security/` |
| Event-driven architecture + Outbox | `apps/api/src/shared/outbox/`, `apps/api/src/modules/agro-events/` |
| Append-only Ledger (LedgerEntry) | `DECISIONS.log` (PHASE0-CORE-001), `packages/prisma-client/schema.prisma` (model LedgerEntry), `scripts/add-ledger-trigger.ts` |
| 16 стадий APL для рапса | `packages/agro-orchestrator/src/Orchestrator.ts`, `packages/agro-orchestrator/src/presets/` |
| Season FSM (PLANNING→CLOSED) | `packages/prisma-client/schema.prisma` (enum SeasonStatus), `apps/api/src/modules/season/` |
| TechMap Engine | `apps/api/src/modules/tech-map/` (61 файл), `schema.prisma` (model TechMap, PlannedOperation, etc.) |
| Агроконсалтинг как бизнес-модель | `docs/00_STRATEGY/Описание логики бизнеса.md`, `docs/00_STRATEGY/BUSINESS/RAI STRATEGY v3.0.md` |
| Поставка СЗР, производство «Грипил» | `docs/00_STRATEGY/Описание логики бизнеса.md` |
| Level A–F Cognitive Evolution | `docs/00_STRATEGY/EVOLUTION_ARCHITECTURE_MASTER_A_TO_F.md` |
| Level B: Generative Engine (67 тестов, PBT) | `DECISIONS.log` (LEVEL-B-GEN-001), `apps/api/src/modules/generative-engine/` (73 файла), `apps/api/test/generative-engine.*.spec.ts` |
| Level C: Contradiction Resilience | `DECISIONS.log` (LEVEL-C-GEN-001), `docs/02_DOMAINS/AGRO_DOMAIN/COUNTERFACTUAL_ENGINE_SPEC.md` |
| Level D: Adaptive Self-Learning | `docs/LEVEL_D_ARCHITECTURE.md`, `schema.prisma` (ModelVersion, TrainingRun, DriftReport, LearningEvent) |
| Level E: Regenerative Optimization | `packages/regenerative-engine/`, `schema.prisma` (SoilMetric, SustainabilityBaseline, BiodiversityMetric, GovernanceLock) |
| Level F: Trust Layer (mTLS, WORM, Crypto) | `DECISIONS.log` (LEVEL-F-HARDENING-001), `apps/api/src/level-f/`, `docs/01_ARCHITECTURE/LEVEL_F/` (12 документов) |
| Human-in-the-Loop (AI Advisory) | `README.md` (оригинальный), `docs/01_ARCHITECTURE/PRINCIPLES/CANON.md`, `domain-rai/README.md` |
| Supervisor Agent + Multi-Agent | `apps/api/src/modules/rai-chat/supervisor-agent.service.*`, `memory-bank/activeContext.md` |
| Unified Memory (Redis + pgvector + Knowledge Graph) | `apps/api/src/shared/memory/`, `packages/vector-store/`, `apps/api/src/modules/knowledge-graph/` |
| Truthfulness Engine + TraceSummary | `apps/api/src/modules/rai-chat/truthfulness-engine.service.*`, `trace-summary.service.*` |
| 54+ unit test files | `find apps/api/src -name "*.spec.ts"` → 54 результата |
| Property-Based Testing | `apps/api/test/generative-engine.pbt.spec.ts` |
| Docker: Postgres + PostGIS + pgvector | `docker-compose.yml`, `infra/postgres/Dockerfile`, `infra/SECURITY.md` |
| NestJS + Next.js 14 stack | `apps/api/package.json`, `apps/web/package.json` |
| CANON.md как высший нормативный акт | `docs/01_ARCHITECTURE/PRINCIPLES/CANON.md` |
| DECISIONS.log как обязательный Decision Register | `DECISIONS.log` (1751 строка) |
| Success Metrics (KPI) | `docs/00_STRATEGY/SUCCESS_METRICS.md` |
| Consulting module in code | `apps/api/src/modules/consulting/` (40 файлов), `apps/web/app/consulting/` (35 файлов) |
| Commerce (Party, Contracts, Invoices) | `apps/api/src/modules/commerce/` (34 файла), `schema.prisma` (Party, CommerceContract, Invoice, Payment) |
| Не найдено: gRPC / NATS | Упоминается в `docs/01_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`, но нет зависимостей в `package.json` |
| Не найдено: Kubernetes (production) | `infra/helm/` содержит минимальные чарты, нет CI/CD pipeline |
| Не найдено: React Native | Упоминается в стратегии, кода нет |
| Не найдено: CI/CD pipeline файлы | `.github/workflows/` — пусто |

---

*Сгенерировано на основе полного анализа репозитория. Каждое утверждение подтверждено файлами из Evidence Map.*
