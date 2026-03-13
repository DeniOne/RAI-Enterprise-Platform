import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  AllocatePaymentPayload,
  ConfirmPaymentPayload,
  CreateCommerceContractPayload,
  CreateCommerceObligationPayload,
  CreateFulfillmentEventPayload,
  CreateInvoiceFromFulfillmentPayload,
  CreatePaymentPayload,
  GetArBalancePayload,
  GetCommerceContractPayload,
  ListCommerceContractsPayload,
  ListFulfillmentEventsPayload,
  ListInvoicesPayload,
  PostInvoicePayload,
} from "./rai-tools.types";

export const createCommerceContractSchema: ObjectSchema<CreateCommerceContractPayload> =
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
  });

export const listCommerceContractsSchema: ObjectSchema<ListCommerceContractsPayload> =
  Joi.object<ListCommerceContractsPayload>({
    limit: Joi.number().integer().positive().max(100).optional(),
  });

export const getCommerceContractSchema: ObjectSchema<GetCommerceContractPayload> =
  Joi.object<GetCommerceContractPayload>({
    contractId: Joi.string().trim().required(),
  });

export const createCommerceObligationSchema: ObjectSchema<CreateCommerceObligationPayload> =
  Joi.object<CreateCommerceObligationPayload>({
    contractId: Joi.string().trim().required(),
    type: Joi.string().valid("DELIVER", "PAY", "PERFORM").required(),
    dueDate: Joi.string().trim().optional(),
  });

export const createFulfillmentEventSchema: ObjectSchema<CreateFulfillmentEventPayload> =
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
  });

export const listFulfillmentEventsSchema: ObjectSchema<ListFulfillmentEventsPayload> =
  Joi.object<ListFulfillmentEventsPayload>({
    contractId: Joi.string().trim().optional(),
    obligationId: Joi.string().trim().optional(),
  });

export const createInvoiceFromFulfillmentSchema: ObjectSchema<CreateInvoiceFromFulfillmentPayload> =
  Joi.object<CreateInvoiceFromFulfillmentPayload>({
    fulfillmentEventId: Joi.string().trim().required(),
    sellerJurisdiction: Joi.string().trim().required(),
    buyerJurisdiction: Joi.string().trim().required(),
    supplyType: Joi.string().valid("GOODS", "SERVICE", "LEASE").required(),
    vatPayerStatus: Joi.string().valid("PAYER", "NON_PAYER").required(),
    subtotal: Joi.number().positive().required(),
    productTaxCode: Joi.string().trim().optional(),
  });

export const postInvoiceSchema: ObjectSchema<PostInvoicePayload> =
  Joi.object<PostInvoicePayload>({
    invoiceId: Joi.string().trim().required(),
  });

export const listInvoicesSchema: ObjectSchema<ListInvoicesPayload> =
  Joi.object<ListInvoicesPayload>({
    contractId: Joi.string().trim().optional(),
  });

export const createPaymentSchema: ObjectSchema<CreatePaymentPayload> =
  Joi.object<CreatePaymentPayload>({
    payerPartyId: Joi.string().trim().required(),
    payeePartyId: Joi.string().trim().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().trim().required(),
    paymentMethod: Joi.string().trim().required(),
    paidAt: Joi.string().trim().optional(),
  });

export const confirmPaymentSchema: ObjectSchema<ConfirmPaymentPayload> =
  Joi.object<ConfirmPaymentPayload>({
    paymentId: Joi.string().trim().required(),
  });

export const allocatePaymentSchema: ObjectSchema<AllocatePaymentPayload> =
  Joi.object<AllocatePaymentPayload>({
    paymentId: Joi.string().trim().required(),
    invoiceId: Joi.string().trim().required(),
    allocatedAmount: Joi.number().positive().required(),
  });

export const getArBalanceSchema: ObjectSchema<GetArBalancePayload> =
  Joi.object<GetArBalancePayload>({
    invoiceId: Joi.string().trim().required(),
  });
