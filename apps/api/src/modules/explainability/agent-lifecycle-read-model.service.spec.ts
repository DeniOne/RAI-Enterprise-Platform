import { Test } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgentRegistryService } from "../rai-chat/agent-registry.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentLifecycleReadModelService } from "./agent-lifecycle-read-model.service";

describe("AgentLifecycleReadModelService", () => {
  let service: AgentLifecycleReadModelService;

  const prisma = {
    agentConfigChangeRequest: {
      findMany: jest.fn(),
    },
    agentLifecycleOverride: {
      findMany: jest.fn(),
    },
  };
  const agentRegistry = {
    getRegistry: jest.fn(),
  };
  const agentManagement = {
    getFutureAgentTemplates: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AgentLifecycleReadModelService,
        { provide: PrismaService, useValue: prisma },
        { provide: AgentRegistryService, useValue: agentRegistry },
        { provide: AgentManagementService, useValue: agentManagement },
      ],
    }).compile();

    service = moduleRef.get(AgentLifecycleReadModelService);
  });

  it("строит summary и agent items по registry + change requests", async () => {
    agentRegistry.getRegistry.mockResolvedValue([
      {
        definition: {
          role: "contracts_agent",
          name: "ContractsAgent",
          businessRole: "commerce",
          ownerDomain: "commerce",
        },
        runtime: {
          configId: "cfg-1",
          systemPrompt: "",
          llmModel: "openai/gpt-5-mini",
          maxTokens: 4000,
          capabilities: [],
          tools: [],
          isActive: true,
          source: "global",
          bindingsSource: "bootstrap",
        },
        tenantAccess: {
          companyId: "company-a",
          role: "contracts_agent",
          mode: "INHERITED",
          isActive: true,
          source: "global",
        },
      },
      {
        definition: {
          role: "crm_agent",
          name: "CrmAgent",
          businessRole: "crm",
          ownerDomain: "crm",
        },
        runtime: {
          configId: "cfg-2",
          systemPrompt: "",
          llmModel: "openai/gpt-5-mini",
          maxTokens: 4000,
          capabilities: [],
          tools: [],
          isActive: false,
          source: "tenant",
          bindingsSource: "persisted",
        },
        tenantAccess: {
          companyId: "company-a",
          role: "crm_agent",
          mode: "DENIED",
          isActive: false,
          source: "tenant",
        },
      },
      {
        definition: {
          role: "strategy_agent",
          name: "Strategy Agent",
          businessRole: "strategy",
          ownerDomain: "strategy",
        },
        runtime: {
          configId: "cfg-3",
          systemPrompt: "",
          llmModel: "openai/gpt-5-mini",
          maxTokens: 4000,
          capabilities: [],
          tools: [],
          isActive: true,
          source: "tenant",
          bindingsSource: "persisted",
        },
        tenantAccess: {
          companyId: "company-a",
          role: "strategy_agent",
          mode: "OVERRIDE",
          isActive: true,
          source: "tenant",
        },
      },
    ]);
    prisma.agentConfigChangeRequest.findMany.mockResolvedValue([
      {
        id: "chg-1",
        role: "contracts_agent",
        targetVersion: "v2",
        status: "CANARY_ACTIVE",
        canaryStatus: "ACTIVE",
        rollbackStatus: "NOT_REQUIRED",
        productionDecision: "PENDING",
        promotedAt: null,
        rolledBackAt: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T01:00:00.000Z"),
      },
      {
        id: "chg-2",
        role: "strategy_agent",
        targetVersion: "v1",
        status: "READY_FOR_CANARY",
        canaryStatus: "NOT_STARTED",
        rollbackStatus: "NOT_REQUIRED",
        productionDecision: "PENDING",
        promotedAt: null,
        rolledBackAt: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T02:00:00.000Z"),
      },
    ]);
    prisma.agentLifecycleOverride.findMany.mockResolvedValue([
      {
        role: "crm_agent",
        state: "FROZEN",
        reason: "manual freeze",
        createdAt: new Date("2026-03-10T03:00:00.000Z"),
        createdByUserId: "u-1",
      },
    ]);
    agentManagement.getFutureAgentTemplates.mockReturnValue([{}, {}, {}]);

    const summary = await service.getSummary("company-a");
    const agents = await service.getAgents("company-a");

    expect(summary.templateCatalogCount).toBe(3);
    expect(summary.stateCounts.CANARY).toBe(1);
    expect(summary.stateCounts.PROMOTION_CANDIDATE).toBe(1);
    expect(summary.stateCounts.FROZEN).toBe(1);

    expect(agents.find((item) => item.role === "contracts_agent")?.lifecycleState).toBe("CANARY");
    expect(agents.find((item) => item.role === "contracts_agent")?.currentVersion).toBe("cfg-1");
    expect(agents.find((item) => item.role === "contracts_agent")?.candidateVersion).toBe("v2");
    expect(agents.find((item) => item.role === "contracts_agent")?.stableVersion).toBe("cfg-1");
    expect(agents.find((item) => item.role === "contracts_agent")?.versionDelta).toBe(
      "AHEAD_OF_STABLE",
    );
    expect(agents.find((item) => item.role === "contracts_agent")?.lineage).toHaveLength(1);
    expect(agents.find((item) => item.role === "crm_agent")?.lifecycleState).toBe("FROZEN");
    expect(agents.find((item) => item.role === "crm_agent")?.lifecycleOverride?.state).toBe(
      "FROZEN",
    );
    expect(agents.find((item) => item.role === "strategy_agent")?.lifecycleState).toBe(
      "PROMOTION_CANDIDATE",
    );
  });

  it("возвращает lifecycle history по override журналу", async () => {
    prisma.agentLifecycleOverride.findMany.mockResolvedValue([
      {
        role: "crm_agent",
        state: "FROZEN",
        reason: "manual freeze",
        isActive: false,
        createdAt: new Date("2026-03-10T01:00:00.000Z"),
        updatedAt: new Date("2026-03-10T02:00:00.000Z"),
        clearedAt: new Date("2026-03-10T03:00:00.000Z"),
        createdByUserId: "u-1",
        clearedByUserId: "u-2",
      },
      {
        role: "contracts_agent",
        state: "RETIRED",
        reason: "role merged",
        isActive: true,
        createdAt: new Date("2026-03-10T04:00:00.000Z"),
        updatedAt: new Date("2026-03-10T04:00:00.000Z"),
        clearedAt: null,
        createdByUserId: "u-3",
        clearedByUserId: null,
      },
    ]);

    const history = await service.getHistory("company-a", 10);

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      role: "crm_agent",
      state: "FROZEN",
      isActive: false,
    });
    expect(history[1]).toMatchObject({
      role: "contracts_agent",
      state: "RETIRED",
      isActive: true,
    });
  });

  it("отмечает rollback на stable version как rolled_back_to_stable", async () => {
    agentRegistry.getRegistry.mockResolvedValue([
      {
        definition: {
          role: "contracts_agent",
          name: "ContractsAgent",
          businessRole: "commerce",
          ownerDomain: "commerce",
        },
        runtime: {
          configId: "v1",
          systemPrompt: "",
          llmModel: "openai/gpt-5-mini",
          maxTokens: 4000,
          capabilities: [],
          tools: [],
          isActive: true,
          source: "global",
          bindingsSource: "bootstrap",
        },
        tenantAccess: {
          companyId: "company-a",
          role: "contracts_agent",
          mode: "INHERITED",
          isActive: true,
          source: "global",
        },
      },
    ]);
    prisma.agentConfigChangeRequest.findMany.mockResolvedValue([
      {
        id: "chg-2",
        role: "contracts_agent",
        targetVersion: "v2",
        status: "ROLLED_BACK",
        canaryStatus: "DEGRADED",
        rollbackStatus: "EXECUTED",
        productionDecision: "ROLLED_BACK",
        promotedAt: new Date("2026-03-10T00:00:00.000Z"),
        rolledBackAt: new Date("2026-03-10T01:00:00.000Z"),
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T01:00:00.000Z"),
      },
      {
        id: "chg-1",
        role: "contracts_agent",
        targetVersion: "v1",
        status: "PROMOTED",
        canaryStatus: "PASSED",
        rollbackStatus: "NOT_REQUIRED",
        productionDecision: "APPROVED",
        promotedAt: new Date("2026-03-08T00:00:00.000Z"),
        rolledBackAt: null,
        createdAt: new Date("2026-03-07T00:00:00.000Z"),
        updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      },
    ]);
    prisma.agentLifecycleOverride.findMany.mockResolvedValue([]);

    const agents = await service.getAgents("company-a");
    const contractsAgent = agents.find((item) => item.role === "contracts_agent");

    expect(contractsAgent?.currentVersion).toBe("v1");
    expect(contractsAgent?.stableVersion).toBe("v1");
    expect(contractsAgent?.previousStableVersion).toBe("v1");
    expect(contractsAgent?.versionDelta).toBe("ROLLED_BACK_TO_STABLE");
  });
});
