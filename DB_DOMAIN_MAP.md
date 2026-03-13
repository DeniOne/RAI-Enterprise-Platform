# Карта доменов БД

## Правила карты

Это логическая карта bounded contexts для active platform. Это не план физического split.

Легенда:
- `authoritative`: домен владеет write model и инвариантами.
- `supporting`: домен хранит производные или вспомогательные данные.
- `cross-cutting`: домен обслуживает несколько bounded contexts и обязан иметь жесткие boundary.
- `Current contour`: `packages/prisma-client/schema.prisma` + `apps/api`.
- `MG-Core contour`: `mg-core/backend/prisma/schema.prisma` + `mg-core/backend/src`.

Полный enum inventory и решения по enum находятся в `DB_ENUM_RATIONALIZATION.md`. Ниже перечислены ключевые enum, реально якорящие домен.

## Общая политика зависимостей

Разрешенные направления:
- `platform_core` не зависит от доменных контуров.
- `org_legal` зависит только от `platform_core`.
- `crm_commerce` зависит от `platform_core` и `org_legal`.
- `agri_planning` зависит от `platform_core` и ограниченно от `crm_commerce` через явные account/farm refs.
- `agri_execution` зависит от `agri_planning` и `platform_core`.
- `finance` потребляет факты и projections из других доменов, а не их внутренние relation-графы.
- `ai_runtime` потребляет projections/read models всех доменов и не владеет их business state.
- `knowledge_memory` работает через governed adapters.
- `risk_governance` reason-ит поверх фактов и событий, а не владеет чужими lifecycle.
- `integration_reliability` обслуживает transport/control only.
- `research_rd` потребляет projections и хранит собственные эксперименты/анализ.

Запрещенные паттерны:
- `finance` читает agronomy через глубокие planning graph traversal.
- `ai_runtime` становится владельцем business aggregates.
- `integration_reliability` превращается в скрытый business domain.
- `Company` остается транзитивным root для всей схемы.

## `platform_core`

| Атрибут | Значение |
| --- | --- |
| Ownership | shared platform / auth / tenant-context / audit layer |
| Ownership type | authoritative |
| Allowed inbound | все домены могут ссылаться на identities и tenant context |
| Allowed outbound | только внутренние technical helpers |
| Anti-corruption boundary | identity, auth, tenant context, audit contracts |

Current contour models:
- `User`, `Invitation`, `RoleDefinition`, `EmployeeProfile`, `TenantState`, `AuditLog`, `AuditNotarizationRecord`, `ApiUsage`

MG-Core analogs:
- `Role`, `RoleContract`, `QualificationLevel`, `User`, `Employee`, `Department`, `EmployeeRole`, `AuthSession`, `Location`, `Position`

Ключевые enum:
- `UserRole`, `UserAccessLevel`
- MG-Core: `UserRole`, `UserStatus`, `AdmissionStatus`, `FoundationStatus`, `ProfileCompletionStatus`

Что нельзя тянуть прямыми relations:
- `User` как универсальный join hub для domain workspace reads.
- `TenantState` как surrogate business organization table.

## `org_legal`

| Атрибут | Значение |
| --- | --- |
| Ownership | legal / compliance / registry policy surface |
| Ownership type | authoritative |
| Allowed inbound | `crm_commerce`, `finance`, `risk_governance` |
| Allowed outbound | `platform_core` |
| Anti-corruption boundary | legal/compliance services и projections |

Current contour models:
- `Company`, `RegulatoryBody`, `LegalDocument`, `LegalNorm`, `LegalRequirement`, `LegalObligation`, `Sanction`, `ComplianceCheck`, `GrInteraction`, `PolicySignal`, `ExternalLegalFeed`, `Jurisdiction`, `RegulatoryProfile`, `RegulatoryArtifact`

MG-Core analogs:
- `LaborContract`, `ContractAmendment`, `DocumentTemplate`, `PersonalFile`, `PersonnelDocument`, `PersonnelOrder`, `LibraryDocument`, `LibraryDocumentVersion`, `LibraryLink`, `FoundationAcceptance`, `FoundationAuditLog`

