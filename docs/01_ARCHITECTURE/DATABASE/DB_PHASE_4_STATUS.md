# DB_PHASE_4_STATUS

## Scope

`Phase 4. Read Models / Projection Discipline`.

## Done

- [x] READ_MODEL_POLICY усилен обязательными полями `staleness_tolerance` и `deletion_reconciliation_semantics`.
- [x] Создан projection registry: `DB_PROJECTION_REGISTER.md`.
- [x] Заполнены metadata contracts для 4 approved projections.
- [x] Добавлен gate: `scripts/check-projection-register.cjs` + `gate:db:projections:enforce`.
- [x] Добавлено измерение include-depth:
- [x] `scripts/measure-prisma-include-depth.cjs`
- [x] `DB_INCLUDE_DEPTH_METRICS.md` (`median=1`, `p95=3`, `max=4`).

## Residual

- [ ] Физические projection tables/jobs и production cutover остаются отдельной implementation wave.
