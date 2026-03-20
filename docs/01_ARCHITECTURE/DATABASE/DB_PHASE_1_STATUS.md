---
id: DOC-ARC-DATABASE-DB-PHASE-1-STATUS-31WI
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_PHASE_1_STATUS

## Scope

Этот файл фиксирует фактическое выполнение `Phase 1. Additive Tenancy In Control-Plane` из `DB_REFACTOR_CHECKLIST.md`.

## Done

- [x] В `schema.prisma` добавлены модели `Tenant` и `TenantCompanyBinding`.
- [x] Добавлен migration wave `20260313103000_phase1_additive_tenant_boundary`.
- [x] Добавлен additive `tenantId` в Phase 1 control-plane/runtime модели:
- [x] `TenantState`
- [x] `AgentConfiguration`
- [x] `AgentCapabilityBinding`
- [x] `AgentToolBinding`
- [x] `AgentConnectorBinding`
- [x] `AgentConfigChangeRequest`
- [x] `RuntimeGovernanceEvent`
- [x] `SystemIncident`
- [x] `IncidentRunbookExecution`
- [x] `PendingAction`
- [x] `PerformanceMetric`
- [x] `EvalRun`
- [x] `EventConsumption`
- [x] `MemoryInteraction`
- [x] `MemoryEpisode`
- [x] `MemoryProfile`
- [x] В runtime добавлен dual-key context contract: `tenantId + companyId + isSystem`.
- [x] JWT payload расширен `tenantId` (compatibility fallback на `companyId`).
- [x] `PrismaService` переведен на dual-key policy:
- [x] shadow-write `tenantId` для Phase 1 dual-key моделей;
- [x] shadow-read drift detection;
- [x] feature-flagged fallback (`TENANT_DUAL_KEY_COMPANY_FALLBACK`);
- [x] optional enforce mode (`TENANT_DUAL_KEY_MODE=enforce`).
- [x] Добавлены drift metrics: `tenant_scope_mismatch_total`, `tenant_company_drift_alerts_total`.
- [x] Добавлены policy artifacts:
- [x] `DB_DUAL_KEY_POLICY.md`
- [x] `DB_TENANCY_TRANSITION_RUNTIME_POLICY.md`
- [x] `MODEL_SCOPE_MANIFEST.md` пересинхронизирован до `195/195` моделей.

## Verification

- [x] `pnpm --dir packages/prisma-client exec prisma format`
- [x] `DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm --dir packages/prisma-client exec prisma validate`
- [x] `pnpm --dir apps/api exec tsc --noEmit --pretty false`

## Known risks

- [ ] Реальный `tenantId` backfill для legacy rows еще не выполнен (пока shadow-mode).
- [ ] `TenantCompanyBinding` lifecycle (bootstrap/backfill/reconcile) требует отдельного execution slice.
- [ ] End-to-end runtime checks на production-like dataset еще не выполнены.

## Next execution slice

1. Включить controlled backfill `tenantId` для Phase 1 model set.
2. Добавить runbook на drift triage и reconciliation по `TenantCompanyBinding`.
3. Подготовить старт `Phase 2` (`Company de-rooting`) с measurement baseline по relation graph.
