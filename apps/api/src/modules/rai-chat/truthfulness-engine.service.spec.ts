import { Test, TestingModule } from "@nestjs/testing";
import { TruthfulnessEngineService } from "./truthfulness-engine.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("TruthfulnessEngineService", () => {
  let service: TruthfulnessEngineService;

  const prisma = {
    aiAuditEntry: {
      findMany: jest.fn(),
    },
    traceSummary: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        TruthfulnessEngineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = mod.get(TruthfulnessEngineService);
  });

  it("classifyBranchEvidence возвращает reusable классификацию для branch-level trust", () => {
    const classified = service.classifyBranchEvidence([
      {
        claim: "ROI по сценарию подтверждён.",
        sourceType: "TOOL_RESULT",
        sourceId: "simulate_scenario",
        confidenceScore: 0.9,
      },
      {
        claim: "Договор поставки требует уточнения.",
        sourceType: "DOC",
        sourceId: "contract-doc-1",
        confidenceScore: 0.4,
      },
    ]);

    expect(classified).toEqual([
      expect.objectContaining({
        taxonomy: "FINANCE",
        status: "VERIFIED",
        weight: 3,
      }),
      expect.objectContaining({
        taxonomy: "LEGAL",
        status: "UNVERIFIED",
        weight: 3,
      }),
    ]);
  });

  it("buildBranchTrustInputs можно использовать без full trace summary", () => {
    const inputs = service.buildBranchTrustInputs([
      {
        claim: "Норма высева рапса указана неверно.",
        sourceType: "TOOL_RESULT",
        sourceId: "compute_deviations",
        confidenceScore: 0.1,
      },
      {
        claim: "Финансовый анализ подтверждён детерминированным расчётом.",
        sourceType: "TOOL_RESULT",
        sourceId: "compute_plan_fact",
        confidenceScore: 0.92,
      },
    ]);

    expect(inputs.qualityStatus).toBe("READY");
    expect(inputs.accounting).toEqual({
      total: 2,
      evidenced: 2,
      verified: 1,
      unverified: 0,
      invalid: 1,
    });
    expect(inputs.recommendedVerdict).toBe("CONFLICTED");
    expect(inputs.requiresCrossCheck).toBe(true);
    expect(inputs.invalidClaimsPct).toBe(50);
    expect(inputs.reasons).toEqual(
      expect.arrayContaining([
        "invalid_evidence_present",
        "mixed_evidence_quality",
      ]),
    );
  });

  it("buildBranchTrustInputs без evidence возвращает pending reusable input", () => {
    const inputs = service.buildBranchTrustInputs([]);

    expect(inputs.qualityStatus).toBe("PENDING_EVIDENCE");
    expect(inputs.recommendedVerdict).toBe("UNVERIFIED");
    expect(inputs.requiresCrossCheck).toBe(true);
    expect(inputs.bsScorePct).toBeNull();
    expect(inputs.reasons).toEqual(["no_evidence"]);
  });

  it("100% verified evidence → возвращает объект с BS%=0, coverage=100", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([
      {
        metadata: {
          evidence: [
            {
              claim: "Финансовый анализ плана выполнен на основе детерминированных расчётов ComputePlanFact.",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_plan_fact",
              confidenceScore: 0.9,
            },
          ],
        },
      },
    ]);

    const result = await service.calculateTraceTruthfulness("tr1", "c1");

    expect(result.bsScorePct).toBe(0);
    expect(result.evidenceCoveragePct).toBe(100);
    expect(result.invalidClaimsPct).toBe(0);
    expect(result.accounting.total).toBe(1);
    expect(result.accounting.verified).toBe(1);
  });

  it("1 agro invalid (3) + 1 general verified (1) → возвращает BS%=75, coverage=100, invalidPct=50", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([
      {
        metadata: {
          evidence: [
            {
              claim: "Норма высева рапса указана неверно.",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_deviations",
              confidenceScore: 0.1, // INVALID (weight 3)
            },
            {
              claim: "Общее пояснение без домена.",
              sourceType: "DOC",
              sourceId: "doc1",
              confidenceScore: 0.9, // VERIFIED GENERAL (weight 1)
            },
          ],
        },
      },
    ]);

    const result = await service.calculateTraceTruthfulness("tr2", "c1");

    expect(result.bsScorePct).toBe(75);
    expect(result.evidenceCoveragePct).toBe(100);
    expect(result.invalidClaimsPct).toBe(50);
    expect(result.accounting.total).toBe(2);
    expect(result.accounting.invalid).toBe(1);
    expect(result.accounting.verified).toBe(1);
  });

  it("пустой трейс → возвращает pending quality вместо synthetic BS%", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([]);

    const result = await service.calculateTraceTruthfulness("tr3", "c1");

    expect(result.bsScorePct).toBeNull();
    expect(result.evidenceCoveragePct).toBeNull();
    expect(result.invalidClaimsPct).toBeNull();
    expect(result.qualityStatus).toBe("PENDING_EVIDENCE");
    expect(result.accounting.total).toBe(0);
  });

  it("есть трейс, но нет evidence → возвращает pending quality вместо fake 100", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([
      { metadata: {} },
    ]);

    const result = await service.calculateTraceTruthfulness("tr4", "c1");

    expect(result.bsScorePct).toBeNull();
    expect(result.evidenceCoveragePct).toBeNull();
    expect(result.invalidClaimsPct).toBeNull();
    expect(result.qualityStatus).toBe("PENDING_EVIDENCE");
    expect(result.accounting.total).toBe(0);
  });

  it("утверждение без sourceId (unverified) → coverage=0, bsScore=100", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([
      {
        metadata: {
          evidence: [
            {
              claim: "Я просто так сказал.",
              sourceType: "NONE",
              sourceId: "", // EMPTY
              confidenceScore: 1.0,
            },
          ],
        },
      },
    ]);

    const result = await service.calculateTraceTruthfulness("tr-unv", "c1");

    expect(result.bsScorePct).toBe(100);
    expect(result.evidenceCoveragePct).toBe(0);
    expect(result.qualityStatus).toBe("READY");
    expect(result.accounting.total).toBe(1);
    expect(result.accounting.evidenced).toBe(0);
    expect(result.accounting.unverified).toBe(1);
  });
});
