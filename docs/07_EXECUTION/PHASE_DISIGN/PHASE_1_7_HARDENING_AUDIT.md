# Phase 1-7 Hardening Audit (Execution Baseline)
Date: 2026-02-22
Status: Phase 1-7 Execution Complete

## Method
- Evidence source: code in `apps/web`, `apps/api`, test artifacts in `apps/api/*test-results*.json`.
- Rule: status is set by executable evidence, not checklist declarations.

## Current Phase Status
1. Phase 1 (Governance Shell): Partially complete.
- Present: `AuthorityContext`, `AuthorityProvider`, `useAuthority`.
- Present: role-driven rendering paths in `apps/web/app` and `apps/web/components` migrated to capability-first gates.
- Action started:
  - Removed `user.role` rendering dependency from authenticated layouts.
  - Added lint rule banning direct `user.role` usage in UI (`apps/web/.eslintrc.json`).

2. Phase 2 (Two-Phase Execution): Mostly complete.
- Present: `governanceMachine`, `useGovernanceAction`, `pending/escalation/quorum` flows.
- Gaps: missing full integration test harness for frontend FSM flows.

3. Phase 3 (Escalation & Quorum): Mostly complete.
- Present: `EscalationBanner`, `QuorumVisualizer`, escalation states.
- Gaps: incomplete deterministic UI e2e proof in CI.

4. Phase 4 (Risk Triage & Causal): Mostly complete.
- Present: R1-R4, replay/determinism utilities.
- Gaps: formal DoD evidence chain not fully automated in frontend CI.

5. Phase 5 (AI Explainability): Mostly complete.
- Present: hardened explainability DTOs, canonical forensic hashes, mandatory `AIRecommendationBlock` path in decisions UI, capability-gated forensic.
- Present: frontend runner (`jest`) and institutional tests for explainability enforcement, authority gating, progressive disclosure, and ledger link binding.
- Gaps: rollout to all AI render paths beyond decisions surface.

6. Phase 6 (Ledger Integrity & Mismatch Protocol): Complete.
- Present: centralized session integrity store, event-driven mismatch handling, and global UI freeze overlay in `WorkSurface`.
- Present: replay verification flow (`/forensics/replay` -> `/internal/replay`) and freeze trigger on mismatch.
- Present: deterministic replay unit tests on backend and freeze workflow test on frontend.

7. Phase 7 (Business Domains via Governance Core): Complete.
- Present: governance contract test verifies business-domain layouts are wired through Governance Core (`AuthenticatedLayout` or `GovernanceBar + WorkSurface`).
- Present: cross-domain governance transitions are trace-bound through integrity/replay path and advisory ledger trace contracts.

## Immediate Hardening Backlog (Post-Phase 7)
1. Roll out institutional explainability tests to additional AI surfaces beyond `DecisionsPage`.
3. Add CI gates:
- web lint: pass
- web tests: pass
- api tests: pass
- canonical replay regression suite: pass

## This Iteration Changes
- `apps/web/components/layouts/AuthenticatedLayout.tsx`
  - Removed `role` prop; sidebar role now resolved from governance simulation store.
- `apps/web/app/**/layout.tsx`
  - Removed `role={user.role}` pass-through.
- `apps/web/app/dashboard/page.tsx`
  - Removed direct role-based financial gating.
  - Switched to capability-gated financial block.
- `apps/web/components/dashboard/FinancialMetrics.tsx`
  - Added capability-gated financial metrics component (`canSign || canOverride`).
- `apps/web/.eslintrc.json`
  - Added restriction for direct `user.role` usage in UI.
- `apps/web/lib/consulting/ui-policy.ts`
  - Migrated transition authorization logic to capability-first (`canSign/canOverride/canApprove`) with backward-compatible role adapter.
- `apps/web/lib/consulting/navigation-policy.ts`
  - Migrated visibility restrictions to capability-first governance access checks.
- `apps/web/shared/store/integrity.store.ts`
  - Added centralized integrity state (`SYNCING/VERIFIED/MISMATCH`) and trace/mismatch management.
- `apps/web/shared/hooks/useSessionIntegrity.ts`
  - Switched to store-backed integrity lifecycle; added event-driven mismatch freeze and replay verification method.
- `apps/web/shared/components/WorkSurface.tsx`
  - Added institutional freeze overlay with trace/hash diagnostics and replay action when integrity mismatches.
- `apps/web/shared/components/WorkSurface.integrity.spec.tsx`
  - Added test proving global freeze behavior and replay-link exposure on mismatch.
- `apps/web/app/forensics/layout.tsx`
  - Added governance-wrapped forensic route layout.
- `apps/web/app/forensics/replay/page.tsx`
  - Added trace replay workflow screen and verification trigger.
- `apps/web/shared/contracts/domain-governance.contract.spec.ts`
  - Added Phase 7 contract test for governance-core integration across business-domain layouts.
- `apps/web/app/consulting/plans/page.tsx`
  - Removed role simulation dependency from plan transitions UI; switched to `useAuthority`.
- `apps/web/app/consulting/techmaps/page.tsx`
  - Removed role simulation dependency from tech map transitions UI; switched to `useAuthority`.
- `apps/web/app/consulting/budgets/page.tsx`
  - Removed role simulation dependency from budget transitions UI; switched to `useAuthority`.
- `apps/web/components/consulting/PlansList.tsx`
  - Switched transition policy input from role to authority capabilities.
- `apps/web/components/consulting/PlanDesigner.tsx`
  - Switched transition policy input from role to authority capabilities.
- `apps/web/components/consulting/TechMapWorkbench.tsx`
  - Switched transition policy input from role to authority capabilities.
- `apps/api/src/level-f/gateway/replay/replay.service.spec.ts`
  - Added deterministic replay hashing/mismatch unit tests.
- `apps/api/src/level-f/gateway/replay/replay.service.ts`
  - Fixed stable stringify import compatibility for replay determinism path.

## Verification Snapshot (2026-02-22)
- `pnpm -C apps/web lint`: PASS (0 errors, 0 warnings).
- `pnpm -C apps/web test`: PASS (4 suites, 10 tests).
- `pnpm -C apps/api build`: PASS.
- `pnpm -C apps/api test -- src/shared/dto/explainability.spec.ts src/modules/strategic/advisory.service.spec.ts src/level-f/gateway/replay/replay.service.spec.ts -- --runInBand`: PASS (3 suites, 10 tests).

## Outstanding Work Before "Strict Clean Room"
1. Expand institutional test coverage from critical paths to all domain surfaces.
2. Keep CI gates mandatory for web lint/test, api build/test, and replay determinism suite.
