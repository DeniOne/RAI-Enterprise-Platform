---
id: DOC-EXE-ONE-BIG-PHASE-A4-BLANK-WORKTREE-BOOTSTRAP-REPORT-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-BLANK-WORKTREE-BOOTSTRAP-REPORT-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/ops/phase-a4-blank-worktree-bootstrap-2026-03-31.json;.env.example;README.md;docker-compose.yml;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md;package.json
---
# PHASE A4 BLANK WORKTREE BOOTSTRAP REPORT 2026-03-31

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-BLANK-WORKTREE-BOOTSTRAP-REPORT-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот отчёт фиксирует отдельный `A4` rehearsal, который закрывает именно hidden-knowledge gap по env residue. Это не новый “общий dry-run”, а проверка того, что install path повторяется в чистой копии рабочего дерева без локальных env-файлов.

## 1. Rehearsal metadata

- Date: `2026-03-31`
- Operator: `codex`
- Mode: `blank-worktree-bootstrap`
- Target tier: `Tier 1 self-host / localized MVP pilot`
- Generated evidence:
  - [phase-a4-blank-worktree-bootstrap-2026-03-31.json](/root/RAI_EP/var/ops/phase-a4-blank-worktree-bootstrap-2026-03-31.json)

## 2. Preconditions

- Bootstrap выполнялся в отдельной копии рабочего дерева.
- В rehearsal-копии отсутствовали:
  - root `.env`
  - `apps/web/.env.local`
- Для env bootstrap использовался только `.env.example`.
- Для localhost services использовалась уже доступная локальная infra на стандартных портах:
  - `PostgreSQL`
  - `Redis`
  - `MinIO`
  - `pgAdmin`

Важно:

- этот rehearsal закрывает hidden knowledge по env/bootstrap path;
- он не равен отдельному bare-metal/fresh-host provisioning на чистой машине;
- singleton localhost infra остаётся ограничением текущего локального стенда, а не installability drift внутри репозитория.

## 3. Executed steps

| Шаг | Команда / действие | Результат | Примечание |
|---|---|---|---|
| 1 | создать отдельную копию рабочего дерева без `.env` и без `apps/web/.env.local` | `PASS` | hidden env residue исключён заранее |
| 2 | `pnpm install --frozen-lockfile` | `PASS` | workspace bootstrap прошёл в чистой копии |
| 3 | `set -a; source .env.example; set +a; pnpm db:migrate` | `PASS` | root `.env` не потребовался |
| 4 | `pnpm --filter api build` | `PASS` | API build подтверждён от env из `.env.example` |
| 5 | `pnpm --filter web build` | `PASS` | web build подтверждён без `apps/web/.env.local` |

## 4. What changed relative to previous A4 evidence

Относительно [PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md) теперь подтверждено дополнительно:

- root `.env` не является обязательным условием bootstrap для `db:migrate`;
- `apps/web/.env.local` не является обязательным условием `web build`;
- web/API connectivity contract может жить в корневом `.env.example`, а не в локальном residue;
- install path повторяется в чистой копии рабочего дерева без опоры на память автора.

Repo-side drift, который пришлось устранить для этого rehearsal:

- из [docker-compose.yml](/root/RAI_EP/docker-compose.yml) убраны фиксированные `container_name`, чтобы self-host packet не навязывал глобальные container names;
- в [.env.example](/root/RAI_EP/.env.example) добавлены:
  - `BACKEND_URL`
  - `NEXT_PUBLIC_API_URL`

## 5. Verdict

- Blank-worktree bootstrap reproducible: `PASS`
- Hidden env knowledge: `CLOSED` для repo-side `Tier 1` bootstrap perimeter
- Что подтверждено:
  - install path воспроизводим без root `.env`
  - web build воспроизводим без `apps/web/.env.local`
  - `.env.example` достаточно как bootstrap source для app/runtime env contract
- Что ещё не подтверждено:
  - отдельный fresh-host provisioning на новой машине
  - реальный pilot handoff по support boundary

## 6. Decision impact

Этот rehearsal:

- переводит `A-2.5.3` в `done` для внутреннего `Phase A` repo-side execution layer;
- снимает последний существенный hidden-knowledge хвост внутри installability;
- оставляет в `A4` уже не install/bootstrap gap, а operational handoff gap из `A-2.5.4`.
