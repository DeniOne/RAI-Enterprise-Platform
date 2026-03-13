# Аудит архитектуры БД

## Область аудита и источники

Аудит опирается на реальные артефакты репозитория:
- `packages/prisma-client/schema.prisma`: `6185` строк, `195` моделей, `149` enum, `368` индексов, `59` compound unique.
- `packages/prisma-client/migrations`: `60` миграций.
- `apps/api/src/**`: текущий production-like runtime contour на `@rai/prisma-client`.
- `mg-core/backend/prisma/schema.prisma`: `2148` строк, `102` модели, `52` enum, `66` индексов, `14` compound unique.
- `mg-core/backend/prisma/migrations`: `35` миграций.
- `mg-core/backend/src/**`: legacy/adjacent contour.

Подтвержденные факты:
- `tenantId` введен additive-first в Phase 1 control-plane/runtime моделях.
- `companyId` есть в `152/195` моделях current contour.
- `Company` в current contour - relation god-root с примерно `139-143` исходящими связями.
- При этом в `apps/api` `prisma.company` читается редко: в bootstrap/default-tenant flow и в одном Level-F snapshot path.
- `PrismaService` уже форсирует tenant isolation через allowlist tenant-scoped моделей.
- В `PrismaService` убран явный policy-debt по `EventConsumption` (исключено конфликтное dual-classification).
- `mg-core` не содержит ни `companyId`, ни `tenantId`, ни модели `Company`.

## Жесткий вывод

Проблема не в Prisma и не в Postgres.

Проблема в том, что одна схема одновременно используется как:
- tenant boundary,
- business/legal organization model,
- agronomy planning graph,
- execution graph,
- finance fact store,
- AI/runtime control plane,
- legal/compliance registry,
- external communication workspace.

Главный дефект системы не "большая schema.prisma" сам по себе. Главный дефект - вот эта комбинация:
- `Company` как глобальный корень связей.
- `companyId` как tenant key, business owner, denormalized ACL field и compatibility hack одновременно.
- прямые cross-domain relations там, где должны быть projections/read models.
- enum sprawl вместо управляемого vocabulary layer.
- повторяющиеся technical patterns без явной ownership-модели.

Систему еще можно безопасно выправить в рамках одной физической БД. Микросервисный распил сейчас был бы ошибкой.

## Сводка по контурам

| Контур | Статус | Роль | Ключевой дефект |
| --- | --- | --- | --- |
| `packages/prisma-client` + `apps/api` | активный | multi-domain multi-tenant platform | collapse tenant/business boundary вокруг `Company` и `companyId` |
| `mg-core/backend/prisma` + `mg-core/backend/src` | legacy/adjacent | организационный/HR/learning/MES/economy monolith | другой контур, другая модель, нет tenant-carкасa |

## Реальные bounded contexts

### Current contour

