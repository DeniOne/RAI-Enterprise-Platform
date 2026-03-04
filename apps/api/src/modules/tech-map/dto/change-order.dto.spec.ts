import {
  ChangeOrderCreateDtoSchema,
  ChangeOrderResponseDtoSchema,
} from "./change-order.dto";

describe("ChangeOrder DTO", () => {
  it("принимает валидный payload", () => {
    const result = ChangeOrderCreateDtoSchema.parse({
      versionFrom: 2,
      changeType: "CHANGE_RATE",
      reason: "Уточнение нормы",
      diffPayload: { before: { rate: 1.2 }, after: { rate: 1.3 } },
      deltaCostRub: 500,
    });

    expect(result.versionFrom).toBe(2);
  });

  it("отклоняет пустой reason", () => {
    expect(() =>
      ChangeOrderResponseDtoSchema.parse({
        id: "co-1",
        techMapId: "tm-1",
        versionFrom: 1,
        changeType: "SHIFT_DATE",
        reason: "",
        diffPayload: {},
        status: "DRAFT",
        companyId: "company-1",
        createdAt: "2026-03-03T10:00:00.000Z",
        updatedAt: "2026-03-03T10:00:00.000Z",
      }),
    ).toThrow();
  });
});
