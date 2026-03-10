import { BadRequestException, Injectable } from "@nestjs/common";
import { RuntimeGovernanceEventType } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RuntimeGovernanceEventService } from "../rai-chat/runtime-governance/runtime-governance-event.service";

type LifecycleState = "FROZEN" | "RETIRED";

@Injectable()
export class AgentLifecycleControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly governanceEvents: RuntimeGovernanceEventService,
  ) {}

  async setOverride(params: {
    companyId: string;
    role: string;
    state: LifecycleState;
    reason: string;
    userId?: string | null;
  }) {
    await this.prisma.agentLifecycleOverride.updateMany({
      where: {
        companyId: params.companyId,
        role: params.role,
        isActive: true,
      },
      data: {
        isActive: false,
        clearedAt: new Date(),
        clearedByUserId: params.userId ?? null,
      },
    });

    const override = await this.prisma.agentLifecycleOverride.create({
      data: {
        companyId: params.companyId,
        role: params.role,
        state: params.state,
        reason: params.reason,
        createdByUserId: params.userId ?? null,
      },
    });

    await this.governanceEvents.record({
      companyId: params.companyId,
      agentRole: params.role,
      eventType: RuntimeGovernanceEventType.LIFECYCLE_OVERRIDE_SET,
      metadata: {
        source: "manual_lifecycle_override",
        state: params.state,
        reason: params.reason,
        createdByUserId: params.userId ?? null,
      },
    });

    return override;
  }

  async clearOverride(params: {
    companyId: string;
    role: string;
    userId?: string | null;
  }) {
    const updated = await this.prisma.agentLifecycleOverride.updateMany({
      where: {
        companyId: params.companyId,
        role: params.role,
        isActive: true,
      },
      data: {
        isActive: false,
        clearedAt: new Date(),
        clearedByUserId: params.userId ?? null,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException({
        code: "NO_ACTIVE_LIFECYCLE_OVERRIDE",
        message: `Активный lifecycle override для роли ${params.role} не найден.`,
      });
    }

    await this.governanceEvents.record({
      companyId: params.companyId,
      agentRole: params.role,
      eventType: RuntimeGovernanceEventType.LIFECYCLE_OVERRIDE_CLEARED,
      metadata: {
        source: "manual_lifecycle_override_clear",
        clearedByUserId: params.userId ?? null,
      },
    });

    return { role: params.role, cleared: true };
  }
}
