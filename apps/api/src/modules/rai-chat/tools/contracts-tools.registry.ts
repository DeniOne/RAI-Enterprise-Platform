import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { ObjectSchema } from "joi";
import { BillingService } from "../../commerce/services/billing.service";
import { CommerceContractService } from "../../commerce/services/commerce-contract.service";
import { FulfillmentService } from "../../commerce/services/fulfillment.service";
import {
  mapContractSummary,
  mapCreatedContract,
  normalizeJsonObject,
} from "../../../shared/rai-chat/contracts-tool-helpers";
import {
  allocatePaymentSchema,
  confirmPaymentSchema,
  createCommerceContractSchema,
  createCommerceObligationSchema,
  createFulfillmentEventSchema,
  createInvoiceFromFulfillmentSchema,
  createPaymentSchema,
  getArBalanceSchema,
  getCommerceContractSchema,
  listCommerceContractsSchema,
  listFulfillmentEventsSchema,
  listInvoicesSchema,
  postInvoiceSchema,
} from "../../../shared/rai-chat/contracts-tool-schemas";
import {
  AllocatePaymentResult,
  ConfirmPaymentResult,
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
  RaiToolPayloadMap,
  RaiToolResultMap,
} from "./rai-tools.types";

const CONTRACTS_TOOL_NAMES: RaiToolName[] = [
  RaiToolName.CreateCommerceContract,
  RaiToolName.ListCommerceContracts,
  RaiToolName.GetCommerceContract,
  RaiToolName.CreateCommerceObligation,
  RaiToolName.CreateFulfillmentEvent,
  RaiToolName.ListFulfillmentEvents,
  RaiToolName.CreateInvoiceFromFulfillment,
  RaiToolName.PostInvoice,
  RaiToolName.ListInvoices,
  RaiToolName.CreatePayment,
  RaiToolName.ConfirmPayment,
  RaiToolName.AllocatePayment,
  RaiToolName.GetArBalance,
];

type ContractsToolName =
  | RaiToolName.CreateCommerceContract
  | RaiToolName.ListCommerceContracts
  | RaiToolName.GetCommerceContract
  | RaiToolName.CreateCommerceObligation
  | RaiToolName.CreateFulfillmentEvent
  | RaiToolName.ListFulfillmentEvents
  | RaiToolName.CreateInvoiceFromFulfillment
  | RaiToolName.PostInvoice
  | RaiToolName.ListInvoices
  | RaiToolName.CreatePayment
  | RaiToolName.ConfirmPayment
  | RaiToolName.AllocatePayment
  | RaiToolName.GetArBalance;

type ToolHandler<TName extends ContractsToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredContractsTool<TName extends ContractsToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

