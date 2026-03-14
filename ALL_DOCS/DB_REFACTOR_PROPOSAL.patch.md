# DB_REFACTOR_PROPOSAL.patch.md

Это design-only proposal для первого реального tranche.
Этот tranche ограничен `Phase 0 + Phase 1`.

Никаких destructive schema rewrites, никакого physical split, никакого dual-write с `MG-Core`.

## Hard boundary

В первой реализации запрещено:
- переименовывать `companyId -> tenantId`;
- трогать destructively `Season`, `TechMap`, `HarvestPlan`, `Task`, `EconomicEvent`, `LedgerEntry`, `Party`, `CommerceContract`;
- автоматически root-ить новые модели в `Company`;
- добавлять новые cross-domain relations без ADR;
- использовать `companyId = NULL` как universal global scope;
- использовать `JSONB` как замену отсутствующей модели;
- делать read models источником истины;
- использовать `MG-Core` как active runtime fallback.

## Scope of first tranche

Первый tranche делает только следующее:
- governance package;
- manifests;
- CI rules;
- additive `Tenant` и `TenantCompanyBinding`;
- nullable `tenantId` только в control-plane contour;
- dual-key runtime policy;
- mismatch logging.

## Safe first changes

### 1. Создать governance artifacts
Добавить:
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_003_ENUM_GOVERNANCE.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md`

### 2. Создать manifest layer
Добавить:
- `docs/01_ARCHITECTURE/DATABASE/MODEL_SCOPE_MANIFEST.md`
- `docs/01_ARCHITECTURE/DATABASE/DOMAIN_OWNERSHIP_MANIFEST.md`
- `docs/01_ARCHITECTURE/DATABASE/READ_MODEL_POLICY.md`
- `docs/01_ARCHITECTURE/DATABASE/DB_SUCCESS_METRICS.md`

### 3. Добавить CI / governance checks
Добавить проверки на:
- model scope consistency;
- domain ownership consistency;
- forbidden cross-domain relations;
- enum growth budget;
- duplicate/weak indexes;
- heavy Prisma include trees;
- consistency между manifest и `PrismaService`.

### 4. Ввести `Tenant` как additive primitive
Добавить только:
- `Tenant`
- `TenantCompanyBinding`

### 5. Добавить `tenantId` только в control-plane contour
Первые target models:
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

## Proposed model scope manifest contract

Каждая модель в manifest должна получить поля:
- `scope_type`: `tenant` / `business` / `global` / `preset` / `system` / `mixed-transition`
- `owner_domain`
- `authoritative_key`
- `company_id_policy`
- `tenant_id_policy`
- `global_row_allowed`
- `preset_row_allowed`
- `migration_phase`
- `notes`

Жесткое правило:
- модель без manifest-строки не может участвовать в tenancy migration.

## Proposed domain ownership manifest contract

В первой итерации фиксируются только 8 верхнеуровневых доменов:
- `platform_core`
- `org_legal`
- `agri_planning`
- `agri_execution`
- `finance`
- `crm_commerce`
- `ai_runtime`
- `integration_reliability`

Подконтуры:
- `ai_runtime/knowledge_memory`
- `ai_runtime/risk_governance`
- `quarantine_sandbox/research_rd`
- `legacy_bridge`

Почему так:
- это снижает риск over-modularization;
- ownership становится яснее;
- вы управляете boundary, а не папками.

## Proposed schema fragment layout

Первый layout должен быть укрупнённым:
- `packages/prisma-client/prisma/00_base.prisma`
- `packages/prisma-client/prisma/01_platform_core.prisma`
- `packages/prisma-client/prisma/02_org_legal.prisma`
- `packages/prisma-client/prisma/03_agri_planning.prisma`
- `packages/prisma-client/prisma/04_agri_execution.prisma`
- `packages/prisma-client/prisma/05_finance.prisma`
- `packages/prisma-client/prisma/06_crm_commerce.prisma`
- `packages/prisma-client/prisma/07_ai_runtime.prisma`
- `packages/prisma-client/prisma/08_integration_reliability.prisma`
- `packages/prisma-client/prisma/09_quarantine_sandbox.prisma`
- `packages/prisma-client/prisma/10_legacy_bridge.prisma`
- `packages/prisma-client/prisma/schema.compose.ts`

Правило:
- `knowledge_memory` и `risk_governance` пока не раскладывать в отдельные top-level fragments;
- `research_rd` держать в quarantine/sandbox fragment до отдельного доказательства.

## Proposed tenancy additions

### New target models

```prisma
model Tenant {
  id               String       @id @default(cuid())
  key              String       @unique
  displayName      String
  status           TenantStatus @default(ACTIVE)
  primaryCompanyId String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}

