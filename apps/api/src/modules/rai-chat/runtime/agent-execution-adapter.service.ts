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
import { CrmAgent, type CrmAgentIntent } from "../agents/crm-agent.service";
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
    private readonly crmAgent: CrmAgent,
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

    if (adapterRole === "crm_agent") {
      const payload = this.firstPayload(params.allowedToolCalls);
      const intent = this.detectCrmIntent(params.allowedToolCalls, params.request.message);
      const result = await this.crmAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          userId: params.actorContext.userId,
          userRole: params.actorContext.userRole,
          userConfirmed: params.actorContext.userConfirmed,
          intent,
          inn: typeof payload.inn === "string" ? payload.inn : undefined,
          jurisdictionCode:
            payload.jurisdictionCode === "RU" ||
            payload.jurisdictionCode === "BY" ||
            payload.jurisdictionCode === "KZ"
              ? payload.jurisdictionCode
              : undefined,
          partyType:
            payload.partyType === "LEGAL_ENTITY" ||
            payload.partyType === "IP" ||
            payload.partyType === "KFH"
              ? payload.partyType
              : undefined,
          fromPartyId: typeof payload.fromPartyId === "string" ? payload.fromPartyId : undefined,
          toPartyId: typeof payload.toPartyId === "string" ? payload.toPartyId : undefined,
          relationType:
            payload.relationType === "OWNERSHIP" ||
            payload.relationType === "MANAGEMENT" ||
            payload.relationType === "AFFILIATED" ||
            payload.relationType === "AGENCY"
              ? payload.relationType
              : undefined,
          sharePct: typeof payload.sharePct === "number" ? payload.sharePct : undefined,
          validFrom: typeof payload.validFrom === "string" ? payload.validFrom : undefined,
          validTo: typeof payload.validTo === "string" ? payload.validTo : undefined,
          accountId: typeof payload.accountId === "string" ? payload.accountId : this.resolveAccountId(params.request),
          accountPayload:
            intent === "create_crm_account"
              ? {
                  name:
                    typeof payload.name === "string"
                      ? payload.name
                      : params.request.workspaceContext?.selectedRowSummary?.title,
                  inn: typeof payload.inn === "string" ? payload.inn : undefined,
                  type: typeof payload.type === "string" ? payload.type : undefined,
                  holdingId: typeof payload.holdingId === "string" ? payload.holdingId : undefined,
                }
              : undefined,
          updatePayload:
            intent === "update_account_profile"
              ? {
                  name: typeof payload.name === "string" ? payload.name : undefined,
                  inn:
                    typeof payload.inn === "string"
                      ? payload.inn
                      : payload.inn === null
                        ? null
                        : undefined,
                  type: typeof payload.type === "string" ? payload.type : undefined,
                  status: typeof payload.status === "string" ? payload.status : undefined,
                  holdingId:
                    typeof payload.holdingId === "string"
                      ? payload.holdingId
                      : payload.holdingId === null
                        ? null
                        : undefined,
                  jurisdiction:
                    typeof payload.jurisdiction === "string"
                      ? payload.jurisdiction
                      : payload.jurisdiction === null
                        ? null
                        : undefined,
                  riskCategory:
                    typeof payload.riskCategory === "string" ? payload.riskCategory : undefined,
                  strategicValue:
                    typeof payload.strategicValue === "string" ? payload.strategicValue : undefined,
                }
              : undefined,
          contactId:
            typeof payload.contactId === "string"
              ? payload.contactId
              : this.resolveEntityId(params.request, ["contact"]),
          contactPayload:
            intent === "create_crm_contact" || intent === "update_crm_contact"
              ? {
                  firstName: typeof payload.firstName === "string" ? payload.firstName : undefined,
                  lastName:
                    typeof payload.lastName === "string"
                      ? payload.lastName
                      : payload.lastName === null
                        ? null
                        : undefined,
                  role: typeof payload.role === "string" ? payload.role : undefined,
                  influenceLevel:
                    typeof payload.influenceLevel === "number"
                      ? payload.influenceLevel
                      : payload.influenceLevel === null
                        ? null
                        : undefined,
                  email:
                    typeof payload.email === "string"
                      ? payload.email
                      : payload.email === null
                        ? null
                        : undefined,
                  phone:
                    typeof payload.phone === "string"
                      ? payload.phone
                      : payload.phone === null
                        ? null
                        : undefined,
                  source:
                    typeof payload.source === "string"
                      ? payload.source
                      : payload.source === null
                        ? null
                        : undefined,
                }
              : undefined,
          interactionPayload:
            intent === "log_crm_interaction" || intent === "update_crm_interaction" || intent === "delete_crm_interaction"
              ? {
                  interactionId:
                    typeof payload.interactionId === "string"
                      ? payload.interactionId
                      : this.resolveEntityId(params.request, ["interaction"]),
                  type: typeof payload.type === "string" ? payload.type : undefined,
                  summary:
                    typeof payload.summary === "string"
                      ? payload.summary
                      : intent === "log_crm_interaction"
                        ? this.buildInteractionSummary(params.request.message)
                        : undefined,
                  date: typeof payload.date === "string" ? payload.date : undefined,
                  contactId:
                    typeof payload.contactId === "string"
                      ? payload.contactId
                      : payload.contactId === null
                        ? null
                        : undefined,
                  relatedEventId:
                    typeof payload.relatedEventId === "string"
                      ? payload.relatedEventId
                      : payload.relatedEventId === null
                        ? null
                        : undefined,
                }
              : undefined,
          obligationPayload:
            intent === "create_crm_obligation" || intent === "update_crm_obligation" || intent === "delete_crm_obligation"
              ? {
                  obligationId:
                    typeof payload.obligationId === "string"
                      ? payload.obligationId
                      : this.resolveEntityId(params.request, ["obligation"]),
                  description:
                    typeof payload.description === "string"
                      ? payload.description
                      : intent === "create_crm_obligation"
                        ? this.buildObligationDescription(params.request.message)
                        : undefined,
                  dueDate: typeof payload.dueDate === "string" ? payload.dueDate : undefined,
                  responsibleUserId:
                    typeof payload.responsibleUserId === "string"
                      ? payload.responsibleUserId
                      : payload.responsibleUserId === null
                        ? null
                        : undefined,
                  status: typeof payload.status === "string" ? payload.status : undefined,
                }
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
          intent,
        },
        toolCalls: [
          {
            name: this.detectCrmTool(params.allowedToolCalls, intent),
            result: result.data,
          },
        ],
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

  private detectCrmIntent(
    toolCalls: RaiToolCallDto[],
    message: string,
  ): CrmAgentIntent {
    if (toolCalls.some((call) => call.name === RaiToolName.RegisterCounterparty)) {
      return "register_counterparty";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateCounterpartyRelation)) {
      return "create_counterparty_relation";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmAccount)) {
      return "create_crm_account";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.GetCrmAccountWorkspace)) {
      return "review_account_workspace";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmAccount)) {
      return "update_account_profile";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmContact)) {
      return "create_crm_contact";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmContact)) {
      return "update_crm_contact";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.DeleteCrmContact)) {
      return "delete_crm_contact";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmInteraction)) {
      return "log_crm_interaction";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmInteraction)) {
      return "update_crm_interaction";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.DeleteCrmInteraction)) {
      return "delete_crm_interaction";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmObligation)) {
      return "create_crm_obligation";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmObligation)) {
      return "update_crm_obligation";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.DeleteCrmObligation)) {
      return "delete_crm_obligation";
    }

    const normalized = message.toLowerCase();
    if (/контакт/i.test(normalized)) {
      return /удали|убери|снеси/i.test(normalized)
        ? "delete_crm_contact"
        : /обнови|измени|правь/i.test(normalized)
          ? "update_crm_contact"
          : "create_crm_contact";
    }
    if (/взаимодейств|звон|встреч|созвон/i.test(normalized)) {
      return /удали|убери/i.test(normalized)
        ? "delete_crm_interaction"
        : /обнови|измени|правь/i.test(normalized)
          ? "update_crm_interaction"
          : "log_crm_interaction";
    }
    if (/обязательств|follow up|дедлайн|напомин/i.test(normalized)) {
      return /удали|убери|сними/i.test(normalized)
        ? "delete_crm_obligation"
        : /обнови|измени|перенеси/i.test(normalized)
          ? "update_crm_obligation"
          : "create_crm_obligation";
    }
    if (/созд(ай|ать).*(аккаунт|клиент|карточк)|заведи.*аккаунт/i.test(normalized)) {
      return "create_crm_account";
    }
    if (/инн|контрагент|контрагента|зарегистр/i.test(normalized)) {
      return "register_counterparty";
    }
    return "review_account_workspace";
  }

  private detectCrmTool(
    toolCalls: RaiToolCallDto[],
    intent: CrmAgentIntent,
  ): RaiToolName {
    const explicit = toolCalls[0]?.name;
    if (explicit) {
      return explicit;
    }
    switch (intent) {
      case "register_counterparty":
        return RaiToolName.RegisterCounterparty;
      case "create_counterparty_relation":
        return RaiToolName.CreateCounterpartyRelation;
      case "create_crm_account":
        return RaiToolName.CreateCrmAccount;
      case "review_account_workspace":
        return RaiToolName.GetCrmAccountWorkspace;
      case "update_account_profile":
        return RaiToolName.UpdateCrmAccount;
      case "create_crm_contact":
        return RaiToolName.CreateCrmContact;
      case "update_crm_contact":
        return RaiToolName.UpdateCrmContact;
      case "delete_crm_contact":
        return RaiToolName.DeleteCrmContact;
      case "log_crm_interaction":
        return RaiToolName.CreateCrmInteraction;
      case "update_crm_interaction":
        return RaiToolName.UpdateCrmInteraction;
      case "delete_crm_interaction":
        return RaiToolName.DeleteCrmInteraction;
      case "create_crm_obligation":
        return RaiToolName.CreateCrmObligation;
      case "update_crm_obligation":
        return RaiToolName.UpdateCrmObligation;
      case "delete_crm_obligation":
        return RaiToolName.DeleteCrmObligation;
      default:
        return RaiToolName.GetCrmAccountWorkspace;
    }
  }

  private resolveEntityId(
    request: AgentExecutionRequest,
    kinds: string[],
  ): string | undefined {
    const selected = request.workspaceContext?.selectedRowSummary;
    if (selected?.id && selected.kind && kinds.includes(selected.kind.toLowerCase())) {
      return selected.id;
    }
    const activeRef = request.workspaceContext?.activeEntityRefs?.find(
      (item) => kinds.includes(item.kind),
    );
    return activeRef?.id;
  }

  private resolveAccountId(request: AgentExecutionRequest): string | undefined {
    const selected = request.workspaceContext?.selectedRowSummary;
    if (selected?.id && (!selected.kind || ["account", "party", "farm", "holding"].includes(selected.kind.toLowerCase()))) {
      return selected.id;
    }
    const activeRef = request.workspaceContext?.activeEntityRefs?.find(
      (item) => ["party", "account", "farm", "holding"].includes(item.kind),
    );
    return activeRef?.id;
  }

  private buildInteractionSummary(message: string): string {
    return message.trim().slice(0, 500);
  }

  private buildObligationDescription(message: string): string {
    return message.trim().slice(0, 500);
  }
}
