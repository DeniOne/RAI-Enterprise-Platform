# 04. Stage-Based Roadmap And AI Delivery Model

## Verified Starting Point

- The project already has a live engineering core, an active runtime, and a governance baseline.
- The main risk is not that “the system does not exist yet,” but that it could be expanded in the wrong order.
- The next move must be stage-based and dependency-based, not driven by UI breadth or by the number of new ideas.

## Target Direction

The project should advance as a governed enterprise platform centered on `TechMap`, `season execution`, evidence, explainability, controlled AI, and an installable `self-host / localized` contour.

## Stage Sequence

| Stage | What Must Be Closed | Prerequisites | Expected Effect | Exit Criteria |
| --- | --- | --- | --- | --- |
| `Stage 1` | Close the unified product and domain center around `TechMap` | active domain baseline and existing tech-map/season contours | the product core stops being diluted across secondary modules | there is a clear and checkable `TechMap -> execution -> deviations -> recommendations -> result` loop |
| `Stage 2` | Close the governed AI runtime | stage 1 as domain center; existing `rai-chat` runtime | AI stops being an informal risk source and becomes a controlled layer | there is a `tool matrix`, `HITL matrix`, evidence thresholds, eval discipline, and incident contour |
| `Stage 3` | Raise release discipline to delivery grade | stages 1 and 2 as the product/governance base | the engineering baseline becomes an honest release contour | critical AppSec debt is reduced, legal evidence contour is assembled, backup/restore evidence exists, and the installability packet is complete |
| `Stage 4` | Confirm the `self-host / localized` pilot packet | stage 3 as mandatory base | a realistic limited deployment path becomes available | support boundary, topology, install/upgrade path, and a reproducible pilot packet all exist |
| `Stage 5` | Expand breadth only after core closure | stages 1-4 closed as the minimum viable governance base | new roles, UI breadth, and integrations stop undermining the core | expansion happens without damaging policy, domain integrity, or release discipline |

## AI-First Delivery Model

### Role Of AI

- AI is expected to produce the majority of bounded implementation work.
- AI may rapidly generate implementation slices, test scaffolds, refactoring batches, and documentation drafts.
- AI is especially effective where several quick iterations are needed across routing, contracts, backend/frontend glue, and repetitive engineering work.

### Role Of Humans

- Humans make the architectural decisions and keep the system from drifting.
- Humans define acceptance criteria and verify that implementation does not violate the domain model.
- Humans control security, legal, privacy, policy, and release boundaries.
- Humans approve merge/release for high-impact changes.

### Non-Negotiable Rule

High-impact changes are not considered complete without human review, even if most of the code was generated or written by AI.

## Anti-Roadmap: What Must Not Be Done Now

- Do not move into `SaaS-first` while the honest priority path remains `self-host / localized`.
- Do not expand AI autonomy faster than policy, `HITL`, evals, and incident discipline are formalized.
- Do not treat menu breadth or UI completeness as a real readiness proxy.
- Do not aggressively expand integrations before the legal/ops perimeter is closed.
- Do not scale new agent roles faster than the shared governance framework is closed.
- Do not let secondary modules displace the `TechMap` center of the product.

## Open Gaps

- The core product flow around `TechMap` still needs to become the primary delivery focus rather than one theme inside a very broad monorepo.
- AI runtime governance is conceptually clear, but still needs to be raised to a formal release-grade contour.
- Release discipline is not yet strong enough to defend external production as a mature claim.

## Source Anchors

- `docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md`
- `docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`
- `docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`
- `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
