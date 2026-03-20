---
id: DOC-CORE-CONTRIBUTING-DOCS-20260320
layer: Meta
type: Navigation
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-20
claim_id: CLAIM-CORE-CONTRIBUTING-DOCS
claim_status: asserted
verified_by: code
last_verified: 2026-03-20
evidence_refs: scripts/lint-docs.cjs;package.json
---
# CONTRIBUTING DOCS

## CLAIM
id: CLAIM-CORE-CONTRIBUTING-DOCS
status: asserted
verified_by: code
last_verified: 2026-03-20

## Source of Truth Order
1. `code/tests/gates`
2. `generated manifests`
3. `docs`

## Mandatory Contract
- Каждый CORE/SUPPORTING markdown-док обязан иметь claim metadata в frontmatter:
  - `claim_id`
  - `claim_status`
  - `verified_by`
  - `last_verified`
  - `evidence_refs`
- Каждый claim обязан быть зарегистрирован в `docs/DOCS_MATRIX.md`.
- Любой merge блокируется, если `pnpm lint:docs` красный.

## Root Policy
В `docs/` root разрешены только:
- `README.md`
- `INDEX.md`
- `DOCS_MATRIX.md`
- `CONTRIBUTING_DOCS.md`

Остальные файлы должны быть в слоях (`00_CORE`, `01_ARCHITECTURE`, `02_PRODUCT`, `03_ENGINEERING`, `04_AI_SYSTEM`, `05_OPERATIONS`, `06_ARCHIVE`).

## Freshness
SLA правила в `docs/05_OPERATIONS/DOC_FRESHNESS_SLA.md`.

## Codex IDE Rule Source
Repo-level поведение Codex для этого проекта дополнительно зафиксировано в `/AGENTS.md`.
