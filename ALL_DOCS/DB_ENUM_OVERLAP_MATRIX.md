# DB_ENUM_OVERLAP_MATRIX

## Purpose

Матрица пересечений enum-family для Phase 5 cleanup.

Дата: `2026-03-13`.
Источник: `packages/prisma-client/schema.prisma`.

## `risk-*` family

- `RiskCategory`
- `RiskLevel`
- `RiskType`
- `RiskSource`
- `RiskSeverity`
- `RiskVerdict`
- `RiskFsmState`
- `RiskTargetType`
- `RiskReferenceType`

Decision:
- нормализовать severity scale в один канонический enum;
- сохранить `RiskFsmState` отдельно как FSM;
- `RiskSource/RiskReferenceType/RiskTargetType` подготовить к переходу в reference vocabulary tables.

## `status-*` family

- `AccountStatus`
- `BudgetStatus`
- `ChangeOrderStatus`
- `ClientResponseStatus`
- `CommerceContractStatus`
- `CommerceObligationStatus`
- `ComplianceStatus`
- `CounterpartyUserBindingStatus`
- `DecisionStatus`
- `DeviationStatus`
- `DriftStatus`
- `ExecutionStatus`
- `ExperimentState`
- `ExplorationCaseStatus`
- `GoalStatus`
- `HarvestPlanStatus`
- `IncidentRunbookExecutionStatus`
- `IntegrityStatus`
- `InvitationStatus`
- `InvoiceStatus`
- `LegalObligationStatus`
- `LifecycleStatus`
- `ModelStatus`
- `OutboxStatus`
- `OverrideStatus`
- `PartyEntityStatus`
- `PaymentStatus`
- `PendingActionStatus`
- `ProgramStatus`
- `ProtocolStatus`
- `QuorumStatus`
- `RegulatoryArtifactStatus`
- `RewardStatus`
- `SeasonStatus`
- `SignalStatus`
- `StrategyStatus`
- `SystemIncidentStatus`
- `TaskStatus`
- `TechMapStatus`
- `TenantLifecycleStatus`
- `TimeboxStatus`
- `TrainingStatus`
- `TriageStatus`
- `VerificationStatus`
- `WarRoomStatus`

Decision:
- status-слой не объединять механически;
- стандартизовать naming/lifecycle policy и запретить дубли без явной причины.

## `source-*` family

- `ArtifactSourceType`
- `DataSourceType`
- `KnowledgeNodeSource`
- `KnowledgeEdgeSource`
- `MeasurementSource`
- `RiskSource`
- `RoiSource`
- `SignalSource`
- `VisionObservationSource`
- `SatelliteSource`

Decision:
- `KnowledgeNodeSource + KnowledgeEdgeSource` консолидировать;
- source-вокабуляры с ростом вынести в reference tables.

## `type-*` family

- `AccountType`
- `AssetPartyRoleType`
- `AssetLinkType`
- `BudgetType`
- `ChangeOrderType`
- `ClientType`
- `ClimateType`
- `CommerceContractPartyRoleType`
- `CommerceEventType`
- `CommerceObligationType`
- `CropType`
- `DeviationType`
- `DocumentType`
- `EconomicEventType`
- `EvidenceType`
- `ExperimentType`
- `GoalType`
- `ImpactTargetType`
- `InputType`
- `InsuranceType`
- `InteractionType`
- `MachineryType`
- `ObservationType`
- `OperationType`
- `PartyEntityType`
- `PartyRelationType`
- `PerformanceMetricType`
- `RapeseedType`
- `RegulatorType`
- `RequirementType`
- `RiskType`
- `SanctionType`
- `SatelliteIndexType`
- `StockItemType`
- `StockTransactionType`
- `SystemIncidentType`
- `TriggerType`

Decision:
- большая часть `type-*` для предметных словарей = кандидаты на reference/config tables;
- технические типы (`SystemIncidentType`, `PerformanceMetricType`) остаются enum.

## `mode-*` family

- `ExplorationMode`
- `LiabilityMode`
- `ResponsibilityMode`
- `TenantMode`

Decision:
- `LiabilityMode/ResponsibilityMode` нормализовать в единый liability vocabulary;
- `TenantMode` оставить technical enum;
- `ExplorationMode` перенести в configurable vocabulary при выходе `research_rd` из quarantine.

## Approved renames / normalization set

- `BudgetCategory` normalized: canonical value = `FERTILIZER` (`FERTILIZERS` removed by migration).
- `LiabilityMode/ResponsibilityMode` -> normalized liability vocabulary family.
- `KnowledgeNodeSource/KnowledgeEdgeSource` -> unified knowledge source vocabulary.

## Owner approvals

- `agri_planning`: approved taxonomy direction.
- `agri_execution`: approved taxonomy direction.
- `finance`: approved taxonomy direction.
- `crm_commerce`: approved taxonomy direction.
- `ai_runtime`: approved taxonomy direction.
- `integration_reliability`: approved taxonomy direction.
- `org_legal`: approved taxonomy direction.
- `platform_core`: approved taxonomy direction.
