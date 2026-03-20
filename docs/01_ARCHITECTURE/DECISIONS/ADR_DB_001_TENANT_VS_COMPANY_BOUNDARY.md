---
id: DOC-ARC-DECISIONS-ADR-DB-001-TENANT-VS-COMPANY-BOU-1CYG
layer: Architecture
type: ADR
status: approved
version: 0.1.0
owners: [@techlead, @backend-lead, @data-architecture]
last_updated: 2026-03-13
---
# ADR_DB_001: Tenant vs Company Boundary

## Статус
`Accepted` (2026-03-13, DB refactor program)

## Контекст

В текущей модели `companyId` одновременно выполняет 4 роли:
- tenant boundary;
- business/legal ownership;
- access key для runtime isolation;
- surrogate для global/preset scope через `NULL`.

Это создает structural debt:
- `Company` становится god-root;
- tenancy semantics размываются;
- control-plane и business semantics смешиваются;
- migration становится рискованной.

## Решение

1. Платформенный boundary вводится через отдельный `Tenant`.
2. `Company` остается business/legal entity.
3. В переходном периоде применяется dual-key policy:
- `tenantId` = platform isolation key;
- `companyId` = business/legal association + compatibility key.
4. Destructive rename `companyId -> tenantId` в ранних фазах запрещен.
5. Первыми переводятся control-plane/runtime модели, не core business aggregates.

## Последствия

Плюсы:
- появляется чистая platform boundary;
- снижается роль `Company` как system root;
- migration становится staged и rollback-safe.

Минусы:
- временно нужно поддерживать dual-key runtime logic;
- усложняются invariants переходного периода;
- требуется mismatch logging и shadow mode.

## Guardrails

- новая модель не может автоматически root-иться в `Company`;
- source tenant scope берется только из runtime context;
- `companyId = NULL` не используется как universal global scope;
- любой переход модели на `tenantId` должен быть зафиксирован в `MODEL_SCOPE_MANIFEST.md`.

## Verification

- `MODEL_SCOPE_MANIFEST.md` содержит классификацию high-risk моделей;
- `TenantContextService` поддерживает `tenantId + companyId + isSystem`;
- mismatch counters и alerts включены;
- нет конфликтов классификации типа `EventConsumption`.
