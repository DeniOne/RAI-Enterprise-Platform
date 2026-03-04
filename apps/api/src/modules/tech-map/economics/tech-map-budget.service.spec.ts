import { Test, TestingModule } from "@nestjs/testing";
import {
  BudgetCategory,
  ChangeOrderStatus,
  ChangeOrderType,
} from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { ChangeOrderService } from "../change-order/change-order.service";
import { TechMapBudgetService } from "./tech-map-budget.service";

describe("TechMapBudgetService", () => {
  let service: TechMapBudgetService;
  let prisma: any;
  let changeOrderService: any;

  beforeEach(async () => {
    prisma = {
      techMap: {
        findFirst: jest.fn(),
      },
      budgetLine: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
      },
      changeOrder: {
        findUniqueOrThrow: jest.fn(),
      },
    };
    changeOrderService = {
      createChangeOrder: jest.fn(),
      routeForApproval: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechMapBudgetService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ChangeOrderService,
          useValue: changeOrderService,
        },
      ],
    }).compile();

    service = module.get(TechMapBudgetService);
  });

  it("calculateBudget: 3 BudgetLine -> правильная сумма по категориям", async () => {
    prisma.techMap.findFirst.mockResolvedValue({
      id: "tm-1",
      budgetCapRubHa: 1000,
      field: { area: 10 },
    });
    prisma.budgetLine.findMany.mockResolvedValue([
      { category: BudgetCategory.SEEDS, plannedCost: 100, actualCost: 80 },
      { category: BudgetCategory.SEEDS, plannedCost: 150, actualCost: 120 },
      { category: BudgetCategory.FUEL, plannedCost: 70, actualCost: 70 },
    ]);

    const result = await service.calculateBudget("tm-1", "company-1");

    expect(result.totalPlanned).toBe(320);
    expect(result.totalActual).toBe(270);
    expect(result.byCategory.SEEDS).toEqual({ planned: 250, actual: 200 });
    expect(result.byCategory.FUEL).toEqual({ planned: 70, actual: 70 });
  });

  it("calculateBudget: totalActual > budgetCap * area -> withinCap false", async () => {
    prisma.techMap.findFirst.mockResolvedValue({
      id: "tm-1",
      budgetCapRubHa: 100,
      field: { area: 10 },
    });
    prisma.budgetLine.findMany.mockResolvedValue([
      { category: BudgetCategory.FUEL, plannedCost: 900, actualCost: 1200 },
    ]);

    const result = await service.calculateBudget("tm-1", "company-1");

    expect(result.withinCap).toBe(false);
    expect(result.overCap).toBe(200);
  });

  it("checkOverspend: actualCost <= planned*(1+tol) -> нет ChangeOrder", async () => {
    prisma.techMap.findFirst.mockResolvedValue({
      id: "tm-1",
      version: 3,
    });
    prisma.budgetLine.findMany.mockResolvedValue([
      {
        id: "bl-1",
        category: BudgetCategory.FUEL,
        plannedCost: 100,
        actualCost: 109,
        tolerancePct: 0.1,
      },
    ]);

    const result = await service.checkOverspend("tm-1", "company-1");

    expect(result.overspentLines).toEqual([]);
    expect(changeOrderService.createChangeOrder).not.toHaveBeenCalled();
  });

  it("checkOverspend: actualCost > planned*(1+tol) -> ChangeOrder создан, PENDING_APPROVAL", async () => {
    prisma.techMap.findFirst.mockResolvedValue({
      id: "tm-1",
      version: 4,
    });
    prisma.budgetLine.findMany.mockResolvedValue([
      {
        id: "bl-1",
        category: BudgetCategory.FUEL,
        plannedCost: 100,
        actualCost: 120,
        tolerancePct: 0.1,
      },
    ]);
    changeOrderService.createChangeOrder.mockResolvedValue({ id: "co-1" });
    changeOrderService.routeForApproval.mockResolvedValue([{ id: "approval-1" }]);
    prisma.changeOrder.findUniqueOrThrow.mockResolvedValue({
      id: "co-1",
      status: ChangeOrderStatus.PENDING_APPROVAL,
      changeType: ChangeOrderType.CHANGE_RATE,
    });

    const result = await service.checkOverspend("tm-1", "company-1");

    expect(changeOrderService.createChangeOrder).toHaveBeenCalledWith(
      "tm-1",
      expect.objectContaining({
        versionFrom: 4,
        changeType: "CHANGE_RATE",
        reason: "Перерасход по категории FUEL",
        deltaCostRub: 20,
      }),
      "company-1",
    );
    expect(result.createdChangeOrders).toEqual([
      expect.objectContaining({
        id: "co-1",
        status: ChangeOrderStatus.PENDING_APPROVAL,
      }),
    ]);
  });

  it("checkOverspend: SEEDS tolerance 5%, actual = planned*1.06 -> overspent", async () => {
    prisma.techMap.findFirst.mockResolvedValue({
      id: "tm-1",
      version: 2,
    });
    prisma.budgetLine.findMany.mockResolvedValue([
      {
        id: "bl-1",
        category: BudgetCategory.SEEDS,
        plannedCost: 100,
        actualCost: 106,
        tolerancePct: 0.05,
      },
    ]);
    changeOrderService.createChangeOrder.mockResolvedValue({ id: "co-1" });
    changeOrderService.routeForApproval.mockResolvedValue([{ id: "approval-1" }]);
    prisma.changeOrder.findUniqueOrThrow.mockResolvedValue({
      id: "co-1",
      status: ChangeOrderStatus.PENDING_APPROVAL,
    });

    const result = await service.checkOverspend("tm-1", "company-1");

    expect(result.overspentLines).toHaveLength(1);
    expect(changeOrderService.createChangeOrder).toHaveBeenCalled();
  });
});
