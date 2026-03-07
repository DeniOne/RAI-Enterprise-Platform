import { Injectable } from "@nestjs/common";
import { RaiToolActorContext, RaiToolName } from "../tools/rai-tools.types";
import { RaiToolCallDto } from "../dto/rai-chat.dto";
import {
  AgentExecutionRequest,
  AgentExecutionResult,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";
import { RuntimeBudgetDecision } from "../security/budget-controller.service";
import { AgronomAgent } from "../agents/agronom-agent.service";
import { EconomistAgent } from "../agents/economist-agent.service";
import { KnowledgeAgent } from "../agents/knowledge-agent.service";
import { MonitoringAgent } from "../agents/monitoring-agent.service";
import {
  CanonicalAgentRuntimeRole,
  isAgentRuntimeRole,
} from "../agent-registry.service";

interface ExecuteAdapterParams {
  request: AgentExecutionRequest;
  actorContext: RaiToolActorContext;
  kernel: EffectiveAgentKernelEntry;
  allowedToolCalls: RaiToolCallDto[];
  budgetDecision: RuntimeBudgetDecision;
}

@Injectable()
export class AgentExecutionAdapterService {
  constructor(
    private readonly agronomAgent: AgronomAgent,
    private readonly economistAgent: EconomistAgent,
    private readonly knowledgeAgent: KnowledgeAgent,
    private readonly monitoringAgent: MonitoringAgent,
  ) {}

  async execute(params: ExecuteAdapterParams): Promise<AgentExecutionResult> {
    const adapterRole = this.resolveAdapterRole(params.kernel, params.request.role);
    const auditPayload = {
      runtimeMode: "agent-first-hybrid" as const,
      model: params.kernel.runtimeProfile.model,
      provider: params.kernel.runtimeProfile.provider,
      autonomyMode: params.kernel.definition.defaultAutonomyMode,
      allowedToolNames: params.kernel.toolBindings
        .filter((binding) => binding.isEnabled)
        .map((binding) => binding.toolName),
      blockedToolNames: params.kernel.toolBindings
        .filter((binding) => !binding.isEnabled)
        .map((binding) => binding.toolName),
      connectorNames: params.kernel.connectorBindings.map((binding) => binding.connectorName),
      outputContractId: params.kernel.outputContract.contractId,
    };

    if (adapterRole === "agronomist") {
      const payload = this.firstPayload(params.allowedToolCalls);
      const result = await this.agronomAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent:
            params.request.message.toLowerCase().includes("отклон") ||
            params.allowedToolCalls.some((call) => call.name === RaiToolName.ComputeDeviations)
              ? "compute_deviations"
              : "generate_tech_map_draft",
          fieldRef: typeof payload.fieldRef === "string" ? payload.fieldRef : undefined,
          seasonRef: typeof payload.seasonRef === "string" ? payload.seasonRef : undefined,
          crop: payload.crop === "sunflower" ? "sunflower" : "rapeseed",
          scope:
            typeof payload.scope === "object"
              ? (payload.scope as { seasonId?: string; fieldId?: string })
              : undefined,
        },
        { kernel: params.kernel, request: params.request },
      );
      return {
        role: params.request.role,
        status: result.status,
        text: result.explain,
        structuredOutput: {
          data: result.data,
          missingContext: result.missingContext,
          mathBasis: result.mathBasis ?? [],
        },
        toolCalls: [
          {
            name:
              result.toolCallsCount > 0 &&
              (params.request.message.toLowerCase().includes("отклон") ||
                params.allowedToolCalls.some((call) => call.name === RaiToolName.ComputeDeviations))
                ? RaiToolName.ComputeDeviations
                : RaiToolName.GenerateTechMapDraft,
            result: result.data,
          },
        ],
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          Boolean(result.mathBasis?.length || result.status === "NEEDS_MORE_DATA"),
          result.status,
          result.status === "NEEDS_MORE_DATA",
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed: result.fallbackUsed,
        outputContractVersion: params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "economist") {
      const payload = this.firstPayload(params.allowedToolCalls);
      const result = await this.economistAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent: params.allowedToolCalls.some((call) => call.name === RaiToolName.ComputeRiskAssessment)
            ? "compute_risk_assessment"
            : params.allowedToolCalls.some((call) => call.name === RaiToolName.SimulateScenario)
              ? "simulate_scenario"
              : "compute_plan_fact",
          scope:
            typeof payload.scope === "object"
              ? (payload.scope as { planId?: string; seasonId?: string })
              : undefined,
        },
        { kernel: params.kernel, request: params.request },
      );
      return {
        role: params.request.role,
        status: result.status,
        text: result.explain,
        structuredOutput: { data: result.data, missingContext: result.missingContext },
        toolCalls: [{ name: this.detectEconomistTool(params.allowedToolCalls), result: result.data }],
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          result.status === "NEEDS_MORE_DATA" || result.evidence.length > 0,
          result.status,
          result.status === "NEEDS_MORE_DATA",
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed: result.fallbackUsed,
        outputContractVersion: params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "knowledge") {
      const result = await this.knowledgeAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          query: params.request.message,
        },
        { kernel: params.kernel, request: params.request },
      );
      return {
        role: params.request.role,
        status: result.status,
        text: result.explain,
        structuredOutput: { data: result.data },
        toolCalls: [{ name: RaiToolName.QueryKnowledge, result: result.data }],
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          true,
          result.status,
          this.isKnowledgeNoHit(result.data),
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed: result.fallbackUsed,
        outputContractVersion: params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    const result = await this.monitoringAgent.run(
      {
        companyId: params.actorContext.companyId,
        traceId: params.request.traceId,
      },
      { kernel: params.kernel, request: params.request },
    );
    return {
      role: params.request.role,
      status: result.status,
      text: result.explain,
      structuredOutput: {
        alertsEmitted: result.alertsEmitted,
        signalsSnapshot: result.signalsSnapshot ?? {},
      },
      toolCalls: [{ name: RaiToolName.EmitAlerts, result: result.signalsSnapshot ?? {} }],
      connectorCalls: [],
      evidence: result.evidence,
      validation: this.validateOutput(
        params.kernel,
        result.evidence,
        true,
        result.status,
        result.status === "RATE_LIMITED" || result.alertsEmitted === 0,
      ),
      runtimeBudget: params.budgetDecision,
      fallbackUsed: result.fallbackUsed,
      outputContractVersion: params.kernel.outputContract.responseSchemaVersion,
      auditPayload,
    };
  }

  private resolveAdapterRole(
    kernel: EffectiveAgentKernelEntry,
    fallbackRole: string,
  ): CanonicalAgentRuntimeRole {
    const adapterRole = (kernel.runtimeProfile as typeof kernel.runtimeProfile & {
      executionAdapterRole?: string;
    }).executionAdapterRole;
    if (adapterRole && isAgentRuntimeRole(adapterRole)) {
      return adapterRole;
    }
    return isAgentRuntimeRole(fallbackRole) ? fallbackRole : "knowledge";
  }

  private validateOutput(
    kernel: EffectiveAgentKernelEntry,
    evidence: unknown[],
    deterministicBasisPresent: boolean,
    status?: AgentExecutionResult["status"],
    allowMissingEvidence = false,
  ): { passed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (
      kernel.outputContract.requiresEvidence &&
      evidence.length === 0 &&
      status !== "NEEDS_MORE_DATA" &&
      !allowMissingEvidence
    ) {
      reasons.push("evidence_required");
    }
    if (kernel.outputContract.requiresDeterministicValidation && !deterministicBasisPresent) {
      reasons.push("deterministic_basis_required");
    }
    return { passed: reasons.length === 0, reasons };
  }

  private isKnowledgeNoHit(data: unknown): boolean {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return false;
    }
    return typeof (data as { hits?: unknown }).hits === "number" && (data as { hits: number }).hits === 0;
  }

  private firstPayload(toolCalls: RaiToolCallDto[]): Record<string, unknown> {
    return toolCalls[0]?.payload ?? {};
  }

  private detectEconomistTool(toolCalls: RaiToolCallDto[]): RaiToolName {
    if (toolCalls.some((call) => call.name === RaiToolName.ComputeRiskAssessment)) {
      return RaiToolName.ComputeRiskAssessment;
    }
    if (toolCalls.some((call) => call.name === RaiToolName.SimulateScenario)) {
      return RaiToolName.SimulateScenario;
    }
    return RaiToolName.ComputePlanFact;
  }
}
