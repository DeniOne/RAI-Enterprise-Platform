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
  CropType,
} from "@rai/prisma-client";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { TechMapActiveConflictError } from "./tech-map.errors";
import {
  TechMapValidationEngine,
  ValidationReport,
} from "./validation/techmap-validation.engine";
import {
  DAGValidationService,
  ValidationResult,
} from "./validation/dag-validation.service";
import { TechMapValidator } from "./tech-map.validator";
import { UnitNormalizationService } from "./unit-normalization.service";
import {
  buildDagNodesFromTechMap,
  buildOperationsSnapshot,
  buildResourceNormsSnapshot,
  buildValidationInputFromTechMap,
} from "../../shared/tech-map/tech-map-mapping.helpers";
import {
  TECH_MAP_DAG_INCLUDE,
  TECH_MAP_CANONICAL_DRAFT_INCLUDE,
  TECH_MAP_STAGES_WITH_RESOURCES_INCLUDE,
  TECH_MAP_STAGES_WITH_RESOURCES_NO_ORDER_INCLUDE,
  TECH_MAP_VALIDATION_INCLUDE,
} from "../../shared/tech-map/tech-map-prisma-includes";
import {
  buildTechMapCanonicalDraftFromTechMap,
  type TechMapCanonicalDraftSource,
} from "../../shared/tech-map/tech-map-canonical-draft.helpers";
import {
  buildTechMapPersistenceBoundary,
  buildTechMapPersistenceBoundaryFromStatus,
  type TechMapPersistenceBoundary,
  isHeadDraftWritablePersistedTechMapStatus,
} from "../../shared/tech-map/tech-map-governed-persistence.helpers";
import {
  buildTechMapApprovalSnapshotRecord,
  buildTechMapPublicationLockRecord,
  buildTechMapReviewSnapshotRecord,
} from "../../shared/tech-map/tech-map-governed-persistence-records.helpers";
import {
  buildTechMapRuntimeAdoptionSnapshot,
} from "../../shared/tech-map/tech-map-runtime-adoption.helpers";
import {
  buildTechMapClarifyBatch,
  buildTechMapClarifyAuditTrail,
  buildTechMapWorkflowResumeState,
} from "../../shared/tech-map/tech-map-governed-clarify.helpers";
import { assessTechMapGovernedDraftContext } from "../../shared/tech-map/tech-map-governed-draft.helpers";
import { isEditablePersistedTechMapStatus } from "../../shared/tech-map/tech-map-governed-status.helpers";
import type { TechMapWorkflowOrchestrationTrace } from "../../shared/tech-map/tech-map-workflow-orchestrator.types";
import { TechMapWorkflowOrchestratorService } from "./tech-map-workflow-orchestrator.service";
import {
  buildTechMapBlueprint,
  resolveBlueprintBaseDate,
  resolveOperationWindow,
} from "./tech-map-blueprint";

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
    private readonly workflowOrchestrator: TechMapWorkflowOrchestratorService,
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
    if (plan.seasonId && plan.seasonId !== seasonId) {
      throw new BadRequestException("Harvest Plan is linked to another season");
    }
    if (!season.fieldId) {
      throw new BadRequestException(
        "Season must be linked to a field before TechMap generation",
      );
    }

    const cropZone = await this.ensureCropZone({
      companyId: plan.companyId,
      seasonId,
      fieldId: season.fieldId,
      cropVarietyId: (season as any).cropVarietyId ?? null,
      targetYieldTHa:
        season.expectedYield ??
        plan.optValue ??
        plan.baselineValue ??
        plan.maxValue ??
        null,
    });

    const crop = String(cropZone.cropType ?? CropType.RAPESEED).toLowerCase();

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

    const blueprintInput = {
      crop,
      seasonYear: season.year,
      seasonStartDate: season.startDate,
      targetYieldTHa: cropZone.targetYieldTHa,
    };
    const blueprint = buildTechMapBlueprint(blueprintInput);
    const seasonBaseDate = resolveBlueprintBaseDate(blueprintInput);

    return this.prisma.$transaction(async (tx) => {
      await tx.techMap.updateMany({
        where: {
          fieldId: cropZone.fieldId,
          crop,
          seasonId,
          companyId: plan.companyId,
        },
        data: {
          isLatest: false,
        },
      });

      if (!plan.seasonId) {
        await tx.harvestPlan.updateMany({
          where: {
            id: plan.id,
            companyId: plan.companyId,
          },
          data: {
            seasonId,
          },
        });
      }

      const techMap = await tx.techMap.create({
        data: {
          seasonId,
          cropZoneId: cropZone.id,
          harvestPlanId: plan.id,
          companyId: plan.companyId,
          fieldId: cropZone.fieldId,
          crop: blueprint.crop,
          status: TechMapStatus.DRAFT,
          version: nextVersion,
          isLatest: true,
          generationMetadata: blueprint.generationMetadata as Prisma.InputJsonValue,
        },
      });

      for (const stage of blueprint.stages) {
        const createdStage = await tx.mapStage.create({
          data: {
            techMapId: techMap.id,
            name: stage.name,
            sequence: stage.sequence,
            aplStageId: stage.aplStageId,
          },
        });

        for (const operation of stage.operations) {
          const { plannedStartTime, plannedEndTime } = resolveOperationWindow(
            seasonBaseDate,
            operation.startOffsetDays,
            operation.durationHours,
          );

          const createdOperation = await tx.mapOperation.create({
            data: {
              mapStageId: createdStage.id,
              name: operation.name,
              description: operation.description,
              plannedStartTime,
              plannedEndTime,
              durationHours: operation.durationHours,
              isCritical: operation.isCritical ?? false,
            },
          });

          if (operation.resources.length > 0) {
            await tx.mapResource.createMany({
              data: operation.resources.map((resource) => ({
                mapOperationId: createdOperation.id,
                type: resource.type,
                name: resource.name,
                amount: resource.amount,
                unit: resource.unit,
                costPerUnit: resource.costPerUnit,
              })),
            });
          }
        }
      }

      return tx.techMap.findFirstOrThrow({
        where: {
          id: techMap.id,
          companyId: plan.companyId,
        },
        include: TECH_MAP_STAGES_WITH_RESOURCES_INCLUDE,
      });
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
      include: {
        field: {
          select: {
            clientId: true,
            protectedZoneFlags: true,
            drainageClass: true,
            slopePercent: true,
          },
        },
      },
    });

    if (!season) {
      throw new NotFoundException("Season not found for field/company scope");
    }
    if (!season.fieldId) {
      throw new BadRequestException(
        "Season must be linked to a field before TechMap generation",
      );
    }
    if (season.fieldId !== params.fieldRef) {
      throw new BadRequestException(
        "Field context does not match the selected season",
      );
    }

    const plan = await this.prisma.harvestPlan.findFirst({
      where: {
        companyId: params.companyId,
        seasonId: params.seasonRef,
      },
      include: {
        performanceContract: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!plan) {
      throw new NotFoundException("Harvest Plan not found for season/company");
    }

    const cropType = params.crop.toUpperCase();
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
          cropType,
          varietyHybrid: null,
        },
      });
    } else if (cropZone.cropType !== cropType) {
      cropZone = await (this.prisma as any).cropZone.update({
        where: { id: cropZone.id },
        data: {
          cropType,
        },
      });
    }

    const draft = await this.generateMap(plan.id, params.seasonRef);
    const crop: "rapeseed" | "sunflower" =
      String(draft.crop ?? params.crop).toLowerCase() === "sunflower"
        ? "sunflower"
        : "rapeseed";
    const [
      latestSoilProfile,
      previousTechMap,
      harvestResultCount,
      regionProfile,
      inputCatalogCount,
    ] = await Promise.all([
      this.prisma.soilProfile.findFirst({
        where: {
          fieldId: params.fieldRef,
          companyId: params.companyId,
        },
        orderBy: {
          sampleDate: "desc",
        },
      }),
      this.prisma.techMap.findFirst({
        where: {
          companyId: params.companyId,
          fieldId: params.fieldRef,
          id: {
            not: draft.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.harvestResult.count({
        where: {
          companyId: params.companyId,
          fieldId: params.fieldRef,
        },
      }),
      this.prisma.regionProfile.findFirst({
        where: {
          OR: [
            { companyId: params.companyId },
            { companyId: null },
          ],
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      this.prisma.inputCatalog.count({
        where: {
          OR: [
            { companyId: params.companyId },
            { companyId: null },
          ],
        },
      }),
    ]);
    const governedAssessment = assessTechMapGovernedDraftContext({
      legalEntityId: params.companyId,
      farmId: season.farmId ?? plan.accountId ?? season.field?.clientId ?? null,
      fieldIds: season.fieldId ? [season.fieldId] : [],
      seasonId: params.seasonRef,
      cropCode: crop,
      predecessorCrop: cropZone.predecessorCrop ?? null,
      soilProfileSampleDate: latestSoilProfile?.sampleDate ?? null,
      targetYieldProfile:
        cropZone.targetYieldTHa ??
        season.expectedYield ??
        plan.optValue ??
        plan.baselineValue ??
        null,
      hasFieldHistory: Boolean(previousTechMap) || harvestResultCount > 0,
      seedOrHybrid:
        cropZone.varietyHybrid ??
        cropZone.cropVarietyId ??
        season.cropVarietyId ??
        null,
      hasMachineryProfile: false,
      hasLaborOrContractorProfile: false,
      hasInputAvailability: false,
      hasBudgetPolicy:
        plan.minValue != null ||
        plan.optValue != null ||
        plan.maxValue != null ||
        plan.baselineValue != null,
      hasPriceBookVersion: false,
      hasCurrencyTaxMode: false,
      hasWeatherNormals: Boolean(regionProfile),
      hasForecastWindow: false,
      hasIrrigationOrWaterConstraints: Boolean(
        season.field?.protectedZoneFlags ??
        season.field?.drainageClass ??
        season.field?.slopePercent,
      ),
      hasPreviousTechMap: Boolean(previousTechMap),
      hasExecutionHistory: Boolean(previousTechMap) || harvestResultCount > 0,
      hasPastOutcomes:
        season.actualYield != null || harvestResultCount > 0,
      methodologyProfileId: this.resolveDraftMethodologyProfileId(
        draft.generationMetadata,
      ),
      hasAllowedInputCatalogVersion: inputCatalogCount > 0,
      contractMode: plan.performanceContract?.modelType ?? null,
      hasTargetKpiPolicy: Boolean(plan.targetMetric ?? plan.period),
    });

    return this.buildGovernedDraftClarifyResult({
      draft,
      plan,
      season,
      cropZone,
      latestSoilProfile,
      previousTechMap,
      harvestResultCount,
      regionProfile,
      inputCatalogCount,
      fieldRef: params.fieldRef,
      seasonRef: params.seasonRef,
      resolvedSlotKeys: [],
      resumeRequested: false,
      baselineContextHash: `tech-map:${draft.id}:${params.fieldRef}:${params.seasonRef}`,
      governedAssessment,
    });
  }

  async resumeDraftClarify(
    id: string,
    companyId: string,
    params: {
      resolvedSlotKeys?: string[];
      resumeRequested?: boolean;
    } = {},
  ) {
    const draft = await this.prisma.techMap.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        harvestPlan: {
          include: {
            performanceContract: true,
          },
        },
        season: {
          include: {
            field: {
              select: {
                clientId: true,
                protectedZoneFlags: true,
                drainageClass: true,
                slopePercent: true,
              },
            },
          },
        },
        cropZone: {
          include: {
            season: {
              include: {
                field: {
                  select: {
                    clientId: true,
                    protectedZoneFlags: true,
                    drainageClass: true,
                    slopePercent: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!draft) {
      throw new NotFoundException("TechMap not found");
    }
    if (!isEditablePersistedTechMapStatus(draft.status)) {
      throw new ForbiddenException(
        `Cannot resume clarify for TechMap in state ${draft.status}`,
      );
    }

    const season = draft.season ?? draft.cropZone?.season ?? null;
    const plan = draft.harvestPlan;
    const cropZone = draft.cropZone;

    if (!season || !plan || !cropZone) {
      throw new BadRequestException(
        "Clarify resume requires linked season, harvest plan and crop zone",
      );
    }

    const [
      latestSoilProfile,
      previousTechMap,
      harvestResultCount,
      regionProfile,
      inputCatalogCount,
    ] = await Promise.all([
      this.prisma.soilProfile.findFirst({
        where: {
          fieldId: cropZone.fieldId,
          companyId,
        },
        orderBy: {
          sampleDate: "desc",
        },
      }),
      this.prisma.techMap.findFirst({
        where: {
          companyId,
          fieldId: cropZone.fieldId,
          id: {
            not: draft.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.harvestResult.count({
        where: {
          companyId,
          fieldId: cropZone.fieldId,
        },
      }),
      this.prisma.regionProfile.findFirst({
        where: {
          OR: [
            { companyId },
            { companyId: null },
          ],
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      this.prisma.inputCatalog.count({
        where: {
          OR: [
            { companyId },
            { companyId: null },
          ],
        },
      }),
    ]);

    const governedAssessment = assessTechMapGovernedDraftContext({
      legalEntityId: companyId,
      farmId: season.farmId ?? plan.accountId ?? season.field?.clientId ?? null,
      fieldIds: cropZone.fieldId ? [cropZone.fieldId] : [],
      seasonId: draft.seasonId ?? cropZone.seasonId,
      cropCode: String(draft.crop ?? cropZone.cropType ?? "rapeseed").toLowerCase(),
      predecessorCrop: cropZone.predecessorCrop ?? null,
      soilProfileSampleDate: latestSoilProfile?.sampleDate ?? null,
      targetYieldProfile:
        cropZone.targetYieldTHa ??
        season.expectedYield ??
        plan.optValue ??
        plan.baselineValue ??
        null,
      hasFieldHistory: Boolean(previousTechMap) || harvestResultCount > 0,
      seedOrHybrid:
        cropZone.varietyHybrid ??
        cropZone.cropVarietyId ??
        season.cropVarietyId ??
        null,
      hasMachineryProfile: false,
      hasLaborOrContractorProfile: false,
      hasInputAvailability: false,
      hasBudgetPolicy:
        plan.minValue != null ||
        plan.optValue != null ||
        plan.maxValue != null ||
        plan.baselineValue != null,
      hasPriceBookVersion: false,
      hasCurrencyTaxMode: false,
      hasWeatherNormals: Boolean(regionProfile),
      hasForecastWindow: false,
      hasIrrigationOrWaterConstraints: Boolean(
        season.field?.protectedZoneFlags ??
        season.field?.drainageClass ??
        season.field?.slopePercent,
      ),
      hasPreviousTechMap: Boolean(previousTechMap),
      hasExecutionHistory: Boolean(previousTechMap) || harvestResultCount > 0,
      hasPastOutcomes:
        season.actualYield != null || harvestResultCount > 0,
      methodologyProfileId: this.resolveDraftMethodologyProfileId(
        draft.generationMetadata,
      ),
      hasAllowedInputCatalogVersion: inputCatalogCount > 0,
      contractMode: plan.performanceContract?.modelType ?? null,
      hasTargetKpiPolicy: Boolean(plan.targetMetric ?? plan.period),
    });

    return this.buildGovernedDraftClarifyResult({
      draft,
      plan,
      season,
      cropZone,
      latestSoilProfile,
      previousTechMap,
      harvestResultCount,
      regionProfile,
      inputCatalogCount,
      fieldRef: cropZone.fieldId,
      seasonRef: cropZone.seasonId,
      resolvedSlotKeys: params.resolvedSlotKeys ?? [],
      resumeRequested: params.resumeRequested ?? true,
      baselineContextHash: `tech-map:${draft.id}:${cropZone.fieldId}:${cropZone.seasonId}`,
      governedAssessment,
    });
  }

  private buildGovernedDraftClarifyResult(params: {
    draft: any;
    plan: any;
    season: any;
    cropZone: any;
    latestSoilProfile: any;
    previousTechMap: any;
    harvestResultCount: number;
    regionProfile: any;
    inputCatalogCount: number;
    fieldRef: string;
    seasonRef: string;
    resolvedSlotKeys: string[];
    resumeRequested: boolean;
    baselineContextHash: string;
    governedAssessment: ReturnType<typeof assessTechMapGovernedDraftContext>;
  }) {
    const crop: "rapeseed" | "sunflower" =
      String(params.draft.crop ?? params.cropZone?.cropType ?? "rapeseed").toLowerCase() === "sunflower"
        ? "sunflower"
        : "rapeseed";
    const workflowId = `tech-map:${params.draft.id}`;
    const clarifyBatch = buildTechMapClarifyBatch({
      workflow_id: workflowId,
      draft_id: params.draft.id,
      readiness: params.governedAssessment.readiness,
      next_readiness_target: params.governedAssessment.nextReadinessTarget,
      clarify_items: params.governedAssessment.clarifyItems,
      blocking_phase: "MISSING_CONTEXT_TRIAGE",
      resolved_slot_keys: params.resolvedSlotKeys,
    });
    const workflowResumeState = buildTechMapWorkflowResumeState({
      workflow_id: workflowId,
      draft_id: params.draft.id,
      readiness: params.governedAssessment.readiness,
      next_readiness_target: params.governedAssessment.nextReadinessTarget,
      clarify_items: params.governedAssessment.clarifyItems,
      blocking_phase: "MISSING_CONTEXT_TRIAGE",
      baseline_context_hash: params.baselineContextHash,
      resolved_slot_keys: params.resolvedSlotKeys,
    });
    const clarifyAuditTrail = buildTechMapClarifyAuditTrail({
      workflow_id: workflowId,
      batch: clarifyBatch,
      resume_state: workflowResumeState,
      resolved_slot_keys: params.resolvedSlotKeys,
      resume_requested: params.resumeRequested,
    });
    const workflowOrchestration = this.workflowOrchestrator.buildWorkflowTrace({
      workflow_id: workflowId,
      draft_id: params.draft.id,
      lead_owner_agent: "agronomist",
      readiness: params.governedAssessment.readiness,
      publication_state: params.governedAssessment.publicationState,
      workflow_verdict: params.governedAssessment.workflowVerdict,
      clarify_items: params.governedAssessment.clarifyItems,
      missing_must: params.governedAssessment.missingMust,
      has_budget_policy:
        params.plan.minValue != null ||
        params.plan.optValue != null ||
        params.plan.maxValue != null ||
        params.plan.baselineValue != null,
      has_execution_history:
        Boolean(params.previousTechMap) || params.harvestResultCount > 0,
      has_past_outcomes:
        params.season.actualYield != null || params.harvestResultCount > 0,
      has_allowed_input_catalog_version: params.inputCatalogCount > 0,
      has_target_kpi_policy: Boolean(params.plan.targetMetric ?? params.plan.period),
      has_weather_normals: Boolean(params.regionProfile),
      resume_requested: params.resumeRequested,
    });

    return {
      draftId: params.draft.id,
      status: TechMapStatus.DRAFT,
      fieldRef: params.fieldRef,
      seasonRef: params.seasonRef,
      crop,
      readiness: params.governedAssessment.readiness,
      nextReadinessTarget: params.governedAssessment.nextReadinessTarget,
      workflowVerdict: params.governedAssessment.workflowVerdict,
      publicationState: params.governedAssessment.publicationState,
      missingMust: params.governedAssessment.missingMust,
      clarifyItems: params.governedAssessment.clarifyItems,
      clarifyBatch,
      workflowResumeState,
      clarifyAuditTrail,
      workflowOrchestration,
      gaps: params.governedAssessment.gaps,
      tasks: params.governedAssessment.tasks,
      assumptions: params.governedAssessment.assumptions.map(
        (assumption) => assumption.label,
      ),
    };
  }

  private async persistGovernedSnapshots(
    tx: Prisma.TransactionClient,
    map: TechMapCanonicalDraftSource,
    boundary: TechMapPersistenceBoundary,
    actorId: string,
  ) {
    const techMapId = map.id;
    const version = map.version;

    switch (map.status) {
      case TechMapStatus.REVIEW: {
        const record = buildTechMapReviewSnapshotRecord({
          draft: buildTechMapCanonicalDraftFromTechMap(map),
          boundary,
          createdBy: actorId,
          companyId: map.companyId,
        });

        await tx.techMapReviewSnapshot.upsert({
          where: {
            techMapId_version: {
              techMapId,
              version,
            },
          },
          create: {
            techMapId: record.tech_map_id,
            version: record.version,
            workflowId: record.workflow_id,
            reviewStatus: record.review_status,
            publicationState: record.publication_state,
            persistenceBoundary:
              record.persistence_boundary as unknown as Prisma.InputJsonValue,
            snapshotData: record.snapshot_data as unknown as Prisma.InputJsonValue,
            isImmutable: record.is_immutable,
            createdBy: record.created_by,
            companyId: record.company_id,
          },
          update: {
            workflowId: record.workflow_id,
            reviewStatus: record.review_status,
            publicationState: record.publication_state,
            persistenceBoundary:
              record.persistence_boundary as unknown as Prisma.InputJsonValue,
            snapshotData: record.snapshot_data as unknown as Prisma.InputJsonValue,
            isImmutable: record.is_immutable,
            createdBy: record.created_by,
            companyId: record.company_id,
          },
        });
        break;
      }

      case TechMapStatus.APPROVED: {
        const approvedAt = new Date();
        const record = buildTechMapApprovalSnapshotRecord({
          draft: buildTechMapCanonicalDraftFromTechMap(map),
          boundary,
          approvedBy: actorId,
          approvedAt,
          companyId: map.companyId,
        });

        await tx.techMapApprovalSnapshot.upsert({
          where: {
            techMapId_version: {
              techMapId,
              version,
            },
          },
          create: {
            techMapId: record.tech_map_id,
            version: record.version,
            workflowId: record.workflow_id,
            approvalStatus: record.approval_status,
            publicationState: record.publication_state,
            persistenceBoundary:
              record.persistence_boundary as unknown as Prisma.InputJsonValue,
            snapshotData: record.snapshot_data as unknown as Prisma.InputJsonValue,
            isImmutable: record.is_immutable,
            approvedBy: record.approved_by,
            approvedAt: new Date(record.approved_at),
            companyId: record.company_id,
          },
          update: {
            workflowId: record.workflow_id,
            approvalStatus: record.approval_status,
            publicationState: record.publication_state,
            persistenceBoundary:
              record.persistence_boundary as unknown as Prisma.InputJsonValue,
            snapshotData: record.snapshot_data as unknown as Prisma.InputJsonValue,
            isImmutable: record.is_immutable,
            approvedBy: record.approved_by,
            approvedAt: new Date(record.approved_at),
            companyId: record.company_id,
          },
        });
        break;
      }

      case TechMapStatus.ACTIVE: {
        const lockedAt = new Date();
        const record = buildTechMapPublicationLockRecord({
          draft: buildTechMapCanonicalDraftFromTechMap(map),
          boundary,
          lockedBy: actorId,
          lockedAt,
          companyId: map.companyId,
          supersedesTechMapId: map.id,
          supersedesVersion: version,
          lockReason: "published_baseline_locked",
        });

        await tx.techMapPublicationLock.upsert({
          where: {
            techMapId_version: {
              techMapId,
              version,
            },
          },
          create: {
            techMapId: record.tech_map_id,
            version: record.version,
            workflowId: record.workflow_id,
            publicationState: record.publication_state,
            supersedesTechMapId: record.supersedes_tech_map_id,
            supersedesVersion: record.supersedes_version,
            lockReason: record.lock_reason,
            persistenceBoundary:
              record.persistence_boundary as unknown as Prisma.InputJsonValue,
            snapshotData: record.snapshot_data as unknown as Prisma.InputJsonValue,
            isLocked: record.is_locked,
            lockedBy: record.locked_by,
            lockedAt: new Date(record.locked_at),
            companyId: record.company_id,
          },
          update: {
            workflowId: record.workflow_id,
            publicationState: record.publication_state,
            supersedesTechMapId: record.supersedes_tech_map_id,
            supersedesVersion: record.supersedes_version,
            lockReason: record.lock_reason,
            persistenceBoundary:
              record.persistence_boundary as unknown as Prisma.InputJsonValue,
            snapshotData: record.snapshot_data as unknown as Prisma.InputJsonValue,
            isLocked: record.is_locked,
            lockedBy: record.locked_by,
            lockedAt: new Date(record.locked_at),
            companyId: record.company_id,
          },
        });
        break;
      }

      default:
        break;
    }
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
        include: TECH_MAP_STAGES_WITH_RESOURCES_NO_ORDER_INCLUDE,
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
        const updatedMap = await tx.techMap.findFirstOrThrow({
          where: { id, companyId },
          include: TECH_MAP_CANONICAL_DRAFT_INCLUDE,
        });
        await this.persistGovernedSnapshots(
          tx,
          updatedMap as TechMapCanonicalDraftSource,
          buildTechMapPersistenceBoundary(
            buildTechMapCanonicalDraftFromTechMap(
              updatedMap as TechMapCanonicalDraftSource,
            ),
            updatedMap.status,
          ),
          userId,
        );
        return updatedMap;
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

    const boundary = buildTechMapPersistenceBoundaryFromStatus({
      workflow_id: `techmap:${map.id}:v${map.version}`,
      tech_map_id: map.id,
      version_id: `${map.id}:v${map.version}`,
      current_status: map.status,
      publication_state:
        map.status === TechMapStatus.ACTIVE
          ? "PUBLISHED"
          : map.status === TechMapStatus.APPROVED
            ? "PUBLISHABLE"
            : map.status === TechMapStatus.REVIEW
              ? "REVIEW_REQUIRED"
              : "GOVERNED_DRAFT",
      review_status:
        map.status === TechMapStatus.ACTIVE || map.status === TechMapStatus.APPROVED
          ? "REVIEW_PASSED"
          : map.status === TechMapStatus.REVIEW
            ? "IN_REVIEW"
            : "NOT_SUBMITTED",
      approval_status:
        map.status === TechMapStatus.ACTIVE || map.status === TechMapStatus.APPROVED
          ? "APPROVED"
          : map.status === TechMapStatus.REVIEW
            ? "PENDING_APPROVAL"
            : "NOT_REQUESTED",
      persistence_status:
        map.status === TechMapStatus.ACTIVE
          ? "PUBLICATION_SNAPSHOT_PERSISTED"
          : map.status === TechMapStatus.APPROVED
            ? "APPROVAL_SNAPSHOT_PERSISTED"
            : map.status === TechMapStatus.REVIEW
              ? "REVIEW_PACKET_PERSISTED"
              : "DRAFT_PERSISTED",
    });

    if (!isHeadDraftWritablePersistedTechMapStatus(map.status) || !map.isLatest) {
      throw new ForbiddenException(
        `Cannot edit TechMap in state ${map.status}; ${boundary.next_action === "create_new_version" ? "create a new version instead" : "this snapshot is immutable"}.`,
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
      include: TECH_MAP_STAGES_WITH_RESOURCES_INCLUDE,
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
      include: TECH_MAP_STAGES_WITH_RESOURCES_INCLUDE,
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
      include: TECH_MAP_STAGES_WITH_RESOURCES_INCLUDE,
    });

    if (!map) {
      throw new NotFoundException("TechMap for this season not found");
    }

    return map;
  }

  async getCanonicalDraft(id: string, companyId: string) {
    const map = await this.prisma.techMap.findFirst({
      where: { id, companyId },
      include: TECH_MAP_CANONICAL_DRAFT_INCLUDE,
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    return buildTechMapCanonicalDraftFromTechMap(map);
  }

  async getRuntimeAdoptionSnapshot(id: string, companyId: string) {
    const map = await this.prisma.techMap.findFirst({
      where: { id, companyId },
      include: TECH_MAP_CANONICAL_DRAFT_INCLUDE,
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    const canonicalDraft = buildTechMapCanonicalDraftFromTechMap(map);
    const snapshot = buildTechMapRuntimeAdoptionSnapshot(map, canonicalDraft);
    const workflowOrchestration = this.workflowOrchestrator.buildWorkflowTrace({
      workflow_id: snapshot.workflow_id,
      draft_id: canonicalDraft.header.version_id ?? canonicalDraft.header.workflow_id,
      lead_owner_agent: "agronomist",
      readiness: canonicalDraft.readiness,
      publication_state: canonicalDraft.publication_state,
      workflow_verdict: snapshot.workflow_verdict,
      clarify_items: [],
      missing_must: canonicalDraft.gaps
        .filter((gap) => gap.severity === "blocking")
        .map((gap) => gap.slot_key ?? gap.gap_id),
      has_budget_policy: Boolean(map.harvestPlan.minValue != null ||
        map.harvestPlan.optValue != null ||
        map.harvestPlan.maxValue != null ||
        map.harvestPlan.baselineValue != null),
      has_execution_history: Boolean((map as any).stages?.length),
      has_past_outcomes: Boolean((map as any).season?.actualYield != null),
      has_allowed_input_catalog_version: canonicalDraft.variants.length > 0,
      has_target_kpi_policy: Boolean(map.harvestPlan.targetMetric ?? map.harvestPlan.period),
      has_weather_normals: Boolean(
        (map as any).season?.field?.protectedZoneFlags ??
          (map as any).season?.field?.drainageClass ??
          (map as any).season?.field?.slopePercent,
      ),
      branch_trust_assessments: snapshot.branch_trust_assessments,
      expert_review: snapshot.expert_review ?? null,
      resume_requested: false,
    });

    return {
      ...snapshot,
      workflow_orchestration: workflowOrchestration,
    } satisfies {
      workflow_orchestration: TechMapWorkflowOrchestrationTrace;
    } & typeof snapshot;
  }

  async getPersistenceBoundarySnapshot(id: string, companyId: string) {
    const map = await this.prisma.techMap.findFirst({
      where: { id, companyId },
      include: TECH_MAP_CANONICAL_DRAFT_INCLUDE,
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    const canonicalDraft = buildTechMapCanonicalDraftFromTechMap(map);
    const boundary = buildTechMapPersistenceBoundary(canonicalDraft, map.status);
    const versionNumber = Number(
      canonicalDraft.header.version_id?.split(":v").pop() ?? 1,
    );
    const [reviewSnapshot, approvalSnapshot, publicationLock] = await Promise.all([
      this.prisma.techMapReviewSnapshot.findFirst({
        where: { techMapId: map.id, version: versionNumber },
      }),
      this.prisma.techMapApprovalSnapshot.findFirst({
        where: { techMapId: map.id, version: versionNumber },
      }),
      this.prisma.techMapPublicationLock.findFirst({
        where: { techMapId: map.id, version: versionNumber },
      }),
    ]);

    const reviewSnapshotResponse = reviewSnapshot
      ? {
          tech_map_id: reviewSnapshot.techMapId,
          version: reviewSnapshot.version,
          workflow_id: reviewSnapshot.workflowId,
          review_status: reviewSnapshot.reviewStatus,
          publication_state: reviewSnapshot.publicationState,
          persistence_boundary:
            reviewSnapshot.persistenceBoundary as unknown as TechMapPersistenceBoundary,
          snapshot_data:
            reviewSnapshot.snapshotData as unknown as Record<string, unknown>,
          is_immutable: reviewSnapshot.isImmutable,
          created_by: reviewSnapshot.createdBy,
          company_id: reviewSnapshot.companyId,
        }
      : buildTechMapReviewSnapshotRecord({
          draft: canonicalDraft,
          boundary,
          createdBy: "system:tech-map",
          companyId,
        });
    const approvalSnapshotResponse = approvalSnapshot
      ? {
          tech_map_id: approvalSnapshot.techMapId,
          version: approvalSnapshot.version,
          workflow_id: approvalSnapshot.workflowId,
          approval_status: approvalSnapshot.approvalStatus,
          publication_state: approvalSnapshot.publicationState,
          persistence_boundary:
            approvalSnapshot.persistenceBoundary as unknown as TechMapPersistenceBoundary,
          snapshot_data:
            approvalSnapshot.snapshotData as unknown as Record<string, unknown>,
          is_immutable: approvalSnapshot.isImmutable,
          approved_by: approvalSnapshot.approvedBy,
          approved_at: approvalSnapshot.approvedAt.toISOString(),
          company_id: approvalSnapshot.companyId,
        }
      : buildTechMapApprovalSnapshotRecord({
          draft: canonicalDraft,
          boundary,
          approvedBy: "system:tech-map",
          approvedAt: new Date(),
          companyId,
        });
    const publicationLockResponse = publicationLock
      ? {
          tech_map_id: publicationLock.techMapId,
          version: publicationLock.version,
          workflow_id: publicationLock.workflowId,
          publication_state: publicationLock.publicationState,
          supersedes_tech_map_id: publicationLock.supersedesTechMapId,
          supersedes_version: publicationLock.supersedesVersion,
          lock_reason: publicationLock.lockReason,
          persistence_boundary:
            publicationLock.persistenceBoundary as unknown as TechMapPersistenceBoundary,
          snapshot_data:
            publicationLock.snapshotData as unknown as Record<string, unknown>,
          is_locked: publicationLock.isLocked,
          locked_by: publicationLock.lockedBy,
          locked_at: publicationLock.lockedAt.toISOString(),
          company_id: publicationLock.companyId,
        }
      : buildTechMapPublicationLockRecord({
          draft: canonicalDraft,
          boundary,
          lockedBy: "system:tech-map",
          lockedAt: new Date(),
          companyId,
          supersedesTechMapId: canonicalDraft.header.tech_map_id,
          supersedesVersion: versionNumber,
          lockReason:
            map.status === TechMapStatus.ACTIVE
              ? "current_active_baseline"
              : "prepared_migration_boundary",
        });

    return {
      boundary,
      review_snapshot: reviewSnapshotResponse,
      approval_snapshot: approvalSnapshotResponse,
      publication_lock: publicationLockResponse,
    };
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
      include: TECH_MAP_VALIDATION_INCLUDE,
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    return this.validationEngine.validate(
      buildValidationInputFromTechMap(map, currentBBCH),
    );
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
      include: TECH_MAP_DAG_INCLUDE,
    });

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    return this.dagValidation.validateAcyclicity(buildDagNodesFromTechMap(map));
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
      include: TECH_MAP_STAGES_WITH_RESOURCES_NO_ORDER_INCLUDE,
    });

    if (!techMap) throw new NotFoundException("TechMap not found");

    // Tenant isolation: verify caller's companyId matches the entity (ADR-013)
    if (companyId && techMap.companyId !== companyId) {
      throw new NotFoundException("TechMap not found");
    }

    // 1. Validate Phase 2 Rules
    this.validator.validateForActivation(techMap);

    // 2. Capture Snapshots (Asset Integrity)
    const operationsSnapshot = buildOperationsSnapshot(techMap);
    const resourceNormsSnapshot = buildResourceNormsSnapshot(
      techMap,
      (value, unit) => this.unitService.normalize(value, unit),
    );

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

      const updatedMap = await tx.techMap.findFirstOrThrow({
        where: { id, companyId: techMap.companyId },
        include: TECH_MAP_CANONICAL_DRAFT_INCLUDE,
      });

      await this.persistGovernedSnapshots(
        tx,
        updatedMap as TechMapCanonicalDraftSource,
        buildTechMapPersistenceBoundary(
          buildTechMapCanonicalDraftFromTechMap(
            updatedMap as TechMapCanonicalDraftSource,
          ),
          updatedMap.status,
        ),
        userId,
      );

      return updatedMap;
    });
  }

  /**
   * Creates a new draft version from an existing map.
   * Enforces Versioning on Edit policy.
   */
  async createNextVersion(sourceId: string, companyId: string) {
    const source = await this.prisma.techMap.findFirst({
      where: { id: sourceId, companyId },
      include: TECH_MAP_STAGES_WITH_RESOURCES_NO_ORDER_INCLUDE,
    });
    if (!source) throw new NotFoundException("Source TechMap not found");

    if (!source.isLatest) {
      throw new ForbiddenException(
        "Can only create a new version from the current head draft",
      );
    }

    // Logic to deep clone structure
    return this.prisma.$transaction(async (tx) => {
      await tx.techMap.updateMany({
        where: { id: source.id, companyId: source.companyId },
        data: { isLatest: false },
      });

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
          isLatest: true,
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

  private async ensureCropZone(params: {
    companyId: string;
    seasonId: string;
    fieldId: string;
    cropVarietyId?: string | null;
    targetYieldTHa?: number | null;
  }) {
    const existingCropZone = await (this.prisma as any).cropZone.findFirst({
      where: {
        seasonId: params.seasonId,
        fieldId: params.fieldId,
        companyId: params.companyId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (existingCropZone) {
      return existingCropZone;
    }

    return (this.prisma as any).cropZone.create({
      data: {
        seasonId: params.seasonId,
        fieldId: params.fieldId,
        companyId: params.companyId,
        cropType: CropType.RAPESEED,
        cropVarietyId: params.cropVarietyId ?? null,
        targetYieldTHa: params.targetYieldTHa ?? null,
        varietyHybrid: null,
      },
    });
  }

  private resolveDraftMethodologyProfileId(
    generationMetadata: Prisma.JsonValue | null | undefined,
  ): string | null {
    if (!generationMetadata || typeof generationMetadata !== "object") {
      return null;
    }

    const metadata = generationMetadata as Record<string, unknown>;
    const source = typeof metadata.source === "string" ? metadata.source : null;
    const blueprintVersion =
      typeof metadata.blueprintVersion === "string"
        ? metadata.blueprintVersion
        : null;

    if (!source || !blueprintVersion) {
      return null;
    }

    return `${source}:${blueprintVersion}`;
  }

}