model TenantCompanyBinding {
  id         String   @id @default(cuid())
  tenantId   String
  companyId  String
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([tenantId, companyId])
  @@index([companyId])
}
```

### Dual-key policy
На переходный период:
- `tenantId` = platform isolation;
- `companyId` = business/legal association и compatibility key;
- `companyId` не удаляется;
- новый runtime context обязан хранить оба ключа.

## Proposed transition runtime policy

Минимальный контракт:

```ts
interface TenantRuntimeContext {
  tenantId: string | null;
  companyId: string | null;
  isSystem: boolean;
}
```

Обязательные правила:
- scope приходит только из runtime context;
- payload не может быть authoritative source для tenant scope;
- `tenantId` paths сначала включаются в shadow mode;
- mismatch между `tenantId` и `companyId -> tenant` mapping логируется;
- fallback на `companyId`-only path остаётся feature-flagged.

## Proposed read model policy

Projection/read model можно создавать только если выполняется хотя бы одно условие:
- есть тяжёлое cross-domain чтение;
- есть стабильный UI/workspace use-case;
- есть повторяющийся аналитический или операционный view.

Для каждой projection обязательно фиксировать:
- владельца;
- source of truth;
- SLA обновления;
- способ обновления;
- можно ли пересобрать детерминированно;
- срок хранения и потребителей.

Жесткое правило:
- projection не может становиться системой записи.

## Proposed enum taxonomy contract

Каждый enum обязан попасть ровно в один класс:
- `technical closed enum`
- `FSM/status invariant enum`
- `business evolving vocabulary`
- `jurisdiction-sensitive vocabulary`
- `tenant-customizable vocabulary`
- `suspicious duplicate enum family`

Обязательные overlap matrices:
- `risk-*`
- `status-*`
- `source-*`
- `type-*`
- `mode-*`

## Proposed success metrics

Следить минимум за этими показателями:
- число прямых relations у `Company`;
- число моделей с неясным scope;
- число enum без taxonomy;
- число cross-domain relations без ADR;
- число hot queries без workload-confirmed indexes;
- медианная сложность Prisma include-графов;
- число новых моделей, добавленных без cross-domain правок.

## Pseudo-patch sketch

```diff
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_003_ENUM_GOVERNANCE.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md
*** Add File: docs/01_ARCHITECTURE/DATABASE/MODEL_SCOPE_MANIFEST.md
*** Add File: docs/01_ARCHITECTURE/DATABASE/DOMAIN_OWNERSHIP_MANIFEST.md
*** Add File: docs/01_ARCHITECTURE/DATABASE/READ_MODEL_POLICY.md
*** Add File: docs/01_ARCHITECTURE/DATABASE/DB_SUCCESS_METRICS.md
*** Add File: packages/prisma-client/prisma/schema.compose.ts
*** Add File: packages/prisma-client/prisma/01_platform_core.prisma
*** Add File: packages/prisma-client/prisma/02_org_legal.prisma
*** Add File: packages/prisma-client/prisma/03_agri_planning.prisma
*** Add File: packages/prisma-client/prisma/04_agri_execution.prisma
*** Add File: packages/prisma-client/prisma/05_finance.prisma
*** Add File: packages/prisma-client/prisma/06_crm_commerce.prisma
*** Add File: packages/prisma-client/prisma/07_ai_runtime.prisma
*** Add File: packages/prisma-client/prisma/08_integration_reliability.prisma
*** Add File: packages/prisma-client/prisma/09_quarantine_sandbox.prisma
*** Add File: packages/prisma-client/prisma/10_legacy_bridge.prisma
*** Update File: apps/api/src/shared/prisma/prisma.service.ts
*** Update File: packages/prisma-client/schema.prisma
+ model Tenant { ... }
+ model TenantCompanyBinding { ... }
+ // nullable tenantId only on control-plane contour
```

## Explicitly deferred changes

В первый tranche не входят:
- `Company` de-rooting в operational core;
- массовый projection rollout;
- enum migration wave;
- индексный cleanup wave;
- physical split;
- `MG-Core` reuse beyond archive/sandbox/reference.

## Suggested implementation order

1. ADR package.
2. `MODEL_SCOPE_MANIFEST.md`.
3. `DOMAIN_OWNERSHIP_MANIFEST.md`.
4. `READ_MODEL_POLICY.md`.
5. `DB_SUCCESS_METRICS.md`.
6. CI rules.
7. fix `EventConsumption` policy contradiction.
8. additive `Tenant` and `TenantCompanyBinding`.
9. nullable `tenantId` on control-plane contour.
10. shadow-mode runtime support and mismatch logging.

## Final position

Первый безопасный патч должен менять не весь мир, а только архитектурное направление.

Правильный first tranche:
- останавливает дальнейший рост долга;
- добавляет platform boundary;
- не ломает business core;
- создаёт условия, при которых следующий домен можно добавить без повторного превращения схемы в монолитный граф.
