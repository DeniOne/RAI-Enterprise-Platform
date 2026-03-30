# 02. Architecture And Runtime

## Architecture In One Sentence

`RAI_EP` is not architected around interfaces and not around AI. It is built around a governed domain core where `TechMap` is the central executable artifact and AI is attached as a governed amplifier.

## What Is Verified Now

### Active Runtime Contours

- `apps/api` — the main backend built on `NestJS`.
- `apps/web` — the main frontend built on `Next.js 14`.
- `apps/telegram-bot` — a separate Telegram runtime.
- `packages/*` — shared packages, including Prisma client, agro/domain support, and legal/risk/vector contours.
- `infra/*` — local infrastructure, gateway configs, monitoring rules, and baseline deployment assets.

### Technology Baseline

- Backend: `NestJS`, REST, Swagger, GraphQL, BullMQ, EventEmitter.
- Frontend: `Next.js 14`, `React 18`, Tailwind, Zustand, XState, React Query.
- Data: `PostgreSQL`, `PostGIS`, `pgvector`, Prisma shared client/schema.
- Infra: Redis, MinIO, Docker Compose, gateway and monitoring assets.
- Governance: tenant-context lint, invariant gates, DB gates, docs-as-code lint, security/legal scripts.

### Confirmed Entry Points

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- Telegram runtime: `http://localhost:4002`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `http://localhost:9000`

## Target Architecture Model

### Seven System Layers

1. Interaction Layer: web, telegram, operator surfaces, admin surfaces.
2. Governed Application Layer: auth, tenant context, routing, policy enforcement, orchestration.
3. Core Domain Layer: `TechMap`, season execution, finance/economy, risks, CRM/front-office entities.
4. AI / Agent Runtime Layer: routing, governed tools, evidence-first generation, uncertainty handling, `HITL`.
5. Data / Evidence / Audit Layer: primary data, explainability traces, incidents, immutable evidence artifacts.
6. Governance / Security / Compliance Layer: release gates, secrets, licenses, SBOM, privacy/legal controls.
7. Deployment / Operations Layer: `self-host`, managed deployment, backup/restore, DR, installability, support boundaries.

### Main Architectural Axis

`Interaction -> Application Governance -> Domain Core -> Evidence/Audit -> Release/Operations`

AI plugs into this axis as a governed runtime layer, not as a parallel decision-making system.

## Governed AI Runtime

### What Is Established As Principle

- AI in the project is advisory-first.
- High-impact flows must not bypass `HITL`.
- Tool access must stay restricted by allowlist and per-route policy.
- Evidence, uncertainty handling, and incident discipline are mandatory parts of a release-ready AI runtime.

### What This Means For A Developer

- An AI feature must not be designed as an unrestricted write path.
- Any agent/autonomy logic must be tied to policy, logging, explainability, and fallback rules.
- Domain logic must not be moved into a prompt-only layer.

## Main Realistic Deployment Path

- Priority path: `self-host / localized`.
- `Managed deployment` is considered technically plausible but not yet fully closed.
- `External SaaS` and `hybrid` variants are not honest readiness claims until legal and data-boundary closeout is complete.

## Minimal Local Bootstrap

```bash
cp .env.example .env
docker-compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

## Where To Enter The Codebase First

- `apps/api/src/modules/tech-map` — the central `TechMap` domain contour.
- `apps/api/src/modules/rai-chat` — governed AI/runtime, routing, agents, tools, eval, and runtime governance.
- `apps/web` plus the related `ai-chat` / consulting / front-office surfaces — the minimal web layer around the governed runtime.

## Open Gaps And Constraints

- Not all target architecture layers are equally close to release-grade maturity.
- Installability, backup/restore evidence, support boundary, and parts of external deployment evidence remain incomplete.
- Architecturally the system is oriented toward a strong core, but it can easily get diluted if UI breadth expands faster than the governed core is closed.

## Source Anchors

- `docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
- `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
- `docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md`
- `README.md`
