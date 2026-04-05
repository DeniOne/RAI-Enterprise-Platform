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
import {
  AgentExecutionAuditPayload,
  AgentExecutionRequest,
} from "./agent-platform/agent-platform.types";
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
import {
  CompositeWorkflowPlan,
  CompositeWorkflowStageContract,
  CompositeWorkflowStageStatus,
} from "../../shared/rai-chat/composite-orchestration.types";
import {
  CompositeStagePayloadArtifact,
  resolveCompositeStagePayload,
} from "../../shared/rai-chat/composite-stage-payload-resolver";
import { BranchTrustInputs } from "./truthfulness-engine.service";
import { RuntimeTrustLatencyProfile } from "../../shared/rai-chat/runtime-governance-policy.types";
import { SemanticIngressService } from "./semantic-ingress.service";
import { BranchSchedulerService } from "./planner/branch-scheduler.service";
import { BranchStatePlaneService } from "./branch-state-plane.service";
import { PendingActionService } from "./security/pending-action.service";
import { buildBranchPlannerTelemetrySnapshot } from "../../shared/rai-chat/branch-runtime-telemetry";
import { resolvePlannerRuntimePathEnabled } from "../../shared/rai-chat/planner-promotion-policy";
import {
  buildControlTowerPlannerEnvelopeV1,
  buildControlTowerSubIntentGraphSnapshotV1,
} from "../../shared/rai-chat/control-tower-planner-envelope";
import { resolveAgentExecutionSummary } from "../../shared/rai-chat/agent-execution-summary";
import {
  advanceRunnableRootsToRunning,
  applyPlannerMutationApprovalToSurface,
  finalizeNamedBranchFromExecution,
  finalizeSurfaceFromExecution,
  isPlannerSliceFullyTerminal,
} from "../../shared/rai-chat/execution-surface-runtime";
import { SemanticIngressFrame } from "../../shared/rai-chat/semantic-ingress.types";
import type {
  ExecutionPlan,
  ExecutionPlanBranch,
  ExecutionSurfaceState,
} from "../../shared/rai-chat/execution-target-state.types";

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
    private readonly branchScheduler: BranchSchedulerService,
    private readonly branchStatePlane: BranchStatePlaneService,
    private readonly pendingActionService: PendingActionService,
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
    const executionRole = this.resolveExecutionRole({
      semanticIngressFrame,
      classification,
    });
    const plannerMaxConcurrentBranches =
      this.resolvePlannerMaxConcurrentBranches(executionRole);
    const plannerPromotion = resolvePlannerRuntimePathEnabled({
      env: process.env,
      companyId,
    });
    const plannerRuntimeEnabled = plannerPromotion.enabled;
    if (
      plannerRuntimeEnabled &&
      semanticIngressFrame.subIntentGraph?.branches?.length
    ) {
      const graph = semanticIngressFrame.subIntentGraph;
      const prevSlice =
        options?.replayMode
          ? undefined
          : await this.branchStatePlane.getThreadPlannerSlice(
              companyId,
              threadId,
            );
      const continueSameGraph =
        prevSlice &&
        prevSlice.sourceGraphId === graph.graphId &&
        !isPlannerSliceFullyTerminal(prevSlice.executionSurface);

      if (continueSameGraph && prevSlice) {
        const plan = JSON.parse(
          JSON.stringify(prevSlice.executionPlan),
        ) as ExecutionPlan;
        let surface = JSON.parse(
          JSON.stringify(prevSlice.executionSurface),
        ) as ExecutionSurfaceState;
        if (request.executionPlannerMutationApproved) {
          surface = await this.maybeApplyPlannerMutationResume(
            request,
            companyId,
            surface,
          );
        }
        semanticIngressFrame.executionPlan = plan;
        semanticIngressFrame.executionSurface = advanceRunnableRootsToRunning(
          surface,
          plan,
          { maxConcurrentRunning: plannerMaxConcurrentBranches },
        );
      } else {
        const executionPlan =
          this.branchScheduler.buildExecutionPlanFromIngress(
            semanticIngressFrame,
          );
        if (executionPlan) {
          semanticIngressFrame.executionPlan = executionPlan;
          semanticIngressFrame.executionSurface =
            this.branchScheduler.buildInitialSurface(
              executionPlan,
              semanticIngressFrame,
            );
          semanticIngressFrame.executionSurface = advanceRunnableRootsToRunning(
            semanticIngressFrame.executionSurface,
            executionPlan,
            { maxConcurrentRunning: plannerMaxConcurrentBranches },
          );
        }
      }
    }
    actorContext.userIntentSource = semanticIngressFrame.operationAuthority;
    actorContext.writePolicy = semanticIngressFrame.writePolicy;
    actorContext.userConfirmed =
      semanticIngressFrame.writePolicy.decision === "execute" &&
      this.isDirectUserCommand(semanticIngressFrame) &&
      Boolean(userId) &&
      !options?.replayMode;
    const tExecStart = Date.now();
    const executionRequest: AgentExecutionRequest = {
      role: executionRole,
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
    const plannerBranchTickResult = await this.executePlannerBranchesForTick({
      request,
      actorContext,
      executionRequest,
      plannerRuntimeEnabled,
    });
    const plannerBranchDrivenExecution = Boolean(plannerBranchTickResult);
    let executionResult =
      plannerBranchTickResult ??
      (await this.agentRuntime.executeAgent(executionRequest, actorContext));
    executionResult = this.applyTechMapWorkflowFrame({
      executionResult,
      semanticIngressFrame,
    });
    executionResult = await this.applyCompositeWorkflowStage({
      request,
      actorContext,
      executionRequest,
      executionResult,
      compositePlan: semanticIngressFrame.compositePlan ?? null,
      plannerMaxConcurrentBranches,
      plannerRuntimeEnabled,
    });
    const tTrustStart = Date.now();
    if (!plannerBranchDrivenExecution) {
      executionResult = await this.applyBranchTrustStage({
        request,
        actorContext,
        executionRequest,
        executionResult,
      });
    }
    const tTrustEnd = Date.now();
    if (
      plannerRuntimeEnabled &&
      semanticIngressFrame.executionSurface &&
      !plannerBranchDrivenExecution
    ) {
      semanticIngressFrame.executionSurface = finalizeSurfaceFromExecution(
        semanticIngressFrame.executionSurface,
        executionResult.executedTools,
        executionResult.agentExecution?.status ?? null,
        semanticIngressFrame.executionPlan ?? null,
      );
    }
    if (semanticIngressFrame.executionSurface) {
      this.branchStatePlane.recordSnapshot(
        traceId,
        semanticIngressFrame.executionSurface,
      );
    }
    if (
      !options?.replayMode &&
      plannerRuntimeEnabled &&
      semanticIngressFrame.executionPlan &&
      semanticIngressFrame.executionSurface &&
      semanticIngressFrame.subIntentGraph
    ) {
      await this.branchStatePlane.recordThreadPlannerSlice(
        companyId,
        threadId,
        {
          version: "v1",
          sourceGraphId: semanticIngressFrame.subIntentGraph.graphId,
          executionPlan: semanticIngressFrame.executionPlan,
          executionSurface: semanticIngressFrame.executionSurface,
        },
      );
    }
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
      semanticIngressFrame,
    });
    response.agentRole = response.agentRole ?? executionRequest.role;

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

      const plannerTelemetryOptions = semanticIngressFrame.executionPlan
        ? {
            maxConcurrentBranches: plannerMaxConcurrentBranches,
            plannerPromotion,
          }
        : { plannerPromotion };
      const plannerBranchTelemetrySnapshot =
        buildBranchPlannerTelemetrySnapshot(
          semanticIngressFrame,
          plannerTelemetryOptions,
        );
      const controlTowerPlannerEnvelope = buildControlTowerPlannerEnvelopeV1({
        traceId,
        companyId,
        promotion: plannerPromotion,
        frame: semanticIngressFrame,
        plannerBranchTelemetry: plannerBranchTelemetrySnapshot,
      });
      const controlTowerSubIntentGraphSnapshot =
        buildControlTowerSubIntentGraphSnapshotV1(
          semanticIngressFrame.subIntentGraph,
        );

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
        agentRole: executionResult.agentExecution?.role ?? executionRequest.role,
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
        plannerBranchTelemetry: plannerBranchTelemetrySnapshot,
        controlTowerPlannerEnvelope,
        controlTowerSubIntentGraphSnapshot,
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

  private async executePlannerBranchesForTick(params: {
    request: RaiChatRequestDto;
    actorContext: RaiToolActorContext;
    executionRequest: AgentExecutionRequest;
    plannerRuntimeEnabled: boolean;
  }): Promise<Awaited<ReturnType<AgentRuntimeService["executeAgent"]>> | null> {
    const runnableBranches = this.resolvePlannerRunnableBranchesForTick(
      params.executionRequest,
      params.plannerRuntimeEnabled,
    );
    if (runnableBranches.length === 0) {
      return null;
    }

    const executedTools: Array<{ name: RaiToolName; result: unknown }> = [];
    const structuredOutputs: Record<string, unknown>[] = [];
    const branchResults: BranchResultContract[] = [];
    const branchTrustAssessments: BranchTrustAssessment[] = [];
    const branchCompositions: UserFacingBranchCompositionPayload[] = [];
    const delegationChain: NonNullable<
      NonNullable<
        Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
      >["delegationChain"]
    > = [];
    const toolCalls: Array<{ name: string; result: unknown }> = [];
    const connectorCalls: Array<{ name: string; result: unknown }> = [];
    const evidence: NonNullable<
      NonNullable<
        Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
      >["evidence"]
    > = [];
    const suggestedActions: NonNullable<
      NonNullable<
        Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
      >["suggestedActions"]
    > = [];
    const statusTrail: Array<
      NonNullable<
        Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
      >["status"]
    > = [];
    const summaryTrail: string[] = [];
    const validationReasons: string[] = [];
    let validationPassed = true;
    let fallbackUsed = false;
    let usage: NonNullable<
      NonNullable<
        Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
      >["usage"]
    >;
    let runtimeBudget:
      | Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["runtimeBudget"]
      | undefined;
    let runtimeGovernance:
      | Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["runtimeGovernance"]
      | undefined;
    let outputContractVersion = "v1";
    let executionPath:
      | NonNullable<
          Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
        >["executionPath"]
      | undefined;
    let auditPayload: AgentExecutionAuditPayload | undefined;
    let baseExecution:
      | NonNullable<
          Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
        >
      | null = null;
    let latestExecutionForVirtualBranches:
      | NonNullable<
          Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
        >
      | null = null;

    for (const branch of runnableBranches) {
      if (!branch.toolName) {
        const virtualStatus = this.resolveToollessPlannerBranchStatus({
          branch,
          latestExecution: latestExecutionForVirtualBranches,
        });
        statusTrail.push(virtualStatus);
        summaryTrail.push(
          this.buildToollessPlannerBranchSummary(branch, virtualStatus),
        );
        this.pulsePlannerSurfaceForExecutedBranch({
          semanticIngressFrame: params.executionRequest.semanticIngressFrame,
          branchId: branch.branchId,
          executedTools: [],
          agentStatus: virtualStatus,
          plannerMaxConcurrentBranches: 1,
          plannerRuntimeEnabled: params.plannerRuntimeEnabled,
          promoteNextRunnable: false,
        });
        continue;
      }

      const branchRole = branch.ownerRole ?? params.executionRequest.role;
      const rawBranchResult = await this.agentRuntime.executeAgent(
        {
          role: branchRole,
          message: params.request.message,
          workspaceContext: params.request.workspaceContext,
          memoryContext: params.executionRequest.memoryContext,
          requestedTools: [
            {
              name: branch.toolName,
              payload: branch.payload ?? {},
            },
          ],
          semanticRouting: params.executionRequest.semanticRouting,
          semanticIngressFrame: params.executionRequest.semanticIngressFrame,
          traceId: params.executionRequest.traceId,
          threadId: params.executionRequest.threadId,
        },
        {
          ...params.actorContext,
          agentRole: branchRole,
          parentSpanId:
            params.actorContext.parentSpanId ?? params.executionRequest.traceId,
        },
      );
      const branchResult = this.normalizePlannerBranchExecutionResult(
        rawBranchResult,
        branch.toolName,
      );
      executedTools.push(...branchResult.executedTools);
      runtimeBudget = branchResult.runtimeBudget ?? runtimeBudget;
      runtimeGovernance = branchResult.runtimeGovernance ?? runtimeGovernance;

      const branchExecution =
        branchResult.agentExecution ??
        (branchResult.executedTools.some((tool) => {
          if (!tool.result || typeof tool.result !== "object") {
            return false;
          }
          return (tool.result as { riskPolicyBlocked?: boolean }).riskPolicyBlocked === true;
        })
          ? this.buildGovernedPendingActionExecution(
              branch.toolName,
              branchResult.executedTools,
            )
          : undefined);
      this.pulsePlannerSurfaceForExecutedBranch({
        semanticIngressFrame: params.executionRequest.semanticIngressFrame,
        branchId: branch.branchId,
        executedTools: branchResult.executedTools,
        agentStatus: branchExecution?.status ?? "FAILED",
        plannerMaxConcurrentBranches: 1,
        plannerRuntimeEnabled: params.plannerRuntimeEnabled,
        promoteNextRunnable: false,
      });

      if (!branchExecution) {
        statusTrail.push("FAILED");
        summaryTrail.push(
          `Ветка ${branch.branchId} не вернула agentExecution и помечена как failed.`,
        );
        validationPassed = false;
        validationReasons.push("missing_agent_execution");
        continue;
      }

      latestExecutionForVirtualBranches = branchExecution;
      if (!baseExecution) {
        baseExecution = branchExecution;
      }
      statusTrail.push(branchExecution.status);
      summaryTrail.push(
        resolveAgentExecutionSummary({
          structuredOutput: branchExecution.structuredOutput,
          structuredOutputs: branchExecution.structuredOutputs,
          branchCompositions: branchExecution.branchCompositions,
          branchResults: branchExecution.branchResults,
          fallback: `Ветка ${branch.branchId} выполнена.`,
        }),
      );
      structuredOutputs.push(branchExecution.structuredOutput);
      toolCalls.push(...branchExecution.toolCalls);
      connectorCalls.push(...branchExecution.connectorCalls);
      evidence.push(...branchExecution.evidence);
      validationPassed = validationPassed && branchExecution.validation.passed;
      validationReasons.push(...branchExecution.validation.reasons);
      fallbackUsed = fallbackUsed || branchExecution.fallbackUsed;
      usage = this.mergeUsage(usage, branchExecution.usage);
      outputContractVersion =
        branchExecution.outputContractVersion ?? outputContractVersion;
      executionPath = executionPath ?? branchExecution.executionPath;
      auditPayload = this.mergeAuditPayload(
        auditPayload,
        branchExecution.auditPayload,
      );
      if (branchExecution.runtimeGovernance) {
        runtimeGovernance = branchExecution.runtimeGovernance;
      }
      if (branchExecution.delegationChain?.length) {
        delegationChain.push(...branchExecution.delegationChain);
      }
      if (branchExecution.suggestedActions?.length) {
        suggestedActions.push(...branchExecution.suggestedActions);
      }

      const trust = this.buildTrustAssessment(branchExecution, true);
      const artifacts = this.buildBranchArtifacts({
        request: params.request,
        companyId: params.actorContext.companyId,
        execution: branchExecution,
        trust,
        branchKind: "primary",
        branchIdOverride: branch.branchId,
      });
      branchResults.push(...artifacts.branchResults);
      branchTrustAssessments.push(...artifacts.branchTrustAssessments);
      branchCompositions.push(...artifacts.branchCompositions);
    }

    const aggregateStatus =
      this.resolvePlannerBranchAggregateStatus(statusTrail);
    const aggregateConfidence =
      branchTrustAssessments.length > 0
        ? Number(
            (
              branchTrustAssessments.reduce(
                (sum, assessment) => sum + assessment.score,
                0,
              ) / branchTrustAssessments.length
            ).toFixed(2),
          )
        : 0.5;

    return {
      executedTools,
      runtimeBudget,
      runtimeGovernance,
      agentExecution: {
        role: baseExecution?.role ?? params.executionRequest.role,
        status: aggregateStatus,
        executionPath:
          executionPath ??
          baseExecution?.executionPath ??
          "explicit_tool_path",
        structuredOutput: {
          ...(baseExecution?.structuredOutput ?? {}),
          summary: this.buildPlannerBranchTickSummary(
            runnableBranches,
            summaryTrail,
          ),
          resultType: "planner_branch_tick",
          plannerBranchDriven: true,
          plannerExecutedBranchIds: runnableBranches.map(
            (branch) => branch.branchId,
          ),
          plannerExecutedToolNames: executedTools.map((tool) => tool.name),
          plannerExecutionCount: runnableBranches.length,
          confidence: aggregateConfidence,
        },
        structuredOutputs:
          structuredOutputs.length > 0 ? structuredOutputs : undefined,
        branchResults: branchResults.length > 0 ? branchResults : undefined,
        branchTrustAssessments:
          branchTrustAssessments.length > 0
            ? branchTrustAssessments
            : undefined,
        branchCompositions:
          branchCompositions.length > 0 ? branchCompositions : undefined,
        delegationChain:
          delegationChain.length > 0 ? delegationChain : undefined,
        usage,
        toolCalls,
        connectorCalls,
        evidence,
        validation: {
          passed: validationPassed,
          reasons: this.uniqueStrings(validationReasons),
        },
        runtimeBudget,
        runtimeGovernance,
        fallbackUsed,
        outputContractVersion:
          baseExecution?.outputContractVersion ?? outputContractVersion,
        auditPayload:
          auditPayload ??
          this.buildPlannerAggregateAuditPayload(executedTools),
        suggestedActions:
          suggestedActions.length > 0 ? suggestedActions : undefined,
      },
    };
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
          ? [currentOutput, ...primary.structuredOutputs]
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

  /**
   * После выполнения конкретной composite-ветки продвигает только её строку в planner surface,
   * а затем открывает следующие runnable корни.
   */
  private pulsePlannerSurfaceForExecutedBranch(params: {
    semanticIngressFrame: SemanticIngressFrame;
    branchId: string;
    executedTools: Array<{ name: RaiToolName; result: unknown }>;
    agentStatus: string | null | undefined;
    plannerMaxConcurrentBranches: number;
    plannerRuntimeEnabled: boolean;
    promoteNextRunnable?: boolean;
  }): void {
    if (!params.plannerRuntimeEnabled) {
      return;
    }
    const frame = params.semanticIngressFrame;
    if (!frame.executionSurface || !frame.executionPlan) {
      return;
    }
    frame.executionSurface = finalizeNamedBranchFromExecution(
      frame.executionSurface,
      params.branchId,
      params.executedTools,
      params.agentStatus,
      frame.executionPlan,
    );
    if (params.promoteNextRunnable === false) {
      return;
    }
    frame.executionSurface = advanceRunnableRootsToRunning(
      frame.executionSurface,
      frame.executionPlan,
      { maxConcurrentRunning: params.plannerMaxConcurrentBranches },
    );
  }

  private async applyCompositeWorkflowStage(params: {
    request: RaiChatRequestDto;
    actorContext: RaiToolActorContext;
    executionRequest: AgentExecutionRequest;
    executionResult: Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
    compositePlan: CompositeWorkflowPlan | null;
    plannerMaxConcurrentBranches: number;
    plannerRuntimeEnabled: boolean;
  }): Promise<Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>> {
    const { request, actorContext, executionRequest, compositePlan } = params;
    const primaryExecution = params.executionResult.agentExecution;
    if (
      !compositePlan ||
      !primaryExecution ||
      primaryExecution.status !== "COMPLETED" ||
      primaryExecution.role !== compositePlan.leadOwnerAgent ||
      compositePlan.stages.length < 2
    ) {
      return params.executionResult;
    }

    type CompositeStageSnapshot = {
      stageId: string;
      order: number;
      agentRole: string;
      intent: string;
      toolName: RaiToolName;
      status: CompositeWorkflowStageStatus;
      summary: string;
    };

    const initialStage = this.resolveInitialCompositeStage(
      compositePlan,
      executionRequest,
      primaryExecution.role,
    );
    const stageSnapshots = new Map<string, CompositeStageSnapshot>();
    const stageArtifacts = new Map<string, CompositeStagePayloadArtifact>();
    const followUpResults: Array<
      Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>
    > = [];
    const attemptedStageIds = new Set<string>();
    const cumulativeExecutedTools = [...params.executionResult.executedTools];

    stageSnapshots.set(
      initialStage.stageId,
      this.buildCompositeStageSnapshot({
        stage: initialStage,
        execution: primaryExecution,
      }),
    );
    stageArtifacts.set(
      initialStage.stageId,
      this.buildCompositeStageArtifact(primaryExecution),
    );
    attemptedStageIds.add(initialStage.stageId);

    this.pulsePlannerSurfaceForExecutedBranch({
      semanticIngressFrame: executionRequest.semanticIngressFrame,
      branchId: initialStage.stageId,
      executedTools: params.executionResult.executedTools,
      agentStatus: primaryExecution.status,
      plannerMaxConcurrentBranches: params.plannerMaxConcurrentBranches,
      plannerRuntimeEnabled: params.plannerRuntimeEnabled,
    });

    while (true) {
      const nextStage = this.pickNextCompositeStage({
        compositePlan,
        semanticIngressFrame: executionRequest.semanticIngressFrame,
        attemptedStageIds,
        stageSnapshots,
        plannerRuntimeEnabled: params.plannerRuntimeEnabled,
      });
      if (!nextStage) {
        break;
      }
      attemptedStageIds.add(nextStage.stageId);

      const payloadResolution = resolveCompositeStagePayload({
        stage: nextStage,
        artifactsByStageId: stageArtifacts,
      });
      if (!payloadResolution.ok) {
        stageSnapshots.set(nextStage.stageId, {
          stageId: nextStage.stageId,
          order: nextStage.order,
          agentRole: nextStage.agentRole,
          intent: nextStage.intent,
          toolName: nextStage.toolName,
          status: "failed",
          summary: `Composite stage payload не разрешён: ${payloadResolution.missingRequiredBindings.join(", ")}.`,
        });
        this.pulsePlannerSurfaceForExecutedBranch({
          semanticIngressFrame: executionRequest.semanticIngressFrame,
          branchId: nextStage.stageId,
          executedTools: cumulativeExecutedTools,
          agentStatus: "FAILED",
          plannerMaxConcurrentBranches: params.plannerMaxConcurrentBranches,
          plannerRuntimeEnabled: params.plannerRuntimeEnabled,
        });
        continue;
      }

      const stageResult = await this.agentRuntime.executeAgent(
        {
          role: nextStage.agentRole,
          message: `${request.message}\nComposite stage: ${nextStage.label}.`,
          workspaceContext: request.workspaceContext,
          memoryContext: executionRequest.memoryContext,
          requestedTools: [
            {
              name: nextStage.toolName,
              payload: payloadResolution.payload,
            },
          ],
          semanticRouting: executionRequest.semanticRouting,
          semanticIngressFrame: executionRequest.semanticIngressFrame,
          traceId: executionRequest.traceId,
          threadId: executionRequest.threadId,
        },
        {
          ...actorContext,
          agentRole: nextStage.agentRole,
          parentSpanId: actorContext.parentSpanId ?? executionRequest.traceId,
        },
      );
      followUpResults.push(stageResult);
      cumulativeExecutedTools.push(...stageResult.executedTools);

      const stageExecution = stageResult.agentExecution;
      stageSnapshots.set(
        nextStage.stageId,
        this.buildCompositeStageSnapshot({
          stage: nextStage,
          execution: stageExecution ?? null,
        }),
      );
      this.pulsePlannerSurfaceForExecutedBranch({
        semanticIngressFrame: executionRequest.semanticIngressFrame,
        branchId: nextStage.stageId,
        executedTools: cumulativeExecutedTools,
        agentStatus: stageExecution?.status ?? "FAILED",
        plannerMaxConcurrentBranches: params.plannerMaxConcurrentBranches,
        plannerRuntimeEnabled: params.plannerRuntimeEnabled,
      });

      if (stageExecution?.status === "COMPLETED") {
        stageArtifacts.set(
          nextStage.stageId,
          this.buildCompositeStageArtifact(stageExecution),
        );
      }
    }

    return this.finalizeCompositeExecution({
      compositePlan,
      executionResult: params.executionResult,
      stageSnapshots: this.completeCompositeStageSnapshots(
        compositePlan,
        stageSnapshots,
      ),
      followUpResults,
    });
  }

  private resolveInitialCompositeStage(
    compositePlan: CompositeWorkflowPlan,
    executionRequest: AgentExecutionRequest,
    executionRole: string,
  ): CompositeWorkflowStageContract {
    const requestedToolName = executionRequest.requestedTools?.[0]?.name ?? null;
    return (
      compositePlan.stages.find(
        (stage) =>
          stage.agentRole === executionRole &&
          stage.toolName === requestedToolName,
      ) ?? compositePlan.stages[0]
    );
  }

  private buildCompositeStageSnapshot(params: {
    stage: CompositeWorkflowStageContract;
      execution:
        | {
          role: string;
          status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA" | "RATE_LIMITED";
          structuredOutput?: Record<string, unknown>;
        }
      | null;
  }): {
    stageId: string;
    order: number;
    agentRole: string;
    intent: string;
    toolName: RaiToolName;
    status: CompositeWorkflowStageStatus;
    summary: string;
  } {
    const { stage, execution } = params;
    if (!execution) {
      return {
        stageId: stage.stageId,
        order: stage.order,
        agentRole: stage.agentRole,
        intent: stage.intent,
        toolName: stage.toolName,
        status: "failed",
        summary: "Composite stage did not return an execution result.",
      };
    }
    return {
      stageId: stage.stageId,
      order: stage.order,
      agentRole: execution.role,
      intent: String(execution.structuredOutput?.intent ?? stage.intent),
      toolName: stage.toolName,
      status: execution.status === "COMPLETED" ? "completed" : "failed",
      summary: resolveAgentExecutionSummary({
        structuredOutput: execution.structuredOutput,
        fallback: `Stage ${stage.stageId} completed.`,
      }),
    };
  }

  private buildCompositeStageArtifact(
    execution: {
      structuredOutput?: Record<string, unknown>;
    },
  ): CompositeStagePayloadArtifact {
    return {
      structuredOutput:
        execution.structuredOutput &&
        typeof execution.structuredOutput === "object"
          ? JSON.parse(
              JSON.stringify(execution.structuredOutput),
            ) as Record<string, unknown>
          : undefined,
    };
  }

  private pickNextCompositeStage(params: {
    compositePlan: CompositeWorkflowPlan;
    semanticIngressFrame: SemanticIngressFrame;
    attemptedStageIds: Set<string>;
    stageSnapshots: Map<
      string,
      {
        stageId: string;
        order: number;
        agentRole: string;
        intent: string;
        toolName: RaiToolName;
        status: CompositeWorkflowStageStatus;
        summary: string;
      }
    >;
    plannerRuntimeEnabled: boolean;
  }): CompositeWorkflowStageContract | null {
    const orderedStages = [...params.compositePlan.stages].sort(
      (left, right) => left.order - right.order,
    );
    if (
      params.plannerRuntimeEnabled &&
      params.semanticIngressFrame.executionSurface
    ) {
      const runningIds = new Set(
        params.semanticIngressFrame.executionSurface.branches
          .filter((branch) => branch.lifecycle === "RUNNING")
          .map((branch) => branch.branchId),
      );
      return (
        orderedStages.find(
          (stage) =>
            !params.attemptedStageIds.has(stage.stageId) &&
            runningIds.has(stage.stageId),
        ) ?? null
      );
    }

    const completedStageIds = new Set(
      [...params.stageSnapshots.values()]
        .filter((snapshot) => snapshot.status === "completed")
        .map((snapshot) => snapshot.stageId),
    );
    return (
      orderedStages.find(
        (stage) =>
          !params.attemptedStageIds.has(stage.stageId) &&
          stage.dependsOn.every((depId) => completedStageIds.has(depId)),
      ) ?? null
    );
  }

  private completeCompositeStageSnapshots(
    compositePlan: CompositeWorkflowPlan,
    stageSnapshots: Map<
      string,
      {
        stageId: string;
        order: number;
        agentRole: string;
        intent: string;
        toolName: RaiToolName;
        status: CompositeWorkflowStageStatus;
        summary: string;
      }
    >,
  ): Array<{
    stageId: string;
    order: number;
    agentRole: string;
    intent: string;
    toolName: RaiToolName;
    status: CompositeWorkflowStageStatus;
    summary: string;
  }> {
    const orderedStages = [...compositePlan.stages].sort(
      (left, right) => left.order - right.order,
    );
    const out: Array<{
      stageId: string;
      order: number;
      agentRole: string;
      intent: string;
      toolName: RaiToolName;
      status: CompositeWorkflowStageStatus;
      summary: string;
    }> = [];

    for (const stage of orderedStages) {
      const existing = stageSnapshots.get(stage.stageId);
      if (existing) {
        out.push(existing);
        continue;
      }

      const depStatuses = stage.dependsOn.map((depId) => {
        const dep = stageSnapshots.get(depId);
        return dep?.status ?? "planned";
      });
      const blocked =
        depStatuses.includes("failed") || depStatuses.includes("blocked");
      const waiting = depStatuses.some((status) => status !== "completed");
      out.push({
        stageId: stage.stageId,
        order: stage.order,
        agentRole: stage.agentRole,
        intent: stage.intent,
        toolName: stage.toolName,
        status: blocked ? "blocked" : "planned",
        summary: blocked
          ? `Стадия остановлена из-за незавершённых зависимостей: ${stage.dependsOn.join(", ")}.`
          : waiting
            ? `Стадия ожидает завершения зависимостей: ${stage.dependsOn.join(", ")}.`
            : "Стадия не была запущена в текущем цикле.",
      });
    }

    return out;
  }

  private finalizeCompositeExecution(params: {
    compositePlan: CompositeWorkflowPlan;
    executionResult: Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
    stageSnapshots: Array<{
      stageId: string;
      order: number;
      agentRole: string;
      intent: string;
      toolName: RaiToolName;
      status: CompositeWorkflowStageStatus;
      summary: string;
    }>;
    followUpResults: Array<Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>>;
  }): Awaited<ReturnType<AgentRuntimeService["executeAgent"]>> {
    const { compositePlan, executionResult, stageSnapshots, followUpResults } = params;
    const followUpExecutions = followUpResults
      .map((result) => result.agentExecution)
      .filter(
        (
          execution,
        ): execution is NonNullable<
          Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
        > => Boolean(execution),
      );
    const structuredOutputs = [
      ...(executionResult.agentExecution?.structuredOutputs ?? []),
      ...followUpExecutions.map((execution) => execution.structuredOutput),
    ].filter((item): item is Record<string, unknown> => Boolean(item));
    const delegationChain = [
      ...(executionResult.agentExecution?.delegationChain ?? []),
      ...followUpExecutions.flatMap((execution) => execution.delegationChain ?? []),
    ];
    const evidence = [
      ...(executionResult.agentExecution?.evidence ?? []),
      ...followUpExecutions.flatMap((execution) => execution.evidence ?? []),
    ];
    const toolCalls = [
      ...(executionResult.agentExecution?.toolCalls ?? []),
      ...followUpExecutions.flatMap((execution) => execution.toolCalls ?? []),
    ];

    executionResult.executedTools = [
      ...executionResult.executedTools,
      ...followUpResults.flatMap((result) => result.executedTools),
    ];

    const completedStages = stageSnapshots.every(
      (stage) => stage.status === "completed",
    );
    executionResult.agentExecution = {
      ...executionResult.agentExecution,
      status: completedStages ? "COMPLETED" : "NEEDS_MORE_DATA",
      evidence,
      toolCalls,
      structuredOutputs,
      delegationChain:
        delegationChain.length > 0 ? delegationChain : undefined,
      structuredOutput: {
        ...executionResult.agentExecution.structuredOutput,
        summary: this.buildCompositeExecutionSummary(
          compositePlan,
          stageSnapshots,
        ),
        resultType: "composite_workflow",
        compositePlan: this.markCompositePlanProgress(compositePlan, stageSnapshots),
        compositeStages: stageSnapshots,
        compositeWorkflowId: compositePlan.workflowId,
        compositeLeadOwner: compositePlan.leadOwnerAgent,
        compositeExecutionStrategy: compositePlan.executionStrategy,
      },
    };

    return executionResult;
  }

  private markCompositePlanProgress(
    compositePlan: CompositeWorkflowPlan,
    stageSnapshots: Array<{
      stageId: string;
      order: number;
      agentRole: string;
      intent: string;
      toolName: RaiToolName;
      status: CompositeWorkflowStageStatus;
      summary: string;
    }>,
  ): CompositeWorkflowPlan {
    const stageStatus = new Map(
      stageSnapshots.map((stage) => [stage.stageId, stage.status] as const),
    );
    return {
      ...compositePlan,
      stages: compositePlan.stages.map((stage) => ({
        ...stage,
        status: stageStatus.get(stage.stageId) ?? stage.status,
      })),
    };
  }

  private buildCompositeExecutionSummary(
    compositePlan: CompositeWorkflowPlan,
    stageSnapshots: Array<{
      stageId: string;
      order: number;
      agentRole: string;
      intent: string;
      toolName: RaiToolName;
      status: CompositeWorkflowStageStatus;
      summary: string;
    }>,
  ): string {
    const allStagesCompleted = stageSnapshots.every(
      (stage) => stage.status === "completed",
    );
    const completedStages = stageSnapshots
      .filter((stage) => stage.status === "completed")
      .sort((left, right) => left.order - right.order)
      .map((stage) => stage.summary)
      .filter(Boolean);
    const failedStages = stageSnapshots.filter(
      (stage) => stage.status === "failed" || stage.status === "blocked",
    );
    const isCrmWorkflow = compositePlan.workflowId.startsWith("crm.");
    const prefix = allStagesCompleted
      ? isCrmWorkflow
        ? `Составной CRM-сценарий выполнен по плану "${compositePlan.summary}".`
        : `Составной аналитический сценарий выполнен по плану "${compositePlan.summary}".`
      : isCrmWorkflow
        ? `Составной CRM-сценарий "${compositePlan.summary}" не удалось завершить.`
        : `Составной аналитический сценарий "${compositePlan.summary}" не удалось завершить.`;
    const failedSuffix =
      failedStages.length > 0
        ? ` Нештатные стадии: ${failedStages
            .map((stage) => stage.stageId)
            .join(", ")}.`
        : "";
    const stageSummary = completedStages.length > 0
      ? ` Итог по стадиям: ${completedStages.join(" ")}`
      : "";
    return `${prefix}${failedSuffix}${stageSummary}`.trim();
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
    branchIdOverride?: string;
  }): {
    branchResults: BranchResultContract[];
    branchTrustAssessments: BranchTrustAssessment[];
    branchCompositions: UserFacingBranchCompositionPayload[];
  } {
    const branchId =
      params.branchIdOverride ?? `${params.execution.role}:${params.branchKind}`;
    const structuredOutput = params.execution.structuredOutput ?? {};
    const branchResult: BranchResultContract = {
      branch_id: branchId,
      source_agent: params.execution.role,
      domain: params.execution.role,
      summary: resolveAgentExecutionSummary({
        structuredOutput: params.execution.structuredOutput,
        fallback: `Ветка ${branchId} выполнена.`,
      }),
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
      summary: resolveAgentExecutionSummary({
        structuredOutput: params.execution.structuredOutput,
        fallback: `Ветка ${branchId} выполнена.`,
      }),
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

  private resolvePlannerRunnableBranchesForTick(
    executionRequest: AgentExecutionRequest,
    plannerRuntimeEnabled: boolean,
  ): ExecutionPlanBranch[] {
    if (!plannerRuntimeEnabled) {
      return [];
    }
    const frame = executionRequest.semanticIngressFrame;
    if (
      !frame?.executionPlan ||
      !frame.executionSurface ||
      frame.compositePlan ||
      frame.executionPlan.branches.length < 2
    ) {
      return [];
    }

    const runningIds = new Set(
      frame.executionSurface.branches
        .filter((branch) => branch.lifecycle === "RUNNING")
        .map((branch) => branch.branchId),
    );
    if (runningIds.size === 0) {
      return [];
    }

    const branches = frame.executionPlan.branches
      .filter((branch) => runningIds.has(branch.branchId))
      .sort((left, right) => left.order - right.order);
    return branches as ExecutionPlanBranch[];
  }

  private normalizePlannerBranchExecutionResult(
    result: Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>,
    toolName: RaiToolName,
  ): Awaited<ReturnType<AgentRuntimeService["executeAgent"]>> {
    const executedTools = result.executedTools.filter(
      (tool) => tool.name === toolName,
    );
    const blockedTool = executedTools.find((tool) => {
      if (!tool.result || typeof tool.result !== "object") {
        return false;
      }
      return (tool.result as { riskPolicyBlocked?: boolean }).riskPolicyBlocked === true;
    });
    return {
      ...result,
      executedTools,
      agentExecution: result.agentExecution
        ? {
            ...result.agentExecution,
            toolCalls: result.agentExecution.toolCalls.filter(
              (call) => call.name === toolName,
            ),
          }
        : blockedTool
          ? this.buildGovernedPendingActionExecution(toolName, executedTools)
          : undefined,
    };
  }

  private buildGovernedPendingActionExecution(
    toolName: RaiToolName,
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): NonNullable<
    Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
  > {
    const blockedTool = executedTools.find((tool) => {
      if (!tool.result || typeof tool.result !== "object") {
        return false;
      }
      return (tool.result as { riskPolicyBlocked?: boolean }).riskPolicyBlocked === true;
    });
    return {
      role: "governed_tool_path",
      status: "NEEDS_MORE_DATA",
      executionPath: "explicit_tool_path",
      structuredOutput: {
        summary: `Действие "${toolName}" ожидает подтверждения.`,
        resultType: "governed_pending_action",
        pendingActionId:
          blockedTool &&
          typeof (blockedTool.result as { actionId?: unknown }).actionId === "string"
            ? (blockedTool.result as { actionId: string }).actionId
            : undefined,
        riskPolicyBlocked: true,
      },
      toolCalls: executedTools,
      connectorCalls: [],
      evidence: [],
      validation: {
        passed: true,
        reasons: ["governed_pending_action"],
      },
      fallbackUsed: false,
      outputContractVersion: "v1",
      auditPayload: this.buildPlannerAggregateAuditPayload(executedTools),
    };
  }

  private resolvePlannerBranchAggregateStatus(
    statuses: Array<
      NonNullable<
        Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
      >["status"]
    >,
  ): "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA" | "RATE_LIMITED" {
    if (statuses.length === 0) {
      return "FAILED";
    }
    if (statuses.every((status) => status === "COMPLETED")) {
      return "COMPLETED";
    }
    if (statuses.some((status) => status === "NEEDS_MORE_DATA")) {
      return "NEEDS_MORE_DATA";
    }
    if (statuses.some((status) => status === "COMPLETED")) {
      return "NEEDS_MORE_DATA";
    }
    if (statuses.some((status) => status === "RATE_LIMITED")) {
      return "RATE_LIMITED";
    }
    return "FAILED";
  }

  private buildPlannerBranchTickSummary(
    branches: ExecutionPlanBranch[],
    summaryTrail: string[],
  ): string {
    if (summaryTrail.length === 0) {
      return `Планировщик выполнил ${branches.length} ветки.`;
    }
    if (summaryTrail.length === 1) {
      return summaryTrail[0];
    }
    return `Планировщик выполнил ${branches.length} ветки.\n${summaryTrail
      .map((summary, index) => `${index + 1}. ${summary}`)
      .join("\n")}`;
  }

  private resolveToollessPlannerBranchStatus(params: {
    branch: ExecutionPlanBranch;
    latestExecution:
      | NonNullable<
          Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>["agentExecution"]
        >
      | null;
  }): "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA" | "RATE_LIMITED" {
    const latest = params.latestExecution;
    if (!latest) {
      return "COMPLETED";
    }
    if (latest.status === "FAILED" || latest.status === "RATE_LIMITED") {
      return latest.status;
    }
    if (latest.status === "NEEDS_MORE_DATA") {
      return "NEEDS_MORE_DATA";
    }

    const structuredOutput = latest.structuredOutput ?? {};
    const runtimePayload =
      this.extractTechMapWorkflowRuntimePayload(structuredOutput);
    const data = this.pickRecord(structuredOutput, "data") ?? {};
    const hasClarifyState =
      Boolean(runtimePayload?.clarifyBatch) ||
      Boolean(runtimePayload?.workflowResumeState);
    const hasMissingContext =
      this.extractStringArray(
        structuredOutput,
        "missingContext",
        "missing_context",
        "data_gaps",
        "dataGaps",
      ).length > 0 ||
      this.extractStringArray(
        data,
        "missingContext",
        "missing_context",
        "data_gaps",
        "dataGaps",
      ).length > 0;

    if (
      params.branch.intent === "clarify_context" ||
      params.branch.branchId.includes("clarify")
    ) {
      return hasClarifyState || hasMissingContext
        ? "NEEDS_MORE_DATA"
        : "COMPLETED";
    }

    return "COMPLETED";
  }

  private buildToollessPlannerBranchSummary(
    branch: ExecutionPlanBranch,
    status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA" | "RATE_LIMITED",
  ): string {
    if (status === "NEEDS_MORE_DATA") {
      return `Ветка ${branch.branchId} ожидает добора контекста.`;
    }
    if (status === "FAILED") {
      return `Ветка ${branch.branchId} завершилась с ошибкой без runtime tool.`;
    }
    if (status === "RATE_LIMITED") {
      return `Ветка ${branch.branchId} отложена из-за rate limit.`;
    }
    return `Ветка ${branch.branchId} синхронизирована без отдельного tool call.`;
  }

  private mergeAuditPayload(
    left: AgentExecutionAuditPayload | undefined,
    right: AgentExecutionAuditPayload | undefined,
  ): AgentExecutionAuditPayload | undefined {
    if (!left && !right) {
      return undefined;
    }
    if (!left && right) {
      return {
        ...right,
        allowedToolNames: [...right.allowedToolNames],
        blockedToolNames: [...right.blockedToolNames],
        connectorNames: [...right.connectorNames],
      };
    }
    if (left && !right) {
      return left;
    }
    return {
      runtimeMode: right?.runtimeMode ?? left!.runtimeMode,
      model: right?.model ?? left!.model,
      provider: right?.provider ?? left!.provider,
      autonomyMode: right?.autonomyMode ?? left!.autonomyMode,
      allowedToolNames: this.uniqueStrings([
        ...(left?.allowedToolNames ?? []),
        ...(right?.allowedToolNames ?? []),
      ]),
      blockedToolNames: this.uniqueStrings([
        ...(left?.blockedToolNames ?? []),
        ...(right?.blockedToolNames ?? []),
      ]),
      connectorNames: this.uniqueStrings([
        ...(left?.connectorNames ?? []),
        ...(right?.connectorNames ?? []),
      ]),
      outputContractId: right?.outputContractId ?? left!.outputContractId,
    };
  }

  private buildPlannerAggregateAuditPayload(
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): AgentExecutionAuditPayload {
    return {
      runtimeMode:
        (process.env.RAI_AGENT_RUNTIME_MODE ?? "agent-first-hybrid") ===
        "agent-first-hybrid"
          ? "agent-first-hybrid"
          : "tool-first-legacy",
      autonomyMode: "advisory",
      allowedToolNames: this.uniqueStrings(
        executedTools.map((tool) => tool.name),
      ),
      blockedToolNames: [],
      connectorNames: [],
      outputContractId: "planner-aggregate-v1",
    };
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
            method: "explicit_tool_path",
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
      baselineClassification: legacyPlan.classification,
      requestedToolCalls: legacyPlan.requestedToolCalls,
      allowPrimaryPromotion: legacyPlan.semanticPrimaryAllowed,
    });

    const classification = semanticEvaluation.promotedPrimary
      ? semanticEvaluation.classification
      : legacyPlan.classification;
    const requestedToolCalls = semanticEvaluation.promotedPrimary
      ? semanticEvaluation.requestedToolCalls.length > 0
        ? semanticEvaluation.requestedToolCalls
        : legacyPlan.requestedToolCalls
      : legacyPlan.requestedToolCalls;
    const semanticIngressFrame = this.semanticIngress.buildFrame({
      request,
      baselineClassification: legacyPlan.classification,
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
        baselineClassification: legacyPlan.classification,
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

  private resolveExecutionRole(params: {
    semanticIngressFrame: SemanticIngressFrame;
    classification: {
      targetRole: string | null;
    };
  }): string {
    if (params.semanticIngressFrame.techMapFrame) {
      return params.semanticIngressFrame.requestedOperation.ownerRole ?? params.classification.targetRole ?? "agronomist";
    }
    const semanticOwnerRole = params.semanticIngressFrame.requestedOperation.ownerRole;
    if (semanticOwnerRole) {
      return semanticOwnerRole;
    }
    return params.classification.targetRole ?? "knowledge";
  }

  /** Лимит одновременных RUNNING-веток планировщика: trust.maxTrackedBranches, сжимается env `RAI_PLANNER_MAX_CONCURRENT_BRANCHES`. */
  private resolvePlannerMaxConcurrentBranches(role: string): number {
    const trust = this.runtimeGovernancePolicy.getTrustBudget(role);
    const raw = process.env.RAI_PLANNER_MAX_CONCURRENT_BRANCHES;
    if (raw === undefined || raw === "") {
      return trust.maxTrackedBranches;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) {
      return trust.maxTrackedBranches;
    }
    return Math.min(trust.maxTrackedBranches, n);
  }

  private applyTechMapWorkflowFrame(params: {
    executionResult: Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
    semanticIngressFrame: SemanticIngressFrame;
  }): Awaited<ReturnType<AgentRuntimeService["executeAgent"]>> {
    const techMapFrame = params.semanticIngressFrame.techMapFrame;
    if (!techMapFrame || !params.executionResult.agentExecution) {
      return params.executionResult;
    }

    const workflowRuntimePayload = this.extractTechMapWorkflowRuntimePayload(
      params.executionResult.agentExecution.structuredOutput,
    );
    const structuredOutputs = [
      ...(params.executionResult.agentExecution.structuredOutputs ?? []),
    ];
    if (workflowRuntimePayload) {
      structuredOutputs.push({
        ...params.executionResult.agentExecution.structuredOutput,
        techMapClarifyBatch: workflowRuntimePayload.clarifyBatch,
        techMapWorkflowResumeState: workflowRuntimePayload.workflowResumeState,
        techMapClarifyAuditTrail: workflowRuntimePayload.clarifyAuditTrail,
        techMapWorkflowSnapshot: workflowRuntimePayload.workflowSnapshot,
        techMapExecutionLoopSummary: workflowRuntimePayload.executionLoopSummary,
        techMapWorkflowExplainability:
          workflowRuntimePayload.workflowExplainability,
        techMapWorkflowOrchestration:
          workflowRuntimePayload.workflowOrchestration,
        techMapTrustSpecialization:
          workflowRuntimePayload.trustSpecialization,
      });
    }

    params.executionResult.agentExecution = {
      ...params.executionResult.agentExecution,
      structuredOutput: {
        ...params.executionResult.agentExecution.structuredOutput,
        techMapSemanticFrame: techMapFrame,
        ...(workflowRuntimePayload
          ? {
              techMapClarifyBatch: workflowRuntimePayload.clarifyBatch,
              techMapWorkflowResumeState: workflowRuntimePayload.workflowResumeState,
              techMapClarifyAuditTrail: workflowRuntimePayload.clarifyAuditTrail,
              techMapWorkflowSnapshot: workflowRuntimePayload.workflowSnapshot,
              techMapExecutionLoopSummary:
                workflowRuntimePayload.executionLoopSummary,
              techMapWorkflowExplainability:
                workflowRuntimePayload.workflowExplainability,
              techMapWorkflowOrchestration:
                workflowRuntimePayload.workflowOrchestration,
              techMapTrustSpecialization:
                workflowRuntimePayload.trustSpecialization,
            }
          : {}),
      },
      structuredOutputs:
        structuredOutputs.length > 0 ? structuredOutputs : undefined,
    };

    return params.executionResult;
  }

  private extractTechMapWorkflowRuntimePayload(
    structuredOutput: Record<string, unknown>,
  ): {
    clarifyBatch: Record<string, unknown> | null;
    workflowResumeState: Record<string, unknown> | null;
    clarifyAuditTrail: Record<string, unknown>[] | null;
    workflowSnapshot: Record<string, unknown> | null;
    executionLoopSummary: Record<string, unknown> | null;
    workflowExplainability: Record<string, unknown> | null;
    workflowOrchestration: Record<string, unknown> | null;
    trustSpecialization: Record<string, unknown> | null;
  } | null {
    const data =
      structuredOutput && typeof structuredOutput.data === "object"
        ? (structuredOutput.data as Record<string, unknown>)
        : null;
    const clarifyBatch = this.extractObject(data?.clarifyBatch ?? structuredOutput.clarifyBatch);
    const workflowResumeState = this.extractObject(
      data?.workflowResumeState ?? structuredOutput.workflowResumeState,
    );
    const clarifyAuditTrail = this.extractObjectArray(
      data?.clarifyAuditTrail ?? structuredOutput.clarifyAuditTrail,
    );
    const workflowSnapshot = this.extractObject(
      data?.workflowSnapshot ??
        data?.workflow_snapshot ??
        structuredOutput.workflowSnapshot ??
        structuredOutput.workflow_snapshot,
    );
    const executionLoopSummary = this.extractObject(
      data?.executionLoopSummary ??
        data?.execution_loop_summary ??
        structuredOutput.executionLoopSummary ??
        structuredOutput.execution_loop_summary,
    );
    const workflowExplainability = this.extractObject(
      data?.workflowExplainability ??
        data?.workflow_explainability ??
        structuredOutput.workflowExplainability ??
        structuredOutput.workflow_explainability,
    );
    const workflowOrchestration = this.extractObject(
      data?.workflowOrchestration ??
        data?.workflow_orchestration ??
        structuredOutput.workflowOrchestration ??
        structuredOutput.workflow_orchestration,
    );
    const trustSpecialization = this.extractObject(
      data?.trustSpecialization ??
        data?.trust_specialization ??
        structuredOutput.trustSpecialization ??
        structuredOutput.trust_specialization,
    );

    if (
      !clarifyBatch &&
      !workflowResumeState &&
      !clarifyAuditTrail &&
      !workflowSnapshot &&
      !executionLoopSummary &&
      !workflowExplainability &&
      !workflowOrchestration &&
      !trustSpecialization
    ) {
      return null;
    }

    return {
      clarifyBatch,
      workflowResumeState,
      clarifyAuditTrail,
      workflowSnapshot,
      executionLoopSummary,
      workflowExplainability,
      workflowOrchestration,
      trustSpecialization,
    };
  }

  private extractObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private extractObjectArray(value: unknown): Record<string, unknown>[] | null {
    return Array.isArray(value)
      ? value.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item),
        )
      : null;
  }

  private async maybeApplyPlannerMutationResume(
    request: RaiChatRequestDto,
    companyId: string,
    surface: ExecutionSurfaceState,
  ): Promise<ExecutionSurfaceState> {
    const blockedWithPa = surface.branches.filter(
      (b) =>
        b.lifecycle === "BLOCKED_ON_CONFIRMATION" &&
        b.mutationState === "PENDING" &&
        typeof b.pendingActionId === "string" &&
        b.pendingActionId.length > 0,
    );
    if (blockedWithPa.length > 0) {
      const id = request.executionPlannerApprovedPendingActionId?.trim();
      if (!id) {
        this.logger.warn(
          "executionPlannerMutationApproved без executionPlannerApprovedPendingActionId при pendingActionId в поверхности",
        );
        return surface;
      }
      if (!blockedWithPa.some((b) => b.pendingActionId === id)) {
        this.logger.warn(
          "executionPlannerApprovedPendingActionId не совпадает с ветками BLOCKED",
        );
        return surface;
      }
      try {
        await this.pendingActionService.assertApprovedFinalForPlannerResume(
          id,
          companyId,
        );
      } catch (e) {
        this.logger.warn(
          `assertApprovedFinalForPlannerResume: ${String((e as Error)?.message ?? e)}`,
        );
        return surface;
      }
      return applyPlannerMutationApprovalToSurface(surface, id);
    }
    return applyPlannerMutationApprovalToSurface(surface);
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
