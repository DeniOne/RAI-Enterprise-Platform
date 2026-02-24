import { BillingService } from "./billing.service";
import { CommerceContractService } from "./commerce-contract.service";
import { FulfillmentService } from "./fulfillment.service";

function createPrismaMock() {
  const state = {
    parties: [
      { id: "party-seller", companyId: "c1" },
      { id: "party-buyer", companyId: "c1" },
      { id: "party-agent", companyId: "c1" },
    ],
    contracts: [] as any[],
    obligations: [] as any[],
    events: [] as any[],
    stockMoves: [] as any[],
    invoices: [] as any[],
    payments: [] as any[],
    allocations: [] as any[],
  };

  return {
    party: {
      findMany: jest.fn(async (args: any) => {
        const ids = args?.where?.id?.in ?? [];
        return state.parties.filter((p) => ids.includes(p.id));
      }),
    },
    commerceContract: {
      findUnique: jest.fn(async (args: any) =>
        state.contracts.find((c) => c.id === args.where.id) ?? null,
      ),
      create: jest.fn(async (args: any) => {
        const id = `cc-${state.contracts.length + 1}`;
        const contract = { id, ...args.data };
        const roles = (args.data.roles?.create ?? []).map((r: any, idx: number) => ({
          id: `ccr-${idx + 1}`,
          contractId: id,
          ...r,
        }));
        state.contracts.push({ ...contract, roles });
        return args.include?.roles ? { ...contract, roles } : contract;
      }),
    },
    commerceObligation: {
      create: jest.fn(async (args: any) => {
        const row = { id: `co-${state.obligations.length + 1}`, status: "OPEN", ...args.data };
        state.obligations.push(row);
        return row;
      }),
    },
    commerceFulfillmentEvent: {
      findUnique: jest.fn(async (args: any) => {
        const e = state.events.find((x) => x.id === args.where.id);
        if (!e) return null;
        if (args.include?.obligation) {
          const obligation = state.obligations.find((o) => o.id === e.obligationId);
          return { ...e, obligation };
        }
        return e;
      }),
      create: jest.fn(async (args: any) => {
        const row = { id: `cfe-${state.events.length + 1}`, ...args.data };
        state.events.push(row);
        return row;
      }),
    },
    stockMove: {
      create: jest.fn(async (args: any) => {
        const row = { id: `sm-${state.stockMoves.length + 1}`, ...args.data };
        state.stockMoves.push(row);
        return row;
      }),
    },
    invoice: {
      findUnique: jest.fn(async (args: any) =>
        state.invoices.find((i) => i.id === args.where.id) ?? null,
      ),
      create: jest.fn(async (args: any) => {
        const row = { id: `inv-${state.invoices.length + 1}`, ...args.data, ledgerTxId: null };
        state.invoices.push(row);
        return row;
      }),
      update: jest.fn(async (args: any) => {
        const idx = state.invoices.findIndex((i) => i.id === args.where.id);
        state.invoices[idx] = { ...state.invoices[idx], ...args.data };
        return state.invoices[idx];
      }),
    },
    payment: {
      findUnique: jest.fn(async (args: any) =>
        state.payments.find((p) => p.id === args.where.id) ?? null,
      ),
      create: jest.fn(async (args: any) => {
        const row = { id: `pay-${state.payments.length + 1}`, ...args.data, status: "DRAFT", ledgerTxId: null };
        state.payments.push(row);
        return row;
      }),
      update: jest.fn(async (args: any) => {
        const idx = state.payments.findIndex((p) => p.id === args.where.id);
        state.payments[idx] = { ...state.payments[idx], ...args.data };
        return state.payments[idx];
      }),
    },
    paymentAllocation: {
      findMany: jest.fn(async (args: any) =>
        state.allocations.filter((a) => a.invoiceId === args.where.invoiceId),
      ),
      create: jest.fn(async (args: any) => {
        const row = { id: `pa-${state.allocations.length + 1}`, ...args.data };
        state.allocations.push(row);
        return row;
      }),
    },
    __state: state,
  };
}

describe("Commerce e2e runtime flow", () => {
  it("runs Contract -> Obligation -> Fulfillment -> Invoice -> Payment -> Allocation", async () => {
    const prismaMock: any = createPrismaMock();
    const contractService = new CommerceContractService(prismaMock);
    const fulfillmentService = new FulfillmentService(prismaMock);
    const billingService = new BillingService(prismaMock);

    const contract = await contractService.createContract({
      number: "CC-2026-001",
      type: "SALE_OF_GOODS",
      validFrom: "2026-01-01T00:00:00.000Z",
      jurisdictionId: "jur-1",
      roles: [
        { partyId: "party-seller", role: "SELLER", isPrimary: true },
        { partyId: "party-buyer", role: "BUYER", isPrimary: true },
        { partyId: "party-agent", role: "AGENT", isPrimary: false },
      ],
    });

    expect(contract.roles).toHaveLength(3);

    const obligation = await contractService.createObligation(contract.id, "DELIVER");
    expect(obligation.type).toBe("DELIVER");

    const event = await fulfillmentService.createEvent({
      obligationId: obligation.id,
      eventDomain: "COMMERCIAL",
      eventType: "GOODS_SHIPMENT",
      eventDate: "2026-01-02T00:00:00.000Z",
      batchId: "batch-1",
      itemId: "item-1",
      uom: "kg",
      qty: 100,
    });
    expect(event.obligationId).toBe(obligation.id);

    const invoice = await billingService.createInvoiceFromFulfillment(
      event.id,
      {
        sellerJurisdiction: "RU",
        buyerJurisdiction: "RU",
        supplyType: "GOODS",
        vatPayerStatus: "PAYER",
      },
      1000,
    );
    expect(invoice.taxSnapshotJson).toBeDefined();

    const posted = await billingService.postInvoice(invoice.id);
    expect(posted.status).toBe("POSTED");
    expect(posted.ledgerTxId).toBeTruthy();

    const payment = await billingService.createPayment({
      payerPartyId: "party-buyer",
      payeePartyId: "party-seller",
      amount: 1000,
      currency: "RUB",
      paymentMethod: "BANK_TRANSFER",
    });

    const confirmed = await billingService.confirmPayment(payment.id);
    expect(confirmed.status).toBe("CONFIRMED");
    expect(confirmed.ledgerTxId).toBeTruthy();

    await billingService.allocatePayment(payment.id, invoice.id, 1000);
    const balance = await billingService.getArBalance(invoice.id);
    expect(balance).toBe(0);
  });
});
