# RAI_EP

> Состояние репозитория: `2026-03-24`
>
> Source of truth: `code/tests/gates > generated manifests > docs`

RAI_EP — это `pnpm`/`Turborepo` monorepo для multi-tenant платформы управления операциями, финансами, полевым контуром и AI-assisted workflow в агродомене.

Этот `README` описывает текущее состояние репозитория по коду. Он не должен использоваться как стратегический манифест, release-note или маркетинговый документ. Исторические и dated-материалы вынесены в архивную документацию.

## Что здесь реально активно

| Путь | Роль | Текущее значение |
| --- | --- | --- |
| `apps/api` | Основной backend | NestJS API с доменными модулями, tenant-context, audit, outbox, GraphQL, Swagger, BullMQ и Level F срезами |
| `apps/web` | Основной frontend | Next.js 14 App Router приложение с рабочими маршрутами для CRM, finance, HR, control tower, front-office, consulting и forensic surfaces |
| `apps/telegram-bot` | Telegram runtime | Отдельный NestJS/Telegraf runtime для bot flow и интеграции с основной платформой |
| `packages/*` | Общие пакеты | Prisma client, agro orchestrator, legal engine, risk engine, vector store, regenerative и R&D пакеты |
| `docs/*` | Docs-as-code контур | Canonical index, claims matrix, governance contract, audit artifacts и archive topology |
| `infra/*` | Локальная инфраструктура и gateway-конфиги | Dockerfile для Postgres/PostGIS/pgvector, monitoring rules, gateway config, минимальные Helm charts |

## Что считать системой, а что контекстом

Основная runtime-система в этом репозитории — это связка `apps/api + apps/web + apps/telegram-bot + packages/* + infra/*`.

В репозитории также есть смежные или исторические директории: `inference`, `ingestion`, `mg-core`, `interagency`, `memory-bank`, `brain`, standalone `risk-engine`, `telegram`. Они важны как контекст, интеграционный слой, архив или поддерживающая рабочая среда, но сами по себе не являются доказательством того, что функция «в проде и готова». Любой такой тезис проверяется только через код, тесты и гейты.

## Подтверждённые функциональные срезы

### Бизнес-операции

В `apps/api` и `apps/web` есть рабочие поверхности для:

- `crm`, `cmr`, `commerce`
- `finance-economy`
- `hr`
- `legal`
- `strategic`, `rd`, `exploration`

### Полевые операции

В коде присутствуют и wired в `AppModule`:

- `field-registry`
- `season`
- `task`
- `technology-card`
- `tech-map`
- `agro-orchestrator`
- `agro-events`
- `field-observation`
- `front-office`, `front-office-draft`
- `vision`, `satellite`
- `consulting`

### AI, Агентная платформа и governance

Система реализует Stage 2 — гибридный Agent-First Governed Runtime. В коде присутствуют:

- `rai-chat` — интерфейс взаимодействия с AI-агентами
- `advisory`, `shadow-advisory` — пилотный слой рекомендаций с обязательным человеческим утверждением
- `explainability`, `adaptive-learning` — объяснение решений, дообучение на фидбеке
- `knowledge`, `knowledge-graph` — корпоративная база знаний (RAG / Engram Memory)
- `integrity`, `level-f/gateway`, `level-f/crypto`, `level-f/worm`, `level-f/snapshot`, `level-f/certification` — инварианты целостности

Референсные агенты MVP-4 (уже в коде): `AgronomAgent`, `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`.

Важно: наличие модуля в репозитории не равно blanket-утверждению «полностью production-ready». Граница доверия проходит по `tests`, `lint`, `gate:*` и реальному wiring в приложении.

## Технологический контур

| Слой | Реальность в репо |
| --- | --- |
| Backend | NestJS 10, REST с global prefix `/api`, Swagger в non-production, GraphQL через Apollo, BullMQ, EventEmitter |
| Frontend | Next.js 14, React 18, Tailwind, Zustand, XState, React Query |
| Data | PostgreSQL + PostGIS + pgvector, Prisma shared client и schema fragments |
| Infra | Redis, MinIO, Docker Compose, gateway config, monitoring rules |
| Governance | tenant-context lint, invariant gates, docs-as-code lint, CI workflows в `.github/workflows/` |

## Ключевые runtime entrypoints

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- pgAdmin: `http://localhost:8081`

API стартует на порту `4000` в [`apps/api/src/main.ts`](apps/api/src/main.ts). Любые упоминания порта `3001` считаются устаревшими.

## Быстрый старт

### Требования

- Node.js `>= 20`
- `pnpm@9`
- Docker + Docker Compose

### Локальный запуск

