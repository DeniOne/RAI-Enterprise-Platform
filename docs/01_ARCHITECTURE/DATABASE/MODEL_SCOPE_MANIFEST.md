# MODEL_SCOPE_MANIFEST

## Purpose

Это канонический scope-manifest для tenancy и boundary governance.

Жесткое правило:
- модель без manifest-классификации не может участвовать в tenancy migration;
- новая модель не может быть добавлена без scope decision;
- `companyId = NULL` не может использоваться как неформальная замена `global` или `preset` scope.

## Scope taxonomy

Допустимые `scope_type`:
- `tenant`
- `business`
- `global`
- `preset`
- `system`
- `mixed-transition`

## Full inventory coverage (current contour)

| Model | Owner domain | Scope type | Authoritative key | companyId policy | tenantId policy | Global row | Preset row | Migration phase | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Account` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AccountBalance` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AdaptiveRule` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AgentCapabilityBinding` | `ai_runtime` | `tenant` | `tenantId + agentConfigId` | `temporary optional` | `phase_1` | `yes` | `yes` | `phase_1` | `control-plane` |
| `AgentConfigChangeRequest` | `ai_runtime` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `control-plane` |
| `AgentConfiguration` | `ai_runtime` | `tenant` | `tenantId + role` | `temporary optional` | `phase_1` | `yes` | `yes` | `phase_1` | `companyId = NULL` |
| `AgentConnectorBinding` | `ai_runtime` | `tenant` | `tenantId + agentConfigId` | `temporary optional` | `phase_1` | `yes` | `yes` | `phase_1` | `control-plane` |
| `AgentLifecycleOverride` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AgentReputation` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AgentScoreCard` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AgentToolBinding` | `ai_runtime` | `tenant` | `tenantId + agentConfigId` | `temporary optional` | `phase_1` | `yes` | `yes` | `phase_1` | `control-plane` |
| `AgroEscalation` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AgroEventCommitted` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AgroEventDraft` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AgronomicStrategy` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AiAuditEntry` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AIScanRunLog` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `ApiUsage` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `Approval` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ApprovalRequest` | `ai_runtime/risk_governance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AssetPartyRole` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AuditFailure` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `AuditLog` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `AuditNotarizationRecord` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `AutonomyOverride` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `BackOfficeFarmAssignment` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `BiodiversityMetric` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `Budget` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `BudgetItem` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `BudgetLine` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `BudgetPlan` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `BudgetReservation` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `BusinessRule` | `agri_planning` | `preset` | `id` | `optional during transition` | `deferred` | `yes` | `yes` | `phase_2` | `rule library` |
| `CashAccount` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ChangeOrder` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `CmrDecision` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `CmrRisk` | `agri_execution` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `risk facts, не control-plane` |
| `CommerceContract` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `business/legal ownership remains` |
| `CommerceContractPartyRole` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `CommerceFulfillmentEvent` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `CommerceObligation` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Company` | `org_legal` | `business` | `id` | `required` | `forbidden until explicit bridge need` | `no` | `no` | `phase_2` | `больше не platform root` |
| `ComplianceCheck` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Contact` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Contract` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `CounterpartyUserBinding` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `CropVariety` | `agri_planning` | `preset` | `id` | `optional during transition` | `deferred` | `yes` | `yes` | `phase_2` | `reference/preset semantics` |
| `CropVarietyHistory` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `CropZone` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Deal` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `DecisionRecord` | `ai_runtime/risk_governance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `DeviationReview` | `agri_execution` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `сильная связность с planning/finance` |
| `DivergenceRecord` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `DriftReport` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `EconomicEvent` | `finance` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `high-write finance core` |
| `EmployeeProfile` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `Engram` | `ai_runtime/knowledge_memory` | `preset` | `id` | `optional during transition` | `deferred until explicit scope model` | `yes` | `yes` | `phase_2` | `explicit knowledge scope нужен раньше structural move` |
| `EvalRun` | `ai_runtime` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `control-plane eval` |
| `EventConsumption` | `integration_reliability` | `mixed-transition` | `consumer + eventId` | `temporary optional` | `phase_1` | `yes if system-consumer` | `no` | `phase_1` | `current runtime classification conflict must be fixed first` |
| `Evidence` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ExecutionOrchestrationLog` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ExecutionRecord` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Experiment` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `ExpertReview` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ExplorationCase` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `ExternalLegalFeed` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ExternalSourceAllowlist` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `Field` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `FieldObservation` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `FrontOfficeCommittedEvent` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `FrontOfficeDraft` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `FrontOfficeHandoffRecord` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `FrontOfficeThread` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `FrontOfficeThreadMessage` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `FrontOfficeThreadParticipantState` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `GenerationRecord` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `GovernanceCommittee` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `GovernanceConfig` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `GovernanceLock` | `ai_runtime/risk_governance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `GovernanceSignature` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `GrInteraction` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `HarvestPlan` | `agri_execution` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `до projections не трогать` |
| `HarvestResult` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Holding` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `HrDevelopmentAction` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HrDevelopmentPlan` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HrKPIIndicator` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HrOnboardingPlan` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HrRecognitionEvent` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HrRewardEvent` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HrSupportCase` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HumanAssessmentSnapshot` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `HybridPhenologyModel` | `agri_planning` | `preset` | `id` | `optional during transition` | `deferred` | `yes` | `yes` | `phase_2` | `preset/reference semantics` |
| `ImpactAuditRecord` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `IncidentRunbookExecution` | `ai_runtime` | `tenant` | `tenantId + id` | `temporary derived` | `phase_1` | `no` | `no` | `phase_1` | `control-plane child` |
| `InputCatalog` | `agri_planning` | `preset` | `id` | `optional during transition` | `deferred` | `yes` | `yes` | `phase_2` | `catalog semantics` |
| `InsuranceCoverage` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Interaction` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Invitation` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `Invoice` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Jurisdiction` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `KeyResult` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `KnowledgeEdge` | `ai_runtime/knowledge_memory` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `KnowledgeNode` | `ai_runtime/knowledge_memory` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `LabCapacityConfig` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `LearningEvent` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `LedgerEntry` | `finance` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `high-write finance core` |
| `LegalDocument` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `LegalNorm` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `LegalObligation` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `LegalRequirement` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `LevelFCertAudit` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Machinery` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ManagementDecision` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `MapOperation` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `MapResource` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `MapStage` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Measurement` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `MemoryEntry` | `ai_runtime/knowledge_memory` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `MemoryEpisode` | `ai_runtime/knowledge_memory` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `memory control-plane` |
| `MemoryInteraction` | `ai_runtime/knowledge_memory` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `memory control-plane` |
| `MemoryProfile` | `ai_runtime/knowledge_memory` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `memory control-plane` |
| `ModelVersion` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Objective` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `Obligation` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `OkrCycle` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `OutboxMessage` | `integration_reliability` | `system` | `id` | `optional reporting only` | `deferred` | `yes` | `no` | `phase_2` | `не business state` |
| `OverrideRequest` | `ai_runtime/risk_governance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Party` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `нужен и tenant scope, и business owner semantics` |
| `PartyRelation` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Payment` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `PaymentAllocation` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `PaymentSchedule` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `PendingAction` | `ai_runtime` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `control-plane` |
| `PerformanceContract` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `PerformanceMetric` | `ai_runtime` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `control-plane telemetry` |
| `PersonalCompetencyState` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `PolicySignal` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Protocol` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `PulseSurvey` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `QualityAlert` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `QuorumProcess` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Rapeseed` | `agri_planning` | `preset` | `id` | `optional during transition` | `deferred` | `yes` | `yes` | `phase_2` | `companyId = NULL` |
| `RapeseedHistory` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `RegionProfile` | `agri_planning` | `preset` | `id` | `optional during transition` | `deferred` | `yes` | `yes` | `phase_2` | `preset/reference semantics` |
| `RegulatoryArtifact` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `RegulatoryBody` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `RegulatoryProfile` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `ResearchConclusion` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `ResearchProgram` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `ResearchResult` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `RevenueRecognitionEvent` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `RewardRecord` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `RiskAssessment` | `ai_runtime/risk_governance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `RiskSignal` | `ai_runtime/risk_governance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `RiskStateHistory` | `ai_runtime/risk_governance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `RoleDefinition` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `RuntimeGovernanceEvent` | `ai_runtime` | `tenant` | `tenantId + id` | `temporary optional` | `phase_1` | `no` | `no` | `phase_1` | `event/control-plane` |
| `Sanction` | `org_legal` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `SatelliteObservation` | `integration_reliability` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `ScoreCard` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Season` | `agri_planning` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `core aggregate, не трогать в first tranche` |
| `SeasonHistory` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `SeasonSnapshot` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `SeasonStageProgress` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `SemanticFact` | `ai_runtime/knowledge_memory` | `preset` | `id` | `optional during transition` | `deferred until explicit scope model` | `yes` | `yes` | `phase_2` | `explicit knowledge scope нужен раньше structural move` |
| `SoilMetric` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `SoilProfile` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `StockItem` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `StockMove` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `StockTransaction` | `crm_commerce` | `business` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `StrategicGoal` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `StrategicSignal` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `StrategyForecastRun` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `StrategyForecastScenario` | `finance` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `SurveyResponse` | `platform_core` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` | `needs explicit owner review` |
| `SustainabilityBaseline` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `SystemIncident` | `ai_runtime` | `mixed-transition` | `tenantId + id` | `temporary optional` | `phase_1` | `yes` | `no` | `phase_1` | `companyId` |
| `Task` | `agri_execution` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `core execution` |
| `TaskResourceActual` | `agri_execution` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `TechMap` | `agri_planning` | `tenant` | `id` | `required now` | `deferred` | `no` | `no` | `phase_3_plus` | `высокосвязанный aggregate` |
| `TechnologyCard` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `TechnologyCardOperation` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `TechnologyCardResource` | `agri_planning` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Tenant` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `TenantCompanyBinding` | `platform_core` | `system` | `tenantId + companyId` | `required` | `required` | `no` | `no` | `phase_1` | `platform tenant<->company bridge` |
| `TenantState` | `platform_core` | `mixed-transition` | `tenantId` | `temporary required` | `phase_1` | `no` | `no` | `phase_1` | `первый кандидат на перевод` |
| `TraceSummary` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `TrainingRun` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `Trial` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `User` | `platform_core` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `UserCredibilityProfile` | `ai_runtime` | `tenant` | `id` | `required` | `deferred` | `no` | `no` | `phase_3_plus` |  |
| `VisionObservation` | `integration_reliability` | `system` | `id` | `optional` | `forbidden` | `yes` | `no` | `phase_2` |  |
| `WarRoomDecisionEvent` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |
| `WarRoomSession` | `quarantine_sandbox/research_rd` | `preset` | `id` | `optional` | `deferred` | `yes` | `yes` | `phase_2` | `explicit preset/global scope required` |

## Enforcement rules

Нужно проверять в CI:
- есть ли manifest entry для новой модели;
- совпадает ли scope manifest с runtime policy;
- не используется ли `companyId = NULL` вне разрешённых preset/global cases;
- не появился ли новый `mixed-transition` model без migration phase;
- не добавилась ли новая relation на `Company` без ADR.
