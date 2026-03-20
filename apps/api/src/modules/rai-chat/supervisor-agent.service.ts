import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { RaiChatRequestDto, RaiChatResponseDto } from "./dto/rai-chat.dto";
import { RaiToolActorContext } from "./tools/rai-tools.types";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { MemoryCoordinatorService } from "./memory/memory-coordinator.service";
import { AgentRuntimeService } from "./runtime/agent-runtime.service";
import { ResponseComposerService } from "./composer/response-composer.service";
import { ExternalSignalsService } from "./external-signals.service";
import { TraceSummaryService } from "./trace-summary.service";
import { TruthfulnessEngineService } from "./truthfulness-engine.service";
import { AgentExecutionRequest } from "./agent-platform/agent-platform.types";
import { RaiToolName } from "./tools/rai-tools.types";
import {
  buildResumeExecutionPlan,
  getIntentContractByToolName,
} from "../../shared/rai-chat/agent-interaction-contracts";
import { SupervisorForensicsService } from "./supervisor-forensics.service";
import { SemanticRouterService } from "./semantic-router/semantic-router.service";
import {
  RoutingOutcomeType,
  RoutingTelemetryEvent,
  SemanticRoutingContext,
} from "../../shared/rai-chat/semantic-routing.types";
import { IntentClassification } from "../../shared/rai-chat/intent-router.types";

@Injectable()
export class SupervisorAgent {
  private readonly logger = new Logger(SupervisorAgent.name);
  private static readonly TRUST_SCORE_LOW_THRESHOLD = 0.55;