```bash
cp .env.example .env
docker-compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

Что это делает:

- поднимает `Postgres + Redis + MinIO + pgAdmin`
- устанавливает workspace dependencies
- генерирует Prisma client через `postinstall`
- запускает workspace `dev`-скрипты через `turbo`

## Команды

### Основные

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | Запускает workspace dev scripts через Turborepo |
| `pnpm build` | Сборка всех активных workspace targets |
| `pnpm test` | Общий прогон тестов через Turbo |
| `pnpm docker:up` | Поднимает локальную инфраструктуру |
| `pnpm docker:down` | Останавливает локальную инфраструктуру |

### База данных и схема

| Команда | Что делает |
| --- | --- |
| `pnpm db:client` | Перегенерация Prisma client |
| `pnpm db:migrate` | Прогон миграций по workspace |
| `pnpm db:seed` | Заполнение БД начальными данными |

### Гейты и линтеры

| Команда | Что делает |
| --- | --- |
| `pnpm gate:invariants` | Проверка системных инвариантов |
| `pnpm gate:rollout` | Проверка rollout guard |
| `pnpm gate:routing:primary-slices` | Проверка routing/AI slices |
| `pnpm gate:architecture` | Проверка architecture budget |
| `pnpm gate:db:scope` | Проверка scope-manifest доменов |
| `pnpm gate:db:ownership` | Проверка ownership-manifest |
| `pnpm gate:db:forbidden-relations` | Проверка запрещённых DB-связей |
| `pnpm gate:db:phase0` | Phase-0 DB gate |
| `pnpm gate:db:phase3` | Phase-3 DB gate |
| `pnpm gate:db:projections` | Проверка projection register |
| `pnpm lint:tenant-context` | Проверка tenant isolation contract |
| `pnpm lint:fsm-status-updates` | Проверка корректности FSM-обновлений |
| `pnpm lint:docs` | Единый docs lint контур |
| `pnpm lint:docs:matrix:strict` | Жёсткая проверка docs matrix и версий |

## Документация

Документация переведена в docs-as-code режим. Слои разделены по роли:

- **Verified operational canon:** `00_CORE`, `01_ARCHITECTURE`, `04_AI_SYSTEM`, `05_OPERATIONS`
- **Active design & planning:** `00_STRATEGY`, `02_DOMAINS`, `02_PRODUCT`, `03_ENGINEERING`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS`
- **Historical / raw context:** `06_ARCHIVE`

Точки входа:

- [docs/README.md](docs/README.md) — навигационный entrypoint
- [docs/INDEX.md](docs/INDEX.md) — canonical index
- [docs/DOCS_MATRIX.md](docs/DOCS_MATRIX.md) — реестр claims
- [docs/CONTRIBUTING_DOCS.md](docs/CONTRIBUTING_DOCS.md) — правила изменения документации
- [docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM.md](docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ%20ОПИСАНИЕ%20RAI%20ENTERPRISE%20PLATFORM.md) — генеральное описание платформы v2.0
- [docs/11_INSTRUCTIONS/](docs/11_INSTRUCTIONS/) — активные инструкции и agent playbook
- [docs/05_OPERATIONS/DOC_FRESHNESS_SLA.md](docs/05_OPERATIONS/DOC_FRESHNESS_SLA.md) — freshness policy
- [docs/_audit/FINAL_AUDIT_2026-03-20.md](docs/_audit/FINAL_AUDIT_2026-03-20.md) — полный аудит и вердикт
- [docs/06_ARCHIVE/](docs/06_ARCHIVE/) — архив старых, dated и non-canonical материалов

Если `README`, отдельный документ и код спорят между собой, правильный порядок решения спора:

1. Код, тесты и гейты
2. Generated manifests и schema artifacts
3. Актуальные canonical docs
4. Архив и исторические материалы

## Ключевая структура репозитория

```text
RAI_EP/
├── apps/
│   ├── api/
│   ├── web/
│   └── telegram-bot/
├── packages/
│   ├── prisma-client/
│   ├── agro-orchestrator/
│   ├── legal-engine/
│   ├── rd-engine/
│   ├── regenerative-engine/
│   ├── risk-engine/
│   ├── vector-store/
│   └── eslint-plugin-tenant-security/
├── contracts/
├── docs/
│   ├── 00_CORE/
│   ├── 00_STRATEGY/
│   ├── 01_ARCHITECTURE/
│   ├── 02_DOMAINS/
│   ├── 02_PRODUCT/
│   ├── 03_ENGINEERING/
│   ├── 04_AI_SYSTEM/
│   ├── 05_OPERATIONS/
│   ├── 06_METRICS/
│   ├── 07_EXECUTION/
│   ├── 08_TESTING/
│   ├── 10_FRONTEND_MENU_IMPLEMENTATION/
│   ├── 11_INSTRUCTIONS/
│   ├── 06_ARCHIVE/
│   └── _audit/
├── infra/
├── scripts/
├── inference/
├── ingestion/
├── interagency/
├── memory-bank/
├── mg-core/
└── docker-compose.yml
```

## Границы доверия

- Не опирайся на старые phase-лейблы, roadmap-обещания и dated-аудиты как на спецификацию поведения системы.
- Не считай папку с промптами, архивом или исследованием доказательством внедрённой функциональности.
- Не используй `docs/06_ARCHIVE/` для формулирования текущих системных инвариантов.
- Для утверждений о multi-tenant безопасности, FSM, Level F, AI runtime и документации используй только код, тесты и соответствующие `gate:*` / `lint:*` команды.

## Что этот README должен делать

Этот файл отвечает только на четыре вопроса:

1. Что такое репозиторий прямо сейчас.
2. Какие entrypoints и контуры у него реально есть.
3. Как его поднять и проверить.
4. Где лежит operational truth.

Если для ответа нужен большой нарратив, стратегия или исторический контекст, его нужно искать в `docs/`, а не раздувать этот `README`.