| Домен | Модели |
| --- | --- |
| `platform_core` | `User`, `Invitation`, `RoleDefinition`, `EmployeeProfile`, `Tenant`, `TenantCompanyBinding`, `TenantState`, `AuditLog`, `AuditNotarizationRecord`, `ApiUsage` |
| `org_legal` | `Company`, `RegulatoryBody`, `LegalDocument`, `LegalNorm`, `LegalRequirement`, `LegalObligation`, `Sanction`, `ComplianceCheck`, `GrInteraction`, `PolicySignal`, `ExternalLegalFeed`, `Jurisdiction`, `RegulatoryProfile`, `RegulatoryArtifact` |
| `crm_commerce` | `Account`, `Contact`, `Interaction`, `Obligation`, `Holding`, `Deal`, `ScoreCard`, `Contract`, `Machinery`, `StockItem`, `StockTransaction`, `Party`, `PartyRelation`, `CounterpartyUserBinding`, `AssetPartyRole`, `CommerceContract`, `CommerceContractPartyRole`, `CommerceObligation`, `BudgetReservation`, `PaymentSchedule`, `CommerceFulfillmentEvent`, `StockMove`, `RevenueRecognitionEvent`, `Invoice`, `Payment`, `PaymentAllocation` |
| `agri_planning` | `Field`, `Rapeseed`, `RapeseedHistory`, `CropVariety`, `CropVarietyHistory`, `Season`, `SeasonSnapshot`, `AuditFailure`, `SeasonStageProgress`, `SeasonHistory`, `BusinessRule`, `TechnologyCard`, `TechnologyCardOperation`, `TechnologyCardResource`, `HarvestPlan`, `PerformanceContract`, `TechMap`, `MapStage`, `MapOperation`, `MapResource`, `SoilProfile`, `RegionProfile`, `InputCatalog`, `AdaptiveRule`, `CropZone`, `HybridPhenologyModel`, `Evidence`, `ChangeOrder`, `Approval`, `BudgetPlan`, `BudgetLine`, `StrategicGoal` |
| `agri_execution` | `Task`, `TaskResourceActual`, `ExecutionRecord`, `ExecutionOrchestrationLog`, `DeviationReview`, `CmrDecision`, `CmrRisk`, `InsuranceCoverage`, `FieldObservation`, `HarvestResult` |
| `finance` | `EconomicEvent`, `LedgerEntry`, `AccountBalance`, `CashAccount`, `Budget`, `BudgetItem`, `ManagementDecision`, `StrategyForecastScenario`, `StrategyForecastRun` |
| `ai_runtime` | `AiAuditEntry`, `ExpertReview`, `TraceSummary`, `QualityAlert`, `AgentReputation`, `UserCredibilityProfile`, `SystemIncident`, `AutonomyOverride`, `AgentLifecycleOverride`, `IncidentRunbookExecution`, `RuntimeGovernanceEvent`, `PerformanceMetric`, `PendingAction`, `AgentConfiguration`, `AgentCapabilityBinding`, `AgentToolBinding`, `AgentConnectorBinding`, `AgentConfigChangeRequest`, `EvalRun`, `AgentScoreCard`, `AgronomicStrategy`, `GenerationRecord`, `GovernanceConfig`, `DivergenceRecord`, `ModelVersion`, `TrainingRun`, `DriftReport`, `LearningEvent`, `LevelFCertAudit`, `GovernanceCommittee`, `QuorumProcess`, `GovernanceSignature` |
| `knowledge_memory` | `MemoryEntry`, `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile`, `Engram`, `SemanticFact`, `KnowledgeNode`, `KnowledgeEdge` |
| `risk_governance` | `RiskSignal`, `RiskAssessment`, `RiskStateHistory`, `DecisionRecord`, `GovernanceLock`, `OverrideRequest`, `ApprovalRequest` |
| `research_rd` | `ResearchProgram`, `Experiment`, `Protocol`, `Trial`, `Measurement`, `ResearchResult`, `ResearchConclusion`, `StrategicSignal`, `ExplorationCase`, `WarRoomSession`, `WarRoomDecisionEvent`, `ImpactAuditRecord`, `RewardRecord`, `LabCapacityConfig`, `ExternalSourceAllowlist`, `AIScanRunLog`, `SoilMetric`, `SustainabilityBaseline`, `BiodiversityMetric` |
| `integration_reliability` | `OutboxMessage`, `EventConsumption`, `VisionObservation`, `SatelliteObservation`, `AgroEventDraft`, `AgroEventCommitted`, `AgroEscalation`, `FrontOfficeDraft`, `FrontOfficeCommittedEvent`, `FrontOfficeThread`, `BackOfficeFarmAssignment`, `FrontOfficeThreadMessage`, `FrontOfficeHandoffRecord`, `FrontOfficeThreadParticipantState` |

### MG-Core contour

