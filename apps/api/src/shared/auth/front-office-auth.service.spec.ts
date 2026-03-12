import { UserAccessLevel, UserRole } from "@rai/prisma-client";
import { FrontOfficeAuthService } from "./front-office-auth.service";
import { SecretsService } from "../config/secrets.service";

describe("FrontOfficeAuthService", () => {
  const createPrismaMock = () => ({
    party: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    invitation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    counterpartyUserBinding: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  });

  const createService = () => {
    const prisma = createPrismaMock();
    const jwtService = {
      sign: jest.fn().mockReturnValue("jwt-token"),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "FRONTEND_URL") return "http://localhost:3000";
        if (key === "WEBAPP_URL") return null;
        if (key === "TELEGRAM_BOT_USERNAME") return "rai_test_bot";
        return null;
      }),
    };

    const service = new FrontOfficeAuthService(
      prisma as any,
      jwtService as any,
      configService as any,
      {
        getOptionalSecret: jest.fn().mockReturnValue("internal-secret"),
      } as unknown as SecretsService,
    );

    return {
      service,
      prisma,
      jwtService,
      configService,
    };
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("создает приглашение внешнему пользователю", async () => {
    const { service, prisma } = createService();
    jest.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
    } as any);

    prisma.party.findFirst.mockResolvedValue({
      id: "party-1",
      legalName: "ООО Агро Тест",
      shortName: "Агро Тест",
      registrationData: { inn: "7701234567" },
    });
    prisma.account.findFirst.mockResolvedValue({
      id: "acc-1",
      name: "Хозяйство 1",
      inn: "7701234567",
    });
    prisma.counterpartyUserBinding.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.invitation.updateMany.mockResolvedValue({ count: 0 });
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.invitation.create.mockResolvedValue({
      id: "inv-1",
      token: "token-1",
      shortCode: "123456",
      status: "PENDING",
      expiresAt: new Date("2026-03-15T00:00:00.000Z"),
      createdAt: new Date("2026-03-12T09:00:00.000Z"),
      telegramId: "777001",
      partyId: "party-1",
      clientId: "acc-1",
      partyContactId: "contact-1",
      proposedLogin: "agro_lopr",
      company: { id: "cmp-1", name: "RAI Demo" },
    });

    const result = await service.createInvitation(
      { userId: "u-admin", companyId: "cmp-1" },
      {
        partyId: "party-1",
        accountId: "acc-1",
        partyContactId: "contact-1",
        telegramId: "777001",
        proposedLogin: "agro_lopr",
        fullName: "Иван Иванов",
        position: "Генеральный директор",
      },
    );

    expect(result.invitation.id).toBe("inv-1");
    expect(result.account.id).toBe("acc-1");
    expect(result.links.botStartLink).toContain("rai_test_bot");
    expect(prisma.invitation.create).toHaveBeenCalledTimes(1);
    expect(prisma.party.update).toHaveBeenCalledTimes(1);
  });

  it("активирует приглашение и выдает токен", async () => {
    const { service, prisma, jwtService } = createService();

    prisma.invitation.findFirst.mockResolvedValue({
      id: "inv-2",
      token: "token-2",
      role: UserRole.FRONT_OFFICE_USER,
      status: "PENDING",
      expiresAt: new Date("2026-03-15T00:00:00.000Z"),
      telegramId: "777002",
      companyId: "cmp-1",
      clientId: "acc-2",
      partyId: "party-2",
      partyContactId: "contact-2",
      proposedLogin: "lopr_2",
      email: null,
      inviterId: "u-admin",
      createdAt: new Date("2026-03-12T10:00:00.000Z"),
      contactSnapshotJson: {
        fullName: "Петр Петров",
        phone: "+79990000000",
      },
      party: {
        id: "party-2",
        legalName: "ООО Поле",
        shortName: "Поле",
        registrationData: {
          contacts: [],
        },
      },
      client: {
        id: "acc-2",
        name: "Хозяйство 2",
      },
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.counterpartyUserBinding.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "u-fo-1",
      email: "fo+inv-2@rai.local",
      username: "lopr_2",
      name: "Петр Петров",
      role: UserRole.FRONT_OFFICE_USER,
      companyId: "cmp-1",
      accountId: "acc-2",
    });
    prisma.counterpartyUserBinding.upsert.mockResolvedValue({
      id: "binding-1",
      accountId: "acc-2",
      partyId: "party-2",
      partyContactId: "contact-2",
      status: "ACTIVE",
    });
    prisma.invitation.update.mockResolvedValue({
      id: "inv-2",
    });

    const result = await service.activateInvitation({
      token: "token-2",
      telegramId: "777002",
      username: "lopr_2",
      password: "StrongPass123",
    });

    expect(result.accessToken).toBe("jwt-token");
    expect(result.user.id).toBe("u-fo-1");
    expect(result.binding.id).toBe("binding-1");
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(prisma.party.update).toHaveBeenCalledTimes(1);
  });

  it("логинит внешнего пользователя по login и паролю", async () => {
    const { service, prisma } = createService();
    const passwordHash = (service as any).hashPassword("StrongPass123");

    prisma.user.findFirst.mockResolvedValue({
      id: "u-fo-2",
      email: "fo2@rai.local",
      username: "lopr_login",
      name: "Мария",
      role: UserRole.FRONT_OFFICE_USER,
      companyId: "cmp-2",
      accountId: "acc-22",
      passwordHash,
      accessLevel: UserAccessLevel.ACTIVE,
    });
    prisma.counterpartyUserBinding.findFirst.mockResolvedValue({
      id: "binding-22",
      accountId: "acc-22",
      partyId: "party-22",
    });

    const result = await service.loginWithPassword({
      username: "lopr_login",
      password: "StrongPass123",
    });

    expect(result.accessToken).toBe("jwt-token");
    expect(result.binding.id).toBe("binding-22");
    expect(result.user.username).toBe("lopr_login");
  });
});
