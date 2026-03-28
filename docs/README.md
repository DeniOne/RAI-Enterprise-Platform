---
id: DOC-META-README-RVKI
layer: Meta
type: Navigation
status: approved
version: 3.4.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-CORE-README
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: docs/INDEX.md;scripts/lint-docs.cjs;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md
---
# RAI_EP Documentation

## CLAIM
id: CLAIM-CORE-README
status: asserted
verified_by: code
last_verified: 2026-03-28

Документация переведена в docs-as-code режим.

- Canonical index: `docs/INDEX.md`
- Claim registry: `docs/DOCS_MATRIX.md`
- Governance contract: `docs/CONTRIBUTING_DOCS.md`
- Freshness policy: `docs/05_OPERATIONS/DOC_FRESHNESS_SLA.md`
- Active instructions layer: `docs/11_INSTRUCTIONS/`
- Latest due diligence package: `docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md`
- Active compliance/ops packet: `docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md`, `docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md`, `docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md`, `docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md`, `docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md`, `docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md`, `docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md`
- Documentation baseline audit: `docs/_audit/FINAL_AUDIT_2026-03-20.md`
- Supporting audit artifacts: `docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md`, `docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md`, `docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md`, `docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md`, `docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md`, `docs/_audit/DELTA_VS_BASELINE_2026-03-28.md`
- Topology redecision: `docs/_audit/DOCUMENTATION_TOPOLOGY_REDECISION_2026-03-21.md`

Слои документации теперь разделены по роли:
- verified operational canon: `00_CORE`, `01_ARCHITECTURE`, `04_AI_SYSTEM`, `05_OPERATIONS`
- active intent / design / planning: `00_STRATEGY`, `02_DOMAINS`, `02_PRODUCT`, `03_ENGINEERING`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS`
- historical / raw context: `06_ARCHIVE`

Archive recovery rule:
сначала читай активные слои; `docs/06_ARCHIVE` используй для старых срезов, raw research и dated context. Архив нельзя выдавать за verified operational truth без revalidation.

Source of truth order:
`code/tests/gates > generated manifests > docs`
