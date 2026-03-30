# 02. Architecture And Runtime

## Архитектурная идея в одной фразе

Архитектура `RAI_EP` строится не вокруг интерфейсов и не вокруг AI, а вокруг управляемого доменного ядра, где `TechMap` является центральным исполнимым артефактом, а AI подключён как governed усилитель.

## Подтверждённая реальность сейчас

### Активные runtime-контуры

- `apps/api` — основной backend на `NestJS`.
- `apps/web` — основной frontend на `Next.js 14`.
- `apps/telegram-bot` — отдельный Telegram runtime.
- `packages/*` — shared packages, включая Prisma client, agro/domain-support и legal/risk/vector contours.
- `infra/*` — локальная инфраструктура, gateway-конфиги, monitoring rules и базовые deployment assets.

### Технологический baseline

- Backend: `NestJS`, REST, Swagger, GraphQL, BullMQ, EventEmitter.
- Frontend: `Next.js 14`, `React 18`, Tailwind, Zustand, XState, React Query.
- Data: `PostgreSQL`, `PostGIS`, `pgvector`, Prisma shared client/schema.
- Infra: Redis, MinIO, Docker Compose, gateway and monitoring assets.
- Governance: tenant-context lint, invariant gates, DB gates, docs-as-code lint, security/legal scripts.

### Подтверждённые входные точки

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- Telegram runtime: `http://localhost:4002`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `http://localhost:9000`

## Целевая архитектурная модель

### 7 слоёв системы

1. Interaction Layer: web, telegram, operator surfaces, admin surfaces.
2. Governed Application Layer: auth, tenant context, routing, policy enforcement, orchestration.
3. Core Domain Layer: `TechMap`, season execution, finance/economy, risks, CRM/front-office entities.
4. AI / Agent Runtime Layer: routing, governed tools, evidence-first generation, uncertainty handling, `HITL`.
5. Data / Evidence / Audit Layer: primary data, explainability traces, incidents, immutable evidence artifacts.
6. Governance / Security / Compliance Layer: release gates, secrets, licenses, SBOM, privacy/legal controls.
7. Deployment / Operations Layer: `self-host`, managed deployment, backup/restore, DR, installability, support boundaries.

### Главная архитектурная ось

`Interaction -> Application Governance -> Domain Core -> Evidence/Audit -> Release/Operations`

AI подключается к этой оси как governed runtime layer, а не как параллельная система принятия решений.

## Governed AI runtime

### Что подтверждено как принцип

- AI в проекте advisory-first.
- High-impact flows не должны обходить `HITL`.
- Tool access должен быть ограничен allowlist/per-route policy.
- Evidence, uncertainty и incident discipline являются обязательной частью release-ready AI runtime.

### Что это означает для разработчика

- Нельзя проектировать AI-функцию как свободный write-path.
- Любая agent/autonomy логика должна быть связана с policy, logging, explainability и fallback rules.
- Нельзя выносить domain logic в prompt-only слой.

## Основной реалистичный deployment path

- Приоритетный путь: `self-host / localized`.
- `Managed deployment` рассматривается как частично близкий, но ещё не полностью закрытый путь.
- `External SaaS` и `hybrid` нельзя считать честно готовыми без отдельного legal/data-boundary closeout.

## Минимальный local bootstrap

```bash
cp .env.example .env
docker-compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

## С чего входить в код

- `apps/api/src/modules/tech-map` — центральный доменный контур `TechMap`.
- `apps/api/src/modules/rai-chat` — governed AI/runtime, routing, agents, tools, eval, governance.
- `apps/web` и связанные `ai-chat` / consulting / front-office surfaces — минимальная web-поверхность вокруг governed runtime.

## Открытые gaps и ограничения

- Не все target-архитектурные слои одинаково доведены до release-grade состояния.
- installability, backup/restore evidence, support boundary и часть external deployment evidence остаются незавершёнными.
- Архитектурно система тяготеет к strong core, но продукт легко можно размазать, если начинать расширять UI breadth быстрее, чем закрывается governed core.

## Source anchors

- `docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
- `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
- `docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md`
- `README.md`
