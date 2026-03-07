import { NotFoundException } from "@nestjs/common";
import { BudgetControllerService } from "./budget-controller.service";
import { TechMapBudgetService } from "../../tech-map/economics/tech-map-budget.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { BudgetExceededError } from "./budget-exceeded.error";
import { RaiToolActorContext } from "../tools/rai-tools.types";
import { AgentRegistryService } from "../agent-registry.service";
import { RaiToolName } from "../tools/rai-tools.types";

describe("BudgetControllerService", () => {
  let service: BudgetControllerService;
  let budgetService: jest.Mocked<TechMapBudgetService>;
  let prisma: any;
  let agentRegistry: jest.Mocked<AgentRegistryService>;

  const actorContext: RaiToolActorContext = {
    companyId: "company-1",
    traceId: "trace-1",
  };

  beforeEach(() => {
    budgetService = {
      calculateBudget: jest.fn(),
    } as any;
    prisma = {
      techMap: {
        findFirst: jest.fn(),
      },
    };
    agentRegistry = {
      getRegistry: jest.fn().mockResolvedValue([
        {
          definition: { role: "knowledge" },
          runtime: { tools: [RaiToolName.QueryKnowledge], maxTokens: 4000 },
        },
        {
          definition: { role: "agronomist" },
          runtime: {
            tools: [
              RaiToolName.GenerateTechMapDraft,
              RaiToolName.ComputeDeviations,
            ],
            maxTokens: 10000,
          },
        },
      ]),
    } as any;
    service = new BudgetControllerService(budgetService, prisma, agentRegistry);
  });

  it("validateTransaction проходит при projected в пределах лимита", async () => {
    budgetService.calculateBudget.mockResolvedValue({
      totalPlanned: 50000,
      totalActual: 0,
      byCategory: {} as any,
      withinCap: true,
      overCap: 0,
    });
    prisma.techMap.findFirst.mockResolvedValue({
      id: "tm-1",
      budgetCapRubHa: 10000,
      contingencyFundPct: 0.1,
      field: { area: 10 },
      cropZone: { field: { area: 10 } },
    });
    await expect(
      service.validateTransaction("tm-1", 20000, actorContext),
    ).resolves.toBeUndefined();
    expect(budgetService.calculateBudget).toHaveBeenCalledWith(
      "tm-1",
      "company-1",
    );
  });

  it("validateTransaction выбрасывает BudgetExceededError при превышении лимита", async () => {
    budgetService.calculateBudget.mockResolvedValue({
      totalPlanned: 80000,
      totalActual: 0,
      byCategory: {} as any,
      withinCap: false,
      overCap: 10000,
    });
    const limit = 10000 * 10 * 1.1; // 110000
    prisma.techMap.findFirst.mockResolvedValue({
      id: "tm-1",
      budgetCapRubHa: 10000,
      contingencyFundPct: 0.1,
      field: { area: 10 },
      cropZone: { field: { area: 10 } },
    });
    await expect(
      service.validateTransaction("tm-1", 50000, actorContext),
    ).rejects.toThrow(BudgetExceededError);
    try {
      await service.validateTransaction("tm-1", 50000, actorContext);
    } catch (e) {
      expect((e as BudgetExceededError).limitRub).toBeCloseTo(110000, 0);
      expect((e as BudgetExceededError).projectedRub).toBe(130000);
    }
  });

  it("validateTransaction выбрасывает NotFoundException если TechMap не найден", async () => {
    prisma.techMap.findFirst.mockResolvedValue(null);
    await expect(
      service.validateTransaction("tm-missing", 0, actorContext),
    ).rejects.toThrow(NotFoundException);
  });

  it("isChangeAllowed: CANCEL_OP не требует проверки", () => {
    const r = service.isChangeAllowed("tm-1", "CANCEL_OP");
    expect(r.allowed).toBe(true);
    expect(r.requiresValidation).toBe(false);
  });

  it("isChangeAllowed: ADD_OP требует проверки", () => {
    const r = service.isChangeAllowed("tm-1", "ADD_OP");
    expect(r.allowed).toBe(true);
    expect(r.requiresValidation).toBe(true);
  });

  it("evaluateRuntimeBudget: ALLOW если набор инструментов укладывается в maxTokens registry", async () => {
    const result = await service.evaluateRuntimeBudget(
      [{ name: RaiToolName.QueryKnowledge, payload: { query: "что по влаге" } }],
      actorContext,
    );

    expect(result.outcome).toBe("ALLOW");
    expect(result.allowedToolNames).toEqual([RaiToolName.QueryKnowledge]);
    expect(result.droppedToolNames).toEqual([]);
  });

  it("evaluateRuntimeBudget: DEGRADE если вторичный READ tool не помещается в бюджет owner-а", async () => {
    const result = await service.evaluateRuntimeBudget(
      [
        { name: RaiToolName.QueryKnowledge, payload: { query: "A" } },
        { name: RaiToolName.QueryKnowledge, payload: { query: "B" } },
      ],
      actorContext,
    );

    expect(result.outcome).toBe("DEGRADE");
    expect(result.allowedToolNames).toEqual([RaiToolName.QueryKnowledge]);
    expect(result.droppedToolNames).toEqual([RaiToolName.QueryKnowledge]);
  });

  it("evaluateRuntimeBudget: DENY если WRITE tool сам по себе превышает budget owner-а", async () => {
    agentRegistry.getRegistry.mockResolvedValueOnce([
      {
        definition: { role: "agronomist" },
        runtime: {
          tools: [RaiToolName.GenerateTechMapDraft],
          maxTokens: 8000,
        },
      },
    ] as any);

    const result = await service.evaluateRuntimeBudget(
      [
        {
          name: RaiToolName.GenerateTechMapDraft,
          payload: { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" },
        },
      ],
      actorContext,
    );

    expect(result.outcome).toBe("DENY");
    expect(result.droppedToolNames).toEqual([RaiToolName.GenerateTechMapDraft]);
  });

  it("evaluateRuntimeBudget: replayMode обходит budget enforcement", async () => {
    const result = await service.evaluateRuntimeBudget(
      [
        {
          name: RaiToolName.GenerateTechMapDraft,
          payload: { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" },
        },
      ],
      { ...actorContext, replayMode: true },
    );

    expect(result.outcome).toBe("ALLOW");
    expect(result.source).toBe("replay_bypass");
  });
});
