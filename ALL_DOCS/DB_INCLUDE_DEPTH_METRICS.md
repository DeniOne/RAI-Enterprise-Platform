# DB_INCLUDE_DEPTH_METRICS

## Scope

Измерение глубины Prisma `include` по `apps/api/src` выполнено скриптом:
- `scripts/measure-prisma-include-depth.cjs`

Дата измерения: `2026-03-13`.

## Result snapshot

- `files_scanned`: `829`
- `include_blocks_total`: `110`
- `median_include_depth`: `1`
- `p95_include_depth`: `3`
- `max_include_depth`: `4`

## Hot-path heavy files

- `apps/api/src/modules/consulting/budget-plan.service.ts` (`max=4`)
- `apps/api/src/modules/consulting/execution.service.ts` (`max=4`)
- `apps/api/src/modules/technology-card/technology-card.service.ts` (`max=3`)
- `apps/api/src/shared/tech-map/tech-map-prisma-includes.ts` (`max=3`)
- `apps/api/src/modules/integrity/integrity-gate.service.ts` (`max=3`)
- `apps/api/src/modules/tech-map/change-order/change-order.service.ts` (`max=3`)

## Phase-4/6 interpretation

- Проблема deep include действительно локализована, а не тотальна.
- Core backlog для reduction: `consulting/*`, `tech-map/*`, `integrity/*`.
- Следующая волна должна давать снижение `max` в hot files `4 -> <=2` через projection seams и explicit read-models.
