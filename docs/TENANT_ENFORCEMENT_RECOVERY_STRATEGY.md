# TENANT ENFORCEMENT RECOVERY STRATEGY

## 1. STRATEGIC DECISION MATRIX

| Option | Implementation Complexity | Security Grade | Performance Impact | Migration Effort | RECOMMENDATION |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Restore Middleware ($extends)** | Medium | 9/10 | Minimal | Low (Refactor `PrismaService`) | **PRIMARY** |
| **B. Database RLS (Global)** | High | 10/10 | Moderate | High (SQL Migrations for all tables) | **SECONDARY (Hardening)** |
| **C. Service-Layer Enforcement** | Low | 6/10 | None | Medium-High (Manual code changes) | **AVOID** |

---

## 2. RECOMMENDED PATH: MODULAR HARDENING

We recommend a two-stage recovery process to ensure zero-leakage without business disruption.

### STAGE 1: RESTORE AUTOMATED GUARD (ASAP)
Migrate the commented-out `PrismaTenantMiddleware` logic to **Prisma Client Extensions ($extends)**.
*   **Why:** Extensions are the modern, non-deprecated way to intercept queries in Prisma 5+.
*   **Action:** Implement `query` client extension that automatically injects `companyId` into all queries targeting `tenantScopedModels`.
*   **Safety:** Initially deploy in `shadow` mode (logging only) to verify compliance, then flip to `strict`.

### STAGE 2: DATABASE-LEVEL TRUTH (Long-term)
Expand the RLS pattern used in the Finance module across the entire database.
*   **Why:** RLS is the only way to protect against direct SQL access, raw queries, and developer mistakes.
*   **Action:** Add `ENABLE ROW LEVEL SECURITY` to all tables and unified policies checking `app.current_company_id`.

---

## 3. IMPLEMENTATION BLUEPRINT (STAGE 1)

```typescript
// Proposed structure for PrismaService.ts extension
this.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (tenantScopedModels.has(model)) {
          // Inject companyId from context/cls-hooked
          args.where = { ...args.where, companyId: currentTenantId() };
        }
        return query(args);
      },
    },
  },
});
```

---

## 4. IMMEDIATE NEXT STEPS

1.  **Draft Migration Plan:** Identify all non-RLS tables and prepare SQL templates.
2.  **Prototype $extends:** Test tenant injection in a isolated dev environment.
3.  **Audit Raw Queries:** Replace any cross-tenant raw SQL with safe, contextualized versions.

---
*Signed: ARCHITECTURAL SECURITY AUDITOR*
