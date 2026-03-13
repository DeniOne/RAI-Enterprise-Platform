# DB_REFACTOR_PROPOSAL.patch.md

Этот файл описывает безопасную первую волну изменений.
Это design-only proposal. Это не команда автоматически переписать репозиторий.

## Hard boundary

В первой волне нельзя делать:
- destructive rename `companyId -> tenantId`;
- физический split базы;
- массовые переименования моделей по всему репо;
- dual-write с MG-Core;
- тотальный перевод всех query paths на projections за один проход.

Первая волна должна быть:
- additive;
- обратимой;
- совместимой с текущим Prisma Client и API;
- направленной на изменение архитектурного вектора, а не на демонстративный перепил.

## Safe first changes

### 1. Добавить architecture governance
Создать документы:
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_003_ENUM_GOVERNANCE.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md`
- `docs/01_ARCHITECTURE/DECISIONS/ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md`

Задача этих ADR:
- зафиксировать, что `Company` больше не является platform-root;
- закрепить target-state с отдельным `Tenant`;
- зафиксировать ownership по schema fragments;
- запретить uncontrolled enum growth;
- ввести policy для projections и hot-path indexes.

### 2. Добавить структуру logical schema fragments без изменения model semantics
Создать layout:
- `packages/prisma-client/prisma/00_base.prisma`
- `packages/prisma-client/prisma/01_platform_core.prisma`
- `packages/prisma-client/prisma/02_org_legal.prisma`
- `packages/prisma-client/prisma/03_agri_planning.prisma`
- `packages/prisma-client/prisma/04_agri_execution.prisma`
- `packages/prisma-client/prisma/05_finance.prisma`
- `packages/prisma-client/prisma/06_crm_commerce.prisma`
- `packages/prisma-client/prisma/07_ai_runtime.prisma`
- `packages/prisma-client/prisma/08_integration_reliability.prisma`
- `packages/prisma-client/prisma/09_knowledge_memory.prisma`
- `packages/prisma-client/prisma/10_risk_governance.prisma`
- `packages/prisma-client/prisma/11_research_rd.prisma`
- `packages/prisma-client/prisma/12_legacy_bridge.prisma`
- `packages/prisma-client/prisma/schema.compose.ts`

Правило:
- финальный `schema.prisma` по-прежнему собирается как единый build artifact;
- Prisma generation не должна замечать, что исходники теперь фрагментированы;
- semantic refactor нельзя маскировать под файловую декомпозицию.

### 3. Зафиксировать tenancy governance до добавления `tenantId`
Нужно сделать до любой реальной миграции:
- исправить противоречие классификации `EventConsumption` в `apps/api/src/shared/prisma/prisma.service.ts`;
- создать manifest классификации моделей;
- проверить соответствие schema semantics и runtime tenant enforcement в CI.

### 4. Добавить `Tenant` как additive primitive
Новые сущности должны появиться без разрушения текущего контракта:
- `Tenant`
- `TenantCompanyBinding`

Нельзя:
- удалять `companyId`;
- делать hard switch всех сервисов на `tenantId`;
- объявлять `Company` deprecated до появления миграционного моста.

## Proposed schema fragment ownership

### `00_base.prisma`
Владеет:
- `generator`
- `datasource`
- общими scalar conventions
- техническими cross-domain enum, если они действительно closed и стабильны

### `01_platform_core.prisma`
Владеет:
- `User`
- `Invitation`
- `RoleDefinition`
- `EmployeeProfile`
- `TenantState`
- `AuditLog`
- `AuditNotarizationRecord`
- `ApiUsage`
- будущими `Tenant`, `TenantCompanyBinding`

### `02_org_legal.prisma`
Владеет:
- `Company`
- legal/compliance/regulatory блоком
- `Jurisdiction`, `RegulatoryProfile` и связанными legal ownership моделями

### `03_agri_planning.prisma`
Владеет:
- `Field`
- `Rapeseed`
- `CropVariety`
- `Season`
- `TechMap`
- planning rules
- catalogs/evidence planning уровня

### `04_agri_execution.prisma`
Владеет:
- `Task`
- `HarvestPlan`
- `DeviationReview`
- `CmrDecision`
- `CmrRisk`
- `HarvestResult`
- `FieldObservation`
- execution facts и execution seam models

### `05_finance.prisma`
Владеет:
- `EconomicEvent`
- `LedgerEntry`
- `AccountBalance`
- `CashAccount`
- `Budget`
- `BudgetItem`
- `BudgetPlan`
- finance projections и finance-specific scenarios

### `06_crm_commerce.prisma`
Владеет:
- `Deal`
- `Contract`
- `Party`
- `PartyRelation`
- `CommerceContract`
- `CommerceObligation`
- `Invoice`
- `Payment`
- front-office business workspace master records

### `07_ai_runtime.prisma`
Владеет:
- `AgentConfiguration`
- `AgentCapabilityBinding`
- `AgentToolBinding`
- `AgentConnectorBinding`
- `AgentConfigChangeRequest`
- `RuntimeGovernanceEvent`
- `SystemIncident`
- `PendingAction`
- `EvalRun`
- model ops и runtime reliability surfaces

### `08_integration_reliability.prisma`
Владеет:
- `OutboxMessage`
- `EventConsumption`
- ingestion/delivery-control models
- replay/idempotency/integration reliability artifacts

### `09_knowledge_memory.prisma`
Владеет:
- `MemoryEntry`
- `MemoryInteraction`
- `MemoryEpisode`
- `MemoryProfile`
- `Engram`
- `SemanticFact`
- `KnowledgeNode`
- `KnowledgeEdge`

### `10_risk_governance.prisma`
Владеет:
- risk engine models
- governance lock/override/approval surfaces
- часть cross-domain decision records, если они именно governance, а не business execution

### `11_research_rd.prisma`
Владеет:
- research и experimentation models
- war-room / exploration / institutional analytics artifacts
- sustainability / biodiversity / advanced analytical surfaces

### `12_legacy_bridge.prisma`
Владеет:
- migration-only scaffolding;
- bridge models и mapping tables;
- потенциальными read-only ссылками на MG-Core, если когда-либо понадобится archive adapter.

## Proposed tenancy additions

### Новые target models

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

### Первые кандидаты на `tenantId`
Добавлять nullable `tenantId` сначала сюда:
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

Это правильно, потому что эти модели уже сейчас ближе к platform/control-plane semantics, чем к business-entity semantics.

### Что нельзя трогать destructively в первой волне
- `Season`
- `TechMap`
- `HarvestPlan`
- `Task`
- `EconomicEvent`
- `LedgerEntry`
- `Party`
- `CommerceContract`

Это operational core. Сначала нужен migration seam, потом structural move.

## Proposed compatibility layer

### Runtime compatibility
Расширить tenant context до явной формы:

```ts
interface TenantRuntimeContext {
  tenantId: string | null;
  companyId: string | null;
  isSystem: boolean;
}
```

Правило:
- `tenantId` отвечает за platform isolation;
- `companyId` отвечает за business/legal association и transitional compatibility;
- system/global сценарии должны определяться явно, а не через магическое отсутствие `companyId`.

### Prisma compatibility
На переходный период:
- существующие сервисы продолжают писать `companyId`, как сейчас;
- новые поля `tenantId` пишутся shadow-write там, где они уже добавлены;
- чтение по `tenantId` включается сначала в debug/shadow mode;
- расхождения между `companyId -> tenantId` mapping и реальными данными логируются.

### API/JWT compatibility
Переходная форма payload:

```json
{
  "sub": "user-id",
  "tenantId": "tenant-id",
  "companyId": "company-id",
  "role": "ADMIN"
}
```

Правило:
- не убирать `companyId` из токена до тех пор, пока весь runtime isolation path не подтверждён на `tenantId`.

## Proposed read model / projection first steps

### 1. Planning workspace projection
Собрать явную projection-модель для:
- `HarvestPlan`
- latest `TechMap`
- `BudgetPlan`
- summary по `DeviationReview`
- `HarvestResult`

Задача:
- перестать собирать planning workspace из ad hoc include chains.

### 2. Party workspace projection
Собрать projection для:
- `Party`
- `Jurisdiction`
- `RegulatoryProfile`
- `PartyRelation`
- contract role summary
- financial exposure summary

### 3. Front-office operator projection
Собрать projection для:
- `FrontOfficeThread`
- latest message preview
- unread counts
- current handoff status
- farm/account owner summary

### 4. Runtime governance projection
Собрать tenant-scoped projection для:
- recent `RuntimeGovernanceEvent`
- `SystemIncident`
- `PendingAction`
- agent reliability aggregates

Правило для всех четырёх случаев:
- это read model layer;
- эти projection-таблицы/представления не должны становиться новыми system-of-record.

## Proposed enum governance patch set

### Immediate cleanup
Сделать в первую волну:
- канонизировать family `RiskCategory` / `RiskLevel` / `ImpactLevel` / `RiskSeverity`;
- разрешить конфликт `LiabilityMode` vs `ResponsibilityMode`;
- схлопнуть `KnowledgeNodeSource` и `KnowledgeEdgeSource`, если различие не несёт отдельной доменной семантики;
- исправить `BudgetCategory` (`FERTILIZER` vs `FERTILIZERS`).

### First dictionary extraction
В reference/config tables перевести:
- crop catalog;
- soil catalog;
- climate catalog;
- input catalog taxonomy;
- operation taxonomy;
- observation/evidence taxonomy;
- selected CRM/commerce vocabularies;
- часть research vocabularies, если они реально эволюционируют.

## Proposed index patch set

### High-priority additive indexes
Добавить в первую целевую волну:
- `Season(companyId, createdAt)`
- `Task(seasonId, operationId, fieldId)`
- `Task(companyId, assigneeId, status)`
- `HarvestPlan(companyId, seasonId)`
- `HarvestPlan(companyId, status)`
- `HarvestPlan(companyId, createdAt)`
- `DeviationReview(companyId, seasonId)`
- `DeviationReview(companyId, status, createdAt)`
- `DeviationReview(companyId, telegramThreadId)`
- `CmrRisk(companyId, seasonId)`
- `CmrRisk(companyId, status)`
- `EconomicEvent(companyId, createdAt)`
- `EconomicEvent(companyId, type, createdAt)`
- `LedgerEntry(companyId, createdAt)`
- `LedgerEntry(companyId, accountCode, createdAt)`
- `Party(companyId, createdAt)`
- `Party(companyId, status, createdAt)`
- `RegulatoryProfile(companyId, jurisdictionId, isSystemPreset, code)`

### Outbox normalization patch set
Добавить в `OutboxMessage` явные scope columns:
- `companyId String?`
- позже `tenantId String?`

После этого добавить:
- `OutboxMessage(status, type, aggregateType, aggregateId, createdAt)`
- при необходимости `OutboxMessage(companyId, status, type, aggregateType, aggregateId, createdAt)`

Жёсткое правило:
- не пытаться лечить outbox JSON-path индексами до нормализации колонок scope.

## Proposed CI / governance checks

Добавить проверки:
- budget на размер схемы и размер fragment-файлов;
- duplicate index detector;
- validation ownership manifest по доменам;
- forbidden cross-domain relation detector;
- enum growth budget;
- nullable-scope governance check;
- tenant classification consistency check между manifest и `PrismaService`;
- warning/check на heavy Prisma include trees.

Возможные скрипты:
- `scripts/check-schema-fragments.cjs`
- `scripts/check-domain-ownership.cjs`
- `scripts/check-enum-growth.cjs`
- `scripts/check-duplicate-indexes.cjs`
- `scripts/check-tenant-classification.cjs`
- `scripts/check-heavy-prisma-includes.cjs`

## MG-Core reuse proposal

Базовая позиция:
- не строить active dual-write bridge;
- не делать runtime fallback на MG-Core;
- не держать второй active Prisma source of truth.

Рационально допустимые варианты:
- `read-only archive adapter`
- `migration rehearsal sandbox`
- `reference contour diff tooling`

Возможные артефакты:
- `docs/MG_CORE_REUSE_DECISION.md`
- `scripts/diff-current-vs-mgcore-models.cjs`
- `scripts/validate-migration-mapping.cjs`

## Explicitly deferred changes

В первой волне запрещено:
- физически разделять БД;
- выносить домены в микросервисы;
- массово переименовывать existing models;
- переписывать все текущие queries на projections в один проход;
- дублировать все company-индексы tenant-индексами без миграционного плана;
- затаскивать MG-Core в production path.

## Suggested implementation order

1. ADR и governance docs.
2. Fragment composition scaffolding для Prisma schema.
3. Tenant classification manifest и исправление `EventConsumption` policy contradiction.
4. Additive `Tenant` и `TenantCompanyBinding`.
5. Additive `tenantId` на control-plane модели.
6. Shadow-mode runtime support.
7. Targeted read models/projections.
8. Targeted composite index additions.
9. Enum cleanup и dictionary extraction.
10. Только потом миграция части operational core на новую tenancy semantics.

## Pseudo-patch sketch

```diff
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_003_ENUM_GOVERNANCE.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md
*** Add File: docs/01_ARCHITECTURE/DECISIONS/ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md
*** Add File: packages/prisma-client/prisma/schema.compose.ts
*** Add File: packages/prisma-client/prisma/01_platform_core.prisma
*** Add File: packages/prisma-client/prisma/02_org_legal.prisma
*** Add File: packages/prisma-client/prisma/03_agri_planning.prisma
*** Add File: packages/prisma-client/prisma/04_agri_execution.prisma
*** Add File: packages/prisma-client/prisma/05_finance.prisma
*** Add File: packages/prisma-client/prisma/06_crm_commerce.prisma
*** Add File: packages/prisma-client/prisma/07_ai_runtime.prisma
*** Add File: packages/prisma-client/prisma/08_integration_reliability.prisma
*** Add File: packages/prisma-client/prisma/09_knowledge_memory.prisma
*** Add File: packages/prisma-client/prisma/10_risk_governance.prisma
*** Add File: packages/prisma-client/prisma/11_research_rd.prisma
*** Add File: packages/prisma-client/prisma/12_legacy_bridge.prisma
*** Update File: apps/api/src/shared/prisma/prisma.service.ts
*** Update File: packages/prisma-client/schema.prisma
+ model Tenant { ... }
+ model TenantCompanyBinding { ... }
+ // nullable tenantId fields on control-plane models
+ // additive indexes on hot-path aggregates
```

## Final position

Самый безопасный первый патч — не тот, который зрелищно переписывает модели.
Самый безопасный первый патч — это:
- governance;
- additive tenancy primitives;
- schema ownership scaffolding;
- точечные hot-path indexes;
- projection seams там, где relation graph уже мешает эволюции.

Это меняет направление архитектуры сразу, не создавая production explosion.
