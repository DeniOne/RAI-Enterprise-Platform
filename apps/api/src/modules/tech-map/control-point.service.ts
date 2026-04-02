import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ExecutionStatus, Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { ChangeOrderService } from "./change-order/change-order.service";
import type { ControlPointOutcomeDto } from "./dto/control-point-outcome.dto";
import { EvidenceService } from "./evidence/evidence.service";

@Injectable()
export class ControlPointService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidenceService: EvidenceService,
    private readonly changeOrderService: ChangeOrderService,
    private readonly deviationService: DeviationService,
  ) {}

  async recordOutcome(
    techMapId: string,
    controlPointId: string,
    dto: ControlPointOutcomeDto,
    companyId: string,
    userId?: string,
  ) {
    const controlPoint = await this.prisma.controlPoint.findFirst({
      where: {
        id: controlPointId,
        techMapId,
        companyId,
      },
      include: {
        mapStage: true,
        techMap: {
          select: {
            id: true,
            version: true,
            seasonId: true,
            harvestPlanId: true,
            status: true,
          },
        },
      },
    });

    if (!controlPoint) {
      throw new NotFoundException("ControlPoint not found");
    }

    const evidenceStatus = await this.validateEvidence({
      techMapId,
      seasonId: controlPoint.techMap.seasonId,
      dto,
      companyId,
    });

    const gateRequired =
      dto.severity === "CRITICAL" ||
      dto.severity === "BLOCKER" ||
      Boolean(dto.decisiveAction) ||
      Boolean(dto.changeOrder);

    const completedExecution = dto.completeOperation
      ? await this.completeOperation(
          techMapId,
          dto.operationId,
          controlPoint.techMap.version,
          dto.summary,
          companyId,
          userId,
        )
      : null;

    const decisionGate = gateRequired
      ? await this.prisma.decisionGate.create({
          data: {
            techMapId,
            gateType: "CONTROL_POINT_FAILURE",
            severity: dto.severity,
            status: "OPEN",
            title:
              dto.decisionGateTitle ??
              `Требуется решение по control point: ${controlPoint.name}`,
            rationale: this.toJsonValue({
              controlPointId: controlPoint.id,
              controlPointName: controlPoint.name,
              stageId: controlPoint.mapStageId,
              stageName: controlPoint.mapStage.name,
              outcome: dto.outcome,
              summary: dto.summary,
              decisiveAction: Boolean(dto.decisiveAction),
            }),
            companyId,
          },
        })
      : null;

    const recommendation =
      dto.outcome !== "PASS" || gateRequired
        ? await this.prisma.recommendation.create({
            data: {
              techMapId,
              decisionGateId: decisionGate?.id ?? null,
              severity: dto.severity,
              code: `CONTROL_POINT:${controlPoint.id}`,
              title:
                dto.recommendationTitle ??
                `Рекомендация по control point: ${controlPoint.name}`,
              message:
                dto.recommendationMessage ??
                this.buildRecommendationMessage(controlPoint.name, dto.summary),
              rationale: this.toJsonValue({
                controlPointId: controlPoint.id,
                controlPointName: controlPoint.name,
                outcome: dto.outcome,
                severity: dto.severity,
              }),
              companyId,
            },
          })
        : null;

    const deviationReview =
      gateRequired && controlPoint.techMap.seasonId
        ? await this.deviationService.createReview({
            companyId,
            userId,
            harvestPlanId: controlPoint.techMap.harvestPlanId,
            seasonId: controlPoint.techMap.seasonId,
            type: "AGRONOMIC",
            reasonCategory: "CONTROL_POINT_FAILURE",
            severity: dto.severity,
            deviationSummary: `Control point "${controlPoint.name}" завершился исходом ${dto.outcome}: ${dto.summary}`,
            aiImpactAssessment:
              dto.aiImpactAssessment ??
              this.buildImpactAssessment(dto.severity, controlPoint.name),
          })
        : null;

    let changeOrder: Awaited<
      ReturnType<ChangeOrderService["createChangeOrder"]>
    > | null = null;
    let approvals: Awaited<
      ReturnType<ChangeOrderService["routeForApproval"]>
    > = [];

    if (dto.changeOrder) {
      changeOrder = await this.changeOrderService.createChangeOrder(
        techMapId,
        {
          versionFrom: controlPoint.techMap.version,
          changeType: dto.changeOrder.changeType,
          reason: dto.changeOrder.reason ?? dto.summary,
          diffPayload: {
            ...dto.changeOrder.diffPayload,
            source: "control_point_outcome",
            controlPointId: controlPoint.id,
            decisionGateId: decisionGate?.id ?? null,
          },
          deltaCostRub: dto.changeOrder.deltaCostRub,
          triggeredByObsId: dto.observationId,
          createdByUserId: userId,
        },
        companyId,
      );

      approvals = await this.changeOrderService.routeForApproval(
        changeOrder.id,
        companyId,
      );
    }

    const payload = this.toJsonValue({
      ...(dto.payload ?? {}),
      observationId: dto.observationId ?? null,
      operationId: dto.operationId ?? null,
      evidenceStatus,
      completedExecutionId: completedExecution?.id ?? null,
      recommendationId: recommendation?.id ?? null,
      decisionGateId: decisionGate?.id ?? null,
      deviationReviewId: deviationReview?.id ?? null,
      changeOrderId: changeOrder?.id ?? null,
      approvalIds: approvals.map((approval) => approval.id),
    });

    const [outcomeExplanation, ruleEvaluationTrace] = await Promise.all([
      this.prisma.controlPointOutcomeExplanation.create({
        data: {
          controlPointId: controlPoint.id,
          techMapId,
          outcome: dto.outcome,
          severity: dto.severity,
          summary: dto.summary,
          payload,
          companyId,
        },
      }),
      this.prisma.ruleEvaluationTrace.create({
        data: {
          techMapId,
          controlPointId: controlPoint.id,
          traceType: "runtime_control_point",
          status: dto.outcome,
          severity: dto.severity,
          payload: this.toJsonValue({
            controlPointId: controlPoint.id,
            controlPointName: controlPoint.name,
            summary: dto.summary,
            evidenceMandatory: evidenceStatus.isMandatory,
            evidenceSatisfied: evidenceStatus.isSatisfied,
          }),
          companyId,
        },
      }),
    ]);

    if (decisionGate && (changeOrder || deviationReview)) {
      await this.prisma.decisionGate.update({
        where: {
          id: decisionGate.id,
        },
        data: {
          resolutionNotes: this.toJsonValue({
            changeOrderId: changeOrder?.id ?? null,
            deviationReviewId: deviationReview?.id ?? null,
            approvalIds: approvals.map((approval) => approval.id),
          }),
        },
      });
    }

    return {
      controlPoint: {
        id: controlPoint.id,
        name: controlPoint.name,
        stageId: controlPoint.mapStageId,
        stageName: controlPoint.mapStage.name,
      },
      outcomeExplanation,
      ruleEvaluationTrace,
      evidenceStatus,
      executionRecord: completedExecution,
      recommendation,
      decisionGate,
      deviationReview,
      changeOrder,
      approvals,
    };
  }

  private async validateEvidence(params: {
    techMapId: string;
    seasonId: string | null;
    dto: ControlPointOutcomeDto;
    companyId: string;
  }) {
    const isMandatory =
      params.dto.severity === "CRITICAL" ||
      params.dto.severity === "BLOCKER" ||
      Boolean(params.dto.decisiveAction) ||
      Boolean(params.dto.changeOrder) ||
      Boolean(params.dto.completeOperation);

    if (!params.dto.operationId && !params.dto.observationId) {
      if (isMandatory) {
        throw new BadRequestException(
          "Для blocker/critical control-point outcome требуется operationId или observationId с evidence.",
        );
      }

      return {
        isMandatory,
        isSatisfied: false,
        mode: "not_required",
      };
    }

    if (params.dto.operationId) {
      const operation = await this.prisma.mapOperation.findFirst({
        where: {
          id: params.dto.operationId,
          mapStage: {
            techMapId: params.techMapId,
            techMap: {
              companyId: params.companyId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!operation) {
        throw new BadRequestException(
          "Operation for control-point outcome not found in tech map scope",
        );
      }

      const completion = await this.evidenceService.validateOperationCompletion(
        params.dto.operationId,
        params.companyId,
      );

      if (isMandatory && !completion.isComplete) {
        throw new BadRequestException(
          `Недостаточно evidence для закрытия outcome: отсутствуют ${completion.missingEvidenceTypes.join(", ")}`,
        );
      }

      return {
        isMandatory,
        isSatisfied: completion.isComplete,
        mode: "operation_completion",
        missingEvidenceTypes: completion.missingEvidenceTypes,
        presentEvidenceTypes: completion.presentEvidenceTypes,
      };
    }

    const observation = await this.prisma.fieldObservation.findFirst({
      where: {
        id: params.dto.observationId,
        companyId: params.companyId,
        ...(params.seasonId ? { seasonId: params.seasonId } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!observation) {
      throw new BadRequestException(
        "Observation for control-point outcome not found in season scope",
      );
    }

    const evidenceCount = await this.prisma.evidence.count({
      where: {
        observationId: params.dto.observationId,
        companyId: params.companyId,
      },
    });

    if (isMandatory && evidenceCount === 0) {
      throw new BadRequestException(
        "Для blocker/critical control-point outcome требуется evidence, прикреплённое к observationId.",
      );
    }

    return {
      isMandatory,
      isSatisfied: evidenceCount > 0,
      mode: "observation_attachment",
      evidenceCount,
    };
  }

  private async completeOperation(
    techMapId: string,
    operationId: string | undefined,
    techMapVersion: number,
    summary: string,
    companyId: string,
    userId?: string,
  ) {
    if (!operationId) {
      throw new BadRequestException(
        "Для completeOperation требуется operationId в пределах tech map.",
      );
    }

    const operation = await this.prisma.mapOperation.findFirst({
      where: {
        id: operationId,
        mapStage: {
          techMapId,
          techMap: {
            companyId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!operation) {
      throw new BadRequestException(
        "Нельзя закрыть операцию вне текущего tech map scope.",
      );
    }

    const evidence = await this.evidenceService.validateOperationCompletion(
      operationId,
      companyId,
    );

    if (!evidence.isComplete) {
      throw new BadRequestException(
        `Операция не может быть закрыта как DONE: отсутствуют ${evidence.missingEvidenceTypes.join(", ")}`,
      );
    }

    return this.prisma.executionRecord.upsert({
      where: {
        operationId,
      },
      create: {
        operationId,
        status: ExecutionStatus.DONE,
        actualDate: new Date(),
        performedById: userId ?? null,
        notes: summary,
        techMapId,
        techMapVersion,
        companyId,
      },
      update: {
        status: ExecutionStatus.DONE,
        actualDate: new Date(),
        performedById: userId ?? undefined,
        notes: summary,
        techMapId,
        techMapVersion,
        version: {
          increment: 1,
        },
      },
    });
  }

  private buildRecommendationMessage(controlPointName: string, summary: string) {
    return `По control point "${controlPointName}" зафиксирован outcome, требующий внимания: ${summary}`;
  }

  private buildImpactAssessment(severity: string, controlPointName: string) {
    return `Runtime control point "${controlPointName}" завершился с severity ${severity}; требуется governed review влияния на исполнение и ожидаемый результат.`;
  }

  private toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