Ключевые enum:
- `RegulatorType`, `ComplianceStatus`, `LegalDocumentStatus`, `LegalRequirementPriority`, `PartyEntityStatus`
- MG-Core: `ContractType`, `ContractStatus`, `ContractSalaryType`, `PersonnelDocumentType`, `PersonnelOrderType`, `DocumentStatus`, `TemplateType`

Что нельзя тянуть прямыми relations:
- `Company -> legal -> commerce -> finance` graph walk в operator views.
- ad hoc чтение legal internals из commerce сервисов.

## `agri_planning`

| Атрибут | Значение |
| --- | --- |
| Ownership | season / tech-map / consulting planning surface |
| Ownership type | authoritative |
| Allowed inbound | `agri_execution`, `finance`, `ai_runtime`, `risk_governance` через projections, IDs и snapshots |
| Allowed outbound | `platform_core`, ограниченно `crm_commerce` |
| Anti-corruption boundary | planning aggregates и snapshots, а не deep nested planning graph |

Current contour models:
- `Field`, `Rapeseed`, `RapeseedHistory`, `CropVariety`, `CropVarietyHistory`, `Season`, `SeasonSnapshot`, `AuditFailure`, `SeasonStageProgress`, `SeasonHistory`, `BusinessRule`, `TechnologyCard`, `TechnologyCardOperation`, `TechnologyCardResource`, `HarvestPlan`, `PerformanceContract`, `TechMap`, `MapStage`, `MapOperation`, `MapResource`, `SoilProfile`, `RegionProfile`, `InputCatalog`, `AdaptiveRule`, `CropZone`, `HybridPhenologyModel`, `Evidence`, `ChangeOrder`, `Approval`, `BudgetPlan`, `BudgetLine`, `StrategicGoal`

MG-Core analogs:
- полноценного агропланировочного контура нет.

Ключевые enum:
- `SoilType`, `SoilGranulometricType`, `FieldStatus`, `ClimateType`, `TriggerType`, `TriggerOperator`, `InputType`, `OperationType`, `ApplicationMethod`, `EvidenceType`, `ChangeOrderType`, `ChangeOrderStatus`, `ApproverRole`, `ApprovalDecision`, `RapeseedType`, `CropType`, `SeasonStatus`, `TechMapStatus`, `HarvestPlanStatus`, `BudgetType`, `BudgetCategory`

Что нельзя тянуть прямыми relations:
- `Season -> HarvestPlan -> TechMap -> BudgetPlan -> DeviationReview` как базовую query strategy.
- прямые чтения planning tree из front-office и finance surface.

## `agri_execution`

| Атрибут | Значение |
| --- | --- |
| Ownership | task execution / field operations / deviation management |
| Ownership type | authoritative |
| Allowed inbound | `finance`, `risk_governance`, `ai_runtime` через execution facts и read models |
| Allowed outbound | `agri_planning`, `platform_core` |
| Anti-corruption boundary | execution должен эмитить факты и snapshots, а не раскрывать внутренний graph всем потребителям |

Current contour models:
- `Task`, `TaskResourceActual`, `ExecutionRecord`, `ExecutionOrchestrationLog`, `DeviationReview`, `CmrDecision`, `CmrRisk`, `InsuranceCoverage`, `FieldObservation`, `HarvestResult`, `AgroEventDraft`, `AgroEventCommitted`, `AgroEscalation`

MG-Core analogs:
- `Task`, `TaskComment`, `TaskAttachment`, `ProductionOrder`, `WorkOrder`, `QualityCheck`, `Defect`

Ключевые enum:
- `TaskStatus`, `DeviationType`, `ClientResponseStatus`, `ResponsibilityMode`, `DeviationStatus`, `ConfidenceLevel`, `RiskType`, `RiskLevel`, `Controllability`, `LiabilityMode`, `InsuranceCoverageStatus`, `ExecutionStatus`, `ObservationType`, `ObservationIntent`
- MG-Core: `TaskStatus`, `TaskPriority`, `ProductionOrderStatus`, `WorkOrderStatus`, `QualityCheckType`, `QualityResult`, `DefectSeverity`

