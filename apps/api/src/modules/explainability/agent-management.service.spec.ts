import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentConfigGuardService } from "./agent-config-guard.service";

describe("AgentManagementService", () => {
  let service: AgentManagementService;
  let prisma: PrismaService;
  const configGuard = {
    assertUpsertAllowed: jest.fn().mockResolvedValue(null),
    assertToggleAllowed: jest.fn().mockResolvedValue(undefined),
  };

  const companyId = "company-1";
  const globalConfig = {
    id: "cfg-global",
    name: "Agronom",
    role: "agronomist",
    systemPrompt: "You are agronomist.",
    llmModel: "gpt-4o",
    maxTokens: 16000,
    isActive: true,
    companyId: null,
    capabilities: ["AgroToolsRegistry"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tenantOverride = {
    id: "cfg-tenant",
    name: "Agronom Custom",
    role: "agronomist",
    systemPrompt: "Custom prompt.",
    llmModel: "claude-3",
    maxTokens: 8000,
    isActive: false,
    companyId,
    capabilities: ["AgroToolsRegistry", "SearchWeb"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentManagementService,
        { provide: AgentConfigGuardService, useValue: configGuard },
        {
          provide: PrismaService,
          useValue: {
            agentConfiguration: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: "audit-1" }),
            },
          },
        },
      ],
    }).compile();
    service = module.get(AgentManagementService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("getAgentConfigs merges global and tenant overrides", async () => {
    (prisma.agentConfiguration.findMany as jest.Mock)
      .mockResolvedValueOnce([globalConfig])
      .mockResolvedValueOnce([tenantOverride]);
    const result = await service.getAgentConfigs(companyId);
    expect(result.global).toHaveLength(1);
    expect(result.global[0].role).toBe("agronomist");
    expect(result.global[0].companyId).toBeNull();
    expect(result.tenantOverrides).toHaveLength(1);
    expect(result.tenantOverrides[0].capabilities).toEqual(["AgroToolsRegistry", "SearchWeb"]);
  });

  it("upsertAgentConfig saves capabilities list", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.agentConfiguration.create as jest.Mock).mockResolvedValue({
      ...globalConfig,
      id: "new-id",
      capabilities: ["AgroToolsRegistry", "SearchWeb"],
    });
    const dto = {
      name: "Agronom",
      role: "agronomist",
      systemPrompt: "Prompt",
      llmModel: "gpt-4o",
      maxTokens: 16000,
      isActive: true,
      capabilities: ["AgroToolsRegistry", "SearchWeb"],
    };
    const result = await service.upsertAgentConfig(companyId, dto, "tenant");
    expect(configGuard.assertUpsertAllowed).toHaveBeenCalledWith(companyId, dto);
    expect(result.capabilities).toEqual(["AgroToolsRegistry", "SearchWeb"]);
    expect(prisma.agentConfiguration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "agronomist",
        companyId,
        capabilities: ["AgroToolsRegistry", "SearchWeb"],
      }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AGENT_CONFIG_CREATED",
        companyId,
      }),
    });
  });

  it("toggleAgent creates tenant override when only global exists", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(globalConfig);
    (prisma.agentConfiguration.create as jest.Mock).mockResolvedValue({
      ...tenantOverride,
      isActive: false,
    });
    const result = await service.toggleAgent(companyId, "agronomist", false);
    expect(configGuard.assertToggleAllowed).toHaveBeenCalledWith(
      companyId,
      "agronomist",
      false,
      "gpt-4o",
    );
    expect(result.isActive).toBe(false);
    expect(prisma.agentConfiguration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "agronomist",
        companyId,
        isActive: false,
      }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AGENT_CONFIG_TOGGLED",
        companyId,
      }),
    });
  });

  it("toggleAgent throws when role not found", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.toggleAgent(companyId, "unknown", true)).rejects.toThrow(ForbiddenException);
  });
});
