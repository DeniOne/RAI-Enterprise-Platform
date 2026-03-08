import { CrmToolsRegistry } from "./crm-tools.registry";
import { RaiToolName } from "./rai-tools.types";

describe("CrmToolsRegistry", () => {
  const prismaMock = {
    jurisdiction: {
      findFirst: jest.fn(),
    },
  };
  const partyServiceMock = {
    listParties: jest.fn(),
    createParty: jest.fn(),
    createPartyRelation: jest.fn(),
  };
  const partyLookupServiceMock = {
    lookup: jest.fn(),
  };
  const crmServiceMock = {
    createAccount: jest.fn(),
    getAccountWorkspace: jest.fn(),
    updateAccountProfile: jest.fn(),
    createContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
    createInteraction: jest.fn(),
    updateInteraction: jest.fn(),
    deleteInteraction: jest.fn(),
    createObligation: jest.fn(),
    updateObligation: jest.fn(),
    deleteObligation: jest.fn(),
  };

  let registry: CrmToolsRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new CrmToolsRegistry(
      prismaMock as never,
      partyServiceMock as never,
      partyLookupServiceMock as never,
      crmServiceMock as never,
    );
    registry.onModuleInit();
  });

  it("lookup_counterparty_by_inn возвращает найденные данные и existing party", async () => {
    partyLookupServiceMock.lookup.mockResolvedValue({
      status: "FOUND",
      source: "DADATA",
      fetchedAt: "2026-03-08T00:00:00.000Z",
      requestKey: "RU:LEGAL_ENTITY:2610000615:::",
      result: {
        legalName: "ООО Ромашка",
        requisites: { inn: "2610000615", kpp: "123456789" },
        addresses: [{ type: "LEGAL", full: "Ставропольский край" }],
        meta: { managerName: "Иванов И.И." },
      },
    });
    partyServiceMock.listParties.mockResolvedValue([
      {
        id: "party-1",
        legalName: "ООО Ромашка",
        registrationData: { inn: "2610000615" },
      },
    ]);

    const result = await registry.execute(
      RaiToolName.LookupCounterpartyByInn,
      { inn: "2610000615", jurisdictionCode: "RU" },
      { companyId: "company-1", traceId: "trace-1" },
    );

    expect(result.status).toBe("FOUND");
    expect(result.existingPartyId).toBe("party-1");
    expect(result.result?.legalName).toBe("ООО Ромашка");
  });

  it("register_counterparty создаёт нового контрагента при отсутствии дубликата", async () => {
    partyServiceMock.listParties.mockResolvedValue([]);
    partyLookupServiceMock.lookup.mockResolvedValue({
      status: "FOUND",
      source: "DADATA",
      fetchedAt: "2026-03-08T00:00:00.000Z",
      requestKey: "RU:LEGAL_ENTITY:2610000615:::",
      result: {
        legalName: "ООО Ромашка",
        shortName: "Ромашка",
        requisites: { inn: "2610000615", kpp: "123456789" },
        addresses: [{ type: "LEGAL", full: "Ставропольский край" }],
        meta: { managerName: "Иванов И.И." },
      },
    });
    prismaMock.jurisdiction.findFirst.mockResolvedValue({
      id: "jur-ru",
      code: "RU",
    });
    partyServiceMock.createParty.mockResolvedValue({
      id: "party-2",
      legalName: "ООО Ромашка",
      shortName: "Ромашка",
    });

    const result = await registry.execute(
      RaiToolName.RegisterCounterparty,
      { inn: "2610000615", jurisdictionCode: "RU" },
      { companyId: "company-1", traceId: "trace-2" },
    );

    expect(result.created).toBe(true);
    expect(result.partyId).toBe("party-2");
    expect(partyServiceMock.createParty).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({
        legalName: "ООО Ромашка",
        jurisdictionId: "jur-ru",
      }),
    );
  });

  it("create_crm_account создаёт CRM-аккаунт", async () => {
    crmServiceMock.createAccount.mockResolvedValue({
      id: "acc-1",
      name: "ООО Ромашка",
      inn: "2610000615",
      type: "CUSTOMER",
      holdingId: null,
      status: "ACTIVE",
    });

    const result = await registry.execute(
      RaiToolName.CreateCrmAccount,
      { name: "ООО Ромашка", inn: "2610000615" },
      { companyId: "company-1", traceId: "trace-3" },
    );

    expect(result.accountId).toBe("acc-1");
    expect(result.name).toBe("ООО Ромашка");
    expect(crmServiceMock.createAccount).toHaveBeenCalledWith(
      { name: "ООО Ромашка", inn: "2610000615", type: undefined, holdingId: undefined },
      "company-1",
    );
  });

  it("update_crm_contact обновляет контакт клиента", async () => {
    crmServiceMock.updateContact.mockResolvedValue({
      id: "contact-1",
      firstName: "Иван",
      lastName: "Петров",
      role: "DECISION_MAKER",
      email: "ivan@example.com",
      phone: "+79990000000",
    });

    const result = await registry.execute(
      RaiToolName.UpdateCrmContact,
      {
        contactId: "contact-1",
        role: "DECISION_MAKER",
        email: "ivan@example.com",
      },
      { companyId: "company-1", traceId: "trace-4" },
    );

    expect(result.contactId).toBe("contact-1");
    expect(result.role).toBe("DECISION_MAKER");
    expect(crmServiceMock.updateContact).toHaveBeenCalledWith(
      "contact-1",
      "company-1",
      expect.objectContaining({
        role: "DECISION_MAKER",
        email: "ivan@example.com",
      }),
    );
  });
});
