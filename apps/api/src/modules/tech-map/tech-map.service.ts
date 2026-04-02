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
  OperationType,
  IncidentRunbookAction,
  SystemIncidentStatus,
  SystemIncidentType,
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
  type TechMapRuntimeAdoptionSnapshot,
} from "../../shared/tech-map/tech-map-runtime-adoption.helpers";
import {
  buildTechMapClarifyBatch,
  buildTechMapClarifyAuditTrail,
  buildTechMapWorkflowResumeState,
} from "../../shared/tech-map/tech-map-governed-clarify.helpers";
import { assessTechMapGovernedDraftContext } from "../../shared/tech-map/tech-map-governed-draft.helpers";
import { isEditablePersistedTechMapStatus } from "../../shared/tech-map/tech-map-governed-status.helpers";
import type { TechMapWorkflowOrchestrationTrace } from "../../shared/tech-map/tech-map-workflow-orchestrator.types";
import type {
  TechMapExecutionLoopSummary,
  TechMapWorkflowExplainabilityPayload,
  TechMapWorkflowSnapshot,
} from "../../shared/rai-chat/rai-tools.types";
import { TechMapWorkflowOrchestratorService } from "./tech-map-workflow-orchestrator.service";
import {
  resolveBlueprintBaseDate,
  resolveOperationWindow,
} from "./tech-map-blueprint";
import { TechMapGenerationOrchestratorService } from "./generation/tech-map-generation-orchestrator.service";
import type {
  GeneratedTechMapBundle,
  GenerationStageDraft,
} from "./generation/tech-map-generation.types";

interface GovernedRuntimeBundle {
  trustSpecialization: TechMapRuntimeAdoptionSnapshot["trust_specialization"];
  variantComparisonReport: TechMapRuntimeAdoptionSnapshot["variant_comparison_report"];
  expertReview: TechMapRuntimeAdoptionSnapshot["expert_review"];
  workflowOrchestration: TechMapWorkflowOrchestrationTrace;
  workflowSnapshot: TechMapWorkflowSnapshot;
  workflowExplainability: TechMapWorkflowExplainabilityPayload;
  executionLoopSummary: TechMapExecutionLoopSummary;
}

const INTERMEDIATE_EVIDENCE_ROUTE_SCHEMES = [
  "camera://",
  "weather-api://",
  "satellite://",
  "geo://",
  "lab://",
  "files://",
] as const;

const TECHMAP_ROLLOUT_PARITY_INCIDENT_SUBTYPE =
  "TECHMAP_CANONICAL_PARITY_BLOCKED";
const TECHMAP_ROLLOUT_COMPANY_PARITY_INCIDENT_SUBTYPE =
  "TECHMAP_ROLLOUT_BLOCKING_PARITY";
const TECHMAP_ROLLOUT_FALLBACK_INCIDENT_SUBTYPE =
  "TECHMAP_ROLLOUT_FALLBACK_PERSISTING";
