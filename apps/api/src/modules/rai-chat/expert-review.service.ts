import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ChiefAgronomistService } from "./expert/chief-agronomist.service";
import { EvidenceReference } from "./dto/rai-chat.dto";
import { TaskService } from "../task/task.service";

export interface ChiefAgronomistReviewRequest {
  entityType: "techmap" | "deviation" | "field";
  entityId: string;
  reason: string;
  fieldId?: string;
  seasonId?: string;
  planId?: string;
  workspaceRoute?: string;
  traceParentId?: string;
}

export interface ChiefAgronomistReviewResponse {
  reviewId: string;
  traceId: string;
  verdict: string;
  actionsNow: string[];
  alternatives: string[];
  basedOn: string[];
  evidence: EvidenceReference[];
  riskTier: "low" | "medium" | "high";
  requiresHumanDecision: boolean;
  status: "completed" | "needs_more_context" | "degraded";
  missingContext?: string[];
  outcomeAction?: "accept" | "hand_off" | "create_task";
  outcomeNote?: string | null;
  resolvedAt?: string | null;
  createdTaskId?: string;
}

export interface ExpertReviewOutcomeRequest {
  action: "accept" | "hand_off" | "create_task";
  note?: string;
}

@Injectable()
export class ExpertReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chiefAgronomistService: ChiefAgronomistService,
    private readonly taskService: TaskService,
  ) {}

  async runChiefAgronomistReview(
    companyId: string,
    userId: string | null | undefined,
    request: ChiefAgronomistReviewRequest,
  ): Promise<ChiefAgronomistReviewResponse> {
    if (!request.entityId?.trim()) {
      throw new BadRequestException("entityId is required");
    }
    if (!request.reason?.trim()) {
      throw new BadRequestException("reason is required");
    }

    const reviewId = `review_${randomUUID()}`;
    const traceId = request.traceParentId?.trim() || `expert_${randomUUID()}`;
    const missingContext = [
      !request.fieldId?.trim() ? "fieldId" : null,
      !request.seasonId?.trim() ? "seasonId" : null,
    ].filter(Boolean) as string[];

    if (missingContext.length > 0) {
      const response: ChiefAgronomistReviewResponse = {
        reviewId,
        traceId,
        verdict: "Недостаточно контекста для экспертного заключения.",
        actionsNow: [],
        alternatives: [],
        basedOn: ["Не переданы обязательные идентификаторы контекста."],
        evidence: [],
        riskTier: "medium",
        requiresHumanDecision: true,
        status: "needs_more_context",
        missingContext,
        resolvedAt: null,
      };
      await this.persistReview(companyId, userId, request, response);
      await this.writeAudit(companyId, userId, "CHIEF_AGRONOMIST_REVIEW_NEEDS_CONTEXT", {
        reviewId,
        traceId,
        entityType: request.entityType,
        entityId: request.entityId,
        reason: request.reason,
        missingContext,
      });

      return response;
    }

    const opinion = await this.chiefAgronomistService.deepExpertise(
      companyId,
      this.buildExpertQuery(request),
      traceId,
      {
        fieldId: request.fieldId,
        seasonId: request.seasonId,
        techMapId: request.entityType === "techmap" ? request.entityId : undefined,
      },
      userId ?? undefined,
    );

    const confidence = Number(opinion.confidence ?? 0);
    const riskTier =
      confidence >= 0.8 ? "low" :
      confidence >= 0.55 ? "medium" :
      "high";
    const response: ChiefAgronomistReviewResponse = {
      reviewId,
      traceId,
      verdict: opinion.opinion,
      actionsNow: opinion.recommendations.map((item) => item.action).slice(0, 4),
      alternatives: [
        ...opinion.alternatives.map((item) => item.product),
        ...opinion.recommendations.flatMap((item) => item.alternatives ?? []),
      ].slice(0, 6),
      basedOn: [
        `${opinion.engramsUsed} engrams used`,
        `${Math.round(confidence * 100)}% confidence`,
        `duration ${opinion.durationMs} ms`,
      ],
      evidence: opinion.evidence.slice(0, 5).map((item) => ({
        claim: item.content.slice(0, 160),
        sourceType: item.type === "engram" ? "DOC" : "TOOL_RESULT",
        sourceId: item.source,
        confidenceScore: confidence,
      })),
      riskTier,
      requiresHumanDecision: true,
      status: confidence < 0.45 ? "degraded" : "completed",
      resolvedAt: null,
    };

    await this.persistReview(companyId, userId, request, response);
    await this.writeAudit(companyId, userId, "CHIEF_AGRONOMIST_REVIEW_REQUESTED", {
      reviewId,
      traceId,
      entityType: request.entityType,
      entityId: request.entityId,
      reason: request.reason,
      workspaceRoute: request.workspaceRoute ?? null,
      response,
    });

    return response;
  }

  async applyReviewOutcome(
    companyId: string,
    userId: string | null | undefined,
    reviewId: string,
    request: ExpertReviewOutcomeRequest,
  ): Promise<ChiefAgronomistReviewResponse> {
    const review = await this.prisma.expertReview.findFirst({
      where: { id: reviewId, companyId },
    });
    if (!review) {
      throw new NotFoundException("EXPERT_REVIEW_NOT_FOUND");
    }

    const resolvedAt = new Date();
    const updatedPayload: Record<string, unknown> = {
      ...((review.payloadJson as Record<string, unknown>) ?? {}),
      outcomeAction: request.action,
      outcomeNote: request.note ?? null,
      resolvedAt: resolvedAt.toISOString(),
    };
    let createdTaskId: string | null = null;
    if (request.action === "create_task") {
      const currentPayload = ((review.payloadJson as Record<string, unknown>) ?? {}) as Record<string, unknown>;
      const existingTaskId =
        typeof currentPayload.createdTaskId === "string" &&
        currentPayload.createdTaskId.trim().length > 0
          ? currentPayload.createdTaskId.trim()
          : null;
      if (existingTaskId) {
        createdTaskId = existingTaskId;
      } else {
        const payloadReview = this.mapStoredReview(review);
        const storedFieldId =
          typeof currentPayload.fieldId === "string" ? currentPayload.fieldId :
          Array.isArray(payloadReview.missingContext) ? undefined : undefined;
        const storedSeasonId =
          typeof currentPayload.seasonId === "string" ? currentPayload.seasonId :
          undefined;
        if (!storedFieldId || !storedSeasonId) {
          throw new BadRequestException(
            "Cannot create task without fieldId and seasonId in expert review context",
          );
        }
        const task = await this.taskService.createExpertReviewTask({
          companyId,
          userId,
          reviewId: review.id,
          traceId: review.traceId,
          entityType: review.entityType,
          entityId: review.entityId,
          reason: review.reason,
          verdict: review.verdict,
          seasonId: storedSeasonId,
          fieldId: storedFieldId,
        });
        createdTaskId = task.id;
      }
      updatedPayload.createdTaskId = createdTaskId;
    }

    const updated = await this.prisma.expertReview.update({
      where: { id: review.id },
      data: {
        outcomeAction: request.action,
        outcomeNote: request.note?.trim() ? request.note.trim() : null,
        resolvedByUserId: userId ?? null,
        resolvedAt,
        payloadJson: updatedPayload as any,
      },
    });

    const auditAction =
      request.action === "accept"
        ? "CHIEF_AGRONOMIST_REVIEW_ACCEPTED"
        : request.action === "hand_off"
          ? "CHIEF_AGRONOMIST_REVIEW_HANDED_OFF"
          : "CHIEF_AGRONOMIST_REVIEW_TASK_CREATED";

    await this.writeAudit(companyId, userId, auditAction, {
      reviewId,
      traceId: review.traceId,
      entityType: review.entityType,
      entityId: review.entityId,
      outcomeAction: request.action,
      outcomeNote: request.note ?? null,
    });

    return this.mapStoredReview(updated);
  }

  private async persistReview(
    companyId: string,
    userId: string | null | undefined,
    request: ChiefAgronomistReviewRequest,
    response: ChiefAgronomistReviewResponse,
  ): Promise<void> {
    await this.prisma.expertReview.create({
      data: {
        id: response.reviewId,
        companyId,
        traceId: response.traceId,
        entityType: request.entityType,
        entityId: request.entityId,
        reason: request.reason,
        status: response.status.toUpperCase(),
        verdict: response.verdict,
        riskTier: response.riskTier.toUpperCase(),
        requiresHumanDecision: response.requiresHumanDecision,
        payloadJson: JSON.parse(JSON.stringify({
          ...response,
          fieldId: request.fieldId ?? null,
          seasonId: request.seasonId ?? null,
          planId: request.planId ?? null,
          workspaceRoute: request.workspaceRoute ?? null,
        })) as any,
        createdByUserId: userId ?? null,
      },
    });
  }

  private mapStoredReview(review: {
    id: string;
    traceId: string;
    verdict: string;
    riskTier: string;
    requiresHumanDecision: boolean;
    status: string;
    payloadJson: unknown;
    outcomeAction: string | null;
    outcomeNote: string | null;
    resolvedAt: Date | null;
  }): ChiefAgronomistReviewResponse {
    const payload = ((review.payloadJson as Record<string, unknown>) ?? {}) as Partial<ChiefAgronomistReviewResponse> & {
      createdTaskId?: string;
    };
    return {
      reviewId: review.id,
      traceId: review.traceId,
      verdict: review.verdict,
      actionsNow: Array.isArray(payload.actionsNow) ? payload.actionsNow : [],
      alternatives: Array.isArray(payload.alternatives) ? payload.alternatives : [],
      basedOn: Array.isArray(payload.basedOn) ? payload.basedOn : [],
      evidence: Array.isArray(payload.evidence) ? (payload.evidence as EvidenceReference[]) : [],
      riskTier: review.riskTier.toLowerCase() as ChiefAgronomistReviewResponse["riskTier"],
      requiresHumanDecision: review.requiresHumanDecision,
      status: review.status.toLowerCase() as ChiefAgronomistReviewResponse["status"],
      ...(Array.isArray(payload.missingContext) ? { missingContext: payload.missingContext as string[] } : {}),
      ...(review.outcomeAction ? { outcomeAction: review.outcomeAction as ChiefAgronomistReviewResponse["outcomeAction"] } : {}),
      outcomeNote: review.outcomeNote,
      resolvedAt: review.resolvedAt?.toISOString() ?? null,
      ...(typeof payload.createdTaskId === "string" ? { createdTaskId: payload.createdTaskId } : {}),
    };
  }

  private buildExpertQuery(request: ChiefAgronomistReviewRequest): string {
    return [
      `Нужна экспертная агрономическая оценка.`,
      `Тип сущности: ${request.entityType}.`,
      `Сущность: ${request.entityId}.`,
      `Причина: ${request.reason}.`,
      request.planId ? `План: ${request.planId}.` : null,
      request.workspaceRoute ? `Маршрут: ${request.workspaceRoute}.` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  private async writeAudit(
    companyId: string,
    userId: string | null | undefined,
    action: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        companyId,
        userId: userId ?? null,
        metadata: metadata as any,
      },
    });
  }
}