Что нельзя тянуть прямыми relations:
- finance напрямую ходит в planning internals через execution graph.
- AI/runtime пишет напрямую в execution state без command boundary.

## `finance`

| Атрибут | Значение |
| --- | --- |
| Ownership | finance-economy / ledger / budgeting surface |
| Ownership type | authoritative |
| Allowed inbound | `agri_execution`, `crm_commerce`, `org_legal` через facts, IDs и projections |
| Allowed outbound | `platform_core` и явные source aggregate IDs |
| Anti-corruption boundary | только facts, projections и financial contracts |

Current contour models:
- `EconomicEvent`, `LedgerEntry`, `AccountBalance`, `CashAccount`, `Budget`, `BudgetItem`, `ManagementDecision`, `StrategyForecastScenario`, `StrategyForecastRun`

Supporting seam models:
- `BudgetPlan`, `BudgetLine`, `BudgetReservation`, `PaymentSchedule`, `RevenueRecognitionEvent`, `Invoice`, `Payment`, `PaymentAllocation`

MG-Core analogs:
- `Wallet`, `Transaction`, `EconomyAuditLog`, `RewardEligibility`, `MatrixCoinSnapshot`, `AuctionEventState`, `Purchase`, `StoreItem`

Ключевые enum:
- `EconomicEventType`, `BudgetStatus`, `BudgetType`, `BudgetCategory`, `DecisionStatus`, `CashFlowType`, `CashDirection`, `InvoiceStatus`, `PaymentStatus`
- MG-Core: `Currency`, `TransactionType`, `PurchaseStatus`

Что нельзя тянуть прямыми relations:
- `EconomicEvent -> Season/Task/TechMap` deep graph reads.
- finance dashboards через `Company` relation hub.

## `crm_commerce`

| Атрибут | Значение |
| --- | --- |
| Ownership | CRM, counterparties, contracts, asset-role surface |
| Ownership type | authoritative |
| Allowed inbound | `agri_planning` через явные farm/account refs; `finance` через contract/obligation/payment refs |
| Allowed outbound | `platform_core`, `org_legal` |
| Anti-corruption boundary | party/account/contract projections; не допускать deep commerce graph traversal из других доменов |

Current contour models:
- `Account`, `Contact`, `Interaction`, `Obligation`, `Holding`, `Deal`, `ScoreCard`, `Contract`, `Machinery`, `StockItem`, `StockTransaction`, `Party`, `PartyRelation`, `CounterpartyUserBinding`, `AssetPartyRole`, `CommerceContract`, `CommerceContractPartyRole`, `CommerceObligation`, `BudgetReservation`, `PaymentSchedule`, `CommerceFulfillmentEvent`, `StockMove`, `RevenueRecognitionEvent`, `Invoice`, `Payment`, `PaymentAllocation`, `FrontOfficeThread`, `FrontOfficeDraft`, `FrontOfficeCommittedEvent`, `BackOfficeFarmAssignment`, `FrontOfficeThreadMessage`, `FrontOfficeHandoffRecord`, `FrontOfficeThreadParticipantState`

MG-Core analogs:
- прямого commerce contour нет; есть только store/economy fragments.

Ключевые enum:
- `AccountType`, `AccountStatus`, `RiskCategory`, `StrategicValue`, `ContactRole`, `InteractionType`, `ObligationStatus`, `MachineryType`, `AssetStatus`, `StockItemType`, `StockTransactionType`, `DealStage`, `PartyEntityType`, `PartyRelationType`, `AssetLinkType`, `AssetPartyRoleType`, `CommerceContractStatus`, `CommerceContractPartyRoleType`, `CommerceObligationType`, `CommerceObligationStatus`, `CommerceEventType`, `PaymentAllocationType`

Что нельзя тянуть прямыми relations:
- `Party` как live workspace root с глубокими contract/relation traversals.
- front-office UI rebuilt на nested commerce/legal graph.

