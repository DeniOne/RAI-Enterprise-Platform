import { Body, Controller, Get, Param, Post, UseInterceptors } from "@nestjs/common";
import { BillingService } from "./services/billing.service";
import { CommerceContractService } from "./services/commerce-contract.service";
import { FulfillmentService } from "./services/fulfillment.service";
import { CreateCommerceContractDto } from "./dto/create-commerce-contract.dto";
import { CreateCommerceObligationDto } from "./dto/create-commerce-obligation.dto";
import { CreateFulfillmentEventDto } from "./dto/create-fulfillment-event.dto";
import { CreateInvoiceFromFulfillmentDto } from "./dto/create-invoice-from-fulfillment.dto";
import { CreatePaymentAllocationDto, CreatePaymentDto } from "./dto/create-payment.dto";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  COMMERCE_READ_ROLES,
  COMMERCE_WRITE_ROLES,
  FINANCE_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller("commerce")
export class CommerceController {
  constructor(
    private readonly contractService: CommerceContractService,
    private readonly fulfillmentService: FulfillmentService,
    private readonly billingService: BillingService,
  ) { }

  @Post("contracts")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createContract(@Body() dto: CreateCommerceContractDto) {
    return this.contractService.createContract(dto);
  }

  @Get("contracts")
  @Authorized(...COMMERCE_READ_ROLES)
  listContracts() {
    return this.contractService.listContracts();
  }

  @Post("obligations")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createObligation(@Body() dto: CreateCommerceObligationDto) {
    return this.contractService.createObligation(
      dto.contractId,
      dto.type,
      dto.dueDate ? new Date(dto.dueDate) : undefined,
    );
  }

  @Post("fulfillment-events")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createFulfillment(@Body() dto: CreateFulfillmentEventDto) {
    return this.fulfillmentService.createEvent(dto);
  }

  @Get("fulfillment")
  @Authorized(...COMMERCE_READ_ROLES)
  listFulfillment() {
    return this.fulfillmentService.listEvents();
  }

  @Post("invoices/from-fulfillment")
  @Authorized(...FINANCE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createInvoiceFromFulfillment(@Body() dto: CreateInvoiceFromFulfillmentDto) {
    return this.billingService.createInvoiceFromFulfillment(
      dto.fulfillmentEventId,
      {
        sellerJurisdiction: dto.sellerJurisdiction,
        buyerJurisdiction: dto.buyerJurisdiction,
        supplyType: dto.supplyType,
        vatPayerStatus: dto.vatPayerStatus,
        productTaxCode: dto.productTaxCode,
      },
      dto.subtotal,
    );
  }

  @Get("invoices")
  @Authorized(...FINANCE_ROLES)
  listInvoices() {
    return this.billingService.listInvoices();
  }

  @Post("invoices/:id/post")
  @Authorized(...FINANCE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  postInvoice(@Param("id") invoiceId: string) {
    return this.billingService.postInvoice(invoiceId);
  }

  @Post("payments")
  @Authorized(...FINANCE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.billingService.createPayment({
      payerPartyId: dto.payerPartyId,
      payeePartyId: dto.payeePartyId,
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: dto.paymentMethod,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
    });
  }

  @Get("payments")
  @Authorized(...FINANCE_ROLES)
  listPayments() {
    return this.billingService.listPayments();
  }

  @Post("payments/:id/confirm")
  @Authorized(...FINANCE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  confirmPayment(@Param("id") paymentId: string) {
    return this.billingService.confirmPayment(paymentId);
  }

  @Post("payment-allocations")
  @Authorized(...FINANCE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  allocatePayment(@Body() dto: CreatePaymentAllocationDto) {
    return this.billingService.allocatePayment(
      dto.paymentId,
      dto.invoiceId,
      dto.allocatedAmount,
    );
  }

  @Get("invoices/:id/ar-balance")
  @Authorized(...FINANCE_ROLES)
  getArBalance(@Param("id") invoiceId: string) {
    return this.billingService.getArBalance(invoiceId);
  }
}
