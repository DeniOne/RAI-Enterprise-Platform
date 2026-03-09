import { Injectable, Logger } from "@nestjs/common";
import { RuntimeGovernanceEventType, SystemIncidentType } from "@rai/prisma-client";
import { RaiToolCallDto, RuntimeGovernanceDto } from "../dto/rai-chat.dto";
import { RaiToolActorContext, RaiToolName } from "../tools/rai-tools.types";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { buildExecutionBatches, planByToolCalls } from "./tool-call.planner";
import { RiskPolicyBlockedError } from "../security/risk-policy-blocked.error";
import { PerformanceMetricsService } from "../performance/performance-metrics.service";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { AgentConfigBlockedError } from "../security/agent-config-blocked.error";
import {
  BudgetControllerService,
  RuntimeBudgetDecision,
} from "../security/budget-controller.service";
import { IncidentOpsService } from "../incident-ops.service";
import { AgentRuntimeConfigService } from "../agent-runtime-config.service";
import {
  AgentExecutionRequest,
  AgentExecutionResult,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";
import { AgentExecutionAdapterService } from "./agent-execution-adapter.service";
import { RuntimeGovernanceEventService } from "../runtime-governance/runtime-governance-event.service";
import { RuntimeGovernancePolicyService } from "../runtime-governance/runtime-governance-policy.service";
import {
  FallbackReason,
  RuntimeConcurrencyEnvelope,
  RuntimeGovernanceOverrides,
  RuntimeGovernanceRolePolicy,
} from "../runtime-governance/runtime-governance-policy.types";

export interface ExecutionResult {
  executedTools: Array<{ name: RaiToolName; result: unknown }>;
  runtimeBudget?: RuntimeBudgetDecision;
  agentExecution?: AgentExecutionResult;
  runtimeGovernance?: RuntimeGovernanceDto;
}

export interface RunParams {
  requestedToolCalls: RaiToolCallDto[];
  actorContext: RaiToolActorContext;
}

@Injectable()
export class AgentRuntimeService {
  private readonly logger = new Logger(AgentRuntimeService.name);

  constructor(
    private readonly toolsRegistry: RaiToolsRegistry,
    private readonly performanceMetrics: PerformanceMetricsService,
    private readonly queueMetrics: QueueMetricsService,
    private readonly budgetController: BudgetControllerService,
    private readonly incidentOps: IncidentOpsService,
    private readonly agentRuntimeConfig: AgentRuntimeConfigService,
    private readonly executionAdapter: AgentExecutionAdapterService,
    private readonly governanceEvents: RuntimeGovernanceEventService,
    private readonly runtimeGovernancePolicy: RuntimeGovernancePolicyService,
  ) {}

  async executeAgent(
    request: AgentExecutionRequest,
    actorContext: RaiToolActorContext,
  ): Promise<ExecutionResult> {
    const runtimeMode = process.env.RAI_AGENT_RUNTIME_MODE ?? "tool-first-legacy";
    if (runtimeMode !== "agent-first-hybrid") {
      return this.run({
        requestedToolCalls: request.requestedTools ?? [],
        actorContext,
      });
    }

    const kernel = await this.agentRuntimeConfig.getEffectiveKernel(
      actorContext.companyId,
      request.role,
    );
    if (!kernel || !kernel.isActive) {
      const runtimeGovernance = this.buildGovernanceMeta(
        request.role,
        "NO_INTENT_OWNER",
        true,
      );
      await this.recordGovernanceEvent(
        actorContext.companyId,
        request.traceId,
        request.role,
        RuntimeGovernanceEventType.FALLBACK_USED,
        runtimeGovernance,
        {
          reason: "agent_unavailable",
        },
      );
      return {
        executedTools: [],
        agentExecution: this.buildUnavailableResult(request.role, kernel),
        runtimeGovernance,
      };
    }

    const requestedToolCalls = this.filterRequestedToolsByKernel(
      request.requestedTools ?? [],
      kernel,
    );
    const runtimeOverrides = kernel.governancePolicy?.runtimeGovernanceOverrides;
    const budgetDecision = await this.budgetController.evaluateRuntimeBudget(
      requestedToolCalls,
      actorContext,
    );
    if (budgetDecision.outcome === "DENY") {
      const runtimeGovernance = this.buildGovernanceMeta(
        request.role,
        budgetDecision.fallbackReason ?? "BUDGET_DENIED",
        true,
        undefined,
        runtimeOverrides,
      );
      await this.recordGovernanceEvent(
        actorContext.companyId,
        request.traceId,
        request.role,
        RuntimeGovernanceEventType.BUDGET_DENIED,
        runtimeGovernance,
        {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      );
      return {
        executedTools: [],
        runtimeBudget: budgetDecision,
        runtimeGovernance,
        agentExecution: {
          ...this.buildUnavailableResult(request.role, kernel),
          text: "Выполнение отклонено budget policy.",
          runtimeBudget: budgetDecision,
          runtimeGovernance,
        },
      };
    }

    if (budgetDecision.outcome === "DEGRADE") {
      await this.recordGovernanceEvent(
        actorContext.companyId,
        request.traceId,
        request.role,
        RuntimeGovernanceEventType.BUDGET_DEGRADED,
        this.buildGovernanceMeta(
          request.role,
          budgetDecision.fallbackReason ?? "BUDGET_DEGRADED",
          true,
          undefined,
          runtimeOverrides,
        ),
        {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      );
    }

    const execution = await this.dispatchAgent(
      request,
      actorContext,
      kernel,
      requestedToolCalls,
      budgetDecision,
    );

    if (execution.status === "NEEDS_MORE_DATA") {
      const runtimeGovernance = this.buildGovernanceMeta(
        request.role,
        "NEEDS_MORE_DATA",
        true,
        undefined,
        runtimeOverrides,
      );
      execution.runtimeGovernance = runtimeGovernance;
      await this.recordGovernanceEvent(
        actorContext.companyId,
        request.traceId,
        request.role,
        RuntimeGovernanceEventType.NEEDS_MORE_DATA,
        runtimeGovernance,
        {
          validation: execution.validation,
        },
      );
    }

    return {
      executedTools: execution.toolCalls.map((tool) => ({
        name: tool.name as RaiToolName,
        result: tool.result,
      })),
      runtimeBudget: budgetDecision,
      agentExecution: execution,
      runtimeGovernance:
        execution.runtimeGovernance ??
        (budgetDecision.outcome === "DEGRADE"
          ? this.buildGovernanceMeta(
              request.role,
              budgetDecision.fallbackReason ?? "BUDGET_DEGRADED",
              true,
              undefined,
              runtimeOverrides,
            )
          : undefined),
    };
  }

  async run(params: RunParams): Promise<ExecutionResult> {
    const budgetDecision = await this.budgetController.evaluateRuntimeBudget(
      params.requestedToolCalls,
      params.actorContext,
    );
    if (budgetDecision.outcome !== "ALLOW") {
      this.incidentOps.logIncident({
        companyId: params.actorContext.companyId,
        traceId: params.actorContext.traceId,
        incidentType: SystemIncidentType.UNKNOWN,
        severity: budgetDecision.outcome === "DENY" ? "HIGH" : "MEDIUM",
        details: {
          subtype:
            budgetDecision.outcome === "DENY"
              ? "BUDGET_RUNTIME_DENIED"
              : "BUDGET_RUNTIME_DEGRADED",
          reason: budgetDecision.reason,
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          allowedToolNames: budgetDecision.allowedToolNames,
          droppedToolNames: budgetDecision.droppedToolNames,
          ownerRoles: budgetDecision.ownerRoles,
        },
      });
    }
    if (budgetDecision.outcome === "DENY") {
      const runtimeGovernance = this.buildGovernanceMeta(
        params.actorContext.agentRole,
        budgetDecision.fallbackReason ?? "BUDGET_DENIED",
        true,
      );
      await this.recordGovernanceEvent(
        params.actorContext.companyId,
        params.actorContext.traceId,
        params.actorContext.agentRole,
        RuntimeGovernanceEventType.BUDGET_DENIED,
        runtimeGovernance,
        {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      );
      return { executedTools: [], runtimeBudget: budgetDecision, runtimeGovernance };
    }

    const budgetGovernance =
      budgetDecision.outcome === "DEGRADE"
        ? this.buildGovernanceMeta(
            params.actorContext.agentRole,
            budgetDecision.fallbackReason ?? "BUDGET_DEGRADED",
            true,
          )
        : undefined;
    if (budgetDecision.outcome === "DEGRADE" && budgetGovernance) {
      await this.recordGovernanceEvent(
        params.actorContext.companyId,
        params.actorContext.traceId,
        params.actorContext.agentRole,
        RuntimeGovernanceEventType.BUDGET_DEGRADED,
        budgetGovernance,
        {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      );
    }

    const allowedToolCalls =
      budgetDecision.outcome === "DEGRADE"
        ? this.filterAllowedToolCalls(
            params.requestedToolCalls,
            budgetDecision.allowedToolNames,
          )
        : params.requestedToolCalls;
    await this.queueMetrics.beginRuntimeExecution(
      params.actorContext.companyId,
      allowedToolCalls.length,
    );
    const partial: Array<{ name: RaiToolName; result: unknown }> = [];
    const effectivePlan = planByToolCalls(allowedToolCalls);
    const rolePolicy = this.runtimeGovernancePolicy.getRolePolicy(
      params.actorContext.agentRole,
    );
    const concurrencyEnvelope = await this.resolveConcurrencyEnvelope(
      params.actorContext.companyId,
      params.actorContext.traceId,
      params.actorContext.agentRole,
      rolePolicy,
    );

    const toEntry = (name: RaiToolName, result: unknown) => {
      const entry = { name, result };
      partial.push(entry);
      return entry;
    };
    const resolveAgentRole = (name: RaiToolName): string => {
      if (effectivePlan.agronom.some((call) => call.name === name)) return "AgronomAgent";
      if (effectivePlan.economist.some((call) => call.name === name)) return "EconomistAgent";
      if (effectivePlan.knowledge.some((call) => call.name === name)) return "KnowledgeAgent";
      if (effectivePlan.crm.some((call) => call.name === name)) return "CrmAgent";
      if (effectivePlan.frontOffice.some((call) => call.name === name)) return "FrontOfficeAgent";
      return "RuntimeAgent";
    };
    const runOne = (call: { name: RaiToolName; payload: Record<string, unknown> }) => {
      const startedAt = Date.now();
      const agentRole = resolveAgentRole(call.name);
      return this.toolsRegistry
        .execute(call.name, call.payload, params.actorContext)
        .then(async (result) => {
          await this.performanceMetrics.recordLatency(
            params.actorContext.companyId,
            Date.now() - startedAt,
            agentRole,
            call.name,
          );
          return toEntry(call.name, result);
        })
        .catch((err) => {
          if (err instanceof AgentConfigBlockedError) {
            return toEntry(call.name, {
              agentConfigBlocked: true,
              reasonCode: err.reasonCode,
              message: err.message,
            });
          }
          if (err instanceof RiskPolicyBlockedError) {
            return toEntry(call.name, {
              riskPolicyBlocked: true,
              actionId: err.actionId,
              message: err.message,
            });
          }
          void this.performanceMetrics.recordError(
            params.actorContext.companyId,
            agentRole,
            call.name,
          );
          void this.governanceEvents.record({
            companyId: params.actorContext.companyId,
            traceId: params.actorContext.traceId,
            agentRole: params.actorContext.agentRole ?? agentRole,
            toolName: call.name,
            eventType: RuntimeGovernanceEventType.TOOL_FAILURE,
            fallbackReason: "TOOL_FAILURE",
            fallbackMode: this.runtimeGovernancePolicy.resolveFallbackMode(
              params.actorContext.agentRole ?? agentRole,
              "TOOL_FAILURE",
            ),
            metadata: {
              message: String((err as Error)?.message ?? err),
            },
          });
          throw err;
        });
    };

    const executionBatches = buildExecutionBatches(
      effectivePlan,
      concurrencyEnvelope,
    );
    let timeoutHandle: NodeJS.Timeout | null = null;
    const deadlineMs = concurrencyEnvelope.deadlineMs;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error("AGENT_RUNTIME_DEADLINE_EXCEEDED")),
        deadlineMs,
      );
    });

    try {
      const executeBatches = async () => {
        const executedTools: Array<{ name: RaiToolName; result: unknown }> = [];
        for (const batch of executionBatches) {
          const settled = await Promise.allSettled(batch.map((call) => runOne(call)));
          executedTools.push(
            ...settled
              .filter(
                (
                  entry,
                ): entry is PromiseFulfilledResult<{ name: RaiToolName; result: unknown }> =>
                  entry.status === "fulfilled",
              )
              .map((entry) => entry.value),
          );
        }
        return executedTools;
      };
      const settled = await Promise.race([
        executeBatches(),
        timeoutPromise,
      ]);
      const executedTools = settled as Array<{ name: RaiToolName; result: unknown }>;
      return {
        executedTools,
        runtimeBudget: budgetDecision,
        runtimeGovernance:
          this.resolveRuntimeGovernanceFromResults(
            params.actorContext.agentRole,
            executedTools,
          ) ?? budgetGovernance,
      };
    } catch (err) {
      void this.performanceMetrics.recordError(
        params.actorContext.companyId,
        "RuntimeAgent",
      );
      const runtimeGovernance = this.buildGovernanceMeta(
        params.actorContext.agentRole,
        "DEADLINE_EXCEEDED",
        true,
      );
      await this.recordGovernanceEvent(
        params.actorContext.companyId,
        params.actorContext.traceId,
        params.actorContext.agentRole,
        RuntimeGovernanceEventType.FALLBACK_USED,
        runtimeGovernance,
        {
          message: String((err as Error)?.message ?? err),
          partialToolCount: partial.length,
        },
      );
      this.logger.warn(
        `agent_runtime deadline or error companyId=${params.actorContext.companyId} traceId=${params.actorContext.traceId} message=${String((err as Error)?.message ?? err)}`,
      );
      return {
        executedTools: partial,
        runtimeBudget: budgetDecision,
        runtimeGovernance,
      };
    } finally {
      await this.queueMetrics.endRuntimeExecution(
        params.actorContext.companyId,
        allowedToolCalls.length,
      );
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async dispatchAgent(
    request: AgentExecutionRequest,
    actorContext: RaiToolActorContext,
    kernel: EffectiveAgentKernelEntry,
    allowedToolCalls: RaiToolCallDto[],
    budgetDecision: RuntimeBudgetDecision,
  ): Promise<AgentExecutionResult> {
    return this.executionAdapter.execute({
      request,
      actorContext,
      kernel,
      allowedToolCalls,
      budgetDecision,
    });
  }

  private buildUnavailableResult(
    role: string,
    kernel: EffectiveAgentKernelEntry | null,
  ): AgentExecutionResult {
    return {
      role,
      status: "FAILED",
      text: `Agent ${role} unavailable.`,
      structuredOutput: {},
      toolCalls: [],
      connectorCalls: [],
      evidence: [],
      validation: { passed: false, reasons: ["agent_unavailable"] },
      runtimeGovernance: this.buildGovernanceMeta(role, "NO_INTENT_OWNER", true),
      fallbackUsed: true,
      outputContractVersion: kernel?.outputContract.responseSchemaVersion ?? "v1",
      auditPayload: {
        runtimeMode: "agent-first-hybrid",
        autonomyMode: kernel?.definition.defaultAutonomyMode ?? "advisory",
        allowedToolNames: [],
        blockedToolNames: [],
        connectorNames: [],
        outputContractId: kernel?.outputContract.contractId ?? "unknown",
      },
    };
  }

  private filterRequestedToolsByKernel(
    requestedToolCalls: RaiToolCallDto[],
    kernel: EffectiveAgentKernelEntry,
  ): RaiToolCallDto[] {
    const allowed = new Set(
      kernel.toolBindings
        .filter((binding) => binding.isEnabled)
        .map((binding) => binding.toolName),
    );
    return requestedToolCalls.filter((call) => allowed.has(call.name));
  }

  private filterAllowedToolCalls(
    requestedToolCalls: RaiToolCallDto[],
    allowedToolNames: RaiToolName[],
  ): RaiToolCallDto[] {
    const remaining = new Map<RaiToolName, number>();
    for (const toolName of allowedToolNames) {
      remaining.set(toolName, (remaining.get(toolName) ?? 0) + 1);
    }

    return requestedToolCalls.filter((call) => {
      const left = remaining.get(call.name) ?? 0;
      if (left <= 0) {
        return false;
      }
      remaining.set(call.name, left - 1);
      return true;
    });
  }

  private resolveRuntimeGovernanceFromResults(
    agentRole: string | undefined,
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): RuntimeGovernanceDto | undefined {
    const blocked = executedTools.find(
      (tool) =>
        Boolean(
          tool.result &&
            typeof tool.result === "object" &&
            ((tool.result as { riskPolicyBlocked?: boolean }).riskPolicyBlocked === true ||
              (tool.result as { agentConfigBlocked?: boolean }).agentConfigBlocked === true),
        ),
    );
    if (blocked) {
      return this.buildGovernanceMeta(agentRole, "POLICY_BLOCKED", true);
    }

    const needsMoreData = executedTools.find(
      (tool) =>
        Boolean(
          tool.result &&
            typeof tool.result === "object" &&
            (tool.result as { status?: string }).status === "NEEDS_MORE_DATA",
        ),
    );
    if (needsMoreData) {
      return this.buildGovernanceMeta(agentRole, "NEEDS_MORE_DATA", true);
    }

    return undefined;
  }

  private buildGovernanceMeta(
    agentRole: string | undefined,
    fallbackReason: FallbackReason,
    degraded: boolean,
    recommendation?: string,
    overrides?: RuntimeGovernanceOverrides | null,
  ): RuntimeGovernanceDto {
    return {
      fallbackReason,
      fallbackMode: this.runtimeGovernancePolicy.resolveFallbackMode(
        agentRole,
        fallbackReason,
        overrides,
      ),
      degraded,
      recommendation,
    };
  }

  private async resolveConcurrencyEnvelope(
    companyId: string,
    traceId: string,
    agentRole: string | undefined,
    rolePolicy: RuntimeGovernanceRolePolicy,
  ): Promise<RuntimeConcurrencyEnvelope> {
    const queuePressure = await this.queueMetrics.getQueuePressure(
      companyId,
      5 * 60 * 1000,
    );
    if (
      this.isQueuePressureExceeded(
        queuePressure.pressureState,
        rolePolicy.thresholds.queueSaturationThreshold,
      )
    ) {
      await this.governanceEvents.record({
        companyId,
        traceId,
        agentRole,
        eventType: RuntimeGovernanceEventType.QUEUE_SATURATION_DETECTED,
        metadata: {
          pressureState: queuePressure.pressureState,
          hottestQueue: queuePressure.hottestQueue,
          totalBacklog: queuePressure.totalBacklog,
          degradedEnvelope: true,
        },
      });
      return {
        maxParallelToolCalls: Math.max(
          1,
          Math.floor(rolePolicy.concurrency.maxParallelToolCalls / 2),
        ),
        maxParallelGroups: Math.max(
          1,
          Math.floor(rolePolicy.concurrency.maxParallelGroups / 2),
        ),
        deadlineMs: rolePolicy.concurrency.deadlineMs,
      };
    }
    return rolePolicy.concurrency;
  }

  private isQueuePressureExceeded(
    pressureState: "IDLE" | "STABLE" | "PRESSURED" | "SATURATED" | null,
    threshold: "PRESSURED" | "SATURATED",
  ): boolean {
    if (!pressureState) {
      return false;
    }
    const order = {
      IDLE: 0,
      STABLE: 1,
      PRESSURED: 2,
      SATURATED: 3,
    } as const;
    return order[pressureState] >= order[threshold];
  }

  private async recordGovernanceEvent(
    companyId: string,
    traceId: string,
    agentRole: string | undefined,
    eventType: RuntimeGovernanceEventType,
    runtimeGovernance: RuntimeGovernanceDto,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.governanceEvents.record({
      companyId,
      traceId,
      agentRole,
      eventType,
      fallbackReason: runtimeGovernance.fallbackReason as FallbackReason,
      fallbackMode: runtimeGovernance.fallbackMode as never,
      recommendationType: (runtimeGovernance.recommendation as never) ?? null,
      metadata,
    });
  }
}
