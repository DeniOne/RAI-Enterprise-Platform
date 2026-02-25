import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { RuleBasedTaxEngine, TaxContext, TaxEngine } from "../contracts/tax-engine";

@Injectable()
export class BillingService {
  private readonly taxEngine: TaxEngine = new RuleBasedTaxEngine();

  constructor(private readonly prisma: PrismaService) {}

  async listInvoices() {
    const invoices = await this.prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        contract: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      contract: invoice.contract,
      direction: invoice.direction,
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxTotal: Number(invoice.taxTotal),
      grandTotal: Number(invoice.grandTotal),
      createdAt: invoice.createdAt,
    }));
  }

  async listPayments() {
    const payments = await this.prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      include: {
        payerParty: {
          select: {
            id: true,
            legalName: true,
          },
        },
        payeeParty: {
          select: {
            id: true,
            legalName: true,
          },
        },
      },
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      paidAt: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      payerParty: payment.payerParty,
      payeeParty: payment.payeeParty,
      createdAt: payment.createdAt,
    }));
  }

  async createInvoiceFromFulfillment(
    fulfillmentEventId: string,
    taxContext: TaxContext,
    subtotal: number,
  ) {
    const event = await this.prisma.commerceFulfillmentEvent.findUnique({
      where: { id: fulfillmentEventId },
      include: { obligation: true },
    });

    if (!event) {
      throw new BadRequestException("Fulfillment event not found");
    }

    const tax = this.taxEngine.calculate(taxContext, subtotal);

    return this.prisma.invoice.create({
      data: {
        contractId: event.obligation.contractId,
        obligationId: event.obligationId,
        fulfillmentEventId,
        direction: "AR",
        status: "ISSUED",
        subtotal: String(subtotal),
        taxTotal: String(tax.taxAmount),
        grandTotal: String(subtotal + tax.taxAmount),
        taxSnapshotJson: tax,
      },
    });
  }

  async postInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      throw new BadRequestException("Invoice not found");
    }

    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "POSTED",
        ledgerTxId: invoice.ledgerTxId ?? `ledger-inv-${invoice.id}`,
      },
    });
  }

  async confirmPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new BadRequestException("Payment not found");
    }

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "CONFIRMED",
        ledgerTxId: payment.ledgerTxId ?? `ledger-pay-${payment.id}`,
      },
    });
  }

  async createPayment(params: {
    payerPartyId: string;
    payeePartyId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paidAt?: Date;
  }) {
    return this.prisma.payment.create({
      data: {
        payerPartyId: params.payerPartyId,
        payeePartyId: params.payeePartyId,
        amount: String(params.amount),
        currency: params.currency,
        paymentMethod: params.paymentMethod,
        paidAt: params.paidAt ?? new Date(),
      },
    });
  }

  async allocatePayment(paymentId: string, invoiceId: string, allocatedAmount: number) {
    const [payment, invoice] = await Promise.all([
      this.prisma.payment.findUnique({ where: { id: paymentId } }),
      this.prisma.invoice.findUnique({ where: { id: invoiceId } }),
    ]);

    if (!payment || !invoice) {
      throw new BadRequestException("Payment or invoice not found");
    }

    return this.prisma.paymentAllocation.create({
      data: {
        paymentId,
        invoiceId,
        allocatedAmount: String(allocatedAmount),
      },
    });
  }

  async getArBalance(invoiceId: string): Promise<number> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      throw new BadRequestException("Invoice not found");
    }

    const allocations = await this.prisma.paymentAllocation.findMany({
      where: { invoiceId },
      select: { allocatedAmount: true },
    });

    const allocated = allocations.reduce(
      (sum: number, a: { allocatedAmount: unknown }) => sum + Number(a.allocatedAmount),
      0,
    );

    return Number(invoice.grandTotal) - allocated;
  }
}
