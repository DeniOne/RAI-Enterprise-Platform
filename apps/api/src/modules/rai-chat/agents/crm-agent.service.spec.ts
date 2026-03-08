import { CrmAgent } from "./crm-agent.service";
import { CrmToolsRegistry } from "../tools/crm-tools.registry";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";

describe("CrmAgent", () => {
  const crmToolsRegistryMock = {
    execute: jest.fn(),
  } as unknown as CrmToolsRegistry;

  const openRouterMock = {
    generate: jest.fn(),
  } as unknown as OpenRouterGatewayService;

  const promptAssemblyMock = {
    buildMessages: jest.fn().mockReturnValue([]),
  } as unknown as AgentPromptAssemblyService;

  const agent = new CrmAgent(
    crmToolsRegistryMock,
    openRouterMock,
    promptAssemblyMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("register_counterparty вызывает CRM registry и возвращает COMPLETED", async () => {
    (crmToolsRegistryMock.execute as jest.Mock).mockResolvedValue({
      created: true,
      source: "DADATA",
      partyId: "party-1",
      legalName: "ООО Ромашка",
      inn: "2610000615",
      jurisdictionCode: "RU",
      lookupStatus: "FOUND",
      alreadyExisted: false,
    });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-1",
      userId: "user-1",
      userConfirmed: true,
      intent: "register_counterparty",
      inn: "2610000615",
    });

    expect(result.agentName).toBe("CrmAgent");
    expect(result.status).toBe("COMPLETED");
    expect(result.toolCallsCount).toBe(1);
    expect(result.explain).toContain("ООО Ромашка");
    expect(crmToolsRegistryMock.execute).toHaveBeenCalledWith(
      "register_counterparty",
      {
        inn: "2610000615",
        jurisdictionCode: undefined,
        partyType: undefined,
      },
      {
        companyId: "company-1",
        traceId: "trace-1",
        userId: "user-1",
        userConfirmed: true,
        userRole: undefined,
      },
    );
  });

  it("create_counterparty_relation без обязательного контекста возвращает NEEDS_MORE_DATA", async () => {
    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-2",
      intent: "create_counterparty_relation",
      fromPartyId: "party-1",
    });

    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.missingContext).toEqual(
      expect.arrayContaining(["toPartyId", "relationType", "validFrom"]),
    );
  });

  it("create_crm_account создаёт CRM-аккаунт через registry", async () => {
    (crmToolsRegistryMock.execute as jest.Mock).mockResolvedValue({
      accountId: "acc-1",
      name: "ООО Ромашка",
      inn: "2610000615",
      status: "ACTIVE",
    });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-3",
      intent: "create_crm_account",
      accountPayload: {
        name: "ООО Ромашка",
        inn: "2610000615",
      },
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toContain("CRM-аккаунт");
    expect(crmToolsRegistryMock.execute).toHaveBeenCalledWith(
      "create_crm_account",
      {
        name: "ООО Ромашка",
        inn: "2610000615",
        type: undefined,
        holdingId: undefined,
      },
      {
        companyId: "company-1",
        traceId: "trace-3",
      },
    );
  });

  it("update_crm_obligation без obligationId возвращает NEEDS_MORE_DATA", async () => {
    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-4",
      intent: "update_crm_obligation",
      obligationPayload: {
        status: "FULFILLED",
      },
    });

    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.missingContext).toContain("obligationId");
  });
});
