import { FieldAdmissionService } from "./field-admission.service";

describe("FieldAdmissionService", () => {
  const service = new FieldAdmissionService();

  it("блокирует генерацию при pH ниже 5.5", () => {
    const result = service.evaluate({
      cropZone: {
        assumptions: { rotationYearsSinceRapeseed: 5 },
        constraints: { clubrootHistory: false },
        predecessorCrop: "wheat",
      } as any,
      season: {} as any,
      soilProfile: {
        ph: 5.2,
        sMgKg: 10,
        bMgKg: 0.8,
      } as any,
      regionProfile: {
        satAvg: 2400,
      } as any,
      cropForm: "RAPESEED_WINTER",
    });

    expect(result.isBlocking).toBe(true);
    expect(result.blockers.map((item) => item.ruleId)).toContain("R-ADM-001");
    expect(result.verdict).toBe("FAIL");
  });

  it("оставляет HARD_REQUIREMENT в report-only для неполных данных", () => {
    const result = service.evaluate({
      cropZone: {
        assumptions: {},
        constraints: {},
        predecessorCrop: "wheat",
      } as any,
      season: {} as any,
      soilProfile: {
        ph: 6.2,
      } as any,
      regionProfile: null,
      cropForm: "RAPESEED_SPRING",
    });

    expect(result.isBlocking).toBe(false);
    expect(result.requirements.length).toBeGreaterThan(0);
    expect(result.rolloutPolicy.hardRequirement).toBe("report_only");
  });
});
