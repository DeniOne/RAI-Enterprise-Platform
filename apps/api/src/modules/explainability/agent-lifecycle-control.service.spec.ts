import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { RuntimeGovernanceEventType } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RuntimeGovernanceEventService } from "../rai-chat/runtime-governance/runtime-governance-event.service";
import { AgentLifecycleControlService } from "./agent-lifecycle-control.service";

describe("AgentLifecycleControlService", () => {
  let service: AgentLifecycleControlService;

  const prisma = {
    agentLifecycleOverride: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };
  const governanceEvents = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentLifecycleControlService,
        { provide: PrismaService, useValue: prisma },
        { provide: RuntimeGovernanceEventService, useValue: governanceEvents },
      ],
    }).compile();

    service = module.get(AgentLifecycleControlService);
  });

  it("создаёт FROZEN lifecycle override и пишет governance event", async () => {
    prisma.agentLifecycleOverride.updateMany.mockResolvedValue({ count: 0 });
    prisma.agentLifecycleOverride.create.mockResolvedValue({
      id: "ovr-1",
      role: "crm_agent",
      state: "FROZEN",
      reason: "manual freeze",
    });

    const result = await service.setOverride({
      companyId: "company-a",
      role: "crm_agent",
      state: "FROZEN",
      reason: "manual freeze",
      userId: "u-1",
    });

    expect(result.state).toBe("FROZEN");
    expect(governanceEvents.record).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-a",
        agentRole: "crm_agent",
        eventType: RuntimeGovernanceEventType.LIFECYCLE_OVERRIDE_SET,
      }),
    );
  });

  it("ошибается при clear без активного lifecycle override", async () => {
    prisma.agentLifecycleOverride.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.clearOverride({
        companyId: "company-a",
        role: "crm_agent",
        userId: "u-1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
