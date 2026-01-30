# Implementation Plan: Open Registration & Security

## Goal Description
Transition from invitation-only to "Open Registration" (Self-Registration) via Telegram, enhanced with critical security measures (Token-based Password Reset, Anti-Fraud) and robust Foundation Gate handling.

## User Review Required
- [x] Security: Replaced temporary passwords with token-based reset links.
- [x] Security: Added Anti-Fraud checks for self-registration.
- [x] Architecture: Helper "FoundationStatus" enum added to User model for fast gating.

## Proposed Changes

### Backend [DONE]
#### [MODIFY] [TelegramService](file:///f:/Matrix_Gin/backend/src/services/telegram.service.ts)
- [x] Implement `/start` command handler for new users to show "Start Registration" button.
- [x] Add Anti-Fraud check (prevent multiple active requests).

#### [MODIFY] [EmployeeRegistrationService](file:///f:/Matrix_Gin/backend/src/services/employee-registration.service.ts)
- [x] Update `startRegistration` to CREATE requests if they don't exist.
- [x] Update `approveRegistration` to:
    - Accept `departmentId` and `locationId` overrides.
    - Generate `reset_password_token` instead of temporary password.
    - Set `foundation_status` to 'NOT_STARTED'.

#### [MODIFY] [EmailService](file:///f:/Matrix_Gin/backend/src/services/email.service.ts)
- [x] Add `sendPasswordSetupLink` method.

#### [MODIFY] [FoundationController](file:///f:/Matrix_Gin/backend/src/controllers/foundation.controller.ts)
- [x] Sync `User.foundation_status` on `submitDecision`.
- [x] Add `@ts-ignore` for new fields.

#### [MODIFY] [FoundationService](file:///f:/Matrix_Gin/backend/src/services/foundation.service.ts)
- [x] Sync `User.foundation_status` to 'IN_PROGRESS' on `registerBlockView`.

### Frontend [DONE]
#### [NEW/MODIFY] Dashboard & Sidebar
- [x] Implement Foundation Widget (Access to Foundation blocks).
- [x] Add Foundation Status Badge (Visible always).
- [x] Ensure "Open Registration" users land on a restricted view until Foundation is accepted.

## Verification Plan
### Automated Tests
- Run `prisma db push` (Done).
- Verify Telegram Flow (Manual).

### Manual Verification
- `/start` as new user -> Registration Button.
- Complete Registration -> Admin Approve (with loc/dept).
- Email received with Link.
- Login -> Foundation Check (NOT_STARTED).
- View Block -> Status IN_PROGRESS.
- Accept Foundation -> Status ACCEPTED.
