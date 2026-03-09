import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import type { Prisma } from "@rai/prisma-client";
import { BillingService } from "../../commerce/services/billing.service";
import { CommerceContractService } from "../../commerce/services/commerce-contract.service";
import { FulfillmentService } from "../../commerce/services/fulfillment.service";
import {
  AllocatePaymentPayload,
  ConfirmPaymentPayload,
  CreateCommerceContractPayload,
  CreateCommerceContractResult,
  CreateCommerceObligationPayload,
  CreateCommerceObligationResult,
  CreateFulfillmentEventPayload,
  CreateFulfillmentEventResult,
  CreateInvoiceFromFulfillmentPayload,
  CreateInvoiceFromFulfillmentResult,
  CreatePaymentPayload,
  CreatePaymentResult,
  GetArBalancePayload,
  GetArBalanceResult,
  GetCommerceContractPayload,
  GetCommerceContractResult,
  ListCommerceContractsPayload,
  ListCommerceContractsResult,
  ListFulfillmentEventsPayload,
  ListFulfillmentEventsResult,
  ListInvoicesPayload,
  ListInvoicesResult,
  PostInvoicePayload,
  PostInvoiceResult,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  AllocatePaymentResult,
  ConfirmPaymentResult,
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
      Joi.object<CreateCommerceContractPayload>({
        number: Joi.string().trim().min(1).max(128).required(),
        type: Joi.string().trim().min(1).max(64).required(),
        validFrom: Joi.string().trim().required(),
        validTo: Joi.string().trim().optional(),
        jurisdictionId: Joi.string().trim().required(),
        regulatoryProfileId: Joi.string().trim().optional(),
        roles: Joi.array()
          .items(
            Joi.object({
              partyId: Joi.string().trim().required(),
              role: Joi.string()
                .valid(
                  "SELLER",
                  "BUYER",
                  "LESSOR",
                  "LESSEE",
                  "AGENT",
                  "PRINCIPAL",
                  "PAYER",
                  "BENEFICIARY",
                )
                .required(),
              isPrimary: Joi.boolean().optional(),
            }),
          )
          .min(1)
          .required(),
      }),
      async (payload) => {
        const created = await this.contractService.createContract(payload);
        return this.mapCreatedContract(created);
      },
    );

    this.register(
      RaiToolName.ListCommerceContracts,
      Joi.object<ListCommerceContractsPayload>({
        limit: Joi.number().integer().positive().max(100).optional(),
      }),
      async (payload) => {
        const items = await this.contractService.listContracts();
        return {
          items: (typeof payload.limit === "number" ? items.slice(0, payload.limit) : items).map(
            (item) => this.mapContractSummary(item),
          ),
        } satisfies ListCommerceContractsResult;
      },
    );

    this.register(
      RaiToolName.GetCommerceContract,
      Joi.object<GetCommerceContractPayload>({
        contractId: Joi.string().trim().required(),
      }),
      async (payload) => {
        const items = await this.contractService.listContracts();
        const contract = items.find((item) => item.id === payload.contractId);
        if (!contract) {
          throw new BadRequestException("Contract not found");
        }
        return this.mapContractSummary(contract) satisfies GetCommerceContractResult;
      },
    );

    this.register(
      RaiToolName.CreateCommerceObligation,
      Joi.object<CreateCommerceObligationPayload>({
        contractId: Joi.string().trim().required(),
        type: Joi.string().valid("DELIVER", "PAY", "PERFORM").required(),
        dueDate: Joi.string().trim().optional(),
      }),
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
      Joi.object<CreateFulfillmentEventPayload>({
        obligationId: Joi.string().trim().required(),
        eventDomain: Joi.string()
          .valid("COMMERCIAL", "PRODUCTION", "LOGISTICS", "FINANCE_ADJ")
          .required(),
        eventType: Joi.string()
          .valid(
            "GOODS_SHIPMENT",
            "SERVICE_ACT",
            "LEASE_USAGE",
            "MATERIAL_CONSUMPTION",
            "HARVEST",
            "INTERNAL_TRANSFER",
            "WRITE_OFF",
          )
          .required(),
        eventDate: Joi.string().trim().required(),
        batchId: Joi.string().trim().optional(),
        itemId: Joi.string().trim().optional(),
        uom: Joi.string().trim().optional(),
        qty: Joi.number().optional(),
      }),
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
      Joi.object<ListFulfillmentEventsPayload>({
        contractId: Joi.string().trim().optional(),
        obligationId: Joi.string().trim().optional(),
      }),
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
            payloadJson: this.normalizeJsonObject(item.payloadJson),
            createdAt: item.createdAt.toISOString(),
          })),
        } satisfies ListFulfillmentEventsResult;
      },
    );

    this.register(
      RaiToolName.CreateInvoiceFromFulfillment,
      Joi.object<CreateInvoiceFromFulfillmentPayload>({
        fulfillmentEventId: Joi.string().trim().required(),
        sellerJurisdiction: Joi.string().trim().required(),
        buyerJurisdiction: Joi.string().trim().required(),
        supplyType: Joi.string().valid("GOODS", "SERVICE", "LEASE").required(),
        vatPayerStatus: Joi.string().valid("PAYER", "NON_PAYER").required(),
        subtotal: Joi.number().positive().required(),
        productTaxCode: Joi.string().trim().optional(),
      }),
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
      Joi.object<PostInvoicePayload>({
        invoiceId: Joi.string().trim().required(),
      }),
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
      Joi.object<ListInvoicesPayload>({
        contractId: Joi.string().trim().optional(),
      }),
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
      Joi.object<CreatePaymentPayload>({
        payerPartyId: Joi.string().trim().required(),
        payeePartyId: Joi.string().trim().required(),
        amount: Joi.number().positive().required(),
        currency: Joi.string().trim().required(),
        paymentMethod: Joi.string().trim().required(),
        paidAt: Joi.string().trim().optional(),
      }),
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
      Joi.object<ConfirmPaymentPayload>({
        paymentId: Joi.string().trim().required(),
      }),
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
      Joi.object<AllocatePaymentPayload>({
        paymentId: Joi.string().trim().required(),
        invoiceId: Joi.string().trim().required(),
        allocatedAmount: Joi.number().positive().required(),
      }),
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
      Joi.object<GetArBalancePayload>({
        invoiceId: Joi.string().trim().required(),
      }),
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

  private mapCreatedContract(
    created: {
      id: string;
      number: string;
      type: string;
      status: string;
      validFrom: Date;
      validTo: Date | null;
      jurisdictionId: string;
      regulatoryProfileId: string | null;
      roles: Array<{
        id: string;
        partyId: string;
        role: string;
        isPrimary: boolean;
      }>;
    },
  ): CreateCommerceContractResult {
    return {
      id: created.id,
      number: created.number,
      type: created.type,
      status: created.status,
      validFrom: created.validFrom.toISOString(),
      validTo: created.validTo?.toISOString() ?? null,
      jurisdictionId: created.jurisdictionId,
      regulatoryProfileId: created.regulatoryProfileId,
      roles: created.roles.map((role) => ({
        id: role.id,
        partyId: role.partyId,
        role: role.role,
        isPrimary: role.isPrimary,
      })),
    };
  }

  private mapContractSummary(
    contract: {
      id: string;
      number: string;
      type: string;
      status: string;
      validFrom: Date;
      validTo: Date | null;
      createdAt: Date;
      roles: Array<{
        id: string;
        role: string;
        isPrimary: boolean;
        party: {
          id: string;
          legalName: string;
        };
      }>;
    },
  ): GetCommerceContractResult {
    return {
      id: contract.id,
      number: contract.number,
      type: contract.type,
      status: contract.status,
      validFrom: contract.validFrom.toISOString(),
      validTo: contract.validTo?.toISOString() ?? null,
      createdAt: contract.createdAt.toISOString(),
      roles: contract.roles.map((role) => ({
        id: role.id,
        role: role.role,
        isPrimary: role.isPrimary,
        party: role.party,
      })),
    };
  }

  private normalizeJsonObject(value: Prisma.JsonValue): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }
}
