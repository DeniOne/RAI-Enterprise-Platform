# ADAPTER LAYER ARCHITECTURE

> [!TIP]
> **Philosophy**: "Extend, don't Modify".
> Use this layer to build specific domain logic (Sales, Marketing, HR-Ops) on top of the frozen Core.

## 1. Architectural Patterns

### A. The Sidecar Pattern (Data Extension)
When you need to add data to a Core entity (e.g., `User` or `Task`), do NOT add columns to the core table.
**Pattern**: Create a `1-to-0..1` or `1-to-1` table with a foreign key.

*Example*: Sales Manager needs a "Commission Rate".
- ❌ **Bad**: Add `commission_rate` to `users` table.
- ✅ **Good**: Create `sales_profiles` table:
  ```prisma
  model SalesProfile {
    id String @id
    user_id String @unique // Link to Core
    commission_rate Float
    territory String
  }
  ```

### B. The Facade Pattern (Service Composition)
When a business process involves multiple Core modules (e.g., "Hire Employee" = Auth + OFS + HR), create a **Domain Facade**.

*Example*: `HiringService`
- Calls `AuthService.register()`
- Calls `OFSService.assignRole()`
- Calls `PaperworkService.generateContract()`

### C. The Event Listener (Reactive Logic)
Decouple side effects using the `EventDispatcher`.

*Example*: When `ProductionOrder` is completed:
1. PSEE Core emits `PRODUCTION_ORDER_COMPLETED`.
2. **Economy Adapter** listens -> Calculates Wages -> Credits Wallet.
3. **Notification Adapter** listens -> Sends Telegram msg.

## 2. Directory Structure Recommendation
```
backend/src/
├── core/           # FROZEN (Auth, OFS, Task, PSEE)
├── adapters/       # The new layer
│   ├── sales/      # Sales domain logic
│   │   ├── sales_profile.entity.prisma
│   │   ├── sales.facade.ts
│   │   └── sales.listener.ts
│   ├── hr-ops/
│   └── marketing/
```

## 3. Implementation Rules
1. **Dependency Direction**: Adapters depend on Core. Core **NEVER** depends on Adapters.
2. **API Isolation**: Adapters should have their own Controllers/Routes (`/api/sales/...`).
3. **Guardrails**: Adapters cannot bypass Core validation (e.g., cannot insert a Task without `creator_id`).
