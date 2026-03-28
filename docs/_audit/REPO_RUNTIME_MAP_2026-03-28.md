---
id: DOC-ARV-AUDIT-REPO-RUNTIME-MAP-20260328
layer: Archive
type: Research
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
---
# REPO RUNTIME MAP 2026-03-28

## 1. Scope

### Входит в основной аудит

- `apps/api`
- `apps/web`
- `apps/telegram-bot`
- `packages/*`
- `infra/*`
- root scripts / workflows / manifests
- canonical docs + relevant `memory-bank` / `interagency`

### Исключено из зрелости продукта

- `apps/gripil-web`
- `apps/gripil-web-awwwards`

Их влияние на workspace, docs drift и hygiene всё равно фиксируется как repo-level side effect.

## 2. Active Runtime Components

| Путь | Роль | Текущее состояние |
|---|---|---|
| `apps/api` | основной backend | активный runtime; `build` PASS; `test` FAIL |
| `apps/web` | основной frontend | активный runtime; `build` FAIL; `test` FAIL |
| `apps/telegram-bot` | telegram runtime | активный runtime; `build` PASS; `test` PASS |
| `packages/prisma-client` | shared DB client/schema | активен как shared infra artifact; validation завязана на env |
| `packages/agro-orchestrator` | shared domain package | explicit `check-types` PASS |
| `packages/legal-engine`, `vector-store`, `rd-engine`, `regenerative-engine`, `risk-engine` | shared packages | используются как support/shared layers разной зрелости |
| `infra/postgres`, `infra/gateway`, `infra/monitoring`, `infra/helm` | infra and deployment assets | частично активны, но launch-readiness не доказан |

## 3. Support-Only / Context / Legacy Zones

| Путь | Класс | Комментарий |
|---|---|---|
| `docs/06_ARCHIVE` | historical context | не operational truth |
| `docs/_audit` | audit/research package | dated research/evidence |
| `memory-bank` | working context | важен как execution memory, не runtime truth |
| `interagency` | reports/prompts | полезный implementation evidence |
| `mg-core`, `inference`, `ingestion`, `telegram`, `risk-engine` root | context / bridge / older slices | не доказательство production readiness основного контура |

## 4. Entry Points

| Surface | Endpoint / Path | Evidence |
|---|---|---|
| Web | `http://localhost:3000` | root `README.md`, `apps/web` |
| API | `http://localhost:4000/api` | `apps/api/src/main.ts` |
| Swagger | `http://localhost:4000/api/docs` | `apps/api/src/main.ts` |
| Telegram runtime | `http://localhost:4002` | `apps/telegram-bot/src/main.ts` |
| Postgres | `localhost:5432` | root `README.md`, `docker-compose.yml` |
| Redis | `localhost:6379` | root `README.md` |
| MinIO | `http://localhost:9000` / `:9001` | root `README.md` |

## 5. CI / Governance Surfaces

| Артефакт | Роль |
|---|---|
| `.github/workflows/invariant-gates.yml` | canonical gate pack |
| `.github/workflows/security-audit.yml` | dependency audit workflow |
| `scripts/invariant-gate.cjs` | docs + guards + raw SQL + tenant/FSM entrypoint |
| `scripts/check-*.cjs` DB family | schema governance controls |
| `scripts/lint-docs.cjs` / `scripts/doc-lint-matrix.cjs` | docs-as-code governance |

## 6. Shadow / Drift Findings

1. В workspace присутствуют excluded Gripil-приложения, которых нет в главном runtime baseline, но они влияют на docs и operational noise.
2. `apps/web` содержит `.next`, `node_modules`, `.env.local` как локальные артефакты; они игнорируются Git, но важны для hygiene review.
3. `gate:db:phase3` и `gate:db:growth-kpi` имеют побочные генеративные эффекты на tracked artifacts; это operational nuance для audit/release discipline.
4. `apps/api` и `apps/web` выглядят значительно более функционально насыщенными, чем их текущий green baseline по quality.
