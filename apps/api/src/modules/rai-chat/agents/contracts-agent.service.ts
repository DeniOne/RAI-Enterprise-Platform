import { Injectable } from "@nestjs/common";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import {
  AllocatePaymentResult,
  ConfirmPaymentResult,
  CreateCommerceContractResult,
  CreateCommerceObligationResult,
  CreateFulfillmentEventResult,
  CreateInvoiceFromFulfillmentResult,
  CreatePaymentResult,
  GetArBalanceResult,
  GetCommerceContractResult,
  ListCommerceContractsResult,
  ListFulfillmentEventsResult,
  ListInvoicesResult,
  PostInvoiceResult,
  RaiToolActorContext,
  RaiToolName,
} from "../tools/rai-tools.types";
import { ContractsToolsRegistry } from "../tools/contracts-tools.registry";

export type ContractsAgentIntent =
  | "create_commerce_contract"
  | "list_commerce_contracts"
  | "review_commerce_contract"
  | "create_contract_obligation"
  | "create_fulfillment_event"
  | "create_invoice_from_fulfillment"
  | "post_invoice"
  | "create_payment"
  | "confirm_payment"
  | "allocate_payment"
  | "review_ar_balance";

export interface ContractsAgentInput {
  companyId: string;
  traceId: string;
  userId?: string;
  userRole?: string;
  userConfirmed?: boolean;
  intent: ContractsAgentIntent;
  contractId?: string;
  query?: string;
  obligationId?: string;
  invoiceId?: string;
  paymentId?: string;
  fulfillmentEventId?: string;
  number?: string;
  type?: string;
  validFrom?: string;
  validTo?: string;
  jurisdictionId?: string;
  regulatoryProfileId?: string;
  roles?: Array<{
    partyId: string;
    role:
      | "SELLER"
      | "BUYER"
      | "LESSOR"
      | "LESSEE"
      | "AGENT"
      | "PRINCIPAL"
      | "PAYER"
      | "BENEFICIARY";
    isPrimary?: boolean;
  }>;
  obligationType?: "DELIVER" | "PAY" | "PERFORM";
  dueDate?: string;
  eventDomain?: "COMMERCIAL" | "PRODUCTION" | "LOGISTICS" | "FINANCE_ADJ";
  eventType?:
    | "GOODS_SHIPMENT"
    | "SERVICE_ACT"
    | "LEASE_USAGE"
    | "MATERIAL_CONSUMPTION"
    | "HARVEST"
    | "INTERNAL_TRANSFER"
    | "WRITE_OFF";
  eventDate?: string;
  batchId?: string;
  itemId?: string;
  uom?: string;
  qty?: number;
  sellerJurisdiction?: string;
  buyerJurisdiction?: string;
  supplyType?: "GOODS" | "SERVICE" | "LEASE";
  vatPayerStatus?: "PAYER" | "NON_PAYER";
  subtotal?: number;
  productTaxCode?: string;
  payerPartyId?: string;
  payeePartyId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paidAt?: string;
  allocatedAmount?: number;
}

export interface ContractsAgentResult {
  agentName: "ContractsAgent";
  status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
  data: unknown;
  confidence: number;
  missingContext: string[];
  explain: string;
  toolCallsCount: number;
  traceId: string;
  evidence: EvidenceReference[];
  fallbackUsed: boolean;
}

const INTENT_TOOL: Record<ContractsAgentIntent, RaiToolName> = {
  create_commerce_contract: RaiToolName.CreateCommerceContract,
  list_commerce_contracts: RaiToolName.ListCommerceContracts,
  review_commerce_contract: RaiToolName.GetCommerceContract,
  create_contract_obligation: RaiToolName.CreateCommerceObligation,
  create_fulfillment_event: RaiToolName.CreateFulfillmentEvent,
  create_invoice_from_fulfillment: RaiToolName.CreateInvoiceFromFulfillment,
  post_invoice: RaiToolName.PostInvoice,
  create_payment: RaiToolName.CreatePayment,
  confirm_payment: RaiToolName.ConfirmPayment,
  allocate_payment: RaiToolName.AllocatePayment,
  review_ar_balance: RaiToolName.GetArBalance,
};

@Injectable()
export class ContractsAgent {
  constructor(private readonly contractsToolsRegistry: ContractsToolsRegistry) {}

  async run(input: ContractsAgentInput): Promise<ContractsAgentResult> {
    const missingContext = this.resolveMissingContext(input);
    if (missingContext.length > 0) {
      return {
        agentName: "ContractsAgent",
        status: "NEEDS_MORE_DATA",
        data: {},
        confidence: 0,
        missingContext,
        explain: `Не хватает контекста для commerce-операции: ${missingContext.join(", ")}`,
        toolCallsCount: 0,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: false,
      };
    }

    const actorContext: RaiToolActorContext = {
      companyId: input.companyId,
      traceId: input.traceId,
      userId: input.userId,
      userRole: input.userRole,
      userConfirmed: input.userConfirmed,
    };

    try {
      const toolName = INTENT_TOOL[input.intent];
      const data = await this.executeIntent(toolName, input, actorContext);
      return {
        agentName: "ContractsAgent",
        status: "COMPLETED",
        data,
        confidence: 0.93,
        missingContext: [],
        explain: this.explain(input.intent, data),
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: this.buildEvidence(input.intent, toolName, data),
        fallbackUsed: false,
      };
    } catch (error) {
      return {
        agentName: "ContractsAgent",
        status: "FAILED",
        data: {
          error: (error as Error)?.message ?? "unknown_error",
        },
        confidence: 0.12,
        missingContext: [],
        explain: `Commerce-операция не выполнена: ${String((error as Error)?.message ?? error)}`,
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: false,
      };
    }
  }

