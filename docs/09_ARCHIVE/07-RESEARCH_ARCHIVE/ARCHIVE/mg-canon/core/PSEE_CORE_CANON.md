---
id: DOC-ARH-GEN-166
type: Legacy
layer: Archive
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# PSEE CORE CANON (MES / Production)

> [!WARNING]
> **ACCESS LEVEL: FROZEN**
> This core module controls the physical production and value creation.
> Direct database manipulation of Production Orders is STRICTLY FORBIDDEN.

## 1. Core Responsibility
PSEE (Planning, Scheduling, Execution, Engineering) is responsible for:
- **Production Order Management**: Lifecycle of a client order.
- **Work Orders**: Granular steps (Retouch, QC, etc.).
- **Quality Control**: `QualityCheck` and `Defect` tracking.
- **Shift Management**: Tracking active working time.
- **Earnings Forecast**: Real-time estimation of piecework wages.

## 2. Canonical Data Model
- **ProductionOrder**: Converting raw input (Photos) to Product.
- **WorkOrder**: Atomic task for an Employee within a PO.
- **QualityCheck**: Gatekeeper mechanism (Pass/Fail).
- **Defect**: Record of waste/rework.

## 3. Structural Rules
1. **No Work Without Order**: Every action must be linked to a `WorkOrder` or `ProductionOrder`.
2. **Quality Gates**: A Production Order cannot be `COMPLETED` without specific QC passes.
3. **Immutable Traceability**: Who did what and when (Audit Trail of manufacturing).

## 4. Forbidden Modifications
1. ❌ **Do NOT** bypass the `WorkOrder` state machine.
2. ❌ **Do NOT** delete Production Orders; use cancellation.
3. ❌ **Do NOT** calculcate final earnings here; PSEE *estimates* earnings, but `Economy` module *credits* the wallet.

## 5. Extension Points
- **Adapters**: Import orders from CRM/ERP.
- **Metadata**: Order specs JSON.