| Домен | Модели |
| --- | --- |
| `identity_org` | `Role`, `RoleContract`, `QualificationLevel`, `User`, `Department`, `Employee`, `EmployeeRole`, `OrgStructureHistory`, `ReportingRelationship`, `OrgHierarchyLevel`, `PyramidRole`, `TriangleAssignment`, `RaciMatrix`, `Position`, `Location`, `AuthSession` |
| `tasks_ops` | `Event`, `Task`, `TaskComment`, `TaskAttachment`, `Notification`, `AntiFraudSignal`, `KPI`, `KPIRecord`, `RewardRule` |
| `economy_store_reward` | `Wallet`, `Transaction`, `Product`, `StoreItem`, `Purchase`, `GamificationLevel`, `UserGamificationStatus`, `Achievement`, `UserAchievement`, `Leaderboard`, `Quest`, `QuestProgress`, `RewardEligibility`, `MatrixCoinSnapshot`, `AuctionEventState` |
| `learning_foundation` | `Academy`, `Skill`, `Material`, `FoundationBlock`, `FoundationVersion`, `Course`, `CourseModule`, `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAttempt`, `QuizAnswer`, `UserSkill`, `UserGrade`, `Enrollment`, `ModuleProgress`, `Certification`, `LearningPath`, `Trainer`, `TrainerAccreditation`, `Mentorship`, `MentorshipPeriod`, `TrainingResult`, `QualificationSnapshot`, `FoundationAcceptance`, `FoundationAuditLog` |
| `registry_governance` | `RegistryEntity`, `RegistryAuditEvent`, `RegistryRelationship`, `RegistryOrgProjection`, `RegistryOwnerProjection`, `CanonicalViolation`, `GovernanceFlag` |
| `mes_quality` | `ProductionOrder`, `WorkOrder`, `QualityCheck`, `Defect` |
| `personnel_legal_docs` | `HRDomainEvent`, `PersonalFile`, `PersonnelDocument`, `PersonnelOrder`, `LaborContract`, `ContractAmendment`, `DocumentTemplate`, `LibraryDocument`, `LibraryDocumentVersion`, `LibraryLink`, `EmployeeRegistrationRequest`, `RegistrationStepHistory` |
| `participation_aiops` | `ParticipationStatus`, `UserParticipationStatus`, `ParticipationStatusHistory`, `ParticipationRank`, `UserParticipationRank`, `AIFeedback`, `IdeaChannel`, `HybridTeamInteraction`, `Kaizen`, `OneOnOne` |

## Архитектурно ключевые модели

### Current contour: стратегически важные 10-20 моделей
- `Company`
- `User`
- `Account`
- `Field`
- `Season`
- `HarvestPlan`
- `TechMap`
- `Task`
- `DeviationReview`
- `BudgetPlan`
- `EconomicEvent`
- `LedgerEntry`
- `Party`
- `CommerceContract`
- `FrontOfficeThread`
- `AgentConfiguration`
- `RuntimeGovernanceEvent`
- `OutboxMessage`
- `EventConsumption`
- `Engram`

### Current contour: модели с максимальным архитектурным долгом
- `Company`
- `User`
- `Season`
- `TechMap`
- `HarvestPlan`
- `DeviationReview`
- `CmrRisk`
- `FieldObservation`
- `BudgetPlan`
- `Party`
- `FrontOfficeThread`
- `AgentConfiguration`
- `SystemIncident`
- `EventConsumption`
- `Engram`
- `SemanticFact`

### MG-Core: наиболее важные модели
- `User`
- `Department`
- `Employee`
- `Task`
- `Wallet`
- `Transaction`
- `RegistryEntity`
- `ProductionOrder`
- `PersonalFile`
- `LaborContract`

### MG-Core: модели с наибольшим долгом
- `User`
- `Department`
- `EmployeeRegistrationRequest`
- `LaborContract`
- `Task`

## God-models и god-roots

### Current contour

| Модель | Проблема |
| --- | --- |
| `Company` | глобальный schema root почти для всех доменов |
| `User` | слишком много cross-domain attachments |
| `Season` | planning + execution + reporting + advisory anchor в одной модели |
| `TechMap` | versioned plan + active snapshot + AI artifact + budget source |
| `Party` | master data + relation graph + contract workspace + payment edges |
| `FrontOfficeThread` | communication workspace выражен как relation aggregate |

### MG-Core

| Модель | Проблема |
| --- | --- |
| `User` | identity + wallet owner + learner + task actor + personnel subject |
| `Department` | org root + task scope + KPI scope + employee scope |
| `EmployeeRegistrationRequest` | onboarding orchestration в одной модели |

## Где нарушены доменные границы

