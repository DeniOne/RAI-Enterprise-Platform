import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import {
  DecisionType,
  RouteDecision,
  RoutingCaseMemoryLifecycleStatus,
  RoutingCaseMemoryRetrievedCase,
  SemanticIntent,
} from "../../../shared/rai-chat/semantic-routing.types";
import { IntentClassification } from "../../../shared/rai-chat/intent-router.types";
import { WorkspaceContextDto } from "../../../shared/rai-chat/rai-chat.dto";
import {
  ROUTING_CASE_MEMORY_ACTIVATION_ACTION,
  ROUTING_CASE_MEMORY_CAPTURE_ACTION,
} from "../../../shared/rai-chat/routing-case-memory.constants";
import { redactRoutingFreeText } from "../../../shared/rai-chat/routing-telemetry-redaction";

interface RetrieveRelevantCasesParams {
  companyId: string;
  message: string;
  workspaceContext?: WorkspaceContextDto;
  baselineClassification?: IntentClassification;
  semanticIntent: SemanticIntent;
  routeDecision: RouteDecision;
  sliceId?: string | null;
  limit?: number;
}

@Injectable()
export class RoutingCaseMemoryService {
  private readonly logger = new Logger(RoutingCaseMemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async retrieveRelevantCases(
    params: RetrieveRelevantCasesParams,
  ): Promise<RoutingCaseMemoryRetrievedCase[]> {
    const [captureLogs, activationLogs] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          companyId: params.companyId,
          action: ROUTING_CASE_MEMORY_CAPTURE_ACTION,
        },
        select: {
          id: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      }),
      this.prisma.auditLog.findMany({
        where: {
          companyId: params.companyId,
          action: ROUTING_CASE_MEMORY_ACTIVATION_ACTION,
        },
        select: {
          id: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      }),
    ]);

    const activationState = new Map<
      string,
      { activationAuditLogId: string; activatedAt: string }
    >();
    for (const entry of activationLogs) {
      const metadata =
        entry.metadata && typeof entry.metadata === "object"
          ? (entry.metadata as Record<string, unknown>)
          : null;
      const candidateKey =
        typeof metadata?.candidateKey === "string"
          ? metadata.candidateKey
          : null;
      if (!candidateKey || activationState.has(candidateKey)) {
        continue;
      }
      activationState.set(candidateKey, {
        activationAuditLogId: entry.id,
        activatedAt:
          typeof metadata?.activatedAt === "string"
            ? metadata.activatedAt
            : entry.createdAt.toISOString(),
      });
    }

    const requestedSliceId =
      params.sliceId ??
      this.inferSliceId(params.workspaceContext?.route, params.message);
    const baselineClassification = params.baselineClassification!;
    const requestedTargetRole =
      baselineClassification.targetRole ?? "unknown";
    const queryTokens = this.tokenize(params.message);

    const candidates: RoutingCaseMemoryRetrievedCase[] = [];

    for (const entry of captureLogs) {
      const metadata =
        entry.metadata && typeof entry.metadata === "object"
          ? (entry.metadata as Record<string, unknown>)
          : null;
      const candidate = this.parseCapturedCandidate(entry.id, metadata);
      if (!candidate) {
        continue;
      }
      if (Date.parse(candidate.ttlExpiresAt) < Date.now()) {
        continue;
      }

      const similarityScore = this.computeSimilarityScore({
        queryTokens,
        sampleQuery: candidate.sampleQuery,
        requestedSliceId,
        candidateSliceId: candidate.sliceId,
        requestedTargetRole,
        candidateTargetRole: candidate.targetRole,
        requestedSemanticIntent: params.semanticIntent,
        requestedRouteDecision: params.routeDecision,
        candidateSemanticIntent: candidate.semanticIntent,
        candidateRouteDecision: candidate.routeDecision,
      });

      if (similarityScore < 0.45) {
        continue;
      }

      const activation = activationState.get(candidate.key);
      candidates.push({
        ...candidate,
        similarityScore,
        lifecycleStatus: activation
          ? RoutingCaseMemoryLifecycleStatus.Active
          : RoutingCaseMemoryLifecycleStatus.Captured,
        activatedAt: activation?.activatedAt ?? null,
        activationAuditLogId: activation?.activationAuditLogId ?? null,
      });
    }

    const selected = candidates
      .sort((left, right) => {
        if (right.similarityScore !== left.similarityScore) {
          return right.similarityScore - left.similarityScore;
        }
        if (right.traceCount !== left.traceCount) {
          return right.traceCount - left.traceCount;
        }
        return Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt);
      })
      .slice(0, params.limit ?? 3);

    for (const candidate of selected) {
      if (
        candidate.lifecycleStatus === RoutingCaseMemoryLifecycleStatus.Active ||
        candidate.similarityScore < 0.7
      ) {
        continue;
      }
      const activatedAt = new Date().toISOString();
      try {
        const activationLog = await this.prisma.auditLog.create({
          data: {
            action: ROUTING_CASE_MEMORY_ACTIVATION_ACTION,
            companyId: params.companyId,
            metadata: {
              domain: "routing_case_memory",
              candidateKey: candidate.key,
              captureAuditLogId: candidate.captureAuditLogId,
              sliceId: candidate.sliceId,
              targetRole: candidate.targetRole,
              decisionType: candidate.decisionType,
              similarityScore: Number(candidate.similarityScore.toFixed(3)),
              routerVersion: candidate.routerVersion,
              promptVersion: candidate.promptVersion,
              toolsetVersion: candidate.toolsetVersion,
              activatedAt,
              ttlExpiresAt: candidate.ttlExpiresAt,
              requestQueryRedacted: redactRoutingFreeText(params.message),
            } as unknown as object,
          },
          select: {
            id: true,
          },
        });
        candidate.lifecycleStatus = RoutingCaseMemoryLifecycleStatus.Active;
        candidate.activatedAt = activatedAt;
        candidate.activationAuditLogId = activationLog.id;
      } catch (error) {
        this.logger.warn(
          `routing_case_memory activation_failed companyId=${params.companyId} key=${candidate.key} err=${String(
            (error as Error)?.message ?? error,
          )}`,
        );
      }
    }

    return selected;
  }

  private inferSliceId(route?: string | null, message?: string): string | null {
    if (!route) {
      return null;
    }
    const normalizedMessage = message?.toLowerCase() ?? "";
    if (route.includes("/consulting/techmaps")) {
      return "agro.techmaps.list-open-create";
    }
    if (route.includes("/consulting/deviations")) {
      return "agro.deviations.review";
    }
    if (route === "/knowledge" || route.startsWith("/knowledge/")) {
      return "knowledge.base.query";
    }
    if (route.includes("/consulting/yield") || route.includes("/finance")) {
      if (/(сценар|scenario|what if|что если)/i.test(normalizedMessage)) {
        return "finance.scenario.analysis";
      }
      if (/(риск|risk)/i.test(normalizedMessage)) {
        return "finance.risk.analysis";
      }
      return "finance.plan-fact.read";
    }
    if (
      route.includes("/parties") ||
      route.includes("/consulting/crm") ||
      route.includes("/crm")
    ) {
      if (
        /(инн|контрагент|юрлиц|компан)/i.test(normalizedMessage) &&
        /\b\d{10}(?:\d{2})?\b/.test(normalizedMessage) &&
        !/(созд(ай|ать)|зарегистр|добавь|обнови|измени|удали|оформи)/i.test(
          normalizedMessage,
        )
      ) {
        return "crm.counterparty.lookup";
      }
      if (
        /(карточк|workspace|профил|контакты|директор|гендир|руководител|как\s+зовут|кто\s+(?:директор|гендир|руководител)|контрагент|клиент)/i.test(
          normalizedMessage,
        ) &&
        !/(обнови|измени|удали|создай|добавь|зарегистр|оформи|логируй|зафиксируй)/i.test(
          normalizedMessage,
        )
      ) {
        return "crm.account.workspace-review";
      }
    }
    if (route.includes("/commerce/contracts")) {
      const isArBalanceSignal =
        /(дебитор|дебиторк|ar\s*balance|остаток.*счет|задолжен)/i.test(
          normalizedMessage,
        ) &&
        !/(созд(ай|ать)|оформи|заключи|добавь|обнови|измени|удали|разнес|подтверд|провед|опубликуй|сформир|оплат)/i.test(
          normalizedMessage,
        );
      if (isArBalanceSignal) {
        return "contracts.ar-balance.review";
      }
      const hasWriteSignal =
        /(созд(ай|ать)|оформи|заключи|добавь|обнови|измени|удали|разнес|подтверд|провед|опубликуй|сформир)/i.test(
          normalizedMessage,
        ) ||
        /счет|инвойс|invoice|оплат|платеж|обязательств|исполнени|отгрузк|shipment/i.test(
          normalizedMessage,
        );
      const isListSignal =
        /(договор|контракт)/i.test(normalizedMessage) &&
        /(реестр|список|перечень|все\s+(?:договор|контракт)|договоры|контракты|какие\s+(?:договоры|контракты))/i.test(
          normalizedMessage,
        );
      const isReviewSignal =
        /(договор|контракт)/i.test(normalizedMessage) &&
        !hasWriteSignal &&
        (/(карточк|открой|подробн|детал|номер|№)/i.test(normalizedMessage) ||
          /\b([A-ZА-Я]{1,4}-?\d{2,4}-?\d{1,6})\b/u.test(message ?? "") ||
          /[«"][^"»]+[»"]/u.test(message ?? ""));
      if (isListSignal || isReviewSignal) {
        return "contracts.registry-review";
      }
    }
    return null;
  }

  private tokenize(input: string | null | undefined): string[] {
    const normalized = String(input ?? "")
      .toLowerCase()
      .replace(/[^a-zа-я0-9]+/gi, " ")
      .trim();
    if (!normalized) {
      return [];
    }
    return normalized.split(/\s+/).filter((token) => token.length >= 2);
  }

  private computeSimilarityScore(input: {
    queryTokens: string[];
    sampleQuery: string | null;
    requestedSliceId: string | null;
    candidateSliceId: string | null;
    requestedTargetRole: string;
    candidateTargetRole: string;
    requestedSemanticIntent: SemanticIntent;
    requestedRouteDecision: RouteDecision;
    candidateSemanticIntent: SemanticIntent;
    candidateRouteDecision: RouteDecision;
  }): number {
    const sampleTokens = this.tokenize(input.sampleQuery);
    const overlapScore = this.tokenOverlap(input.queryTokens, sampleTokens);
    let score = overlapScore * 0.4;

    if (
      input.requestedSliceId &&
      input.candidateSliceId &&
      input.requestedSliceId === input.candidateSliceId
    ) {
      score += 0.2;
    }
    if (input.requestedTargetRole === input.candidateTargetRole) {
      score += 0.15;
    }
    if (
      input.requestedSemanticIntent.entity !== "unknown" &&
      input.requestedSemanticIntent.entity ===
        input.candidateSemanticIntent.entity
    ) {
      score += 0.1;
    }
    if (
      input.requestedSemanticIntent.action !== "unknown" &&
      input.requestedSemanticIntent.action ===
        input.candidateSemanticIntent.action
    ) {
      score += 0.05;
    }
    if (
      input.requestedRouteDecision.decisionType ===
      input.candidateRouteDecision.decisionType
    ) {
      score += 0.05;
    }
    if (
      input.requestedSemanticIntent.mutationRisk ===
      input.candidateSemanticIntent.mutationRisk
    ) {
      score += 0.05;
    }

    return Math.max(0, Math.min(1, Number(score.toFixed(3))));
  }

  private tokenOverlap(left: string[], right: string[]): number {
    if (left.length === 0 || right.length === 0) {
      return 0;
    }
    const leftSet = new Set(left);
    const rightSet = new Set(right);
    let intersection = 0;
    for (const token of leftSet) {
      if (rightSet.has(token)) {
        intersection += 1;
      }
    }
    const union = new Set([...leftSet, ...rightSet]).size;
    if (union === 0) {
      return 0;
    }
    return intersection / union;
  }

  private parseCapturedCandidate(
    auditLogId: string,
    metadata: Record<string, unknown> | null,
  ): Omit<
    RoutingCaseMemoryRetrievedCase,
    | "similarityScore"
    | "lifecycleStatus"
    | "activatedAt"
    | "activationAuditLogId"
  > | null {
    const key =
      typeof metadata?.candidateKey === "string" ? metadata.candidateKey : null;
    const targetRole =
      typeof metadata?.targetRole === "string" ? metadata.targetRole : null;
    const decisionType =
      typeof metadata?.decisionType === "string"
        ? (metadata.decisionType as DecisionType)
        : null;
    const routerVersion =
      typeof metadata?.routerVersion === "string"
        ? metadata.routerVersion
        : null;
    const promptVersion =
      typeof metadata?.promptVersion === "string"
        ? metadata.promptVersion
        : null;
    const toolsetVersion =
      typeof metadata?.toolsetVersion === "string"
        ? metadata.toolsetVersion
        : null;
    const semanticIntent =
      metadata?.semanticIntent && typeof metadata.semanticIntent === "object"
        ? (metadata.semanticIntent as SemanticIntent)
        : null;
    const routeDecision =
      metadata?.routeDecision && typeof metadata.routeDecision === "object"
        ? (metadata.routeDecision as RouteDecision)
        : null;

    if (
      !key ||
      !targetRole ||
      !decisionType ||
      !routerVersion ||
      !promptVersion ||
      !toolsetVersion ||
      !semanticIntent ||
      !routeDecision
    ) {
      return null;
    }

    return {
      key,
      sliceId: typeof metadata?.sliceId === "string" ? metadata.sliceId : null,
      targetRole,
      decisionType,
      mismatchKinds: Array.isArray(metadata?.mismatchKinds)
        ? metadata.mismatchKinds.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      routerVersion,
      promptVersion,
      toolsetVersion,
      traceCount:
        typeof metadata?.traceCount === "number" ? metadata.traceCount : 0,
      semanticPrimaryCount:
        typeof metadata?.semanticPrimaryCount === "number"
          ? metadata.semanticPrimaryCount
          : 0,
      firstSeenAt:
        typeof metadata?.firstSeenAt === "string"
          ? metadata.firstSeenAt
          : new Date(0).toISOString(),
      lastSeenAt:
        typeof metadata?.lastSeenAt === "string"
          ? metadata.lastSeenAt
          : new Date(0).toISOString(),
      ttlExpiresAt:
        typeof metadata?.ttlExpiresAt === "string"
          ? metadata.ttlExpiresAt
          : new Date(0).toISOString(),
      sampleTraceId:
        typeof metadata?.sampleTraceId === "string"
          ? metadata.sampleTraceId
          : null,
      sampleQuery:
        typeof metadata?.sampleQueryRedacted === "string"
          ? metadata.sampleQueryRedacted
          : typeof metadata?.sampleQuery === "string"
            ? metadata.sampleQuery
            : null,
      semanticIntent,
      routeDecision,
      captureAuditLogId: auditLogId,
    };
  }
}
