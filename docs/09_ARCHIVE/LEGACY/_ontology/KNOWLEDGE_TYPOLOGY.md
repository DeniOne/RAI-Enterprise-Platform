---
id: DOC-ARH-GEN-190
type: Legacy
layer: Archive
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# Knowledge Typology & Markup Standard

This document defines the canonical ontology for the RAI Enterprise Platform.
All documentation MUST comply with this schema.

## Node Types
(principle, control, risk, metric, component, service, process, decision, pattern, guideline, experiment)

## Lifecycle Status
(draft, review, approved, enforced, deprecated)

## Relations Rules

- **`implements`**: Used strictly by `process`, `component`, or `control` that represents a DIRECT mechanism of execution for a `principle`.
- **`aligned_with`**: Used by `decision` or `component` to show compliance/alignment with a `principle` or `vision` without being an execution mechanism.
- **`measured_by` / `measures`**: Universal measurement relation.
- **`depends_on`**: Technical or logical dependency.
- **`controls`**: Link from `control` to `process` or `component`.

## Mandatory Rules
- Every document MUST have frontmatter.
- `id` MUST be globally unique and immutable.
- `principle` MUST be linked to at least one `metric` to be `approved`.
- `enforced principle` MUST have a `control`.
- `control` MUST NOT `implement` another `control` (use `depends_on`).
- `approved control` MUST be linked to at least one `metric` via `measured_by`.
- `decision` MUST NOT use `implements` (use `aligned_with` or `depends_on`).
- `service` / `component` without metrics/controls MUST NOT be `approved` (use `review`).
- `metric` MUST have `status: review` until linked to a `control`.
- Missing or invalid references are CI errors.

## The Triad Rule
Every **approved principle** MUST have:
1. At least one **control** (via `implements` relation from control).
2. At least one **metric** whose effectiveness measures that control and the principle results.
*Resulting Loop: Principle → Metric ⟷ Control.*

## Metric Policy
Metrics introduced in the migration phase define normative measurement semantics. Binding metrics to controls (actual enforcement) is handled in subsequent batches and does not block principle approval once the measurement methodology is defined.

> [!NOTE]
> **Governance Debt**: Principles without metrics MUST have `status: review` and `tags: [governance-gap]`.