const TECHMAP_ROLLOUT_FALLBACK_ALERT_THRESHOLD = 3;

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
    private readonly generationOrchestrator: TechMapGenerationOrchestratorService,
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

    const [latestSoilProfile, regionProfile] = await Promise.all([
      this.prisma.soilProfile.findFirst({
        where: {
          fieldId: cropZone.fieldId,
          companyId: plan.companyId,
        },
        orderBy: {
          sampleDate: "desc",
        },
      }),
      this.prisma.regionProfile.findFirst({
        where: {
          OR: [{ companyId: plan.companyId }, { companyId: null }],
        },
        orderBy: [{ companyId: "desc" }, { updatedAt: "desc" }],
      }),
    ]);

    const generationBundle = this.generationOrchestrator.orchestrate({
      cropType: cropZone.cropType ?? CropType.RAPESEED,
      cropZone,
      season,
      soilProfile: latestSoilProfile,
      regionProfile,
    });

    if (generationBundle.fieldAdmission?.isBlocking) {
      const blockingMessages = generationBundle.fieldAdmission.blockers
        .filter((item) => item.blocking)
        .map((item) => item.message);
      throw new BadRequestException(
        `Rapeseed field admission blocked generation: ${blockingMessages.join("; ")}`,
      );
    }

    const crop = String(generationBundle.crop).toLowerCase();

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

    const baseDateInput = {
      crop,
      seasonYear: season.year,
      seasonStartDate: season.startDate,
      targetYieldTHa: cropZone.targetYieldTHa,
    };
    const seasonBaseDate = resolveBlueprintBaseDate(baseDateInput);

    const createdMap = await this.prisma.$transaction(async (tx) => {
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

      await (tx as any).cropZone.update({
        where: {
          id: cropZone.id,
        },
        data: {
          cropForm: generationBundle.cropForm ?? undefined,
        },
      });

      await this.persistCanonicalRegistries(tx, generationBundle, plan.companyId);

      const techMap = await tx.techMap.create({
        data: {
          seasonId,
          cropZoneId: cropZone.id,
          harvestPlanId: plan.id,
          companyId: plan.companyId,
          fieldId: cropZone.fieldId,
          crop,
          cropForm: generationBundle.cropForm ?? null,
          canonicalBranch: generationBundle.canonicalBranch ?? null,
          status: TechMapStatus.DRAFT,
          version: nextVersion,
          isLatest: true,
          generationMetadata: generationBundle.generationMetadata as Prisma.InputJsonValue,
        },
      });

      const stageCodeToId = new Map<string, string>();

      for (const stage of generationBundle.stages) {
        const createdStage = await tx.mapStage.create({
          data: {
            techMapId: techMap.id,
            name: stage.name,
            sequence: stage.sequence,
            aplStageId: stage.aplStageId,
            stageGoal: stage.stageGoal ?? null,
            bbchScope: (stage.bbchScope ?? null) as Prisma.InputJsonValue,
          },
        });
        stageCodeToId.set(stage.code, createdStage.id);

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
              operationType: this.normalizeOperationType(
                operation.operationType,
                operation.name,
              ),
              bbchWindowFrom: operation.bbchWindowFrom ?? null,
              bbchWindowTo: operation.bbchWindowTo ?? null,
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

      for (const controlPoint of generationBundle.controlPoints) {
        const mapStageId = stageCodeToId.get(controlPoint.stageCode);
        if (!mapStageId) {
          continue;
        }

        await (tx as any).controlPoint.create({
          data: {
            techMapId: techMap.id,
            mapStageId,
            name: controlPoint.name,
            bbchScope: controlPoint.bbchScope as Prisma.InputJsonValue,
            requiredObservations:
              controlPoint.requiredObservations as Prisma.InputJsonValue,
            acceptanceRanges:
              (controlPoint.acceptanceRanges ?? null) as Prisma.InputJsonValue,
            severityOnFailure: controlPoint.severityOnFailure,
            companyId: plan.companyId,
          },
        });
      }

      for (const signal of generationBundle.monitoringSignals) {
        await (tx as any).monitoringSignal.create({
          data: {
            techMapId: techMap.id,
            signalType: signal.signalType,
            source: signal.source ?? null,
            thresholdLogic: signal.thresholdLogic ?? null,
            severity: signal.severity,
            resultingAction: signal.resultingAction ?? null,
            companyId: plan.companyId,
          },
        });
      }

      if (generationBundle.fieldAdmission) {
        await (tx as any).fieldAdmissionResult.create({
          data: {
            techMapId: techMap.id,
            cropZoneId: cropZone.id,
            cropForm: generationBundle.fieldAdmission.cropForm ?? null,
            verdict: generationBundle.fieldAdmission.verdict,
            isBlocking: generationBundle.fieldAdmission.isBlocking,
            blockers:
              generationBundle.fieldAdmission.blockers as unknown as Prisma.InputJsonValue,
            requirements:
              generationBundle.fieldAdmission.requirements as unknown as Prisma.InputJsonValue,
            recommendations:
              generationBundle.fieldAdmission.recommendations as unknown as Prisma.InputJsonValue,
            rolloutPolicy:
              generationBundle.fieldAdmission.rolloutPolicy as Prisma.InputJsonValue,
            traceId: generationBundle.fieldAdmission.traceId,
            companyId: plan.companyId,
          },
        });
      }

      await (tx as any).generationExplanationTrace.create({
        data: {
          techMapId: techMap.id,
          traceId: String(generationBundle.generationMetadata.generationTraceId),
          cropForm: generationBundle.cropForm ?? null,
          canonicalBranch: generationBundle.canonicalBranch ?? null,
          generationStrategy: generationBundle.generationStrategy,
          schemaVersion: String(generationBundle.generationMetadata.schemaVersion),
          ruleRegistryVersion: String(
            generationBundle.generationMetadata.ruleRegistryVersion,
          ),
          ontologyVersion: String(generationBundle.generationMetadata.ontologyVersion),
          generatorVersion: generationBundle.generatorVersion,
          featureFlagSnapshot:
            (generationBundle.generationMetadata.featureFlagSnapshot ??
              null) as Prisma.InputJsonValue,
          completenessScore:
            generationBundle.shadowParityReport?.diffs.length === 0 ? 1 : 0.8,
          summary: generationBundle.explainabilitySummary as Prisma.InputJsonValue,
          companyId: plan.companyId,
        },
      });

      await this.persistDecisionArtifacts(tx, techMap.id, plan.companyId, generationBundle);
      await this.persistRuleEvaluationTraces(tx, techMap.id, plan.companyId, generationBundle);

      return tx.techMap.findFirstOrThrow({
        where: {
          id: techMap.id,
          companyId: plan.companyId,
        },
        include: TECH_MAP_STAGES_WITH_RESOURCES_INCLUDE,
      });
    });

    await this.syncGenerationRolloutIncidents({
      companyId: plan.companyId,
      techMapId: createdMap.id,
      generationBundle,
    });
    await this.syncCompanyRolloutIncidents(plan.companyId);

    return createdMap;
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

    return await this.buildGovernedDraftClarifyResult({
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
      workflowMode: "create",
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

    return await this.buildGovernedDraftClarifyResult({
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
      workflowMode: "resume",
      baselineContextHash: `tech-map:${draft.id}:${cropZone.fieldId}:${cropZone.seasonId}`,
      governedAssessment,
    });
  }

  private async buildGovernedDraftClarifyResult(params: {
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
    workflowMode: "create" | "resume" | "rebuild";
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
    const hasBudgetPolicy =
      params.plan.minValue != null ||
      params.plan.optValue != null ||
      params.plan.maxValue != null ||
      params.plan.baselineValue != null;
    const hasExecutionHistory =
      Boolean(params.previousTechMap) || params.harvestResultCount > 0;
    const hasPastOutcomes =
      params.season.actualYield != null || params.harvestResultCount > 0;
    const hasTargetKpiPolicy = Boolean(
      params.plan.targetMetric ?? params.plan.period,
    );
    const hasWeatherNormals = Boolean(params.regionProfile);
    const workflowOrchestration = this.workflowOrchestrator.buildWorkflowTrace({
      workflow_id: workflowId,
      draft_id: params.draft.id,
      lead_owner_agent: "agronomist",
      readiness: params.governedAssessment.readiness,
      publication_state: params.governedAssessment.publicationState,
      workflow_verdict: params.governedAssessment.workflowVerdict,
      clarify_items: params.governedAssessment.clarifyItems,
      missing_must: params.governedAssessment.missingMust,
      has_budget_policy: hasBudgetPolicy,
      has_execution_history: hasExecutionHistory,
      has_past_outcomes: hasPastOutcomes,
      has_allowed_input_catalog_version: params.inputCatalogCount > 0,
      has_target_kpi_policy: hasTargetKpiPolicy,
      has_weather_normals: hasWeatherNormals,
      resume_requested: params.resumeRequested,
    });
    const companyId =
      params.draft.companyId ??
      params.plan.companyId ??
      params.cropZone.companyId ??
      null;
    const runtimeBundle = await this.buildGovernedRuntimeBundle({
      draftId: params.draft.id,
      companyId,
      crop,
      fieldRef: params.fieldRef,
      seasonRef: params.seasonRef,
      workflowId,
      workflowMode: params.workflowMode,
      readiness: params.governedAssessment.readiness,
      workflowVerdict: params.governedAssessment.workflowVerdict,
      publicationState: params.governedAssessment.publicationState,
      clarifyItems: params.governedAssessment.clarifyItems,
      missingMust: params.governedAssessment.missingMust,
      gaps: params.governedAssessment.gaps,
      tasks: params.governedAssessment.tasks,
      clarifyBatch,
      workflowResumeState,
      workflowOrchestration,
      hasBudgetPolicy,
      hasExecutionHistory,
      hasPastOutcomes,
      hasTargetKpiPolicy,
      hasWeatherNormals,
      hasMaterializedOperations: Array.isArray(params.draft.stages)
        ? params.draft.stages.some(
            (stage: { operations?: unknown[] }) =>
              Array.isArray(stage.operations) && stage.operations.length > 0,
          )
        : false,
      targetYieldTHa:
        params.cropZone.targetYieldTHa ?? params.season.expectedYield ?? null,
      actualYieldTHa: params.season.actualYield ?? null,
      baselineYieldTHa:
        params.plan.baselineValue ??
        params.plan.optValue ??
        params.season.expectedYield ??
        null,
    });

    return {
      draftId: params.draft.id,
      status: TechMapStatus.DRAFT,
      fieldRef: params.fieldRef,
      seasonRef: params.seasonRef,
      crop,
      readiness: params.governedAssessment.readiness,
      nextReadinessTarget: params.governedAssessment.nextReadinessTarget,
      workflowVerdict: runtimeBundle.workflowSnapshot.workflow_verdict,
      publicationState: runtimeBundle.workflowSnapshot.publication_state,
      missingMust: params.governedAssessment.missingMust,
      clarifyItems: params.governedAssessment.clarifyItems,
      clarifyBatch,
      workflowResumeState,
      clarifyAuditTrail,
      workflowOrchestration: runtimeBundle.workflowOrchestration,
      trustSpecialization: runtimeBundle.trustSpecialization ?? null,
      variantComparisonReport: runtimeBundle.variantComparisonReport ?? null,
      expertReview: runtimeBundle.expertReview ?? null,
      workflowSnapshot: runtimeBundle.workflowSnapshot,
      workflow_snapshot: runtimeBundle.workflowSnapshot,
      workflowExplainability: runtimeBundle.workflowExplainability,
      workflow_explainability: runtimeBundle.workflowExplainability,
      executionLoopSummary: runtimeBundle.executionLoopSummary,
      execution_loop_summary: runtimeBundle.executionLoopSummary,
      gaps: params.governedAssessment.gaps,
      tasks: params.governedAssessment.tasks,
      assumptions: params.governedAssessment.assumptions.map(
        (assumption) => assumption.label,
      ),
    };
  }

  private async buildGovernedRuntimeBundle(params: {
    draftId: string;
    companyId: string | null;
    crop: "rapeseed" | "sunflower";
    fieldRef: string;
    seasonRef: string;
    workflowId: string;
    workflowMode: "create" | "resume" | "rebuild";
    readiness: ReturnType<typeof assessTechMapGovernedDraftContext>["readiness"];
    workflowVerdict: ReturnType<typeof assessTechMapGovernedDraftContext>["workflowVerdict"];
    publicationState: ReturnType<typeof assessTechMapGovernedDraftContext>["publicationState"];
    clarifyItems: ReturnType<typeof assessTechMapGovernedDraftContext>["clarifyItems"];
    missingMust: string[];
    gaps: ReturnType<typeof assessTechMapGovernedDraftContext>["gaps"];
    tasks: string[];
    clarifyBatch: ReturnType<typeof buildTechMapClarifyBatch>;
    workflowResumeState: ReturnType<typeof buildTechMapWorkflowResumeState>;
    workflowOrchestration: TechMapWorkflowOrchestrationTrace;
    hasBudgetPolicy: boolean;
    hasExecutionHistory: boolean;
    hasPastOutcomes: boolean;
    hasTargetKpiPolicy: boolean;
    hasWeatherNormals: boolean;
    hasMaterializedOperations: boolean;
    targetYieldTHa: number | null;
    actualYieldTHa: number | null;
    baselineYieldTHa: number | null;
  }): Promise<GovernedRuntimeBundle> {
    let runtimeAdoptionSnapshot: TechMapRuntimeAdoptionSnapshot | null = null;

    if (params.companyId) {
      const map = await this.prisma.techMap.findFirst({
        where: {
          id: params.draftId,
          companyId: params.companyId,
        },
        include: TECH_MAP_CANONICAL_DRAFT_INCLUDE,
      });

      if (map) {
        const canonicalDraft = buildTechMapCanonicalDraftFromTechMap(map);
        runtimeAdoptionSnapshot = buildTechMapRuntimeAdoptionSnapshot(
          map,
          canonicalDraft,
        );
      }
    }

    const runtimeWorkflowOrchestration =
      runtimeAdoptionSnapshot?.trust_specialization ||
      runtimeAdoptionSnapshot?.branch_trust_assessments.length
        ? this.workflowOrchestrator.buildWorkflowTrace({
            workflow_id: params.workflowId,
            draft_id: params.draftId,
            lead_owner_agent: "agronomist",
            readiness: params.readiness,
            publication_state: params.publicationState,
            workflow_verdict:
              runtimeAdoptionSnapshot?.workflow_verdict ?? params.workflowVerdict,
            clarify_items: params.clarifyItems,
            missing_must: params.missingMust,
            has_budget_policy: params.hasBudgetPolicy,
            has_execution_history: params.hasExecutionHistory,
            has_past_outcomes: params.hasPastOutcomes,
            has_allowed_input_catalog_version: Boolean(
              runtimeAdoptionSnapshot?.canonical_draft.variants.length,
            ),
            has_target_kpi_policy: params.hasTargetKpiPolicy,
            has_weather_normals: params.hasWeatherNormals,
            branch_trust_assessments:
              runtimeAdoptionSnapshot?.branch_trust_assessments ?? [],
            trust_specialization:
              runtimeAdoptionSnapshot?.trust_specialization ?? null,
            expert_review: runtimeAdoptionSnapshot?.expert_review ?? null,
            resume_requested: params.workflowMode === "resume",
          })
        : params.workflowOrchestration;
    const effectiveWorkflowVerdict =
      runtimeAdoptionSnapshot?.workflow_verdict ?? params.workflowVerdict;

    const nextActions = this.resolveWorkflowNextActions(
      params.tasks,
      runtimeAdoptionSnapshot,
    );
    const workflowSnapshot: TechMapWorkflowSnapshot = {
      workflow_id: params.workflowId,
      draft_id: params.draftId,
      workflow_mode: params.workflowMode,
      readiness: params.readiness,
      workflow_verdict: effectiveWorkflowVerdict,
      publication_state: params.publicationState,
      missing_must: params.missingMust,
      clarify_batch: params.clarifyBatch,
      workflow_resume_state: params.workflowResumeState,
      workflow_orchestration: runtimeWorkflowOrchestration,
      trust_specialization: runtimeAdoptionSnapshot?.trust_specialization ?? null,
      next_actions: nextActions,
    };
    const executionLoopSummary = this.buildExecutionLoopSummary({
      companyId: params.companyId,
      fieldRef: params.fieldRef,
      seasonRef: params.seasonRef,
      crop: params.crop,
      workflowId: params.workflowId,
      draftId: params.draftId,
      missingMust: params.missingMust,
      gaps: params.gaps,
      hasExecutionHistory: params.hasExecutionHistory,
      hasPastOutcomes: params.hasPastOutcomes,
      hasMaterializedOperations: params.hasMaterializedOperations,
      targetYieldTHa: params.targetYieldTHa,
      actualYieldTHa: params.actualYieldTHa,
      baselineYieldTHa: params.baselineYieldTHa,
      runtimeAdoptionSnapshot,
      workflowOrchestration: runtimeWorkflowOrchestration,
    });
    const workflowExplainability = this.buildWorkflowExplainabilityPayload({
      readiness: params.readiness,
      workflowVerdict: effectiveWorkflowVerdict,
      publicationState: params.publicationState,
      clarifyItems: params.clarifyItems,
      missingMust: params.missingMust,
      gaps: params.gaps,
      nextActions,
      trustSpecialization: runtimeAdoptionSnapshot?.trust_specialization ?? null,
      executionLoopSummary,
    });

    return {
      trustSpecialization: runtimeAdoptionSnapshot?.trust_specialization ?? null,
      variantComparisonReport:
        runtimeAdoptionSnapshot?.variant_comparison_report ?? null,
      expertReview: runtimeAdoptionSnapshot?.expert_review ?? null,
      workflowOrchestration: runtimeWorkflowOrchestration,
      workflowSnapshot,
      workflowExplainability,
      executionLoopSummary,
    };
  }

  private resolveWorkflowNextActions(
    tasks: string[],
    runtimeAdoptionSnapshot: TechMapRuntimeAdoptionSnapshot | null,
  ): string[] {
    const compositionNextActions =
      runtimeAdoptionSnapshot?.composition.next_actions.map((item) =>
        typeof item.label === "string" && item.label.trim().length > 0
          ? item.label
          : typeof item.value === "string"
            ? item.value
            : item.statement_id,
      ) ?? [];
    const trustGateAction = runtimeAdoptionSnapshot?.trust_specialization
      ? runtimeAdoptionSnapshot.trust_specialization.composition_gate.can_compose
        ? "Композиция разрешена trust gate."
        : `Композиция заблокирована trust gate: ${runtimeAdoptionSnapshot.trust_specialization.composition_gate.reason}.`
      : null;

    return this.uniqueStrings([
      ...tasks,
      ...compositionNextActions,
      trustGateAction ?? "",
    ]);
  }

  private buildWorkflowExplainabilityPayload(params: {
    readiness: ReturnType<typeof assessTechMapGovernedDraftContext>["readiness"];
    workflowVerdict: ReturnType<typeof assessTechMapGovernedDraftContext>["workflowVerdict"];
    publicationState: ReturnType<typeof assessTechMapGovernedDraftContext>["publicationState"];
    clarifyItems: ReturnType<typeof assessTechMapGovernedDraftContext>["clarifyItems"];
    missingMust: string[];
    gaps: ReturnType<typeof assessTechMapGovernedDraftContext>["gaps"];
    nextActions: string[];
    trustSpecialization: TechMapRuntimeAdoptionSnapshot["trust_specialization"];
    executionLoopSummary: TechMapExecutionLoopSummary;
  }): TechMapWorkflowExplainabilityPayload {
    const explainabilityWindow =
      params.missingMust.length > 0
        ? "clarification"
        : params.executionLoopSummary.result_state.status === "READY"
          ? "result"
          : "analysis";
    const blockedReasons = this.uniqueStrings([
      ...params.missingMust.map((slotKey) => `missing_must:${slotKey}`),
      ...(params.gaps
        .filter((gap) => gap.severity === "blocking")
        .map((gap) => gap.slot_key ?? gap.gap_id) ?? []),
      ...(params.trustSpecialization &&
      !params.trustSpecialization.composition_gate.can_compose
        ? [
            `trust_gate:${params.trustSpecialization.composition_gate.reason}`,
          ]
        : []),
    ]);
    const partialReasons = this.uniqueStrings([
      params.workflowVerdict === "PARTIAL" ? "workflow_verdict_partial" : "",
      params.workflowVerdict === "UNVERIFIED"
        ? "workflow_verdict_unverified"
        : "",
      params.executionLoopSummary.result_state.status === "PARTIAL"
        ? "result_stage_partial"
        : "",
      params.executionLoopSummary.execution_state.status !== "HISTORY_READY"
        ? `execution_state:${params.executionLoopSummary.execution_state.status}`
        : "",
    ]);
    const composableReasons = this.uniqueStrings([
      params.trustSpecialization?.composition_gate.can_compose
        ? `trust_gate:${params.trustSpecialization.composition_gate.reason}`
        : "",
      params.executionLoopSummary.deviation_state.status === "SCOPED"
        ? "deviation_scoped_to_tech_map_scope"
        : "",
      params.executionLoopSummary.result_state.relation_to_targets ===
      "TARGET_AND_DEVIATION"
        ? "result_linked_to_targets_and_deviations"
        : "",
    ]);

    return {
      readiness: params.readiness,
      workflow_verdict: params.workflowVerdict,
      publication_state: params.publicationState,
      explainability_window: explainabilityWindow,
      why: {
        blocked_reasons: blockedReasons,
        partial_reasons: partialReasons,
        composable_reasons: composableReasons,
      },
      source_slots: {
        missing_must: params.missingMust,
        clarify_items: params.clarifyItems.map((item) => item.slot_key),
        gaps: params.gaps.map((gap) => gap.slot_key ?? gap.gap_id),
      },
      trust_gate: params.trustSpecialization
        ? {
            can_compose:
              params.trustSpecialization.composition_gate.can_compose,
            reason: params.trustSpecialization.composition_gate.reason,
            blocked_disclosure: params.trustSpecialization.blocked_disclosure,
          }
        : null,
      deviation_summary: params.executionLoopSummary.deviation_state,
      next_actions: this.uniqueStrings(params.nextActions),
    };
  }

  private buildExecutionLoopSummary(params: {
    companyId: string | null;
    fieldRef: string;
    seasonRef: string;
    crop: "rapeseed" | "sunflower";
    workflowId: string;
    draftId: string;
    missingMust: string[];
    gaps: ReturnType<typeof assessTechMapGovernedDraftContext>["gaps"];
    hasExecutionHistory: boolean;
    hasPastOutcomes: boolean;
    hasMaterializedOperations: boolean;
    targetYieldTHa: number | null;
    actualYieldTHa: number | null;
    baselineYieldTHa: number | null;
    runtimeAdoptionSnapshot: TechMapRuntimeAdoptionSnapshot | null;
    workflowOrchestration: TechMapWorkflowOrchestrationTrace;
  }): TechMapExecutionLoopSummary {
    const blockingGaps = this.uniqueStrings([
      ...params.missingMust,
      ...params.gaps
        .filter((gap) => gap.severity === "blocking")
        .map((gap) => gap.slot_key ?? gap.gap_id),
    ]);
    const selectedVariant =
      params.runtimeAdoptionSnapshot?.canonical_draft.variants.find(
        (variant) =>
          variant.variant_id ===
          params.runtimeAdoptionSnapshot?.canonical_draft.selected_variant_id,
      ) ??
      params.runtimeAdoptionSnapshot?.canonical_draft.variants[0];
    const hasMaterializedOperations =
      params.hasMaterializedOperations ||
      Boolean(selectedVariant && selectedVariant.operations.length > 0);
    const executionStatus = !params.hasExecutionHistory
      ? "NO_HISTORY"
      : params.hasPastOutcomes
        ? "HISTORY_READY"
        : "PARTIAL_HISTORY";
    const deviationStatus =
      blockingGaps.length > 0
        ? "BLOCKED_BY_CONTEXT"
        : params.hasExecutionHistory
          ? "SCOPED"
          : "NOT_AVAILABLE";
    const relationToTargets = !params.hasExecutionHistory
      ? "NOT_AVAILABLE"
      : params.hasPastOutcomes
        ? "TARGET_AND_DEVIATION"
        : "BASELINE_ONLY";
    const resultStatus =
      params.hasExecutionHistory && params.hasPastOutcomes && blockingGaps.length === 0
        ? "READY"
        : "PARTIAL";
    const yieldDeltaTHa =
      params.actualYieldTHa != null && params.targetYieldTHa != null
        ? Number((params.actualYieldTHa - params.targetYieldTHa).toFixed(3))
        : null;

    return {
      scope: {
        company_id: params.companyId,
        field_id: params.fieldRef,
        season_id: params.seasonRef,
        crop_code: params.crop,
        workflow_id: params.workflowId,
      },
      tech_map_ref: {
        draft_id: params.draftId,
        workflow_id: params.workflowId,
      },
      execution_state: {
        status: executionStatus,
        has_execution_history: params.hasExecutionHistory,
        has_past_outcomes: params.hasPastOutcomes,
        has_materialized_operations: hasMaterializedOperations,
      },
      deviation_state: {
        status: deviationStatus,
        scope_consistent: true,
        blocking_gaps: blockingGaps,
      },
      result_state: {
        status: resultStatus,
        relation_to_targets: relationToTargets,
        summary:
          resultStatus === "READY"
            ? "Result stage связан с target yield и deviation set."
            : "Result stage частичный: нужны дополнительные execution или context evidence.",
        target_context: {
          target_yield_t_ha: params.targetYieldTHa,
          actual_yield_t_ha: params.actualYieldTHa,
          baseline_yield_t_ha: params.baselineYieldTHa,
          yield_delta_t_ha: yieldDeltaTHa,
        },
      },
      blocking_gaps: blockingGaps,
      evidence_refs: this.collectExecutionLoopEvidenceRefs(
        params.runtimeAdoptionSnapshot,
        params.workflowOrchestration,
      ),
    };
  }

  private collectExecutionLoopEvidenceRefs(
    runtimeAdoptionSnapshot: TechMapRuntimeAdoptionSnapshot | null,
    workflowOrchestration: TechMapWorkflowOrchestrationTrace,
  ): string[] {
    return this.uniqueStrings([
      ...(runtimeAdoptionSnapshot?.canonical_draft.audit_refs ?? []),
      ...(runtimeAdoptionSnapshot?.branch_results.flatMap((branch) =>
        branch.evidence_refs.map((evidence) => evidence.sourceId),
      ) ?? []),
      ...(runtimeAdoptionSnapshot?.composition.facts.flatMap(
        (statement) => statement.evidence_refs,
      ) ?? []),
      ...(runtimeAdoptionSnapshot?.composition.gaps.flatMap(
        (statement) => statement.evidence_refs,
      ) ?? []),
      ...(runtimeAdoptionSnapshot?.conflict_records.map(
        (conflict) => conflict.conflict_id,
      ) ?? []),
      runtimeAdoptionSnapshot?.expert_review?.publication_packet_ref ?? "",
      ...workflowOrchestration.audit_refs,
    ]);
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values.filter((value) => value.trim().length > 0))];
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

  async getGenerationRolloutSummary(companyId: string) {
    const summary = await this.buildGenerationRolloutSummary(companyId);
    const rolloutIncidents = await this.prisma.systemIncident.findMany({
      where: {
        companyId,
        incidentType: SystemIncidentType.UNKNOWN,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return {
      ...summary,
      rolloutIncidents: rolloutIncidents
        .filter((incident) => {
          const subtype = this.extractTechMapRolloutSubtype(incident.details);
          if (subtype === null) {
            return false;
          }

          const details = this.normalizeMetadataRecord(incident.details);
          const techMapId =
            typeof details.techMapId === "string" ? details.techMapId : null;

          if (subtype === TECHMAP_ROLLOUT_PARITY_INCIDENT_SUBTYPE) {
            return (
              techMapId != null &&
              summary.parity.blockingTechMapIds.includes(techMapId)
            );
          }

          if (subtype === TECHMAP_ROLLOUT_COMPANY_PARITY_INCIDENT_SUBTYPE) {
            return summary.parity.mapsWithBlockingDiffs > 0;
          }

          return true;
        })
        .map((incident) => {
          const details = this.normalizeMetadataRecord(incident.details);
          return {
            id: incident.id,
            subtype: this.extractTechMapRolloutSubtype(incident.details),
            severity: incident.severity,
            status: incident.status,
            traceId: incident.traceId ?? null,
            techMapId:
              typeof details.techMapId === "string" ? details.techMapId : null,
            runbookSuggestedAction:
              typeof details.runbookSuggestedAction === "string"
                ? details.runbookSuggestedAction
                : null,
            createdAt: incident.createdAt.toISOString(),
          };
        }),
    };
  }

  async getGenerationRolloutReadiness(companyId: string) {
    const summary = await this.getGenerationRolloutSummary(companyId);
    const blockers: string[] = [];
    const warnings: string[] = [];
    const coverageDenominator = summary.rolloutManagedMaps;

    if (summary.totalRapeseedMaps === 0) {
      blockers.push(
        "Нет сгенерированных rapeseed TechMap, поэтому cutover readiness не может быть подтверждён.",
      );
    }

    if (summary.parity.mapsWithBlockingDiffs > 0) {
      blockers.push(
        `Есть ${summary.parity.mapsWithBlockingDiffs} карт с blocking parity gaps.`,
      );
    }

    const openBlockingIncidents = (summary.rolloutIncidents ?? []).filter(
      (incident: { status: string; subtype?: string | null }) =>
        incident.status === "OPEN" &&
        (incident.subtype === TECHMAP_ROLLOUT_COMPANY_PARITY_INCIDENT_SUBTYPE ||
          incident.subtype === TECHMAP_ROLLOUT_PARITY_INCIDENT_SUBTYPE),
    );
    if (openBlockingIncidents.length > 0) {
      blockers.push(
        `Есть ${openBlockingIncidents.length} открытых rollout incident(s) по parity.`,
      );
    }

    if (
      coverageDenominator > 0 &&
      summary.metadataCoverage.versionPinnedCount < coverageDenominator
    ) {
      warnings.push(
        `Version pinning coverage ${summary.metadataCoverage.versionPinnedCount}/${coverageDenominator} ещё неполный.`,
      );
    }

    if (
      coverageDenominator > 0 &&
      summary.metadataCoverage.explainabilityTraceCount < coverageDenominator
    ) {
      warnings.push(
        `Explainability trace coverage ${summary.metadataCoverage.explainabilityTraceCount}/${coverageDenominator} ещё неполный.`,
      );
    }

    if (
      coverageDenominator > 0 &&
      summary.metadataCoverage.fieldAdmissionCount < coverageDenominator
    ) {
      warnings.push(
        `Field admission coverage ${summary.metadataCoverage.fieldAdmissionCount}/${coverageDenominator} ещё неполный.`,
      );
    }

    if (summary.rolloutModes.shadow > 0) {
      warnings.push(
        `Остаётся ${summary.rolloutModes.shadow} карт в shadow rollout mode.`,
      );
    }

    if (summary.fallback.usedCount > 0) {
      warnings.push(
        `Fallback path был использован ${summary.fallback.usedCount} раз.`,
      );
    }

    if (summary.strategies.canonicalSchema === 0) {
      blockers.push(
        "Нет ни одной карты, materialized через canonical_schema, поэтому canonical default нельзя включать.",
      );
    }

    const verdict =
      blockers.length > 0
        ? "BLOCKED"
        : warnings.length > 0
          ? "WARN"
          : "PASS";

    return {
      verdict,
      canEnableCanonicalDefault: verdict === "PASS",
      suggestedMode: verdict === "PASS" ? "canonical" : "shadow",
      blockers,
      warnings,
      releaseGates: {
        parityBlockingClear: summary.parity.mapsWithBlockingDiffs === 0,
        fallbackContained:
          summary.fallback.usedCount < TECHMAP_ROLLOUT_FALLBACK_ALERT_THRESHOLD,
        versionPinningComplete:
          coverageDenominator === 0 ||
          summary.metadataCoverage.versionPinnedCount === coverageDenominator,
        explainabilityCoverageComplete:
          coverageDenominator === 0 ||
          summary.metadataCoverage.explainabilityTraceCount === coverageDenominator,
        admissionCoverageComplete:
          coverageDenominator === 0 ||
          summary.metadataCoverage.fieldAdmissionCount === coverageDenominator,
        canonicalMapsPresent: summary.strategies.canonicalSchema > 0,
        noOpenParityIncidents: openBlockingIncidents.length === 0,
      },
      summary,
    };
  }

  async getGenerationRolloutCutoverPacket(companyId: string) {
    const readiness = await this.getGenerationRolloutReadiness(companyId);
    const currentMode = process.env.TECHMAP_RAPESEED_CANONICAL_MODE ?? "shadow";
    const currentCompanies = (process.env.TECHMAP_RAPESEED_CANONICAL_COMPANIES ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const recommendedMode = readiness.canEnableCanonicalDefault
      ? "canonical"
      : readiness.suggestedMode;
    const recommendedCompanies = new Set(currentCompanies);
    recommendedCompanies.add(companyId);
    const recommendedCompaniesList = Array.from(recommendedCompanies).sort();
    const recommendedCompanyFilter = recommendedCompaniesList.join(",");
    const releaseCommand = [
      `TECHMAP_RAPESEED_CANONICAL_MODE=${recommendedMode}`,
      `TECHMAP_RAPESEED_CANONICAL_COMPANIES=${recommendedCompanyFilter}`,
    ].join(" ");
    const rollbackMode = readiness.canEnableCanonicalDefault ? "shadow" : "legacy";
    const rollbackCommand = [
      `TECHMAP_RAPESEED_CANONICAL_MODE=${rollbackMode}`,
      `TECHMAP_RAPESEED_CANONICAL_COMPANIES=${currentCompanies.join(",")}`,
    ].join(" ");

    return {
      companyId,
      verdict: readiness.verdict,
      canExecuteCutover: readiness.canEnableCanonicalDefault,
      currentFeatureFlags: {
        mode: currentMode,
        companyFilter: currentCompanies.join(","),
      },
      recommendedFeatureFlags: {
        mode: recommendedMode,
        companyFilter: recommendedCompanyFilter,
      },
      releaseCommand,
      rollbackCommand,
      checklist: readiness.canEnableCanonicalDefault
        ? [
            "Зафиксировать текущее значение TECHMAP_RAPESEED_CANONICAL_MODE и company filter перед изменением.",
            "Включить canonical mode для компании через recommended feature flags.",
            "Сгенерировать новую rapeseed TechMap и убедиться, что generationStrategy = canonical_schema.",
            "Проверить, что rollout incidents не открылись повторно после первой canonical generation.",
            "Подтвердить, что readiness verdict остаётся PASS после cutover smoke.",
          ]
        : [
            "Не включать canonical default, пока readiness verdict не станет PASS.",
            "Разобрать blockers и warnings из readiness gate.",
            "Закрыть открытые rollout incidents и повторить generation smoke.",
            "Добиться полной parity/trace/admission coverage до cutover.",
          ],
      rollbackChecklist: [
        "Вернуть feature flags в rollback command.",
        "Повторно сгенерировать smoke TechMap и убедиться, что generationStrategy снова legacy_blueprint или shadow authoritative.",
        "Проверить, что новые blocker incidents не появились после rollback.",
      ],
      readiness,
    };
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

  async getExplainability(id: string, companyId: string) {
    const map = await this.prisma.techMap.findFirst({
      where: { id, companyId },
      include: {
        generationExplanationTrace: true,
        fieldAdmissionResult: true,
        decisionGates: {
          include: {
            recommendations: {
              where: {
                isActive: true,
              },
            },
          },
        },
        recommendations: {
          where: {
            isActive: true,
          },
        },
        changeOrders: {
          include: {
            approvals: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        monitoringSignals: true,
        ruleEvaluationTraces: {
          orderBy: {
            createdAt: "desc",
          },
        },
        controlPoints: {
          include: {
            mapStage: true,
            outcomeExplanations: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    } as any) as any;

    if (!map) {
      throw new NotFoundException("TechMap not found");
    }

    const deviationReviewIds = Array.from(
      new Set(
        map.controlPoints
          .flatMap((controlPoint: any) => controlPoint.outcomeExplanations || [])
          .map((outcome: any) => this.extractStringFromJson(outcome.payload, "deviationReviewId"))
          .filter(Boolean),
      ),
    ) as string[];

    const deviationReviews = deviationReviewIds.length
      ? await this.prisma.deviationReview.findMany({
          where: {
            id: {
              in: deviationReviewIds,
            },
            companyId,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : [];

    const operationIds = Array.from(
      new Set(
        map.controlPoints
          .flatMap((controlPoint: any) => controlPoint.outcomeExplanations || [])
          .map((outcome: any) =>
            this.extractStringFromJson(outcome.payload, "operationId"),
          )
          .filter(Boolean),
      ),
    ) as string[];

    const observationIds = Array.from(
      new Set(
        map.controlPoints
          .flatMap((controlPoint: any) => controlPoint.outcomeExplanations || [])
          .map((outcome: any) =>
            this.extractStringFromJson(outcome.payload, "observationId"),
          )
          .filter(Boolean),
      ),
    ) as string[];

    const evidenceRefs =
      operationIds.length || observationIds.length
        ? await this.prisma.evidence.findMany({
            where: {
              companyId,
              OR: [
                operationIds.length
                  ? {
                      operationId: {
                        in: operationIds,
                      },
                    }
                  : undefined,
                observationIds.length
                  ? {
                      observationId: {
                        in: observationIds,
                      },
                    }
                  : undefined,
              ].filter(Boolean) as Prisma.EvidenceWhereInput[],
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              evidenceType: true,
              fileUrl: true,
              capturedAt: true,
              createdAt: true,
              operationId: true,
              observationId: true,
              metadata: true,
            },
          })
        : [];

    const evidenceByOperationId = new Map<string, any[]>();
    const evidenceByObservationId = new Map<string, any[]>();
    for (const evidence of evidenceRefs) {
      const enrichedEvidence = this.attachEvidenceSourceAudit(evidence);
      if (enrichedEvidence.operationId) {
        evidenceByOperationId.set(enrichedEvidence.operationId, [
          ...(evidenceByOperationId.get(enrichedEvidence.operationId) ?? []),
          enrichedEvidence,
        ]);
      }
      if (enrichedEvidence.observationId) {
        evidenceByObservationId.set(enrichedEvidence.observationId, [
          ...(evidenceByObservationId.get(enrichedEvidence.observationId) ?? []),
          enrichedEvidence,
        ]);
      }
    }

    const controlPoints = map.controlPoints.map((controlPoint: any) => ({
      ...controlPoint,
      outcomeExplanations: (controlPoint.outcomeExplanations || []).map(
        (outcome: any) => {
          const operationId = this.extractStringFromJson(
            outcome.payload,
            "operationId",
          );
          const observationId = this.extractStringFromJson(
            outcome.payload,
            "observationId",
          );
          const attachedEvidence = this.uniqueEvidenceRefs([
            ...(operationId ? evidenceByOperationId.get(operationId) ?? [] : []),
            ...(observationId
              ? evidenceByObservationId.get(observationId) ?? []
              : []),
          ]);

          return {
            ...outcome,
            evidenceAudit: this.buildEvidenceAuditSummary(attachedEvidence),
            attachedEvidence,
          };
        },
      ),
    }));

    const explainabilityEvidenceAudit = this.buildEvidenceAuditSummary(
      this.uniqueEvidenceRefs(evidenceRefs.map((item) => this.attachEvidenceSourceAudit(item))),
    );
    const generationTraceId = this.extractGenerationTraceId(map.generationMetadata);
    const rolloutIncidents = await this.prisma.systemIncident.findMany({
      where: {
        companyId,
        incidentType: SystemIncidentType.UNKNOWN,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
    const relatedRolloutIncidents = rolloutIncidents
      .filter((incident) => {
        const subtype = this.extractTechMapRolloutSubtype(incident.details);
        if (!subtype) {
          return false;
        }
        const details = this.normalizeMetadataRecord(incident.details);
        return (
          details.techMapId === map.id ||
          (generationTraceId != null && incident.traceId === generationTraceId)
        );
      })
      .map((incident) => {
        const details = this.normalizeMetadataRecord(incident.details);
        return {
          id: incident.id,
          subtype: this.extractTechMapRolloutSubtype(incident.details),
          severity: incident.severity,
          status: incident.status,
          createdAt: incident.createdAt.toISOString(),
          traceId: incident.traceId ?? null,
          techMapId:
            typeof details.techMapId === "string" ? details.techMapId : null,
          runbookSuggestedAction:
            typeof details.runbookSuggestedAction === "string"
              ? details.runbookSuggestedAction
              : null,
          detailSummary:
            typeof details.detailSummary === "string"
              ? details.detailSummary
              : null,
        };
      });

    return {
      techMapId: map.id,
      crop: map.crop,
      cropForm: map.cropForm,
      canonicalBranch: map.canonicalBranch,
      generationMetadata: map.generationMetadata,
      generationObservability: this.buildGenerationObservabilitySnapshot(
        map.generationMetadata,
        map.generationExplanationTrace,
      ),
      fieldAdmissionResult: map.fieldAdmissionResult,
      generationExplanationTrace: map.generationExplanationTrace,
      recommendations: map.recommendations,
      decisionGates: map.decisionGates,
      runtimeArtifacts: {
        changeOrders: map.changeOrders,
        deviationReviews,
        evidenceAudit: explainabilityEvidenceAudit,
      },
      monitoringSignals: map.monitoringSignals,
      ruleEvaluationTraces: map.ruleEvaluationTraces,
      controlPoints,
      rolloutIncidents: relatedRolloutIncidents,
    };
  }

  private extractStringFromJson(
    payload: Prisma.JsonValue | null | undefined,
    key: string,
  ): string | null {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    const candidate = (payload as Record<string, unknown>)[key];
    return typeof candidate === "string" && candidate.length > 0
      ? candidate
      : null;
  }

  private attachEvidenceSourceAudit<
    T extends {
      id?: string;
      fileUrl?: string | null;
      metadata?: unknown;
      operationId?: string | null;
      observationId?: string | null;
      evidenceType?: string | null;
      createdAt?: Date | null;
      capturedAt?: Date | null;
    },
  >(evidence: T) {
    const metadata = this.normalizeMetadataRecord(evidence.metadata);
    const metadataAudit = this.normalizeMetadataRecord(
      metadata.executionSourceAudit,
    );
    const fallbackClassification = this.classifyEvidenceUrl(evidence.fileUrl);
    const urlKind =
      metadataAudit.urlKind === "artifact" ||
      metadataAudit.urlKind === "intermediate_route" ||
      metadataAudit.urlKind === "unknown"
        ? metadataAudit.urlKind
        : fallbackClassification.urlKind;
    const sourceScheme =
      typeof metadataAudit.sourceScheme === "string"
        ? metadataAudit.sourceScheme
        : fallbackClassification.sourceScheme;

    return {
      ...evidence,
      sourceAudit: {
        urlKind,
        sourceScheme,
        isIntermediateRoute: urlKind === "intermediate_route",
        isArtifactUrl: urlKind === "artifact",
      },
    };
  }

  private classifyEvidenceUrl(fileUrl: string | null | undefined) {
    const normalized = typeof fileUrl === "string" ? fileUrl.trim() : "";
    if (!normalized) {
      return {
        urlKind: "unknown" as const,
        sourceScheme: null,
      };
    }

    const intermediateScheme = INTERMEDIATE_EVIDENCE_ROUTE_SCHEMES.find(
      (scheme) => normalized.startsWith(scheme),
    );
    if (intermediateScheme) {
      return {
        urlKind: "intermediate_route" as const,
        sourceScheme: intermediateScheme.replace("://", ""),
      };
    }

    if (/^https?:\/\//.test(normalized)) {
      return {
        urlKind: "artifact" as const,
        sourceScheme: normalized.startsWith("https://") ? "https" : "http",
      };
    }

    const schemeMatch = normalized.match(/^([a-z0-9+.-]+):\/\//i);
    return {
      urlKind: "unknown" as const,
      sourceScheme: schemeMatch?.[1] ?? null,
    };
  }

  private normalizeMetadataRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private isLegacyCoverageOnlyParityGap(params: {
    authoritativeStrategy: unknown;
    referenceStrategy: unknown;
    code: string;
  }) {
    return (
      params.authoritativeStrategy === "canonical_schema" &&
      params.referenceStrategy === "blueprint_fallback" &&
      (params.code.startsWith("stage:") ||
        params.code.startsWith("stage_sequence:") ||
        params.code.startsWith("critical_op:"))
    );
  }

  private buildEffectiveShadowParitySummaryFromMetadata(
    generationMetadata: Prisma.JsonValue | null | undefined,
  ) {
    const metadata = this.normalizeMetadataRecord(generationMetadata);
    const rawSummary = this.normalizeMetadataRecord(metadata.shadowParitySummary);
    const rawReport = this.normalizeMetadataRecord(metadata.shadowParityReport);
    const authoritativeStrategy =
      typeof rawReport.authoritativeStrategy === "string"
        ? rawReport.authoritativeStrategy
        : rawSummary.authoritativeStrategy;
    const referenceStrategy =
      typeof rawReport.referenceStrategy === "string"
        ? rawReport.referenceStrategy
        : rawSummary.referenceStrategy;
    const rawDiffs = Array.isArray(rawReport.diffs) ? rawReport.diffs : [];

    if (rawDiffs.length === 0) {
      return Object.keys(rawSummary).length > 0 ? rawSummary : {};
    }

    const effectiveDiffs = rawDiffs.map((item) => {
      const diff = this.normalizeMetadataRecord(item);
      const severity =
        diff.severity === "P0" || diff.severity === "P1" || diff.severity === "P2"
          ? diff.severity
          : "P2";
      const code = typeof diff.code === "string" ? diff.code : "";

      if (
        severity === "P0" &&
        this.isLegacyCoverageOnlyParityGap({
          authoritativeStrategy,
          referenceStrategy,
          code,
        })
      ) {
        return {
          ...diff,
          severity: "P1",
        };
      }

      return {
        ...diff,
        severity,
      };
    });

    const severityCounts = {
      P0: effectiveDiffs.filter((diff) => diff.severity === "P0").length,
      P1: effectiveDiffs.filter((diff) => diff.severity === "P1").length,
      P2: effectiveDiffs.filter((diff) => diff.severity === "P2").length,
    };

    return {
      traceId:
        typeof rawReport.traceId === "string"
          ? rawReport.traceId
          : typeof rawSummary.traceId === "string"
            ? rawSummary.traceId
            : null,
      authoritativeStrategy:
        typeof authoritativeStrategy === "string" ? authoritativeStrategy : null,
      referenceStrategy:
        typeof referenceStrategy === "string" ? referenceStrategy : null,
      diffCount: effectiveDiffs.length,
      hasBlockingDiffs: severityCounts.P0 > 0,
      severityCounts,
      completeness: this.normalizeMetadataRecord(rawReport.completeness),
    };
  }

  private isRolloutManagedRapeseedMap(params: {
    isLatest?: boolean | null;
    generationMetadata: Prisma.JsonValue | null | undefined;
    generationExplanationTrace: { id?: string | null } | null | undefined;
    fieldAdmissionResult: { id?: string | null } | null | undefined;
  }) {
    if (params.isLatest === false) {
      return false;
    }

    const metadata = this.normalizeMetadataRecord(params.generationMetadata);
    const featureFlagSnapshot = this.normalizeMetadataRecord(
      metadata.featureFlagSnapshot,
    );

    return Boolean(
      typeof metadata.generationStrategy === "string" ||
        typeof metadata.generationTraceId === "string" ||
        Object.keys(featureFlagSnapshot).length > 0 ||
        params.generationExplanationTrace?.id ||
        params.fieldAdmissionResult?.id,
    );
  }

  private uniqueEvidenceRefs<T extends { id?: string | null }>(items: T[]) {
    const result = new Map<string, T>();
    for (const item of items) {
      if (!item?.id) {
        continue;
      }
      if (!result.has(item.id)) {
        result.set(item.id, item);
      }
    }

    return Array.from(result.values());
  }

  private buildGenerationObservabilitySnapshot(
    generationMetadata: Prisma.JsonValue | null | undefined,
    generationExplanationTrace:
      | {
          traceId?: string | null;
          completenessScore?: number | null;
        }
      | null
      | undefined,
  ) {
    const metadata = this.normalizeMetadataRecord(generationMetadata);
    const featureFlagSnapshot = this.normalizeMetadataRecord(
      metadata.featureFlagSnapshot,
    );
    const shadowParitySummary = this.buildEffectiveShadowParitySummaryFromMetadata(
      generationMetadata,
    );
    const shadowParityReport = this.normalizeMetadataRecord(
      metadata.shadowParityReport,
    );

    return {
      rolloutMode:
        typeof metadata.rolloutMode === "string" ? metadata.rolloutMode : null,
      fallbackUsed: metadata.fallbackUsed === true,
      fallbackReason:
        typeof metadata.fallbackReason === "string"
          ? metadata.fallbackReason
          : null,
      featureFlagSnapshot:
        Object.keys(featureFlagSnapshot).length > 0 ? featureFlagSnapshot : null,
      versionPinning: {
        schemaVersion:
          typeof metadata.schemaVersion === "string"
            ? metadata.schemaVersion
            : null,
        ruleRegistryVersion:
          typeof metadata.ruleRegistryVersion === "string"
            ? metadata.ruleRegistryVersion
            : null,
        ontologyVersion:
          typeof metadata.ontologyVersion === "string"
            ? metadata.ontologyVersion
            : null,
        generationTraceId:
          typeof metadata.generationTraceId === "string"
            ? metadata.generationTraceId
            : generationExplanationTrace?.traceId ?? null,
        generatorVersion:
          typeof metadata.generatorVersion === "string"
            ? metadata.generatorVersion
            : null,
      },
      shadowParitySummary:
        Object.keys(shadowParitySummary).length > 0 ? shadowParitySummary : null,
      shadowParityReport:
        Object.keys(shadowParityReport).length > 0 ? shadowParityReport : null,
      explainabilityTracePresent: Boolean(generationExplanationTrace?.traceId),
      completenessScore:
        typeof generationExplanationTrace?.completenessScore === "number"
          ? generationExplanationTrace.completenessScore
          : null,
    };
  }

  private async buildGenerationRolloutSummary(companyId: string) {
    const maps = await this.prisma.techMap.findMany({
      where: {
        companyId,
        crop: "rapeseed",
      },
      select: {
        id: true,
        isLatest: true,
        status: true,
        generationMetadata: true,
        generationExplanationTrace: {
          select: {
            id: true,
            traceId: true,
            completenessScore: true,
          },
        },
        fieldAdmissionResult: {
          select: {
            id: true,
            verdict: true,
          },
        },
      },
    });

    const summary = {
      totalRapeseedMaps: maps.length,
      rolloutManagedMaps: 0,
      legacyHistoricalMaps: 0,
      strategies: {
        legacyBlueprint: 0,
        blueprintFallback: 0,
        canonicalSchema: 0,
        unknown: 0,
      },
      rolloutModes: {
        legacy: 0,
        shadow: 0,
        canonical: 0,
        unknown: 0,
      },
      fallback: {
        usedCount: 0,
        reasons: {} as Record<string, number>,
      },
      metadataCoverage: {
        versionPinnedCount: 0,
        generationTraceCount: 0,
        explainabilityTraceCount: 0,
        fieldAdmissionCount: 0,
        featureFlagSnapshotCount: 0,
      },
      parity: {
        mapsWithReport: 0,
        mapsWithBlockingDiffs: 0,
        mapsWithoutDiffs: 0,
        blockingTechMapIds: [] as string[],
        diffCounts: {
          P0: 0,
          P1: 0,
          P2: 0,
        },
      },
    };

    for (const map of maps) {
      const metadata = this.normalizeMetadataRecord(map.generationMetadata);
      const strategy =
        typeof metadata.generationStrategy === "string"
          ? metadata.generationStrategy
          : null;
      const rolloutMode =
        typeof metadata.rolloutMode === "string" ? metadata.rolloutMode : null;
      const fallbackUsed = metadata.fallbackUsed === true;
      const fallbackReason =
        typeof metadata.fallbackReason === "string"
          ? metadata.fallbackReason
          : null;
      const featureFlagSnapshot = this.normalizeMetadataRecord(
        metadata.featureFlagSnapshot,
      );
      const shadowParitySummary = this.buildEffectiveShadowParitySummaryFromMetadata(
        map.generationMetadata,
      );
      const isRolloutManaged = this.isRolloutManagedRapeseedMap({
        isLatest: map.isLatest,
        generationMetadata: map.generationMetadata,
        generationExplanationTrace: map.generationExplanationTrace,
        fieldAdmissionResult: map.fieldAdmissionResult,
      });

      if (isRolloutManaged) {
        summary.rolloutManagedMaps += 1;
      } else {
        summary.legacyHistoricalMaps += 1;
        continue;
      }

      if (strategy === "legacy_blueprint") {
        summary.strategies.legacyBlueprint += 1;
      } else if (strategy === "blueprint_fallback") {
        summary.strategies.blueprintFallback += 1;
      } else if (strategy === "canonical_schema") {
        summary.strategies.canonicalSchema += 1;
      } else {
        summary.strategies.unknown += 1;
      }

      if (rolloutMode === "legacy") {
        summary.rolloutModes.legacy += 1;
      } else if (rolloutMode === "shadow") {
        summary.rolloutModes.shadow += 1;
      } else if (rolloutMode === "canonical") {
        summary.rolloutModes.canonical += 1;
      } else {
        summary.rolloutModes.unknown += 1;
      }

      if (fallbackUsed) {
        summary.fallback.usedCount += 1;
        const reasonKey = fallbackReason ?? "unspecified";
        summary.fallback.reasons[reasonKey] =
          (summary.fallback.reasons[reasonKey] ?? 0) + 1;
      }

      if (
        typeof metadata.schemaVersion === "string" &&
        typeof metadata.ruleRegistryVersion === "string" &&
        typeof metadata.ontologyVersion === "string"
      ) {
        summary.metadataCoverage.versionPinnedCount += 1;
      }

      if (typeof metadata.generationTraceId === "string") {
        summary.metadataCoverage.generationTraceCount += 1;
      }

      if (Object.keys(featureFlagSnapshot).length > 0) {
        summary.metadataCoverage.featureFlagSnapshotCount += 1;
      }

      if (map.generationExplanationTrace?.id) {
        summary.metadataCoverage.explainabilityTraceCount += 1;
      }

      if (map.fieldAdmissionResult?.id) {
        summary.metadataCoverage.fieldAdmissionCount += 1;
      }

      if (Object.keys(shadowParitySummary).length > 0) {
        summary.parity.mapsWithReport += 1;

        if (shadowParitySummary.hasBlockingDiffs === true) {
          summary.parity.mapsWithBlockingDiffs += 1;
          summary.parity.blockingTechMapIds.push(map.id);
        }

        if (shadowParitySummary.diffCount === 0) {
          summary.parity.mapsWithoutDiffs += 1;
        }

        const severityCounts = this.normalizeMetadataRecord(
          shadowParitySummary.severityCounts,
        );
        summary.parity.diffCounts.P0 += this.readNumericCounter(
          severityCounts.P0,
        );
        summary.parity.diffCounts.P1 += this.readNumericCounter(
          severityCounts.P1,
        );
        summary.parity.diffCounts.P2 += this.readNumericCounter(
          severityCounts.P2,
        );
      }
    }

    return summary;
  }

  private extractGenerationTraceId(
    generationMetadata: Prisma.JsonValue | null | undefined,
  ) {
    const metadata = this.normalizeMetadataRecord(generationMetadata);
    return typeof metadata.generationTraceId === "string"
      ? metadata.generationTraceId
      : null;
  }

  private extractTechMapRolloutSubtype(details: unknown) {
    const record = this.normalizeMetadataRecord(details);
    const subtype =
      typeof record.subtype === "string" ? record.subtype : null;
    if (
      subtype === TECHMAP_ROLLOUT_PARITY_INCIDENT_SUBTYPE ||
      subtype === TECHMAP_ROLLOUT_COMPANY_PARITY_INCIDENT_SUBTYPE ||
      subtype === TECHMAP_ROLLOUT_FALLBACK_INCIDENT_SUBTYPE
    ) {
      return subtype;
    }
    return null;
  }

  private async syncGenerationRolloutIncidents(params: {
    companyId: string;
    techMapId: string;
    generationBundle: {
      cropForm?: string | null;
      canonicalBranch?: string | null;
      generationStrategy: string;
      generationMetadata: Record<string, unknown>;
      shadowParityReport?: {
        hasBlockingDiffs: boolean;
        diffs: Array<{ severity: string }>;
      } | null;
    };
  }) {
    const generationTraceId = this.extractGenerationTraceId(
      params.generationBundle.generationMetadata as Prisma.JsonValue,
    );
    const shadowParitySummary = this.buildEffectiveShadowParitySummaryFromMetadata(
      params.generationBundle.generationMetadata as Prisma.JsonValue,
    );
    const severityCounts = this.normalizeMetadataRecord(
      shadowParitySummary.severityCounts,
    );
    const rolloutMode =
      typeof params.generationBundle.generationMetadata.rolloutMode === "string"
        ? params.generationBundle.generationMetadata.rolloutMode
        : null;
    const fallbackUsed =
      params.generationBundle.generationMetadata.fallbackUsed === true;

    await this.syncTechMapUnknownIncident({
      companyId: params.companyId,
      traceId: generationTraceId,
      subtype: TECHMAP_ROLLOUT_PARITY_INCIDENT_SUBTYPE,
      techMapId: params.techMapId,
      shouldBeOpen: shadowParitySummary.hasBlockingDiffs === true,
      severity: "HIGH",
      details: {
        subtype: TECHMAP_ROLLOUT_PARITY_INCIDENT_SUBTYPE,
        scope: "techmap_generation",
        techMapId: params.techMapId,
        generationTraceId,
        cropForm: params.generationBundle.cropForm ?? null,
        canonicalBranch: params.generationBundle.canonicalBranch ?? null,
        generationStrategy: params.generationBundle.generationStrategy,
        rolloutMode,
        fallbackUsed,
        diffCount: this.readNumericCounter(shadowParitySummary.diffCount),
        severityCounts: {
          P0: this.readNumericCounter(severityCounts.P0),
          P1: this.readNumericCounter(severityCounts.P1),
          P2: this.readNumericCounter(severityCounts.P2),
        },
        runbookSuggestedAction: IncidentRunbookAction.REQUIRE_HUMAN_REVIEW,
        detailSummary:
          "Карта содержит blocking parity gaps и требует human review до cutover.",
      },
    });
  }

  private async syncCompanyRolloutIncidents(companyId: string) {
    const summary = await this.buildGenerationRolloutSummary(companyId);

    await this.syncCompanyUnknownIncident({
      companyId,
      subtype: TECHMAP_ROLLOUT_COMPANY_PARITY_INCIDENT_SUBTYPE,
      shouldBeOpen: summary.parity.mapsWithBlockingDiffs > 0,
      severity: summary.parity.diffCounts.P0 > 0 ? "HIGH" : "MEDIUM",
      details: {
        subtype: TECHMAP_ROLLOUT_COMPANY_PARITY_INCIDENT_SUBTYPE,
        scope: "company_rollout",
        blockingMapCount: summary.parity.mapsWithBlockingDiffs,
        diffCounts: summary.parity.diffCounts,
        runbookSuggestedAction: IncidentRunbookAction.REQUIRE_HUMAN_REVIEW,
        detailSummary:
          "В rollout есть карты с blocking parity gaps; нужен company-level human review.",
      },
    });

    await this.syncCompanyUnknownIncident({
      companyId,
      subtype: TECHMAP_ROLLOUT_FALLBACK_INCIDENT_SUBTYPE,
      shouldBeOpen:
        summary.fallback.usedCount >= TECHMAP_ROLLOUT_FALLBACK_ALERT_THRESHOLD,
      severity:
        summary.fallback.usedCount >=
        TECHMAP_ROLLOUT_FALLBACK_ALERT_THRESHOLD * 2
          ? "HIGH"
          : "MEDIUM",
      details: {
        subtype: TECHMAP_ROLLOUT_FALLBACK_INCIDENT_SUBTYPE,
        scope: "company_rollout",
        fallbackUsedCount: summary.fallback.usedCount,
        fallbackReasons: summary.fallback.reasons,
        threshold: TECHMAP_ROLLOUT_FALLBACK_ALERT_THRESHOLD,
        runbookSuggestedAction: IncidentRunbookAction.REQUIRE_HUMAN_REVIEW,
        detailSummary:
          "Fallback используется повторно и rollout требует human review по cutover readiness.",
      },
    });
  }

  private async syncTechMapUnknownIncident(params: {
    companyId: string;
    traceId: string | null;
    subtype: string;
    techMapId: string;
    shouldBeOpen: boolean;
    severity: string;
    details: Record<string, unknown>;
  }) {
    const openIncidents = await this.prisma.systemIncident.findMany({
      where: {
        companyId: params.companyId,
        incidentType: SystemIncidentType.UNKNOWN,
        status: SystemIncidentStatus.OPEN,
      },
    });
    const matched = openIncidents.find((incident) => {
      const details = this.normalizeMetadataRecord(incident.details);
      return (
        details.subtype === params.subtype && details.techMapId === params.techMapId
      );
    });

    if (params.shouldBeOpen) {
      if (matched) {
        await this.prisma.systemIncident.update({
          where: { id: matched.id },
          data: {
            traceId: params.traceId ?? undefined,
            severity: params.severity,
            details: params.details as Prisma.InputJsonValue,
          },
        });
        return;
      }

      await this.prisma.systemIncident.create({
        data: {
          companyId: params.companyId,
          traceId: params.traceId ?? undefined,
          incidentType: SystemIncidentType.UNKNOWN,
          status: SystemIncidentStatus.OPEN,
          severity: params.severity,
          details: params.details as Prisma.InputJsonValue,
        },
      });
      return;
    }

    if (matched) {
      await this.prisma.systemIncident.update({
        where: { id: matched.id },
        data: {
          status: SystemIncidentStatus.RESOLVED,
          resolvedAt: new Date(),
          resolveComment: "Parity condition cleared by latest generation state.",
        },
      });
    }
  }

  private async syncCompanyUnknownIncident(params: {
    companyId: string;
    subtype: string;
    shouldBeOpen: boolean;
    severity: string;
    details: Record<string, unknown>;
  }) {
    const openIncidents = await this.prisma.systemIncident.findMany({
      where: {
        companyId: params.companyId,
        incidentType: SystemIncidentType.UNKNOWN,
        status: SystemIncidentStatus.OPEN,
      },
    });
    const matched = openIncidents.find((incident) => {
      const details = this.normalizeMetadataRecord(incident.details);
      return details.subtype === params.subtype;
    });

    if (params.shouldBeOpen) {
      if (matched) {
        await this.prisma.systemIncident.update({
          where: { id: matched.id },
          data: {
            severity: params.severity,
            details: params.details as Prisma.InputJsonValue,
          },
        });
        return;
      }

      await this.prisma.systemIncident.create({
        data: {
          companyId: params.companyId,
          incidentType: SystemIncidentType.UNKNOWN,
          status: SystemIncidentStatus.OPEN,
          severity: params.severity,
          details: params.details as Prisma.InputJsonValue,
        },
      });
      return;
    }

    if (matched) {
      await this.prisma.systemIncident.update({
        where: { id: matched.id },
        data: {
          status: SystemIncidentStatus.RESOLVED,
          resolvedAt: new Date(),
          resolveComment: "Rollout condition cleared by latest summary state.",
        },
      });
    }
  }

  private readNumericCounter(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }

  private buildEvidenceAuditSummary(
    evidenceRefs: Array<{
      evidenceType?: string | null;
      sourceAudit?: {
        urlKind?: "artifact" | "intermediate_route" | "unknown";
      };
    }>,
  ) {
    const artifactEvidenceCount = evidenceRefs.filter(
      (item) => item?.sourceAudit?.urlKind === "artifact",
    ).length;
    const intermediateRouteEvidenceCount = evidenceRefs.filter(
      (item) => item?.sourceAudit?.urlKind === "intermediate_route",
    ).length;

    return {
      artifactEvidenceCount,
      intermediateRouteEvidenceCount,
      unresolvedRouteEvidenceTypes: evidenceRefs
        .filter((item) => item?.sourceAudit?.urlKind === "intermediate_route")
        .map((item) => item?.evidenceType)
        .filter(Boolean),
    };
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
    const missingMust = canonicalDraft.gaps
      .filter((gap) => gap.severity === "blocking")
      .map((gap) => gap.slot_key ?? gap.gap_id);
    const hasBudgetPolicy = Boolean(
      map.harvestPlan.minValue != null ||
        map.harvestPlan.optValue != null ||
        map.harvestPlan.maxValue != null ||
        map.harvestPlan.baselineValue != null,
    );
    const hasExecutionHistory = Boolean((map as any).stages?.length);
    const hasPastOutcomes = Boolean((map as any).season?.actualYield != null);
    const hasTargetKpiPolicy = Boolean(
      map.harvestPlan.targetMetric ?? map.harvestPlan.period,
    );
    const hasWeatherNormals = Boolean(
      (map as any).season?.field?.protectedZoneFlags ??
        (map as any).season?.field?.drainageClass ??
        (map as any).season?.field?.slopePercent,
    );
    const workflowOrchestration = this.workflowOrchestrator.buildWorkflowTrace({
      workflow_id: snapshot.workflow_id,
      draft_id: canonicalDraft.header.version_id ?? canonicalDraft.header.workflow_id,
      lead_owner_agent: "agronomist",
      readiness: canonicalDraft.readiness,
      publication_state: canonicalDraft.publication_state,
      workflow_verdict: snapshot.workflow_verdict,
      clarify_items: [],
      missing_must: missingMust,
      has_budget_policy: hasBudgetPolicy,
      has_execution_history: hasExecutionHistory,
      has_past_outcomes: hasPastOutcomes,
      has_allowed_input_catalog_version: canonicalDraft.variants.length > 0,
      has_target_kpi_policy: hasTargetKpiPolicy,
      has_weather_normals: hasWeatherNormals,
      branch_trust_assessments: snapshot.branch_trust_assessments,
      trust_specialization: snapshot.trust_specialization ?? null,
      expert_review: snapshot.expert_review ?? null,
      resume_requested: false,
    });
    const executionLoopSummary = this.buildExecutionLoopSummary({
      companyId,
      fieldRef: map.fieldId ?? map.cropZone?.fieldId ?? "",
      seasonRef: map.seasonId ?? map.cropZone?.seasonId ?? "",
      crop:
        String(map.crop ?? map.cropZone?.cropType ?? "rapeseed").toLowerCase() ===
        "sunflower"
          ? "sunflower"
          : "rapeseed",
      workflowId: snapshot.workflow_id,
      draftId: map.id,
      missingMust,
      gaps: canonicalDraft.gaps,
      hasExecutionHistory,
      hasPastOutcomes,
      hasMaterializedOperations: Boolean(canonicalDraft.variants[0]?.operations.length),
      targetYieldTHa:
        map.cropZone?.targetYieldTHa ?? (map as any).season?.expectedYield ?? null,
      actualYieldTHa: (map as any).season?.actualYield ?? null,
      baselineYieldTHa:
        map.harvestPlan.baselineValue ??
        map.harvestPlan.optValue ??
        (map as any).season?.expectedYield ??
        null,
      runtimeAdoptionSnapshot: snapshot,
      workflowOrchestration,
    });
    const nextActions = this.resolveWorkflowNextActions([], snapshot);
    const workflowExplainability = this.buildWorkflowExplainabilityPayload({
      readiness: canonicalDraft.readiness,
      workflowVerdict: snapshot.workflow_verdict,
      publicationState: canonicalDraft.publication_state,
      clarifyItems: [],
      missingMust,
      gaps: canonicalDraft.gaps,
      nextActions,
      trustSpecialization: snapshot.trust_specialization ?? null,
      executionLoopSummary,
    });
    const workflowSnapshot: TechMapWorkflowSnapshot = {
      workflow_id: snapshot.workflow_id,
      draft_id: map.id,
      workflow_mode: "resume",
      readiness: canonicalDraft.readiness,
      workflow_verdict: snapshot.workflow_verdict,
      publication_state: canonicalDraft.publication_state,
      missing_must: missingMust,
      clarify_batch: null,
      workflow_resume_state: null,
      workflow_orchestration: workflowOrchestration,
      trust_specialization: snapshot.trust_specialization ?? null,
      next_actions: nextActions,
    };

    return {
      ...snapshot,
      workflow_orchestration: workflowOrchestration,
      workflow_snapshot: workflowSnapshot,
      execution_loop_summary: executionLoopSummary,
      workflow_explainability: workflowExplainability,
    };
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
        cropForm: null,
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
    const generationStrategy =
      typeof metadata.generationStrategy === "string"
        ? metadata.generationStrategy
        : null;
    const schemaVersion =
      typeof metadata.schemaVersion === "string"
        ? metadata.schemaVersion
        : null;
    const blueprintVersion =
      typeof metadata.blueprintVersion === "string"
        ? metadata.blueprintVersion
        : null;

    if (generationStrategy && schemaVersion) {
      return `${generationStrategy}:${schemaVersion}`;
    }

    if (!source || !blueprintVersion) {
      return null;
    }

    return `${source}:${blueprintVersion}`;
  }

  private normalizeOperationType(
    operationType: string | null | undefined,
    operationName: string,
  ): OperationType | null {
    const normalized = String(operationType ?? "").trim().toUpperCase();
    const mapped: Record<string, OperationType> = {
      INSPECTION: OperationType.SCOUTING,
      SCOUTING: OperationType.SCOUTING,
      SAMPLING: OperationType.SAMPLING,
      SEEDING: OperationType.SOWING,
      SOWING: OperationType.SOWING,
      TILLAGE: OperationType.SOIL_TILLAGE,
      SOIL_PREP: OperationType.SOIL_TILLAGE,
      SOIL_TILLAGE: OperationType.SOIL_TILLAGE,
      FERTILIZER_APP: OperationType.FERTILIZATION,
      FERTILIZATION: OperationType.FERTILIZATION,
      FUNGICIDE_APP: OperationType.PESTICIDE_APP,
      PESTICIDE_APP: OperationType.PESTICIDE_APP,
      SEED_TREATMENT: OperationType.PESTICIDE_APP,
      ROLLING: OperationType.ROLLING,
      HARVEST: OperationType.HARVEST,
      DESICCATION: OperationType.DESICCATION,
      TRANSPORT: OperationType.TRANSPORT,
    };

    if (mapped[normalized]) {
      return mapped[normalized];
    }

    const fallbackName = operationName.toLowerCase();
    if (fallbackName.includes("уборк")) {
      return OperationType.HARVEST;
    }
    if (fallbackName.includes("посев")) {
      return OperationType.SOWING;
    }
    if (fallbackName.includes("прикаты")) {
      return OperationType.ROLLING;
    }
    if (fallbackName.includes("мониторинг") || fallbackName.includes("оценка")) {
      return OperationType.SCOUTING;
    }

    return null;
  }

  private async persistCanonicalRegistries(
    tx: Prisma.TransactionClient,
    generationBundle: GeneratedTechMapBundle,
    companyId: string,
  ) {
    for (const rule of generationBundle.attachedRules) {
      await (tx as any).ruleRegistryEntry.upsert({
        where: {
          ruleId: rule.ruleId,
        },
        update: {
          layer: rule.layer,
          type: rule.type,
          confidence: rule.confidence ?? null,
          sourceVersion:
            (generationBundle.generationMetadata.ruleRegistryVersion as string) ?? null,
          companyId,
        },
        create: {
          ruleId: rule.ruleId,
          layer: rule.layer,
          type: rule.type,
          confidence: rule.confidence ?? null,
          sourceVersion:
            (generationBundle.generationMetadata.ruleRegistryVersion as string) ?? null,
          companyId,
        },
      });
    }

    for (const threshold of generationBundle.attachedThresholds) {
      await (tx as any).thresholdRegistry.upsert({
        where: {
          thresholdId: threshold.thresholdId,
        },
        update: {
          parameter: threshold.parameter,
          comparator: threshold.comparator,
          value: threshold.value as Prisma.InputJsonValue,
          cropScope: threshold.cropScope ?? null,
          stageScope: threshold.stageScope ?? null,
          actionOnBreach: threshold.actionOnBreach ?? null,
          sourceVersion:
            (generationBundle.generationMetadata.schemaVersion as string) ?? null,
          companyId,
        },
        create: {
          thresholdId: threshold.thresholdId,
          parameter: threshold.parameter,
          comparator: threshold.comparator,
          value: threshold.value as Prisma.InputJsonValue,
          cropScope: threshold.cropScope ?? null,
          stageScope: threshold.stageScope ?? null,
          actionOnBreach: threshold.actionOnBreach ?? null,
          sourceVersion:
            (generationBundle.generationMetadata.schemaVersion as string) ?? null,
          companyId,
        },
      });
    }
  }

  private async persistDecisionArtifacts(
    tx: Prisma.TransactionClient,
    techMapId: string,
    companyId: string,
    generationBundle: GeneratedTechMapBundle,
  ) {
    for (const gate of generationBundle.decisionGates) {
      await (tx as any).decisionGate.create({
        data: {
          techMapId,
          gateType: gate.gateType,
          severity: gate.severity,
          title: gate.title,
          rationale: (gate.rationale ?? null) as Prisma.InputJsonValue,
          companyId,
        },
      });
    }

    for (const recommendation of generationBundle.recommendations) {
      await (tx as any).recommendation.create({
        data: {
          techMapId,
          severity: recommendation.severity,
          code: recommendation.code ?? null,
          title: recommendation.title,
          message: recommendation.message,
          rationale:
            (recommendation.rationale ?? null) as Prisma.InputJsonValue,
          companyId,
        },
      });
    }
  }

  private async persistRuleEvaluationTraces(
    tx: Prisma.TransactionClient,
    techMapId: string,
    companyId: string,
    generationBundle: GeneratedTechMapBundle,
  ) {
    for (const rule of generationBundle.attachedRules) {
      const registry = await (tx as any).ruleRegistryEntry.findUnique({
        where: {
          ruleId: rule.ruleId,
        },
      });

      await (tx as any).ruleEvaluationTrace.create({
        data: {
          techMapId,
          ruleRegistryEntryId: registry?.id ?? null,
          traceType: "generation_binding",
          status: "BOUND",
          severity: rule.type,
          payload: {
            ref: rule.ref,
            appliesTo: rule.appliesTo,
            generationStrategy: generationBundle.generationStrategy,
          },
          companyId,
        },
      });
    }

    if (generationBundle.fieldAdmission) {
      for (const issue of [
        ...generationBundle.fieldAdmission.blockers,
        ...generationBundle.fieldAdmission.requirements,
        ...generationBundle.fieldAdmission.recommendations,
      ]) {
        const registry = await (tx as any).ruleRegistryEntry.findUnique({
          where: {
            ruleId: issue.ruleId,
          },
        });

        await (tx as any).ruleEvaluationTrace.create({
          data: {
            techMapId,
            ruleRegistryEntryId: registry?.id ?? null,
            traceType: "admission",
            status: issue.blocking ? "BLOCKING" : "REPORTED",
            severity: issue.severity,
            payload: {
              enforcementMode: issue.enforcementMode,
              message: issue.message,
              payload: issue.payload ?? null,
            },
            companyId,
          },
        });
      }
    }
  }

}