## `ai_runtime`

| Атрибут | Значение |
| --- | --- |
| Ownership | explainability / rai-chat / runtime governance / model operations |
| Ownership type | authoritative для AI control-plane, supporting для business recommendations |
| Allowed inbound | все business domains через projections, telemetry и bounded adapters |
| Allowed outbound | только явные governed commands |
| Anti-corruption boundary | AI runtime должен читать нормализованные projections и писать audited outputs |

Current contour models:
- `AiAuditEntry`, `ExpertReview`, `TraceSummary`, `QualityAlert`, `AgentReputation`, `UserCredibilityProfile`, `SystemIncident`, `AutonomyOverride`, `AgentLifecycleOverride`, `IncidentRunbookExecution`, `RuntimeGovernanceEvent`, `PerformanceMetric`, `PendingAction`, `AgentConfiguration`, `AgentCapabilityBinding`, `AgentToolBinding`, `AgentConnectorBinding`, `AgentConfigChangeRequest`, `EvalRun`, `AgentScoreCard`, `AgronomicStrategy`, `GenerationRecord`, `GovernanceConfig`, `DivergenceRecord`, `ModelVersion`, `TrainingRun`, `DriftReport`, `LearningEvent`, `LevelFCertAudit`, `GovernanceCommittee`, `QuorumProcess`, `GovernanceSignature`

MG-Core analogs:
- `AIFeedback`, `GovernanceFlag`, `CanonicalViolation`

Ключевые enum:
- `RuntimeGovernanceEventType`, `AgentConfigChangeStatus`, `ModelStatus`, `TrainingStatus`, `SystemIncidentType`, `QualityAlertSeverity`, `AutonomyMode`, `OverrideStatus`, `AgentProductionDecision`

Что нельзя тянуть прямыми relations:
- AI/runtime владеет `Season`, `Task`, `Party`, `EconomicEvent` через прямые связи.
- global presets через nullable `companyId` навсегда.

## `knowledge_memory`

| Атрибут | Значение |
| --- | --- |
| Ownership | shared memory / retrieval layer |
| Ownership type | authoritative для memory state, cross-cutting для retrieval |
| Allowed inbound | все домены через governed formation adapters |
| Allowed outbound | retrieval contracts и summarized outputs |
| Anti-corruption boundary | memory не должна становиться параллельным source of truth для business domains |

Current contour models:
- `MemoryEntry`, `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile`, `Engram`, `SemanticFact`, `KnowledgeNode`, `KnowledgeEdge`

MG-Core analogs:
- прямого memory contour нет.

Ключевые enum:
- `MemoryType`, `KnowledgeNodeType`, `KnowledgeNodeSource`, `KnowledgeEdgeType`, `KnowledgeEdgeSource`

Что нельзя тянуть прямыми relations:
- `Engram` и `SemanticFact` как master data вместо governed knowledge layer.
- global knowledge scope только через `companyId = NULL`.

## `risk_governance`

| Атрибут | Значение |
| --- | --- |
| Ownership | risk engine / policy / escalation surface |
| Ownership type | authoritative |
| Allowed inbound | `agri_execution`, `finance`, `org_legal`, `ai_runtime` через facts/events |
| Allowed outbound | `platform_core` и явные command boundaries |
| Anti-corruption boundary | risk reason-ит по фактам, а не владеет чужими lifecycle |

Current contour models:
- `RiskSignal`, `RiskAssessment`, `RiskStateHistory`, `DecisionRecord`, `GovernanceLock`, `OverrideRequest`, `ApprovalRequest`, плюс governance-adjacent overlap на `SystemIncident`, `IncidentRunbookExecution`, `LevelFCertAudit`

MG-Core analogs:
- `AntiFraudSignal`, `GovernanceFlag`, `CanonicalViolation`, `RegistryAuditEvent`

Ключевые enum:
- `RiskFsmState`, `RiskSignalType`, `RiskAssessmentResult`, `ImpactLevel`, `RiskSeverity`, `ConfidenceLevel`

