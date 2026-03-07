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

    const result = await service.getRegistry("company-1");
    const agronom = result.find((entry) => entry.definition.role === "agronomist");

    expect(result).toHaveLength(4);
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

  it("не выдаёт runtime authority при полном отсутствии persisted config", async () => {
    (prisma.agentConfiguration.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    (prisma.agentCapabilityBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (prisma.agentToolBinding.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getEffectiveAgent("company-1", "agronomist");

    expect(result).toBeNull();
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

    const result = await service.getEffectiveAgent("company-1", "monitoring");

    expect(result.runtime.isActive).toBe(false);
    expect(result.runtime.source).toBe("tenant");
    expect(result.runtime.tools).toEqual(["emit_alerts"]);
    expect(result.tenantAccess.mode).toBe("DENIED");
    expect(result.tenantAccess.source).toBe("tenant");
  });
});
