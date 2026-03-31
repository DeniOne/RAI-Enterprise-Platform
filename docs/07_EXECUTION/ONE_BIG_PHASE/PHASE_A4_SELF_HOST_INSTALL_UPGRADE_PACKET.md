---
id: DOC-EXE-ONE-BIG-PHASE-A4-SELF-HOST-INSTALL-UPGRADE-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-SELF-HOST-INSTALL-UPGRADE-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: README.md;docker-compose.yml;.env.example;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;apps/api/src/app.module.ts
---
# PHASE A4 SELF-HOST INSTALL UPGRADE PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-SELF-HOST-INSTALL-UPGRADE-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует минимальный install/upgrade baseline для `Tier 1 self-host / localized MVP pilot` по тому, что уже подтверждено в репозитории.

## 1. Минимальные prerequisites

- `Node.js >= 20`
- `pnpm@9`
- `Docker + Docker Compose`
- локальный доступ к портам:
  - `5432` PostgreSQL
  - `6379` Redis
  - `9000/9001` MinIO
  - `8081` pgAdmin

## 2. Минимальные runtime-компоненты

| Компонент | Источник | Что обязано быть поднято |
|---|---|---|
| PostgreSQL | [docker-compose.yml](/root/RAI_EP/docker-compose.yml) | основная БД |
| Redis | [docker-compose.yml](/root/RAI_EP/docker-compose.yml) | cache/runtime state |
| MinIO | [docker-compose.yml](/root/RAI_EP/docker-compose.yml) | S3-compatible storage |
| API env contract | [app.module.ts](/root/RAI_EP/apps/api/src/app.module.ts) | `DATABASE_URL`, Redis, MinIO, JWT, WORM vars |

## 3. Минимальный bootstrap path

1. Скопировать `.env.example` в локальный `.env`.
2. Поднять infra через `docker-compose up -d`.
3. Выполнить `pnpm install`.
4. Выполнить `pnpm db:migrate`.
5. Проверить сборку:
   - `pnpm --filter api build`
   - `pnpm --filter web build`
6. Только после этого переходить к runtime запуску (`pnpm dev` для local dev path).

## 4. Минимальный env perimeter

### Обязательные переменные

- `DATABASE_URL`
- `REDIS_URL`
- `MINIO_ENDPOINT`
- `MINIO_PORT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_BUCKET_NAME`
- `JWT_SECRET`
- `RAI_HUMAN_CONFIRMATION_ENABLED`

### Дополнительные, но важные для governed/audit path

- `AUDIT_WORM_PROVIDER`
- `WORM_S3_BUCKET`
- `WORM_S3_PREFIX`
- `WORM_S3_OBJECT_LOCK_REQUIRED`
- `WORM_S3_RETENTION_MODE`
- `WORM_S3_RETENTION_YEARS`

### Пилот-специфичные внешние контуры

- `TELEGRAM_BOT_TOKEN`
- `DADATA_API_KEY`
- `DADATA_SECRET_KEY`
- `SENTRY_DSN`

Для `Tier 1` эти значения не должны храниться в Git и должны выдаваться через controlled secret bootstrap.

## 5. Что уже подтверждено

- local `self-host` path через Docker реально описан в [README.md](/root/RAI_EP/README.md) и [docker-compose.yml](/root/RAI_EP/docker-compose.yml)
- env contract API явно описан в [app.module.ts](/root/RAI_EP/apps/api/src/app.module.ts)
- self-host / localized path признан целевым в [HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md](/root/RAI_EP/docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md)

## 6. Что ещё не подтверждено

- production-grade installer или one-command bootstrap
- upgrade path с обратной совместимостью
- фактический dry-run install report
- secrets bootstrap evidence вне Git

Поэтому этот packet переводит `A4.1` в рабочий execution-state, но не закрывает `A4` полностью.
