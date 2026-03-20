---
id: DOC-OPS-05-OPERATIONS-DOC-FRESHNESS-SLA-109Q
layer: Operations
type: Report
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-20
claim_id: CLAIM-OPS-DOC-FRESHNESS-SLA
claim_status: asserted
verified_by: code
last_verified: 2026-03-20
evidence_refs: scripts/lint-docs.cjs
---
# DOC FRESHNESS SLA

## CLAIM
id: CLAIM-OPS-DOC-FRESHNESS-SLA
status: asserted
verified_by: code
last_verified: 2026-03-20

SLA thresholds (days):
- CORE: 30
- SUPPORTING: 45
- EXPERIMENTAL: 60 (warning)
- LEGACY/ARCHIVE: no SLA

Stale condition:
- if `today - last_verified > threshold` then doc is `stale` and `pnpm lint:docs` fails for CORE/SUPPORTING.
