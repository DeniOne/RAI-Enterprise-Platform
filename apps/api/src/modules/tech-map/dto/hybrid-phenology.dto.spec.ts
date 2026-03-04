import { HybridPhenologyCreateDtoSchema } from "./hybrid-phenology.dto";

describe("HybridPhenology DTO", () => {
  it("принимает валидный payload", () => {
    const result = HybridPhenologyCreateDtoSchema.parse({
      hybridName: "PX128",
      cropType: "RAPESEED",
      gddToStage: {
        BBCH_00: 0,
        BBCH_09: 80,
        BBCH_51: 600,
      },
      baseTemp: 5,
    });

    expect(result.gddToStage.BBCH_51).toBe(600);
  });

  it("отклоняет отрицательный GDD", () => {
    expect(() =>
      HybridPhenologyCreateDtoSchema.parse({
        hybridName: "PX128",
        cropType: "RAPESEED",
        gddToStage: {
          BBCH_00: -1,
        },
        baseTemp: 5,
      }),
    ).toThrow();
  });
});
