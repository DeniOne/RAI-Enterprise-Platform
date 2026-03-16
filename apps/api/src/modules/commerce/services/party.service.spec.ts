import { PartyService } from "./party.service";

describe("PartyService account projection", () => {
  it("создаёт CRM-проекцию и контакты при создании Party", async () => {
    const prismaMock: any = {
      jurisdiction: {
        findFirst: jest.fn().mockResolvedValue({ id: "jur-ru" }),
      },
      regulatoryProfile: {
        findFirst: jest.fn(),
      },
      party: {
        create: jest.fn().mockResolvedValue({
          id: "party-1",
          legalName: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СЫСОИ"',
          shortName: 'ООО "СЫСОИ"',
          type: "LEGAL_ENTITY",
          status: "ACTIVE",
          registrationData: {
            inn: "6217003600",
            meta: { managerName: "Евдокушин Петр Михайлович" },
          },
          jurisdiction: { code: "RU", name: "Россия" },
          regulatoryProfile: null,
        }),
      },
      account: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              id: "acc-1",
              name: 'ООО "СЫСОИ"',
              inn: "6217003600",
              status: "ACTIVE",
              partyId: "party-1",
              updatedAt: new Date("2026-03-16T10:00:00.000Z"),
            },
          ]),
        create: jest.fn().mockResolvedValue({
          id: "acc-1",
          name: 'ООО "СЫСОИ"',
        }),
        update: jest.fn(),
      },
      contact: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: "contact-1" }),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const service = new PartyService(prismaMock);

    const result = await service.createParty("company-1", {
      legalName: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СЫСОИ"',
      shortName: 'ООО "СЫСОИ"',
      jurisdictionId: "jur-ru",
      registrationData: {
        inn: "6217003600",
        meta: { managerName: "Евдокушин Петр Михайлович" },
      },
    });

    expect(prismaMock.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: "company-1",
          partyId: "party-1",
          inn: "6217003600",
        }),
      }),
    );
    expect(prismaMock.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: "acc-1",
          source: expect.stringContaining("PARTY_SYNC:party-1:meta_manager"),
        }),
      }),
    );
    expect((result as any).linkedAccount?.id).toBe("acc-1");
  });
});
