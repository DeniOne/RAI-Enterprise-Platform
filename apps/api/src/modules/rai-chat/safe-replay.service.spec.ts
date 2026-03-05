import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SupervisorAgent } from "./supervisor-agent.service";
import { SafeReplayService } from "./safe-replay.service";

describe("SafeReplayService", () => {
  let service: SafeReplayService;
  let prisma: PrismaService;
  let supervisor: SupervisorAgent;

  const companyId = "company-a";
  const otherCompanyId = "company-b";
  const traceId = "trace-1";

  beforeEach(async () => {
    const orchestrateMock = jest.fn().mockResolvedValue({
      text: "replay response",
      widgets: [],
      traceId: "tr_replay_new",
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafeReplayService,
        {
          provide: PrismaService,
          useValue: {
            aiAuditEntry: { findFirst: jest.fn() },
          },
        },
        {
          provide: SupervisorAgent,
          useValue: { orchestrate: orchestrateMock },
        },
      ],
    }).compile();

    service = module.get(SafeReplayService);
    prisma = module.get(PrismaService);
    supervisor = module.get(SupervisorAgent);
  });

  it("throws NotFound when trace has no entries", async () => {
    (prisma.aiAuditEntry.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.runReplay(traceId, companyId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("throws Forbidden when trace belongs to another tenant", async () => {
    (prisma.aiAuditEntry.findFirst as jest.Mock).mockResolvedValue({
      id: "e1",
      traceId,
      companyId: otherCompanyId,
      metadata: null,
    });

    await expect(service.runReplay(traceId, companyId)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("throws BadRequest when replayInput is missing", async () => {
    (prisma.aiAuditEntry.findFirst as jest.Mock).mockResolvedValue({
      id: "e1",
      traceId,
      companyId,
      metadata: {},
    });

    await expect(service.runReplay(traceId, companyId)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.runReplay(traceId, companyId)).rejects.toThrow(
      "REPLAY_INPUT_UNAVAILABLE",
    );
  });

  it("initializes new trace from old input and returns replayTraceId and response", async () => {
    (prisma.aiAuditEntry.findFirst as jest.Mock).mockResolvedValue({
      id: "e1",
      traceId,
      companyId,
      metadata: {
        replayInput: {
          message: "original user message",
          workspaceContext: { route: "/techmap" },
        },
      },
    });

    const result = await service.runReplay(traceId, companyId, "user-1");

    expect(result.replayTraceId).toBe("tr_replay_new");
    expect(result.response.text).toBe("replay response");
    expect(supervisor.orchestrate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "original user message",
        workspaceContext: { route: "/techmap" },
      }),
      companyId,
      "user-1",
      { replayMode: true },
    );
  });
});
