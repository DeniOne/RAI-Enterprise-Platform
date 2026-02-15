---
id: DOC-ARH-GEN-167
type: Legacy
layer: Archive
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# TASK ENGINE CANON

> [!WARNING]
> **ACCESS LEVEL: FROZEN**
> This is the Universal Execution Engine for all workflows.
> Modifications require IO (Integration Office) approval.

## 1. Core Responsibility
The Task Engine is responsible for:
- **Unit of Work**: Creating and tracking atomic `Task` entities.
- **Workflow**: State machine implementation (`TODO` -> `IN_PROGRESS` -> `DONE`).
- **Assignment**: Routing tasks to `User` or `Employee` or `Role`.
- **Auditing**: History of status changes and comments.

## 2. Canonical Data Model
- **Task**: The central entity.
  - `status`: Enum (State Machine).
  - `priority`: Enum.
  - `assignee_id`: Target executor.
  - `creator_id`: Owner/Demand source.
  - `department_id`: OFS validation scope.
- **TaskComment**: Communication channel context-bound to the task.

## 3. Structural Rules
1. **Universal ID**: Every piece of work must have a Task ID if it requires tracking.
2. **Immutability of History**: `TaskHistory` or Audit logs cannot be deleted.
3. **State Machine Integrity**: Forbidden transitions (e.g. `DONE` -> `TODO`) should be guarded (generic logic currently allows it but Canon suggests strictness).

## 4. Forbidden Modifications
1. ❌ **Do NOT** fork the Task table for specific modules (e.g., "HRTask", "SalesTask"). Use strict typing or discriminator fields in the single `Task` table or extension tables (1-to-1).
2. ❌ **Do NOT** remove the `department_id` linkage; tasks must belong to a cost center/structure unit.

## 5. Extension Points
- **Adapters**: Sync with Jira/Trello/Telegram.
- **Metadata**: `Task.metadata` (JSON) for module-specific payloads.
