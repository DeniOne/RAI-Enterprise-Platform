import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Approval,
  ApprovalDecision,
  ApproverRole,
  ChangeOrder,
  ChangeOrderStatus,
  Prisma,
} from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { TechMapStateMachine } from "../fsm/tech-map.fsm";
import { ChangeOrderCreateDto } from "../dto/change-order.dto";

@Injectable()
export class ChangeOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fsm: TechMapStateMachine,
  ) {}

  async createChangeOrder(
    techMapId: string,
    dto: ChangeOrderCreateDto,
    companyId: string,
  ): Promise<ChangeOrder> {
    const techMap = await this.prisma.techMap.findFirst({
      where: {
        id: techMapId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }

    return this.prisma.changeOrder.create({
      data: {
        techMapId,
        versionFrom: dto.versionFrom,
        changeType: dto.changeType,
        reason: dto.reason,
        diffPayload: dto.diffPayload as Prisma.InputJsonValue,
        deltaCostRub: dto.deltaCostRub,
        triggeredByObsId: dto.triggeredByObsId,
        createdByUserId: dto.createdByUserId,
        companyId,
        status: ChangeOrderStatus.DRAFT,
      },
    });
  }

  async routeForApproval(
    changeOrderId: string,
    companyId: string,
  ): Promise<Approval[]> {
    const changeOrder = await this.prisma.changeOrder.findFirst({
      where: {
        id: changeOrderId,
        companyId,
      },
      include: {
        techMap: {
          include: {
            cropZone: {
              include: {
                field: {
                  select: {
                    area: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!changeOrder) {
      throw new NotFoundException("ChangeOrder not found");
    }

    const contingency = this.calculateContingency(changeOrder.techMap);
    const approverRoles: ApproverRole[] = [ApproverRole.AGRONOMIST];
    if ((changeOrder.deltaCostRub ?? 0) > contingency) {
      approverRoles.push(ApproverRole.FINANCE);
    }

    return this.prisma.$transaction(async (tx) => {
      const approvals = [];
      for (const approverRole of approverRoles) {
        approvals.push(
          await tx.approval.create({
            data: {
              changeOrderId,
              approverRole,
              companyId,
            },
          }),
        );
      }

      await tx.changeOrder.update({
        where: { id: changeOrderId },
        data: { status: ChangeOrderStatus.PENDING_APPROVAL },
      });

      return approvals;
    });
  }

  async decideApproval(
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    comment: string | undefined,
    approverUserId: string,
    companyId: string,
  ): Promise<Approval> {
    const approval = await this.prisma.approval.findFirst({
      where: {
        id: approvalId,
        companyId,
      },
    });

    if (!approval) {
      throw new NotFoundException("Approval not found");
    }

    return this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        decision,
        comment,
        approverUserId,
        decidedAt: new Date(),
      },
    });
  }

  async applyChangeOrder(
    changeOrderId: string,
    companyId: string,
  ): Promise<{ techMapVersion: number }> {
    return this.prisma.$transaction(async (tx) => {
      const changeOrder = await tx.changeOrder.findFirst({
        where: {
          id: changeOrderId,
          companyId,
        },
        include: {
          approvals: true,
          techMap: true,
        },
      });

      if (!changeOrder) {
        throw new NotFoundException("ChangeOrder not found");
      }

      const hasRejected = changeOrder.approvals.some(
        (approval) => approval.decision === ApprovalDecision.REJECTED,
      );
      const hasPending = changeOrder.approvals.some(
        (approval) => approval.decision == null,
      );

      if (hasRejected || hasPending) {
        throw new BadRequestException(
          "ChangeOrder cannot be applied before all approvals are APPROVED",
        );
      }

      this.fsm.canTransition;

      const nextVersion = changeOrder.techMap.version + 1;
      await tx.techMap.update({
        where: { id: changeOrder.techMapId },
        data: {
          version: nextVersion,
        },
      });

      await tx.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          versionTo: nextVersion,
          appliedAt: new Date(),
          status: ChangeOrderStatus.APPROVED,
        },
      });

      return { techMapVersion: nextVersion };
    });
  }

  async rejectChangeOrder(
    changeOrderId: string,
    reason: string,
    companyId: string,
  ): Promise<ChangeOrder> {
    const changeOrder = await this.prisma.changeOrder.findFirst({
      where: {
        id: changeOrderId,
        companyId,
      },
    });

    if (!changeOrder) {
      throw new NotFoundException("ChangeOrder not found");
    }

    return this.prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        status: ChangeOrderStatus.REJECTED,
        appliedAt: null,
        reason,
      },
    });
  }

  private calculateContingency(techMap: {
    contingencyFundPct: number | null;
    budgetCapRubHa: number | null;
    cropZone: { field: { area: number } } | null;
  }): number {
    if (
      techMap.contingencyFundPct == null ||
      techMap.budgetCapRubHa == null ||
      !techMap.cropZone
    ) {
      return 0;
    }

    return (
      techMap.contingencyFundPct *
      techMap.budgetCapRubHa *
      techMap.cropZone.field.area
    );
  }
}
