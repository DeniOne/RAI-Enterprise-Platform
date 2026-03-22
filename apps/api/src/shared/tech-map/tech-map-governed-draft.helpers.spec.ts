import { assessTechMapGovernedDraftContext } from "./tech-map-governed-draft.helpers";

describe("tech-map-governed-draft.helpers", () => {
  it("останавливается на S1 и требует clarify по S2 blocking slots", () => {
    const result = assessTechMapGovernedDraftContext({
      legalEntityId: "company-1",
      farmId: "farm-1",
      fieldIds: ["field-1"],
      seasonId: "season-1",
      cropCode: "rapeseed",
      hasFieldHistory: false,
      hasMachineryProfile: false,
      hasLaborOrContractorProfile: false,
      hasInputAvailability: false,
      hasBudgetPolicy: true,
      hasPriceBookVersion: false,
      hasCurrencyTaxMode: false,
      hasWeatherNormals: false,
      hasForecastWindow: false,
      hasIrrigationOrWaterConstraints: false,
      hasPreviousTechMap: false,
      hasExecutionHistory: false,
      hasPastOutcomes: false,
      methodologyProfileId: null,
      hasAllowedInputCatalogVersion: false,
      contractMode: null,
      hasTargetKpiPolicy: false,
    });

    expect(result.readiness).toBe("S1_SCOPED");
    expect(result.nextReadinessTarget).toBe("S2_MINIMUM_COMPUTABLE");
    expect(result.workflowVerdict).toBe("BLOCKED");
    expect(result.missingMust).toEqual(
      expect.arrayContaining([
        "predecessor_crop",
        "soil_profile",
        "methodology_profile_id",
      ]),
    );
  });

  it("доходит до S2 при наличии minimum computable basis", () => {
    const result = assessTechMapGovernedDraftContext({
      legalEntityId: "company-1",
      farmId: "farm-1",
      fieldIds: ["field-1"],
      seasonId: "season-1",
      cropCode: "rapeseed",
      predecessorCrop: "wheat",
      soilProfileSampleDate: "2026-03-10T00:00:00.000Z",
      targetYieldProfile: 3.8,
      hasFieldHistory: false,
      seedOrHybrid: "hybrid-a",
      hasMachineryProfile: false,
      hasLaborOrContractorProfile: false,
      hasInputAvailability: false,
      hasBudgetPolicy: true,
      hasPriceBookVersion: false,
      hasCurrencyTaxMode: false,
      hasWeatherNormals: true,
      hasForecastWindow: false,
      hasIrrigationOrWaterConstraints: false,
      hasPreviousTechMap: true,
      hasExecutionHistory: true,
      hasPastOutcomes: false,
      methodologyProfileId: "deterministic-blueprint:2026.03",
      hasAllowedInputCatalogVersion: false,
      contractMode: null,
      hasTargetKpiPolicy: false,
    });

    expect(result.readiness).toBe("S2_MINIMUM_COMPUTABLE");
    expect(result.nextReadinessTarget).toBe("S3_DRAFT_READY");
    expect(result.workflowVerdict).toBe("PARTIAL");
    expect(result.missingMust).toEqual(
      expect.arrayContaining([
        "field_history",
        "machinery_profile",
        "input_availability",
      ]),
    );
  });

  it("не понижает draft до BLOCKED, когда остались только review-critical gaps", () => {
    const result = assessTechMapGovernedDraftContext({
      legalEntityId: "company-1",
      farmId: "farm-1",
      fieldIds: ["field-1"],
      seasonId: "season-1",
      cropCode: "rapeseed",
      predecessorCrop: "wheat",
      soilProfileSampleDate: "2026-03-10T00:00:00.000Z",
      targetYieldProfile: 4.1,
      hasFieldHistory: true,
      seedOrHybrid: "hybrid-a",
      hasMachineryProfile: true,
      hasLaborOrContractorProfile: true,
      hasInputAvailability: true,
      hasBudgetPolicy: true,
      hasPriceBookVersion: true,
      hasCurrencyTaxMode: true,
      hasWeatherNormals: true,
      hasForecastWindow: true,
      hasIrrigationOrWaterConstraints: true,
      hasPreviousTechMap: true,
      hasExecutionHistory: true,
      hasPastOutcomes: true,
      methodologyProfileId: "deterministic-blueprint:2026.03",
      hasAllowedInputCatalogVersion: true,
      contractMode: null,
      hasTargetKpiPolicy: false,
    });

    expect(result.readiness).toBe("S3_DRAFT_READY");
    expect(result.workflowVerdict).toBe("PARTIAL");
    expect(result.publicationState).toBe("GOVERNED_DRAFT");
    expect(result.tasks).toEqual(
      expect.arrayContaining([
        expect.stringContaining("S4_REVIEW_READY"),
      ]),
    );
  });
});
