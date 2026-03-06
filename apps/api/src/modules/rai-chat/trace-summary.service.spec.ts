import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TraceSummaryService } from "./trace-summary.service";

describe("TraceSummaryService", () => {
  let service: TraceSummaryService;
  const prisma = {
    traceSummary: {
      upsert: jest.fn(),
      update: jest.fn(),
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

  it("record пишет execution-поля без quality-нулей", async () => {
    prisma.traceSummary.upsert.mockResolvedValue({ id: "ts1" });

    await service.record({
      traceId: "tr_1",
      companyId: "c_1",
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      durationMs: 500,
      modelId: "deterministic",
      promptVersion: "v1",
      toolsVersion: "v1",
      policyId: "default",
    });

    const call = prisma.traceSummary.upsert.mock.calls[0][0];
    // Execution-поля должны быть в create/update
    expect(call.create).toMatchObject({
      traceId: "tr_1",
      companyId: "c_1",
      durationMs: 500,
      modelId: "deterministic",
      toolsVersion: "v1",
      policyId: "default",
    });
    expect(call.update).toMatchObject({
      durationMs: 500,
      modelId: "deterministic",
      toolsVersion: "v1",
      policyId: "default",
    });
    // Quality-поля НЕ должны быть явно записаны (они sentinel из Prisma schema)
    expect(call.create).not.toHaveProperty("bsScorePct");
    expect(call.create).not.toHaveProperty("evidenceCoveragePct");
    expect(call.create).not.toHaveProperty("invalidClaimsPct");
    expect(call.update).not.toHaveProperty("bsScorePct");
    expect(call.update).not.toHaveProperty("evidenceCoveragePct");
    expect(call.update).not.toHaveProperty("invalidClaimsPct");
  });

  it("record не перезаписывает quality-поля при повторном вызове (replay)", async () => {
    prisma.traceSummary.upsert.mockResolvedValue({ id: "ts2" });

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

    const call = prisma.traceSummary.upsert.mock.calls[0][0];
    expect(call.update).not.toHaveProperty("bsScorePct");
    expect(call.update).not.toHaveProperty("evidenceCoveragePct");
  });

  it("updateQuality пишет bsScorePct + evidenceCoveragePct + invalidClaimsPct", async () => {
    prisma.traceSummary.update.mockResolvedValue({ id: "ts-q1" });

    await service.updateQuality({
      traceId: "tr_q",
      companyId: "c_q",
      bsScorePct: 25,
      evidenceCoveragePct: 80,
      invalidClaimsPct: 10,
    });

    expect(prisma.traceSummary.update).toHaveBeenCalledWith({
      where: {
        trace_summary_trace_company_unique: { traceId: "tr_q", companyId: "c_q" },
      },
      data: {
        bsScorePct: 25,
        evidenceCoveragePct: 80,
        invalidClaimsPct: 10,
      },
    });
  });

  it("updateQuality не затрагивает upsert", async () => {
    prisma.traceSummary.update.mockResolvedValue({ id: "ts-q2" });

    await service.updateQuality({
      traceId: "tr_q2",
      companyId: "c_q2",
      bsScorePct: 0,
      evidenceCoveragePct: 100,
      invalidClaimsPct: 0,
    });

    expect(prisma.traceSummary.upsert).not.toHaveBeenCalled();
  });
});

