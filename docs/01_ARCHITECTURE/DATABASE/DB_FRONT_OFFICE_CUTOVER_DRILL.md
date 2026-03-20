---
id: DOC-ARC-DATABASE-DB-FRONT-OFFICE-CUTOVER-DRILL-1SNB
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_FRONT_OFFICE_CUTOVER_DRILL

- Generated at: `2026-03-15T19:44:31.787Z`
- Drill type: `runtime cutover + rollback smoke`.
- companyId: `default-rai-company`
- tenantId: `cmmq489j20000jibqgqoolbd5`

## Flag package

- `TENANT_DUAL_KEY_MODE=shadow`
- `TENANT_DUAL_KEY_ENFORCE_MODELS=FrontOfficeThread,FrontOfficeThreadMessage,FrontOfficeHandoffRecord,FrontOfficeThreadParticipantState`
- `TENANT_DUAL_KEY_COMPANY_FALLBACK=true`

## Snapshot comparison

| Slice | Baseline | Cutover | Rollback |
| --- | ---: | ---: | ---: |
| `threads` | 1 | 1 | 1 |
| `messages` | 6 | 6 | 6 |
| `handoffs` | 1 | 1 | 1 |
| `participant_states` | 1 | 1 | 1 |

## Verification

- cutover snapshot parity: `PASS`
- rollback snapshot parity: `PASS`

## Rollback trigger

- любой `TENANT_DRIFT` alert по front-office family;
- любой row-count mismatch в `DB_FRONT_OFFICE_SHADOW_COMPARE.md`;
- любой `404`/empty result на known-good thread после включения feature flag;
- p95 latency по front-office reads > `+20%` против baseline окна.

## Rollback action

- удалить `TENANT_DUAL_KEY_ENFORCE_MODELS` из runtime env;
- перезапустить API;
- повторно прогнать `pnpm db:front-office-wave:shadow-compare`;

## Verdict

- rollback verification status: `VERIFIED`
