# Implementation Plan - Sprint B2: HR Ecosystem & Tech Debt

# Goal: Implement the HR Ecosystem based on the 3-Contour Canon Architecture

> [!IMPORTANT]
> **HR Architecture Contours**:
> 1.  **Foundation Layer (Corporate)**: Stability & Hygiene (Registry, Onboarding).
> 2.  **Incentive Layer (Motivational)**: Direction & Alignment (OKR, KPI).
> 3.  **Development Layer (Strategic)**: The Core. Signal

## User Review Required

> [!IMPORTANT]
> **Canonical Rules for Implementation:**
> 1. **No Direct CRUD for Profiles:** `EmployeeProfile` is a projection of an external fact. Direct creation is FORBIDDEN.
> 2. **Fact Projection:** Foundation only synchronizes status and triggers processes.
> 3. **Decoupled CMR:** CMR consumes `HumanAssessmentSnapshot` data directly. No direct HR service calls allowed.
> 4. **Immutable Signals:** All signals (Pulse, Recognition) are append-only.

## Proposed Changes

### [Component] HR Foundation Layer (Corporate)
**Focus:** External-fact projection & status synchronization.

#### [MODIFY] [schema.prisma](file:///f:/RAI_EP/packages/prisma-client/schema.prisma)
- [NEW] `HrOnboardingPlan`: Integration registry.
- [NEW] `HrSupportCase`: Helpdesk and operational hygiene.
- [MODIFY] `EmployeeProfile`: Add `externalId`, `requiredRoleCompetencyRef` (Link to Development).

#### [NEW] `EmployeeService`
- **Logic:** Event-based lifecycle management.
- **API:** `POST /hr/foundation/events/employee-hired` (Trigger for profile projection).
- **API:** `POST /hr/foundation/events/employee-status-changed` (Sync logic).

---

### [Component] HR Incentive Layer (Alignment)
**Focus:** Direction and financial/social reinforcement.

#### [NEW] `IncentiveService`
- [NEW] `OkrCycle`, `Objective`, `KeyResult` (Direction).
- [NEW] `KPIIndicator`: Operational performance signals (Imported).
- [NEW] `RecognitionEvent`: Social reinforcement (Append-only).
- [NEW] `RewardEvent`: Financial amplifier tracking.

---

### [Component] HR Development Layer (Strategic)
**Focus:** Long-term human capital investment.

#### [NEW] `DevelopmentService`
- **Signal Layer:** `PulseSurvey`, `SurveyResponse` (Immutable observations).
- **Assessment Layer:** `HumanAssessmentSnapshot` (Understanding state: Burnout, Ethics).
- **Competency Layer:** `CompetencyDefinition`, `PersonalCompetencyState`.
- **Action Layer:** `DevelopmentPlan`, `DevelopmentAction` (Renamed from SupportAction).

---

## Verification Plan

### Automated Tests
- Test event-driven `EmployeeProfile` creation: `employee-hired` event -> `Profile` exists.
- Verify CMR isolation: `CmrService` reads `HumanAssessmentSnapshot` without calling `HrService`.
- Verify immutability of `RecognitionEvent` and `SurveyResponse`.

### Manual Verification
- Trace a hired employee through Onboarding -> OKR assignment -> Pulse Signal -> Risk Snapshot. management.

#### [NEW] `apps/api/src/modules/hr/incentive`
- `OkrService`: Alignment Engine.

#### [NEW] `apps/api/src/modules/hr/development`
- `SignalService`: Pulse & Feedback collection.
- `AssessmentService`: Logic for `HumanAssessmentSnapshot`.
- `DevelopmentService`: Plans & Actions.

#### [MODIFY] `apps/api/src/modules/cmr`
- **Integration**: `RiskService` consumes `AssessmentService.getControllability()`.

## Verification Plan

### Automated Tests
- **Unit Tests**:
    - Verify `HumanAssessmentSnapshot` immutability.
    - Verify `Controllability` calculation logic from signals.
- **Integration**:
    - Ensure `EmployeeProfile` creation triggers Onboarding flow.

### Manual Verification
- **API Testing**:
    - `POST /hr/foundation/employees` -> Create Profile.
    - `POST /hr/development/signals` -> Check immutable fact.
    - `GET /cmr/risks` -> Verify HR impact.
