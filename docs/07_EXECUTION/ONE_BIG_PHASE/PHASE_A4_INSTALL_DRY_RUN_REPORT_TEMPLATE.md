---
id: DOC-EXE-ONE-BIG-PHASE-A4-INSTALL-DRY-RUN-REPORT-TEMPLATE-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-INSTALL-DRY-RUN-REPORT-TEMPLATE-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md;README.md;package.json;scripts/prisma-migrate-safe.cjs;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md
---
# PHASE A4 INSTALL DRY-RUN REPORT TEMPLATE

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-INSTALL-DRY-RUN-REPORT-TEMPLATE-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот шаблон нужен, чтобы dry-run установки превращался в execution evidence, а не в устное “у меня локально завелось”.

## 1. Dry-run metadata

- Date:
- Operator:
- Host / OS:
- Branch / commit:
- Target mode: `self-host / localized`

## 2. Preconditions

- prerequisites выполнены:
- `.env` подготовлен:
- Docker/Compose доступны:
- external secrets source подтверждён:

## 3. Executed steps

| Шаг | Команда / действие | Результат | Проблема / заметка |
|---|---|---|---|
| 1 | `cp .env.example .env` |  |  |
| 2 | `pnpm docker:up` |  |  |
| 3 | `pnpm install` |  |  |
| 4 | `pnpm db:migrate` |  |  |
| 5 | `pnpm --filter api build` |  |  |
| 6 | `pnpm --filter web build` |  |  |

## 4. Hidden knowledge found

- Какие шаги пришлось делать “по памяти”:
- Какие env values были неочевидны:
- Какие сервисы поднимались не из packet:

## 5. Verdict

- Install path reproducible: `yes/no`
- Blocking gaps:
- Follow-up actions:

Dry-run report считается полезным только если перечисляет скрытые ручные шаги, а не только итоговый `PASS`.
