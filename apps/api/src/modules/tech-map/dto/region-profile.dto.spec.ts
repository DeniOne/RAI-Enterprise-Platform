import {
  RegionProfileCreateDtoSchema,
  RegionProfileResponseDtoSchema,
} from "./region-profile.dto";

describe("RegionProfile DTO", () => {
  it("принимает валидный payload", () => {
    const result = RegionProfileCreateDtoSchema.parse({
      name: 'Юг 1',
      climateType: "STEPPE_DRY",
      gddBaseTempC: 5,
      avgGddSeason: 2450,
      frostRiskIndex: 0.3,
      droughtRiskIndex: 0.7,
      majorDiseases: ["phoma"],
    });

    expect(result.climateType).toBe("STEPPE_DRY");
  });

  it("отклоняет payload с risk index > 1", () => {
    expect(() =>
      RegionProfileResponseDtoSchema.parse({
        id: "region-1",
        name: 'Юг 1',
        climateType: "STEPPE_DRY",
        droughtRiskIndex: 1.2,
        createdAt: "2026-03-03T00:00:00.000Z",
        updatedAt: "2026-03-03T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
