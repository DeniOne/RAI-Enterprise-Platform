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
  Prisma,
} from "@rai/prisma-client";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { TechMapActiveConflictError } from "./tech-map.errors";
import {
  TechMapValidationEngine,
  ValidationReport,
  ValidationInput,
  OperationWithResources,
} from "./validation/techmap-validation.engine";
import {
  DAGValidationService,
  ValidationResult,
  OperationNode,
  OperationDependency,
} from "./validation/dag-validation.service";
import { TechMapValidator } from "./tech-map.validator";
import { UnitNormalizationService } from "./unit-normalization.service";

@Injectable()
export class TechMapService {
  private readonly logger = new Logger(TechMapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrityGate: IntegrityGateService,
    private readonly fsm: TechMapStateMachine,
    private readonly validationEngine: TechMapValidationEngine,
    private readonly dagValidation: DAGValidationService,
    private readonly validator: TechMapValidator,
    private readonly unitService: UnitNormalizationService,
  ) { }

  async generateMap(harvestPlanId: string, seasonId: string) {
    const plan = await this.prisma.harvestPlan.findFirst({
      where: { id: harvestPlanId },
      include: {
        company: true,
      },
    });

    const season = await this.prisma.season.findFirst({
      where: { id: seasonId },
    });

    if (!plan || !season) {
      throw new NotFoundException("Harvest Plan or Season not found");
    }
    if (season.companyId !== plan.companyId) {
      throw new BadRequestException("Harvest Plan and Season tenant mismatch");
    }

    // Get max version for this context
    const cropZone = await (this.prisma as any).cropZone.findFirst({
      where: {
        seasonId,
        companyId: plan.companyId,
      },
      orderBy: { createdAt: "asc" },
    });
    if (!cropZone) {
      throw new NotFoundException("CropZone not found for season/company");
    }

    const crop = String(cropZone.cropType ?? "RAPESEED").toLowerCase();

    const lastMap = await this.prisma.techMap.findFirst({
      where: {
        fieldId: cropZone.fieldId,
        crop,
        seasonId,
        companyId: plan.companyId,
      },
      orderBy: { version: "desc" },
    });

    const nextVersion = lastMap ? lastMap.version + 1 : 1;

    return this.prisma.techMap.create({
      data: {
        seasonId,
        cropZoneId: cropZone.id,
        harvestPlanId: plan.id,
        companyId: plan.companyId,
        fieldId: cropZone.fieldId,
        crop,
        status: TechMapStatus.DRAFT,
        version: nextVersion,
      },
    });
  }

