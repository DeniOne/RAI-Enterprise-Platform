import { BadRequestException } from "@nestjs/common";
import { CrmService } from "./crm.service";

describe("CrmService hierarchy validation", () => {
  it("blocks account freeze when no linked fields", async () => {
    const prismaMock: any = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: "acc-1", holdingId: null, status: "ACTIVE" }),
        update: jest.fn(),
      },
      field: {
        count: jest.fn().mockResolvedValue(0),
      },
      holding: {
        findFirst: jest.fn(),
      },
    };

    const service = new CrmService(prismaMock);

    await expect(
      service.updateAccountProfile("acc-1", "company-1", { status: "FROZEN" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("allows account freeze when linked fields exist", async () => {
    const prismaMock: any = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: "acc-1", holdingId: null, status: "ACTIVE" }),
        update: jest.fn().mockResolvedValue({ id: "acc-1", status: "FROZEN" }),
      },
      field: {
        count: jest.fn().mockResolvedValue(2),
      },
      holding: {
        findFirst: jest.fn(),
      },
    };

    const service = new CrmService(prismaMock);

    await expect(
      service.updateAccountProfile("acc-1", "company-1", { status: "FROZEN" }),
    ).resolves.toMatchObject({ id: "acc-1", status: "FROZEN" });
  });

  it("createAccount связывает CRM-аккаунт с Party и проецирует контакты", async () => {
    const prismaMock: any = {
      account: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: "acc-1",
          name: "ООО Сысои",
          inn: "6217003600",
          partyId: "party-1",
          status: "ACTIVE",
        }),
        update: jest.fn(),
      },
      field: {
        count: jest.fn(),
      },
      holding: {
        findFirst: jest.fn(),
      },
      party: {
        findFirst: jest.fn().mockResolvedValue({
          id: "party-1",
          legalName: "ООО Сысои",
          shortName: "Сысои",
          type: "LEGAL_ENTITY",
          status: "ACTIVE",
          registrationData: {
            inn: "6217003600",
            meta: { managerName: "Евдокушин Петр Михайлович" },
          },
          jurisdiction: { code: "RU", name: "Россия" },
        }),
      },
      contact: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: "contact-1" }),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const service = new CrmService(prismaMock);

    const result = await service.createAccount(
      { name: "ООО Сысои", inn: "6217003600" },
      "company-1",
    );

    expect(result.partyId).toBe("party-1");
    expect(prismaMock.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          partyId: "party-1",
          inn: "6217003600",
        }),
      }),
    );
    expect(prismaMock.contact.create).toHaveBeenCalled();
  });

  it("updateAccountProfile пишет master-поля обратно в Party", async () => {
    const prismaMock: any = {
      account: {
        findFirst: jest.fn().mockResolvedValue({
          id: "acc-1",
          holdingId: null,
          status: "ACTIVE",
          partyId: "party-1",
        }),
        update: jest.fn().mockResolvedValue({
          id: "acc-1",
          status: "ACTIVE",
          name: "Сысои Юг",
          inn: "6217003600",
        }),
      },
      field: {
        count: jest.fn().mockResolvedValue(1),
      },
      holding: {
        findFirst: jest.fn(),
      },
      party: {
        findFirst: jest.fn().mockResolvedValue({
          id: "party-1",
          shortName: "Сысои",
          jurisdictionId: "jur-ru",
          registrationData: { inn: "0000000000", requisites: { inn: "0000000000" } },
        }),
        update: jest.fn().mockResolvedValue({ id: "party-1" }),
      },
      jurisdiction: {
        findFirst: jest.fn().mockResolvedValue({ id: "jur-ru" }),
      },
    };

    const service = new CrmService(prismaMock);

    await service.updateAccountProfile("acc-1", "company-1", {
      name: "Сысои Юг",
      inn: "6217003600",
      jurisdiction: "RU",
    });

    expect(prismaMock.party.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "party-1" },
        data: expect.objectContaining({
          shortName: "Сысои Юг",
          jurisdictionId: "jur-ru",
        }),
      }),
    );
  });
});
