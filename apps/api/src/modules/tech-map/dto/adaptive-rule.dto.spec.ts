import {
  AdaptiveRuleCreateDtoSchema,
  AdaptiveRuleResponseDtoSchema,
} from "./adaptive-rule.dto";

describe("AdaptiveRule DTO", () => {
  it("принимает валидный payload", () => {
    const result = AdaptiveRuleCreateDtoSchema.parse({
      techMapId: "cmfcz11111111111111111111",
      name: "Осадки ниже нормы",
      triggerType: "WEATHER",
      condition: {
        parameter: "weatherPrecipMm",
        operator: "LT",
        threshold: 10,
        unit: "mm",
      },
      affectedOperationIds: ["cmfcz22222222222222222222"],
      changeTemplate: {
        changeType: "SHIFT_DATE",
        reasonTemplate: "Осадки ниже порога",
      },
    });

    expect(result.condition.operator).toBe("LT");
  });

  it("отклоняет невалидный operator", () => {
    expect(() =>
      AdaptiveRuleResponseDtoSchema.parse({
        id: "cmfcz33333333333333333333",
        techMapId: "cmfcz11111111111111111111",
        name: "Осадки ниже нормы",
        triggerType: "WEATHER",
        condition: {
          parameter: "weatherPrecipMm",
          operator: "INVALID",
          threshold: 10,
        },
        affectedOperationIds: ["cmfcz22222222222222222222"],
        changeTemplate: {
          changeType: "SHIFT_DATE",
        },
        companyId: "company-1",
        createdAt: "2026-03-04T10:00:00.000Z",
        updatedAt: "2026-03-04T10:00:00.000Z",
      }),
    ).toThrow();
  });
});
