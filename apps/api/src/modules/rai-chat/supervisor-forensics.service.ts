import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { EvidenceReference, RaiChatResponseDto } from "./dto/rai-chat.dto";
import { RecallResult } from "./memory/memory-coordinator.service";
import { InvariantMetrics } from "../../shared/invariants/invariant-metrics";
import { RoutingTelemetryEvent } from "../../shared/rai-chat/semantic-routing.types";
import { sanitizeRoutingTelemetry } from "../../shared/rai-chat/routing-telemetry-redaction";
import {
  BranchResultContract,
  BranchTrustAssessment,
  UserFacingBranchCompositionPayload,
} from "../../shared/rai-chat/branch-trust.types";
import { SemanticIngressFrame } from "../../shared/rai-chat/semantic-ingress.types";

@Injectable()
export class SupervisorForensicsService {
  private readonly logger = new Logger(SupervisorForensicsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async writeAiAuditEntry(params: {
    companyId: string;
    traceId: string;
    toolNames: string[];
    intentMethod: string;
    replayInput?: { message: string; workspaceContext?: unknown };
    evidence?: EvidenceReference[];
    runtimeBudget?: RaiChatResponseDto["runtimeBudget"];
    agentRole?: string;
    fallbackUsed?: boolean;
    validation?: RaiChatResponseDto["validation"];
    runtimeGovernance?: RaiChatResponseDto["runtimeGovernance"];
    memoryLane?: {
      recalled: Array<{ kind: string; label: string; confidence: number }>;
      used: Array<{ kind: string; label: string; confidence: number }>;
      dropped: Array<{ kind: string; label: string; reason: string }>;
      escalationReason?: string;
    };
    phases?: Array<{ name: string; timestamp: string; durationMs: number }>;
    tokensUsed?: number;
    structuredOutputs?: Record<string, unknown>[];
    branchResults?: BranchResultContract[];
    branchTrustAssessments?: BranchTrustAssessment[];
    branchCompositions?: UserFacingBranchCompositionPayload[];
    delegationChain?: Array<Record<string, unknown>>;
    routingTelemetry?: RoutingTelemetryEvent;
    semanticIngressFrame?: SemanticIngressFrame;
    /** Телеметрия планировщика веток для operator-plane */
    plannerBranchTelemetry?: Record<string, unknown> | null;
    /** Узкий контракт control-tower v1 (promotion + сигналы планировщика) */
    controlTowerPlannerEnvelope?: Record<string, unknown> | null;
    /** Только `SubIntentGraph` (без полного ingress frame) для forensics / operator-plane */
    controlTowerSubIntentGraphSnapshot?: Record<string, unknown> | null;
  }): Promise<string | null> {
    const metadataObj: Record<string, unknown> = {};
    if (params.replayInput) {
      metadataObj.replayInput = {
        message: params.replayInput.message,
        workspaceContext: params.replayInput.workspaceContext ?? null,
      };
    }
    if (params.evidence && params.evidence.length > 0) {
      metadataObj.evidence = params.evidence;
    }
    if (params.runtimeBudget) {
      metadataObj.runtimeBudget = params.runtimeBudget;
    }
    if (params.agentRole) {
      metadataObj.agentRole = params.agentRole;
    }
    if (typeof params.fallbackUsed === "boolean") {
      metadataObj.fallbackUsed = params.fallbackUsed;
    }
    if (params.validation) {
      metadataObj.validation = params.validation;
    }
    if (params.runtimeGovernance) {
      metadataObj.runtimeGovernance = params.runtimeGovernance;
    }
    if (params.memoryLane) {
      metadataObj.memoryLane = params.memoryLane;
    }
    if (params.phases && params.phases.length > 0) {
      metadataObj.phases = params.phases;
    }
    if (params.structuredOutputs && params.structuredOutputs.length > 0) {
      metadataObj.structuredOutputs = params.structuredOutputs;
    }
    if (params.branchResults && params.branchResults.length > 0) {
      metadataObj.branchResults = params.branchResults;
    }
    if (
      params.branchTrustAssessments &&
      params.branchTrustAssessments.length > 0
    ) {
      metadataObj.branchTrustAssessments = params.branchTrustAssessments;
    }
    if (params.branchCompositions && params.branchCompositions.length > 0) {
      metadataObj.branchCompositions = params.branchCompositions;
    }
    if (params.delegationChain && params.delegationChain.length > 0) {
      metadataObj.delegationChain = params.delegationChain;
    }
    if (params.routingTelemetry) {
      metadataObj.routingTelemetry = sanitizeRoutingTelemetry(
        params.routingTelemetry,
      );
    }
    if (params.semanticIngressFrame) {
      metadataObj.semanticIngressFrame = params.semanticIngressFrame;
    }
    if (params.plannerBranchTelemetry) {
      metadataObj.plannerBranchTelemetry = params.plannerBranchTelemetry;
    }
    if (params.controlTowerPlannerEnvelope) {
      metadataObj.controlTowerPlannerEnvelope =
        params.controlTowerPlannerEnvelope;
    }
    if (params.controlTowerSubIntentGraphSnapshot) {
      metadataObj.controlTowerSubIntentGraphSnapshot =
        params.controlTowerSubIntentGraphSnapshot;
    }

    const metadata: Prisma.InputJsonValue | undefined =
      Object.keys(metadataObj).length > 0
        ? (JSON.parse(JSON.stringify(metadataObj)) as Prisma.InputJsonValue)
        : undefined;
    const entry = await this.prisma.aiAuditEntry
      .create({
        data: {
          traceId: params.traceId,
          companyId: params.companyId,
          toolNames: params.toolNames,
          model: "deterministic",
          intentMethod: params.intentMethod,
          tokensUsed:
            typeof params.tokensUsed === "number" &&
            Number.isFinite(params.tokensUsed)
              ? Math.max(0, Math.round(params.tokensUsed))
              : 0,
          metadata,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `ai_audit_entry create failed traceId=${params.traceId} err=${String((err as Error)?.message ?? err)}`,
        );
        return null;
      });
    return entry?.id ?? null;
  }

  async appendForensicPhases(
    id: string,
    newPhases: Array<{ name: string; timestamp: string; durationMs: number }>,
  ): Promise<void> {
    const entry = await this.prisma.aiAuditEntry.findUnique({ where: { id } });
    if (!entry) return;

    const metadata = (entry.metadata as Record<string, unknown>) ?? {};
    const phases = Array.isArray(metadata.phases) ? [...metadata.phases] : [];
    phases.push(...newPhases);
    metadata.phases = phases;

    await this.prisma.aiAuditEntry.update({
      where: { id },
      data: {
        metadata: JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue,
      },
    });
  }

  buildMemoryLane(
    recallResult: RecallResult,
    response: RaiChatResponseDto,
  ): {
    recalled: Array<{ kind: string; label: string; confidence: number }>;
    used: Array<{ kind: string; label: string; confidence: number }>;
    dropped: Array<{ kind: string; label: string; reason: string }>;
    escalationReason?: string;
  } {
    const recalled = [
      ...(recallResult.activeAlerts ?? []).map((alert) => ({
        kind: "active_alert",
        label: alert.message.slice(0, 80),
        confidence: this.normalizeMemoryConfidence(alert.severity),
      })),
      ...(recallResult.hotEngrams ?? []).map((engram) => ({
        kind: "hot_engram",
        label: engram.contentPreview.slice(0, 80),
        confidence: Number(engram.compositeScore ?? 0),
      })),
      ...(recallResult.engrams ?? []).map((engram) => ({
        kind: "engram",
        label: engram.content.slice(0, 80),
        confidence: Number(engram.compositeScore ?? 0),
      })),
      ...recallResult.recall.items.map((episode) => ({
        kind: "episode",
        label: episode.content.slice(0, 80),
        confidence: Number(episode.similarity ?? episode.confidence ?? 0),
      })),
    ];
    if (Object.keys(recallResult.profile ?? {}).length > 0) {
      recalled.push({
        kind: "profile",
        label: "Предпочтения и недавний контекст клиента",
        confidence: 0.65,
      });
    }

    const used = (response.memoryUsed ?? []).map((item) => ({
      kind: item.kind,
      label: item.label,
      confidence: Number(item.confidence ?? 0),
    }));

    const usedKeys = new Set(used.map((item) => `${item.kind}:${item.label}`));
    const dropped = recalled
      .filter((item) => !usedKeys.has(`${item.kind}:${item.label}`))
      .map((item) => ({
        kind: item.kind,
        label: item.label,
        reason: "available_but_not_promoted_to_response",
      }));

    if (recalled.length > 0 || used.length > 0) {
      InvariantMetrics.increment("memory_lane_populated_total");
    }

    return {
      recalled,
      used,
      dropped,
      escalationReason:
        response.runtimeGovernance?.degraded
          ? response.runtimeGovernance.fallbackReason
          : undefined,
    };
  }

  private normalizeMemoryConfidence(value: string): number {
    const severity = value.toUpperCase();
    if (severity === "CRITICAL") return 0.98;
    if (severity === "HIGH") return 0.9;
    if (severity === "MEDIUM") return 0.75;
    return 0.55;
  }
}
