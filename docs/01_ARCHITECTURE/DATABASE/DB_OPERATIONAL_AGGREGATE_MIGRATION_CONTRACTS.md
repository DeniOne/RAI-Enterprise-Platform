# DB_OPERATIONAL_AGGREGATE_MIGRATION_CONTRACTS

## Purpose

Контракты миграции central operational aggregates для Phase 7.

Жесткое правило:
- одновременно мигрируется только одна family из `Season | HarvestPlan | TechMap | Task`.

## Season contract

- `source_of_scope`: `companyId` (transition), target `tenantId + companyId` bridge.
- `compatibility_read_path`: dual-read (`tenantId` first, fallback `companyId`).
- `compatibility_write_path`: dual-write в shadow режиме.
- `data_backfill_strategy`: батч backfill `tenantId` по `TenantCompanyBinding`.
- `shadow_validation_strategy`: mismatch log на every read path.
- `rollback_strategy`: feature-flag rollback на `companyId-only` reads/writes.
- `projection_seam`: planning workspace projection обязателен до cutover.

## HarvestPlan contract

- `source_of_scope`: `companyId` + `seasonId`.
- `compatibility_read_path`: projection-backed list reads + fallback direct query.
- `compatibility_write_path`: immutable event-style updates через controlled service path.
- `data_backfill_strategy`: migrate by season batches.
- `shadow_validation_strategy`: compare row counts and status distribution.
- `rollback_strategy`: revert to legacy query path by feature flag.
- `projection_seam`: planning/execution projection обязательна.

## TechMap contract

- `source_of_scope`: `companyId` + (`fieldId`,`seasonId`,`crop`).
- `compatibility_read_path`: read from projection for workspace boards; direct for mutation flows.
- `compatibility_write_path`: keep write-source as canonical aggregate service.
- `data_backfill_strategy`: per-tenant/per-season window with idempotent cursor.
- `shadow_validation_strategy`: compare version chain integrity.
- `rollback_strategy`: disable projection reads, keep canonical writes untouched.
- `projection_seam`: explicit tech-map read model обязательна.

## Task contract

- `source_of_scope`: `companyId` + `seasonId`.
- `compatibility_read_path`: task-board projection + direct API fallback.
- `compatibility_write_path`: canonical write in task service with shadow replication.
- `data_backfill_strategy`: status-partitioned migration waves.
- `shadow_validation_strategy`: compare queue state and SLA counters.
- `rollback_strategy`: fallback to direct legacy board queries.
- `projection_seam`: operator board projection обязательна.

## Backfill and rollback completeness

- Для всех 4 central aggregates backfill и rollback path определены.
- Ни один aggregate не допускается к cutover до подтвержденного projection seam.
