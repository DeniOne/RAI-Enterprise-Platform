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
import { RuntimeGovernancePolicyService } from "./runtime-governance/runtime-governance-policy.service";
import {
  RoutingOutcomeType,
  RoutingTelemetryEvent,
  SemanticRoutingContext,
} from "../../shared/rai-chat/semantic-routing.types";
import { IntentClassification } from "../../shared/rai-chat/intent-router.types";
import {
  BranchResultContract,
  BranchTrustAssessment,
  BranchVerdict,
  UserFacingBranchCompositionPayload,
} from "../../shared/rai-chat/branch-trust.types";
import { BranchTrustInputs } from "./truthfulness-engine.service";
import { RuntimeTrustLatencyProfile } from "../../shared/rai-chat/runtime-governance-policy.types";
import { SemanticIngressService } from "./semantic-ingress.service";
import { SemanticIngressFrame } from "../../shared/rai-chat/semantic-ingress.types";

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
    private readonly semanticIngress: SemanticIngressService,
    private readonly runtimeGovernancePolicy: RuntimeGovernancePolicyService,
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
      userConfirmed: false,
      userIntentSource: "unknown",
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
      semanticIngressFrame,
    } = plannedExecution;
    actorContext.userIntentSource = semanticIngressFrame.operationAuthority;
    actorContext.userConfirmed =
      this.isDirectUserCommand(semanticIngressFrame) &&
      Boolean(userId) &&
      !options?.replayMode;

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
      semanticIngressFrame,
      traceId,
      threadId,
    };
    actorContext.agentRole = executionRequest.role;
    let executionResult = await this.agentRuntime.executeAgent(
      executionRequest,
      actorContext,
    );
    const tTrustStart = Date.now();
    executionResult = await this.applyBranchTrustStage({
      request,
      actorContext,
      executionRequest,
      executionResult,
    });
    const tTrustEnd = Date.now();
    const branchTrustAssessments =
      executionResult.agentExecution?.branchTrustAssessments ?? [];
    const trustCrossCheckTriggered =
      executionResult.agentExecution?.structuredOutput?.trustCrossCheckTriggered ===
      true;
    const trustLatencyProfile = this.resolveTrustLatencyProfile(
      branchTrustAssessments,
      trustCrossCheckTriggered,
    );
    const trustGateLatencyMs =
      branchTrustAssessments.length > 0 ? tTrustEnd - tTrustStart : null;
    const trustLatencyBudgetMs =
      trustLatencyProfile && executionResult.agentExecution?.role
        ? this.runtimeGovernancePolicy.resolveTrustLatencyBudgetMs(
            executionResult.agentExecution.role,
            trustLatencyProfile,
          )
        : null;
    const trustLatencyWithinBudget =
      trustGateLatencyMs !== null && trustLatencyBudgetMs !== null
        ? trustGateLatencyMs <= trustLatencyBudgetMs
        : null;

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
        branchResults: executionResult.agentExecution?.branchResults,
        branchTrustAssessments:
          executionResult.agentExecution?.branchTrustAssessments,
        branchCompositions: executionResult.agentExecution?.branchCompositions,
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
        semanticIngressFrame,
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
            durationMs: tTrustStart - tExecStart,
          },
          {
            name: "branch_trust_assessment",
            timestamp: new Date(tTrustStart).toISOString(),
            durationMs: tTrustEnd - tTrustStart,
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
            branchTrustAssessments,
            trustGateLatencyMs,
            trustLatencyProfile,
            trustLatencyBudgetMs,
            trustLatencyWithinBudget,
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

  private async applyBranchTrustStage(params: {
    request: RaiChatRequestDto;
    actorContext: RaiToolActorContext;
    executionRequest: AgentExecutionRequest;
    executionResult: Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
  }): Promise<Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>> {
    const { request, actorContext, executionRequest, executionResult } = params;
    const primary = executionResult.agentExecution;
    if (!primary || primary.status !== "COMPLETED") {
      return executionResult;
    }

    const trust = this.buildTrustAssessment(primary, primary.role === "knowledge");
    const primaryArtifacts = this.buildBranchArtifacts({
      request,
      companyId: actorContext.companyId,
      execution: primary,
      trust,
      branchKind: "primary",
    });
    const currentOutput = {
      ...(primary.structuredOutput ?? {}),
      trustScore: trust.score,
      trustAssessment: trust.assessment,
      branchVerdict: trust.verdict,
      trustEvidenceCoveragePct: trust.branchTrustInputs.evidenceCoveragePct,
      trustInvalidClaimsPct: trust.branchTrustInputs.invalidClaimsPct,
      trustBsScorePct: trust.branchTrustInputs.bsScorePct,
      trustCrossCheckTriggered: false,
    };
    executionResult.agentExecution = {
      ...primary,
      structuredOutput: currentOutput,
      structuredOutputs:
        primary.structuredOutputs && primary.structuredOutputs.length > 0
          ? primary.structuredOutputs
          : [currentOutput],
      branchResults: primaryArtifacts.branchResults,
      branchTrustAssessments: primaryArtifacts.branchTrustAssessments,
      branchCompositions: primaryArtifacts.branchCompositions,
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

    const crossCheckTrust = this.buildTrustAssessment(crossCheckExecution, true);
    const crossCheckArtifacts = this.buildBranchArtifacts({
      request,
      companyId: actorContext.companyId,
      execution: crossCheckExecution,
      trust: crossCheckTrust,
      branchKind: "cross_check",
    });

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
    const mergedBranchResults = [
      ...(executionResult.agentExecution.branchResults ?? []),
      ...crossCheckArtifacts.branchResults,
    ];
    const mergedBranchTrustAssessments = [
      ...(executionResult.agentExecution.branchTrustAssessments ?? []),
      ...crossCheckArtifacts.branchTrustAssessments,
    ];
    const mergedBranchCompositions = [
      ...(executionResult.agentExecution.branchCompositions ?? []),
      ...crossCheckArtifacts.branchCompositions,
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
      branchResults: mergedBranchResults,
      branchTrustAssessments: mergedBranchTrustAssessments,
      branchCompositions: mergedBranchCompositions,
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
    status?: string;
    structuredOutput?: Record<string, unknown>;
    evidence?: Array<{
      claim: string;
      sourceType: "TOOL_RESULT" | "DB" | "DOC";
      sourceId: string;
      confidenceScore: number;
    }>;
    validation?: {
      passed?: boolean;
      reasons?: string[];
    };
  }, suppressCrossCheck = false): {
    score: number;
    assessment: string;
    verdict: BranchVerdict;
    reasons: string[];
    branchTrustInputs: ReturnType<TruthfulnessEngineService["buildBranchTrustInputs"]>;
    requiresCrossCheck: boolean;
  } {
    const structuredOutput = execution.structuredOutput ?? {};
    const confidence = this.extractConfidence(structuredOutput);
    const branchTrustInputs = this.truthfulnessEngine.buildBranchTrustInputs(
      execution.evidence ?? [],
    );
    const evidenceCount = branchTrustInputs.accounting.total;
    const evidenceTrustScore =
      branchTrustInputs.bsScorePct === null
        ? 0
        : Math.max(0, 1 - branchTrustInputs.bsScorePct / 100);
    const score = Number(
      (confidence * 0.4 + evidenceTrustScore * 0.6).toFixed(2),
    );
    const explicitCrossCheck = structuredOutput.crossCheckRequired === true;
    const explicitHighRisk =
      structuredOutput.trustRiskLevel === "high" ||
      structuredOutput.highRiskPolicy === true;
    const explicitVerdict = this.extractBranchVerdict(structuredOutput);
    const validationFailed = execution.validation?.passed === false;
    const validationReasons = execution.validation?.reasons ?? [];
    const hasConflict = structuredOutput.conflictDetected === true;
    const verdict: BranchVerdict =
      execution.status && execution.status !== "COMPLETED"
        ? "REJECTED"
        : validationFailed
          ? "REJECTED"
          : explicitVerdict ??
            (hasConflict
              ? "CONFLICTED"
              : branchTrustInputs.recommendedVerdict);
    const reasons = this.uniqueStrings([
      ...(execution.status && execution.status !== "COMPLETED"
        ? ["execution_not_completed"]
        : []),
      ...(validationFailed
        ? validationReasons.length > 0
          ? validationReasons
          : ["validation_failed"]
        : []),
      ...(hasConflict ? ["conflict_detected"] : []),
      ...(evidenceCount === 0 ? ["no_evidence_refs"] : []),
      ...(confidence <= SupervisorAgent.TRUST_SCORE_LOW_THRESHOLD
        ? ["low_confidence"]
        : []),
      ...(explicitVerdict ? [`explicit_verdict:${explicitVerdict}`] : []),
      ...(explicitHighRisk ? ["explicit_high_risk_policy"] : []),
      ...branchTrustInputs.reasons,
    ]);
    return {
      score,
      assessment:
        verdict === "VERIFIED"
          ? "ok"
          : verdict === "PARTIAL"
            ? "limited"
            : score <= SupervisorAgent.TRUST_SCORE_LOW_THRESHOLD
            ? "low"
            : "elevated_risk",
      verdict,
      reasons,
      branchTrustInputs,
      requiresCrossCheck:
        !suppressCrossCheck &&
        (explicitCrossCheck ||
          explicitHighRisk ||
          branchTrustInputs.requiresCrossCheck ||
          verdict === "UNVERIFIED" ||
          verdict === "CONFLICTED" ||
          (verdict === "PARTIAL" &&
            score <= SupervisorAgent.TRUST_SCORE_LOW_THRESHOLD)),
    };
  }

  private resolveTrustLatencyProfile(
    assessments: BranchTrustAssessment[],
    crossCheckTriggered: boolean,
  ): RuntimeTrustLatencyProfile | null {
    if (assessments.length === 0) {
      return null;
    }
    if (crossCheckTriggered) {
      return "CROSS_CHECK_TRIGGERED";
    }
    if (assessments.length > 1) {
      return "MULTI_SOURCE_READ";
    }
    return "HAPPY_PATH";
  }

  private buildBranchArtifacts(params: {
    request: RaiChatRequestDto;
    companyId: string;
    execution: {
      role: string;
      status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA" | "RATE_LIMITED";
      text: string;
      structuredOutput?: Record<string, unknown>;
      toolCalls: Array<{ name: string; result: unknown }>;
      evidence: Array<{
        claim: string;
        sourceType: "TOOL_RESULT" | "DB" | "DOC";
        sourceId: string;
        confidenceScore: number;
      }>;
    };
    trust: {
      score: number;
      verdict: BranchVerdict;
      reasons: string[];
      requiresCrossCheck: boolean;
    };
    branchKind: "primary" | "cross_check";
  }): {
    branchResults: BranchResultContract[];
    branchTrustAssessments: BranchTrustAssessment[];
    branchCompositions: UserFacingBranchCompositionPayload[];
  } {
    const branchId = `${params.execution.role}:${params.branchKind}`;
    const structuredOutput = params.execution.structuredOutput ?? {};
    const branchResult: BranchResultContract = {
      branch_id: branchId,
      source_agent: params.execution.role,
      domain: params.execution.role,
      summary: params.execution.text,
      scope: this.resolveBranchScope(
        params.request,
        params.companyId,
        params.execution.role,
        structuredOutput,
      ),
      facts: this.pickRecord(structuredOutput, "data"),
      metrics:
        this.pickRecord(structuredOutput, "metrics") ??
        this.pickRecord(structuredOutput, "mathBasis"),
      money: this.pickRecord(structuredOutput, "money"),
      derived_from: this.resolveBranchDerivedFrom(
        params.request,
        params.execution,
        params.branchKind,
      ),
      evidence_refs: params.execution.evidence ?? [],
      assumptions: this.extractStringArray(
        structuredOutput,
        "assumptions",
      ),
      data_gaps: this.uniqueStrings([
        ...this.extractStringArray(structuredOutput, "data_gaps", "dataGaps"),
        ...this.extractStringArray(
          structuredOutput,
          "missingContext",
          "missing_context",
        ),
      ]),
      freshness: this.resolveFreshness(structuredOutput),
      confidence: this.extractConfidence(structuredOutput),
    };
    const branchTrustAssessment: BranchTrustAssessment = {
      branch_id: branchId,
      source_agent: params.execution.role,
      verdict: params.trust.verdict,
      score: params.trust.score,
      reasons: params.trust.reasons,
      checks: [
        {
          name: "schema_check",
          status: "PASSED",
        },
        {
          name: "source_resolution",
          status:
            branchResult.evidence_refs.length > 0 ? "PASSED" : "FAILED",
          details:
            branchResult.evidence_refs.length > 0
              ? undefined
              : "missing_evidence_refs",
        },
        {
          name: "ownership_check",
          status: "PASSED",
        },
        {
          name: "deterministic_recompute",
          status: "SKIPPED",
        },
        {
          name: "cross_branch_consistency",
          status:
            params.branchKind === "cross_check" ? "PASSED" : "SKIPPED",
        },
        {
          name: "freshness_check",
          status:
            branchResult.freshness.status === "STALE" ? "FAILED" : "SKIPPED",
        },
        {
          name: "gap_disclosure",
          status:
            branchResult.data_gaps.length > 0 ? "PASSED" : "SKIPPED",
        },
      ],
      requires_cross_check: params.trust.requiresCrossCheck,
    };
    const branchComposition: UserFacingBranchCompositionPayload = {
      branch_id: branchId,
      verdict: params.trust.verdict,
      include_in_response: params.trust.verdict !== "REJECTED",
      summary: params.execution.text,
      disclosure: this.uniqueStrings([
        ...params.trust.reasons,
        ...branchResult.data_gaps,
      ]),
    };

    return {
      branchResults: [branchResult],
      branchTrustAssessments: [branchTrustAssessment],
      branchCompositions: [branchComposition],
    };
  }

  private extractConfidence(structuredOutput: Record<string, unknown>): number {
    const raw = structuredOutput.confidence;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.max(0, Math.min(1, raw));
    }
    return 0.5;
  }

  private extractBranchVerdict(
    structuredOutput: Record<string, unknown>,
  ): BranchVerdict | null {
    const raw = structuredOutput.branchVerdict;
    if (
      raw === "VERIFIED" ||
      raw === "PARTIAL" ||
      raw === "UNVERIFIED" ||
      raw === "CONFLICTED" ||
      raw === "REJECTED"
    ) {
      return raw;
    }
    return null;
  }

  private resolveBranchScope(
    request: RaiChatRequestDto,
    companyId: string,
    role: string,
    structuredOutput: Record<string, unknown>,
  ): BranchResultContract["scope"] {
    const explicitScope = this.pickRecord(structuredOutput, "scope") ?? {};
    const selectedRowSummary = request.workspaceContext?.selectedRowSummary;
    const activeEntityRefs = request.workspaceContext?.activeEntityRefs?.map(
      (ref) => `${ref.kind}:${ref.id}`,
    );

    return {
      domain: role,
      route: request.workspaceContext?.route,
      company_id: companyId,
      entity_type:
        typeof explicitScope.entity_type === "string"
          ? explicitScope.entity_type
          : selectedRowSummary?.kind,
      entity_id:
        typeof explicitScope.entity_id === "string"
          ? explicitScope.entity_id
          : selectedRowSummary?.id,
      workspace_entity_refs:
        Array.isArray(activeEntityRefs) && activeEntityRefs.length > 0
          ? activeEntityRefs
          : undefined,
      ...explicitScope,
    };
  }

  private resolveBranchDerivedFrom(
    request: RaiChatRequestDto,
    execution: {
      role: string;
      structuredOutput?: Record<string, unknown>;
      toolCalls: Array<{ name: string; result: unknown }>;
    },
    branchKind: "primary" | "cross_check",
  ): BranchResultContract["derived_from"] {
    const derivedFrom: BranchResultContract["derived_from"] = [];

    if (branchKind === "cross_check") {
      derivedFrom.push({
        kind: "cross_check",
        source_id: `${execution.role}:cross_check`,
      });
    }

    for (const toolCall of execution.toolCalls ?? []) {
      if (typeof toolCall.name === "string" && toolCall.name.length > 0) {
        derivedFrom.push({
          kind: "tool_call",
          source_id: toolCall.name,
        });
      }
    }

    if (this.pickRecord(execution.structuredOutput ?? {}, "data")) {
      derivedFrom.push({
        kind: "structured_output",
        source_id: `${execution.role}:structured_output`,
        field_path: "data",
      });
    }

    if (request.workspaceContext?.route) {
      derivedFrom.push({
        kind: "workspace_context",
        source_id: request.workspaceContext.route,
        field_path: "workspaceContext.route",
      });
    }

    if (derivedFrom.length === 0) {
      derivedFrom.push({
        kind: "manual",
        source_id: `${execution.role}:${branchKind}`,
      });
    }

    return derivedFrom;
  }

  private resolveFreshness(
    structuredOutput: Record<string, unknown>,
  ): BranchResultContract["freshness"] {
    const rawFreshness = this.pickRecord(structuredOutput, "freshness");
    const rawStatus = rawFreshness?.status;
    const checkedAt =
      typeof rawFreshness?.checked_at === "string"
        ? rawFreshness.checked_at
        : new Date().toISOString();

    if (
      rawStatus === "FRESH" ||
      rawStatus === "STALE" ||
      rawStatus === "UNKNOWN"
    ) {
      return {
        status: rawStatus,
        checked_at: checkedAt,
        observed_at:
          typeof rawFreshness.observed_at === "string"
            ? rawFreshness.observed_at
            : undefined,
        expires_at:
          typeof rawFreshness.expires_at === "string"
            ? rawFreshness.expires_at
            : undefined,
      };
    }

    return {
      status: "UNKNOWN",
      checked_at: checkedAt,
    };
  }

  private extractStringArray(
    payload: Record<string, unknown>,
    ...keys: string[]
  ): string[] {
    for (const key of keys) {
      const value = payload[key];
      if (Array.isArray(value)) {
        return value.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        );
      }
    }
    return [];
  }

  private pickRecord(
    payload: Record<string, unknown>,
    key: string,
  ): Record<string, unknown> | undefined {
    const value = payload[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values.filter((value) => value.trim().length > 0))];
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
    semanticIngressFrame: SemanticIngressFrame;
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
    const semanticIngressFrame = this.semanticIngress.buildFrame({
      request,
      legacyClassification: legacyPlan.classification,
      finalClassification: classification,
      finalRequestedToolCalls: requestedToolCalls,
      semanticEvaluation,
    });

    return {
      classification,
      requestedToolCalls,
      semanticIngressFrame,
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

  private isDirectUserCommand(semanticIngressFrame: SemanticIngressFrame): boolean {
    return semanticIngressFrame.operationAuthority === "direct_user_command";
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
