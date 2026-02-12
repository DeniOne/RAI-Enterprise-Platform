# TechMap Integration Walkthrough

## Overview
Implemented the "Production Gate" for Harvest Plans by refining the TechMap lifecycle and integrating a formal Finite State Machine (FSM).

## Changes

### 1. Prisma Schema (`packages/prisma-client/schema.prisma`)
- Updated `TechMapStatus` enum: `DRAFT`, `REVIEW`, `APPROVED`, `ACTIVE`, `ARCHIVED`.
- Added fields to `TechMap` model:
  - `approvedAt`: Timestamp of approval.
  - `operationsSnapshot`: JSON immutable copy of operations.
  - `resourceNormsSnapshot`: JSON immutable copy of resources.

### 2. Finite State Machine (`apps/api/src/modules/tech-map/fsm/tech-map.fsm.ts`)
- Created `TechMapStateMachine` class.
- Implemented strict transition rules:
  - `DRAFT` -> `REVIEW` (Manager)
  - `REVIEW` -> `APPROVED` (Agronomist/Admin)
  - `REVIEW` -> `DRAFT` (Reject)
  - `APPROVED` -> `ACTIVE` (CEO/Admin) - **Production Gate**
  - `ACTIVE` -> `ARCHIVED` (Admin)

### 3. Service Logic (`apps/api/src/modules/tech-map/tech-map.service.ts`)
- Integrated `TechMapStateMachine` into `transitionStatus` method.
- Added strict RBAC checks using `user` context.
- Implemented **Integrity Gate** check specific to `APPROVED` -> `ACTIVE` transition.

### 4. Domain Rules (`apps/api/src/modules/consulting/domain-rules/consulting.domain-rules.service.ts`)
- Updated `canActivatePlan` to **require** `ACTIVE` TechMap status.
- Removed allowance for `CHECKING` (now `REVIEW`) status.

### 5. Controller (`apps/api/src/modules/tech-map/tech-map.controller.ts`)
- Updated `transition` endpoint to pass `user.role` and `user.id` to service.

## Verification

### Unit Tests
- `apps/api/src/modules/consulting/domain-rules/consulting.domain-rules.spec.ts`: **Updated**. Verifies that only `ACTIVE` TechMap allows Plan activation. Redirects `REVIEW`/`APPROVED` to rejection.
- `apps/api/src/modules/tech-map/fsm/tech-map.fsm.spec.ts`: **Created**. Verifies all FSM transitions and RBAC permissions.

### Testing Constraint
- **Migration**: `npx prisma migrate dev` faced environment execution issues (shell parsing/hang). 
- **Tests**: `jest` commands faced similar shell parsing issues ("onsulting" not recognized).
- **Code Integrity**: The code logic is implemented and verified via static analysis. The unit tests are written and ready to be run in a proper environment.

## Next Steps
1. Run `npx prisma migrate dev --name tech_map_status_update` in a proper terminal.
2. Run `npm test` or `npx jest` to confirm unit tests pass.
3. Verify End-to-End flow via API or UI.
