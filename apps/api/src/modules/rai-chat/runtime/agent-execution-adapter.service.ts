import { Injectable } from "@nestjs/common";
import {
  RaiToolActorContext,
  RaiToolName,
} from "../../../shared/rai-chat/rai-tools.types";
import { RaiToolCallDto } from "../../../shared/rai-chat/rai-chat.dto";
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
import { FrontOfficeAgent } from "../agents/front-office-agent.service";
import {
  ContractsAgent,
  type ContractsAgentInput,
} from "../agents/contracts-agent.service";
import { ChiefAgronomistAgent } from "../agents/chief-agronomist-agent.service";
import { DataScientistAgent } from "../agents/data-scientist-agent.service";
import {
  CanonicalAgentRuntimeRole,
  isAgentRuntimeRole,
} from "../agent-registry.service";
import {
  buildInteractionSummary,
  buildObligationDescription,
  detectContractsIntent,
  detectContractsTool,
  detectCrmIntent,
  detectCrmTool,
  extractInnFromMessage,
  detectDataScientistIntent,
  detectEconomistTool,
  extractContractReviewQuery,
  extractCrmWorkspaceQuery,
  detectFrontOfficeIntent,
  detectFrontOfficeTool,
  extractContractNumber,
  extractContractType,
  extractEventDomain,
  extractEventType,
  extractObligationType,
  extractSupplyType,
  firstPayload,
  isKnowledgeNoHit,
  isKnownFulfillmentEventType,
  resolveAccountId,
  resolveEntityId,
} from "../../../shared/rai-chat/execution-adapter-heuristics";

interface ExecuteAdapterParams {
  request: AgentExecutionRequest;
  actorContext: RaiToolActorContext;
  kernel: EffectiveAgentKernelEntry;
  allowedToolCalls: RaiToolCallDto[];
  budgetDecision: RuntimeBudgetDecision;
}

type ExecutionPath =
  | "explicit_tool_path"
  | "fallback_interpretation"
  | "semantic_route_primary";
