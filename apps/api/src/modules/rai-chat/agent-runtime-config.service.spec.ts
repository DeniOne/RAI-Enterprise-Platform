import { Test, TestingModule } from "@nestjs/testing";
import { RaiToolName } from "./tools/rai-tools.types";
import { AgentRuntimeConfigService } from "./agent-runtime-config.service";
import { AgentRegistryService } from "./agent-registry.service";

describe("AgentRuntimeConfigService", () => {
  let service: AgentRuntimeConfigService;
  const agentRegistry = {
    getEffectiveAgent: jest.fn(),
    getRegistry: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRuntimeConfigService,
        { provide: AgentRegistryService, useValue: agentRegistry },
      ],
    }).compile();

    service = module.get(AgentRuntimeConfigService);
    jest.clearAllMocks();
  });

  it("getEffectiveConfig возвращает null без persisted authority", async () => {
    agentRegistry.getEffectiveAgent.mockResolvedValue(null);

    const result = await service.getEffectiveConfig("company-1", "agronomist");

    expect(result).toBeNull();
  });

  it("resolveToolAccess блокирует tool при DENIED/disabled effective agent", async () => {
    agentRegistry.getRegistry.mockResolvedValue([
      {
        definition: { role: "agronomist" },
        runtime: {
          isActive: false,
          capabilities: ["AgroToolsRegistry"],
          tools: [RaiToolName.GenerateTechMapDraft],
          source: "tenant",
          bindingsSource: "persisted",
        },
      },
    ]);

    const result = await service.resolveToolAccess(
      "company-1",
      RaiToolName.GenerateTechMapDraft,
    );

    expect(result).toEqual({
      allowed: false,
      reasonCode: "AGENT_DISABLED",
      role: "agronomist",
      requiredCapability: "AgroToolsRegistry",
      source: "persisted",
    });
  });

  it("resolveToolAccess разрешает tool при наличии persisted tool binding", async () => {
    agentRegistry.getRegistry.mockResolvedValue([
      {
        definition: { role: "economist" },
        runtime: {
          isActive: true,
          capabilities: ["FinanceToolsRegistry"],
          tools: [RaiToolName.ComputePlanFact],
          source: "global",
          bindingsSource: "persisted",
        },
      },
    ]);

    const result = await service.resolveToolAccess(
      "company-1",
      RaiToolName.ComputePlanFact,
    );

    expect(result).toEqual({
      allowed: true,
      role: "economist",
      requiredCapability: "FinanceToolsRegistry",
      source: "persisted",
    });
  });

  it("resolveToolAccess deny-by-default для governed tool без persisted binding", async () => {
    agentRegistry.getRegistry.mockResolvedValue([]);

    const result = await service.resolveToolAccess(
      "company-1",
      RaiToolName.ComputePlanFact,
    );

    expect(result).toEqual({
      allowed: false,
      reasonCode: "CAPABILITY_DENIED",
      source: "persisted",
    });
  });

  it("resolveToolAccess не блокирует ungovened built-in tool без registry owner", async () => {
    agentRegistry.getRegistry.mockResolvedValue([]);

    const result = await service.resolveToolAccess(
      "company-1",
      RaiToolName.EchoMessage,
    );

    expect(result).toEqual({
      allowed: true,
    });
  });

  it("resolveToolAccess не блокирует front-office classify tool без registry owner", async () => {
    agentRegistry.getRegistry.mockResolvedValue([]);

    const result = await service.resolveToolAccess(
      "company-1",
      RaiToolName.ClassifyDialogThread,
    );

    expect(result).toEqual({
      allowed: true,
    });
  });
});
