# DB_FRONT_OFFICE_TENANT_WAVE_1

## Scope

Первая узкая `Phase 7` operational migration wave.

Family:
- `FrontOfficeThread`
- `FrontOfficeThreadMessage`
- `FrontOfficeHandoffRecord`
- `FrontOfficeThreadParticipantState`

## Change set

- additive `tenantId` columns во всей family;
- tenant-oriented indexes для dual-key read path;
- backfill через `TenantCompanyBinding` и `TenantState`;
- shadow-write через `PrismaService.dualKeyScopedModels`;
- shadow-validation через `DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION.md`;
- tenant bootstrap через `scripts/db/bootstrap-front-office-tenant-wave.cjs`;
- rollback-safe compatibility path: `companyId` остается canonical fallback key.

## Source of scope

- write path: runtime `TenantScope` (`tenantId + companyId`);
- backfill path: `tenant_company_bindings` first, `tenant_states` second;
- compatibility fallback: `companyId`.

## Current wave result

- для `default-rai-company` создан platform boundary:
- `Tenant.key = default-rai-company`;
- активный `TenantCompanyBinding` создан;
- `TenantState` создан и привязан к tenant;
- `FrontOfficeThread` family backfill завершен с `0` null rows и `0` parent-child mismatch.
- shadow compare между legacy и dual-key path проходит без расхождений.
- runtime cutover + rollback smoke подтвержден через feature-flag cohort только для family.
- открыт canonical live-window log `DB_FRONT_OFFICE_OBSERVATION_24H.md`.
- следующий operational шаг: закрыть `24h` observation window финальным статусом `PASS | PASS WITH NOTES | FAIL`.

## Rollback

- runtime rollback: оставить family вне `TENANT_DUAL_KEY_MODE=enforce`;
- read/write rollback: продолжать `companyId`-scoped reads;
- schema rollback: не требуется немедленно, additive `tenantId` может оставаться nullable.

## Cutover rule

Enforce-mode для family допускается только после:
- `tenantId` backfill coverage приемлема;
- parent-child mismatch = `0`;
- сервисный smoke path проходит без drift alerts.