type AgronomIntent = "compute_deviations" | "generate_tech_map_draft";
type EconomistIntent =
  | "compute_plan_fact"
  | "simulate_scenario"
  | "compute_risk_assessment";

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
  ) {}

  async execute(params: ExecuteAdapterParams): Promise<AgentExecutionResult> {
    const adapterRole = this.resolveAdapterRole(
      params.kernel,
      params.request.role,
    );
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
      connectorNames: params.kernel.connectorBindings.map(
        (binding) => binding.connectorName,
      ),
      outputContractId: params.kernel.outputContract.contractId,
    };

    if (adapterRole === "agronomist") {
      const payload = firstPayload(params.allowedToolCalls);
      const routing = this.resolveAgronomIntent(
        params.allowedToolCalls,
        params.request.message,
        params.request.semanticRouting?.source,
      );
      const readOnlyTechMapQuery = this.isReadOnlyTechMapQuery(
        params.request.message,
      );
      const primarySemanticRouting =
        params.request.semanticRouting?.source === "primary";

      if (readOnlyTechMapQuery && (!routing.intent || primarySemanticRouting)) {
        return {
          role: params.request.role,
          status: "COMPLETED",
          executionPath: "fallback_interpretation",
          structuredOutput: {
            summary:
              "Понял запрос по техкартам. Откройте реестр техкарт по кнопке ниже.",
            data: {
              targetRoute: "/consulting/techmaps/active",
            },
            intent: "open_techmaps_registry",
            routingReason: "read_only_techmaps_query",
          },
          toolCalls: [],
          connectorCalls: [],
          evidence: [],
          validation: this.validateOutput(
            params.kernel,
            [],
            true,
            "COMPLETED",
            true,
          ),
          runtimeBudget: params.budgetDecision,
          fallbackUsed: true,
          outputContractVersion:
            params.kernel.outputContract.responseSchemaVersion,
          auditPayload,
          suggestedActions: [
            {
              kind: "route",
              title: "Открыть реестр техкарт",
              href: "/consulting/techmaps/active",
            },
          ],
        };
      }

      if (!routing.intent) {
        return {
          role: params.request.role,
          status: "NEEDS_MORE_DATA",
          executionPath: "fallback_interpretation",
          structuredOutput: {
            summary:
              "Уточните действие: показать отклонения или подготовить черновик техкарты.",
            data: {},
            missingContext: ["intent"],
            routingReason: "no_safe_agronom_intent",
          },
          toolCalls: [],
          connectorCalls: [],
          evidence: [],
          validation: this.validateOutput(
            params.kernel,
            [],
            true,
            "NEEDS_MORE_DATA",
            true,
          ),
          runtimeBudget: params.budgetDecision,
          fallbackUsed: true,
          outputContractVersion:
            params.kernel.outputContract.responseSchemaVersion,
          auditPayload,
        };
      }

      const result = await this.agronomAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent: routing.intent,
          fieldRef:
            typeof payload.fieldRef === "string" ? payload.fieldRef : undefined,
          seasonRef:
            typeof payload.seasonRef === "string"
              ? payload.seasonRef
              : undefined,
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
        executionPath: routing.executionPath,
        structuredOutput: {
          summary: result.explain,
          data: result.data,
          missingContext: result.missingContext,
          mathBasis: result.mathBasis ?? [],
          intent: routing.intent,
        },
        toolCalls:
          result.toolCallsCount > 0
            ? [
                {
                  name:
                    routing.intent === "compute_deviations"
                      ? RaiToolName.ComputeDeviations
                      : RaiToolName.GenerateTechMapDraft,
                  result: result.data,
                },
              ]
            : [],
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          Boolean(
            result.mathBasis?.length || result.status === "NEEDS_MORE_DATA",
          ),
          result.status,
          result.status === "NEEDS_MORE_DATA",
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed:
          result.fallbackUsed ||
          routing.executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "economist") {
      const payload = firstPayload(params.allowedToolCalls);
      const executionPath = this.resolveExecutionPath(
        params.allowedToolCalls,
        params.request,
      );
      const intent = this.resolveEconomistIntent(
        params.allowedToolCalls,
        params.request,
      );
      const result = await this.economistAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent,
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
        executionPath,
        structuredOutput: {
          summary: result.explain,
          data: result.data,
          missingContext: result.missingContext,
        },
        toolCalls:
          result.toolCallsCount > 0
            ? [
                {
                  name: this.resolveEconomistToolName(
                    intent,
                    params.allowedToolCalls,
                  ),
                  result: result.data,
                },
              ]
            : [],
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
        fallbackUsed:
          result.fallbackUsed || executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "knowledge") {
      const executionPath = this.resolveExecutionPath(
        params.allowedToolCalls,
        params.request,
      );
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
        executionPath,
        structuredOutput: { summary: result.explain, data: result.data },
        toolCalls:
          result.toolCallsCount > 0
            ? [{ name: RaiToolName.QueryKnowledge, result: result.data }]
            : [],
        connectorCalls: [],
        evidence: result.evidence,
        validation: this.validateOutput(
          params.kernel,
          result.evidence,
          true,
          result.status,
          isKnowledgeNoHit(result.data),
        ),
        runtimeBudget: params.budgetDecision,
        fallbackUsed:
          result.fallbackUsed || executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "crm_agent") {
      const payload = firstPayload(params.allowedToolCalls);
      const executionPath = this.resolveExecutionPath(
        params.allowedToolCalls,
        params.request,
      );
      const intent = this.resolveCrmIntent(
        params.allowedToolCalls,
        params.request,
      );
      const result = await this.crmAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          userId: params.actorContext.userId,
          userRole: params.actorContext.userRole,
          userConfirmed: params.actorContext.userConfirmed,
          intent,
          inn:
            typeof payload.inn === "string"
              ? payload.inn
              : intent === "lookup_counterparty_by_inn"
                ? extractInnFromMessage(params.request.message)
                : undefined,
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
          fromPartyId:
            typeof payload.fromPartyId === "string"
              ? payload.fromPartyId
              : undefined,
          toPartyId:
            typeof payload.toPartyId === "string"
              ? payload.toPartyId
              : undefined,
          relationType:
            payload.relationType === "OWNERSHIP" ||
            payload.relationType === "MANAGEMENT" ||
            payload.relationType === "AFFILIATED" ||
            payload.relationType === "AGENCY"
              ? payload.relationType
              : undefined,
          sharePct:
            typeof payload.sharePct === "number" ? payload.sharePct : undefined,
          validFrom:
            typeof payload.validFrom === "string"
              ? payload.validFrom
              : undefined,
          validTo:
            typeof payload.validTo === "string" ? payload.validTo : undefined,
          accountId:
            typeof payload.accountId === "string"
              ? payload.accountId
              : resolveAccountId(params.request),
          query:
            intent === "review_account_workspace"
              ? typeof payload.query === "string"
                ? payload.query
                : extractCrmWorkspaceQuery(params.request.message)
              : undefined,
          accountPayload:
            intent === "create_crm_account"
              ? {
                  name:
                    typeof payload.name === "string"
                      ? payload.name
                      : params.request.workspaceContext?.selectedRowSummary
                          ?.title,
                  inn:
                    typeof payload.inn === "string" ? payload.inn : undefined,
                  type:
                    typeof payload.type === "string" ? payload.type : undefined,
                  holdingId:
                    typeof payload.holdingId === "string"
                      ? payload.holdingId
                      : undefined,
                }
              : undefined,
          updatePayload:
            intent === "update_account_profile"
              ? {
                  name:
                    typeof payload.name === "string" ? payload.name : undefined,
                  inn:
                    typeof payload.inn === "string"
                      ? payload.inn
                      : payload.inn === null
                        ? null
                        : undefined,
                  type:
                    typeof payload.type === "string" ? payload.type : undefined,
                  status:
                    typeof payload.status === "string"
                      ? payload.status
                      : undefined,
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
                    typeof payload.riskCategory === "string"
                      ? payload.riskCategory
                      : undefined,
                  strategicValue:
                    typeof payload.strategicValue === "string"
                      ? payload.strategicValue
                      : undefined,
                }
              : undefined,
          contactId:
            typeof payload.contactId === "string"
              ? payload.contactId
              : resolveEntityId(params.request, ["contact"]),
          contactPayload:
            intent === "create_crm_contact" || intent === "update_crm_contact"
              ? {
                  firstName:
                    typeof payload.firstName === "string"
                      ? payload.firstName
                      : undefined,
                  lastName:
                    typeof payload.lastName === "string"
                      ? payload.lastName
                      : payload.lastName === null
                        ? null
                        : undefined,
                  role:
                    typeof payload.role === "string" ? payload.role : undefined,
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
            intent === "log_crm_interaction" ||
            intent === "update_crm_interaction" ||
            intent === "delete_crm_interaction"
              ? {
                  interactionId:
                    typeof payload.interactionId === "string"
                      ? payload.interactionId
                      : resolveEntityId(params.request, ["interaction"]),
                  type:
                    typeof payload.type === "string" ? payload.type : undefined,
                  summary:
                    typeof payload.summary === "string"
                      ? payload.summary
                      : intent === "log_crm_interaction"
                        ? buildInteractionSummary(params.request.message)
                        : undefined,
                  date:
                    typeof payload.date === "string" ? payload.date : undefined,
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
            intent === "create_crm_obligation" ||
            intent === "update_crm_obligation" ||
            intent === "delete_crm_obligation"
              ? {
                  obligationId:
                    typeof payload.obligationId === "string"
                      ? payload.obligationId
                      : resolveEntityId(params.request, ["obligation"]),
                  description:
                    typeof payload.description === "string"
                      ? payload.description
                      : intent === "create_crm_obligation"
                        ? buildObligationDescription(params.request.message)
                        : undefined,
                  dueDate:
                    typeof payload.dueDate === "string"
                      ? payload.dueDate
                      : undefined,
                  responsibleUserId:
                    typeof payload.responsibleUserId === "string"
                      ? payload.responsibleUserId
                      : payload.responsibleUserId === null
                        ? null
                        : undefined,
                  status:
                    typeof payload.status === "string"
                      ? payload.status
                      : undefined,
                }
              : undefined,
        },
        { kernel: params.kernel, request: params.request },
      );

      return {
        role: params.request.role,
        status: result.status,
        executionPath,
        structuredOutput: {
          summary: result.explain,
          data: result.data,
          missingContext: result.missingContext,
          intent,
        },
        toolCalls:
          result.toolCallsCount > 0
            ? [
                {
                  name: detectCrmTool(params.allowedToolCalls, intent),
                  result: result.data,
                },
              ]
            : [],
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
        fallbackUsed:
          result.fallbackUsed || executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "front_office_agent") {
      const payload = firstPayload(params.allowedToolCalls);
      const executionPath = this.resolveExecutionPath(
        params.allowedToolCalls,
        params.request,
      );
      const intent =
        this.resolveSemanticIngressIntent<
          ReturnType<typeof detectFrontOfficeIntent>
        >(params.request, "front_office_agent") ??
        (params.request.semanticRouting?.source === "primary"
          ? "classify_dialog_thread"
          : detectFrontOfficeIntent(params.allowedToolCalls));
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
              : params.request.workspaceContext?.route
                    ?.toLowerCase()
                    .includes("telegram")
                ? "telegram"
                : "web_chat",
          messageText:
            typeof payload.messageText === "string"
              ? payload.messageText
              : params.request.message,
          direction:
            payload.direction === "inbound" || payload.direction === "outbound"
              ? payload.direction
              : "inbound",
          threadExternalId:
            typeof payload.threadExternalId === "string"
              ? payload.threadExternalId
              : params.request.threadId,
          dialogExternalId:
            typeof payload.dialogExternalId === "string"
              ? payload.dialogExternalId
              : undefined,
          senderExternalId:
            typeof payload.senderExternalId === "string"
              ? payload.senderExternalId
              : undefined,
          recipientExternalId:
            typeof payload.recipientExternalId === "string"
              ? payload.recipientExternalId
              : undefined,
          route: params.request.workspaceContext?.route,
          targetOwnerRole:
            typeof payload.targetOwnerRole === "string"
              ? payload.targetOwnerRole
              : undefined,
        },
        { kernel: params.kernel, request: params.request },
      );

      return {
        role: params.request.role,
        status: result.status,
        executionPath,
        structuredOutput: {
          summary: result.explain,
          data: result.data,
          intent,
        },
        toolCalls:
          result.toolCallsCount > 0
            ? [
                {
                  name: detectFrontOfficeTool(params.allowedToolCalls, intent),
                  result: result.data,
                },
              ]
            : [],
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
        fallbackUsed:
          result.fallbackUsed || executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "contracts_agent") {
      const payload = firstPayload(params.allowedToolCalls);
      const executionPath = this.resolveExecutionPath(
        params.allowedToolCalls,
        params.request,
      );
      const intent = this.resolveContractsIntent(
        params.allowedToolCalls,
        params.request,
      );
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
            : resolveEntityId(params.request, ["contract"]),
        query:
          intent === "review_commerce_contract"
            ? typeof payload.query === "string"
              ? payload.query
              : extractContractReviewQuery(params.request.message)
            : undefined,
        obligationId:
          typeof payload.obligationId === "string"
            ? payload.obligationId
            : resolveEntityId(params.request, ["obligation"]),
        invoiceId:
          typeof payload.invoiceId === "string"
            ? payload.invoiceId
            : resolveEntityId(params.request, ["invoice"]),
        paymentId:
          typeof payload.paymentId === "string"
            ? payload.paymentId
            : resolveEntityId(params.request, ["payment"]),
        fulfillmentEventId:
          typeof payload.fulfillmentEventId === "string"
            ? payload.fulfillmentEventId
            : resolveEntityId(params.request, [
                "fulfillment_event",
                "fulfillment",
              ]),
        number:
          typeof payload.number === "string"
            ? payload.number
            : extractContractNumber(params.request.message),
        type:
          typeof payload.type === "string"
            ? payload.type
            : extractContractType(params.request.message),
        validFrom:
          typeof payload.validFrom === "string" ? payload.validFrom : undefined,
        validTo:
          typeof payload.validTo === "string" ? payload.validTo : undefined,
        jurisdictionId:
          typeof payload.jurisdictionId === "string"
            ? payload.jurisdictionId
            : undefined,
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
          payload.type === "DELIVER" ||
          payload.type === "PAY" ||
          payload.type === "PERFORM"
            ? payload.type
            : extractObligationType(params.request.message),
        dueDate:
          typeof payload.dueDate === "string" ? payload.dueDate : undefined,
        eventDomain:
          payload.eventDomain === "COMMERCIAL" ||
          payload.eventDomain === "PRODUCTION" ||
          payload.eventDomain === "LOGISTICS" ||
          payload.eventDomain === "FINANCE_ADJ"
            ? payload.eventDomain
            : extractEventDomain(params.request.message),
        eventType: isKnownFulfillmentEventType(payload.eventType)
          ? payload.eventType
          : extractEventType(params.request.message),
        eventDate:
          typeof payload.eventDate === "string" ? payload.eventDate : undefined,
        batchId:
          typeof payload.batchId === "string" ? payload.batchId : undefined,
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
            : extractSupplyType(params.request.message),
        vatPayerStatus:
          payload.vatPayerStatus === "PAYER" ||
          payload.vatPayerStatus === "NON_PAYER"
            ? payload.vatPayerStatus
            : undefined,
        subtotal:
          typeof payload.subtotal === "number" ? payload.subtotal : undefined,
        productTaxCode:
          typeof payload.productTaxCode === "string"
            ? payload.productTaxCode
            : undefined,
        payerPartyId:
          typeof payload.payerPartyId === "string"
            ? payload.payerPartyId
            : undefined,
        payeePartyId:
          typeof payload.payeePartyId === "string"
            ? payload.payeePartyId
            : undefined,
        amount: typeof payload.amount === "number" ? payload.amount : undefined,
        currency:
          typeof payload.currency === "string" ? payload.currency : undefined,
        paymentMethod:
          typeof payload.paymentMethod === "string"
            ? payload.paymentMethod
            : undefined,
        paidAt: typeof payload.paidAt === "string" ? payload.paidAt : undefined,
        allocatedAmount:
          typeof payload.allocatedAmount === "number"
            ? payload.allocatedAmount
            : undefined,
      });

      return {
        role: params.request.role,
        status: result.status,
        executionPath,
        structuredOutput: {
          summary: result.explain,
          data: result.data,
          missingContext: result.missingContext,
          intent,
        },
        toolCalls:
          result.toolCallsCount > 0
            ? [
                {
                  name: detectContractsTool(params.allowedToolCalls, intent),
                  result: result.data,
                },
              ]
            : [],
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
        fallbackUsed:
          result.fallbackUsed || executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "chief_agronomist") {
      const payload = firstPayload(params.allowedToolCalls);
      const executionPath = this.resolveExecutionPath(
        params.allowedToolCalls,
        params.request,
      );
      const intent = this.resolveChiefAgronomistIntent(params.request);
      const result = await this.chiefAgronomistAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent,
          query: params.request.message,
          context: {
            fieldId:
              typeof payload.fieldId === "string" ? payload.fieldId : undefined,
            techMapId:
              typeof payload.techMapId === "string"
                ? payload.techMapId
                : undefined,
            alertId:
              typeof payload.alertId === "string" ? payload.alertId : undefined,
          },
        },
        { kernel: params.kernel, request: params.request },
      );
      return {
        role: params.request.role,
        status: result.status,
        executionPath,
        structuredOutput: { summary: result.explain, data: result.data },
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
        fallbackUsed: executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    if (adapterRole === "data_scientist") {
      const payload = firstPayload(params.allowedToolCalls);
      const executionPath = this.resolveExecutionPath(
        params.allowedToolCalls,
        params.request,
      );
      const intent = this.resolveDataScientistIntent(params.request);
      const domains = Array.isArray(payload.domains)
        ? payload.domains.filter(
            (value): value is "agro" | "economics" | "finance" | "risk" =>
              value === "agro" ||
              value === "economics" ||
              value === "finance" ||
              value === "risk",
          )
        : undefined;
      const horizonDays =
        typeof payload.horizonDays === "number" &&
        [30, 90, 180, 365].includes(payload.horizonDays)
          ? (payload.horizonDays as 30 | 90 | 180 | 365)
          : undefined;
      const scopeLevel =
        payload.scopeLevel === "company" ||
        payload.scopeLevel === "farm" ||
        payload.scopeLevel === "field"
          ? payload.scopeLevel
          : undefined;
      const result = await this.dataScientistAgent.run(
        {
          companyId: params.actorContext.companyId,
          traceId: params.request.traceId,
          intent,
          scopeLevel,
          horizonDays,
          domains,
          fieldId:
            typeof payload.fieldId === "string" ? payload.fieldId : undefined,
          farmId:
            typeof payload.farmId === "string" ? payload.farmId : undefined,
          crop: typeof payload.crop === "string" ? payload.crop : undefined,
          seasonId:
            typeof payload.seasonId === "string" ? payload.seasonId : undefined,
          scenario:
            typeof payload.scenario === "object" ? payload.scenario : undefined,
        },
        { kernel: params.kernel, request: params.request },
      );
      return {
        role: params.request.role,
        status: result.status,
        executionPath,
        structuredOutput: { summary: result.explain, data: result.data },
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
        fallbackUsed: executionPath === "fallback_interpretation",
        outputContractVersion:
          params.kernel.outputContract.responseSchemaVersion,
        auditPayload,
      };
    }

    const executionPath = this.resolveExecutionPath(
      params.allowedToolCalls,
      params.request,
    );
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
      executionPath,
      structuredOutput: {
        summary: result.explain,
        resultType: "monitoring_signal",
        alertsEmitted: result.alertsEmitted,
        signalsSnapshot: result.signalsSnapshot ?? {},
      },
      toolCalls:
        result.status === "RATE_LIMITED"
          ? []
          : [
              {
                name: RaiToolName.EmitAlerts,
                result: result.signalsSnapshot ?? {},
              },
            ],
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
      fallbackUsed:
        result.fallbackUsed || executionPath === "fallback_interpretation",
      outputContractVersion: params.kernel.outputContract.responseSchemaVersion,
      auditPayload,
    };
  }

  private resolveExecutionPath(
    allowedToolCalls: RaiToolCallDto[],
    request: AgentExecutionRequest,
  ): ExecutionPath {
    if (request.semanticRouting?.source === "primary") {
      return "semantic_route_primary";
    }
    return allowedToolCalls.length > 0
      ? "explicit_tool_path"
      : "fallback_interpretation";
  }

  private resolveAgronomIntent(
    allowedToolCalls: RaiToolCallDto[],
    message: string,
    semanticRoutingSource?: "shadow" | "primary",
  ): { intent: AgronomIntent | null; executionPath: ExecutionPath } {
    const primaryExecutionPath =
      semanticRoutingSource === "primary"
        ? "semantic_route_primary"
        : "explicit_tool_path";

    if (
      allowedToolCalls.some(
        (call) => call.name === RaiToolName.ComputeDeviations,
      )
    ) {
      return {
        intent: "compute_deviations",
        executionPath: primaryExecutionPath,
      };
    }

    if (
      allowedToolCalls.some(
        (call) => call.name === RaiToolName.GenerateTechMapDraft,
      )
    ) {
      return {
        intent: "generate_tech_map_draft",
        executionPath: primaryExecutionPath,
      };
    }

    if (semanticRoutingSource === "primary") {
      return {
        intent: "generate_tech_map_draft",
        executionPath: "semantic_route_primary",
      };
    }

    const normalizedMessage = message.toLowerCase();
    if (/отклон|deviation/i.test(normalizedMessage)) {
      return {
        intent: "compute_deviations",
        executionPath: "fallback_interpretation",
      };
    }

    const mentionsTechMap = /(техкарт|techmap)/i.test(normalizedMessage);
    const hasCreateSignal =
      /(созд(ай|ать)|сдела(й|ть)|состав(ь|ить)|подготов(ь|ить)|сгенерируй|черновик|draft)/i.test(
        normalizedMessage,
      );
    if (mentionsTechMap && hasCreateSignal) {
      return {
        intent: "generate_tech_map_draft",
        executionPath: "fallback_interpretation",
      };
    }

    return {
      intent: null,
      executionPath: "fallback_interpretation",
    };
  }

  private resolveEconomistIntent(
    allowedToolCalls: RaiToolCallDto[],
    request: AgentExecutionRequest,
  ): EconomistIntent {
    const semanticIngressIntent = this.resolveSemanticIngressIntent<
      EconomistIntent
    >(request, "economist");
    if (semanticIngressIntent) {
      return semanticIngressIntent;
    }

    if (
      allowedToolCalls.some(
        (call) => call.name === RaiToolName.ComputeRiskAssessment,
      )
    ) {
      return "compute_risk_assessment";
    }

    if (
      allowedToolCalls.some((call) => call.name === RaiToolName.SimulateScenario)
    ) {
      return "simulate_scenario";
    }

    if (
      allowedToolCalls.some((call) => call.name === RaiToolName.ComputePlanFact)
    ) {
      return "compute_plan_fact";
    }

    const semanticEligibleTool =
      request.semanticRouting?.routeDecision?.eligibleTools?.[0] ?? null;
    if (semanticEligibleTool === RaiToolName.ComputeRiskAssessment) {
      return "compute_risk_assessment";
    }
    if (semanticEligibleTool === RaiToolName.SimulateScenario) {
      return "simulate_scenario";
    }
    if (semanticEligibleTool === RaiToolName.ComputePlanFact) {
      return "compute_plan_fact";
    }

    const sliceId = request.semanticRouting?.sliceId ?? null;
    if (sliceId === "finance.risk.analysis") {
      return "compute_risk_assessment";
    }
    if (sliceId === "finance.scenario.analysis") {
      return "simulate_scenario";
    }

    if (request.semanticRouting?.source === "primary") {
      return "compute_plan_fact";
    }

    const normalizedMessage = request.message.toLowerCase();
    if (/(сценар|scenario|what if|что если)/i.test(normalizedMessage)) {
      return "simulate_scenario";
    }
    if (/(риск|risk)/i.test(normalizedMessage)) {
      return "compute_risk_assessment";
    }
    return "compute_plan_fact";
  }

  private resolveEconomistToolName(
    intent: EconomistIntent,
    allowedToolCalls: RaiToolCallDto[],
  ): RaiToolName {
    const explicitTool = detectEconomistTool(allowedToolCalls);
    if (allowedToolCalls.length > 0) {
      return explicitTool;
    }
    switch (intent) {
      case "simulate_scenario":
        return RaiToolName.SimulateScenario;
      case "compute_risk_assessment":
        return RaiToolName.ComputeRiskAssessment;
      default:
        return RaiToolName.ComputePlanFact;
    }
  }

  private resolveCrmIntent(
    allowedToolCalls: RaiToolCallDto[],
    request: AgentExecutionRequest,
  ): CrmAgentIntent {
    const ingressIntent = this.resolveSemanticIngressIntent<CrmAgentIntent>(
      request,
      "crm_agent",
    );
    if (ingressIntent === "lookup_counterparty_by_inn") {
      return "lookup_counterparty_by_inn";
    }
    if (ingressIntent === "review_account_workspace") {
      return "review_account_workspace";
    }
    if (ingressIntent === "register_counterparty") {
      return "register_counterparty";
    }

    if (allowedToolCalls.length > 0) {
      return detectCrmIntent(allowedToolCalls, request.message);
    }

    const semanticTools = request.semanticRouting?.routeDecision?.eligibleTools ?? [];
    if (semanticTools.includes(RaiToolName.LookupCounterpartyByInn)) {
      return "lookup_counterparty_by_inn";
    }
    if (semanticTools.includes(RaiToolName.GetCrmAccountWorkspace)) {
      return "review_account_workspace";
    }
    if (semanticTools.includes(RaiToolName.RegisterCounterparty)) {
      return "register_counterparty";
    }

    const sliceId = request.semanticRouting?.sliceId ?? null;
    if (sliceId === "crm.counterparty.lookup") {
      return "lookup_counterparty_by_inn";
    }

    if (request.semanticRouting?.source === "primary") {
      return "review_account_workspace";
    }

    return "review_account_workspace";
  }

  private isReadOnlyTechMapQuery(message: string): boolean {
    const normalized = message.toLowerCase();
    const mentionsTechMap = /(техкарт|techmap)/i.test(normalized);
    if (!mentionsTechMap) {
      return false;
    }

    const hasCreateSignal =
      /(созд(ай|ать)|сдела(й|ть)|состав(ь|ить)|подготов(ь|ить)|сгенерируй|черновик|draft)/i.test(
        normalized,
      );
    const hasReadSignal =
      /(покаж|спис|все|какие|посмотр|найд|открой|где|выведи|реестр|активн|архив|заморож)/i.test(
        normalized,
      );
    return hasReadSignal && !hasCreateSignal;
  }

  private resolveAdapterRole(
    kernel: EffectiveAgentKernelEntry,
    fallbackRole: string,
  ): CanonicalAgentRuntimeRole {
    const adapterRole = (
      kernel.runtimeProfile as typeof kernel.runtimeProfile & {
        executionAdapterRole?: string;
      }
    ).executionAdapterRole;
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
    if (
      kernel.outputContract.requiresDeterministicValidation &&
      !deterministicBasisPresent
    ) {
      reasons.push("deterministic_basis_required");
    }
    return { passed: reasons.length === 0, reasons };
  }

  private resolveContractsIntent(
    allowedToolCalls: RaiToolCallDto[],
    request: AgentExecutionRequest,
  ): ContractsAgentInput["intent"] {
    const semanticIngressIntent =
      this.resolveSemanticIngressIntent<ContractsAgentInput["intent"]>(
        request,
        "contracts_agent",
      );
    if (semanticIngressIntent) {
      return semanticIngressIntent;
    }

    if (allowedToolCalls.length > 0) {
      return detectContractsIntent(allowedToolCalls, request.message);
    }

    const semanticTools = request.semanticRouting?.routeDecision?.eligibleTools ?? [];
    if (semanticTools.includes(RaiToolName.GetArBalance)) {
      return "review_ar_balance";
    }
    if (semanticTools.includes(RaiToolName.GetCommerceContract)) {
      return "review_commerce_contract";
    }
    if (semanticTools.includes(RaiToolName.ListCommerceContracts)) {
      return "list_commerce_contracts";
    }

    const sliceId = request.semanticRouting?.sliceId ?? null;
    if (sliceId === "contracts.ar-balance.review") {
      return "review_ar_balance";
    }

    if (request.semanticRouting?.source === "primary") {
      return "review_commerce_contract";
    }

    return "review_commerce_contract";
  }

  private resolveChiefAgronomistIntent(
    request: AgentExecutionRequest,
  ): "expert_opinion" | "alert_review" | "tech_map_review" {
    if (request.semanticRouting?.source === "primary") {
      return "expert_opinion";
    }

    const normalized = request.message.toLowerCase();
    if (normalized.includes("алерт") || normalized.includes("совет")) {
      return "alert_review";
    }
    return "expert_opinion";
  }

  private resolveDataScientistIntent(
    request: AgentExecutionRequest,
  ): Parameters<typeof detectDataScientistIntent>[0] extends string
    ? ReturnType<typeof detectDataScientistIntent>
    : never {
    if (request.semanticRouting?.source === "primary") {
      const sliceId = request.semanticRouting?.sliceId ?? null;
      if (sliceId === "finance.scenario.analysis") {
        return "what_if";
      }
      if (sliceId === "finance.risk.analysis") {
        return "strategy_forecast";
      }
      if (sliceId === "finance.plan-fact.read") {
        return "seasonal_report";
      }
      return "strategy_forecast";
    }

    return detectDataScientistIntent(request.message);
  }

  private resolveSemanticIngressIntent<T extends string>(
    request: AgentExecutionRequest,
    expectedRole: string,
  ): T | null {
    const semanticIngressIntent = request.semanticIngressFrame?.requestedOperation;
    if (
      semanticIngressIntent?.ownerRole !== expectedRole ||
      !semanticIngressIntent.intent
    ) {
      return null;
    }
    return semanticIngressIntent.intent as T;
  }
}
