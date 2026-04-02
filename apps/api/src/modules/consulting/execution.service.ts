import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { EvidenceType, ExecutionStatus, TechMapStatus } from "@rai/prisma-client";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CompleteOperationDto } from "../../shared/consulting/dto/complete-operation.dto";
import { ConsultingOperationCompletedEvent } from "./events/consulting-operation-completed.event";
import { OutboxService } from "../../shared/outbox/outbox.service";
import { EvidenceService } from "../tech-map/evidence/evidence.service";
import { EvidenceCreateDto } from "../tech-map/dto/evidence.dto";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { ExecutionObservationCreateDto } from "./dto/execution-observation.dto";

export interface ExecutionContext {
  userId: string;
  companyId: string;
}

const INTERMEDIATE_EVIDENCE_ROUTE_SCHEMES = [
  "camera://",
  "weather-api://",
  "satellite://",
  "geo://",
  "lab://",
  "files://",
] as const;

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly outbox: OutboxService,
    private readonly evidenceService: EvidenceService,
    private readonly fieldObservationService: FieldObservationService,
  ) {}

  /**
   * Инициализирует запись об исполнении для операции, если её ещё нет.
   */
  async getOrCreateExecution(operationId: string, context: ExecutionContext) {
    const operation = await this.prisma.mapOperation.findUnique({
      where: { id: operationId },
      include: { mapStage: { include: { techMap: true } } },
    });

    if (
      !operation ||
      operation.mapStage.techMap.companyId !== context.companyId
    ) {
      throw new NotFoundException("Операция техкарты не найдена");
    }

    // Phase 2.3 Strict Context: Only ACTIVE TechMaps can be executed
    if (operation.mapStage.techMap.status !== TechMapStatus.ACTIVE) {
      throw new BadRequestException(
        "Нельзя создать исполнение для неактивной ТехКарты. Активируйте карту.",
      );
    }

    let execution = await this.prisma.executionRecord.findUnique({
      where: { operationId, companyId: context.companyId },
    });

    if (!execution) {
      // Fetch Active Budget Context for Snapshot (PHASE0-CORE-001)
      const harvestPlan = operation.mapStage.techMap.harvestPlanId
        ? await this.prisma.harvestPlan.findUnique({
            where: { id: operation.mapStage.techMap.harvestPlanId },
            include: { activeBudgetPlan: true },
          })
        : null;

      execution = await this.prisma.executionRecord.create({
        data: {
          operationId,
          status: ExecutionStatus.PLANNED,
          companyId: context.companyId,
          plannedDate: operation.plannedStartTime,
          // Immutable Integrity Snapshots
          budgetPlanId: harvestPlan?.activeBudgetPlanId ?? null,
          budgetVersion: harvestPlan?.activeBudgetPlan?.version ?? null,
          techMapId: operation.mapStage.techMap.id,
          techMapVersion: operation.mapStage.techMap.version,
        },
      });
    }

    return execution;
  }

  /**
   * Переводит операцию в статус IN_PROGRESS.
   */
  async startOperation(operationId: string, context: ExecutionContext) {
    const execution = await this.getOrCreateExecution(operationId, context);

    if (execution.status !== ExecutionStatus.PLANNED) {
      throw new BadRequestException(
        `Нельзя начать операцию в статусе ${execution.status}`,
      );
    }

    return this.prisma.executionRecord.update({
      where: { id: execution.id, companyId: context.companyId },
      data: {
        status: ExecutionStatus.IN_PROGRESS,
        actualDate: new Date(),
        version: { increment: 1 },
      },
    });
  }

  /**
   * Завершает операцию, фиксирует списание ресурсов и публикует событие.
   */
  async completeOperation(
    dto: CompleteOperationDto,
    context: ExecutionContext,
  ) {
    const execution = await this.getOrCreateExecution(dto.operationId, context);

    if (execution.status !== ExecutionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        "Завершить можно только операцию в статусе IN_PROGRESS",
      );
    }

    // Атомарная транзакция: Обновление статуса + Списание + Публикация
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Обновляем статус исполнения (Optimistic Locking)
      const updatedExecution = await tx.executionRecord.update({
        where: {
          id: execution.id,
          companyId: context.companyId,
          version: execution.version,
        },
        data: {
          status: ExecutionStatus.DONE,
          actualDate: new Date(),
          notes: dto.notes,
          performedById: context.userId,
          version: { increment: 1 },
        },
        include: {
          operation: { include: { mapStage: { include: { techMap: true } } } },
        },
      });

      // 2. Создаем записи StockTransaction (списания)
      const stockTransactions = [];
      for (const resEntry of dto.actualResources) {
        const mapResource = await tx.mapResource.findUnique({
          where: { id: resEntry.resourceId }, // tenant-lint:ignore mapResource has no companyId; ownership validated by mapOperationId check below
        });

        if (!mapResource || mapResource.mapOperationId !== dto.operationId) {
          throw new BadRequestException(
            `Ресурс ${resEntry.resourceId} не принадлежит данной операции`,
          );
        }

        // Поиск или создание StockItem (заглушка для ассет-реджистри)
        let stockItem = await tx.stockItem.findFirst({
          where: { companyId: context.companyId, name: mapResource.name },
        });

        if (!stockItem) {
          stockItem = await tx.stockItem.create({
            data: {
              name: mapResource.name,
              type: "OTHER" as any, // fallback
              companyId: context.companyId,
              accountId: (
                await tx.account.findFirst({
                  where: { companyId: context.companyId },
                })
              ).id,
              unit: mapResource.unit,
            },
          });
        }

        const transaction = await tx.stockTransaction.create({
          data: {
            companyId: context.companyId,
            executionId: updatedExecution.id,
            itemId: stockItem.id,
            type: "CONSUMPTION", // Assuming 'CONSUMPTION' is a valid string literal for type
            amount: resEntry.amount,
            resourceType: mapResource.type,
            resourceName: mapResource.name,
            unit: mapResource.unit,
            costPerUnit: mapResource.costPerUnit,
            totalCost: (mapResource.costPerUnit || 0) * resEntry.amount,
            userId: context.userId,
          },
        });
        stockTransactions.push(transaction);
      }

      // 3. (Refactor Phase 1) Transactional Outbox Pattern
      // Вместо прямой отправки события, мы пишем его в Outbox в той же транзакции.
      // Relay (OutboxRelay) позже подхватит его и отправит в EventEmitter/Broker.
      const payload = {
        executionId: updatedExecution.id,
        operationId: dto.operationId,
        techMapId: updatedExecution.operation.mapStage.techMapId,
        stockTransactionIds: stockTransactions.map((t) => t.id),
        companyId: context.companyId,
      };

      await this.outbox.persistEvent(
        tx as any,
        updatedExecution.id,
        "ExecutionRecord",
        "consulting.operation.completed",
        payload,
      );

      return { updatedExecution, stockTransactions };
    });

    // 4. (Removed) Event emission is now handled by Outbox Relay
    // this.eventEmitter.emit(...) removed

    return result;

    return result;
  }

  /**
   * Получает список всех активных операций для операционного дашборда.
   */
  async getActiveOperations(context: ExecutionContext) {
    const operations = await this.prisma.mapOperation.findMany({
      where: {
        mapStage: {
          techMap: {
            harvestPlan: {
              companyId: context.companyId,
              status: { in: ["ACTIVE", "APPROVED"] },
            },
          },
        },
      },
      include: {
        resources: true,
        evidence: {
          orderBy: {
            createdAt: "desc",
          },
        },
        executionRecord: true,
        mapStage: {
          include: {
            controlPoints: {
              include: {
                outcomeExplanations: {
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 1,
                },
              },
            },
            techMap: {
              include: {
                harvestPlan: {
                  include: { account: true },
                },
                decisionGates: {
                  include: {
                    recommendations: {
                      where: {
                        isActive: true,
                      },
                    },
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                recommendations: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    createdAt: "desc",
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
              },
            },
          },
        },
      },
      orderBy: { plannedStartTime: "asc" },
    });

    const operationsWithObservations = await this.attachRecentObservations(
      operations,
      context.companyId,
    );

    const operationsWithGovernance = await this.attachGovernanceSummary(
      operationsWithObservations,
      context.companyId,
    );

    return this.attachEvidenceSummary(operationsWithGovernance);
  }

  async attachOperationEvidence(
    dto: Omit<EvidenceCreateDto, "companyId">,
    context: ExecutionContext,
  ) {
    await this.assertOperationInExecutionScope(dto.operationId ?? null, context);

    const metadata = this.buildExecutionEvidenceMetadata(dto);

    return this.evidenceService.attachEvidence(
      {
        ...dto,
        metadata,
        companyId: context.companyId,
      },
      context.companyId,
    );
  }

  async getOperationEvidence(operationId: string, context: ExecutionContext) {
    await this.assertOperationInExecutionScope(operationId, context);
    const evidence = await this.evidenceService.getByOperation(
      operationId,
      context.companyId,
    );
    return evidence.map((item) => this.attachEvidenceSourceAudit(item));
  }

  async getOperationEvidenceStatus(operationId: string, context: ExecutionContext) {
    await this.assertOperationInExecutionScope(operationId, context);
    return this.evidenceService.validateOperationCompletion(
      operationId,
      context.companyId,
    );
  }

  async getOperationObservations(
    operationId: string,
    context: ExecutionContext,
  ) {
    const operation = await this.assertOperationInExecutionScope(
      operationId,
      context,
    );

    return this.findRecentObservationsForTechMapContext(
      operation.mapStage?.techMap?.fieldId ?? null,
      operation.mapStage?.techMap?.seasonId ?? null,
      context.companyId,
    );
  }

  async createOperationObservation(
    dto: ExecutionObservationCreateDto,
    context: ExecutionContext,
  ) {
    const operation = await this.assertOperationInExecutionScope(
      dto.operationId,
      context,
    );
    const techMap = operation.mapStage?.techMap;

    if (!techMap?.fieldId) {
      throw new BadRequestException(
        "У операции нет fieldId в active execution context",
      );
    }

    if (!techMap?.seasonId) {
      throw new BadRequestException(
        "У операции нет seasonId в active execution context",
      );
    }

    return this.fieldObservationService.createObservation({
      type: dto.type,
      intent: dto.intent,
      integrityStatus: dto.integrityStatus,
      content: dto.content,
      photoUrl: dto.photoUrl,
      voiceUrl: dto.voiceUrl,
      coordinates: dto.coordinates,
      telemetryJson: dto.telemetryJson,
      companyId: context.companyId,
      authorId: context.userId,
      fieldId: techMap.fieldId,
      seasonId: techMap.seasonId,
    });
  }

  private async attachRecentObservations<T extends Array<any>>(
    operations: T,
    companyId: string,
  ): Promise<T> {
    const uniqueContextKeys = Array.from(
      new Set(
        operations
          .map((operation) => {
            const techMap = operation?.mapStage?.techMap;
            if (!techMap?.fieldId || !techMap?.seasonId) {
              return null;
            }

            return `${techMap.fieldId}:${techMap.seasonId}`;
          })
          .filter(Boolean) as string[],
      ),
    );

    const observationGroups = new Map<string, any[]>();

    await Promise.all(
      uniqueContextKeys.map(async (key) => {
        const [fieldId, seasonId] = key.split(":");
        const observations = await this.findRecentObservationsForTechMapContext(
          fieldId,
          seasonId,
          companyId,
        );
        observationGroups.set(key, observations);
      }),
    );

    return operations.map((operation) => {
      const techMap = operation?.mapStage?.techMap;
      const contextKey =
        techMap?.fieldId && techMap?.seasonId
          ? `${techMap.fieldId}:${techMap.seasonId}`
          : null;

      return {
        ...operation,
        recentObservations: contextKey
          ? observationGroups.get(contextKey) ?? []
          : [],
      };
    }) as T;
  }

  private async attachGovernanceSummary<T extends Array<any>>(
    operations: T,
    companyId: string,
  ): Promise<T> {
    const deviationReviewIds = Array.from(
      new Set(
        operations
          .flatMap((operation) => operation?.mapStage?.controlPoints || [])
          .flatMap((point: any) => point?.outcomeExplanations || [])
          .map((outcome: any) =>
            this.extractStringFromPayload(outcome?.payload, "deviationReviewId"),
          )
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
          select: {
            id: true,
            deviationSummary: true,
            severity: true,
            status: true,
            createdAt: true,
          },
        })
      : [];

    const deviationReviewById = new Map(
      deviationReviews.map((review: any) => [review.id, review]),
    );

    return operations.map((operation) => {
      const techMap = operation?.mapStage?.techMap;
      const referencedDeviationIds = Array.from(
        new Set(
          (operation?.mapStage?.controlPoints || [])
            .flatMap((point: any) => point?.outcomeExplanations || [])
            .map((outcome: any) =>
              this.extractStringFromPayload(outcome?.payload, "deviationReviewId"),
            )
            .filter(Boolean),
        ),
      ) as string[];

      return {
        ...operation,
        governanceSummary: {
          decisionGates: techMap?.decisionGates || [],
          recommendations: techMap?.recommendations || [],
          changeOrders: (techMap?.changeOrders || []).map((changeOrder: any) => ({
            ...changeOrder,
            approvalSummary: this.buildApprovalSummary(changeOrder.approvals || []),
          })),
          deviationReviews: referencedDeviationIds
            .map((id) => deviationReviewById.get(id))
            .filter(Boolean),
        },
      };
    }) as T;
  }

  private attachEvidenceSummary<T extends Array<any>>(operations: T): T {
    return operations.map((operation) => {
      const requiredEvidenceTypes = this.extractEvidenceTypes(
        operation?.evidenceRequired,
      );
      const evidenceWithAudit = (operation?.evidence || []).map((item: any) =>
        this.attachEvidenceSourceAudit(item),
      );
      const presentEvidenceTypes = Array.from(
        new Set(
          evidenceWithAudit
            .map((item: any) => item?.evidenceType)
            .filter(Boolean),
        ),
      );
      const missingEvidenceTypes = requiredEvidenceTypes.filter(
        (item) => !presentEvidenceTypes.includes(item),
      );
      const artifactEvidenceCount = evidenceWithAudit.filter(
        (item: any) => item?.sourceAudit?.urlKind === "artifact",
      ).length;
      const intermediateRouteEvidenceCount = evidenceWithAudit.filter(
        (item: any) => item?.sourceAudit?.urlKind === "intermediate_route",
      ).length;

      return {
        ...operation,
        evidence: evidenceWithAudit,
        evidenceSummary: {
          isComplete: missingEvidenceTypes.length === 0,
          requiredEvidenceTypes,
          presentEvidenceTypes,
          missingEvidenceTypes,
          sourceAudit: {
            artifactEvidenceCount,
            intermediateRouteEvidenceCount,
            unresolvedRouteEvidenceTypes: evidenceWithAudit
              .filter(
                (item: any) =>
                  item?.sourceAudit?.urlKind === "intermediate_route",
              )
              .map((item: any) => item?.evidenceType)
              .filter(Boolean),
          },
        },
      };
    }) as T;
  }

  private buildExecutionEvidenceMetadata(
    dto: Omit<EvidenceCreateDto, "companyId">,
  ) {
    const existingMetadata = this.normalizeMetadataRecord(dto.metadata);
    const classification = this.classifyEvidenceUrl(dto.fileUrl);

    return {
      ...existingMetadata,
      executionSourceAudit: {
        urlKind: classification.urlKind,
        sourceScheme: classification.sourceScheme,
        isIntermediateRoute: classification.urlKind === "intermediate_route",
        isArtifactUrl: classification.urlKind === "artifact",
        attachedViaExecutionFlow: true,
        attachedAt: new Date().toISOString(),
      },
    };
  }

  private attachEvidenceSourceAudit<T extends { fileUrl?: string | null; metadata?: unknown }>(
    evidence: T,
  ): T & {
    sourceAudit: {
      urlKind: "artifact" | "intermediate_route" | "unknown";
      sourceScheme: string | null;
      isIntermediateRoute: boolean;
      isArtifactUrl: boolean;
    };
  } {
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

  private normalizeMetadataRecord(
    value: unknown,
  ): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private findRecentObservationsForTechMapContext(
    fieldId: string | null,
    seasonId: string | null,
    companyId: string,
  ) {
    if (!fieldId || !seasonId) {
      return Promise.resolve([]);
    }

    return this.prisma.fieldObservation.findMany({
      where: {
        companyId,
        fieldId,
        seasonId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        intent: true,
        integrityStatus: true,
        content: true,
        photoUrl: true,
        voiceUrl: true,
        createdAt: true,
        authorId: true,
      },
    });
  }

  private extractStringFromPayload(
    payload: unknown,
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

  private buildApprovalSummary(approvals: Array<{ decision?: string | null }>) {
    const total = approvals.length;
    const approved = approvals.filter(
      (approval) => approval.decision === "APPROVED",
    ).length;
    const rejected = approvals.filter(
      (approval) => approval.decision === "REJECTED",
    ).length;
    const pending = total - approved - rejected;

    return {
      total,
      approved,
      rejected,
      pending,
    };
  }

  private extractEvidenceTypes(value: unknown): EvidenceType[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is EvidenceType =>
      Object.values(EvidenceType).includes(item as EvidenceType),
    );
  }

  private async assertOperationInExecutionScope(
    operationId: string | null,
    context: ExecutionContext,
  ) {
    if (!operationId) {
      throw new BadRequestException("operationId обязателен для execution evidence flow");
    }

    const operation = await this.prisma.mapOperation.findFirst({
      where: {
        id: operationId,
        mapStage: {
          techMap: {
            companyId: context.companyId,
            status: TechMapStatus.ACTIVE,
          },
        },
      },
      select: {
        id: true,
        mapStage: {
          select: {
            techMap: {
              select: {
                id: true,
                fieldId: true,
                seasonId: true,
              },
            },
          },
        },
      },
    });

    if (!operation) {
      throw new NotFoundException("Операция не найдена в active execution scope");
    }

    return operation;
  }
}
