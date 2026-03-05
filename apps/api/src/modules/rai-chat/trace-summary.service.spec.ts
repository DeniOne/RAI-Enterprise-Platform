import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TraceSummaryService } from "./trace-summary.service";

describe("TraceSummaryService", () => {
  let service: TraceSummaryService;
  const prisma = {
    traceSummary: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        TraceSummaryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = mod.get(TraceSummaryService);
  });

  it("record вызывает prisma.traceSummary.upsert с traceId и companyId", async () => {
    prisma.traceSummary.upsert.mockResolvedValue({ id: "ts1" });

    await service.record({
      traceId: "tr_1",
      companyId: "c_1",
      totalTokens: 100,
      promptTokens: 60,
      completionTokens: 40,
      durationMs: 500,
      modelId: "gpt-4o",
      promptVersion: "pv1",
      toolsVersion: "tv1",
      policyId: "default",
      evidenceCoveragePct: 80,
      invalidClaimsPct: 5,
      bsScorePct: 10,
    });

    expect(prisma.traceSummary.upsert).toHaveBeenCalledWith({
      where: {
        trace_summary_trace_company_unique: { traceId: "tr_1", companyId: "c_1" },
      },
      create: {
        traceId: "tr_1",
        companyId: "c_1",
        totalTokens: 100,
        promptTokens: 60,
        completionTokens: 40,
        durationMs: 500,
        modelId: "gpt-4o",
        promptVersion: "pv1",
        toolsVersion: "tv1",
        policyId: "default",
        evidenceCoveragePct: 80,
        invalidClaimsPct: 5,
        bsScorePct: 10,
      },
      update: {
        totalTokens: 100,
        promptTokens: 60,
        completionTokens: 40,
        durationMs: 500,
        modelId: "gpt-4o",
        promptVersion: "pv1",
        toolsVersion: "tv1",
        policyId: "default",
        evidenceCoveragePct: 80,
        invalidClaimsPct: 5,
        bsScorePct: 10,
      },
    });
  });

  it("record задаёт плейсхолдеры 0 для метрик качества по умолчанию", async () => {
    prisma.traceSummary.upsert.mockResolvedValue({ id: "ts1" });

    await service.record({
      traceId: "tr_2",
      companyId: "c_2",
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      durationMs: 10,
      modelId: "deterministic",
      promptVersion: "v1",
      toolsVersion: "v1",
      policyId: "default",
    });

    expect(prisma.traceSummary.upsert).toHaveBeenCalledWith({
      where: {
        trace_summary_trace_company_unique: { traceId: "tr_2", companyId: "c_2" },
      },
      create: {
        traceId: "tr_2",
        companyId: "c_2",
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        durationMs: 10,
        modelId: "deterministic",
        promptVersion: "v1",
        toolsVersion: "v1",
        policyId: "default",
        evidenceCoveragePct: 0,
        invalidClaimsPct: 0,
        bsScorePct: 0,
      },
      update: {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        durationMs: 10,
        modelId: "deterministic",
        promptVersion: "v1",
        toolsVersion: "v1",
        policyId: "default",
        evidenceCoveragePct: 0,
        invalidClaimsPct: 0,
        bsScorePct: 0,
      },
    });
  });
});

