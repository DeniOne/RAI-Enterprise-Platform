import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import { AgentRegistryService } from "../rai-chat/agent-registry.service";
import { RaiToolName } from "../rai-chat/tools/rai-tools.types";

describe("AgentManagementService", () => {
  let service: AgentManagementService;
  let prisma: PrismaService;
  const companyId = "company-1";
  const configGuard = {
    assertUpsertAllowed: jest.fn().mockResolvedValue(null),
  };
  const agentRegistry = {
    getRegistry: jest.fn().mockResolvedValue([
      {
        definition: {
          role: "agronomist",
          name: "AgronomAgent",
          businessRole: "Генерация DRAFT техкарт и агрономических рекомендаций",
          ownerDomain: "agro",
        },
        runtime: {
          configId: "cfg-tenant",
          source: "tenant",
          llmModel: "claude-3",
          maxTokens: 8000,
          systemPrompt: "Custom prompt.",
          capabilities: ["AgroToolsRegistry", "SearchWeb"],
          isActive: false,
        },
        tenantAccess: {
          companyId,
          mode: "DENIED",
          source: "tenant",
          isActive: false,
        },
      },
    ]),
  };

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
  const legacyUnknownConfig = {
    ...globalConfig,
    id: "cfg-legacy",
    role: "legacy-custom-role",
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
        { provide: AgentRegistryService, useValue: agentRegistry },
        {
          provide: PrismaService,
          useValue: {
            agentConfiguration: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            agentCapabilityBinding: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
              createMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            agentToolBinding: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
              createMany: jest.fn().mockResolvedValue({ count: 0 }),
              findMany: jest.fn().mockResolvedValue([]),
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
      .mockResolvedValueOnce([globalConfig, legacyUnknownConfig])
      .mockResolvedValueOnce([tenantOverride]);
    const result = await service.getAgentConfigs(companyId);
    expect(result.global).toHaveLength(1);
    expect(result.global[0].role).toBe("agronomist");
    expect(result.global[0].companyId).toBeNull();
    expect(result.tenantOverrides).toHaveLength(1);
    expect(result.tenantOverrides[0].capabilities).toEqual(["AgroToolsRegistry", "SearchWeb"]);
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]).toMatchObject({
      role: "agronomist",
      agentName: "AgronomAgent",
      tenantAccess: {
        mode: "DENIED",
      },
    });
  });

  it("upsertAgentConfig saves capabilities list", async () => {
    const dto = {
      name: "Agronom",
      role: "agronomist" as const,
      systemPrompt: "Prompt",
      llmModel: "gpt-4o",
      maxTokens: 16000,
      isActive: true,
      capabilities: ["AgroToolsRegistry", "SearchWeb"],
      tools: [RaiToolName.GenerateTechMapDraft],
    };
    await expect(service.upsertAgentConfig(companyId, dto, "tenant")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("applyPromotedAgentConfig saves capabilities list only for governed promotion", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.agentConfiguration.create as jest.Mock).mockResolvedValue({
      ...globalConfig,
      id: "new-id",
      capabilities: ["AgroToolsRegistry", "SearchWeb"],
    });
    const dto = {
      name: "Agronom",
      role: "agronomist" as const,
      systemPrompt: "Prompt",
      llmModel: "gpt-4o",
      maxTokens: 16000,
      isActive: true,
      capabilities: ["AgroToolsRegistry", "SearchWeb"],
      tools: [RaiToolName.GenerateTechMapDraft],
    };
    const result = await service.applyPromotedAgentConfig(companyId, dto, "tenant", {
      changeRequestId: "change-1",
    });
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
        action: "AGENT_CONFIG_PROMOTED_CREATE",
        companyId,
      }),
    });
    expect(prisma.agentCapabilityBinding.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          role: "agronomist",
          capability: "AgroToolsRegistry",
          companyId,
        }),
      ]),
    });
    expect(prisma.agentToolBinding.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          role: "agronomist",
          toolName: "generate_tech_map_draft",
          companyId,
        }),
      ]),
    });
  });

});
