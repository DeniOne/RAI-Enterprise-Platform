# ENUM_DECISION_REGISTER

## Purpose

Реестр фиксирует исполнимые решения по каждому enum.

## Baseline

- Enum count baseline (2026-03-13): `149`.
- Target: `0` enum без taxonomy decision к завершению Phase 5.

## Decision table

| Enum | Domain owner | Taxonomy class | Decision | Target artifact/table | Migration phase | Backward compatibility | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AccountStatus` | `crm_commerce` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `AccountType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `AgentCanaryStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `AgentConfigChangeScope` | `ai_runtime` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `AgentConfigChangeStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `AgentProductionDecision` | `ai_runtime` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `AgentRollbackStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `AIScanRunStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `AllowlistStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ApplicationMethod` | `agri_planning` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `ApprovalDecision` | `agri_planning` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `ApproverRole` | `agri_planning` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ArtifactSourceType` | `org_legal` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `AssetLinkType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `AssetPartyRoleType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `AssetStatus` | `crm_commerce` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `BudgetCategory` | `agri_planning` | `suspicious duplicate enum family` | `rename` | `BudgetCategory(FERTILIZER canonical)` | `phase_5` | `migration 20260313214500 + alias removal` | `confirmed` | `literal defect FERTILIZERS fixed` |
| `BudgetStatus` | `finance` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `BudgetType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `CashDirection` | `finance` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `CashFlowType` | `finance` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `CertAuditStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ChangeOrderStatus` | `agri_planning` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ChangeOrderType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ClientResponseStatus` | `agri_execution` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ClientType` | `platform_core` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ClimateType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `CommerceContractPartyRoleType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `CommerceContractStatus` | `crm_commerce` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `CommerceEventDomain` | `crm_commerce` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `CommerceEventType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `CommerceObligationStatus` | `crm_commerce` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `CommerceObligationType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ComplianceStatus` | `org_legal` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ConfidenceLevel` | `agri_execution` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `ContactRole` | `crm_commerce` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `Controllability` | `agri_execution` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `CounterpartyUserBindingStatus` | `crm_commerce` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `CropType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `DataSourceType` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `DealStage` | `crm_commerce` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `DecisionStatus` | `finance` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `DeviationStatus` | `agri_execution` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `DeviationType` | `agri_execution` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `DocumentType` | `org_legal` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `DriftStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `EconomicEventType` | `finance` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `EvidenceType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ExecutionStatus` | `agri_execution` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ExperimentState` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ExperimentType` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ExplorationCaseStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ExplorationMode` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ExplorationRiskLevel` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ExplorationType` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `FieldStatus` | `agri_planning` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `GoalStatus` | `agri_planning` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `GoalType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `GovernanceLockReason` | `ai_runtime` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `GrInteractionType` | `org_legal` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `HarvestPlanStatus` | `agri_execution` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ImpactLevel` | `org_legal` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `ImpactTargetType` | `org_legal` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ImpactVerdict` | `quarantine_sandbox` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `IncidentRunbookAction` | `ai_runtime` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `IncidentRunbookExecutionStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `InputType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `InsuranceType` | `agri_execution` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `IntegrityStatus` | `agri_execution` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `InteractionType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `InvitationStatus` | `platform_core` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `InvoiceDirection` | `finance` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `InvoiceStatus` | `finance` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `KnowledgeEdgeRelation` | `ai_runtime` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `KnowledgeEdgeSource` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `KnowledgeNodeSource` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `KnowledgeNodeType` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `LegalObligationStatus` | `org_legal` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `LiabilityMode` | `agri_execution` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `LifecycleStatus` | `platform_core` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `MachineryType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `MeasurementSource` | `platform_core` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ModelStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ObligationStatus` | `crm_commerce` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ObservationIntent` | `agri_execution` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `ObservationType` | `agri_execution` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `OperationType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `OutboxStatus` | `integration_reliability` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `OverrideCategory` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `OverrideStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `PartyEntityStatus` | `crm_commerce` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `PartyEntityType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `PartyRelationType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `PaymentStatus` | `finance` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `PendingActionStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `PerformanceMetricType` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ProgramStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ProtocolStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `QualityAlertType` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `QuorumStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `RapeseedType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RegulatorType` | `org_legal` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RegulatoryArtifactStatus` | `org_legal` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `ReputationLevel` | `ai_runtime` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `RequirementType` | `org_legal` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `ResponsibilityMode` | `agri_execution` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RewardStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `RewardType` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskCategory` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskFsmState` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `RiskLevel` | `agri_execution` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskReferenceType` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskSeverity` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskSource` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskTargetType` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskType` | `agri_execution` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RiskVerdict` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RoiSource` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RuleSeverity` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `RuntimeGovernanceEventType` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `SanctionType` | `org_legal` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `SatelliteIndexType` | `integration_reliability` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `SatelliteSource` | `integration_reliability` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `SeasonStatus` | `agri_planning` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `SignalSource` | `quarantine_sandbox` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `SignalStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `SoilGranulometricType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `SoilType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `StockItemType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `StockTransactionType` | `crm_commerce` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `StrategicValue` | `crm_commerce` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `StrategyStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `SystemIncidentStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `SystemIncidentType` | `ai_runtime` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `TaskStatus` | `agri_execution` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `TechMapStatus` | `agri_planning` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `TenantLifecycleStatus` | `platform_core` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `TenantMode` | `platform_core` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `TimeboxStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `TrainingStatus` | `ai_runtime` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `TriageStatus` | `platform_core` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `TriggerOperator` | `platform_core` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `TriggerType` | `agri_planning` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `UserAccessLevel` | `platform_core` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `UserRole` | `platform_core` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `VerificationStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |
| `VisionObservationModality` | `integration_reliability` | `technical closed enum` | `keep` | `n/a` | `phase_5` | `n/a` | `planned` |  |
| `VisionObservationSource` | `integration_reliability` | `suspicious duplicate enum family` | `merge` | `consolidated_vocabulary_family` | `phase_5_plus` | `compatibility mapping required` | `planned` |  |
| `WarRoomStatus` | `quarantine_sandbox` | `FSM/status invariant enum` | `keep` | `n/a` | `phase_5` | `n/a` | `confirmed` |  |

## Governance rules

- Каждая запись обязана иметь owner domain и migration phase.
- Для `merge/rename/convert/deprecate` обязателен compatibility contract.
- Запись в register обязательна до schema migration c enum-change.