  private async executeIntent(
    toolName: RaiToolName,
    input: ContractsAgentInput,
    actorContext: RaiToolActorContext,
  ): Promise<unknown> {
    switch (toolName) {
      case RaiToolName.CreateCommerceContract:
        return this.contractsToolsRegistry.execute(
          toolName,
          {
            number: input.number,
            type: input.type,
            validFrom: input.validFrom,
            validTo: input.validTo,
            jurisdictionId: input.jurisdictionId,
            regulatoryProfileId: input.regulatoryProfileId,
            roles: input.roles,
          },
          actorContext,
        );
      case RaiToolName.ListCommerceContracts:
        return this.contractsToolsRegistry.execute(
          toolName,
          { limit: 20 },
          actorContext,
        );
      case RaiToolName.GetCommerceContract:
        return this.contractsToolsRegistry.execute(
          toolName,
          {
            ...(input.contractId ? { contractId: input.contractId } : {}),
            ...(input.query ? { query: input.query } : {}),
          },
          actorContext,
        );
      case RaiToolName.CreateCommerceObligation:
        return this.contractsToolsRegistry.execute(
          toolName,
          {
            contractId: input.contractId,
            type: input.obligationType,
            dueDate: input.dueDate,
          },
          actorContext,
        );
      case RaiToolName.CreateFulfillmentEvent:
        return this.contractsToolsRegistry.execute(
          toolName,
          {
            obligationId: input.obligationId,
            eventDomain: input.eventDomain,
            eventType: input.eventType,
            eventDate: input.eventDate,
            batchId: input.batchId,
            itemId: input.itemId,
            uom: input.uom,
            qty: input.qty,
          },
          actorContext,
        );
      case RaiToolName.CreateInvoiceFromFulfillment:
        return this.contractsToolsRegistry.execute(
          toolName,
          {
            fulfillmentEventId: input.fulfillmentEventId,
            sellerJurisdiction: input.sellerJurisdiction,
            buyerJurisdiction: input.buyerJurisdiction,
            supplyType: input.supplyType,
            vatPayerStatus: input.vatPayerStatus,
            subtotal: input.subtotal,
            productTaxCode: input.productTaxCode,
          },
          actorContext,
        );
      case RaiToolName.PostInvoice:
        return this.contractsToolsRegistry.execute(
          toolName,
          { invoiceId: input.invoiceId },
          actorContext,
        );
      case RaiToolName.CreatePayment:
        return this.contractsToolsRegistry.execute(
          toolName,
          {
            payerPartyId: input.payerPartyId,
            payeePartyId: input.payeePartyId,
            amount: input.amount,
            currency: input.currency,
            paymentMethod: input.paymentMethod,
            paidAt: input.paidAt,
          },
          actorContext,
        );
      case RaiToolName.ConfirmPayment:
        return this.contractsToolsRegistry.execute(
          toolName,
          { paymentId: input.paymentId },
          actorContext,
        );
      case RaiToolName.AllocatePayment:
        return this.contractsToolsRegistry.execute(
          toolName,
          {
            paymentId: input.paymentId,
            invoiceId: input.invoiceId,
            allocatedAmount: input.allocatedAmount,
          },
          actorContext,
        );
      case RaiToolName.GetArBalance:
        return this.contractsToolsRegistry.execute(
          toolName,
          { invoiceId: input.invoiceId },
          actorContext,
        );
      default:
        throw new Error(`Unsupported contracts tool: ${toolName}`);
    }
  }

