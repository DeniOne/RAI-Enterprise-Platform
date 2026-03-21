import { Test } from "@nestjs/testing";
import { UserRole } from "@rai/prisma-client";
import { PendingActionsController } from "./pending-actions.controller";
import { PendingActionService } from "./security/pending-action.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";
import { RedisService } from "../../shared/redis/redis.service";

describe("PendingActionsController", () => {
  const tenantContextMock = {
    getCompanyId: jest.fn().mockReturnValue("company-1"),
  };
  const pendingActionServiceMock = {
    approveFinal: jest.fn(),
  };
  const raiToolsRegistryMock = {
    execute: jest.fn().mockResolvedValue({}),
  };
  const redisServiceMock = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    setNX: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(1),
  };

  let controller: PendingActionsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [PendingActionsController],
      providers: [
        {
          provide: TenantContextService,
          useValue: tenantContextMock,
        },
        {
          provide: PendingActionService,
          useValue: pendingActionServiceMock,
        },
        {
          provide: RaiToolsRegistry,
          useValue: raiToolsRegistryMock,
        },
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(PendingActionsController);
  });

  it("approveFinal executes approved action with typed writePolicy and no workflow_resume source", async () => {
    pendingActionServiceMock.approveFinal.mockResolvedValueOnce({
      id: "pa-1",
      companyId: "company-1",
      traceId: "trace-1",
      toolName: RaiToolName.RegisterCounterparty,
      payload: {
        inn: "2610000615",
        jurisdictionCode: "RU",
      },
      status: "APPROVED_FINAL",
      requestedByUserId: "user-1",
      approvedFirstBy: "user-2",
      approvedFinalBy: "user-3",
      createdAt: new Date("2026-03-21T00:00:00.000Z"),
      expiresAt: new Date("2026-03-21T01:00:00.000Z"),
    });

    await controller.approveFinal("pa-1", {
      id: "admin-1",
      userId: "admin-1",
      companyId: "company-1",
      role: UserRole.ADMIN,
    });

    expect(pendingActionServiceMock.approveFinal).toHaveBeenCalledWith(
      "pa-1",
      "company-1",
      "admin-1",
      UserRole.ADMIN,
    );
    expect(raiToolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.RegisterCounterparty,
      {
        inn: "2610000615",
        jurisdictionCode: "RU",
      },
      expect.objectContaining({
        companyId: "company-1",
        traceId: "trace-1",
        userId: "admin-1",
        userRole: UserRole.ADMIN,
        userConfirmed: true,
        approvedPendingActionId: "pa-1",
        writePolicy: {
          decision: "execute",
          reason: "workflow_resume_approved_pending_action",
        },
      }),
    );

    const actorContext = raiToolsRegistryMock.execute.mock.calls[0]?.[2];
    expect(actorContext.userIntentSource).toBeUndefined();
  });
});
