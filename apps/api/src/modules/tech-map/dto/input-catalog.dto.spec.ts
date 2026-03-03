import {
  InputCatalogCreateDtoSchema,
  InputCatalogResponseDtoSchema,
} from "./input-catalog.dto";

describe("InputCatalog DTO", () => {
  it("принимает валидный payload", () => {
    const result = InputCatalogCreateDtoSchema.parse({
      name: "КАС-32",
      inputType: "FERTILIZER_LIQUID",
      formulation: "32-0-0",
      activeSubstances: ["N"],
      legalRestrictions: ["storage-license"],
    });

    expect(result.inputType).toBe("FERTILIZER_LIQUID");
  });

  it("отклоняет payload с пустым именем", () => {
    expect(() =>
      InputCatalogResponseDtoSchema.parse({
        id: "input-1",
        name: "",
        inputType: "SEED",
        createdAt: "2026-03-03T00:00:00.000Z",
        updatedAt: "2026-03-03T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
