import { ContractsToolsRegistry } from "./contracts-tools.registry";
import { CommerceContractService } from "../../commerce/services/commerce-contract.service";
import { FulfillmentService } from "../../commerce/services/fulfillment.service";
import { BillingService } from "../../commerce/services/billing.service";
import { RaiToolName } from "./rai-tools.types";

describe("ContractsToolsRegistry", () => {
  const contractService = {
    createContract: jest.fn(),
    listContracts: jest.fn(),
    createObligation: jest.fn(),
  } as unknown as CommerceContractService;
  const fulfillmentService = {
    createEvent: jest.fn(),
    listEvents: jest.fn(),
  } as unknown as FulfillmentService;
  const billingService = {
    createInvoiceFromFulfillment: jest.fn(),
    postInvoice: jest.fn(),
    listInvoices: jest.fn(),
    createPayment: jest.fn(),
    confirmPayment: jest.fn(),
    allocatePayment: jest.fn(),
    getArBalance: jest.fn(),
  } as unknown as BillingService;

  const createRegistry = () =>
    new ContractsToolsRegistry(
      contractService,
      fulfillmentService,
      billingService,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("list_commerce_contracts нормализует даты в строки", async () => {
    (contractService.listContracts as jest.Mock).mockResolvedValue([
      {
        id: "contract-1",
        number: "DOG-001",
        type: "SUPPLY",
        status: "ACTIVE",
        validFrom: new Date("2026-03-09T00:00:00.000Z"),
        validTo: null,
        createdAt: new Date("2026-03-09T01:00:00.000Z"),
        roles: [
          {
            id: "role-1",
            role: "BUYER",
            isPrimary: true,
            party: { id: "party-1", legalName: "ООО Ромашка" },
          },
        ],
      },
    ]);

    const registry = createRegistry();
    registry.onModuleInit();
    const result = await registry.execute(
      RaiToolName.ListCommerceContracts,
      { limit: 10 },
      { companyId: "company-1", traceId: "trace-1" },
    );

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: "contract-1",
        validFrom: "2026-03-09T00:00:00.000Z",
        createdAt: "2026-03-09T01:00:00.000Z",
      }),
    );
  });

  it("get_ar_balance проксирует billing service", async () => {
    (billingService.getArBalance as jest.Mock).mockResolvedValue(42000);

    const registry = createRegistry();
    registry.onModuleInit();
    const result = await registry.execute(
      RaiToolName.GetArBalance,
      { invoiceId: "invoice-1" },
      { companyId: "company-1", traceId: "trace-2" },
    );

    expect(result).toEqual({ invoiceId: "invoice-1", balance: 42000 });
    expect(billingService.getArBalance).toHaveBeenCalledWith("invoice-1");
  });
});
