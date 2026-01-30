# MG CORE FREEZE MANIFESTO

> [!CAUTION]
> **SYSTEM STATUS: FROZEN**
> The core architectures defined below are IMMUTABLE without Level 5 Architectural Review.
> Developers must build **around** these cores using Adapters and Extensions, not modify them.

## 1. The Core Philosophy
MatrixGin is built on a stable, verified kernel. We do not "refactor" the core; we extend it.
- **Code is Truth**: The implementation in `backend/src` IS the documentation.
- **FSM Integrity**: State transitions defined in Canons are physical laws.
- **Strict Boundaries**: Modules communicate via defined APIs/Events, not database hacking.

## 2. Canon Registry

| ID | Module | Responsibility | Canon File |
|----|--------|----------------|------------|
| **C-01** | **AUTH / IAM** | Identity, Sessions, Access | [AUTH_CORE_CANON.md](./AUTH_CORE_CANON.md) |
| **C-02** | **OFS** | Org Structure, Roles, Hierarchy | [OFS_CORE_CANON.md](./OFS_CORE_CANON.md) |
| **C-03** | **TASK ENGINE** | Universal Workflows | [TASK_ENGINE_CANON.md](./TASK_ENGINE_CANON.md) |
| **C-05** | **PSEE (MES)** | Production Execution | [PSEE_CORE_CANON.md](./PSEE_CORE_CANON.md) |

## 3. The "No-Touch" Zones
Any pull request modifying the following paths requires `CODEOWNER` approval:
- `backend/src/services/auth.service.ts`
- `backend/src/services/ofs.service.ts`
- `backend/src/services/task.service.ts`
- `backend/src/mes/services/*`
- `backend/prisma/schema.prisma` (Core tables)

## 4. How to Extend? (The Adapter Pattern)
If you need a new feature:
1. **Do not add columns** to core tables if they are domain-specific.
2. **Create a Sidecar Table** (e.g., `sales_tasks` linked to `tasks.id`).
3. **Use the Adapter Layer** to bridge concepts (see `docs/adapters`).
4. **Listen to Events**: React to `SHIFT_COMPLETED` rather than modifying `mes.service.ts`.
