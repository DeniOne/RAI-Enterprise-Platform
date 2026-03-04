import {
  BudgetLineCreateDtoSchema,
  BudgetLineResponseDtoSchema,
} from "./budget-line.dto";

describe("BudgetLine DTO", () => {
  it("принимает валидный payload и подставляет tolerancePct по умолчанию", () => {
    const result = BudgetLineCreateDtoSchema.parse({
      category: "SEEDS",
      plannedCost: 1500,
      actualCost: 1400,
    });

    expect(result.tolerancePct).toBe(0.1);
  });

  it("отклоняет отрицательный actualCost", () => {
    expect(() =>
      BudgetLineResponseDtoSchema.parse({
        id: "cm8budgetline0000000000000000",
        techMapId: "cm8techmap0000000000000000",
        category: "FUEL",
        plannedCost: 900,
        actualCost: -1,
        companyId: "company-1",
        createdAt: "2026-03-04T10:00:00.000Z",
        updatedAt: "2026-03-04T10:00:00.000Z",
      }),
    ).toThrow();
  });
});
