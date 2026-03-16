# DB_FRONT_OFFICE_SHADOW_COMPARE

- Generated at: `2026-03-15T19:44:29.668Z`
- companyId: `default-rai-company`
- tenantId: `cmmq489j20000jibqgqoolbd5`
- compare mode: legacy `companyId` path vs dual-key `companyId + tenantId` path.

## Thresholds

- row-count mismatch: `0`
- identity mismatch: `0`
- allowed scope drift: `0`

## Results

| Slice | Legacy rows | Dual-key rows | Legacy-only | Dual-key-only | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| `threads` | 1 | 1 | 0 | 0 | `PASS` |
| `messages` | 6 | 6 | 0 | 0 | `PASS` |
| `handoffs` | 1 | 1 | 0 | 0 | `PASS` |
| `participant_states` | 1 | 1 | 0 | 0 | `PASS` |

## Verdict

- Shadow-read compare: `PASS`.
