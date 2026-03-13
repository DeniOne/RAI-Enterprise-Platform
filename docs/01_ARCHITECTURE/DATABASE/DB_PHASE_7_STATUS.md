# DB_PHASE_7_STATUS

## Scope

`Phase 7. Operational Aggregate Migration`.

## Done

- [x] Зафиксирован migration-wave policy: `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md`.
- [x] Зафиксирован hard guard: не более одной core aggregate family (`Season|HarvestPlan|TechMap|Task`) за wave.
- [x] Определен first non-core candidate: `FrontOfficeThread` family.
- [x] Зафиксирован contract template (`scope/read/write/backfill/shadow/rollback`).
- [x] Подготовлены migration contracts для core families:
- [x] `Season`, `HarvestPlan`, `TechMap`, `Task` в `DB_OPERATIONAL_AGGREGATE_MIGRATION_CONTRACTS.md`.
- [x] Для каждого aggregate задан `backfill + rollback + compatibility seam`.

## Residual

- [ ] Actual operational aggregate data migrations не запускались в этом проходе.
