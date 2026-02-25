import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TechMapValidator } from "./tech-map.validator";
import { UnitNormalizationService } from "./unit-normalization.service";
import { TechMap, TechMapStatus, Prisma } from "@rai/prisma-client";

@Injectable()
export class TechMapService {
  private readonly logger = new Logger(TechMapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: TechMapValidator,
    private readonly unitService: UnitNormalizationService,
  ) {}

  /**
   * Activates a TechMap, enforcing Phase 2 snapshots and immutability.
   */
  async activate(id: string, userId: string) {
    const techMap = await this.prisma.techMap.findUnique({
      where: { id }, // tenant-lint:ignore service entrypoint lacks tenant context; companyId is derived from fetched row
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

    if (!techMap) throw new NotFoundException("TechMap not found");

    // 1. Validate Phase 2 Rules
    this.validator.validateForActivation(techMap);

    // 2. Capture Snapshots (Asset Integrity)
    // In a real scenario, we might fetch current prices from an AssetRegistryService here.
    // For Phase 2.1, we snapshot the physical definitions to prevent "Unit Drift".
    const operationsSnapshot = this.serializeOperations(techMap);
    const resourceNormsSnapshot = this.serializeResources(techMap);

    // 3. Transactional Activation
    // - Set status ACTIVE
    // - Archive previous ACTIVE map for this field/crop/season (if exists) -> Logic requires care to not break existing executions?
    //   Actually, strictly speaking, specific executions link to specific versions.
    //   So we just mark this one as ACTIVE (isLatest=true).

    return this.prisma.$transaction(async (tx) => {
      // Archive others
      await tx.techMap.updateMany({
        where: {
          companyId: techMap.companyId,
          seasonId: techMap.seasonId,
          fieldId: techMap.fieldId,
          status: TechMapStatus.ACTIVE,
          id: { not: id },
        },
        data: { status: TechMapStatus.ARCHIVED, isLatest: false },
      });

      return tx.techMap.update({
        where: { id, companyId: techMap.companyId },
        data: {
          status: TechMapStatus.ACTIVE,
          isLatest: true,
          approvedAt: new Date(),
          operationsSnapshot: operationsSnapshot as Prisma.InputJsonValue,
          resourceNormsSnapshot: resourceNormsSnapshot as Prisma.InputJsonValue,
        },
      });
    });
  }

  /**
   * Creates a new draft version from an existing map.
   * Enforces Versioning on Edit policy.
   */
  async createNextVersion(sourceId: string, userId: string) {
    const source = await this.prisma.techMap.findUnique({
      where: { id: sourceId },
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
    if (!source) throw new NotFoundException("Source TechMap not found");

    // Logic to deep clone structure
    return this.prisma.$transaction(async (tx) => {
      // 1. Create new Map header
      const newMap = await tx.techMap.create({
        data: {
          harvestPlanId: source.harvestPlanId,
          seasonId: source.seasonId,
          fieldId: source.fieldId,
          crop: source.crop,
          companyId: source.companyId,
          version: source.version + 1,
          status: TechMapStatus.DRAFT,
          isLatest: false,
          soilType: source.soilType,
          moisture: source.moisture,
          precursor: source.precursor,
        },
      });

      // 2. Clone Stages, Operations, Resources
      for (const stage of source.stages) {
        const newStage = await tx.mapStage.create({
          data: {
            techMapId: newMap.id,
            name: stage.name,
            sequence: stage.sequence,
            aplStageId: stage.aplStageId,
          },
        });

        for (const op of stage.operations) {
          const newOp = await tx.mapOperation.create({
            data: {
              mapStageId: newStage.id,
              name: op.name,
              description: op.description,
              plannedStartTime: op.plannedStartTime,
              plannedEndTime: op.plannedEndTime,
              durationHours: op.durationHours,
              requiredMachineryType: op.requiredMachineryType,
            },
          });

          if (op.resources.length > 0) {
            await tx.mapResource.createMany({
              data: op.resources.map((r) => ({
                mapOperationId: newOp.id,
                companyId: newMap.companyId,
                type: r.type,
                name: r.name,
                amount: r.amount,
                unit: r.unit,
                costPerUnit: r.costPerUnit,
              })),
            });
          }
        }
      }

      return newMap;
    });
  }

  private serializeOperations(map: any) {
    return map.stages.map((s) => ({
      stage: s.name,
      ops: s.operations.map((o) => ({
        id: o.id,
        name: o.name,
        machinery: o.requiredMachineryType,
      })),
    }));
  }

  private serializeResources(map: any) {
    // Snapshot normalized values for rapid calculation
    return map.stages.flatMap((s) =>
      s.operations.flatMap((o) =>
        o.resources.map((r) => ({
          resourceId: r.id,
          name: r.name,
          originalAmount: r.amount,
          originalUnit: r.unit,
          normalized: this.unitService.normalize(r.amount, r.unit),
        })),
      ),
    );
  }
}
