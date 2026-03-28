---
id: DOC-OPS-WORKFLOWS-RELEASE-BACKUP-RESTORE-DR-RUNBOOK-20260328
layer: Operations
type: Runbook
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-WORKFLOWS-RELEASE-BACKUP-RESTORE-DR-RUNBOOK-20260328
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_DEPLOY_RUNBOOK.md;apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs;apps/api/scripts/ops/advisory-oncall-drill.mjs;apps/api/scripts/ops/advisory-stage-progression.mjs;package.json
---
# RELEASE BACKUP RESTORE AND DR RUNBOOK

## CLAIM
id: CLAIM-OPS-WORKFLOWS-RELEASE-BACKUP-RESTORE-DR-RUNBOOK-20260328
status: asserted
verified_by: code
last_verified: 2026-03-28

## Pre-release baseline
Перед каждым релизом обязательны:
- `pnpm gate:invariants`
- `pnpm gate:db:schema-validate`
- `pnpm gate:secrets`
- `pnpm security:audit:ci`
- `pnpm security:licenses`
- `pnpm lint:docs`
- relevant `build/test` команды по целевому контуру

## Backup baseline
1. До schema-affecting релиза сделать подтверждённый backup БД.
2. Зафиксировать конфигурацию object storage / WORM и location секретов вне Git.
3. Проверить, что rollback owner и communication owner назначены заранее.

## Restore and rollback path
- DB rollout: основной источник — `DB_MIGRATION_DEPLOY_RUNBOOK.md`.
- Runtime rollback / incident containment:
  - `node apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs`
  - `node apps/api/scripts/ops/advisory-oncall-drill.mjs`
  - `node apps/api/scripts/ops/advisory-stage-progression.mjs`
- Для critical release window целевой режим — forward-fix first, rollback second, но только при наличии проверенного backup.

## Target model guidance

| Deployment target | Минимальный пакет |
|---|---|
| `SaaS` | branch protection evidence, backup/restore evidence, provider matrix, security baseline artifacts |
| `Managed` | то же, плюс handoff/support boundary и upgrade packet |
| `On-prem` | installer/bootstrap guide, secrets bootstrap, schema validate, release checklist, backup acceptance |
| `Hybrid` | отдельная topology и data-boundary карта; без неё релиз считать `not evidenced` |

## Stop criteria
- любой красный `tracked` secret finding;
- schema validate не воспроизводится;
- backup не подтверждён;
- release target не имеет соответствующего deployment packet;
- legal/compliance gate для ПДн остаётся без owner decision.