### 1. `Company` одновременно business entity и tenant boundary

Наблюдаемое состояние:
- в схеме `Company` привязан почти ко всем доменам;
- в runtime `Company` почти не используется как бизнес-агрегат;
- `PrismaService` использует `companyId` как tenant isolation key;
- `TenantState` keyed by `companyId`, то есть platform state уже живет поверх business identity.

Вывод:
- runtime считает `Company` tenant anchor;
- schema считает `Company` business/legal + technical super-root;
- это и есть главная архитектурная ошибка.

### 2. Planning и execution сцеплены сильнее, чем должны

Проблемный граф:
- `Season`
- `HarvestPlan`
- `TechMap`
- `BudgetPlan`
- `DeviationReview`
- `CmrRisk`
- `FieldObservation`
- `Task`
- `HarvestResult`

Симптомы:
- сервисы `consulting`, `execution`, `tech-map`, `season` работают по одному и тому же длинному graph path;
- planning facts, execution facts, advisory, budgeting и risk review не разделены projection seam.

### 3. Commerce/legal/front-office слиты в одну поверхность

Проблемный граф:
- `Party`
- `Jurisdiction`
- `RegulatoryProfile`
- `CommerceContract`
- `CommerceObligation`
- `Invoice`
- `Payment`
- `CounterpartyUserBinding`
- `FrontOfficeThread`

Это создает один общий workspace для:
- master data,
- legal posture,
- contract lifecycle,
- payment lifecycle,
- communication state.

Это не один bounded context. Это смесь нескольких.

### 4. AI/runtime/governance/knowledge не разделены по scope

Проблемный граф:
- `AgentConfiguration` + binding tables
- `RuntimeGovernanceEvent`
- `SystemIncident`
- `PendingAction`
- `EvalRun`
- `ExpertReview`
- `Memory*`
- `Engram`
- `SemanticFact`

Симптомы:
- tenant-local state и global preset semantics кодируются через nullable `companyId`;
- control-plane и knowledge layer выражены как business-tables с техническим scope hack.

## Анализ `Company`

## Где `Company` - business entity

Оправданная семантика:
- legal organization identity;
- owner для legal/compliance surface;
- business owner для части contract/regulatory surfaces;
- временный bridge между организацией и будущим `Tenant`.

Минимальный core graph, который должен остаться у `Company`:
- organization identity и metadata;
- legal/compliance ownership;
- tenant-to-company mapping в переходный период;
- только реальные business relations, а не platform-scope links.

## Где `Company` - tenant boundary

Подтверждено кодом:
- JWT/tenant context извлекают `companyId` как active tenant;
- `PrismaService` injects `companyId` в queries;
- bootstrap flow создает первую `Company`, потому что схема требует root FK;
- `TenantState` keyed by `companyId`.

Это не бизнес-моделирование. Это скрытый platform boundary.

## Где `Company` - архитектурный шум

Типовые примеры:
- `Season` уже rooted в `Field` и planning graph, но несет `companyId` как denormalized access field.
- `SeasonSnapshot`, `SeasonHistory`, `MemoryEntry`, `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` используют `companyId` как технический scope marker.
- `FrontOfficeThreadMessage`, `FrontOfficeHandoffRecord`, `FrontOfficeThreadParticipantState` повторяют tenant key родительского thread.
- `DeviationReview`, `CmrRisk`, `FieldObservation` тащат `companyId`, хотя scope уже выводится из parent/anchor path.

Вывод:
- relation graph `Company` раздут на порядок больше допустимого.

## Где `companyId` оправдан, а где это шум

### Оправдан сегодня

`companyId` оправдан на top-level aggregates и append-heavy facts, которые реально читаются напрямую:
- `Account`, `Holding`, `User`, `Invitation`
- `Field`, `Season`, `HarvestPlan`, `TechMap`, `Task`
- `EconomicEvent`, `LedgerEntry`, `Budget`, `CashAccount`
- `Party`, `CommerceContract`, `Invoice`, `Payment`
- `RuntimeGovernanceEvent`, `PendingAction`, `AgentConfigChangeRequest`
- `FrontOfficeThread`, `FrontOfficeDraft`, `FrontOfficeCommittedEvent`

