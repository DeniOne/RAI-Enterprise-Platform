import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import { AgentRegistryService } from "../rai-chat/agent-registry.service";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";

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
      {
        definition: {
          role: "marketer",
          name: "MarketerAgent",
          businessRole: "MarketerAgent: summary, recommendations, evidence",
          ownerDomain: "marketing",
        },
        runtime: {
          configId: "cfg-marketer",
          source: "tenant",
          bindingsSource: "persisted",
          llmModel: "openai/gpt-4o-mini",
          maxTokens: 8000,
          systemPrompt: "You are marketer.",
          capabilities: ["MarketingToolsRegistry"],
          tools: [],
          isActive: true,
        },
        tenantAccess: {
          companyId,
          mode: "OVERRIDE",
          source: "tenant",
          isActive: true,
        },
      },
    ]),
    getEffectiveKernel: jest.fn().mockResolvedValue({
      definition: { role: "agronomist" },
      runtimeProfile: {
        profileId: "agronomist-runtime-v1",
        modelRoutingClass: "strong",
        provider: "openrouter",
        model: "openrouter/agronom",
        maxInputTokens: 8000,
        maxOutputTokens: 4000,
        temperature: 0.2,
        timeoutMs: 15000,
        supportsStreaming: false,
      },
      memoryPolicy: {
        policyId: "agronom-memory-v1",
        allowedScopes: ["tenant", "domain"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "allow_masked_only",
      },
      outputContract: {
        contractId: "agronom-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "evidence"],
        requiresEvidence: true,
        requiresDeterministicValidation: true,
        fallbackMode: "deterministic_summary",
      },
      governancePolicy: {
        policyId: "agronom-governance-v1",
        allowedAutonomyModes: ["advisory"],
        humanGateRules: ["write_tools_require_review"],
        criticalActionRules: ["no_critical_actions"],
        auditRequirements: ["trace"],
        fallbackRules: ["use_deterministic_summary_if_llm_unavailable"],
      },
      toolBindings: [
        {
          toolName: "generate_tech_map_draft",
          isEnabled: true,
          requiresHumanGate: true,
          riskLevel: "WRITE",
        },
      ],
      connectorBindings: [],
    }),
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
  const futureAgentConfig = {
    id: "cfg-marketer",
    name: "Marketer",
    role: "marketer",
    systemPrompt: "You are marketer.",
    llmModel: "openai/gpt-4o-mini",
    maxTokens: 8000,
    isActive: true,
    companyId,
    capabilities: ["MarketingToolsRegistry"],
    autonomyMode: "advisory",
    runtimeProfile: {},
    memoryPolicy: {},
    outputContract: {},
    governancePolicy: {},
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
            agentConnectorBinding: {
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
      .mockResolvedValueOnce([tenantOverride, futureAgentConfig]);
    const result = await service.getAgentConfigs(companyId);
    expect(result.global).toHaveLength(2);
    expect(result.global[0].role).toBe("agronomist");
    expect(result.global[0].companyId).toBeNull();
    expect(result.global[1].role).toBe("legacy-custom-role");
    expect(result.tenantOverrides).toHaveLength(2);
    expect(result.tenantOverrides[0].capabilities).toEqual(["AgroToolsRegistry", "SearchWeb"]);
    expect(result.tenantOverrides[1]).toMatchObject({
      role: "marketer",
      llmModel: "openai/gpt-4o-mini",
    });
    expect(result.agents).toHaveLength(2);
    expect(result.agents[0]).toMatchObject({
      role: "agronomist",
      agentName: "AgronomAgent",
      tenantAccess: {
        mode: "DENIED",
      },
      kernel: {
        runtimeProfile: {
          provider: "openrouter",
          modelRoutingClass: "strong",
        },
        outputContract: {
          contractId: "agronom-v1",
        },
      },
    });
    expect(result.agents[1]).toMatchObject({
      role: "marketer",
      agentName: "MarketerAgent",
      ownerDomain: "marketing",
      runtime: {
        source: "tenant",
        bindingsSource: "persisted",
        llmModel: "openai/gpt-4o-mini",
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
      autonomyMode: "advisory" as const,
      runtimeProfile: { modelRoutingClass: "strong" as const },
      connectors: [
        {
          connectorName: "crm",
          accessMode: "read" as const,
          scopes: ["tenant"],
          isEnabled: true,
        },
      ],
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
      connectors: [
        {
          connectorName: "crm",
          accessMode: "read" as const,
          scopes: ["tenant"],
          isEnabled: true,
        },
      ],
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
    expect(prisma.agentConnectorBinding.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          role: "agronomist",
          connectorName: "crm",
          companyId,
          accessMode: "read",
        }),
      ]),
    });
  });

  it("returns future agent onboarding templates", () => {
    const result = service.getFutureAgentTemplates();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          templateId: "marketer",
          manifest: expect.objectContaining({
            role: "marketer",
            runtimeProfile: expect.objectContaining({
              provider: "openrouter",
              executionAdapterRole: "knowledge",
            }),
          }),
        }),
        expect.objectContaining({
          templateId: "legal_advisor",
          manifest: expect.objectContaining({
            domainAdapter: expect.objectContaining({
              status: "required",
            }),
          }),
        }),
        expect.objectContaining({
          templateId: "front_office_agent",
          manifest: expect.objectContaining({
            role: "front_office_agent",
            runtimeProfile: expect.objectContaining({
              executionAdapterRole: "front_office_agent",
            }),
          }),
        }),
      ]),
    );
  });

  it("validates future agent manifests against runtime onboarding requirements", () => {
    const [template] = service.getFutureAgentTemplates();
    const valid = service.validateFutureAgentManifest(template.manifest);

    expect(valid).toEqual({
      valid: true,
      normalizedRole: template.manifest.role,
      compatibleWithRuntimeWithoutCodeChanges: true,
      missingRequirements: [],
      warnings: expect.any(Array),
    });

    const invalid = service.validateFutureAgentManifest({
      ...template.manifest,
      role: "Legal_Advisor",
      capabilityPolicy: {
        ...template.manifest.capabilityPolicy,
        capabilities: [],
      },
      outputContract: {
        ...template.manifest.outputContract,
        sections: ["summary"],
      },
      runtimeProfile: {
        ...template.manifest.runtimeProfile,
        executionAdapterRole: "not_a_runtime",
      },
      toolBindings: [
        {
          toolName: "dangerous_write",
          isEnabled: true,
          requiresHumanGate: false,
          riskLevel: "CRITICAL",
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.missingRequirements).toEqual(
      expect.arrayContaining([
        "critical_tools_must_require_human_gate",
        "capability_policy_requires_at_least_one_capability",
        "execution_adapter_role_must_reference_canonical_runtime",
        "output_contract_requires_evidence_section",
      ]),
    );
  });

  it("applyPromotedAgentConfig persists future-agent config without canonical runtime assumptions", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.agentConfiguration.create as jest.Mock).mockResolvedValue(futureAgentConfig);
    const dto = {
      name: "Marketer",
      role: "marketer",
      systemPrompt: "You are marketer.",
      llmModel: "openai/gpt-4o-mini",
      maxTokens: 8000,
      isActive: true,
      capabilities: ["MarketingToolsRegistry"],
      tools: [],
      connectors: [
        {
          connectorName: "crm_read_model",
          accessMode: "read" as const,
          scopes: ["tenant", "campaigns"],
          isEnabled: true,
        },
      ],
    };

    const result = await service.applyPromotedAgentConfig(companyId, dto, "tenant");

    expect(result.role).toBe("marketer");
    expect(prisma.agentConfiguration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "marketer",
        companyId,
      }),
    });
    expect(prisma.agentConnectorBinding.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          role: "marketer",
          connectorName: "crm_read_model",
        }),
      ]),
    });
  });

});
