# DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES

## Purpose

Правила controlled migration для central operational aggregates.

## Hard migration constraints

- `Season`, `HarvestPlan`, `TechMap`, `Task` нельзя мигрировать параллельно более одной aggregate family за одну migration wave.
- Без `backfill + rollback + compatibility read/write` контракта aggregate migration запрещен.
- Без production shadow-validation aggregate migration запрещен.

## Wave plan

### Wave A (low blast radius)
- `FrontOfficeThread` family (`FrontOfficeThread`, `FrontOfficeThreadMessage`, `FrontOfficeHandoffRecord`, `FrontOfficeThreadParticipantState`)
- цель: проверить migration discipline на non-core aggregate family.
- status: `cutover_runbook_ready_rollback_verified`
- packet: `DB_FRONT_OFFICE_TENANT_WAVE_1.md`
- result: `default-rai-company` bootstrap completed, null backlog `0`, mismatch budget `0`
- cutover: `DB_FRONT_OFFICE_TENANT_WAVE_CUTOVER.md`
- drill: `DB_FRONT_OFFICE_CUTOVER_DRILL.md`
- live_window: `DB_FRONT_OFFICE_OBSERVATION_24H.md`
- closeout: `DB_FRONT_OFFICE_WAVE_CLOSEOUT.md`

### Wave B (finance projection seams)
- `EconomicEvent` projection seams
- `LedgerEntry` reporting seams

### Wave C (single core family)
- только одна из: `Season` **или** `HarvestPlan` **или** `TechMap` **или** `Task`.

### Wave D+
- следующая core family только после закрытия metrics/rollback review предыдущей.

## Required contract template (per family)

- `source_of_scope`
- `compatibility_read_path`
- `compatibility_write_path`
- `data_backfill_strategy`
- `shadow_validation_strategy`
- `rollback_strategy`
- `owner_domain`
- `cutover_criteria`

## Gate

Каждая wave считается закрытой только после:
- production observation window;
- mismatch budget within threshold;
- explicit owner sign-off.
