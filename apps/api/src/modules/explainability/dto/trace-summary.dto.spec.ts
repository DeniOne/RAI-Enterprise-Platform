import { TraceSummaryDtoSchema } from "./trace-summary.dto";

describe("TraceSummaryDtoSchema", () => {
  it("валидирует корректный объект", () => {
    const now = new Date();
    const result = TraceSummaryDtoSchema.safeParse({
      id: "ts_1",
      traceId: "tr_1",
      companyId: "c_1",
      totalTokens: 100,
      promptTokens: 60,
      completionTokens: 40,
      durationMs: 1234,
      modelId: "gpt-4o",
      promptVersion: "pv1",
      toolsVersion: "tv1",
      policyId: "default",
      evidenceCoveragePct: 80,
      invalidClaimsPct: 5,
      bsScorePct: 10,
      createdAt: now,
    });

    expect(result.success).toBe(true);
  });

  it("не пропускает bsScorePct > 100", () => {
    const result = TraceSummaryDtoSchema.safeParse({
      id: "ts_1",
      traceId: "tr_1",
      companyId: "c_1",
      totalTokens: 100,
      promptTokens: 60,
      completionTokens: 40,
      durationMs: 1234,
      modelId: "gpt-4o",
      promptVersion: "pv1",
      toolsVersion: "tv1",
      policyId: "default",
      evidenceCoveragePct: 80,
      invalidClaimsPct: 5,
      bsScorePct: 110,
      createdAt: new Date(),
    });

    expect(result.success).toBe(false);
  });

  it("требует companyId", () => {
    const result = TraceSummaryDtoSchema.safeParse({
      id: "ts_1",
      traceId: "tr_1",
      totalTokens: 100,
      promptTokens: 60,
      completionTokens: 40,
      durationMs: 1234,
      modelId: "gpt-4o",
      promptVersion: "pv1",
      toolsVersion: "tv1",
      policyId: "default",
      evidenceCoveragePct: 80,
      invalidClaimsPct: 5,
      bsScorePct: 10,
      createdAt: new Date(),
    });

    expect(result.success).toBe(false);
  });
});

