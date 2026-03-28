import { Test, TestingModule } from "@nestjs/testing";
import { YieldOrchestrator } from "./yield.orchestrator";
import { YieldService } from "./yield.service";
import { KpiService } from "./kpi.service";
import { DecisionService } from "../cmr/decision.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ConsultingDomainRules } from "./domain-rules/consulting.domain-rules.service";

describe("YieldOrchestrator", () => {
  let orchestrator: YieldOrchestrator;
  let yieldService: any;
  let kpiService: any;
  let decisionService: any;
  let domainRules: any;
  let prisma: any;

  beforeEach(async () => {
    yieldService = {
      createOrUpdateHarvestResult: jest.fn().mockResolvedValue({ id: "res-1" }),
    };
    kpiService = {
      calculatePlanKPI: jest
        .fn()
        .mockResolvedValue({ total_actual_cost: 10000 }),
    };
    decisionService = {
      logDecision: jest.fn().mockResolvedValue(undefined),
    };
    domainRules = {
      canEditHarvestResult: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      harvestPlan: {
        findUnique: jest.fn().mockResolvedValue({
          id: "plan-1",
          companyId: "c-1",
          techMaps: [{ seasonId: "season-1" }],
          activeBudgetPlan: {
            id: "budget-1",
            version: 2,
            totalActualAmount: 10000,
          },
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YieldOrchestrator,
        { provide: YieldService, useValue: yieldService },
        { provide: KpiService, useValue: kpiService },
        { provide: DecisionService, useValue: decisionService },
        { provide: ConsultingDomainRules, useValue: domainRules },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    orchestrator = module.get<YieldOrchestrator>(YieldOrchestrator);
  });

  it("should capture cost snapshot and delegate saving to YieldService", async () => {
    const dto = {
      planId: "plan-1",
      fieldId: "field-1",
      crop: "Wheat",
      actualYield: 50,
    } as any;

    const context = { userId: "u-1", role: "ADMIN", companyId: "c-1" } as any;

    await orchestrator.recordHarvest(dto, context);

    expect(prisma.harvestPlan.findUnique).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      include: {
        techMaps: { take: 1 },
        activeBudgetPlan: true,
      },
    });
    expect(domainRules.canEditHarvestResult).toHaveBeenCalledWith("plan-1");
    expect(yieldService.createOrUpdateHarvestResult).toHaveBeenCalledWith(
      dto,
      context,
    );
    expect(decisionService.logDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "HARVEST_RESULT_RECORDED",
        companyId: "c-1",
        userId: "u-1",
        metadata: expect.objectContaining({
          planId: "plan-1",
          actualYield: 50,
          costSnapshot: 10000,
        }),
      }),
    );
  });
});
