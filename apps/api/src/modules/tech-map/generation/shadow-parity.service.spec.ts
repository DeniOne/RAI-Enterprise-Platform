import { ShadowParityService } from "./shadow-parity.service";

describe("ShadowParityService", () => {
  const service = new ShadowParityService();

  it("фиксирует semantic parity gaps, а не только структурные отличия", () => {
    const report = service.compare({
      canonical: {
        crop: "rapeseed",
        cropForm: "RAPESEED_WINTER",
        canonicalBranch: "winter_rapeseed",
        stages: [
          {
            code: "sowing",
            name: "Посев",
            sequence: 2,
            aplStageId: "04_SOWING",
            bbchScope: ["10", "12"],
            operations: [
              {
                code: "winter_rapeseed_sowing",
                name: "Посев озимого рапса",
                description: "Критичная операция посева.",
                operationType: "SEEDING",
                startOffsetDays: 7,
                durationHours: 8,
                isCritical: true,
                bbchWindowFrom: "10",
                bbchWindowTo: "12",
                resources: [
                  {
                    type: "SEED",
                    name: "Семена рапса",
                    amount: 5.2,
                    unit: "kg",
                  },
                ],
              },
            ],
          },
        ],
        controlPoints: [],
        monitoringSignals: [],
        attachedRules: [],
        attachedThresholds: [],
        mandatoryBlocks: ["seed_treatment"],
        recommendations: [],
        decisionGates: [],
        generationTraceId: "gen-trace-1",
        explainabilitySummary: {},
      },
      blueprint: {
        crop: "rapeseed",
        generationMetadata: {
          source: "deterministic-blueprint",
          blueprintVersion: "2026.03",
          generatedAt: "2026-04-01T00:00:00.000Z",
          crop: "rapeseed",
          targetYieldTHa: 4.2,
        },
        stages: [
          {
            name: "Подготовка и посев",
            sequence: 2,
            aplStageId: "04_SOWING",
            operations: [
              {
                name: "Посев озимого рапса",
                description: "Legacy операция.",
                startOffsetDays: 7,
                durationHours: 8,
                isCritical: true,
                resources: [],
              },
            ],
          },
        ],
      },
      authoritativeStrategy: "legacy_blueprint",
      referenceStrategy: "canonical_schema",
      legacyContext: {
        cropForm: "RAPESEED_SPRING",
        canonicalBranch: "spring_rapeseed",
      },
    });

    expect(report.hasBlockingDiffs).toBe(true);
    expect(report.diffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "crop_form_mismatch", severity: "P0" }),
        expect.objectContaining({
          code: "canonical_branch_mismatch",
          severity: "P0",
        }),
        expect.objectContaining({
          code: "mandatory_block:seed_treatment",
          severity: "P0",
        }),
        expect.objectContaining({
          code: "missing_control_points",
          severity: "P1",
        }),
        expect.objectContaining({
          code: "missing_monitoring_signals",
          severity: "P1",
        }),
        expect.objectContaining({
          code: "missing_rule_bindings",
          severity: "P1",
        }),
        expect.objectContaining({
          code: "missing_threshold_bindings",
          severity: "P1",
        }),
        expect.objectContaining({
          code: "resource:winter_rapeseed_sowing:SEED",
          severity: "P1",
        }),
        expect.objectContaining({
          code: "missing_explainability_summary",
          severity: "P1",
        }),
      ]),
    );
    expect(report.completeness.generationTracePresent).toBe(true);
    expect(report.completeness.explainabilitySummaryPresent).toBe(false);
    expect(report.completeness.resourceCoveragePresent).toBe(true);
  });

  it("не считает canonical superiority blocking parity при canonical authoritative path", () => {
    const report = service.compare({
      canonical: {
        crop: "rapeseed",
        cropForm: "RAPESEED_WINTER",
        canonicalBranch: "winter_rapeseed",
        stages: [
          {
            code: "soil_preparation",
            name: "Подготовка почвы",
            sequence: 1,
            aplStageId: "01_SOIL_PREP",
            bbchScope: null,
            operations: [],
          },
          {
            code: "sowing",
            name: "Посев",
            sequence: 2,
            aplStageId: "04_SOWING",
            bbchScope: ["10", "12"],
            operations: [
              {
                code: "winter_rapeseed_sowing",
                name: "Посев озимого рапса",
                description: "Критичная операция посева.",
                operationType: "SEEDING",
                startOffsetDays: 7,
                durationHours: 8,
                isCritical: true,
                bbchWindowFrom: "10",
                bbchWindowTo: "12",
                resources: [],
              },
            ],
          },
        ],
        controlPoints: [
          {
            name: "Контроль всходов",
            stageCode: "sowing",
            requiredObservations: ["plant_density"],
            severityOnFailure: "warning",
          },
        ],
        monitoringSignals: [
          {
            signalType: "NDVI_DROP",
            source: "satellite",
            thresholdLogic: "ndvi < 0.35",
            severity: "warning",
            resultingAction: "inspect_field",
          },
        ],
        attachedRules: [
          {
            ruleId: "R-001",
            layer: "rule_registry",
            type: "threshold",
            appliesTo: "stage",
            ref: "sowing",
          },
        ],
        attachedThresholds: [
          {
            thresholdId: "T-001",
            parameter: "plant_density",
            comparator: ">=",
            value: 35,
            ref: "sowing",
          },
        ],
        mandatoryBlocks: [],
        recommendations: [],
        decisionGates: [],
        generationTraceId: "gen-trace-2",
        explainabilitySummary: {
          branchSelectionReasons: ["winter-fit"],
        },
      },
      blueprint: {
        crop: "rapeseed",
        generationMetadata: {
          source: "deterministic-blueprint",
          blueprintVersion: "2026.03",
          generatedAt: "2026-04-01T00:00:00.000Z",
          crop: "rapeseed",
          targetYieldTHa: 4.2,
        },
        stages: [
          {
            name: "Подготовка и посев",
            sequence: 2,
            aplStageId: "04_SOWING",
            operations: [],
          },
        ],
      },
      authoritativeStrategy: "canonical_schema",
      referenceStrategy: "blueprint_fallback",
      legacyContext: {
        cropForm: "RAPESEED_WINTER",
        canonicalBranch: "winter_rapeseed",
      },
    });

    expect(report.hasBlockingDiffs).toBe(false);
    expect(report.diffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "stage:soil_preparation",
          severity: "P1",
        }),
        expect.objectContaining({
          code: "critical_op:winter_rapeseed_sowing",
          severity: "P1",
        }),
      ]),
    );
    expect(report.diffs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "stage:soil_preparation",
          severity: "P0",
        }),
      ]),
    );
  });
});
