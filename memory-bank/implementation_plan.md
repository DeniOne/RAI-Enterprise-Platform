# Implementation Plan - Sprint B6: Unified Risk Engine 🛡️

## Goal Description
Ввести единый исполняемый контур допуска действий на основе Legal, R&D, Ops и Finance.
**Risk Engine не принимает решений. Он определяет допустимость.**

## Invariants (Non-negotiable)
- ❌ No UI / No mutations / No domain logic duplication
- ✅ Deterministic output / Explainable verdict / Read-only everywhere

## Proposed Changes

### Database Schema (`packages/prisma-client/schema.prisma`)
#### [MODIFY] schema.prisma
- Add `RiskSignal` model (Source, Severity, Reason, Reference)
- Add `RiskAssessment` model (Target, Verdict, Explanation)
- Add Enums: `RiskSource`, `RiskSeverity`, `RiskVerdict`, `RiskTargetType`

### Core Package (`packages/risk-engine`)
#### [NEW] `packages/risk-engine/package.json` & `tsconfig.json`
- Define package dependencies and workspace structure.

#### [NEW] `packages/risk-engine/src/collector/RiskSignalCollector.ts`
- Interface definition: `collect(companyId: string): Promise<RiskSignal[]>`

#### [NEW] `packages/risk-engine/src/collector/implementations/*.ts`
- `LegalRiskCollector`: Maps `ComplianceStatus` to signals.
- `RndRiskCollector`: Maps `Experiment` state/protocol deviations to signals.
- `OpsRiskCollector`: Maps TechMap deviations.
- `FinanceRiskCollector`: Maps Budget status.

#### [NEW] `packages/risk-engine/src/core/RiskNormalizer.ts`
- Normalizes disparate signals to a common severity scale.

#### [NEW] `packages/risk-engine/src/core/RiskAggregator.ts`
- The Brain: Collects -> Normalizes -> Applies Rules -> Returns Verdict.
- **FSM Integration:** Must consider *previous* Risk FSM state to prevent verdict jumping. Applies escalation/de-escalation rules (e.g., cannot jump from BLOCKED to CLEAR).

#### [NEW] `packages/risk-engine/src/core/RiskFsm.ts`
- Implements the purely deterministic FSM logic (CLEAR -> OBSERVED -> ELEVATED -> CRITICAL -> BLOCKED).

#### [NEW] `packages/risk-engine/src/core/VerdictRules.ts`
- **Hard Rules**:
    - CRITICAL exists -> BLOCKED
    - HIGH + LEGAL exists -> BLOCKED
    - HIGH exists -> RESTRICTED
    - MEDIUM only -> CONDITIONAL
    - LOW/None -> ALLOWED

### API Module (`apps/api`)
#### [NEW] `apps/api/src/modules/risk/risk.module.ts`
- Registers `RiskController` and `RiskService`.

#### [NEW] `apps/api/src/modules/risk/risk.controller.ts`
- Endpoint: `GET /risk/assess/:targetType/:targetId`
- **Constraint:** Read-only on-demand calculation. No side effects.
- **Prohibition:** No `POST /recompute` or `POST /override`.

#### [NEW] `apps/api/src/modules/risk/risk.service.ts`
- Wraps `@rai/risk-engine` functionality.

## Data Structures

### Risk Explanation Schema (JSON)
```json
{
  "fsmState": "CRITICAL",
  "signals": ["..."],
  "since": "2023-10-10T10:00:00Z",
  "previous": "ELEVATED"
}
```

### Finance Risk Constraint
- `FinanceRiskCollector` must NOT perform calculations or forecasting. It only reads existing flags/statuses (e.g., BudgetStatus).

## Verification Plan

### Automated Tests
- **Unit Tests (`packages/risk-engine`):**
    - `should return BLOCKED if CRITICAL signal exists`
    - `should return RESTRICTED if HIGH signal exists (non-legal)`
    - `should return CONDITIONAL if only MEDIUM signals exist`
- **Integration Tests:**
    - Simulate R&D Experiment without conclusion -> Verify `RiskAssessment` creation with expected Verdict.

### Manual Verification
- **API Check:**
    - Call `GET /risk/assess/...` for a known high-risk entity and verify JSON response structure and verdict.

# Phase Beta Closure Implementation Plan (B6.x)

## B6.1 Decision Traceability
**Goal**: Create an immutable audit log of *automated* decisions. "If the system said NO, we must know WHY forever."

### Schema Changes
- **Model**: `DecisionRecord`
    - `id`: CUID
    - `actionType`: `START_SEASON` | `SCALE_TECH` | ...
    - `targetId`: string (poly)
    - `riskVerdict`: `RiskVerdict`
    - `riskState`: `RiskFsmState`
    - `explanation`: JSON (Snapshot of `RiskAssessment.explanation`)
    - `decidedAt`: DateTime (default now)
    - `traceId`: string (correlation ID)

### Implementation
- **Service**: `DecisionService` (in `@rai/risk-engine` or `api/shared`)
    - `record(action, target, assessment)`: void (fire and forget persistence)

## B6.2 Risk Gates (The "No")
**Goal**: Physical code-level blocking of actions if Risk is BLOCKED.

### Core Logic
- **Error**: `class RiskBlockedError extends Error`
- **Guard Pattern**:
  ```typescript
  async function executeCriticalAction() {
     const assessment = await riskEngine.assess(...);
     if (assessment.verdict === 'BLOCKED') {
        await decisionService.record('ACTION', id, assessment);
        throw new RiskBlockedError(assessment);
     }
  }
  ```
- **Target Points**: 
  - `SeasonOrchestrator.startSeason`
  - (Future) `TechMapService.applyTemplate`

## B6.3 Risk Timeline
**Goal**: Visualize the evolution of risk to prove it's not random.

### Schema Changes
- **Model**: `RiskStateHistory`
    - `id`: CUID
    - `targetType`, `targetId`
    - `fromState`: `RiskFsmState`
    - `toState`: `RiskFsmState`
    - `reason`: string
    - `checkId`: Link to a specific assessment/check?
    - `createdAt`: DateTime

### Implementation
- **FSM Hook**: Inside `RiskFsm.transition` or `RiskAggregator`, if state changes != current, persist transition.

## B6.4 Beta Exit Canon
**Goal**: Documentation as a Contract.
- Create `docs/01-ARCHITECTURE/BETA_EXIT_CRITERIA.md`.
- Sections:
    1. System Decides (Guards, Invariants)
    2. System Ignores (Business Context, Override)
    3. Responsibility Matrix (Engine vs Orchestrator vs Human)

