import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionStatus } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { ChangeOrderService } from "./change-order/change-order.service";
import { ControlPointService } from "./control-point.service";
import { EvidenceService } from "./evidence/evidence.service";

describe("ControlPointService", () => {
  let service: ControlPointService;
  let prisma: any;
  let evidenceService: { validateOperationCompletion: jest.Mock };
  let changeOrderService: {
    createChangeOrder: jest.Mock;
    routeForApproval: jest.Mock;
  };
  let deviationService: { createReview: jest.Mock };

  beforeEach(async () => {
    prisma = {
      controlPoint: {
        findFirst: jest.fn(),
      },
      mapOperation: {
        findFirst: jest.fn(),
      },
      fieldObservation: {
        findFirst: jest.fn(),
      },
      evidence: {
        count: jest.fn(),
      },
      executionRecord: {
        upsert: jest.fn(),
      },
      decisionGate: {
        create: jest.fn(),
        update: jest.fn(),
      },
      recommendation: {
        create: jest.fn(),
      },
      controlPointOutcomeExplanation: {
        create: jest.fn(),
      },
      ruleEvaluationTrace: {
        create: jest.fn(),
      },
    };

    evidenceService = {
      validateOperationCompletion: jest.fn(),
    };
    changeOrderService = {
      createChangeOrder: jest.fn(),
      routeForApproval: jest.fn(),
    };
    deviationService = {
      createReview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlPointService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: EvidenceService,
          useValue: evidenceService,
        },
        {
          provide: ChangeOrderService,
          useValue: changeOrderService,
        },
        {
          provide: DeviationService,
          useValue: deviationService,
        },
      ],
    }).compile();

    service = module.get(ControlPointService);

    prisma.controlPoint.findFirst.mockResolvedValue({
      id: "cp-1",
      mapStageId: "stage-1",
      name: "Контроль розетки",
      mapStage: {
        id: "stage-1",
        name: "Осенний уход",
      },
      techMap: {
        id: "tm-1",
        version: 3,
        seasonId: "season-1",
        harvestPlanId: "plan-1",
        status: "ACTIVE",
      },
    });
  });

  it("blocker outcome без evidence-ссылки отклоняется", async () => {
    await expect(
      service.recordOutcome(
        "tm-1",
        "cp-1",
        {
          outcome: "BLOCKED",
          severity: "BLOCKER",
          summary: "Контроль не пройден.",
        },
        "company-1",
        "user-1",
      ),
    ).rejects.toThrow(
      "Для blocker/critical control-point outcome требуется operationId или observationId с evidence.",
    );
  });

  it("critical outcome создаёт gate, recommendation, deviation, change order и execution record", async () => {
    prisma.mapOperation.findFirst.mockResolvedValue({
      id: "op-1",
    });
    evidenceService.validateOperationCompletion.mockResolvedValue({
      isComplete: true,
      missingEvidenceTypes: [],
      presentEvidenceTypes: ["PHOTO"],
    });
    prisma.executionRecord.upsert.mockResolvedValue({
      id: "exec-1",
      status: ExecutionStatus.DONE,
    });
    prisma.decisionGate.create.mockResolvedValue({
      id: "gate-1",
      status: "OPEN",
    });
    prisma.recommendation.create.mockResolvedValue({
      id: "rec-1",
    });
    deviationService.createReview.mockResolvedValue({
      id: "dev-1",
    });
    changeOrderService.createChangeOrder.mockResolvedValue({
      id: "co-1",
    });
    changeOrderService.routeForApproval.mockResolvedValue([
      { id: "approval-1" },
    ]);
    prisma.controlPointOutcomeExplanation.create.mockResolvedValue({
      id: "cpoe-1",
      summary: "Контроль не пройден.",
    });
    prisma.ruleEvaluationTrace.create.mockResolvedValue({
      id: "trace-1",
    });

    const result = await service.recordOutcome(
      "tm-1",
      "cp-1",
      {
        outcome: "FAIL",
        severity: "CRITICAL",
        summary: "Контроль не пройден.",
        operationId: "op-1",
        completeOperation: true,
        decisiveAction: true,
        changeOrder: {
          changeType: "CHANGE_INPUT",
          diffPayload: {
            replacement: "new-input",
          },
        },
      },
      "company-1",
      "user-1",
    );

    expect(prisma.executionRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          operationId: "op-1",
          status: ExecutionStatus.DONE,
        }),
      }),
    );
    expect(prisma.decisionGate.create).toHaveBeenCalled();
    expect(prisma.recommendation.create).toHaveBeenCalled();
    expect(deviationService.createReview).toHaveBeenCalled();
    expect(changeOrderService.createChangeOrder).toHaveBeenCalledWith(
      "tm-1",
      expect.objectContaining({
        versionFrom: 3,
        triggeredByObsId: undefined,
        createdByUserId: "user-1",
      }),
      "company-1",
    );
    expect(changeOrderService.routeForApproval).toHaveBeenCalledWith(
      "co-1",
      "company-1",
    );
    expect(prisma.controlPointOutcomeExplanation.create).toHaveBeenCalled();
    expect(prisma.ruleEvaluationTrace.create).toHaveBeenCalled();
    expect(result.decisionGate?.id).toBe("gate-1");
    expect(result.changeOrder?.id).toBe("co-1");
    expect(result.executionRecord?.id).toBe("exec-1");
  });
});
