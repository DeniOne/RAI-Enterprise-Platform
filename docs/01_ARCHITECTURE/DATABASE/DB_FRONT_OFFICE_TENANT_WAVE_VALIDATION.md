---
id: DOC-ARC-DATABASE-DB-FRONT-OFFICE-TENANT-WAVE-VALID-ZUQS
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION

- Generated at: `2026-03-14T09:21:59.504Z`
- Scope: `FrontOfficeThread` family Phase 7 wave-1.

## Null backlog

| Table | Null tenantId rows |
| --- | ---: |
| `rai_front_office_threads` | 0 |
| `rai_front_office_thread_messages` | 0 |
| `rai_front_office_handoffs` | 0 |
| `rai_front_office_thread_participant_states` | 0 |

## Parent-child tenant consistency

| Check | Mismatches |
| --- | ---: |
| `message.thread tenantId` | 0 |
| `handoff.thread tenantId` | 0 |
| `participant.thread tenantId` | 0 |

## Gate

- Shadow-validation consistency check: `PASS`.

- Rollback path: keep `companyId`-based read/write path as compatibility fallback.
