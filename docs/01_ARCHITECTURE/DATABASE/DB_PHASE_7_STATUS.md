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
- [x] Запущена реальная wave-1 для `FrontOfficeThread` family:
- [x] additive `tenantId` schema change + migration/backfill;
- [x] `PrismaService` подключен к dual-key shadow path для family;
- [x] выпущен wave packet `DB_FRONT_OFFICE_TENANT_WAVE_1.md`.
- [x] Выполнен tenant bootstrap для `default-rai-company`:
- [x] создан первичный `Tenant` + `TenantCompanyBinding` + `TenantState`;
- [x] null-backlog по `FrontOfficeThread` family обнулен;
- [x] shadow-validation подтвержден с `0` mismatch и `0` null rows.
- [x] Выпущен cutover runbook `DB_FRONT_OFFICE_TENANT_WAVE_CUTOVER.md`.
- [x] Прогнан shadow-read compare: `DB_FRONT_OFFICE_SHADOW_COMPARE.md = PASS`.
- [x] В `PrismaService` добавлен partial read cutover через `TENANT_DUAL_KEY_ENFORCE_MODELS`.
- [x] Auth boundary теперь резолвит фактический `tenantId` через `TenantIdentityResolverService`.
- [x] Выполнен runtime cutover + rollback smoke drill: `DB_FRONT_OFFICE_CUTOVER_DRILL.md = VERIFIED`.
- [x] Выпущен журнал live-window: `DB_FRONT_OFFICE_OBSERVATION_24H.md`.
- [x] Подготовлен final closeout artifact: `DB_FRONT_OFFICE_WAVE_CLOSEOUT.md`.

## Residual

- [ ] `Phase 7 Wave 1: end-to-end packet complete, awaiting formal closeout after 24h live observation.`
- [ ] Core aggregates (`Season|HarvestPlan|TechMap|Task`) по-прежнему не мигрировались.
