import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { RaiChatRequestDto, RaiChatResponseDto, EvidenceReference } from "./dto/rai-chat.dto";
import { RaiToolActorContext } from "./tools/rai-tools.types";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { MemoryCoordinatorService } from "./memory/memory-coordinator.service";
import { AgentRuntimeService } from "./runtime/agent-runtime.service";
import { ResponseComposerService } from "./composer/response-composer.service";
import { ExternalSignalsService } from "./external-signals.service";
import { Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TraceSummaryService } from "./trace-summary.service";
import { TruthfulnessEngineService } from "./truthfulness-engine.service";
import { AgentExecutionRequest } from "./agent-platform/agent-platform.types";
import { RaiToolName } from "./tools/rai-tools.types";
import { RecallResult } from "./memory/memory-coordinator.service";
import {
  buildResumeExecutionPlan,
} from "./agent-contracts/agent-interaction-contracts";

@Injectable()
export class SupervisorAgent {
  private readonly logger = new Logger(SupervisorAgent.name);

  constructor(
    private readonly intentRouter: IntentRouterService,
    private readonly memoryCoordinator: MemoryCoordinatorService,
    private readonly agentRuntime: AgentRuntimeService,
    private readonly responseComposer: ResponseComposerService,
    private readonly externalSignalsService: ExternalSignalsService,
    private readonly prisma: PrismaService,
    @Inject(TraceSummaryService)
    private readonly traceSummaryService: TraceSummaryService,
    private readonly truthfulnessEngine: TruthfulnessEngineService,
  ) { }

  async orchestrate(
    request: RaiChatRequestDto,
    companyId: string,
    userId?: string,
    options?: { replayMode?: boolean },
  ): Promise<RaiChatResponseDto> {
    const startedAt = Date.now();
    const traceId = request.clientTraceId ?? `tr_${randomUUID()}`;
    const threadId = request.threadId ?? `th_${randomUUID()}`;
    const actorContext: RaiToolActorContext = {
      companyId,
      traceId,
      replayMode: options?.replayMode,
      userId,
      userConfirmed: Boolean(userId) && !options?.replayMode,
    };

    const recallResult = await this.memoryCoordinator.recallContext(
      request,
      actorContext,
      userId,
    );

    const tRouter = Date.now();
    const plannedExecution = this.planExecution(request);
    const { classification, requestedToolCalls } = plannedExecution;

    const tExecStart = Date.now();
    const executionRequest: AgentExecutionRequest = {
      role: classification.targetRole ?? "knowledge",
      message: request.message,
      workspaceContext: request.workspaceContext,
      memoryContext: {
        profile: recallResult.profile,
        recalledEpisodes: recallResult.recall.items.map((item) => ({
          content: item.content,
          similarity: item.similarity,
          confidence: typeof item.confidence === "number" ? item.confidence : undefined,
          source: typeof item.metadata?.source === "string" ? item.metadata.source : undefined,
        })),
        // L4: Когнитивная память — энграммы с Trigger→Action→Outcome
        recalledEngrams: (recallResult.engrams ?? []).map((engram) => ({
          id: engram.id,
          category: engram.category,
          content: engram.content,
          compositeScore: engram.compositeScore,
          synapticWeight: engram.synapticWeight,
          successRate: engram.successRate,
          activationCount: engram.activationCount,
          keyInsights: engram.keyInsights,
        })),
        // L1: Активные алерты из реактивной памяти
        activeAlerts: (recallResult.activeAlerts ?? []).map((alert) => ({
          id: alert.id,
          severity: alert.severity,
          type: alert.type,
          message: alert.message,
        })),
      },
      requestedTools: requestedToolCalls,
      traceId,
      threadId,
    };
    actorContext.agentRole = executionRequest.role;
    const executionResult = await this.agentRuntime.executeAgent(
      executionRequest,
      actorContext,
    );

    const tExternalSignals = Date.now();
    const externalSignalResult = await this.externalSignalsService.process({
      companyId,
      traceId,
      threadId,
      userId,
      signals: request.externalSignals,
      feedback: request.advisoryFeedback,
    });

    const tComposerStart = Date.now();
    const response = await this.responseComposer.buildResponse({
      request,
      executionResult,
      recallResult,
      externalSignalResult,
      traceId,
      threadId,
      companyId,
    });

    const tComposerEnd = Date.now();
    const durationMs = tComposerEnd - startedAt;

    if (!options?.replayMode) {
      const tSummaryStart = Date.now();
      // Шаг 1: initial record — live execution metadata (await to prevent race with updateQuality)
      await this.traceSummaryService.record({
        traceId,
        companyId,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        durationMs,
        modelId: "deterministic",
        promptVersion: "v1",
        toolsVersion: "v1", // Restore: tool list is NOT a version
        policyId: "default", // Restore: intent method is NOT a policyId
      });

      const tSummaryEnd = Date.now();

      // Шаг 2: writeAiAuditEntry — await, чтобы гарантировать персистентность записи
      const auditEntryId = await this.writeAiAuditEntry({
        companyId,
        traceId,
        toolNames: executionResult.executedTools.map((t) => t.name),
        intentMethod: classification.method,
        evidence: response.evidence,
        runtimeBudget: response.runtimeBudget,
        replayInput: {
          message: request.message,
          workspaceContext: request.workspaceContext,
        },
        agentRole: executionResult.agentExecution?.role,
        fallbackUsed: executionResult.agentExecution?.fallbackUsed,
        validation: executionResult.agentExecution?.validation,
        runtimeGovernance: response.runtimeGovernance,
        memoryLane: this.buildMemoryLane(recallResult, response),
        phases: [
          { name: "router", timestamp: new Date(tRouter).toISOString(), durationMs: tExecStart - tRouter },
          { name: "tools", timestamp: new Date(tExecStart).toISOString(), durationMs: tExternalSignals - tExecStart },
          { name: "composer", timestamp: new Date(tComposerStart).toISOString(), durationMs: tComposerEnd - tComposerStart },
          { name: "trace_summary_record", timestamp: new Date(tSummaryStart).toISOString(), durationMs: tSummaryEnd - tSummaryStart },
          { name: "audit_write", timestamp: new Date(tSummaryEnd).toISOString(), durationMs: 0 },
        ],
      });

      // Шаг 3: Truthfulness pipeline — считает BS%, покрытие и невалидность
      const tTruthStart = Date.now();
      void this.truthfulnessEngine
        .calculateTraceTruthfulness(traceId, companyId)
        .then(async (result) => {
          const tTruthEnd = Date.now();
          const tQualityStart = Date.now();
          await this.traceSummaryService.updateQuality({
            traceId,
            companyId,
            bsScorePct: result.bsScorePct,
            evidenceCoveragePct: result.evidenceCoveragePct,
            invalidClaimsPct: result.invalidClaimsPct,
          });
          const tQualityEnd = Date.now();

          // Опционально: дописываем фазы в аудит-запись для Forensics
          if (auditEntryId) {
            await this.appendForensicPhases(auditEntryId, [
              { name: "truthfulness", timestamp: new Date(tTruthStart).toISOString(), durationMs: tTruthEnd - tTruthStart },
              { name: "quality_update", timestamp: new Date(tQualityStart).toISOString(), durationMs: tQualityEnd - tQualityStart },
            ]);
          }
        })
        .catch((err) =>
          this.logger.warn(
            `truthfulness_engine failed traceId=${traceId} err=${String((err as Error)?.message ?? err)}`,
          ),
        );

      this.memoryCoordinator.commitInteraction(
        request,
        response.text,
        actorContext,
        threadId,
        userId,
      );
    }

    return response;
  }

