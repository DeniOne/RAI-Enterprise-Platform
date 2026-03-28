---
id: DOC-META-INDEX-ESXJ
layer: Meta
type: Navigation
status: approved
version: 3.6.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-CORE-INDEX
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: scripts/lint-docs.cjs;docs/_audit/DOCUMENTATION_MAP.md;docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md
---
# INDEX (Canonical)

## CLAIM
id: CLAIM-CORE-INDEX
status: asserted
verified_by: code
last_verified: 2026-03-28

## Core
- `docs/README.md`
- `docs/CONTRIBUTING_DOCS.md`
- `docs/DOCS_MATRIX.md`

## Verified Operational Canon
- `docs/00_CORE/`
- `docs/01_ARCHITECTURE/`
- `docs/04_AI_SYSTEM/`
- `docs/05_OPERATIONS/`

## Active Design And Planning Layers
- `docs/00_STRATEGY/`
- `docs/02_DOMAINS/`
- `docs/02_PRODUCT/`
- `docs/03_ENGINEERING/`
- `docs/06_METRICS/`
- `docs/07_EXECUTION/`
- `docs/08_TESTING/`
- `docs/10_FRONTEND_MENU_IMPLEMENTATION/`
- `docs/11_INSTRUCTIONS/`

## Historical And Raw Context
- `docs/06_ARCHIVE/`

## Start Here By Intent
- Бизнес-логика и стратегия: `docs/00_STRATEGY/BUSINESS/`, `docs/00_STRATEGY/CONSULTING/`, `docs/00_STRATEGY/FRONT_OFFICE/`
- Агентная платформа и AI контур: `docs/00_STRATEGY/STAGE 2/`, `docs/04_AI_SYSTEM/`, `docs/11_INSTRUCTIONS/AGENTS/`
- Доменные модели: `docs/02_DOMAINS/`
- Product / UX: `docs/02_PRODUCT/`, `docs/10_FRONTEND_MENU_IMPLEMENTATION/`
- Delivery / rollout / execution: `docs/07_EXECUTION/`
- Testing / verification: `docs/08_TESTING/`
- Operations / runbooks: `docs/05_OPERATIONS/`
- Privacy / compliance / deployment readiness: `docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md`, `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md`, `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`, `docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md`, `docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md`, `docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md`, `docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md`

## Active Instruction Sources
- `docs/11_INSTRUCTIONS/INDEX.md`
- `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md`
- `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md`
- `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md`

## Audit Artifacts
- `docs/_audit/INVENTORY.csv`
- `docs/_audit/DOCUMENTATION_MAP.md`
- `docs/_audit/CLASSIFICATION_MATRIX.md`
- `docs/_audit/DRIFT_REPORT.md`
- `docs/_audit/CONTRADICTIONS.md`
- `docs/_audit/DUPLICATES_AND_JUNK.md`
- `docs/_audit/FINAL_AUDIT_2026-03-20.md`
- `docs/_audit/DOCUMENTATION_TOPOLOGY_REDECISION_2026-03-21.md`
- `docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md`
- `docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md`
- `docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md`
- `docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md`
- `docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md`
- `docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md`
- `docs/_audit/DELTA_VS_BASELINE_2026-03-28.md`

## Archive Recovery Sources
- `docs/06_ARCHIVE/LEGACY_TREE_2026-03-20/09_ARCHIVE/`
- `docs/06_ARCHIVE/ROOT_DROP_2026-03-20/`
- `docs/06_ARCHIVE/LEGACY_TREE_2026-03-20/frontend-audit-2026-03-16/`

Правило:
- активные слои `00_STRATEGY`, `02_DOMAINS`, `07_EXECUTION`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS` нужно читать раньше архива
- архив нужен для старых снимков, raw research, prompt trail и dated audit-контекста
- эти источники нельзя использовать как verified operational truth без перепроверки
