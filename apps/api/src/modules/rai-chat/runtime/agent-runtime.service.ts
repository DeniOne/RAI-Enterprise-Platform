import { Injectable, Logger } from "@nestjs/common";
import { RaiToolCallDto } from "../dto/rai-chat.dto";
import {
  RaiToolActorContext,
  RaiToolName,
} from "../tools/rai-tools.types";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { planByToolCalls } from "./tool-call.planner";
import { RiskPolicyBlockedError } from "../security/risk-policy-blocked.error";
import { PerformanceMetricsService } from "../performance/performance-metrics.service";
import { AgentConfigBlockedError } from "../security/agent-config-blocked.error";

export interface ExecutionResult {
  executedTools: Array<{ name: RaiToolName; result: unknown }>;
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
  ) {}

  async run(params: RunParams): Promise<ExecutionResult> {
    const plan = planByToolCalls(params.requestedToolCalls);
    const partial: Array<{ name: RaiToolName; result: unknown }> = [];

    const toEntry = (name: RaiToolName, result: unknown) => {
      const entry = { name, result };
      partial.push(entry);
      return entry;
    };
    const resolveAgentRole = (name: RaiToolName): string => {
      if (plan.agronom.some((call) => call.name === name)) return "AgronomAgent";
      if (plan.economist.some((call) => call.name === name)) return "EconomistAgent";
      if (plan.knowledge.some((call) => call.name === name)) return "KnowledgeAgent";
      return "RuntimeAgent";
    };
    const runOne = (call: { name: RaiToolName; payload: Record<string, unknown> }) =>
      {
        const startedAt = Date.now();
        const agentRole = resolveAgentRole(call.name);
        return this.toolsRegistry
        .execute(call.name, call.payload, params.actorContext)
        .then(async (r) => {
          await this.performanceMetrics.recordLatency(
            params.actorContext.companyId,
            Date.now() - startedAt,
            agentRole,
            call.name,
          );
          return toEntry(call.name, r);
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

    const agronomPromises = plan.agronom.map((call) => runOne(call));
    const economistPromises = plan.economist.map((call) => runOne(call));
    const knowledgePromises = plan.knowledge.map((call) => runOne(call));
    const otherPromises = plan.other.map((call) => runOne(call));

    const allPromises = [...agronomPromises, ...economistPromises, ...knowledgePromises, ...otherPromises];
    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) =>
      {
        timeoutHandle = setTimeout(
        () => reject(new Error("AGENT_RUNTIME_DEADLINE_EXCEEDED")),
        AGENT_DEADLINE_MS,
        );
      },
    );

    try {
      const settled = await Promise.race([
        Promise.allSettled(allPromises),
        timeoutPromise,
      ]);
      const executedTools = (settled as PromiseSettledResult<{ name: RaiToolName; result: unknown }>[])
        .filter((s): s is PromiseFulfilledResult<{ name: RaiToolName; result: unknown }> => s.status === "fulfilled")
        .map((s) => s.value);
      return { executedTools };
    } catch (err) {
      void this.performanceMetrics.recordError(
        params.actorContext.companyId,
        "RuntimeAgent",
      );
      this.logger.warn(
        `agent_runtime deadline or error companyId=${params.actorContext.companyId} traceId=${params.actorContext.traceId} message=${String((err as Error)?.message ?? err)}`,
      );
      return { executedTools: partial };
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