Что нельзя тянуть прямыми relations:
- direct risk writes в agronomy/finance tables без event или command boundary.

## `research_rd`

| Атрибут | Значение |
| --- | --- |
| Ownership | R&D, experimentation, institutional exploration |
| Ownership type | authoritative |
| Allowed inbound | `agri_planning`, `agri_execution`, `ai_runtime`, `knowledge_memory` через projections |
| Allowed outbound | только governed recommendations и derived findings |
| Anti-corruption boundary | research artifacts не должны мутировать operational aggregates напрямую |

Current contour models:
- `ResearchProgram`, `Experiment`, `Protocol`, `Trial`, `Measurement`, `ResearchResult`, `ResearchConclusion`, `StrategicSignal`, `ExplorationCase`, `WarRoomSession`, `WarRoomDecisionEvent`, `ImpactAuditRecord`, `RewardRecord`, `LabCapacityConfig`, `ExternalSourceAllowlist`, `AIScanRunLog`, `SoilMetric`, `SustainabilityBaseline`, `BiodiversityMetric`

MG-Core analogs:
- прямых эквивалентов нет.

Ключевые enum:
- `ExperimentType`, `ExperimentState`, `ExplorationCaseStatus`, `StrategicSignalType`, `RewardRecordStatus`

Что нельзя тянуть прямыми relations:
- research lifecycle, встроенный в live operational graphs.

## `integration_reliability`

| Атрибут | Значение |
| --- | --- |
| Ownership | outbox, idempotency, transport, ingestion, delivery control |
| Ownership type | cross-cutting |
| Allowed inbound | все домены могут эмитить события в этот контур |
| Allowed outbound | нет business ownership |
| Anti-corruption boundary | integration tables должны оставаться техническими |

Current contour models:
- `OutboxMessage`, `EventConsumption`, `VisionObservation`, `SatelliteObservation`, `AgroEventDraft`, `AgroEventCommitted`, `AgroEscalation`, `FrontOfficeDraft`, `FrontOfficeCommittedEvent`, `FrontOfficeThread`, `FrontOfficeThreadMessage`, `FrontOfficeHandoffRecord`, `FrontOfficeThreadParticipantState`, `BackOfficeFarmAssignment`

MG-Core analogs:
- `Event`, `Notification`, часть registry projection tables, но не полноценный outbox/idempotency contour.

Ключевые enum:
- `OutboxStatus`, `VisionObservationStatus`, `SatelliteObservationStatus`
- часть front-office state vocabulary пока зашита строками, что само по себе долг.

Что нельзя тянуть прямыми relations:
- чтение `OutboxMessage` и `EventConsumption` как business state.
- communication workspace как deep aggregate вместо projection layer.

## Где нужны anti-corruption boundaries обязательно

1. `finance <- agri_execution`
- вход только через `EconomicEvent`/execution facts.
- запрещен live traversal planning graph.

2. `ai_runtime <- business domains`
- вход через projections, snapshots, tool contracts.
- запрещено прямое владение business aggregates.

3. `crm_commerce <- org_legal`
- вход через jurisdiction/profile/legal projections.
- запрещен ad hoc legal graph walk.

4. `front-office <- crm_commerce + agri_execution`
- нужен workspace projection.
- запрещен UI rebuilt из nested relation graph.

5. `knowledge_memory <- all domains`
- только governed formation/retrieval adapters.
- запрещено silent parallel source-of-truth behavior.

## Финальные выводы по ownership

1. `Company` принадлежит `org_legal`, а не `platform_core`.
2. `TenantState` принадлежит `platform_core`, а не business semantics `Company`.
3. `BudgetPlan` - это `agri_planning` artifact с finance seam, а не finance core table.
4. `FrontOfficeThread` family семантически ближе к `crm_commerce` workspace, а доставка и idempotency - к `integration_reliability`.
5. `AgentConfiguration` и runtime governance tables принадлежат `ai_runtime`.
6. `MG-Core` нельзя использовать как parallel domain owner для current contour.