  constructor(
    private readonly intentRouter: IntentRouterService,
    private readonly memoryCoordinator: MemoryCoordinatorService,
    private readonly agentRuntime: AgentRuntimeService,
    private readonly responseComposer: ResponseComposerService,
    private readonly externalSignalsService: ExternalSignalsService,
    private readonly supervisorForensics: SupervisorForensicsService,
    private readonly semanticRouter: SemanticRouterService,
    @Inject(TraceSummaryService)
    private readonly traceSummaryService: TraceSummaryService,
    private readonly truthfulnessEngine: TruthfulnessEngineService,
  ) {}

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
    const plannedExecution = await this.planExecution(
      request,
      companyId,
      traceId,
      threadId,
    );
    const {
      classification,
      requestedToolCalls,
      semanticRouting,
      routingTelemetry,
    } = plannedExecution;

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
          confidence:
            typeof item.confidence === "number" ? item.confidence : undefined,
          source:
            typeof item.metadata?.source === "string"
              ? item.metadata.source
              : undefined,
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
      semanticRouting,
      traceId,
      threadId,
    };
    actorContext.agentRole = executionRequest.role;
    let executionResult = await this.agentRuntime.executeAgent(
      executionRequest,
      actorContext,
    );
    executionResult = await this.applyTrustScorePipeline({
      request,
      actorContext,
      executionRequest,
      executionResult,
    });

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
      const usage = executionResult.agentExecution?.usage;
      const promptTokens = usage?.promptTokens ?? 0;
      const completionTokens = usage?.completionTokens ?? 0;
      const totalTokens =
        usage?.totalTokens ?? promptTokens + completionTokens;
      const tSummaryStart = Date.now();
      // Шаг 1: initial record — live execution metadata (await to prevent race with updateQuality)
      await this.traceSummaryService.record({
        traceId,
        companyId,
        totalTokens,
        promptTokens,
        completionTokens,
        durationMs,
        modelId: executionResult.agentExecution?.auditPayload?.model ?? "deterministic",
        promptVersion: "v1",
        toolsVersion: "v1", // Restore: tool list is NOT a version
        policyId: "default", // Restore: intent method is NOT a policyId
      });

      const tSummaryEnd = Date.now();

      // Шаг 2: writeAiAuditEntry — await, чтобы гарантировать персистентность записи
      const auditEntryId = await this.supervisorForensics.writeAiAuditEntry({
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
        tokensUsed: totalTokens,
        structuredOutputs: executionResult.agentExecution?.structuredOutputs,
        delegationChain: executionResult.agentExecution?.delegationChain?.map(
          (step) => ({ ...step }) as Record<string, unknown>,
        ),
        routingTelemetry: routingTelemetry
          ? this.finalizeRoutingTelemetry(
              routingTelemetry,
              request,
              executionResult,
              response.runtimeGovernance?.fallbackReason ?? null,
            )
          : undefined,
        memoryLane: this.supervisorForensics.buildMemoryLane(
          recallResult,
          response,
        ),
        phases: [
          {
            name: "router",
            timestamp: new Date(tRouter).toISOString(),
            durationMs: tExecStart - tRouter,
          },
          {
            name: "tools",
            timestamp: new Date(tExecStart).toISOString(),
            durationMs: tExternalSignals - tExecStart,
          },
          {
            name: "composer",
            timestamp: new Date(tComposerStart).toISOString(),
            durationMs: tComposerEnd - tComposerStart,
          },
          {
            name: "trace_summary_record",
            timestamp: new Date(tSummaryStart).toISOString(),
            durationMs: tSummaryEnd - tSummaryStart,
          },
          {
            name: "audit_write",
            timestamp: new Date(tSummaryEnd).toISOString(),
            durationMs: 0,
          },
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
            await this.supervisorForensics.appendForensicPhases(auditEntryId, [
              {
                name: "truthfulness",
                timestamp: new Date(tTruthStart).toISOString(),
                durationMs: tTruthEnd - tTruthStart,
              },
              {
                name: "quality_update",
                timestamp: new Date(tQualityStart).toISOString(),
                durationMs: tQualityEnd - tQualityStart,
              },
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

  private async applyTrustScorePipeline(params: {
    request: RaiChatRequestDto;
    actorContext: RaiToolActorContext;
    executionRequest: AgentExecutionRequest;
    executionResult: Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
  }): Promise<Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>> {
    const { request, actorContext, executionRequest, executionResult } = params;
    const primary = executionResult.agentExecution;
    if (!primary || primary.role === "knowledge" || primary.status !== "COMPLETED") {
      return executionResult;
    }

    const trust = this.buildTrustAssessment(primary);
    const currentOutput = {
      ...(primary.structuredOutput ?? {}),
      trustScore: trust.score,
      trustAssessment: trust.assessment,
      trustCrossCheckTriggered: false,
    };
    executionResult.agentExecution = {
      ...primary,
      structuredOutput: currentOutput,
      structuredOutputs:
        primary.structuredOutputs && primary.structuredOutputs.length > 0
          ? primary.structuredOutputs
          : [currentOutput],
    };

    if (!trust.requiresCrossCheck) {
      return executionResult;
    }

    const crossCheckRequest: AgentExecutionRequest = {
      role: "knowledge",
      message: `Cross-check: ${request.message}`,
      workspaceContext: request.workspaceContext,
      memoryContext: executionRequest.memoryContext,
      requestedTools: [
        {
          name: RaiToolName.QueryKnowledge,
          payload: {
            query: request.message,
          },
        },
      ],
      traceId: executionRequest.traceId,
      threadId: executionRequest.threadId,
    };
    const crossCheckContext: RaiToolActorContext = {
      ...actorContext,
      agentRole: "knowledge",
      parentSpanId: actorContext.parentSpanId ?? executionRequest.traceId,
    };

    const crossCheckResult = await this.agentRuntime.executeAgent(
      crossCheckRequest,
      crossCheckContext,
    );
    const crossCheckExecution = crossCheckResult.agentExecution;
    if (!crossCheckExecution) {
      executionResult.agentExecution = {
        ...executionResult.agentExecution,
        structuredOutput: {
          ...executionResult.agentExecution.structuredOutput,
          trustCrossCheckTriggered: true,
          trustCrossCheckStatus: "failed_to_execute",
        },
      };
      return executionResult;
    }

    const mergedStructuredOutputs = [
      ...(executionResult.agentExecution.structuredOutputs ?? []),
      crossCheckExecution.structuredOutput,
    ];
    const mergedDelegationChain = [
      ...(executionResult.agentExecution.delegationChain ?? []),
      ...(crossCheckExecution.delegationChain ?? []),
    ];
    const mergedEvidence = [
      ...(executionResult.agentExecution.evidence ?? []),
      ...(crossCheckExecution.evidence ?? []),
    ];
    const mergedToolCalls = [
      ...(executionResult.agentExecution.toolCalls ?? []),
      ...(crossCheckExecution.toolCalls ?? []),
    ];
    executionResult.executedTools = [
      ...executionResult.executedTools,
      ...crossCheckResult.executedTools,
    ];
    executionResult.agentExecution = {
      ...executionResult.agentExecution,
      evidence: mergedEvidence,
      toolCalls: mergedToolCalls,
      usage: this.mergeUsage(
        executionResult.agentExecution.usage,
        crossCheckExecution.usage,
      ),
      delegationChain:
        mergedDelegationChain.length > 0 ? mergedDelegationChain : undefined,
      structuredOutputs: mergedStructuredOutputs,
      structuredOutput: {
        ...executionResult.agentExecution.structuredOutput,
        trustCrossCheckTriggered: true,
        trustCrossCheckStatus:
          crossCheckExecution.status === "COMPLETED" ? "completed" : "degraded",
      },
    };

    return executionResult;
  }

  private buildTrustAssessment(execution: {
    structuredOutput?: Record<string, unknown>;
    evidence?: unknown[];
  }): { score: number; assessment: string; requiresCrossCheck: boolean } {
    const structuredOutput = execution.structuredOutput ?? {};
    const confidence = this.extractConfidence(structuredOutput);
    const evidenceCount = Array.isArray(execution.evidence)
      ? execution.evidence.length
      : 0;
    const evidenceScore = Math.min(evidenceCount / 3, 1);
    const score = Number((confidence * 0.7 + evidenceScore * 0.3).toFixed(2));
    const explicitCrossCheck = structuredOutput.crossCheckRequired === true;
    const lowTrustHeuristic =
      score <= SupervisorAgent.TRUST_SCORE_LOW_THRESHOLD &&
      confidence <= SupervisorAgent.TRUST_SCORE_LOW_THRESHOLD &&
      evidenceCount === 0;
    return {
      score,
      assessment:
        score <= SupervisorAgent.TRUST_SCORE_LOW_THRESHOLD ? "low" : "ok",
      requiresCrossCheck: explicitCrossCheck || lowTrustHeuristic,
    };
  }

  private extractConfidence(structuredOutput: Record<string, unknown>): number {
    const raw = structuredOutput.confidence;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.max(0, Math.min(1, raw));
    }
    return 0.5;
  }

  private mergeUsage(
    left?:
      | {
          promptTokens?: number;
          completionTokens?: number;
          totalTokens?: number;
        }
      | undefined,
    right?:
      | {
          promptTokens?: number;
          completionTokens?: number;
          totalTokens?: number;
        }
      | undefined,
  ):
    | {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      }
    | undefined {
    if (!left && !right) {
      return undefined;
    }
    const promptTokens = (left?.promptTokens ?? 0) + (right?.promptTokens ?? 0);
    const completionTokens =
      (left?.completionTokens ?? 0) + (right?.completionTokens ?? 0);
    const totalTokens =
      (left?.totalTokens ?? 0) + (right?.totalTokens ?? 0) ||
      promptTokens + completionTokens;
    return {
      promptTokens,
      completionTokens,
      totalTokens,
    };
  }

  private async planExecution(
    request: RaiChatRequestDto,
    companyId: string,
    traceId: string,
    threadId: string,
  ): Promise<{
    classification: {
      targetRole: string | null;
      intent: string | null;
      toolName: RaiToolName | null;
      confidence: number;
      method: string;
      reason: string;
    };
    requestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticRouting?: SemanticRoutingContext;
    routingTelemetry?: RoutingTelemetryEvent;
  }> {
    const resumePlan = buildResumeExecutionPlan(request);
    const explicitToolCalls = [...(request.toolCalls ?? [])];
    const explicitPrimaryTool = explicitToolCalls[0];
    const explicitContract = explicitPrimaryTool
      ? getIntentContractByToolName(explicitPrimaryTool.name)
      : null;
    const legacyPlan: {
      classification: IntentClassification;
      requestedToolCalls: RaiChatRequestDto["toolCalls"];
      semanticPrimaryAllowed: boolean;
    } = (() => {
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
          semanticPrimaryAllowed: false,
        };
      }

      if (explicitPrimaryTool && explicitContract) {
        return {
          classification: {
            targetRole: explicitContract.role,
            intent: explicitContract.id,
            toolName: explicitPrimaryTool.name,
            confidence: 1,
            method: "tool_call_primary",
            reason: `explicit_tool_call:${explicitPrimaryTool.name}`,
          },
          requestedToolCalls: explicitToolCalls,
          semanticPrimaryAllowed: false,
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
      const requestedToolCalls = [...explicitToolCalls];
      if (
        autoToolCall &&
        !requestedToolCalls.some((t) => t.name === autoToolCall.name)
      ) {
        requestedToolCalls.unshift({
          name: autoToolCall.name,
          payload: autoToolCall.payload as Record<string, unknown>,
        });
      }

      const inferredContract = classification.toolName
        ? getIntentContractByToolName(classification.toolName)
        : null;
      return {
        classification: {
          targetRole:
            classification.targetRole ?? inferredContract?.role ?? null,
          intent: classification.intent ?? inferredContract?.id ?? null,
          toolName: classification.toolName ?? null,
          confidence: classification.confidence,
          method: classification.method,
          reason: classification.reason,
        },
        requestedToolCalls,
        semanticPrimaryAllowed: true,
      };
    })();

    const semanticEvaluation = await this.semanticRouter.evaluate({
      companyId,
      message: request.message,
      workspaceContext: request.workspaceContext,
      traceId,
      threadId,
      legacyClassification: legacyPlan.classification,
      requestedToolCalls: legacyPlan.requestedToolCalls,
      allowPrimaryPromotion: legacyPlan.semanticPrimaryAllowed,
    });

    const classification = semanticEvaluation.promotedPrimary
      ? semanticEvaluation.classification
      : legacyPlan.classification;
    const requestedToolCalls = semanticEvaluation.promotedPrimary
      ? semanticEvaluation.requestedToolCalls
      : legacyPlan.requestedToolCalls;

    return {
      classification,
      requestedToolCalls,
      semanticRouting: semanticEvaluation.promotedPrimary
        ? semanticEvaluation.routingContext
        : undefined,
      routingTelemetry: {
        traceId,
        threadId,
        routerVersion: semanticEvaluation.versionInfo.routerVersion,
        promptVersion: semanticEvaluation.versionInfo.promptVersion,
        toolsetVersion: semanticEvaluation.versionInfo.toolsetVersion,
        workspaceRoute: request.workspaceContext?.route ?? null,
        workspaceStateDigest:
          semanticEvaluation.versionInfo.workspaceStateDigest,
        activeFlow:
          semanticEvaluation.semanticIntent.dialogState.activeFlow ?? null,
        userQueryRedacted: request.message,
        legacyClassification: legacyPlan.classification,
        semanticIntent: semanticEvaluation.semanticIntent,
        routeDecision: semanticEvaluation.routeDecision,
        candidateRoutes: semanticEvaluation.candidateRoutes,
        divergence: semanticEvaluation.divergence,
        executionPath: semanticEvaluation.executionPath,
        fallbackReason: null,
        abstainReason:
          semanticEvaluation.routeDecision.abstainReason ?? null,
        policyBlockReason:
          semanticEvaluation.routeDecision.policyBlockReason ?? null,
        requiredContextMissing:
          semanticEvaluation.routeDecision.requiredContextMissing,
        finalOutcome: RoutingOutcomeType.Unknown,
        userCorrection: request.advisoryFeedback
          ? {
              decision: request.advisoryFeedback.decision,
              reason: request.advisoryFeedback.reason ?? null,
            }
          : null,
        latencyMs: semanticEvaluation.latencyMs,
        sliceId: semanticEvaluation.sliceId ?? null,
        promotedPrimary: semanticEvaluation.promotedPrimary,
        retrievedCaseMemory: semanticEvaluation.retrievedCaseMemory,
      },
    };
  }

  private finalizeRoutingTelemetry(
    routingTelemetry: RoutingTelemetryEvent,
    request: RaiChatRequestDto,
    executionResult: Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>,
    fallbackReason: string | null,
  ): RoutingTelemetryEvent {
    const status = executionResult.agentExecution?.status;
    return {
      ...routingTelemetry,
      executionPath:
        executionResult.agentExecution?.executionPath ??
        routingTelemetry.executionPath,
      fallbackReason,
      finalOutcome: this.mapRoutingOutcome(status),
      userQueryRedacted: request.message,
    };
  }

  private mapRoutingOutcome(
    status: Awaited<
      ReturnType<AgentRuntimeService["executeAgent"]>
    >["agentExecution"] extends { status: infer T }
      ? T
      : never,
  ): RoutingOutcomeType {
    if (status === "COMPLETED") {
      return RoutingOutcomeType.Completed;
    }
    if (status === "NEEDS_MORE_DATA") {
      return RoutingOutcomeType.NeedsMoreData;
    }
    if (status === "FAILED") {
      return RoutingOutcomeType.Failed;
    }
    if (status === "RATE_LIMITED") {
      return RoutingOutcomeType.RateLimited;
    }
    return RoutingOutcomeType.Unknown;
  }
}
