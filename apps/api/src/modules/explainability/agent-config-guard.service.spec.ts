import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import { GoldenTestRunnerService } from "../rai-chat/eval/golden-test-runner.service";
import { RaiToolName } from "../rai-chat/tools/rai-tools.types";

describe("AgentConfigGuardService", () => {
  let service: AgentConfigGuardService;
  let prisma: PrismaService;
  const goldenTestRunner = {
    loadGoldenSet: jest.fn(),
    runEval: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentConfigGuardService,
        { provide: GoldenTestRunnerService, useValue: goldenTestRunner },
        {
          provide: PrismaService,
          useValue: {
            modelVersion: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
            evalRun: {
              create: jest.fn().mockResolvedValue({ id: "eval-1" }),
            },
          },
        },
      ],
    }).compile();

    service = module.get(AgentConfigGuardService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("evaluateChange пишет candidate-specific EvalRun evidence", async () => {
    goldenTestRunner.loadGoldenSet.mockReturnValue([
      {
        id: "econ-1",
        requestText: "plan fact",
        expectedIntent: "compute_plan_fact",
        expectedToolCalls: ["compute_plan_fact"],
      },
    ]);
    goldenTestRunner.runEval.mockReturnValue({
      id: "eval-1",
      timestamp: new Date("2026-03-07T00:00:00.000Z"),
      role: "economist",
      agentName: "EconomistAgent",
      promptVersion: "prompt-v3",
      modelName: "gpt-4o-mini",
      corpusSummary: {
        totalCases: 1,
        executableCases: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        coveragePct: 1,
        regressions: [],
      },
      caseResults: [
        {
          caseId: "econ-1",
          status: "passed",
          reasons: [],
          expectedIntent: "compute_plan_fact",
          expectedTools: ["compute_plan_fact"],
        },
      ],
      verdict: "APPROVED",
      verdictBasis: {
        failedCaseIds: [],
        skippedCaseIds: [],
        coveragePct: 1,
        executableCases: 1,
        policy: "APPROVED",
      },
    });

    const result = await service.evaluateChange("company-1", {
      name: "Economist",
      role: "economist",
      systemPrompt: "prompt-v3",
      llmModel: "gpt-4o-mini",
      maxTokens: 8000,
      isActive: true,
      capabilities: ["FinanceToolsRegistry"],
      tools: [RaiToolName.ComputePlanFact],
    });

    expect(result?.verdict).toBe("APPROVED");
    expect(prisma.evalRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "eval-1",
        companyId: "company-1",
        role: "economist",
        promptVersion: "prompt-v3",
        modelName: "gpt-4o-mini",
        verdict: "APPROVED",
      }),
    });
  });

  it("assertUpsertAllowed не маскирует degraded eval под success path", async () => {
    goldenTestRunner.loadGoldenSet.mockReturnValue([
      {
        id: "ag-1",
        requestText: "agro",
        expectedIntent: "compute_deviations",
        expectedToolCalls: ["compute_deviations"],
      },
    ]);
    goldenTestRunner.runEval.mockReturnValue({
      id: "eval-2",
      timestamp: new Date("2026-03-07T00:00:00.000Z"),
      role: "agronomist",
      agentName: "AgronomAgent",
      promptVersion: "prompt-v2",
      modelName: "gpt-4o",
      corpusSummary: {
        totalCases: 2,
        executableCases: 1,
        passed: 1,
        failed: 0,
        skipped: 1,
        coveragePct: 0.5,
        regressions: [],
      },
      caseResults: [],
      verdict: "REVIEW_REQUIRED",
      verdictBasis: {
        failedCaseIds: [],
        skippedCaseIds: ["ag-2"],
        coveragePct: 0.5,
        executableCases: 1,
        policy: "REVIEW_ON_DEGRADED_COVERAGE",
      },
    });

    await expect(
      service.assertUpsertAllowed("company-1", {
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "prompt-v2",
        llmModel: "gpt-4o",
        maxTokens: 16000,
        isActive: true,
        capabilities: ["AgroToolsRegistry"],
        tools: [RaiToolName.ComputeDeviations],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
