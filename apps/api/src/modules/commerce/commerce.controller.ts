import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { BillingService } from "./services/billing.service";
import { CommerceContractService } from "./services/commerce-contract.service";
import { FulfillmentService } from "./services/fulfillment.service";
import { CreateCommerceContractDto } from "./dto/create-commerce-contract.dto";
import { CreateCommerceObligationDto } from "./dto/create-commerce-obligation.dto";
import { CreateFulfillmentEventDto } from "./dto/create-fulfillment-event.dto";
import { CreateInvoiceFromFulfillmentDto } from "./dto/create-invoice-from-fulfillment.dto";
import { CreatePaymentAllocationDto, CreatePaymentDto } from "./dto/create-payment.dto";

@Controller("commerce")
export class CommerceController {
  constructor(
    private readonly contractService: CommerceContractService,
    private readonly fulfillmentService: FulfillmentService,
    private readonly billingService: BillingService,
  ) {}

  @Post("contracts")
  createContract(@Body() dto: CreateCommerceContractDto) {
    return this.contractService.createContract(dto);
  }

  @Post("obligations")
  createObligation(@Body() dto: CreateCommerceObligationDto) {
    return this.contractService.createObligation(
      dto.contractId,
      dto.type,
      dto.dueDate ? new Date(dto.dueDate) : undefined,
    );
  }

  @Post("fulfillment-events")
  createFulfillment(@Body() dto: CreateFulfillmentEventDto) {
    return this.fulfillmentService.createEvent(dto);
  }

  @Post("invoices/from-fulfillment")
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

  @Post("invoices/:id/post")
  postInvoice(@Param("id") invoiceId: string) {
    return this.billingService.postInvoice(invoiceId);
  }

  @Post("payments")
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

  @Post("payments/:id/confirm")
  confirmPayment(@Param("id") paymentId: string) {
    return this.billingService.confirmPayment(paymentId);
  }

  @Post("payment-allocations")
  allocatePayment(@Body() dto: CreatePaymentAllocationDto) {
    return this.billingService.allocatePayment(
      dto.paymentId,
      dto.invoiceId,
      dto.allocatedAmount,
    );
  }

  @Get("invoices/:id/ar-balance")
  getArBalance(@Param("id") invoiceId: string) {
    return this.billingService.getArBalance(invoiceId);
  }
}
