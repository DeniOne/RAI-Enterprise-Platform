# DB_FRONT_OFFICE_TENANT_WAVE_CUTOVER

## Scope

Controlled partial read cutover for `FrontOfficeThread` family:
- `FrontOfficeThread`
- `FrontOfficeThreadMessage`
- `FrontOfficeHandoffRecord`
- `FrontOfficeThreadParticipantState`

## Prechecks

- `DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION.md = PASS`
- `DB_FRONT_OFFICE_SHADOW_COMPARE.md = PASS`
- `DB_FRONT_OFFICE_CUTOVER_DRILL.md = VERIFIED`
- `default-rai-company` has active `TenantCompanyBinding`
- `default-rai-company` has resolved `TenantState.tenantId`
- `tenantId` null backlog for the family = `0`
- parent-child tenant mismatch for the family = `0`

## Freeze Conditions

- no schema changes in `FrontOfficeThread` family during cutover window
- no `TenantCompanyBinding`/`TenantState` rewiring for target company during cutover window
- no parallel enablement for other `TENANT_DUAL_KEY_ENFORCE_MODELS`
- no concurrent core aggregate migration wave

## Flag Strategy

Baseline:
- `TENANT_DUAL_KEY_MODE=shadow`
- `TENANT_DUAL_KEY_ENFORCE_MODELS=` (empty)
- `TENANT_DUAL_KEY_COMPANY_FALLBACK=true`

Partial cutover:
- `TENANT_DUAL_KEY_MODE=shadow`
- `TENANT_DUAL_KEY_ENFORCE_MODELS=FrontOfficeThread,FrontOfficeThreadMessage,FrontOfficeHandoffRecord,FrontOfficeThreadParticipantState`
- `TENANT_DUAL_KEY_COMPANY_FALLBACK=true`

Rollback:
- clear `TENANT_DUAL_KEY_ENFORCE_MODELS`
- keep `TENANT_DUAL_KEY_MODE=shadow`
- restart API

## Shadow-Read Compare Rules

Compare legacy `companyId` path vs dual-key `companyId + tenantId` path for:
- `threads`
- `messages`
- `handoffs`
- `participant_states`

Compare contract:
- row-count mismatch = `0`
- identity mismatch = `0`
- known-good thread lookup mismatch = `0`
- allowed scope drift = `0`

Command:
- `pnpm db:front-office-wave:shadow-compare`

## Mismatch Thresholds

- row-count mismatch tolerance: `0`
- ID-set mismatch tolerance: `0`
- `TENANT_DRIFT` alerts tolerance for family: `0`
- p95 latency regression budget: max `+20%`

## Rollback Trigger

- any `TENANT_DRIFT` alert for front-office family
- any mismatch in `DB_FRONT_OFFICE_SHADOW_COMPARE.md`
- any `404` or empty result on known-good thread after flag enablement
- p95 latency on front-office reads > `+20%` against baseline window

## Rollback Action

1. Clear `TENANT_DUAL_KEY_ENFORCE_MODELS`.
2. Restart API.
3. Re-run `pnpm db:front-office-wave:shadow-compare`.
4. Confirm parity restoration via `DB_FRONT_OFFICE_CUTOVER_DRILL.md`.

## Post-Cutover Observation Window

- duration: `24h`
- canonical log: `DB_FRONT_OFFICE_OBSERVATION_24H.md`
- required checks:
- front-office route exceptions
- mismatch/drift counters
- rollback triggers fired/not fired
- final status: `PASS | PASS WITH NOTES | FAIL`

## Evidence

- backfill validation: `DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION.md`
- shadow compare: `DB_FRONT_OFFICE_SHADOW_COMPARE.md`
- runtime cutover + rollback drill: `DB_FRONT_OFFICE_CUTOVER_DRILL.md`
- live window log: `DB_FRONT_OFFICE_OBSERVATION_24H.md`
