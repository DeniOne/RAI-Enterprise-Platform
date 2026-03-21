---
id: DOC-META-README-RVKI
layer: Meta
type: Navigation
status: approved
version: 3.2.0
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-CORE-README
claim_status: asserted
verified_by: code
last_verified: 2026-03-21
evidence_refs: docs/INDEX.md;scripts/lint-docs.cjs
---
# RAI_EP Documentation

## CLAIM
id: CLAIM-CORE-README
status: asserted
verified_by: code
last_verified: 2026-03-21

Документация переведена в docs-as-code режим.

- Canonical index: `docs/INDEX.md`
- Claim registry: `docs/DOCS_MATRIX.md`
- Governance contract: `docs/CONTRIBUTING_DOCS.md`
- Freshness policy: `docs/05_OPERATIONS/DOC_FRESHNESS_SLA.md`
- Active instructions layer: `docs/11_INSTRUCTIONS/`
- Full audit package: `docs/_audit/FINAL_AUDIT_2026-03-20.md`
- Topology redecision: `docs/_audit/DOCUMENTATION_TOPOLOGY_REDECISION_2026-03-21.md`

Слои документации теперь разделены по роли:
- verified operational canon: `00_CORE`, `01_ARCHITECTURE`, `04_AI_SYSTEM`, `05_OPERATIONS`
- active intent / design / planning: `00_STRATEGY`, `02_DOMAINS`, `02_PRODUCT`, `03_ENGINEERING`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS`
- historical / raw context: `06_ARCHIVE`

Archive recovery rule:
сначала читай активные слои; `docs/06_ARCHIVE` используй для старых срезов, raw research и dated context. Архив нельзя выдавать за verified operational truth без revalidation.

Source of truth order:
`code/tests/gates > generated manifests > docs`
