# Task List: Open Registration & Security

- [x] **Database Updates**
    - [x] Add `reset_password_token`, `foundation_status` to User model (Schema).
    - [x] Add `Location` and `Position` models.
    - [x] Run `prisma db push`.

- [x] **Backend Implementation**
    - [x] Modify `TelegramService` (/start command).
    - [x] Modify `EmployeeRegistrationService` (Self-Reg, Token, Overrides).
    - [x] Modify `EmailService` (Password Link).
    - [x] Modify `FoundationController` (Status Sync).
    - [x] Modify `FoundationService` (Status Sync, Cleanup).

- [x] **Frontend Implementation**
    - [x] **Foundation Widget**
        - [x] Implement with `isLoading`, optional chaining, and safe-state default.
        - [x] Driven ONLY by `foundation_status`.
    - [x] **Sidebar/Status Badge**
        - [x] Always visible.
        - [x] Guarded state access (no direct `state.status.xxx`).
    - [x] **Restricted View**
        - [x] Block access to Applied Courses until `ACCEPTED`.
        - [x] Allow Dashboard (Limited) and Foundation Flow.
    - [ ] Add "Set Password" Page (consuming token).

- [ ] **Technical Debt**
    - [ ] Remove `@ts-ignore` in Foundation Backend after `prisma generate` succeeds.

- [ ] **Verification**
    - [ ] Manual Full Cycle Test.
