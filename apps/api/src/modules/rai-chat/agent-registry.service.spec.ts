import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgentRegistryService } from "./agent-registry.service";

describe("AgentRegistryService", () => {
  let service: AgentRegistryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRegistryService,
        {
          provide: PrismaService,
          useValue: {
            agentConfiguration: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            agentCapabilityBinding: {
              findMany: jest.fn(),
            },
            agentToolBinding: {
              findMany: jest.fn(),
            },
            agentConnectorBinding: {
              findMany: jest.fn(),
            },
            agentLifecycleOverride: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(AgentRegistryService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("строит first-class registry entries с mapping agent -> capabilities", async () => {
    (prisma.agentConfiguration.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: "cfg-global-agro",
          name: "Agronom",
          role: "agronomist",
          systemPrompt: "Prompt",
          llmModel: "gpt-4o",
          maxTokens: 16000,
          isActive: true,
          companyId: null,
          capabilities: ["AgroToolsRegistry", "generate_tech_map_draft"],
        },
      ])
      .mockResolvedValueOnce([]);
    (prisma.agentCapabilityBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          role: "agronomist",
          capability: "AgroToolsRegistry",
          isEnabled: true,
          companyId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          role: "agronomist",
          toolName: "generate_tech_map_draft",
          isEnabled: true,
          companyId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    (prisma.agentConnectorBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getRegistry("company-1");
    const agronom = result.find((entry) => entry.definition.role === "agronomist");

    expect(result).toHaveLength(7);
    expect(agronom).toMatchObject({
      definition: {
        role: "agronomist",
        name: "AgronomAgent",
      },
      runtime: {
        source: "global",
        bindingsSource: "persisted",
        capabilities: ["AgroToolsRegistry"],
        tools: ["generate_tech_map_draft", "compute_deviations"],
      },
      tenantAccess: {
        companyId: "company-1",
        mode: "INHERITED",
      },
    });
  });

  it("includes future roles in effective registry read model", async () => {
    (prisma.agentConfiguration.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: "cfg-global-agro",
          name: "Agronom",
          role: "agronomist",
          systemPrompt: "Prompt",
          llmModel: "gpt-4o",
          maxTokens: 16000,
          isActive: true,
          companyId: null,
          capabilities: ["AgroToolsRegistry"],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "cfg-tenant-marketer",
          name: "MarketerAgent",
          role: "marketer",
          systemPrompt: "You are marketer.",
          llmModel: "openai/gpt-4o-mini",
          maxTokens: 8000,
          isActive: true,
          companyId: "company-1",
          capabilities: ["MarketingToolsRegistry"],
          runtimeProfile: {
            executionAdapterRole: "knowledge",
          },
          outputContract: {
            sections: ["summary", "recommendations", "evidence"],
          },
        },
      ]);
    (prisma.agentCapabilityBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          role: "agronomist",
          capability: "AgroToolsRegistry",
          isEnabled: true,
          companyId: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          role: "marketer",
          capability: "MarketingToolsRegistry",
          isEnabled: true,
          companyId: "company-1",
        },
      ]);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          role: "agronomist",
          toolName: "generate_tech_map_draft",
          isEnabled: true,
          companyId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    (prisma.agentConnectorBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getRegistry("company-1");

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          definition: expect.objectContaining({
            role: "marketer",
            name: "MarketerAgent",
            ownerDomain: "marketing",
          }),
          runtime: expect.objectContaining({
            source: "tenant",
            bindingsSource: "persisted",
            capabilities: ["MarketingToolsRegistry"],
          }),
          tenantAccess: expect.objectContaining({
            mode: "OVERRIDE",
          }),
        }),
      ]),
    );
  });

  it("uses bootstrap runtime authority when persisted config is absent", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    (prisma.agentCapabilityBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentConnectorBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getEffectiveAgent("company-1", "agronomist");

    expect(result).toMatchObject({
      definition: {
        role: "agronomist",
        name: "AgronomAgent",
      },
      runtime: {
        configId: null,
        isActive: true,
        source: "global",
        bindingsSource: "bootstrap",
        capabilities: ["AgroToolsRegistry"],
        tools: ["generate_tech_map_draft", "compute_deviations"],
      },
      tenantAccess: {
        companyId: "company-1",
        mode: "INHERITED",
        isActive: true,
        source: "global",
      },
    });
  });

  it("tenant inactive override становится явным DENIED access", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "cfg-global-monitoring",
        name: "Monitoring",
        role: "monitoring",
        systemPrompt: "Global prompt",
        llmModel: "gpt-4o-mini",
        maxTokens: 4000,
        isActive: true,
        companyId: null,
        capabilities: ["RiskToolsRegistry"],
      })
      .mockResolvedValueOnce({
        id: "cfg-tenant-monitoring",
        name: "Monitoring tenant",
        role: "monitoring",
        systemPrompt: "Tenant prompt",
        llmModel: "gpt-4o-mini",
        maxTokens: 4000,
        isActive: false,
        companyId: "company-1",
        capabilities: ["RiskToolsRegistry"],
      });
    (prisma.agentCapabilityBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          role: "monitoring",
          capability: "RiskToolsRegistry",
          isEnabled: true,
          companyId: null,
        },
      ])
      .mockResolvedValueOnce([]);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          role: "monitoring",
          toolName: "get_weather_forecast",
          isEnabled: true,
          companyId: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          role: "monitoring",
          toolName: "get_weather_forecast",
          isEnabled: false,
          companyId: "company-1",
        },
      ]);
    (prisma.agentConnectorBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getEffectiveAgent("company-1", "monitoring");

    expect(result.runtime.isActive).toBe(false);
    expect(result.runtime.source).toBe("tenant");
    expect(result.runtime.tools).toEqual(["emit_alerts"]);
    expect(result.tenantAccess.mode).toBe("DENIED");
    expect(result.tenantAccess.source).toBe("tenant");
  });

  it("active lifecycle override принудительно замораживает runtime access", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "cfg-global-crm",
        name: "Crm",
        role: "crm_agent",
        systemPrompt: "Global prompt",
        llmModel: "openai/gpt-5-mini",
        maxTokens: 8000,
        isActive: true,
        companyId: null,
        capabilities: ["CrmToolsRegistry"],
      })
      .mockResolvedValueOnce(null);
    (prisma.agentCapabilityBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentConnectorBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentLifecycleOverride.findMany as jest.Mock).mockResolvedValue([
      { role: "crm_agent", state: "FROZEN" },
    ]);

    const result = await service.getEffectiveAgent("company-1", "crm_agent");

    expect(result?.runtime.isActive).toBe(false);
    expect(result?.tenantAccess.mode).toBe("DENIED");
    expect(result?.runtime.source).toBe("tenant");
  });

  it("builds effective kernel view for runtime consumers", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "cfg-global-knowledge",
        name: "Knowledge",
        role: "knowledge",
        systemPrompt: "Knowledge prompt",
        llmModel: "openrouter/knowledge",
        maxTokens: 4000,
        isActive: true,
        companyId: null,
        capabilities: ["KnowledgeToolsRegistry"],
      })
      .mockResolvedValueOnce(null);
    (prisma.agentCapabilityBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentConnectorBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          role: "knowledge",
          connectorName: "knowledge_base",
          accessMode: "read",
          scopes: ["tenant", "domain"],
          isEnabled: true,
          companyId: null,
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getEffectiveKernel("company-1", "knowledge");

    expect(result).toMatchObject({
      definition: {
        role: "knowledge",
        name: "KnowledgeAgent",
      },
      runtimeProfile: {
        provider: "openrouter",
        model: "openrouter/knowledge",
        modelRoutingClass: "fast",
      },
      outputContract: {
        contractId: "knowledge-v1",
      },
      governancePolicy: {
        allowedAutonomyModes: ["advisory"],
      },
      connectorBindings: [
        {
          connectorName: "knowledge_base",
          accessMode: "read",
          scopes: ["tenant", "domain"],
        },
      ],
    });
  });

  it("builds effective kernel for future role via executionAdapterRole binding", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "cfg-global-marketer",
        name: "MarketerAgent",
        role: "marketer",
        systemPrompt: "You are marketer.",
        llmModel: "openai/gpt-4o-mini",
        maxTokens: 8000,
        isActive: true,
        companyId: null,
        capabilities: ["MarketingToolsRegistry"],
        runtimeProfile: {
          profileId: "marketer-runtime-v1",
          modelRoutingClass: "fast",
          provider: "openrouter",
          model: "openai/gpt-4o-mini",
          maxInputTokens: 8000,
          maxOutputTokens: 3000,
          temperature: 0.2,
          timeoutMs: 15000,
          supportsStreaming: false,
          executionAdapterRole: "knowledge",
        },
        outputContract: {
          contractId: "marketer-v1",
          responseSchemaVersion: "v1",
          sections: ["summary", "recommendations", "evidence"],
          requiresEvidence: true,
          requiresDeterministicValidation: false,
          fallbackMode: "retrieval_summary",
        },
      })
      .mockResolvedValueOnce(null);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentConnectorBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getEffectiveKernel("company-1", "marketer");

    expect(result).toMatchObject({
      definition: {
        role: "marketer",
        name: "MarketerAgent",
      },
      runtimeProfile: {
        profileId: "marketer-runtime-v1",
        executionAdapterRole: "knowledge",
        modelRoutingClass: "fast",
      },
      outputContract: {
        contractId: "marketer-v1",
      },
    });
    expect(result?.toolBindings).toEqual([
      expect.objectContaining({
        toolName: "query_knowledge",
        isEnabled: false,
      }),
    ]);
  });
});
