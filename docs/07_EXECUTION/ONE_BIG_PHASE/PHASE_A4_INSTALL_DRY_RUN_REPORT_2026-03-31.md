---
id: DOC-EXE-ONE-BIG-PHASE-A4-INSTALL-DRY-RUN-REPORT-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-INSTALL-DRY-RUN-REPORT-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/ops/phase-a4-install-dry-run-2026-03-31.json;var/ops/phase-a4-env-example-bootstrap-2026-03-31.json;var/schema/prisma-migrate-safe.json;README.md;package.json;scripts/prisma-migrate-safe.cjs;docker-compose.yml;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md
---
# PHASE A4 INSTALL DRY-RUN REPORT 2026-03-31

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-INSTALL-DRY-RUN-REPORT-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот отчёт фиксирует реальный dry-run `A4`, а не просто наличие install packet.

## 1. Dry-run metadata

- Date: `2026-03-31`
- Operator: `codex`
- Branch: `main`
- Target mode: `self-host / localized`
- Supporting artifacts:
  - [phase-a4-install-dry-run-2026-03-31.json](/root/RAI_EP/var/ops/phase-a4-install-dry-run-2026-03-31.json)
  - [phase-a4-env-example-bootstrap-2026-03-31.json](/root/RAI_EP/var/ops/phase-a4-env-example-bootstrap-2026-03-31.json)
  - [prisma-migrate-safe.json](/root/RAI_EP/var/schema/prisma-migrate-safe.json)

## 2. Preconditions

- `.env` уже существовал в локальной среде до dry-run.
- Core infra уже была поднята:
  - `rai-postgres`
  - `rai-redis`
  - `rai-minio`
  - `rai-pgadmin`
- `http://localhost:4000/api/docs` отвечал `200`.
- `Node.js = v22.10.0`, `pnpm = 9.0.0`.
- позже в той же сессии отдельный bootstrap-pass был прогнан через shell env, загруженный из `.env.example`, без опоры на root `.env`.

## 3. Executed steps

| Шаг | Команда / действие | Результат | Проблема / заметка |
|---|---|---|---|
| 1 | `cp .env.example .env` | `SKIPPED_EXISTING_ENV` | свежий bootstrap `.env` на пустом хосте не проверялся |
| 2 | `pnpm docker:up` | `PASS` | root script был ремедиирован с `docker-compose` на `docker compose`; остался warning про obsolete `version` в `docker-compose.yml` |
| 3 | `pnpm install --frozen-lockfile` | `PASS` | Prisma client сгенерирован |
| 4 | `pnpm db:migrate` | `PASS` | root entrypoint ремедиирован через [prisma-migrate-safe.cjs](/root/RAI_EP/scripts/prisma-migrate-safe.cjs) с загрузкой `.env` |
| 5 | `pnpm --filter api build` | `PASS` | Nest build зелёный |
| 6 | `pnpm --filter web build` | `PASS` | Next build зелёный; warning про deprecated `middleware -> proxy` остаётся |
| 7 | `set -a; source .env.example; set +a; pnpm db:migrate && pnpm --filter api build && pnpm --filter web build` | `PASS` | root `.env` больше не является обязательным bootstrap-зависимым слоем; при этом `apps/web/.env.local` всё ещё существовал в локальной среде |

## 4. Hidden knowledge found

- Изначально documented path был неверным:
  - `docker-compose up -d` не работал в этой среде;
  - корневой `pnpm db:migrate` не был operationally safe.
- В ходе этого dry-run repo-side drift был исправлен:
  - `package.json` переведён на `docker compose`
  - добавлен [prisma-migrate-safe.cjs](/root/RAI_EP/scripts/prisma-migrate-safe.cjs)
  - [README.md](/root/RAI_EP/README.md) и [PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md) синхронизированы
- Dry-run проходил не на blank host:
  - `.env` уже существовал
  - контейнеры уже были подняты
- Дополнительный bootstrap-pass сузил hidden knowledge:
  - root `.env` больше не является обязательным условием для `db:migrate + api build + web build`
  - obsolete warning про `version` в `docker-compose.yml` устранён удалением устаревшего поля
- Но hidden knowledge не обнулён полностью:
  - `apps/web/.env.local` существовал во время web build
  - blank-host / no-app-local-env rehearsal всё ещё отдельно не доказан
- DB credentials и target DB были выведены из live container environment:
  - `rai_admin`
  - `rai_platform`

## 5. Verdict

- Install path reproducible: `PARTIAL PASS`
- Что подтверждено:
  - repo entrypoint `pnpm docker:up` рабочий
  - repo entrypoint `pnpm db:migrate` рабочий
  - `api` и `web` собираются после install/migrate path
- Что ещё не подтверждено:
  - установка на чистом хосте с нуля
  - full bootstrap без `apps/web/.env.local`
  - secrets bootstrap вне уже существующего `.env` и app-local env residue
  - полное отсутствие hidden knowledge при fresh install
- Blocking gaps:
  - нет blank-host rehearsal без root/app-local env residue
  - support boundary и pilot handoff всё ещё закрываются отдельно

## 6. Decision impact

Этот dry-run:

- переводит `A4.1` в состояние `done` для repo-side install packet;
- усиливает `A4.3`, потому что hidden knowledge теперь не просто подозревается, а перечислено по факту;
- не закрывает `A4` полностью, потому что clean-host installability и operational handoff ещё не подтверждены.
