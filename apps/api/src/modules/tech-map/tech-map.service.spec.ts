import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { TechMapValidationEngine } from "./validation/techmap-validation.engine";
import { DAGValidationService } from "./validation/dag-validation.service";
import { TechMapValidator } from "./tech-map.validator";
import { UnitNormalizationService } from "./unit-normalization.service";
import { TechMapService } from "./tech-map.service";
import { TechMapWorkflowOrchestratorService } from "./tech-map-workflow-orchestrator.service";
import { TechMapGenerationOrchestratorService } from "./generation/tech-map-generation-orchestrator.service";
import { SystemIncidentStatus, SystemIncidentType } from "@rai/prisma-client";

describe("TechMapService", () => {
  let service: TechMapService;
  const prismaMock: any = {
    techMap: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    soilProfile: {
      findFirst: jest.fn(),
    },
    harvestResult: {
      count: jest.fn(),
    },
    regionProfile: {
      findFirst: jest.fn(),
    },
    deviationReview: {
      findMany: jest.fn(),
    },
    evidence: {
      findMany: jest.fn(),
    },
    systemIncident: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    inputCatalog: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechMapService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: IntegrityGateService, useValue: {} },
        { provide: TechMapStateMachine, useValue: {} },
        { provide: TechMapValidationEngine, useValue: {} },
        { provide: DAGValidationService, useValue: {} },
        { provide: TechMapValidator, useValue: {} },
        { provide: UnitNormalizationService, useValue: {} },
        TechMapWorkflowOrchestratorService,
        { provide: TechMapGenerationOrchestratorService, useValue: { orchestrate: jest.fn() } },
      ],
    }).compile();

    service = module.get(TechMapService);
  });

  it("resumeDraftClarify возвращает audit trail и resume state", async () => {
    prismaMock.techMap.findFirst
      .mockResolvedValueOnce({
        id: "tm-1",
        status: "DRAFT",
        crop: "rapeseed",
        seasonId: "season-1",
        fieldId: "field-1",
        generationMetadata: { methodologyProfileId: "methodology:base" },
        harvestPlan: {
          accountId: "acc-1",
          minValue: 1,
          optValue: 2,
          maxValue: 3,
          baselineValue: 2,
          targetMetric: "YIELD_QPH",
          period: "SEASON_2026",
          performanceContract: { modelType: "FIXED" },
        },
        season: {
          farmId: "farm-1",
          expectedYield: 6,
          actualYield: null,
          cropVarietyId: null,
          field: {
            clientId: "client-1",
            protectedZoneFlags: null,
            drainageClass: null,
            slopePercent: null,
          },
        },
        cropZone: {
          fieldId: "field-1",
          seasonId: "season-1",
          cropType: "RAPESEED",
          predecessorCrop: null,
          targetYieldTHa: 7,
          varietyHybrid: null,
          cropVarietyId: null,
          season: {
            farmId: "farm-1",
            expectedYield: 6,
            actualYield: null,
            cropVarietyId: null,
            field: {
              clientId: "client-1",
              protectedZoneFlags: null,
              drainageClass: null,
              slopePercent: null,
            },
          },
        },
      })
      .mockResolvedValueOnce(null);
    prismaMock.soilProfile.findFirst.mockResolvedValue({ sampleDate: "2026-03-01" });
    prismaMock.harvestResult.count.mockResolvedValue(0);
    prismaMock.regionProfile.findFirst.mockResolvedValue({ id: "region-1" });
    prismaMock.inputCatalog.count.mockResolvedValue(1);

    const result = await service.resumeDraftClarify("tm-1", "company-1", {
      resolvedSlotKeys: ["soil_profile"],
      resumeRequested: true,
    });

    expect(result.draftId).toBe("tm-1");
    expect(result.workflowResumeState?.resume_token).toContain("resume:tech-map:tm-1");
    expect(result.clarifyAuditTrail).toHaveLength(3);
    expect(result.clarifyAuditTrail?.[1].event_type).toBe(
      "workflow_resume_requested",
    );
    expect(result.workflowOrchestration?.phase_engine).toEqual([
      "INTAKE",
      "TRIAGE",
      "BRANCHING",
      "TRUST",
      "COMPOSITION",
    ]);
    expect(result.workflowOrchestration?.summary).toContain("Workflow spine");
    expect(result.workflowSnapshot?.workflow_id).toBe("tech-map:tm-1");
    expect(result.workflow_snapshot?.draft_id).toBe("tm-1");
    expect(result.workflowSnapshot?.workflow_mode).toBe("resume");
    expect(result.workflowSnapshot?.missing_must).toEqual(result.missingMust);
    expect(result.workflowExplainability?.explainability_window).toBe(
      "clarification",
    );
    expect(result.workflow_explainability?.source_slots.missing_must).toEqual(
      result.missingMust,
    );
    expect(result.executionLoopSummary?.scope.workflow_id).toBe("tech-map:tm-1");
    expect(result.execution_loop_summary?.tech_map_ref.draft_id).toBe("tm-1");
    expect(result.executionLoopSummary?.execution_state.status).toBe("NO_HISTORY");
    expect(result.executionLoopSummary?.deviation_state.status).toBe(
      "BLOCKED_BY_CONTEXT",
    );
    expect(
      result.executionLoopSummary?.result_state.target_context.target_yield_t_ha,
    ).toBe(7);
    expect(prismaMock.techMap.findFirst).toHaveBeenCalled();
  });

  it("getCanonicalDraft возвращает governed draft read-model", async () => {
    prismaMock.techMap.findFirst.mockResolvedValueOnce({
      id: "tm-4",
      companyId: "company-1",
      harvestPlanId: "plan-1",
      fieldId: "field-1",
      seasonId: "season-1",
      crop: "rapeseed",
      version: 2,
      status: "REVIEW",
      approvedAt: null,
      basePlanHash: null,
      generationMetadata: {
        source: "blueprint",
        blueprintVersion: "2026.03",
        hash: "hash-4",
      },
      generationRecordId: "gen-4",
      field: {
        id: "field-1",
        area: 50,
        clientId: "client-1",
        protectedZoneFlags: { waterProtection: true },
      },
      season: {
        id: "season-1",
        farmId: "farm-1",
        expectedYield: 5.2,
        actualYield: null,
        cropVarietyId: "var-1",
      },
      harvestPlan: {
        accountId: "acc-1",
        minValue: 1,
        optValue: 2,
        maxValue: 3,
        baselineValue: 2,
        targetMetric: "YIELD_QPH",
        period: "SEASON_2026",
        performanceContract: { modelType: "FIXED" },
      },
      cropZone: {
        id: "crop-zone-1",
        fieldId: "field-1",
        seasonId: "season-1",
        cropType: "RAPESEED",
        cropVarietyId: "var-1",
        varietyHybrid: "hybrid-a",
        predecessorCrop: "wheat",
        targetYieldTHa: 4.5,
        constraints: { water: true },
        field: {
          id: "field-1",
          area: 50,
          clientId: "client-1",
          protectedZoneFlags: { waterProtection: true },
        },
        season: {
          id: "season-1",
          farmId: "farm-1",
          expectedYield: 5.2,
          actualYield: null,
          cropVarietyId: "var-1",
        },
        cropVariety: null,
      },
      stages: [
        {
          id: "stage-1",
          name: "Посев",
          sequence: 1,
          aplStageId: "04_SOWING",
          operations: [
            {
              id: "op-1",
              name: "Сев",
              operationType: "SEEDING",
              bbchWindowFrom: "10",
              bbchWindowTo: "12",
              dateWindowStart: new Date("2026-03-25T00:00:00.000Z"),
              dateWindowEnd: new Date("2026-03-28T00:00:00.000Z"),
              weatherConstraints: null,
              dependencies: [],
              isCritical: true,
              executionProtocol: null,
              evidenceRequired: null,
              plannedStartTime: new Date("2026-03-25T00:00:00.000Z"),
              plannedEndTime: new Date("2026-03-25T06:00:00.000Z"),
              durationHours: 6,
              requiredMachineryType: "SEEDER",
              evidence: [{ id: "evidence-1" }],
              executionRecord: { id: "execution-1" },
              resources: [
                {
                  id: "res-1",
                  inputCatalogId: "input-1",
                  type: "seed",
                  name: "Семена",
                  amount: 120,
                  unit: "kg",
                  costPerUnit: 200,
                  plannedRateUnit: "kg/ha",
                  minRate: 2,
                  maxRate: 3,
                  applicationMethod: null,
                  bbchRestrictionFrom: null,
                  bbchRestrictionTo: null,
                  tankMixGroupId: null,
                  evidence: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const draft = await service.getCanonicalDraft("tm-4", "company-1");

    expect(draft.header.workflow_id).toBe("techmap:tm-4:v2");
    expect(draft.approval_packet?.packet_id).toBe("approval-packet:tm-4:v2");
    expect(draft.variants[0]?.overall_verdict).toBeDefined();
    expect(draft.audit_refs.length).toBeGreaterThan(0);
  });

  it("updateDraft разрешает правку только для head DRAFT", async () => {
    prismaMock.techMap.findFirst.mockResolvedValueOnce({
      id: "tm-2",
      companyId: "company-1",
      status: "DRAFT",
      isLatest: true,
      version: 4,
    });
    prismaMock.techMap.update.mockResolvedValueOnce({
      id: "tm-2",
      title: "patched",
    });

    const result = await service.updateDraft("tm-2", { title: "patched" }, "company-1");

    expect(result).toEqual({ id: "tm-2", title: "patched" });
    expect(prismaMock.techMap.update).toHaveBeenCalledWith({
      where: { id: "tm-2" },
      data: { title: "patched" },
    });
  });

  it("updateDraft блокирует immutable REVIEW snapshot", async () => {
    prismaMock.techMap.findFirst.mockResolvedValueOnce({
      id: "tm-3",
      companyId: "company-1",
      status: "REVIEW",
      isLatest: true,
      version: 5,
    });

    await expect(
      service.updateDraft("tm-3", { title: "blocked" }, "company-1"),
    ).rejects.toThrow("create a new version instead");
    expect(prismaMock.techMap.update).not.toHaveBeenCalled();
  });

  it("getExplainability возвращает explainability read-model без изменения write-контракта", async () => {
    prismaMock.techMap.findFirst.mockResolvedValueOnce({
      id: "tm-5",
      companyId: "company-1",
      crop: "rapeseed",
      cropForm: "RAPESEED_WINTER",
      canonicalBranch: "winter_rapeseed",
      generationMetadata: {
        generationStrategy: "legacy_blueprint",
        schemaVersion: "1.0.0",
        ruleRegistryVersion: "1.1.0",
        ontologyVersion: "1.1.0",
        generationTraceId: "gen-trace-1",
        rolloutMode: "shadow",
        fallbackUsed: true,
        fallbackReason: "shadow_authoritative_legacy",
        featureFlagSnapshot: {
          mode: "shadow",
          companyId: "company-1",
        },
        shadowParitySummary: {
          traceId: "shadow:gen-trace-1",
          hasBlockingDiffs: true,
          diffCount: 2,
          severityCounts: {
            P0: 1,
            P1: 1,
            P2: 0,
          },
        },
        shadowParityReport: {
          diffs: [
            {
              severity: "P0",
              code: "crop_form_mismatch",
              message: "Legacy path и canonical path расходятся по cropForm.",
            },
          ],
        },
      },
      fieldAdmissionResult: {
        verdict: "PASS_WITH_REQUIREMENTS",
        blockers: [],
        requirements: [{ ruleId: "R-ADM-002" }],
      },
      generationExplanationTrace: {
        traceId: "gen-trace-1",
        summary: {
          mandatoryBlocks: ["seed_treatment"],
        },
      },
      recommendations: [
        {
          id: "rec-1",
          title: "Требование допуска",
          isActive: true,
        },
      ],
      decisionGates: [
        {
          id: "gate-1",
          title: "Нужен ChangeOrder",
          recommendations: [],
        },
      ],
      changeOrders: [
        {
          id: "co-1",
          changeType: "CHANGE_INPUT",
          status: "PENDING_APPROVAL",
          approvals: [{ id: "approval-1", decision: null }],
        },
      ],
      monitoringSignals: [
        {
          id: "signal-1",
          signalType: "GDD_WINDOW",
        },
      ],
      ruleEvaluationTraces: [
        {
          id: "trace-1",
          ruleId: "R-ADM-002",
        },
      ],
      controlPoints: [
        {
          id: "cp-1",
          name: "Контроль розетки",
          mapStage: { id: "stage-1", name: "Осенний уход" },
          outcomeExplanations: [
            {
              id: "outcome-1",
              payload: {
                deviationReviewId: "dev-1",
                operationId: "op-77",
              },
            },
          ],
        },
      ],
    });
    prismaMock.evidence.findMany.mockResolvedValueOnce([
      {
        id: "ev-1",
        evidenceType: "PHOTO",
        fileUrl: "camera://capture/latest-photo",
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        capturedAt: new Date("2026-04-01T10:00:00.000Z"),
        operationId: "op-77",
        observationId: null,
        metadata: {
          executionSourceAudit: {
            urlKind: "intermediate_route",
            sourceScheme: "camera",
          },
        },
      },
    ]);
    prismaMock.deviationReview.findMany.mockResolvedValueOnce([
      {
        id: "dev-1",
        deviationSummary: "Полевое отклонение по control point",
        severity: "CRITICAL",
        status: "DETECTED",
      },
    ]);
    prismaMock.systemIncident.findMany.mockResolvedValueOnce([
      {
        id: "inc-techmap-1",
        companyId: "company-1",
        traceId: "gen-trace-1",
        incidentType: SystemIncidentType.UNKNOWN,
        status: SystemIncidentStatus.OPEN,
        severity: "HIGH",
        details: {
          subtype: "TECHMAP_CANONICAL_PARITY_BLOCKED",
          techMapId: "tm-5",
          runbookSuggestedAction: "REQUIRE_HUMAN_REVIEW",
          detailSummary: "Карта содержит blocking parity gaps и требует human review до cutover.",
        },
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
      },
    ]);

    const result = await service.getExplainability("tm-5", "company-1");

    expect(result.techMapId).toBe("tm-5");
    expect(result.cropForm).toBe("RAPESEED_WINTER");
    expect(result.canonicalBranch).toBe("winter_rapeseed");
    expect(result.generationExplanationTrace?.traceId).toBe("gen-trace-1");
    expect(result.generationObservability).toEqual(
      expect.objectContaining({
        rolloutMode: "shadow",
        fallbackUsed: true,
        fallbackReason: "shadow_authoritative_legacy",
        explainabilityTracePresent: true,
        versionPinning: expect.objectContaining({
          schemaVersion: "1.0.0",
          ruleRegistryVersion: "1.1.0",
          ontologyVersion: "1.1.0",
          generationTraceId: "gen-trace-1",
        }),
        shadowParitySummary: expect.objectContaining({
          hasBlockingDiffs: true,
          diffCount: 1,
        }),
      }),
    );
    expect(result.fieldAdmissionResult?.verdict).toBe("PASS_WITH_REQUIREMENTS");
    expect(result.recommendations).toHaveLength(1);
    expect(result.decisionGates).toHaveLength(1);
    expect(result.runtimeArtifacts.changeOrders).toHaveLength(1);
    expect(result.runtimeArtifacts.deviationReviews).toHaveLength(1);
    expect(result.runtimeArtifacts.evidenceAudit).toEqual({
      artifactEvidenceCount: 0,
      intermediateRouteEvidenceCount: 1,
      unresolvedRouteEvidenceTypes: ["PHOTO"],
    });
    expect(result.monitoringSignals).toHaveLength(1);
    expect(result.controlPoints).toHaveLength(1);
    expect(result.controlPoints[0].outcomeExplanations[0].evidenceAudit).toEqual({
      artifactEvidenceCount: 0,
      intermediateRouteEvidenceCount: 1,
      unresolvedRouteEvidenceTypes: ["PHOTO"],
    });
    expect(result.controlPoints[0].outcomeExplanations[0].attachedEvidence[0].sourceAudit).toEqual({
      urlKind: "intermediate_route",
      sourceScheme: "camera",
      isIntermediateRoute: true,
      isArtifactUrl: false,
    });
    expect(result.rolloutIncidents).toEqual([
      expect.objectContaining({
        id: "inc-techmap-1",
        subtype: "TECHMAP_CANONICAL_PARITY_BLOCKED",
        severity: "HIGH",
        status: "OPEN",
        techMapId: "tm-5",
        runbookSuggestedAction: "REQUIRE_HUMAN_REVIEW",
      }),
    ]);
    expect(prismaMock.techMap.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tm-5", companyId: "company-1" },
      }),
    );
  });

  it("getGenerationRolloutSummary агрегирует fallback, parity и version pinning coverage", async () => {
    prismaMock.techMap.findMany.mockResolvedValueOnce([
      {
        id: "tm-10",
        status: "DRAFT",
        generationMetadata: {
          generationStrategy: "legacy_blueprint",
          schemaVersion: "1.0.0",
          ruleRegistryVersion: "1.1.0",
          ontologyVersion: "1.1.0",
          generationTraceId: "trace-10",
          rolloutMode: "shadow",
          fallbackUsed: true,
          fallbackReason: "shadow_authoritative_legacy",
          featureFlagSnapshot: {
            mode: "shadow",
          },
          shadowParitySummary: {
            hasBlockingDiffs: true,
            diffCount: 2,
            severityCounts: {
              P0: 1,
              P1: 1,
              P2: 0,
            },
          },
        },
        generationExplanationTrace: {
          id: "genexp-10",
          traceId: "trace-10",
          completenessScore: 0.8,
        },
        fieldAdmissionResult: {
          id: "adm-10",
          verdict: "PASS_WITH_REQUIREMENTS",
        },
      },
      {
        id: "tm-11",
        status: "DRAFT",
        generationMetadata: {
          generationStrategy: "canonical_schema",
          schemaVersion: "1.0.0",
          ruleRegistryVersion: "1.1.0",
          ontologyVersion: "1.1.0",
          generationTraceId: "trace-11",
          rolloutMode: "canonical",
          fallbackUsed: false,
          fallbackReason: null,
          featureFlagSnapshot: {
            mode: "canonical",
          },
          shadowParitySummary: {
            hasBlockingDiffs: false,
            diffCount: 0,
            severityCounts: {
              P0: 0,
              P1: 0,
              P2: 0,
            },
          },
        },
        generationExplanationTrace: {
          id: "genexp-11",
          traceId: "trace-11",
          completenessScore: 1,
        },
        fieldAdmissionResult: {
          id: "adm-11",
          verdict: "PASS",
        },
      },
    ]);
    prismaMock.systemIncident.findMany.mockResolvedValueOnce([
      {
        id: "inc-rollout-1",
        companyId: "company-1",
        traceId: null,
        incidentType: SystemIncidentType.UNKNOWN,
        status: SystemIncidentStatus.OPEN,
        severity: "HIGH",
        details: {
          subtype: "TECHMAP_ROLLOUT_BLOCKING_PARITY",
          runbookSuggestedAction: "REQUIRE_HUMAN_REVIEW",
        },
        createdAt: new Date("2026-04-01T12:10:00.000Z"),
      },
    ]);

    const result = await service.getGenerationRolloutSummary("company-1");

    expect(result.totalRapeseedMaps).toBe(2);
    expect(result.rolloutManagedMaps).toBe(2);
    expect(result.legacyHistoricalMaps).toBe(0);
    expect(result.strategies).toEqual({
      legacyBlueprint: 1,
      blueprintFallback: 0,
      canonicalSchema: 1,
      unknown: 0,
    });
    expect(result.rolloutModes).toEqual({
      legacy: 0,
      shadow: 1,
      canonical: 1,
      unknown: 0,
    });
    expect(result.fallback).toEqual({
      usedCount: 1,
      reasons: {
        shadow_authoritative_legacy: 1,
      },
    });
    expect(result.metadataCoverage).toEqual({
      versionPinnedCount: 2,
      generationTraceCount: 2,
      explainabilityTraceCount: 2,
      fieldAdmissionCount: 2,
      featureFlagSnapshotCount: 2,
    });
    expect(result.parity).toEqual({
      mapsWithReport: 2,
      mapsWithBlockingDiffs: 1,
      mapsWithoutDiffs: 1,
      blockingTechMapIds: ["tm-10"],
      diffCounts: {
        P0: 1,
        P1: 1,
        P2: 0,
      },
    });
    expect(result.rolloutIncidents).toEqual([
      expect.objectContaining({
        id: "inc-rollout-1",
        subtype: "TECHMAP_ROLLOUT_BLOCKING_PARITY",
        severity: "HIGH",
        status: "OPEN",
        runbookSuggestedAction: "REQUIRE_HUMAN_REVIEW",
      }),
    ]);
  });

  it("getGenerationRolloutReadiness возвращает BLOCKED verdict при parity blockers", async () => {
    prismaMock.techMap.findMany.mockResolvedValueOnce([
      {
        id: "tm-20",
        status: "DRAFT",
        generationMetadata: {
          generationStrategy: "canonical_schema",
          schemaVersion: "1.0.0",
          ruleRegistryVersion: "1.1.0",
          ontologyVersion: "1.1.0",
          generationTraceId: "trace-20",
          rolloutMode: "shadow",
          fallbackUsed: true,
          fallbackReason: "shadow_authoritative_legacy",
          featureFlagSnapshot: {
            mode: "shadow",
          },
          shadowParitySummary: {
            hasBlockingDiffs: true,
            diffCount: 1,
            severityCounts: {
              P0: 1,
              P1: 0,
              P2: 0,
            },
          },
        },
        generationExplanationTrace: {
          id: "genexp-20",
          traceId: "trace-20",
          completenessScore: 0.8,
        },
        fieldAdmissionResult: {
          id: "adm-20",
          verdict: "PASS",
        },
      },
    ]);
    prismaMock.systemIncident.findMany.mockResolvedValueOnce([
      {
        id: "inc-rollout-20",
        companyId: "company-1",
        traceId: "trace-20",
        incidentType: SystemIncidentType.UNKNOWN,
        status: SystemIncidentStatus.OPEN,
        severity: "HIGH",
        details: {
          subtype: "TECHMAP_CANONICAL_PARITY_BLOCKED",
          techMapId: "tm-20",
          runbookSuggestedAction: "REQUIRE_HUMAN_REVIEW",
        },
        createdAt: new Date("2026-04-01T12:20:00.000Z"),
      },
    ]);

    const result = await service.getGenerationRolloutReadiness("company-1");

    expect(result.verdict).toBe("BLOCKED");
    expect(result.canEnableCanonicalDefault).toBe(false);
    expect(result.suggestedMode).toBe("shadow");
    expect(result.releaseGates.parityBlockingClear).toBe(false);
    expect(result.releaseGates.noOpenParityIncidents).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("blocking parity gaps"),
      ]),
    );
  });

  it("getGenerationRolloutReadiness не блокирует canonical superiority и не считает historical legacy в coverage", async () => {
    prismaMock.techMap.findMany.mockResolvedValueOnce([
      {
        id: "tm-canary",
        status: "DRAFT",
        generationMetadata: {
          generationStrategy: "canonical_schema",
          schemaVersion: "1.0.0",
          ruleRegistryVersion: "1.1.0",
          ontologyVersion: "1.1.0",
          generationTraceId: "trace-canary",
          rolloutMode: "canonical",
          fallbackUsed: false,
          fallbackReason: null,
          featureFlagSnapshot: {
            mode: "canonical",
          },
          shadowParitySummary: {
            hasBlockingDiffs: true,
            diffCount: 2,
            severityCounts: {
              P0: 2,
              P1: 0,
              P2: 0,
            },
          },
          shadowParityReport: {
            authoritativeStrategy: "canonical_schema",
            referenceStrategy: "blueprint_fallback",
            diffs: [
              {
                code: "stage:soil_preparation",
                severity: "P0",
              },
              {
                code: "critical_op:winter_rapeseed_sowing",
                severity: "P0",
              },
            ],
          },
        },
        generationExplanationTrace: {
          id: "genexp-canary",
          traceId: "trace-canary",
          completenessScore: 1,
        },
        fieldAdmissionResult: {
          id: "adm-canary",
          verdict: "PASS",
        },
      },
      {
        id: "tm-legacy-1",
        status: "ACTIVE",
        generationMetadata: null,
        generationExplanationTrace: null,
        fieldAdmissionResult: null,
      },
      {
        id: "tm-legacy-2",
        status: "ARCHIVED",
        generationMetadata: null,
        generationExplanationTrace: null,
        fieldAdmissionResult: null,
      },
    ]);
    prismaMock.systemIncident.findMany.mockResolvedValueOnce([
      {
        id: "inc-techmap-stale",
        companyId: "company-1",
        traceId: "trace-canary",
        incidentType: SystemIncidentType.UNKNOWN,
        status: SystemIncidentStatus.OPEN,
        severity: "HIGH",
        details: {
          subtype: "TECHMAP_CANONICAL_PARITY_BLOCKED",
          techMapId: "tm-canary",
          runbookSuggestedAction: "REQUIRE_HUMAN_REVIEW",
        },
        createdAt: new Date("2026-04-01T12:25:00.000Z"),
      },
      {
        id: "inc-company-stale",
        companyId: "company-1",
        traceId: null,
        incidentType: SystemIncidentType.UNKNOWN,
        status: SystemIncidentStatus.OPEN,
        severity: "HIGH",
        details: {
          subtype: "TECHMAP_ROLLOUT_BLOCKING_PARITY",
          runbookSuggestedAction: "REQUIRE_HUMAN_REVIEW",
        },
        createdAt: new Date("2026-04-01T12:26:00.000Z"),
      },
    ]);

    const result = await service.getGenerationRolloutReadiness("company-1");

    expect(result.verdict).toBe("PASS");
    expect(result.canEnableCanonicalDefault).toBe(true);
    expect(result.summary.rolloutManagedMaps).toBe(1);
    expect(result.summary.legacyHistoricalMaps).toBe(2);
    expect(result.summary.parity.mapsWithBlockingDiffs).toBe(0);
    expect(result.summary.parity.blockingTechMapIds).toEqual([]);
    expect(result.summary.rolloutIncidents).toEqual([]);
    expect(result.releaseGates.versionPinningComplete).toBe(true);
    expect(result.releaseGates.explainabilityCoverageComplete).toBe(true);
    expect(result.releaseGates.admissionCoverageComplete).toBe(true);
    expect(result.releaseGates.noOpenParityIncidents).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.blockers).toEqual([]);
  });

  it("getGenerationRolloutCutoverPacket возвращает release и rollback команды", async () => {
    process.env.TECHMAP_RAPESEED_CANONICAL_MODE = "shadow";
    process.env.TECHMAP_RAPESEED_CANONICAL_COMPANIES = "company-0";

    prismaMock.techMap.findMany.mockResolvedValueOnce([
      {
        id: "tm-30",
        status: "DRAFT",
        generationMetadata: {
          generationStrategy: "canonical_schema",
          schemaVersion: "1.0.0",
          ruleRegistryVersion: "1.1.0",
          ontologyVersion: "1.1.0",
          generationTraceId: "trace-30",
          rolloutMode: "canonical",
          fallbackUsed: false,
          fallbackReason: null,
          featureFlagSnapshot: {
            mode: "canonical",
          },
          shadowParitySummary: {
            hasBlockingDiffs: false,
            diffCount: 0,
            severityCounts: {
              P0: 0,
              P1: 0,
              P2: 0,
            },
          },
        },
        generationExplanationTrace: {
          id: "genexp-30",
          traceId: "trace-30",
          completenessScore: 1,
        },
        fieldAdmissionResult: {
          id: "adm-30",
          verdict: "PASS",
        },
      },
    ]);
    prismaMock.systemIncident.findMany.mockResolvedValueOnce([]);
    prismaMock.techMap.findMany.mockResolvedValueOnce([
      {
        id: "tm-30",
        status: "DRAFT",
        generationMetadata: {
          generationStrategy: "canonical_schema",
          schemaVersion: "1.0.0",
          ruleRegistryVersion: "1.1.0",
          ontologyVersion: "1.1.0",
          generationTraceId: "trace-30",
          rolloutMode: "canonical",
          fallbackUsed: false,
          fallbackReason: null,
          featureFlagSnapshot: {
            mode: "canonical",
          },
          shadowParitySummary: {
            hasBlockingDiffs: false,
            diffCount: 0,
            severityCounts: {
              P0: 0,
              P1: 0,
              P2: 0,
            },
          },
        },
        generationExplanationTrace: {
          id: "genexp-30",
          traceId: "trace-30",
          completenessScore: 1,
        },
        fieldAdmissionResult: {
          id: "adm-30",
          verdict: "PASS",
        },
      },
    ]);
    prismaMock.systemIncident.findMany.mockResolvedValueOnce([]);

    const result = await service.getGenerationRolloutCutoverPacket("company-1");

    expect(result.canExecuteCutover).toBe(true);
    expect(result.recommendedFeatureFlags).toEqual({
      mode: "canonical",
      companyFilter: "company-0,company-1",
    });
    expect(result.releaseCommand).toContain(
      "TECHMAP_RAPESEED_CANONICAL_MODE=canonical",
    );
    expect(result.releaseCommand).toContain(
      "TECHMAP_RAPESEED_CANONICAL_COMPANIES=company-0,company-1",
    );
    expect(result.rollbackCommand).toContain(
      "TECHMAP_RAPESEED_CANONICAL_MODE=shadow",
    );
    expect(result.checklist.length).toBeGreaterThan(0);
    expect(result.rollbackChecklist.length).toBeGreaterThan(0);
  });
});
