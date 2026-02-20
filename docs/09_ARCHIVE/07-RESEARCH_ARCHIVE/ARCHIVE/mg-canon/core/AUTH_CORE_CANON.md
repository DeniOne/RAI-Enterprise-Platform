---
id: DOC-ARH-GEN-163
type: Legacy
layer: Archive
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# AUTH / IAM CORE CANON

> [!WARNING]
> **ACCESS LEVEL: FROZEN**
> This core module is CRITICAL infrastructure.
> Modifications are strictly prohibited without Architectural Review Board approval.

## 1. Core Responsibility
The Auth Core is responsible for:
- Identity Verification (Login/Register)
- Session Management (JWT / Refresh Tokens)
- Access Control Enforcement (scoping)
- Foundation Gate Enforcement (Admission Status)
- Telegram Account Binding

## 2. Canonical Data Model (Immutable)
- **User**: The central identity entity.
- **Roles**: `UserRole` (Enum) - Hardcoded RBAC levels (ADMIN, HR, EMPLOYEE, etc.).
- **AuthSession**: Secure tracking of refresh tokens and device fingerprints.
- **AdmissionStatus**: `NOT_ADMITTED` -> `ADMITTED` FSM transition.

## 3. Security Principals
1. **JWT Strategy**:
   - Access Token: Short-lived (15m - 1h).
   - Refresh Token: Long-lived (7d - 30d), strictly rotated.
2. **Scoping**:
   - Users with `AdmissionStatus != ADMITTED` are strictly sandboxed.
   - Foundation completion is a PREREQUISITE for system access.

## 4. Forbidden Modifications
1. ❌ **Do NOT** change the `User` primary key (UUID).
2. ❌ **Do NOT** alter the JWT payload structure without global migration.
3. ❌ **Do NOT** bypass `FoundationGuard` for any user role except `SUPERADMIN`.
4. ❌ **Do NOT** implement external Auth Providers (OAuth) directly in Core; use Adapters logic if needed in future.

## 5. Extension Points
- **Adapters**: Can consume `User` identity via Read-Only interface.
- **Metadata**: Use `User.profile` or generic JSON fields if profile expansion is needed.