@Injectable()
export class ContractsToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<
    ContractsToolName,
    RegisteredContractsTool<ContractsToolName>
  >();

  constructor(
    private readonly contractService: CommerceContractService,
    private readonly fulfillmentService: FulfillmentService,
    private readonly billingService: BillingService,
  ) {}

  onModuleInit() {
    this.register(
      RaiToolName.CreateCommerceContract,
      createCommerceContractSchema,
      async (payload) => {
        const created = await this.contractService.createContract(payload);
        return mapCreatedContract(created);
      },
    );

    this.register(
      RaiToolName.ListCommerceContracts,
      listCommerceContractsSchema,
      async (payload) => {
        const items = await this.contractService.listContracts();
        return {
          items: (typeof payload.limit === "number" ? items.slice(0, payload.limit) : items).map(
            (item) => mapContractSummary(item),
          ),
        } satisfies ListCommerceContractsResult;
      },
    );

    this.register(
      RaiToolName.GetCommerceContract,
      getCommerceContractSchema,
      async (payload) => {
        const items = await this.contractService.listContracts();
        const contract = items.find((item) => item.id === payload.contractId);
        if (!contract) {
          throw new BadRequestException("Contract not found");
        }
        return mapContractSummary(contract) satisfies GetCommerceContractResult;
      },
    );

    this.register(
      RaiToolName.CreateCommerceObligation,
      createCommerceObligationSchema,
      async (payload) => {
        const created = await this.contractService.createObligation(
          payload.contractId,
          payload.type,
          payload.dueDate ? new Date(payload.dueDate) : undefined,
        );
        return {
          id: created.id,
          contractId: created.contractId,
          type: created.type,
          status: created.status,
          dueDate: created.dueDate?.toISOString() ?? null,
          createdAt: created.createdAt.toISOString(),
        } satisfies CreateCommerceObligationResult;
      },
    );

    this.register(
      RaiToolName.CreateFulfillmentEvent,
      createFulfillmentEventSchema,
      async (payload) => {
        const created = await this.fulfillmentService.createEvent(payload);
        return {
          id: created.id,
          obligationId: created.obligationId,
          eventDomain: created.eventDomain,
          eventType: created.eventType,
          eventDate: created.eventDate.toISOString(),
          payloadJson:
            created.payloadJson && typeof created.payloadJson === "object"
              ? (created.payloadJson as Record<string, unknown>)
              : null,
          createdAt: created.createdAt.toISOString(),
        } satisfies CreateFulfillmentEventResult;
      },
    );

    this.register(
      RaiToolName.ListFulfillmentEvents,
      listFulfillmentEventsSchema,
      async (payload) => {
        const items = await this.fulfillmentService.listEvents();
        return {
          items: items.filter((item) => {
            if (payload.contractId && item.contract?.id !== payload.contractId) {
              return false;
            }
            if (payload.obligationId && item.obligationId !== payload.obligationId) {
              return false;
            }
            return true;
          }).map((item) => ({
            id: item.id,
            obligationId: item.obligationId,
            eventDomain: item.eventDomain,
            eventType: item.eventType,
            eventDate: item.eventDate.toISOString(),
            contract: item.contract,
            payloadJson: normalizeJsonObject(item.payloadJson),
            createdAt: item.createdAt.toISOString(),
          })),
        } satisfies ListFulfillmentEventsResult;
      },
    );

    this.register(
      RaiToolName.CreateInvoiceFromFulfillment,
      createInvoiceFromFulfillmentSchema,
      async (payload) => {
        const created = await this.billingService.createInvoiceFromFulfillment(
          payload.fulfillmentEventId,
          {
            sellerJurisdiction: payload.sellerJurisdiction,
            buyerJurisdiction: payload.buyerJurisdiction,
            supplyType: payload.supplyType,
            vatPayerStatus: payload.vatPayerStatus,
            productTaxCode: payload.productTaxCode,
          },
          payload.subtotal,
        );
        return {
          id: created.id,
          contractId: created.contractId,
          obligationId: created.obligationId,
          fulfillmentEventId: created.fulfillmentEventId,
          direction: created.direction,
          status: created.status,
          subtotal: Number(created.subtotal),
          taxTotal: Number(created.taxTotal),
          grandTotal: Number(created.grandTotal),
        } satisfies CreateInvoiceFromFulfillmentResult;
      },
    );

    this.register(
      RaiToolName.PostInvoice,
      postInvoiceSchema,
      async (payload) => {
        const posted = await this.billingService.postInvoice(payload.invoiceId);
        return {
          id: posted.id,
          status: posted.status,
          ledgerTxId: posted.ledgerTxId,
        } satisfies PostInvoiceResult;
      },
    );

    this.register(
      RaiToolName.ListInvoices,
      listInvoicesSchema,
      async (payload) => {
        const items = await this.billingService.listInvoices();
        return {
          items: items
            .filter((item) =>
              payload.contractId ? item.contract?.id === payload.contractId : true,
            )
            .map((item) => ({
              id: item.id,
              contract: item.contract,
              direction: item.direction,
              status: item.status,
              subtotal: Number(item.subtotal),
              taxTotal: Number(item.taxTotal),
              grandTotal: Number(item.grandTotal),
              createdAt: item.createdAt.toISOString(),
            })),
        } satisfies ListInvoicesResult;
      },
    );

    this.register(
      RaiToolName.CreatePayment,
      createPaymentSchema,
      async (payload) => {
        const created = await this.billingService.createPayment({
          payerPartyId: payload.payerPartyId,
          payeePartyId: payload.payeePartyId,
          amount: payload.amount,
          currency: payload.currency,
          paymentMethod: payload.paymentMethod,
          paidAt: payload.paidAt ? new Date(payload.paidAt) : undefined,
        });
        return {
          id: created.id,
          payerPartyId: created.payerPartyId,
          payeePartyId: created.payeePartyId,
          amount: Number(created.amount),
          currency: created.currency,
          paymentMethod: created.paymentMethod,
          status: created.status,
          paidAt: created.paidAt.toISOString(),
        } satisfies CreatePaymentResult;
      },
    );

    this.register(
      RaiToolName.ConfirmPayment,
      confirmPaymentSchema,
      async (payload) => {
        const confirmed = await this.billingService.confirmPayment(payload.paymentId);
        return {
          id: confirmed.id,
          status: confirmed.status,
          ledgerTxId: confirmed.ledgerTxId,
        } satisfies ConfirmPaymentResult;
      },
    );

    this.register(
      RaiToolName.AllocatePayment,
      allocatePaymentSchema,
      async (payload) => {
        const allocation = await this.billingService.allocatePayment(
          payload.paymentId,
          payload.invoiceId,
          payload.allocatedAmount,
        );
        return {
          id: allocation.id,
          paymentId: allocation.paymentId,
          invoiceId: allocation.invoiceId,
          allocatedAmount: Number(allocation.allocatedAmount),
        } satisfies AllocatePaymentResult;
      },
    );

    this.register(
      RaiToolName.GetArBalance,
      getArBalanceSchema,
      async (payload) => ({
        invoiceId: payload.invoiceId,
        balance: await this.billingService.getArBalance(payload.invoiceId),
      } satisfies GetArBalanceResult),
    );
  }

  has(name: RaiToolName): boolean {
    return CONTRACTS_TOOL_NAMES.includes(name);
  }

  async execute<TName extends ContractsToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new BadRequestException(`Unknown contracts tool: ${name}`);
    }

    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });

    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for contracts tool ${name}: ${validation.error.message}`,
      );
    }

    return tool.handler(
      validation.value as RaiToolPayloadMap[TName],
      actorContext,
    ) as Promise<RaiToolResultMap[TName]>;
  }

  private register<TName extends ContractsToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`RAI_CONTRACTS_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }

    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredContractsTool<ContractsToolName>);
  }
}
