import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  TechMapStatus,
  HarvestPlanStatus,
  UserRole,
  TechMap,
} from "@rai/prisma-client";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { TechMapActiveConflictError } from "./tech-map.errors";

@Injectable()
export class TechMapService {
  private readonly logger = new Logger(TechMapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrityGate: IntegrityGateService,
    private readonly fsm: TechMapStateMachine,
  ) {}

  async generateMap(harvestPlanId: string, seasonId: string) {
    const plan = await this.prisma.harvestPlan.findFirst({
      where: { id: harvestPlanId },
      include: {
        company: true,
      },
    });

    const season = await this.prisma.season.findFirst({
      where: { id: seasonId },
      include: { rapeseed: true },
    });

    if (!plan || !season) {
      throw new NotFoundException("Harvest Plan or Season not found");
    }
    if (season.companyId !== plan.companyId) {
      throw new BadRequestException("Harvest Plan and Season tenant mismatch");
    }

    // Get max version for this context
    const lastMap = await this.prisma.techMap.findFirst({
      where: {
        fieldId: season.fieldId,
        crop: season.rapeseed.name,
        seasonId,
        companyId: plan.companyId,
      },
      orderBy: { version: "desc" },
    });

    const nextVersion = lastMap ? lastMap.version + 1 : 1;

    return this.prisma.techMap.create({
      data: {
        seasonId,
        harvestPlanId: plan.id,
        companyId: plan.companyId,
        fieldId: season.fieldId,
        crop: season.rapeseed.name,
        status: TechMapStatus.DRAFT,
        version: nextVersion,
      },
    });
  }

  async transitionStatus(
    id: string,
    targetStatus: TechMapStatus,
    companyId: string,
    userRole: UserRole,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const map = await tx.techMap.findFirst({
        where: { id, companyId },
        include: {
          stages: {
            include: {
              operations: {
                include: {
                  resources: true,
                },
              },
            },
          },
        },
      });

      if (!map) {
        throw new NotFoundException("TechMap not found");
      }

      const current = map.status;

      // FSM Validation
      this.fsm.validate({
        currentStatus: current,
        targetStatus,
        userRole,
        userId,
      });

      // Integrity Gate & Snapshots for Active Transition
      const data: any = { status: targetStatus };

      if (targetStatus === TechMapStatus.ACTIVE) {
        await this.integrityGate.validateTechMapAdmission(map.id, companyId);

        data.approvedAt = new Date();
        data.operationsSnapshot = map.stages; // Simplified snapshotting
        data.resourceNormsSnapshot = map.stages.flatMap((s) =>
          s.operations.flatMap((o) => o.resources),
        );

        // Atomic link to HarvestPlan
        const activateLink = await tx.harvestPlan.updateMany({
          where: { id: map.harvestPlanId, companyId },
          data: { activeTechMapId: map.id },
        });
        if (activateLink.count !== 1) {
          throw new NotFoundException("Harvest Plan not found");
        }
      }

      // Cleanup link on ARCHIVED if it was ACTIVE
      if (
        targetStatus === TechMapStatus.ARCHIVED &&
        current === TechMapStatus.ACTIVE
      ) {
        const clearLink = await tx.harvestPlan.updateMany({
          where: { id: map.harvestPlanId, companyId },
          data: { activeTechMapId: null },
        });
        if (clearLink.count !== 1) {
          throw new NotFoundException("Harvest Plan not found");
        }
      }

      try {
        const updateResult = await tx.techMap.updateMany({
          where: { id, companyId },
          data,
        });
        if (updateResult.count !== 1) {
          throw new NotFoundException("TechMap not found");
        }
        return await tx.techMap.findFirstOrThrow({
          where: { id, companyId },
        });
      } catch (error: any) {
        // Catch P2002 for the Partial Index "unique_active_techmap"
        if (error.code === "P2002") {
          throw new TechMapActiveConflictError(
            `${map.fieldId}, ${map.crop}, ${map.seasonId}`,
          );
        }
        throw error;
      }
    });
  }

  async updateDraft(id: string, data: any, companyId: string) {
    const map = await this.prisma.techMap.findFirst({
      where: { id, companyId },
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    if (
      map.status !== TechMapStatus.DRAFT &&
      map.status !== TechMapStatus.REVIEW
    ) {
      throw new ForbiddenException(
        `Cannot edit TechMap in state ${map.status}`,
      );
    }

    return this.prisma.techMap.update({
      where: { id },
      data,
    });
  }

  async findAll(companyId: string) {
    return this.prisma.techMap.findMany({
      where: { companyId },
      include: {
        stages: {
          orderBy: { sequence: "asc" },
          include: {
            operations: {
              include: {
                resources: true,
              },
            },
          },
        },
      },
      orderBy: { version: "desc" },
    });
  }

  async findOne(id: string, companyId: string) {
    this.logger.log(`findOne called with id=${id}, companyId=${companyId}`);
    const map = await this.prisma.techMap.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        stages: {
          orderBy: { sequence: "asc" },
          include: {
            operations: {
              include: {
                resources: true,
              },
            },
          },
        },
      },
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    return map;
  }

  async findBySeason(seasonId: string, companyId: string) {
    const map = await this.prisma.techMap.findFirst({
      where: {
        seasonId,
        companyId,
      },
      include: {
        stages: {
          orderBy: { sequence: "asc" },
          include: {
            operations: {
              include: {
                resources: true,
              },
            },
          },
        },
      },
    });

    if (!map) {
      throw new NotFoundException("TechMap for this season not found");
    }

    return map;
  }
}
