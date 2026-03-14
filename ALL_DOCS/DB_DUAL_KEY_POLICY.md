# DB_DUAL_KEY_POLICY

## Purpose

Фиксирует обязательный dual-key контракт для перехода `companyId -> tenantId` без разрушения текущего runtime.

## Canonical policy

- `companyId` остается обязательным compatibility-key для существующего business/runtime потока.
- `tenantId` вводится additive-first как platform boundary key.
- На `Phase 1` источником tenant scope в runtime считается:
  1. `request.user.tenantId`, если присутствует;
  2. fallback на `request.user.companyId` (feature-flag controlled).

## Scope class contract

- `tenant-scoped operational` (core business): пока остается на `companyId`.
- `tenant-scoped control-plane` (Phase 1 contour): получает `tenantId` nullable + shadow-write.
- `business-scoped`: `companyId` остается бизнес-связью, не platform scope.
- `system/global`: не участвует в tenant-filters.

## Runtime enforcement mode

`PrismaService` поддерживает dual-key mode через env:

- `TENANT_DUAL_KEY_MODE=off|shadow|enforce`
- `TENANT_DUAL_KEY_COMPANY_FALLBACK=true|false`
- `TENANT_DRIFT_ALERT_THRESHOLD=<N>`

Поведение:
- `off`: только legacy `companyId`.
- `shadow` (default): write-path заполняет `tenantId`, read-path не блокируется tenant фильтром, drift логируется.
- `enforce`: для Phase 1 dual-key моделей read/write filter включает `tenantId` guard (кроме `findUnique*` compatibility-path).

## Phase 1 dual-key model set

- `TenantState`
- `AgentConfiguration`
- `AgentCapabilityBinding`
- `AgentToolBinding`
- `AgentConnectorBinding`
- `AgentConfigChangeRequest`
- `RuntimeGovernanceEvent`
- `SystemIncident`
- `IncidentRunbookExecution`
- `PendingAction`
- `PerformanceMetric`
- `EvalRun`
- `EventConsumption`
- `MemoryInteraction`
- `MemoryEpisode`
- `MemoryProfile`

## Hard constraints

- Запрещен destructive rename `companyId -> tenantId` до завершения backfill + runtime hardening.
- Запрещено использовать `TenantCompanyBinding` как второй business source-of-truth.
- Любой новый control-plane/runtime model обязан иметь explicit decision: `tenantId now` или ADR с defer.
