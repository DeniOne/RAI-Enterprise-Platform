import { Injectable, Logger } from "@nestjs/common";
import { RaiToolCallDto } from "../dto/rai-chat.dto";
import {
  RaiToolActorContext,
  RaiToolName,
} from "../tools/rai-tools.types";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { planByToolCalls } from "./tool-call.planner";
import { RiskPolicyBlockedError } from "../security/risk-policy-blocked.error";

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

  constructor(private readonly toolsRegistry: RaiToolsRegistry) {}

  async run(params: RunParams): Promise<ExecutionResult> {
    const plan = planByToolCalls(params.requestedToolCalls);
    const partial: Array<{ name: RaiToolName; result: unknown }> = [];

    const toEntry = (name: RaiToolName, result: unknown) => {
      const entry = { name, result };
      partial.push(entry);
      return entry;
    };
    const runOne = (call: { name: RaiToolName; payload: Record<string, unknown> }) =>
      this.toolsRegistry
        .execute(call.name, call.payload, params.actorContext)
        .then((r) => toEntry(call.name, r))
        .catch((err) => {
          if (err instanceof RiskPolicyBlockedError) {
            return toEntry(call.name, {
              riskPolicyBlocked: true,
              actionId: err.actionId,
              message: err.message,
            });
          }
          throw err;
        });

    const agronomPromises = plan.agronom.map((call) => runOne(call));
    const economistPromises = plan.economist.map((call) => runOne(call));
    const knowledgePromises = plan.knowledge.map((call) => runOne(call));
    const otherPromises = plan.other.map((call) => runOne(call));

    const allPromises = [...agronomPromises, ...economistPromises, ...knowledgePromises, ...otherPromises];
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("AGENT_RUNTIME_DEADLINE_EXCEEDED")),
        AGENT_DEADLINE_MS,
      ),
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
      this.logger.warn(
        `agent_runtime deadline or error companyId=${params.actorContext.companyId} traceId=${params.actorContext.traceId} message=${String((err as Error)?.message ?? err)}`,
      );
      return { executedTools: partial };
    }
  }
}
