# Consulting Core Implementation: Execution Plan
Status: READY FOR EXECUTION
Context: Phase Beta (Harvest Management & Consulting Core)

## 0. Context & Documentation
All implementation MUST follow the canonical documentation in `docs/CONSULTING/`:
1.  **`CONSULTING CORE`**: Terminology (Harvest, TechMap, etc.)
2.  **`CONSULTING_SCHEMA`**: Data models and relationships.
3.  **`FSM_RBAC`**: Status transitions and permission logic.
4.  **`CONSULTING_IA`** & **`_SCREENS`**: UI structure and flow.
5.  **`CONSULTING_SCREEN_PASSPORTS`**: Strict contracts for each screen.
6.  **`КАНОНИЧЕСКАЯ СТРУКТУРА БОКОВОГО МЕНЮ`**: Navigation.

---

## Phase 1: Schema & Data Layer (Canons: `CONSULTING_SCHEMA`, `FSM_RBAC`)

**Objective**: Implement the data foundation.

### Tasks:
1.  **Update `schema.prisma`**:
    *   Create `HarvestPlan` model:
        *   Fields: `id`, `accountId`, `contextSnapshot` (JSON), `targetMetric`, `min/opt/max`, `status` (Enum).
        *   Relations: `account`, `techMaps`.
    *   Create `TechMap` model:
        *   Fields: `id`, `harvestPlanId`, `targetState` (JSON), `streams` (JSON), `checkpoints` (JSON), `status` (Enum).
        *   Relations: `harvestPlan`.
    *   Create `PerformanceContract` model:
        *   Fields: `harvestPlanId`, `feeRules` (JSON), `safetyNetRules` (JSON).
    *   Create `DeviationReview` & `DecisionRecord` models:
        *   For tracking anomalies and formal decisions.
    *   Enums: `HarvestPlanStatus`, `TechMapStatus`, `DeviationStatus`, `DecisionType`.
2.  **Migration**:
    *   Run `npx prisma db push` or create a migration to apply changes.
    *   Generate Prisma Client (`npx prisma generate`).

---

## Phase 2: API Layer (NestJS)

**Objective**: Create the backend logic for Harvest Management.

### Tasks:
1.  **Module Scaffolding**:
    *   Generate `ConsultingModule`, `ConsultingService`, `ConsultingController`.
2.  **HarvestPlan Service**:
    *   Implement CRUD operations.
    *   Implement FSM logic (Status transitions: Draft -> Reviewed -> Approved -> Active).
3.  **TechMap Service**:
    *   Implement logic for creating a TechMap from a Plan.
    *   Implement "Freezing" logic (Snapshotting).
4.  **DTOs**:
    *   Create DTOs strictly based on `CONSULTING_SCREEN_PASSPORTS.md` inputs/outputs.

---

## Phase 3: Frontend Shell (Navigation & Layout)

**Objective**: Implement the canonical navigation with strict RBAC visibility.

### Tasks:
1.  **Role-Based Sidebar (`Sidebar.tsx`)**:
    *   Modify `Sidebar.tsx` to reflect `КАНОНИЧЕСКАЯ СТРУКТУРА БОКОВОГО МЕНЮ`.
    *   **CRITICAL**: Implement visibility rules.
        *   Agronomist: Sees "Управление Урожаем", "Исполнение". **HIDDEN**: "Экономика", "Финансы".
        *   Manager: Sees all operational sections.
        *   Executive: Sees strategic dashboards.
2.  **Routing**:
    *   Create the route structure in `apps/web/app/consulting/`:
        *   `/consulting/dashboard`
        *   `/consulting/plans`
        *   `/consulting/techmaps`
        *   `/consulting/execution`
        *   `/consulting/deviations`
        *   `/consulting/performance` (Protected: Requires `VIEW_ECONOMICS` permission)

---

## Phase 3.5: FSM + RBAC UI Enforcement Layer (CRITICAL)

**Objective**: Implement the logic that strictly binds UI capabilities to Entity Status and User Role.

### Tasks:
1.  **UI Policy Engine (`uiPolicy.ts`)**:
    *   Create a central utility: `getUiPermissions(entity, status, role)`.
    *   Must return: `{ canEdit: boolean, canApprove: boolean, canViewEconomics: boolean, allowedTransitions: Status[] }`.
    *   **Rule**: UI components must query this policy before rendering any action button.
2.  **Status-Driven Modes**:
    *   **Draft Mode**: Full edit capabilities for creators.
    *   **Active Mode**: Strict **Read-Only** for core fields. Editing is only possible via "Deviation Request".
    *   **Frozen Mode**: TechMaps are immutable snapshots.
    *   **Archived Mode**: Read-Only for historical reference.

---

## Phase 4: Screens Implementation (Passports: `CONSULTING_SCREEN_PASSPORTS`)

**Objective**: Build the UI components with enforced behavior.

### Tasks:
1.  **Dashboard (`/consulting/dashboard`)**:
    *   Implement "Active Farms Summary".
    *   Implement "Risk Map" with role-based visibility (e.g., specific financial risks hidden from field staff).
2.  **Harvest Plans**:
    *   **List View**: FSM-filtered tabs (Drafts, Active, Review).
    *   **Designer**:
        *   **State: Draft** -> Editable Targets form.
        *   **State: Active** -> Read-Only Summary. No inline edits.
3.  **TechMaps**:
    *   **Workbench**: Interface for viewing operations.
    *   **State: Frozen** -> Absolutely no editing allowed.
4.  **Decision Record (NEW)**:
    *   Implement `/consulting/decisions/[id]`.
    *   **Immutable**: Once created, a decision record cannot be altered.
    *   **Legal Significance**: UI must clearly indicate this is a binding record.

---

## Start Instructions (For New Chat)

**Prompt:**
"We are starting the implementation of the Consulting Core (Harvest Management).
Please execute **Phase 1: Schema & Data Layer** from the `docs/06-IMPLEMENTATION/CONSULTING_CORE_EXECUTION_PLAN.md`.
Use `docs/CONSULTING/CONSULTING_SCHEMA.md` and `docs/CONSULTING/FSM_RBAC.md` as the source of truth for the Prisma schema."
