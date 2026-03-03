import {
  CropZoneCreateDtoSchema,
  CropZoneResponseDtoSchema,
} from "./crop-zone.dto";

describe("CropZone DTO", () => {
  it("принимает валидный payload", () => {
    const result = CropZoneCreateDtoSchema.parse({
      fieldId: "field-1",
      seasonId: "season-1",
      cropType: "RAPE_WINTER",
      targetYieldTHa: 4.2,
      assumptions: ["stable-moisture"],
      confidence: 0.88,
      companyId: "company-1",
    });

    expect(result.targetYieldTHa).toBe(4.2);
  });

  it("отклоняет payload с confidence вне диапазона", () => {
    expect(() =>
      CropZoneResponseDtoSchema.parse({
        id: "zone-1",
        fieldId: "field-1",
        seasonId: "season-1",
        cropType: "RAPE_WINTER",
        confidence: 1.5,
        companyId: "company-1",
        createdAt: "2026-03-03T00:00:00.000Z",
        updatedAt: "2026-03-03T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
