import { Test, TestingModule } from "@nestjs/testing";
import {
  ChangeOrderStatus,
  ChangeOrderType,
  TriggerOperator,
  TriggerType,
} from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { ChangeOrderService } from "../change-order/change-order.service";
import { TriggerEvaluationService } from "./trigger-evaluation.service";

describe("TriggerEvaluationService", () => {
  let service: TriggerEvaluationService;
  let prisma: any;
  let changeOrderService: any;

  beforeEach(async () => {
    prisma = {
      adaptiveRule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
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
        TriggerEvaluationService,
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

    service = module.get(TriggerEvaluationService);
  });

  it("evaluateCondition GT: value > threshold -> true", () => {
    expect(
      service.evaluateCondition(
        {
          parameter: "weatherTempC",
          operator: TriggerOperator.GT,
          threshold: 10,
        },
        { weatherTempC: 12 },
      ),
    ).toBe(true);
  });

  it("evaluateCondition GT: value <= threshold -> false", () => {
    expect(
      service.evaluateCondition(
        {
          parameter: "weatherTempC",
          operator: TriggerOperator.GT,
          threshold: 10,
        },
        { weatherTempC: 10 },
      ),
    ).toBe(false);
  });

  it("evaluateCondition: context не содержит parameter -> false", () => {
    expect(
      service.evaluateCondition(
        {
          parameter: "priceRubT",
          operator: TriggerOperator.GT,
          threshold: 1000,
        },
        {},
      ),
    ).toBe(false);
  });

  it("evaluateTriggers: правило с isActive = false не срабатывает", async () => {
    prisma.adaptiveRule.findMany.mockResolvedValue([]);
    prisma.adaptiveRule.updateMany.mockResolvedValue({ count: 0 });

    const result = await service.evaluateTriggers("tm-1", "company-1", {
      weatherTempC: 18,
    });

    expect(result.triggeredRules).toEqual([]);
    expect(changeOrderService.createChangeOrder).not.toHaveBeenCalled();
  });

  it("evaluateTriggers: условие выполнено -> createChangeOrder вызван с правильными params", async () => {
    prisma.adaptiveRule.findMany.mockResolvedValue([
      {
        id: "rule-1",
        techMapId: "tm-1",
        name: "Жара",
        triggerType: TriggerType.WEATHER,
        condition: {
          parameter: "weatherTempC",
          operator: TriggerOperator.GT,
          threshold: 25,
        },
        affectedOperationIds: ["op-1"],
        changeTemplate: {
          changeType: ChangeOrderType.SHIFT_DATE,
          reasonTemplate: "Температура {{weatherTempC}}",
        },
        companyId: "company-1",
        createdAt: new Date("2026-03-04T10:00:00.000Z"),
      },
    ]);
    prisma.adaptiveRule.findFirst.mockResolvedValue({
      id: "rule-1",
      techMapId: "tm-1",
      name: "Жара",
      triggerType: TriggerType.WEATHER,
      affectedOperationIds: ["op-1"],
      changeTemplate: {
        changeType: ChangeOrderType.SHIFT_DATE,
        reasonTemplate: "Температура {{weatherTempC}}",
      },
      techMap: {
        id: "tm-1",
        version: 4,
      },
    });
    changeOrderService.createChangeOrder.mockResolvedValue({ id: "co-1" });
    changeOrderService.routeForApproval.mockResolvedValue([{ id: "ap-1" }]);
    prisma.changeOrder.findUniqueOrThrow.mockResolvedValue({
      id: "co-1",
      status: ChangeOrderStatus.PENDING_APPROVAL,
    });
    prisma.adaptiveRule.updateMany.mockResolvedValue({ count: 1 });

    await service.evaluateTriggers("tm-1", "company-1", {
      weatherTempC: 30,
    });

    expect(changeOrderService.createChangeOrder).toHaveBeenCalledWith(
      "tm-1",
      expect.objectContaining({
        versionFrom: 4,
        changeType: ChangeOrderType.SHIFT_DATE,
        reason: "Температура 30",
      }),
      "company-1",
    );
  });

  it("applyTriggeredRule: созданный ChangeOrder в статусе PENDING_APPROVAL", async () => {
    prisma.adaptiveRule.findFirst.mockResolvedValue({
      id: "rule-1",
      techMapId: "tm-1",
      name: "Жара",
      triggerType: TriggerType.WEATHER,
      affectedOperationIds: ["op-1"],
      changeTemplate: {
        changeType: ChangeOrderType.SHIFT_DATE,
        reasonTemplate: "Температура {{weatherTempC}}",
      },
      techMap: {
        id: "tm-1",
        version: 1,
      },
    });
    changeOrderService.createChangeOrder.mockResolvedValue({ id: "co-1" });
    changeOrderService.routeForApproval.mockResolvedValue([{ id: "ap-1" }]);
    prisma.changeOrder.findUniqueOrThrow.mockResolvedValue({
      id: "co-1",
      status: ChangeOrderStatus.PENDING_APPROVAL,
    });

    await expect(
      service.applyTriggeredRule("rule-1", "company-1", {
        weatherTempC: 28,
      }),
    ).resolves.toEqual({
      id: "co-1",
      status: ChangeOrderStatus.PENDING_APPROVAL,
    });
  });
});
