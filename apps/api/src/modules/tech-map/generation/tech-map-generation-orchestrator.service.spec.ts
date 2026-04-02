import { BranchSelectionService } from "./branch-selection.service";
import { FieldAdmissionService } from "./field-admission.service";
import { SchemaDrivenTechMapGenerator } from "./schema-driven-tech-map-generator.service";
import { ShadowParityService } from "./shadow-parity.service";
import { TechMapGenerationOrchestratorService } from "./tech-map-generation-orchestrator.service";

describe("TechMapGenerationOrchestratorService", () => {
  const service = new TechMapGenerationOrchestratorService(
    new FieldAdmissionService(),
    new BranchSelectionService(),
    new SchemaDrivenTechMapGenerator(),
    new ShadowParityService(),
  );

  it("в shadow-режиме оставляет legacy path авторитетным, но пишет canonical metadata", () => {
    process.env.TECHMAP_RAPESEED_CANONICAL_MODE = "shadow";

    const result = service.orchestrate({
      cropType: "RAPESEED" as any,
      cropZone: {
        cropType: "RAPESEED",
        cropForm: "RAPESEED_WINTER",
        targetYieldTHa: 4.2,
        predecessorCrop: "wheat",
        assumptions: { rotationYearsSinceRapeseed: 5 },
        constraints: { clubrootHistory: false },
        companyId: "company-1",
      } as any,
      season: {
        year: 2026,
        startDate: new Date("2026-08-15T00:00:00.000Z"),
      } as any,
      soilProfile: {
        ph: 6.3,
        sMgKg: 12,
        bMgKg: 0.7,
      } as any,
      regionProfile: {
        satAvg: 2400,
        winterType: "stable",
      } as any,
    });

    expect(result.generationStrategy).toBe("legacy_blueprint");
    expect(result.cropForm).toBe("RAPESEED_WINTER");
    expect(result.generationMetadata.schemaVersion).toBe("1.0.0");
    expect((result.generationMetadata.featureFlagSnapshot as any)?.mode).toBe("shadow");
    expect((result.generationMetadata as any).fallbackUsed).toBe(true);
    expect((result.generationMetadata as any).fallbackReason).toBe(
      "shadow_authoritative_legacy",
    );
    expect((result.generationMetadata as any).shadowParitySummary).toEqual(
      expect.objectContaining({
        diffCount: expect.any(Number),
        severityCounts: expect.objectContaining({
          P0: expect.any(Number),
          P1: expect.any(Number),
          P2: expect.any(Number),
        }),
      }),
    );
    expect(result.shadowParityReport).toBeTruthy();
  });
});