  private resolveMissingContext(input: ContractsAgentInput): string[] {
    switch (input.intent) {
      case "create_commerce_contract": {
        const missing: string[] = [];
        if (!input.number) missing.push("number");
        if (!input.type) missing.push("type");
        if (!input.validFrom) missing.push("validFrom");
        if (!input.jurisdictionId) missing.push("jurisdictionId");
        if (!input.roles || input.roles.length === 0) missing.push("roles");
        return missing;
      }
      case "review_commerce_contract":
        return input.contractId || input.query ? [] : ["contractId"];
      case "create_contract_obligation": {
        const missing: string[] = [];
        if (!input.contractId) missing.push("contractId");
        if (!input.obligationType) missing.push("type");
        return missing;
      }
      case "create_fulfillment_event": {
        const missing: string[] = [];
        if (!input.obligationId) missing.push("obligationId");
        if (!input.eventDomain) missing.push("eventDomain");
        if (!input.eventType) missing.push("eventType");
        if (!input.eventDate) missing.push("eventDate");
        return missing;
      }
      case "create_invoice_from_fulfillment": {
        const missing: string[] = [];
        if (!input.fulfillmentEventId) missing.push("fulfillmentEventId");
        if (!input.sellerJurisdiction) missing.push("sellerJurisdiction");
        if (!input.buyerJurisdiction) missing.push("buyerJurisdiction");
        if (!input.supplyType) missing.push("supplyType");
        if (!input.vatPayerStatus) missing.push("vatPayerStatus");
        if (typeof input.subtotal !== "number") missing.push("subtotal");
        return missing;
      }
      case "post_invoice":
      case "review_ar_balance":
        return input.invoiceId ? [] : ["invoiceId"];
      case "create_payment": {
        const missing: string[] = [];
        if (!input.payerPartyId) missing.push("payerPartyId");
        if (!input.payeePartyId) missing.push("payeePartyId");
        if (typeof input.amount !== "number") missing.push("amount");
        if (!input.currency) missing.push("currency");
        if (!input.paymentMethod) missing.push("paymentMethod");
        return missing;
      }
      case "confirm_payment":
        return input.paymentId ? [] : ["paymentId"];
      case "allocate_payment": {
        const missing: string[] = [];
        if (!input.paymentId) missing.push("paymentId");
        if (!input.invoiceId) missing.push("invoiceId");
        if (typeof input.allocatedAmount !== "number") missing.push("allocatedAmount");
        return missing;
      }
      default:
        return [];
    }
  }

  private explain(intent: ContractsAgentIntent, data: unknown): string {
    switch (intent) {
      case "create_commerce_contract": {
        const result = data as CreateCommerceContractResult;
        return `Договор ${result.number} создан. Статус: ${result.status}.`;
      }
      case "list_commerce_contracts": {
        const result = data as ListCommerceContractsResult;
        return `В реестре найдено ${result.items.length} договоров.`;
      }
      case "review_commerce_contract": {
        const result = data as GetCommerceContractResult;
        return `Карточка договора ${result.number} загружена.`;
      }
      case "create_contract_obligation": {
        const result = data as CreateCommerceObligationResult;
        return `Обязательство ${result.id} создано для договора ${result.contractId}.`;
      }
      case "create_fulfillment_event": {
        const result = data as CreateFulfillmentEventResult;
        return `Событие исполнения ${result.id} зафиксировано.`;
      }
      case "create_invoice_from_fulfillment": {
        const result = data as CreateInvoiceFromFulfillmentResult;
        return `Счёт ${result.id} создан на сумму ${result.grandTotal.toLocaleString("ru-RU")} ₽.`;
      }
      case "post_invoice": {
        const result = data as PostInvoiceResult;
        return `Счёт ${result.id} проведён.`;
      }
      case "create_payment": {
        const result = data as CreatePaymentResult;
        return `Платёж ${result.id} создан на сумму ${result.amount.toLocaleString("ru-RU")} ${result.currency}.`;
      }
      case "confirm_payment": {
        const result = data as ConfirmPaymentResult;
        return `Платёж ${result.id} подтверждён.`;
      }
      case "allocate_payment": {
        const result = data as AllocatePaymentResult;
        return `Платёж ${result.paymentId} разнесён на счёт ${result.invoiceId}.`;
      }
      case "review_ar_balance": {
        const result = data as GetArBalanceResult;
        return `Дебиторский остаток по счёту ${result.invoiceId}: ${result.balance.toLocaleString("ru-RU")} ₽.`;
      }
      default:
        return "Commerce-операция выполнена.";
    }
  }

  private buildEvidence(
    intent: ContractsAgentIntent,
    toolName: RaiToolName,
    data: unknown,
  ): EvidenceReference[] {
    const sourceId = this.resolveEvidenceId(intent, data);
    return [
      {
        claim: `contracts_agent executed ${intent}`,
        sourceType: "TOOL_RESULT",
        sourceId,
        confidenceScore: 0.91,
      },
      {
        claim: `tool ${toolName} returned deterministic commerce state`,
        sourceType: "TOOL_RESULT",
        sourceId: toolName,
        confidenceScore: 0.88,
      },
    ];
  }

  private resolveEvidenceId(intent: ContractsAgentIntent, data: unknown): string {
    switch (intent) {
      case "create_commerce_contract":
        return (data as CreateCommerceContractResult).id;
      case "review_commerce_contract":
        return (data as GetCommerceContractResult).id;
      case "create_contract_obligation":
        return (data as CreateCommerceObligationResult).id;
      case "create_fulfillment_event":
        return (data as CreateFulfillmentEventResult).id;
      case "create_invoice_from_fulfillment":
        return (data as CreateInvoiceFromFulfillmentResult).id;
      case "post_invoice":
        return (data as PostInvoiceResult).id;
      case "create_payment":
        return (data as CreatePaymentResult).id;
      case "confirm_payment":
        return (data as ConfirmPaymentResult).id;
      case "allocate_payment":
        return (data as AllocatePaymentResult).id;
      case "review_ar_balance":
        return (data as GetArBalanceResult).invoiceId;
      default:
        return "commerce";
    }
  }
}
