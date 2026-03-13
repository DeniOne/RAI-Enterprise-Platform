import { Test, TestingModule } from "@nestjs/testing";
import {
  AgentCanaryStatus,
  AgentConfigChangeStatus,
  AgentProductionDecision,
  AgentRollbackStatus,
} from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { CanaryService } from "../adaptive-learning/services/canary.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import { AgentPromptGovernanceService } from "./agent-prompt-governance.service";
import { IncidentOpsService } from "../rai-chat/incident-ops.service";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";

describe("AgentPromptGovernanceService", () => {
  let service: AgentPromptGovernanceService;
  let prisma: PrismaService;
  const companyId = "company-1";
  const dto = {
    name: "Agronom",
    role: "agronomist" as const,
    systemPrompt: "Prompt v2",
    llmModel: "gpt-4o",
    maxTokens: 16000,
    isActive: true,
    capabilities: ["AgroToolsRegistry"],
    tools: [RaiToolName.GenerateTechMapDraft],
  };

  const configGuard = {
    evaluateChange: jest.fn(),
  };
  const agentManagement = {
    getStoredConfigSnapshot: jest.fn(),
    applyPromotedAgentConfig: jest.fn(),
    restoreStoredConfigSnapshot: jest.fn(),
  };
  const canaryService = {
    evaluateRejectionRateCanary: jest.fn(),
  };
  const incidentOps = {
    logIncident: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentPromptGovernanceService,
        { provide: AgentConfigGuardService, useValue: configGuard },
        { provide: AgentManagementService, useValue: agentManagement },
        { provide: CanaryService, useValue: canaryService },
        { provide: IncidentOpsService, useValue: incidentOps },
        {
          provide: PrismaService,
          useValue: {
            agentConfigChangeRequest: {
              upsert: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: "audit-1" }),
            },
            modelVersion: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            evalRun: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get(AgentPromptGovernanceService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("change без approved eval блокируется на уровне workflow status", async () => {
    configGuard.evaluateChange.mockResolvedValue({
      id: "eval-1",
      verdict: "ROLLBACK",
    });
    agentManagement.getStoredConfigSnapshot.mockResolvedValue(null);
    (prisma.agentConfigChangeRequest.upsert as jest.Mock).mockResolvedValue({
      id: "change-1",
      companyId,
      role: "agronomist",
      scope: "TENANT",
      targetVersion: "v1",
      requestedConfig: dto,
      previousConfig: null,
      status: AgentConfigChangeStatus.EVAL_FAILED,
      evalVerdict: "ROLLBACK",
      canaryStatus: AgentCanaryStatus.NOT_STARTED,
      rollbackStatus: AgentRollbackStatus.NOT_REQUIRED,
      productionDecision: AgentProductionDecision.REJECTED,
      evalRunId: "eval-1",
      promotedAt: null,
      rolledBackAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createChangeRequest(companyId, dto, "tenant");

    expect(result.status).toBe("EVAL_FAILED");
    expect(result.productionDecision).toBe("REJECTED");
    expect(prisma.evalRun.updateMany).toHaveBeenCalledWith({
      where: { id: "eval-1", companyId, changeRequestId: null },
      data: { changeRequestId: "change-1" },
    });
  });

  it("future adapter-bound role enters canary path with eval evidence", async () => {
    configGuard.evaluateChange.mockResolvedValue({
      id: "eval-marketer-1",
      timestamp: new Date("2026-03-07T00:00:00.000Z"),
      role: "marketer",
      agentName: "KnowledgeAgent",
      promptVersion: "prompt-v1",
      modelName: "openai/gpt-4o-mini",
      corpusSummary: {
        totalCases: 1,
        executableCases: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        coveragePct: 1,
        regressions: [],
      },
      caseResults: [],
      verdict: "APPROVED",
      verdictBasis: {
        failedCaseIds: [],
        skippedCaseIds: [],
        coveragePct: 1,
        executableCases: 1,
        policy: "APPROVED",
      },
    });
    agentManagement.getStoredConfigSnapshot.mockResolvedValue(null);
    (prisma.agentConfigChangeRequest.upsert as jest.Mock).mockResolvedValue({
      id: "change-marketer-1",
      companyId,
      role: "marketer",
      scope: "TENANT",
      targetVersion: "v1",
      requestedConfig: {
        ...dto,
        role: "marketer",
      },
      previousConfig: null,
      status: AgentConfigChangeStatus.READY_FOR_CANARY,
      evalVerdict: "APPROVED",
      canaryStatus: AgentCanaryStatus.NOT_STARTED,
      rollbackStatus: AgentRollbackStatus.NOT_REQUIRED,
      productionDecision: AgentProductionDecision.PENDING,
      evalRunId: "eval-marketer-1",
      promotedAt: null,
      rolledBackAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createChangeRequest(companyId, {
      ...dto,
      role: "marketer",
      capabilities: ["MarketingToolsRegistry"],
      tools: [],
      runtimeProfile: {
        executionAdapterRole: "knowledge",
      },
    }, "tenant");

    expect(result.status).toBe("READY_FOR_CANARY");
    expect(result.evalVerdict).toBe("APPROVED");
    expect(prisma.evalRun.updateMany).toHaveBeenCalledWith({
      where: { id: "eval-marketer-1", companyId, changeRequestId: null },
      data: { changeRequestId: "change-marketer-1" },
    });
  });

  it("canary degradation ведёт к rollback/quarantine outcome", async () => {
    (prisma.agentConfigChangeRequest.findFirst as jest.Mock).mockResolvedValue({
      id: "change-1",
      companyId,
      role: "agronomist",
      scope: "TENANT",
      requestedConfig: dto,
      status: AgentConfigChangeStatus.CANARY_ACTIVE,
    });
    canaryService.evaluateRejectionRateCanary.mockReturnValue({
      rollback: true,
      reason: "REJECTION_RATE_DEGRADATION_THRESHOLD_EXCEEDED",
    });
    (prisma.agentConfigChangeRequest.update as jest.Mock).mockResolvedValue({
      id: "change-1",
      companyId,
      role: "agronomist",
      scope: "TENANT",
      targetVersion: "v1",
      requestedConfig: dto,
      previousConfig: null,
      status: AgentConfigChangeStatus.ROLLED_BACK,
      evalVerdict: "APPROVED",
      canaryStatus: AgentCanaryStatus.DEGRADED,
      rollbackStatus: AgentRollbackStatus.EXECUTED,
      productionDecision: AgentProductionDecision.ROLLED_BACK,
      promotedAt: null,
      rolledBackAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (prisma.modelVersion.findFirst as jest.Mock).mockResolvedValue({
      id: "model-1",
    });
    (prisma.modelVersion.update as jest.Mock).mockResolvedValue({});

    const result = await service.reviewCanary(companyId, "change-1", {
      baselineRejectionRate: 0.1,
      canaryRejectionRate: 0.2,
      sampleSize: 100,
    });

    expect(result.status).toBe("ROLLED_BACK");
    expect(prisma.modelVersion.update).toHaveBeenCalledWith({
      where: { id: "model-1" },
      data: { status: "QUARANTINED" },
    });
  });

  it("approved change проходит controlled activation path", async () => {
    (prisma.agentConfigChangeRequest.findFirst as jest.Mock).mockResolvedValue({
      id: "change-1",
      companyId,
      role: "agronomist",
      scope: "TENANT",
      requestedConfig: dto,
      previousConfig: null,
      status: AgentConfigChangeStatus.APPROVED_FOR_PRODUCTION,
    });
    agentManagement.applyPromotedAgentConfig.mockResolvedValue({
      id: "cfg-1",
    });
    (prisma.agentConfigChangeRequest.update as jest.Mock).mockResolvedValue({
      id: "change-1",
      companyId,
      role: "agronomist",
      scope: "TENANT",
      targetVersion: "v1",
      requestedConfig: dto,
      previousConfig: null,
      status: AgentConfigChangeStatus.PROMOTED,
      evalVerdict: "APPROVED",
      canaryStatus: AgentCanaryStatus.PASSED,
      rollbackStatus: AgentRollbackStatus.NOT_REQUIRED,
      productionDecision: AgentProductionDecision.APPROVED,
      promotedAt: new Date(),
      rolledBackAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.promoteApprovedChange(companyId, "change-1");

    expect(agentManagement.applyPromotedAgentConfig).toHaveBeenCalledWith(
      companyId,
      dto,
      "tenant",
      expect.objectContaining({
        workflow: "prompt_change_governance",
      }),
    );
    expect(result.status).toBe("PROMOTED");
  });
});
