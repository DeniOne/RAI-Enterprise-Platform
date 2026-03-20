import { ContractsAgent } from "./contracts-agent.service";
import { ContractsToolsRegistry } from "../tools/contracts-tools.registry";

describe("ContractsAgent", () => {
  const contractsToolsRegistryMock = {
    execute: jest.fn(),
  } as unknown as ContractsToolsRegistry;

  const agent = new ContractsAgent(contractsToolsRegistryMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create_commerce_contract вызывает contracts registry и возвращает COMPLETED", async () => {
    (contractsToolsRegistryMock.execute as jest.Mock).mockResolvedValue({
      id: "contract-1",
      number: "DOG-001",
      type: "SUPPLY",
      status: "DRAFT",
      validFrom: "2026-03-09T00:00:00.000Z",
      validTo: null,
      jurisdictionId: "jur-1",
      regulatoryProfileId: null,
      roles: [{ id: "role-1", partyId: "party-1", role: "BUYER", isPrimary: true }],
    });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-1",
      userId: "user-1",
      userConfirmed: true,
      intent: "create_commerce_contract",
      number: "DOG-001",
      type: "SUPPLY",
      validFrom: "2026-03-09T00:00:00.000Z",
      jurisdictionId: "jur-1",
      roles: [{ partyId: "party-1", role: "BUYER", isPrimary: true }],
    });

    expect(result.agentName).toBe("ContractsAgent");
    expect(result.status).toBe("COMPLETED");
    expect(result.toolCallsCount).toBe(1);
    expect(result.explain).toContain("DOG-001");
    expect(contractsToolsRegistryMock.execute).toHaveBeenCalledWith(
      "create_commerce_contract",
      expect.objectContaining({
        number: "DOG-001",
        type: "SUPPLY",
        jurisdictionId: "jur-1",
      }),
      expect.objectContaining({
        companyId: "company-1",
        traceId: "trace-1",
        userId: "user-1",
        userConfirmed: true,
      }),
    );
  });

  it("create_commerce_contract без обязательного контекста возвращает NEEDS_MORE_DATA", async () => {
    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-2",
      intent: "create_commerce_contract",
      number: "DOG-002",
    });

    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.missingContext).toEqual(
      expect.arrayContaining(["type", "validFrom", "jurisdictionId", "roles"]),
    );
  });

  it("review_ar_balance вызывает get_ar_balance", async () => {
    (contractsToolsRegistryMock.execute as jest.Mock).mockResolvedValue({
      invoiceId: "invoice-1",
      balance: 125000,
    });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-3",
      intent: "review_ar_balance",
      invoiceId: "invoice-1",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toContain("125");
    expect(contractsToolsRegistryMock.execute).toHaveBeenCalledWith(
      "get_ar_balance",
      { invoiceId: "invoice-1" },
      expect.objectContaining({
        companyId: "company-1",
        traceId: "trace-3",
      }),
    );
  });

  it("review_commerce_contract принимает query без contractId", async () => {
    (contractsToolsRegistryMock.execute as jest.Mock).mockResolvedValue({
      id: "contract-77",
      number: "DOG-077",
      type: "SUPPLY",
      status: "ACTIVE",
      validFrom: "2026-03-09T00:00:00.000Z",
      validTo: null,
      createdAt: "2026-03-09T00:00:00.000Z",
      roles: [],
    });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-4",
      intent: "review_commerce_contract",
      query: "DOG-077",
    });

    expect(result.status).toBe("COMPLETED");
    expect(contractsToolsRegistryMock.execute).toHaveBeenCalledWith(
      "get_commerce_contract",
      { query: "DOG-077" },
      expect.objectContaining({
        companyId: "company-1",
        traceId: "trace-4",
      }),
    );
  });
});
