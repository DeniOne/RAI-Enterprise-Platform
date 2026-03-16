import { Injectable, Logger } from "@nestjs/common";
import { RuntimeGovernanceEventType, SystemIncidentType } from "@rai/prisma-client";
import { RaiToolCallDto, RuntimeGovernanceDto } from "../dto/rai-chat.dto";
import { RaiToolActorContext, RaiToolName } from "../tools/rai-tools.types";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { buildExecutionBatches, planByToolCalls } from "./tool-call.planner";
import { RiskPolicyBlockedError } from "../../../shared/rai-chat/security/risk-policy-blocked.error";
import { PerformanceMetricsService } from "../performance/performance-metrics.service";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { AgentConfigBlockedError } from "../../../shared/rai-chat/security/agent-config-blocked.error";
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
import { RuntimeGovernanceControlService } from "./runtime-governance-control.service";

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
    private readonly governanceControl: RuntimeGovernanceControlService,
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
      const runtimeGovernance = this.governanceControl.buildGovernanceMeta(
        request.role,
        "NO_INTENT_OWNER",
        true,
      );
      await this.governanceControl.recordGovernanceEvent({
        companyId: actorContext.companyId,
        traceId: request.traceId,
        agentRole: request.role,
        eventType: RuntimeGovernanceEventType.FALLBACK_USED,
        runtimeGovernance,
        metadata: {
          reason: "agent_unavailable",
        },
      });
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
      const runtimeGovernance = this.governanceControl.buildGovernanceMeta(
        request.role,
        budgetDecision.fallbackReason ?? "BUDGET_DENIED",
        true,
        undefined,
        runtimeOverrides,
      );
      await this.governanceControl.recordGovernanceEvent({
        companyId: actorContext.companyId,
        traceId: request.traceId,
        agentRole: request.role,
        eventType: RuntimeGovernanceEventType.BUDGET_DENIED,
        runtimeGovernance,
        metadata: {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      });
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
      await this.governanceControl.recordGovernanceEvent({
        companyId: actorContext.companyId,
        traceId: request.traceId,
        agentRole: request.role,
        eventType: RuntimeGovernanceEventType.BUDGET_DEGRADED,
        runtimeGovernance: this.governanceControl.buildGovernanceMeta(
          request.role,
          budgetDecision.fallbackReason ?? "BUDGET_DEGRADED",
          true,
          undefined,
          runtimeOverrides,
        ),
        metadata: {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      });
    }

    const execution = await this.dispatchAgent(
      request,
      actorContext,
      kernel,
      requestedToolCalls,
      budgetDecision,
    );

    if (execution.status === "NEEDS_MORE_DATA") {
      const runtimeGovernance = this.governanceControl.buildGovernanceMeta(
        request.role,
        "NEEDS_MORE_DATA",
        true,
        undefined,
        runtimeOverrides,
      );
      execution.runtimeGovernance = runtimeGovernance;
      await this.governanceControl.recordGovernanceEvent({
        companyId: actorContext.companyId,
        traceId: request.traceId,
        agentRole: request.role,
        eventType: RuntimeGovernanceEventType.NEEDS_MORE_DATA,
        runtimeGovernance,
        metadata: {
          validation: execution.validation,
        },
      });
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
          ? this.governanceControl.buildGovernanceMeta(
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
      const runtimeGovernance = this.governanceControl.buildGovernanceMeta(
        params.actorContext.agentRole,
        budgetDecision.fallbackReason ?? "BUDGET_DENIED",
        true,
      );
      await this.governanceControl.recordGovernanceEvent({
        companyId: params.actorContext.companyId,
        traceId: params.actorContext.traceId,
        agentRole: params.actorContext.agentRole,
        eventType: RuntimeGovernanceEventType.BUDGET_DENIED,
        runtimeGovernance,
        metadata: {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      });
      return { executedTools: [], runtimeBudget: budgetDecision, runtimeGovernance };
    }

    const budgetGovernance =
      budgetDecision.outcome === "DEGRADE"
        ? this.governanceControl.buildGovernanceMeta(
            params.actorContext.agentRole,
            budgetDecision.fallbackReason ?? "BUDGET_DEGRADED",
            true,
          )
        : undefined;
    if (budgetDecision.outcome === "DEGRADE" && budgetGovernance) {
      await this.governanceControl.recordGovernanceEvent({
        companyId: params.actorContext.companyId,
        traceId: params.actorContext.traceId,
        agentRole: params.actorContext.agentRole,
        eventType: RuntimeGovernanceEventType.BUDGET_DEGRADED,
        runtimeGovernance: budgetGovernance,
        metadata: {
          estimatedTokens: budgetDecision.estimatedTokens,
          budgetLimit: budgetDecision.budgetLimit,
          droppedToolNames: budgetDecision.droppedToolNames,
        },
      });
    }

    const allowedToolCalls =
      budgetDecision.outcome === "DEGRADE"
        ? this.governanceControl.filterAllowedToolCalls(
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
    const rolePolicy = this.governanceControl.getRolePolicy(
      params.actorContext.agentRole,
    );
    const concurrencyEnvelope = await this.governanceControl.resolveConcurrencyEnvelope(
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
      if (effectivePlan.contracts.some((call) => call.name === name)) return "ContractsAgent";
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
          void this.governanceControl.recordToolFailure({
            companyId: params.actorContext.companyId,
            traceId: params.actorContext.traceId,
            agentRole: params.actorContext.agentRole ?? agentRole,
            toolName: call.name,
            message: String((err as Error)?.message ?? err),
          });
          return toEntry(call.name, {
            toolExecutionError: true,
            code: (err as { name?: string })?.name ?? "TOOL_EXECUTION_ERROR",
            message: String((err as Error)?.message ?? err),
          });
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
          this.governanceControl.resolveRuntimeGovernanceFromResults(
            params.actorContext.agentRole,
            executedTools,
          ) ?? budgetGovernance,
      };
    } catch (err) {
      void this.performanceMetrics.recordError(
        params.actorContext.companyId,
        "RuntimeAgent",
      );
      const runtimeGovernance = this.governanceControl.buildGovernanceMeta(
        params.actorContext.agentRole,
        "DEADLINE_EXCEEDED",
        true,
      );
      await this.governanceControl.recordGovernanceEvent({
        companyId: params.actorContext.companyId,
        traceId: params.actorContext.traceId,
        agentRole: params.actorContext.agentRole,
        eventType: RuntimeGovernanceEventType.FALLBACK_USED,
        runtimeGovernance,
        metadata: {
          message: String((err as Error)?.message ?? err),
          partialToolCount: partial.length,
        },
      });
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
      runtimeGovernance: this.governanceControl.buildGovernanceMeta(
        role,
        "NO_INTENT_OWNER",
        true,
      ),
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
}
