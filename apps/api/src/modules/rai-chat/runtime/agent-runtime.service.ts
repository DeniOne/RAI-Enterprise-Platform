import { Injectable, Logger } from "@nestjs/common";
import { SystemIncidentType } from "@rai/prisma-client";
import { RaiToolCallDto } from "../dto/rai-chat.dto";
import { RaiToolActorContext, RaiToolName } from "../tools/rai-tools.types";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { planByToolCalls } from "./tool-call.planner";
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

export interface ExecutionResult {
  executedTools: Array<{ name: RaiToolName; result: unknown }>;
  runtimeBudget?: RuntimeBudgetDecision;
  agentExecution?: AgentExecutionResult;
}

const AGENT_DEADLINE_MS = 30_000;

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
      return {
        executedTools: [],
        agentExecution: this.buildUnavailableResult(request.role, kernel),
      };
    }

    const requestedToolCalls = this.filterRequestedToolsByKernel(
      request.requestedTools ?? [],
      kernel,
    );
    const budgetDecision = await this.budgetController.evaluateRuntimeBudget(
      requestedToolCalls,
      actorContext,
    );
    if (budgetDecision.outcome === "DENY") {
      return {
        executedTools: [],
        runtimeBudget: budgetDecision,
        agentExecution: {
          ...this.buildUnavailableResult(request.role, kernel),
          text: "Выполнение отклонено budget policy.",
          runtimeBudget: budgetDecision,
        },
      };
    }

    const execution = await this.dispatchAgent(
      request,
      actorContext,
      kernel,
      requestedToolCalls,
      budgetDecision,
    );

    return {
      executedTools: execution.toolCalls.map((tool) => ({
        name: tool.name as RaiToolName,
        result: tool.result,
      })),
      runtimeBudget: budgetDecision,
      agentExecution: execution,
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
      return { executedTools: [], runtimeBudget: budgetDecision };
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
          throw err;
        });
    };

    const allPromises = [
      ...effectivePlan.agronom.map((call) => runOne(call)),
      ...effectivePlan.economist.map((call) => runOne(call)),
      ...effectivePlan.knowledge.map((call) => runOne(call)),
      ...effectivePlan.crm.map((call) => runOne(call)),
      ...effectivePlan.other.map((call) => runOne(call)),
    ];
    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error("AGENT_RUNTIME_DEADLINE_EXCEEDED")),
        AGENT_DEADLINE_MS,
      );
    });

    try {
      const settled = await Promise.race([
        Promise.allSettled(allPromises),
        timeoutPromise,
      ]);
      const executedTools = (
        settled as PromiseSettledResult<{ name: RaiToolName; result: unknown }>[]
      )
        .filter(
          (
            entry,
          ): entry is PromiseFulfilledResult<{ name: RaiToolName; result: unknown }> =>
            entry.status === "fulfilled",
        )
        .map((entry) => entry.value);
      return { executedTools, runtimeBudget: budgetDecision };
    } catch (err) {
      void this.performanceMetrics.recordError(
        params.actorContext.companyId,
        "RuntimeAgent",
      );
      this.logger.warn(
        `agent_runtime deadline or error companyId=${params.actorContext.companyId} traceId=${params.actorContext.traceId} message=${String((err as Error)?.message ?? err)}`,
      );
      return { executedTools: partial, runtimeBudget: budgetDecision };
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

}
