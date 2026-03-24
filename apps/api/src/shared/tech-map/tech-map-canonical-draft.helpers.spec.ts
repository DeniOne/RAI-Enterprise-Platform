import { TechMapStatus } from "@rai/prisma-client";
import {
  assertTechMapCanonicalDraftInvariants,
  buildTechMapCanonicalDraftFromTechMap,
} from "./tech-map-canonical-draft.helpers";

describe("tech-map-canonical-draft.helpers", () => {
  it("строит canonical draft из persisted TechMap shape", () => {
    const mapStub = {
      id: "techmap-1",
      companyId: "company-1",
      harvestPlanId: "plan-1",
      seasonId: "season-1",
      crop: "rapeseed",
      cropZoneId: "crop-zone-1",
      fieldId: "field-deprecated",
      version: 1,
      status: TechMapStatus.DRAFT,
      approvedAt: null,
      basePlanHash: null,
      generationMetadata: {
        source: "blueprint",
        blueprintVersion: "2026.03",
        hash: "hash-1",
      },
      generationRecordId: null,
      updatedAt: new Date("2026-03-22T10:00:00.000Z"),
      field: {
        id: "field-1",
        area: 50,
        clientId: "farm-1",
        protectedZoneFlags: { waterProtection: true },
      },
      season: {
        id: "season-1",
        farmId: "farm-1",
        expectedYield: 4.1,
        actualYield: null,
        cropVarietyId: "var-1",
      },
      harvestPlan: {
        accountId: "farm-account-1",
        minValue: 5000,
        optValue: 6500,
        maxValue: 9000,
        baselineValue: 6000,
        targetMetric: "YIELD_QPH",
        period: "SEASON_2026",
        performanceContract: {
          modelType: "FIXED",
        },
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
          clientId: "farm-1",
          protectedZoneFlags: { waterProtection: true },
        },
        season: {
          id: "season-1",
          farmId: "farm-1",
          expectedYield: 4.1,
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
              dependencies: [{ operationId: "op-0" }],
              isCritical: true,
              executionProtocol: null,
              evidenceRequired: null,
              plannedStartTime: new Date("2026-03-25T00:00:00.000Z"),
              plannedEndTime: new Date("2026-03-25T06:00:00.000Z"),
              durationHours: 6,
              requiredMachineryType: "SEEDER",
              evidence: [
                {
                  id: "evidence-1",
                },
              ],
              executionRecord: {
                id: "execution-1",
              },
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
            {
              id: "op-2",
              name: "Подготовка",
              operationType: "SOIL_PREP",
              bbchWindowFrom: null,
              bbchWindowTo: null,
              dateWindowStart: null,
              dateWindowEnd: null,
              weatherConstraints: null,
              dependencies: [],
              isCritical: false,
              executionProtocol: null,
              evidenceRequired: null,
              plannedStartTime: null,
              plannedEndTime: null,
              durationHours: 4,
              requiredMachineryType: "TRACTOR",
              evidence: [],
              executionRecord: null,
              resources: [],
            },
          ],
        },
      ],
    } as any;

    const draft = buildTechMapCanonicalDraftFromTechMap(mapStub);

    expect(draft.header.workflow_id).toBe("techmap:techmap-1:v1");
    expect(draft.header.methodology_profile_id).toBe("blueprint:2026.03");
    expect(draft.header.baseline_context_hash).toBe("hash-1");
    expect(draft.header.source_workflow_mode).toBe("new_draft");
    expect(draft.publication_state).toBe("GOVERNED_DRAFT");
    expect(draft.variants).toHaveLength(1);
    expect(draft.selected_variant_id).toBe(draft.variants[0].variant_id);
    expect(draft.variants[0].operations).toHaveLength(2);
    expect(draft.variants[0].operations[0]).toEqual(
      expect.objectContaining({
        operation_code: "SEEDING",
        publication_critical: true,
      }),
    );
    expect(draft.variants[0].input_plan[0]).toEqual(
      expect.objectContaining({
        category: "seed",
        allowed_by_catalog: true,
        operation_ref: "op-1",
      }),
    );
    expect(draft.variants[0].financial_summary).toEqual(
      expect.objectContaining({
        area_ha: 50,
        total_cost: 24000,
        cost_per_ha: 480,
      }),
    );
    expect(draft.approval_packet).toEqual(
      expect.objectContaining({
        draft_version_id: "techmap-1:v1",
      }),
    );
    expect(draft.audit_refs).toEqual(
      expect.arrayContaining(["techmap:techmap-1", "techmap:techmap-1:v1"]),
    );

    expect(() => assertTechMapCanonicalDraftInvariants(draft)).not.toThrow();
  });
});
