# DB_TENANCY_TRANSITION_RUNTIME_POLICY

## Purpose

Фиксирует runtime-правила переходного периода между legacy `companyId`-изоляцией и target `tenantId` boundary.

## Context payload contract

JWT/runtime context обязан нести:
- `tenantId`
- `companyId`
- `isSystem`

На `Phase 1` разрешен compatibility fallback:
- если `tenantId` отсутствует, используется `companyId`.

## Interceptor and context policy

- `TenantContextInterceptor` строит `TenantScope(companyId, isSystem=false, tenantId)`.
- `SystemWideOperationInterceptor` поднимает system-scope с сохранением текущего `companyId/tenantId` при наличии.
- `TenantContextService` предоставляет `getTenantId()` и `getCompanyId()`.

## Prisma runtime policy

Обязательные правила:
- legacy tenant guard по `companyId` сохраняется для tenant-scoped моделей;
- для Phase 1 dual-key моделей включен shadow-write `tenantId`;
- в `shadow` режиме drift детектируется логированием;
- в `enforce` режиме включается tenant guard для операций кроме `findUnique*` compatibility-path.

## Drift and alerting policy

- mismatch (`row.tenantId != context.tenantId`) фиксируется как `TENANT_DRIFT` warning.
- алертный escalation включается каждые `TENANT_DRIFT_ALERT_THRESHOLD` срабатываний.
- метрики:
  - `tenant_scope_mismatch_total`
  - `tenant_company_drift_alerts_total`

## Forbidden during transition

- Запрещен dual-write в отдельный active contour (`MG-Core` или иной).
- Запрещено убирать `companyId` из API/service контрактов Phase 1.
- Запрещено включать `tenantId` enforce для business-heavy core (`Season`, `TechMap`, `HarvestPlan`, `Task`, `EconomicEvent`, `LedgerEntry`, `Party`, `CommerceContract`) до отдельного Phase 3+ решения.
