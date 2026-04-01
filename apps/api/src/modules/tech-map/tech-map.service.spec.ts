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

describe("TechMapService", () => {
  let service: TechMapService;
  const prismaMock: any = {
    techMap: {
      findFirst: jest.fn(),
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
});