### Шум и техническое дублирование

`companyId` является архитектурным шумом на child/fact/support tables, где scope уже выводится из parent aggregate:
- `SeasonSnapshot`
- `SeasonHistory`
- `BudgetLine` в текущей форме
- `FrontOfficeThreadMessage`
- `FrontOfficeHandoffRecord`
- `FrontOfficeThreadParticipantState`
- `MemoryEntry`
- `MemoryInteraction`
- `MemoryEpisode`
- `MemoryProfile`

### Опасная двусмысленность

Nullable/global `companyId` сейчас есть в:
- `Rapeseed`
- `CropVariety`
- `BusinessRule`
- `SystemIncident`
- `AgentConfiguration`
- `AgentCapabilityBinding`
- `AgentToolBinding`
- `AgentConnectorBinding`
- `Engram`
- `SemanticFact`
- `RegionProfile`
- `InputCatalog`
- `HybridPhenologyModel`
- `EventConsumption`

Это уже доказательство того, что `companyId` не является чистой boundary-концепцией.

## Связи, создающие избыточную связанность

### Agronomy coupling cluster
- `Season` <-> `HarvestPlan` <-> `TechMap` <-> `BudgetPlan` <-> `DeviationReview` <-> `CmrRisk` <-> `FieldObservation` <-> `Task`

### Commerce/legal/front-office cluster
- `Party` <-> `Jurisdiction` <-> `RegulatoryProfile` <-> `CommerceContract` <-> `CommerceObligation` <-> `Invoice` <-> `Payment` <-> `FrontOfficeThread`

### AI/governance/memory cluster
- `AgentConfiguration` <-> bindings <-> `RuntimeGovernanceEvent` <-> `PendingAction` <-> `SystemIncident` <-> `ExpertReview` <-> `Memory*` <-> `Engram` / `SemanticFact`

## Какие модели лучше читать через projections/read models

Через projections/read models, а не через прямые relation-графы, должны обслуживаться:
- workspace `HarvestPlan` + latest `TechMap` + `BudgetPlan` + `DeviationReview` + `HarvestResult`;
- workspace `Party` + jurisdiction + regulatory profile + current relations + contract summary;
- workspace `FrontOfficeThread` + messages + handoffs + participant state;
- runtime governance drilldown по `RuntimeGovernanceEvent` + `SystemIncident` + `PendingAction`;
- finance reporting поверх `EconomicEvent`/`LedgerEntry`;
- company dashboard / Level-F snapshot.

## Повторяющиеся технические паттерны

### Audit pattern
- почти везде `createdAt` / `updatedAt`;
- append-only и mutable policies не унифицированы;
- audit-trail вынесен частично в отдельные таблицы, частично нет.

### Tenant pattern
- `companyId` + `company` relation повторяются почти машинально;
- `83` моделей используют простой `@@index([companyId])`.

### Index pattern
Типовые формы:
- `companyId` alone;
- `companyId, id`;
- `companyId, status`;
- `traceId`;
- `companyId, role`;
- `companyId, seasonId`.

Это шаблонный индексный стиль, а не workload-driven design.

### Naming drift
- current contour: `camelCase`, смешение business и platform naming;
- MG-Core: `snake_case`, другой modeling style;
- общие понятия drift-ят между контурами.

### Enum sprawl
- current contour: `148` enum;
- MG-Core: `52` enum;
- уже видны дубли severity/status/liability/source taxonomies.

## Финальные выводы

1. `Company` нельзя оставлять platform root.
2. `companyId` перегружен и должен быть разделен на platform tenancy и business ownership.
3. Проблему еще можно решить внутри одной физической Postgres БД.
4. Следующий шаг - логическая декомпозиция, а не микросервисы.
5. `MG-Core` не годится как второй active source of truth.
6. Самые срочные structural seams:
   - `Company` / tenant boundary,
   - agronomy planning vs execution,
   - commerce/legal/front-office read seams,
   - AI runtime vs knowledge vs governance scope.
7. Без projection discipline схема будет снова наращивать god-objects.