  async createDraftStub(params: {
    fieldRef: string;
    seasonRef: string;
    crop: "rapeseed" | "sunflower";
    companyId: string;
  }) {
    const season = await this.prisma.season.findFirst({
      where: {
        id: params.seasonRef,
        companyId: params.companyId,
      },
    });

    if (!season) {
      throw new NotFoundException("Season not found for field/company scope");
    }

    const plan = await this.prisma.harvestPlan.findFirst({
      where: {
        companyId: params.companyId,
        seasonId: params.seasonRef,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!plan) {
      throw new NotFoundException("Harvest Plan not found for season/company");
    }

    let cropZone = await (this.prisma as any).cropZone.findFirst({
      where: {
        fieldId: params.fieldRef,
        seasonId: params.seasonRef,
        companyId: params.companyId,
      },
    });
    if (!cropZone) {
      cropZone = await (this.prisma as any).cropZone.create({
        data: {
          fieldId: params.fieldRef,
          seasonId: params.seasonRef,
          companyId: params.companyId,
          cropType: params.crop.toUpperCase(),
          varietyHybrid: null,
        },
      });
    }

    const lastMap = await this.prisma.techMap.findFirst({
      where: {
        fieldId: cropZone.fieldId,
        crop: params.crop,
        seasonId: params.seasonRef,
        companyId: params.companyId,
      },
      orderBy: { version: "desc" },
    });

    const nextVersion = lastMap ? lastMap.version + 1 : 1;

    // TODO: Sprint TechMap Intake - полноценная генерация.
    const draft = await this.prisma.techMap.create({
      data: {
        harvestPlanId: plan.id,
        seasonId: params.seasonRef,
        cropZoneId: cropZone.id,
        companyId: params.companyId,
        fieldId: cropZone.fieldId,
        crop: params.crop,
        status: TechMapStatus.DRAFT,
        version: nextVersion,
      },
    });

    return {
      draftId: draft.id,
      status: "DRAFT" as const,
      fieldRef: params.fieldRef,
      seasonRef: params.seasonRef,
      crop: params.crop,
      missingMust: ["soilType", "moisture", "precursor", "stages"],
      tasks: [] as [],
      assumptions: [] as [],
    };
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

  // ────────────────────────────────────────────────────────────
  // Sprint TM-2: Validation & Calculation Context
  // ────────────────────────────────────────────────────────────

  /**
   * Загружает полную техкарту с операциями/ресурсами/полем
   * и прогоняет через TechMapValidationEngine (7 правил).
   */
  async validateTechMap(
    techMapId: string,
    companyId: string,
    currentBBCH?: number | null,
  ): Promise<ValidationReport> {
    this.logger.log(`validateTechMap: techMapId=${techMapId}, companyId=${companyId}`);

    const map = await this.prisma.techMap.findFirst({
      where: { id: techMapId, companyId },
      include: {
        field: true,
        stages: {
          include: {
            operations: {
              include: {
                resources: {
                  include: {
                    inputCatalog: true,
                  },
                },
              },
            },
          },
        },
        cropZone: true,
      },
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    const allOps: OperationWithResources[] = map.stages.flatMap((stage) =>
      stage.operations.map((op) => ({
        id: op.id,
        operationType: (op as any).operationType ?? null,
        bbchWindowFrom: (op as any).bbchWindowFrom ?? null,
        bbchWindowTo: (op as any).bbchWindowTo ?? null,
        isCritical: (op as any).isCritical ?? false,
        actualStartDate: (op as any).actualStartDate ?? null,
        plannedStartDate: (op as any).plannedStartDate ?? null,
        plannedDurationHours: (op as any).plannedDurationHours ?? 8,
        dependencies: (() => {
          const raw = (op as any).dependencies;
          if (!Array.isArray(raw)) return [];
          return raw as OperationDependency[];
        })(),
        resources: op.resources.map((res) => ({
          id: res.id,
          plannedRate: (res as any).plannedRate ?? null,
          maxRate: (res as any).maxRate ?? null,
          inputCatalogId: (res as any).inputCatalogId ?? null,
          tankMixGroupId: (res as any).tankMixGroupId ?? null,
          inputCatalog: (res as any).inputCatalog ?? null,
        })),
      })),
    );

    const input: ValidationInput = {
      operations: allOps,
      field: {
        protectedZoneFlags: (map.field as any)?.protectedZoneFlags ?? null,
      },
      cropZone: {
        targetYieldTHa: (map.cropZone as any)?.targetYieldTHa ?? 0,
      },
      currentBBCH,
    };

    return this.validationEngine.validate(input);
  }

  /**
   * Загружает операции техкарты и проверяет DAG на отсутствие циклов.
   */
  async validateDAG(
    techMapId: string,
    companyId: string,
  ): Promise<ValidationResult> {
    this.logger.log(`validateDAG: techMapId=${techMapId}, companyId=${companyId}`);

    const map = await this.prisma.techMap.findFirst({
      where: { id: techMapId, companyId },
      include: {
        stages: {
          include: {
            operations: true,
          },
        },
      },
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    const nodes: OperationNode[] = map.stages.flatMap((stage) =>
      stage.operations.map((op) => {
        const raw = (op as any).dependencies;
        const deps: OperationDependency[] = Array.isArray(raw) ? raw : [];
        return {
          id: op.id,
          plannedDurationHours: (op as any).plannedDurationHours ?? 8,
          isCritical: (op as any).isCritical ?? false,
          dependencies: deps,
        };
      }),
    );

    return this.dagValidation.validateAcyclicity(nodes);
  }

  /**
   * Загружает контекст для агрономических калькуляторов:
   * SoilProfile и RegionProfile через CropZone.
   */
  async getCalculationContext(
    cropZoneId: string,
    companyId: string,
  ) {
    this.logger.log(`getCalculationContext: cropZoneId=${cropZoneId}, companyId=${companyId}`);

    const cropZone = await (this.prisma as any).cropZone?.findFirst({
      where: { id: cropZoneId, companyId },
      include: {
        soilProfile: true,
        regionProfile: true,
      },
    });

    if (!cropZone) {
      throw new NotFoundException("CropZone not found");
    }

    return {
      cropZone: {
        id: cropZone.id,
        targetYieldTHa: cropZone.targetYieldTHa,
        crop: cropZone.crop,
      },
      soilProfile: cropZone.soilProfile ?? null,
      regionProfile: cropZone.regionProfile ?? null,
    };
  }

  /**
   * Activates a TechMap, enforcing Phase 2 snapshots and immutability.
   * companyId is required for tenant isolation (ADR-013).
   */
  async activate(id: string, userId: string, companyId?: string) {
    const techMap = await this.prisma.techMap.findUnique({
      where: { id },
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

    // Tenant isolation: verify caller's companyId matches the entity (ADR-013)
    if (companyId && techMap.companyId !== companyId) {
      throw new NotFoundException("TechMap not found");
    }

    // 1. Validate Phase 2 Rules
    this.validator.validateForActivation(techMap);

    // 2. Capture Snapshots (Asset Integrity)
    const operationsSnapshot = this.serializeOperations(techMap);
    const resourceNormsSnapshot = this.serializeResources(techMap);

    // 3. Transactional Activation
    return this.prisma.$transaction(async (tx) => {
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
      const newMap = await tx.techMap.create({
        data: {
          harvestPlanId: source.harvestPlanId,
          seasonId: source.seasonId,
          cropZoneId: source.cropZoneId!,
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
