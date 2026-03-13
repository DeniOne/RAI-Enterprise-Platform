import {
  ApprovalCreateDtoSchema,
  ApprovalDecisionDtoSchema,
} from "../../../shared/tech-map/dto/approval.dto";

describe("Approval DTO", () => {
  it("принимает валидный payload", () => {
    const result = ApprovalCreateDtoSchema.parse({
      approverRole: "FINANCE",
      companyId: "company-1",
    });

    expect(result.approverRole).toBe("FINANCE");
  });

  it("отклоняет пустой approverUserId в decision dto", () => {
    expect(() =>
      ApprovalDecisionDtoSchema.parse({
        decision: "APPROVED",
        approverUserId: "",
      }),
    ).toThrow();
  });
});
