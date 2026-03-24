import { TechMapStatus } from "@rai/prisma-client";
import {
  buildTechMapCanonicalDraftFromTechMap,
} from "./tech-map-canonical-draft.helpers";
import {
  buildTechMapRuntimeAdoptionSnapshot,
} from "./tech-map-runtime-adoption.helpers";

function createTechMapStub() {
  return {
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
      updatedAt: new Date("2026-03-21T10:00:00.000Z"),
    },
    harvestPlan: {
      accountId: "farm-account-1",
      minValue: 5000,
      optValue: 6500,
      maxValue: 9000,
      baselineValue: 6000,
      targetMetric: "YIELD_QPH",
      period: "SEASON_2026",
      updatedAt: new Date("2026-03-20T10:00:00.000Z"),
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
      updatedAt: new Date("2026-03-19T10:00:00.000Z"),
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
}

describe("tech-map-runtime-adoption.helpers", () => {
  it("собирает runtime adoption snapshot с authority resolution и workflow verdict", () => {
    const map = createTechMapStub();
    const canonicalDraft = buildTechMapCanonicalDraftFromTechMap(map);
    const snapshot = buildTechMapRuntimeAdoptionSnapshot(map, canonicalDraft);

    expect(snapshot.workflow_id).toBe(canonicalDraft.header.workflow_id);
    expect(snapshot.branch_results).toHaveLength(4);
    expect(snapshot.branch_trust_assessments).toHaveLength(4);
    expect(snapshot.source_authority_resolutions).toHaveLength(4);
    expect(snapshot.conflict_records.length).toBeGreaterThan(0);
    expect(snapshot.source_authority_resolutions[1].winner?.source_ref).toBe(
      "crop-zone:crop-zone-1:target-yield",
    );
    expect(snapshot.workflow_verdict).toBe("BLOCKED");
    expect(snapshot.expert_review?.verdict).toBe("BLOCK");
    expect(snapshot.expert_review?.trigger).toBe("dispute_trigger");
    expect(snapshot.expert_review?.publication_packet_ref).toContain(
      "publication-packet",
    );
    expect(snapshot.expert_review?.human_authority_chain[1]?.status).toBe(
      "pending",
    );
    expect(snapshot.composition.overall_verdict).toBe("BLOCKED");
    expect(snapshot.composition.facts).toHaveLength(0);
    expect(snapshot.trust_specialization?.blocked_branch_ids).toHaveLength(4);
    expect(snapshot.trust_specialization?.composition_gate.can_compose).toBe(
      false,
    );
    expect(snapshot.composition.next_actions[0]?.kind).toBe("next_action");
  });
});
