import {
  SoilProfileCreateDtoSchema,
  SoilProfileResponseDtoSchema,
} from "./soil-profile.dto";

describe("SoilProfile DTO", () => {
  it("принимает валидный payload", () => {
    const result = SoilProfileCreateDtoSchema.parse({
      fieldId: "field-1",
      sampleDate: "2026-03-03T00:00:00.000Z",
      ph: 6.4,
      humusPercent: 4.8,
      p2o5MgKg: 120,
      k2oMgKg: 210,
      sMgKg: 18,
      bMgKg: 1.1,
      bulkDensityGCm3: 1.2,
      granulometricType: "LOAM",
      confidence: 0.92,
      companyId: "company-1",
    });

    expect(result.ph).toBe(6.4);
    expect(result.sampleDate).toBeInstanceOf(Date);
  });

  it("отклоняет payload с pH вне диапазона", () => {
    expect(() =>
      SoilProfileResponseDtoSchema.parse({
        id: "soil-1",
        fieldId: "field-1",
        sampleDate: "2026-03-03T00:00:00.000Z",
        ph: 9.5,
        companyId: "company-1",
        createdAt: "2026-03-03T00:00:00.000Z",
        updatedAt: "2026-03-03T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
