import { NotFoundException } from "@nestjs/common";
import { BudgetControllerService } from "./budget-controller.service";
import { TechMapBudgetService } from "../../tech-map/economics/tech-map-budget.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { BudgetExceededError } from "./budget-exceeded.error";
import { RaiToolActorContext } from "../tools/rai-tools.types";

describe("BudgetControllerService", () => {
  let service: BudgetControllerService;
  let budgetService: jest.Mocked<TechMapBudgetService>;
  let prisma: any;

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
    service = new BudgetControllerService(budgetService, prisma);
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
});
