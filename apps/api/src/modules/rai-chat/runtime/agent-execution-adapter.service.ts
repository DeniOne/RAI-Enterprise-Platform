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
  FrontOfficeAgent,
  type FrontOfficeAgentIntent,
} from "../agents/front-office-agent.service";
import {
  ContractsAgent,
  type ContractsAgentInput,
  type ContractsAgentIntent,
} from "../agents/contracts-agent.service";
import { ChiefAgronomistAgent } from "../agents/chief-agronomist-agent.service";
import { DataScientistAgent } from "../agents/data-scientist-agent.service";
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
    private readonly frontOfficeAgent: FrontOfficeAgent,
    private readonly contractsAgent: ContractsAgent,
    private readonly chiefAgronomistAgent: ChiefAgronomistAgent,
    private readonly dataScientistAgent: DataScientistAgent,
  ) { }

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

    if (adapterRole === "front_office_agent") {
      const payload = this.firstPayload(params.allowedToolCalls);
      const intent = this.detectFrontOfficeIntent(params.allowedToolCalls);
      const result = await this.frontOfficeAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          userId: params.actorContext.userId,
          userRole: params.actorContext.userRole,
          userConfirmed: params.actorContext.userConfirmed,
          intent,
          channel:
            payload.channel === "telegram" ||
              payload.channel === "web_chat" ||
              payload.channel === "internal"
              ? payload.channel
              : params.request.workspaceContext?.route?.toLowerCase().includes("telegram")
                ? "telegram"
                : "web_chat",
          messageText:
            typeof payload.messageText === "string" ? payload.messageText : params.request.message,
          direction:
            payload.direction === "inbound" || payload.direction === "outbound"
              ? payload.direction
              : "inbound",
          threadExternalId:
            typeof payload.threadExternalId === "string"
              ? payload.threadExternalId
              : params.request.threadId,
          dialogExternalId:
            typeof payload.dialogExternalId === "string" ? payload.dialogExternalId : undefined,
          senderExternalId:
            typeof payload.senderExternalId === "string" ? payload.senderExternalId : undefined,
          recipientExternalId:
            typeof payload.recipientExternalId === "string"
              ? payload.recipientExternalId
              : undefined,
          route: params.request.workspaceContext?.route,
          targetOwnerRole:
            typeof payload.targetOwnerRole === "string" ? payload.targetOwnerRole : undefined,
        },
        { kernel: params.kernel, request: params.request },
      );

      return {
        role: params.request.role,
        status: result.status,
        text: result.explain,
        structuredOutput: {
          data: result.data,
          intent,
        },
        toolCalls: [
          {
            name: this.detectFrontOfficeTool(params.allowedToolCalls, intent),
            result: result.data,
          },
        ],
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          true,
          result.status,
          false,
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed: result.fallbackUsed,
        outputContractVersion: params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "contracts_agent") {
      const payload = this.firstPayload(params.allowedToolCalls);
      const intent = this.detectContractsIntent(params.allowedToolCalls, params.request.message);
      const result = await this.contractsAgent.run({
        companyId: params.actorContext.companyId,
        traceId: params.request.traceId,
        userId: params.actorContext.userId,
        userRole: params.actorContext.userRole,
        userConfirmed: params.actorContext.userConfirmed,
        intent,
        contractId:
          typeof payload.contractId === "string"
            ? payload.contractId
            : this.resolveEntityId(params.request, ["contract"]),
        obligationId:
          typeof payload.obligationId === "string"
            ? payload.obligationId
            : this.resolveEntityId(params.request, ["obligation"]),
        invoiceId:
          typeof payload.invoiceId === "string"
            ? payload.invoiceId
            : this.resolveEntityId(params.request, ["invoice"]),
        paymentId:
          typeof payload.paymentId === "string"
            ? payload.paymentId
            : this.resolveEntityId(params.request, ["payment"]),
        fulfillmentEventId:
          typeof payload.fulfillmentEventId === "string"
            ? payload.fulfillmentEventId
            : this.resolveEntityId(params.request, ["fulfillment_event", "fulfillment"]),
        number:
          typeof payload.number === "string"
            ? payload.number
            : this.extractContractNumber(params.request.message),
        type:
          typeof payload.type === "string" ? payload.type : this.extractContractType(params.request.message),
        validFrom: typeof payload.validFrom === "string" ? payload.validFrom : undefined,
        validTo: typeof payload.validTo === "string" ? payload.validTo : undefined,
        jurisdictionId:
          typeof payload.jurisdictionId === "string" ? payload.jurisdictionId : undefined,
        regulatoryProfileId:
          typeof payload.regulatoryProfileId === "string"
            ? payload.regulatoryProfileId
            : undefined,
        roles:
          Array.isArray(payload.roles) &&
            payload.roles.every(
              (item) =>
                item &&
                typeof item === "object" &&
                typeof (item as { partyId?: unknown }).partyId === "string" &&
                typeof (item as { role?: unknown }).role === "string",
            )
            ? (payload.roles as ContractsAgentInput["roles"])
            : undefined,
        obligationType:
          payload.type === "DELIVER" || payload.type === "PAY" || payload.type === "PERFORM"
            ? payload.type
            : this.extractObligationType(params.request.message),
        dueDate: typeof payload.dueDate === "string" ? payload.dueDate : undefined,
        eventDomain:
          payload.eventDomain === "COMMERCIAL" ||
            payload.eventDomain === "PRODUCTION" ||
            payload.eventDomain === "LOGISTICS" ||
            payload.eventDomain === "FINANCE_ADJ"
            ? payload.eventDomain
            : this.extractEventDomain(params.request.message),
        eventType:
          this.isKnownFulfillmentEventType(payload.eventType)
            ? payload.eventType
            : this.extractEventType(params.request.message),
        eventDate: typeof payload.eventDate === "string" ? payload.eventDate : undefined,
        batchId: typeof payload.batchId === "string" ? payload.batchId : undefined,
        itemId: typeof payload.itemId === "string" ? payload.itemId : undefined,
        uom: typeof payload.uom === "string" ? payload.uom : undefined,
        qty: typeof payload.qty === "number" ? payload.qty : undefined,
        sellerJurisdiction:
          typeof payload.sellerJurisdiction === "string"
            ? payload.sellerJurisdiction
            : undefined,
        buyerJurisdiction:
          typeof payload.buyerJurisdiction === "string"
            ? payload.buyerJurisdiction
            : undefined,
        supplyType:
          payload.supplyType === "GOODS" ||
            payload.supplyType === "SERVICE" ||
            payload.supplyType === "LEASE"
            ? payload.supplyType
            : this.extractSupplyType(params.request.message),
        vatPayerStatus:
          payload.vatPayerStatus === "PAYER" || payload.vatPayerStatus === "NON_PAYER"
            ? payload.vatPayerStatus
            : undefined,
        subtotal: typeof payload.subtotal === "number" ? payload.subtotal : undefined,
        productTaxCode:
          typeof payload.productTaxCode === "string" ? payload.productTaxCode : undefined,
        payerPartyId:
          typeof payload.payerPartyId === "string" ? payload.payerPartyId : undefined,
        payeePartyId:
          typeof payload.payeePartyId === "string" ? payload.payeePartyId : undefined,
        amount: typeof payload.amount === "number" ? payload.amount : undefined,
        currency: typeof payload.currency === "string" ? payload.currency : undefined,
        paymentMethod:
          typeof payload.paymentMethod === "string" ? payload.paymentMethod : undefined,
        paidAt: typeof payload.paidAt === "string" ? payload.paidAt : undefined,
        allocatedAmount:
          typeof payload.allocatedAmount === "number" ? payload.allocatedAmount : undefined,
      });

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
            name: this.detectContractsTool(params.allowedToolCalls, intent),
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

    if (adapterRole === "chief_agronomist") {
      const payload = this.firstPayload(params.allowedToolCalls);
      const result = await this.chiefAgronomistAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent: params.request.message.toLowerCase().includes("алерт") ||
            params.request.message.toLowerCase().includes("совет")
            ? "alert_review"
            : "expert_opinion",
          query: params.request.message,
          context: {
            fieldId: typeof payload.fieldId === "string" ? payload.fieldId : undefined,
            techMapId: typeof payload.techMapId === "string" ? payload.techMapId : undefined,
            alertId: typeof payload.alertId === "string" ? payload.alertId : undefined,
          },
        },
        { kernel: params.kernel, request: params.request },
      );
      return {
        role: params.request.role,
        status: result.status,
        text: result.explain,
        structuredOutput: { data: result.data },
        toolCalls: [], // Expert agents mostly provide synthesis
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          true,
          result.status,
          false,
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed: false,
        outputContractVersion: params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "data_scientist") {
      const payload = this.firstPayload(params.allowedToolCalls);
      const result = await this.dataScientistAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent: this.detectDataScientistIntent(params.request.message),
          fieldId: typeof payload.fieldId === "string" ? payload.fieldId : undefined,
          crop: typeof payload.crop === "string" ? payload.crop : undefined,
          seasonId: typeof payload.seasonId === "string" ? payload.seasonId : undefined,
          scenario: typeof payload.scenario === "object" ? payload.scenario : undefined,
        },
        { kernel: params.kernel, request: params.request },
      );
      return {
        role: params.request.role,
        status: result.status,
        text: result.explain,
        structuredOutput: { data: result.data },
        toolCalls: [],
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          true,
          result.status,
          false,
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed: false,
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

  private detectDataScientistIntent(message: string): any {
    const msg = message.toLowerCase();
    if (msg.includes("прогноз") || msg.includes("урожай")) return "yield_prediction";
    if (msg.includes("риск") || msg.includes("болезн")) return "disease_risk";
    if (msg.includes("оптимиз") || msg.includes("затрат") || msg.includes("экономи")) return "cost_optimization";
    if (msg.includes("отчет") || msg.includes("итог")) return "seasonal_report";
    if (msg.includes("паттерн") || msg.includes("закономерн")) return "pattern_mining";
    if (msg.includes("что если") || msg.includes("сценарий")) return "what_if";
    return "yield_prediction"; // Default
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

  private detectFrontOfficeIntent(
    toolCalls: RaiToolCallDto[],
  ): FrontOfficeAgentIntent {
    if (toolCalls.some((call) => call.name === RaiToolName.CreateFrontOfficeEscalation)) {
      return "create_front_office_escalation";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.ClassifyDialogThread)) {
      return "classify_dialog_thread";
    }
    return "log_dialog_message";
  }

  private detectContractsIntent(
    toolCalls: RaiToolCallDto[],
    message: string,
  ): ContractsAgentIntent {
    if (toolCalls.some((call) => call.name === RaiToolName.CreateCommerceContract)) {
      return "create_commerce_contract";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.ListCommerceContracts)) {
      return "list_commerce_contracts";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.GetCommerceContract)) {
      return "review_commerce_contract";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateCommerceObligation)) {
      return "create_contract_obligation";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateFulfillmentEvent)) {
      return "create_fulfillment_event";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreateInvoiceFromFulfillment)) {
      return "create_invoice_from_fulfillment";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.PostInvoice)) {
      return "post_invoice";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.CreatePayment)) {
      return "create_payment";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.ConfirmPayment)) {
      return "confirm_payment";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.AllocatePayment)) {
      return "allocate_payment";
    }
    if (toolCalls.some((call) => call.name === RaiToolName.GetArBalance)) {
      return "review_ar_balance";
    }

    const normalized = message.toLowerCase();
    if (/дебитор|ar balance|остаток.*счет|задолжен/i.test(normalized)) {
      return "review_ar_balance";
    }
    if (/разнес|аллокац/i.test(normalized)) {
      return "allocate_payment";
    }
    if (/подтверд.*оплат/i.test(normalized)) {
      return "confirm_payment";
    }
    if (/созд(ай|ать).*(платеж|оплат)/i.test(normalized)) {
      return "create_payment";
    }
    if (/провед.*счет|опубликуй.*счет|post invoice/i.test(normalized)) {
      return "post_invoice";
    }
    if (/сформир.*счет|созд(ай|ать).*(счет|инвойс)/i.test(normalized)) {
      return "create_invoice_from_fulfillment";
    }
    if (/зафиксир.*исполн|исполнени|отгрузк|shipment/i.test(normalized)) {
      return "create_fulfillment_event";
    }
    if (/обязательств/i.test(normalized)) {
      return "create_contract_obligation";
    }
    if (/реестр.*договор|список.*договор|покажи.*договор/i.test(normalized)) {
      return "list_commerce_contracts";
    }
    if (/карточк.*договор|договор .*покажи|review contract/i.test(normalized)) {
      return "review_commerce_contract";
    }
    return "create_commerce_contract";
  }

  private detectContractsTool(
    toolCalls: RaiToolCallDto[],
    intent: ContractsAgentIntent,
  ): RaiToolName {
    const explicit = toolCalls[0]?.name;
    if (explicit) {
      return explicit;
    }
    switch (intent) {
      case "create_commerce_contract":
        return RaiToolName.CreateCommerceContract;
      case "list_commerce_contracts":
        return RaiToolName.ListCommerceContracts;
      case "review_commerce_contract":
        return RaiToolName.GetCommerceContract;
      case "create_contract_obligation":
        return RaiToolName.CreateCommerceObligation;
      case "create_fulfillment_event":
        return RaiToolName.CreateFulfillmentEvent;
      case "create_invoice_from_fulfillment":
        return RaiToolName.CreateInvoiceFromFulfillment;
      case "post_invoice":
        return RaiToolName.PostInvoice;
      case "create_payment":
        return RaiToolName.CreatePayment;
      case "confirm_payment":
        return RaiToolName.ConfirmPayment;
      case "allocate_payment":
        return RaiToolName.AllocatePayment;
      case "review_ar_balance":
        return RaiToolName.GetArBalance;
      default:
        return RaiToolName.CreateCommerceContract;
    }
  }

  private detectFrontOfficeTool(
    toolCalls: RaiToolCallDto[],
    intent: FrontOfficeAgentIntent,
  ): RaiToolName {
    const explicit = toolCalls[0]?.name;
    if (explicit) {
      return explicit;
    }
    switch (intent) {
      case "classify_dialog_thread":
        return RaiToolName.ClassifyDialogThread;
      case "create_front_office_escalation":
        return RaiToolName.CreateFrontOfficeEscalation;
      default:
        return RaiToolName.LogDialogMessage;
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

  private extractContractNumber(message: string): string | undefined {
    const match = message.match(/\b([A-ZА-Я]{1,4}-?\d{2,4}-?\d{1,6})\b/u);
    return match?.[1];
  }

  private extractContractType(message: string): string | undefined {
    const normalized = message.toLowerCase();
    if (/аренд/i.test(normalized)) return "LEASE";
    if (/агент/i.test(normalized)) return "AGENCY";
    if (/услуг/i.test(normalized)) return "SERVICE";
    if (/поставк|договор/i.test(normalized)) return "SUPPLY";
    return undefined;
  }

  private extractObligationType(
    message: string,
  ): "DELIVER" | "PAY" | "PERFORM" | undefined {
    const normalized = message.toLowerCase();
    if (/оплат/i.test(normalized)) return "PAY";
    if (/исполн|услуг/i.test(normalized)) return "PERFORM";
    if (/постав|отгруз/i.test(normalized)) return "DELIVER";
    return undefined;
  }

  private extractEventDomain(
    message: string,
  ): "COMMERCIAL" | "PRODUCTION" | "LOGISTICS" | "FINANCE_ADJ" | undefined {
    const normalized = message.toLowerCase();
    if (/логист/i.test(normalized)) return "LOGISTICS";
    if (/производ|урож|материал/i.test(normalized)) return "PRODUCTION";
    if (/финанс/i.test(normalized)) return "FINANCE_ADJ";
    if (/исполн|отгруз|shipment|service/i.test(normalized)) return "COMMERCIAL";
    return undefined;
  }

  private isKnownFulfillmentEventType(value: unknown): value is ContractsAgentInput["eventType"] {
    return (
      value === "GOODS_SHIPMENT" ||
      value === "SERVICE_ACT" ||
      value === "LEASE_USAGE" ||
      value === "MATERIAL_CONSUMPTION" ||
      value === "HARVEST" ||
      value === "INTERNAL_TRANSFER" ||
      value === "WRITE_OFF"
    );
  }

  private extractEventType(message: string): ContractsAgentInput["eventType"] {
    const normalized = message.toLowerCase();
    if (/отгруз|shipment/i.test(normalized)) return "GOODS_SHIPMENT";
    if (/аренд/i.test(normalized)) return "LEASE_USAGE";
    if (/урож/i.test(normalized)) return "HARVEST";
    if (/списа/i.test(normalized)) return "WRITE_OFF";
    if (/перемещ/i.test(normalized)) return "INTERNAL_TRANSFER";
    if (/материал/i.test(normalized)) return "MATERIAL_CONSUMPTION";
    return "SERVICE_ACT";
  }

  private extractSupplyType(message: string): "GOODS" | "SERVICE" | "LEASE" | undefined {
    const normalized = message.toLowerCase();
    if (/аренд/i.test(normalized)) return "LEASE";
    if (/услуг|service/i.test(normalized)) return "SERVICE";
    if (/товар|постав|отгруз|goods/i.test(normalized)) return "GOODS";
    return undefined;
  }
}
