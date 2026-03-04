import { Test, TestingModule } from "@nestjs/testing";
import {
  ApprovalDecision,
  ApproverRole,
  ChangeOrderStatus,
  ChangeOrderType,
} from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { TechMapStateMachine } from "../fsm/tech-map.fsm";
import { ChangeOrderService } from "./change-order.service";

describe("ChangeOrderService", () => {
  let service: ChangeOrderService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      techMap: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      changeOrder: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      approval: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeOrderService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        TechMapStateMachine,
      ],
    }).compile();

    service = module.get(ChangeOrderService);
  });

  it("createChangeOrder создаёт CO со статусом DRAFT", async () => {
    prisma.techMap.findFirst.mockResolvedValue({ id: "tm-1" });
    prisma.changeOrder.create.mockResolvedValue({ status: ChangeOrderStatus.DRAFT });

    await service.createChangeOrder(
      "tm-1",
      {
        versionFrom: 1,
        changeType: ChangeOrderType.SHIFT_DATE,
        reason: "Погодное окно",
        diffPayload: {},
      },
      "company-1",
    );

    expect(prisma.changeOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        techMapId: "tm-1",
        companyId: "company-1",
        status: ChangeOrderStatus.DRAFT,
      }),
    });
  });

  it("routeForApproval: delta <= contingency -> 1 Approval", async () => {
    prisma.changeOrder.findFirst.mockResolvedValue({
      id: "co-1",
      deltaCostRub: 100,
      techMap: {
        contingencyFundPct: 0.1,
        budgetCapRubHa: 1000,
        cropZone: { field: { area: 10 } },
      },
    });
    prisma.approval.create.mockResolvedValue({ approverRole: ApproverRole.AGRONOMIST });

    const approvals = await service.routeForApproval("co-1", "company-1");

    expect(approvals).toHaveLength(1);
    expect(prisma.approval.create).toHaveBeenCalledTimes(1);
  });

  it("routeForApproval: delta > contingency -> 2 Approval", async () => {
    prisma.changeOrder.findFirst.mockResolvedValue({
      id: "co-1",
      deltaCostRub: 2000,
      techMap: {
        contingencyFundPct: 0.1,
        budgetCapRubHa: 1000,
        cropZone: { field: { area: 10 } },
      },
    });
    prisma.approval.create
      .mockResolvedValueOnce({ approverRole: ApproverRole.AGRONOMIST })
      .mockResolvedValueOnce({ approverRole: ApproverRole.FINANCE });

    const approvals = await service.routeForApproval("co-1", "company-1");

    expect(approvals).toHaveLength(2);
    expect(prisma.approval.create).toHaveBeenCalledTimes(2);
  });

  it("applyChangeOrder: все approvals approved -> version++", async () => {
    prisma.changeOrder.findFirst.mockResolvedValue({
      id: "co-1",
      techMapId: "tm-1",
      techMap: { version: 3 },
      approvals: [
        { decision: ApprovalDecision.APPROVED },
        { decision: ApprovalDecision.APPROVED },
      ],
    });

    await expect(
      service.applyChangeOrder("co-1", "company-1"),
    ).resolves.toEqual({ techMapVersion: 4 });
  });

  it("applyChangeOrder: есть REJECTED -> бросает ошибку", async () => {
    prisma.changeOrder.findFirst.mockResolvedValue({
      id: "co-1",
      techMapId: "tm-1",
      techMap: { version: 3 },
      approvals: [{ decision: ApprovalDecision.REJECTED }],
    });

    await expect(
      service.applyChangeOrder("co-1", "company-1"),
    ).rejects.toThrow("ChangeOrder cannot be applied");
  });

  it("rejectChangeOrder -> статус REJECTED, appliedAt = null", async () => {
    prisma.changeOrder.findFirst.mockResolvedValue({ id: "co-1" });
    prisma.changeOrder.update.mockResolvedValue({
      status: ChangeOrderStatus.REJECTED,
      appliedAt: null,
    });

    await service.rejectChangeOrder("co-1", "Причина", "company-1");

    expect(prisma.changeOrder.update).toHaveBeenCalledWith({
      where: { id: "co-1" },
      data: {
        status: ChangeOrderStatus.REJECTED,
        appliedAt: null,
        reason: "Причина",
      },
    });
  });
});
