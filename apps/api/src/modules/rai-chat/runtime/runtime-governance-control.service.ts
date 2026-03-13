import { Injectable } from "@nestjs/common";
import { RuntimeGovernanceEventType } from "@rai/prisma-client";
import { RuntimeGovernanceDto, RaiToolCallDto } from "../dto/rai-chat.dto";
import { RaiToolName } from "../tools/rai-tools.types";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { RuntimeGovernanceEventService } from "../runtime-governance/runtime-governance-event.service";
import { RuntimeGovernancePolicyService } from "../runtime-governance/runtime-governance-policy.service";
import {
  FallbackReason,
  RuntimeConcurrencyEnvelope,
  RuntimeGovernanceOverrides,
  RuntimeGovernanceRolePolicy,
} from "../../../shared/rai-chat/runtime-governance-policy.types";

interface RecordGovernanceEventParams {
  companyId: string;
  traceId: string;
  agentRole: string | undefined;
  eventType: RuntimeGovernanceEventType;
  runtimeGovernance: RuntimeGovernanceDto;
  metadata?: Record<string, unknown>;
}

interface RecordToolFailureParams {
  companyId: string;
  traceId: string;
  agentRole: string | undefined;
  toolName: RaiToolName;
  message: string;
}

@Injectable()
export class RuntimeGovernanceControlService {
  constructor(
    private readonly governanceEvents: RuntimeGovernanceEventService,
    private readonly runtimeGovernancePolicy: RuntimeGovernancePolicyService,
    private readonly queueMetrics: QueueMetricsService,
  ) {}

  getRolePolicy(agentRole: string | undefined): RuntimeGovernanceRolePolicy {
    return this.runtimeGovernancePolicy.getRolePolicy(agentRole);
  }

  filterAllowedToolCalls(
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

  resolveRuntimeGovernanceFromResults(
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

  buildGovernanceMeta(
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

  async resolveConcurrencyEnvelope(
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

  async recordToolFailure(params: RecordToolFailureParams): Promise<void> {
    await this.governanceEvents.record({
      companyId: params.companyId,
      traceId: params.traceId,
      agentRole: params.agentRole,
      toolName: params.toolName,
      eventType: RuntimeGovernanceEventType.TOOL_FAILURE,
      fallbackReason: "TOOL_FAILURE",
      fallbackMode: this.runtimeGovernancePolicy.resolveFallbackMode(
        params.agentRole,
        "TOOL_FAILURE",
      ),
      metadata: {
        message: params.message,
      },
    });
  }

  async recordGovernanceEvent(params: RecordGovernanceEventParams): Promise<void> {
    await this.governanceEvents.record({
      companyId: params.companyId,
      traceId: params.traceId,
      agentRole: params.agentRole,
      eventType: params.eventType,
      fallbackReason: params.runtimeGovernance.fallbackReason as FallbackReason,
      fallbackMode: params.runtimeGovernance.fallbackMode as never,
      recommendationType: (params.runtimeGovernance.recommendation as never) ?? null,
      metadata: params.metadata,
    });
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
}