  private planExecution(request: RaiChatRequestDto): {
    classification: {
      targetRole: string | null;
      intent: string | null;
      toolName: RaiToolName | null;
      confidence: number;
      method: string;
      reason: string;
    };
    requestedToolCalls: RaiChatRequestDto["toolCalls"];
  } {
    const resumePlan = buildResumeExecutionPlan(request);
    if (resumePlan) {
      return {
        classification: {
          targetRole: resumePlan.classification.targetRole ?? null,
          intent: resumePlan.classification.intent ?? null,
          toolName: resumePlan.classification.toolName ?? null,
          confidence: resumePlan.classification.confidence,
          method: "clarification_resume",
          reason: resumePlan.classification.reason,
        },
        requestedToolCalls: resumePlan.requestedToolCalls,
      };
    }

    const classification = this.intentRouter.classify(
      request.message,
      request.workspaceContext,
    );
    const autoToolCall = this.intentRouter.buildAutoToolCall(
      request.message,
      request,
      classification,
    );
    const requestedToolCalls = [...(request.toolCalls ?? [])];
    if (
      autoToolCall &&
      !requestedToolCalls.some((t) => t.name === autoToolCall.name)
    ) {
      requestedToolCalls.unshift({
        name: autoToolCall.name,
        payload: autoToolCall.payload as Record<string, unknown>,
      });
    }

    return {
      classification: {
        targetRole: classification.targetRole ?? null,
        intent: classification.intent ?? null,
        toolName: classification.toolName ?? null,
        confidence: classification.confidence,
        method: classification.method,
        reason: classification.reason,
      },
      requestedToolCalls,
    };
  }

  /**
   * Записывает AiAuditEntry в БД и ждёт завершения операции (async/await).
   * Это гарантирует, что TruthfulnessEngine, читающий audit trail после этого вызова,
   * увидит реальные данные — гонка исключена архитектурно, а не «надеждой на event loop».
   * Ошибка записи логируется, но не пробрасывается — response клиента не ломается.
   */
  private async writeAiAuditEntry(params: {
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
          tokensUsed: 0,
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

  /**
   * Дописывает фазы в существующую запись AiAuditEntry.
   */
  private async appendForensicPhases(
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

  private buildMemoryLane(
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
