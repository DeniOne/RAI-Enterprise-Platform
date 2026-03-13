import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  CounterpartyUserBindingStatus,
  InvitationStatus,
  UserAccessLevel,
  UserRole,
} from "@rai/prisma-client";
import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { SecretsService } from "../config/secrets.service";
import {
  ActivateFrontOfficeInvitationDto,
  CreateFrontOfficeInvitationDto,
  FrontOfficePasswordLoginDto,
  SetFrontOfficePasswordDto,
} from "./front-office-auth.dto";

interface ActorContext {
  userId: string;
  companyId: string;
}

interface ContactSnapshot {
  fullName?: string | null;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
}

type PartyContactAccessStatus = "INVITED" | "ACTIVE" | "REVOKED";

@Injectable()
export class FrontOfficeAuthService {
  private readonly inviteTtlMs = 72 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
  ) {}

  async createInvitation(actor: ActorContext, dto: CreateFrontOfficeInvitationDto) {
    const party = await this.prisma.party.findFirst({
      where: { companyId: actor.companyId, id: dto.partyId },
      select: {
        id: true,
        legalName: true,
        shortName: true,
        registrationData: true,
      },
    });
    if (!party) {
      throw new NotFoundException("Контрагент не найден");
    }

    const account = await this.resolveAccount(actor.companyId, party, dto.accountId);
    const telegramId = this.normalizeTelegramId(dto.telegramId);
    const proposedLogin = this.normalizeUsername(dto.proposedLogin);
    const contactSnapshot = this.buildContactSnapshot(dto);
    const partyContactId =
      this.normalizeOptional(dto.partyContactId) ??
      this.buildPartyContactId(contactSnapshot, telegramId);

    const activeBinding = await this.prisma.counterpartyUserBinding.findFirst({
      where: {
        companyId: actor.companyId,
        telegramId,
        status: CounterpartyUserBindingStatus.ACTIVE,
      },
    });
    if (activeBinding) {
      if (activeBinding.accountId !== account.id) {
        throw new ConflictException(
          "Этот Telegram ID уже привязан к другому контрагенту",
        );
      }

      throw new ConflictException(
        "Этот Telegram ID уже активирован для данного контрагента",
      );
    }

    if (proposedLogin) {
      const existingLoginUser = await this.prisma.user.findFirst({
        where: { username: proposedLogin },
        select: { id: true },
      });
      if (existingLoginUser) {
        throw new ConflictException("Указанный login уже занят");
      }
    }

    await this.prisma.invitation.updateMany({
      where: {
        companyId: actor.companyId,
        role: UserRole.FRONT_OFFICE_USER,
        telegramId,
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.REVOKED },
    });

    const token = randomUUID();
    const shortCode = await this.generateShortCode();
    const links = this.buildLinks(token, shortCode);

    const invitation = await this.prisma.invitation.create({
      data: {
        token,
        shortCode,
        telegramId,
        inviterId: actor.userId,
        role: UserRole.FRONT_OFFICE_USER,
        accessLevel: UserAccessLevel.INVITED,
        companyId: actor.companyId,
        clientId: account.id,
        partyId: party.id,
        partyContactId,
        proposedLogin: proposedLogin ?? null,
        email: this.normalizeEmail(dto.email),
        metadataJson: {
          activationUrl: links.activationUrl,
          botStartLink: links.botStartLink,
        } as any,
        contactSnapshotJson: contactSnapshot as any,
        expiresAt: new Date(Date.now() + this.inviteTtlMs),
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    await this.syncPartyContactRegistrationData({
      partyId: party.id,
      registrationData: party.registrationData,
      partyContactId,
      snapshot: contactSnapshot,
      telegramId,
      status: "INVITED",
      invitationId: invitation.id,
      proposedLogin: proposedLogin ?? null,
      invitedAt: invitation.createdAt,
    });

    const delivery = await this.sendInviteNotification({
      telegramId,
      companyName: invitation.company.name,
      counterpartyName: party.shortName || party.legalName,
      activationUrl: links.activationUrl,
      botStartLink: links.botStartLink,
      contactName: contactSnapshot.fullName ?? null,
    });

    return {
      invitation: {
        id: invitation.id,
        token: invitation.token,
        shortCode: invitation.shortCode,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        telegramId: invitation.telegramId,
        partyId: invitation.partyId,
        accountId: invitation.clientId,
        partyContactId: invitation.partyContactId,
        proposedLogin: invitation.proposedLogin,
      },
      counterparty: {
        id: party.id,
        name: party.shortName || party.legalName,
      },
      account: {
        id: account.id,
        name: account.name,
      },
      contact: {
        partyContactId,
        ...contactSnapshot,
      },
      links,
      delivery,
    };
  }

  async getInvitationPreview(token: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { token },
      include: {
        company: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        party: { select: { id: true, legalName: true, shortName: true } },
      },
    });
    if (!invitation || invitation.role !== UserRole.FRONT_OFFICE_USER) {
      throw new NotFoundException("Приглашение не найдено");
    }

    return {
      id: invitation.id,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      company: invitation.company,
      account: invitation.client,
      party: invitation.party
        ? {
            id: invitation.party.id,
            name: invitation.party.shortName || invitation.party.legalName,
          }
        : null,
      contact: (invitation.contactSnapshotJson ?? null) as ContactSnapshot | null,
      proposedLogin: invitation.proposedLogin ?? null,
      activationUrl: (invitation.metadataJson as any)?.activationUrl ?? null,
      botStartLink: (invitation.metadataJson as any)?.botStartLink ?? null,
    };
  }

  async activateInvitation(
    dto: ActivateFrontOfficeInvitationDto,
    requestMeta?: { ip?: string | null; userAgent?: string | null },
  ) {
    const telegramId = this.normalizeTelegramId(dto.telegramId);
    const invitation = await this.prisma.invitation.findFirst({
      where: { token: dto.token },
      include: {
        invitee: true,
        party: {
          select: {
            id: true,
            legalName: true,
            shortName: true,
            registrationData: true,
          },
        },
        client: { select: { id: true, name: true } },
      },
    });

    if (!invitation || invitation.role !== UserRole.FRONT_OFFICE_USER) {
      throw new NotFoundException("Приглашение не найдено");
    }
    if (invitation.status === InvitationStatus.REVOKED) {
      throw new BadRequestException("Приглашение отозвано");
    }
    if (invitation.status === InvitationStatus.EXPIRED || invitation.expiresAt < new Date()) {
      throw new BadRequestException("Срок действия приглашения истек");
    }
    if (invitation.telegramId !== telegramId) {
      throw new UnauthorizedException("Telegram ID не совпадает с приглашением");
    }
    if (!invitation.clientId) {
      throw new BadRequestException("У приглашения не задан scope хозяйства");
    }

    const username =
      this.normalizeUsername(dto.username) ??
      this.normalizeUsername(invitation.proposedLogin) ??
      null;

    let existingUser = await this.prisma.user.findFirst({
      where: { telegramId },
      select: {
        id: true,
        companyId: true,
        role: true,
        email: true,
        username: true,
        passwordHash: true,
        accessLevel: true,
      },
    });

    if (existingUser && existingUser.companyId !== invitation.companyId) {
      throw new ConflictException(
        "Этот Telegram ID уже зарегистрирован в другой компании",
      );
    }

    if (
      existingUser &&
      existingUser.role !== UserRole.FRONT_OFFICE_USER &&
      existingUser.role !== null
    ) {
      throw new ConflictException(
        "Этот Telegram ID уже привязан к внутреннему пользователю",
      );
    }

    if (username) {
      const usernameOwner = await this.prisma.user.findFirst({
        where: { username },
        select: { id: true },
      });
      if (usernameOwner && usernameOwner.id !== existingUser?.id) {
        throw new ConflictException("Указанный login уже занят");
      }
    }

    const activeForeignBinding = await this.prisma.counterpartyUserBinding.findFirst({
      where: {
        companyId: invitation.companyId,
        telegramId,
        status: CounterpartyUserBindingStatus.ACTIVE,
        accountId: { not: invitation.clientId },
      },
    });
    if (activeForeignBinding) {
      throw new ConflictException(
        "Для этого Telegram ID уже активен доступ к другому контрагенту",
      );
    }

    const contactSnapshot = (invitation.contactSnapshotJson ?? {}) as ContactSnapshot;
    const passwordHash = dto.password
      ? this.hashPassword(dto.password)
      : existingUser?.passwordHash ?? null;
    const resolvedName =
      this.normalizeOptional(dto.name) ??
      this.normalizeOptional(contactSnapshot.fullName) ??
      null;
    const email =
      this.normalizeEmail(invitation.email) ??
      existingUser?.email ??
      this.buildSyntheticEmail(invitation.id);

    const user =
      existingUser
        ? await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              role: UserRole.FRONT_OFFICE_USER,
              companyId: invitation.companyId,
              accountId: invitation.clientId,
              accessLevel: UserAccessLevel.ACTIVE,
              emailVerified: true,
              invitedBy: invitation.inviterId,
              invitedAt: existingUser.accessLevel === UserAccessLevel.ACTIVE ? undefined : invitation.createdAt,
              activatedAt: new Date(),
              name: resolvedName ?? undefined,
              phone: this.normalizeOptional(contactSnapshot.phone) ?? undefined,
              username: username ?? undefined,
              passwordHash: passwordHash ?? undefined,
            },
          })
        : await this.prisma.user.create({
            data: {
              email,
              username: username ?? null,
              passwordHash: passwordHash ?? null,
              name: resolvedName,
              phone: this.normalizeOptional(contactSnapshot.phone),
              role: UserRole.FRONT_OFFICE_USER,
              telegramId,
              emailVerified: true,
              companyId: invitation.companyId,
              accountId: invitation.clientId,
              accessLevel: UserAccessLevel.ACTIVE,
              invitedBy: invitation.inviterId,
              invitedAt: invitation.createdAt,
              activatedAt: new Date(),
            },
          });

    const binding = await this.prisma.counterpartyUserBinding.upsert({
      where: {
        counterparty_user_binding_unique: {
          companyId: invitation.companyId,
          userId: user.id,
          accountId: invitation.clientId,
        },
      },
      update: {
        partyId: invitation.partyId ?? null,
        invitationId: invitation.id,
        partyContactId: invitation.partyContactId ?? null,
        telegramId,
        status: CounterpartyUserBindingStatus.ACTIVE,
        isPrimary: true,
        contactSnapshotJson: invitation.contactSnapshotJson as any,
        invitedBy: invitation.inviterId,
        invitedAt: invitation.createdAt,
        activatedAt: new Date(),
        revokedAt: null,
      },
      create: {
        companyId: invitation.companyId,
        userId: user.id,
        accountId: invitation.clientId,
        partyId: invitation.partyId ?? null,
        invitationId: invitation.id,
        partyContactId: invitation.partyContactId ?? null,
        telegramId,
        status: CounterpartyUserBindingStatus.ACTIVE,
        isPrimary: true,
        contactSnapshotJson: invitation.contactSnapshotJson as any,
        invitedBy: invitation.inviterId,
        invitedAt: invitation.createdAt,
        activatedAt: new Date(),
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        inviteeId: user.id,
        acceptedAt: new Date(),
        accessLevel: UserAccessLevel.ACTIVE,
        status: InvitationStatus.ACCEPTED,
        activationIp: requestMeta?.ip ?? null,
        activationUserAgent: requestMeta?.userAgent ?? null,
      },
    });

    if (invitation.partyId && invitation.party) {
      await this.syncPartyContactRegistrationData({
        partyId: invitation.partyId,
        registrationData: invitation.party.registrationData,
        partyContactId: invitation.partyContactId ?? this.buildPartyContactId(contactSnapshot, telegramId),
        snapshot: contactSnapshot,
        telegramId,
        status: "ACTIVE",
        invitationId: invitation.id,
        bindingId: binding.id,
        userId: user.id,
        proposedLogin: user.username ?? invitation.proposedLogin ?? null,
        invitedAt: invitation.createdAt,
        activatedAt: new Date(),
      });
    }

    const accessToken = this.signToken({
      id: user.id,
      email: user.email,
      username: user.username ?? null,
      companyId: user.companyId,
      role: user.role,
      accountId: user.accountId ?? null,
      bindingId: binding.id,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? null,
        name:
          user.name ??
          contactSnapshot.fullName ??
          this.buildDisplayNameFromEmail(user.email),
        role: user.role,
        companyId: user.companyId,
        accountId: user.accountId ?? null,
      },
      binding: {
        id: binding.id,
        accountId: binding.accountId,
        partyId: binding.partyId ?? null,
        partyContactId: binding.partyContactId ?? null,
        status: binding.status,
      },
      account: invitation.client,
      party: invitation.party
        ? {
            id: invitation.party.id,
            name: invitation.party.shortName || invitation.party.legalName,
          }
        : null,
    };
  }

  async setPassword(
    userId: string,
    companyId: string,
    dto: SetFrontOfficePasswordDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        role: UserRole.FRONT_OFFICE_USER,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        accountId: true,
        companyId: true,
      },
    });
    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    const username = this.normalizeUsername(dto.username) ?? user.username ?? null;
    if (!username) {
      throw new BadRequestException("Нужно указать login");
    }

    const usernameOwner = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });
    if (usernameOwner && usernameOwner.id !== user.id) {
      throw new ConflictException("Указанный login уже занят");
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        passwordHash: this.hashPassword(dto.password),
      },
    });

    return {
      id: updated.id,
      username: updated.username,
      updatedAt: updated.updatedAt,
    };
  }

  async loginWithPassword(dto: FrontOfficePasswordLoginDto) {
    const username = this.normalizeUsername(dto.username);
    if (!username) {
      throw new UnauthorizedException("Неверный login или пароль");
    }

    const user = await this.prisma.user.findFirst({
      where: {
        username,
        role: UserRole.FRONT_OFFICE_USER,
        accessLevel: UserAccessLevel.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        companyId: true,
        accountId: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Неверный login или пароль");
    }

    const binding = await this.prisma.counterpartyUserBinding.findFirst({
      where: {
        companyId: user.companyId,
        userId: user.id,
        status: CounterpartyUserBindingStatus.ACTIVE,
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        accountId: true,
        partyId: true,
      },
    });

    if (!binding) {
      throw new UnauthorizedException("У пользователя нет активной привязки");
    }

    const accessToken = this.signToken({
      id: user.id,
      email: user.email,
      username: user.username ?? null,
      companyId: user.companyId,
      role: user.role,
      accountId: user.accountId ?? null,
      bindingId: binding.id,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? null,
        name: user.name ?? this.buildDisplayNameFromEmail(user.email),
        role: user.role,
        companyId: user.companyId,
        accountId: user.accountId ?? null,
      },
      binding,
    };
  }

  async getActiveBindingForUser(userId: string, companyId: string) {
    return this.prisma.counterpartyUserBinding.findFirst({
      where: {
        companyId,
        userId,
        status: CounterpartyUserBindingStatus.ACTIVE,
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  private async resolveAccount(
    companyId: string,
    party: {
      id: string;
      legalName: string;
      shortName: string | null;
      registrationData: unknown;
    },
    requestedAccountId?: string,
  ) {
    const normalizedRequested = this.normalizeOptional(requestedAccountId);
    if (normalizedRequested) {
      const account = await this.prisma.account.findFirst({
        where: { id: normalizedRequested, companyId },
        select: { id: true, name: true, inn: true },
      });
      if (!account) {
        throw new NotFoundException("Хозяйство для привязки не найдено");
      }
      return account;
    }

    const registrationData = (party.registrationData ?? {}) as Record<string, unknown>;
    const inn = this.normalizeOptional(String(registrationData.inn ?? ""));
    if (inn) {
      const byInn = await this.prisma.account.findMany({
        where: { companyId, inn },
        select: { id: true, name: true, inn: true },
        take: 2,
      });
      if (byInn.length === 1) {
        return byInn[0];
      }
      if (byInn.length > 1) {
        throw new BadRequestException(
          "По ИНН найдено несколько хозяйств. Укажите accountId явно",
        );
      }
    }

    const candidates = await this.prisma.account.findMany({
      where: {
        companyId,
        OR: [
          { name: party.legalName },
          ...(party.shortName ? [{ name: party.shortName }] : []),
        ],
      },
      select: { id: true, name: true, inn: true },
      take: 2,
    });

    if (candidates.length === 1) {
      return candidates[0];
    }

    throw new BadRequestException(
      "Не удалось однозначно определить хозяйство для контрагента. Передайте accountId",
    );
  }

  private buildContactSnapshot(dto: CreateFrontOfficeInvitationDto): ContactSnapshot {
    return {
      fullName: this.normalizeOptional(dto.fullName),
      position: this.normalizeOptional(dto.position),
      phone: this.normalizeOptional(dto.phone),
      email: this.normalizeEmail(dto.email),
    };
  }

  private buildPartyContactId(snapshot: ContactSnapshot, telegramId: string) {
    const payload = JSON.stringify({
      telegramId,
      fullName: this.normalizeOptional(snapshot.fullName),
      position: this.normalizeOptional(snapshot.position),
      phone: this.normalizeOptional(snapshot.phone),
      email: this.normalizeEmail(snapshot.email),
    });
    return `fo_contact_${this.digest(payload)}`;
  }

  private async generateShortCode() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const shortCode = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
      const exists = await this.prisma.invitation.findFirst({
        where: { shortCode },
        select: { id: true },
      });
      if (!exists) {
        return shortCode;
      }
    }

    throw new ConflictException("Не удалось сгенерировать код приглашения");
  }

  private buildLinks(token: string, shortCode: string) {
    const frontendBase =
      this.configService.get<string>("FRONTEND_URL") ||
      this.configService.get<string>("WEBAPP_URL") ||
      "http://localhost:3000";
    const botUsername = this.normalizeOptional(
      this.configService.get<string>("TELEGRAM_BOT_USERNAME") || "",
    )?.replace(/^@/, "");

    return {
      activationUrl: `${frontendBase.replace(/\/$/, "")}/portal/front-office/activate?token=${encodeURIComponent(
        token,
      )}`,
      botStartLink: botUsername
        ? `https://t.me/${botUsername}?start=fo_invite_${shortCode}`
        : null,
    };
  }

  private async sendInviteNotification(input: {
    telegramId: string;
    companyName: string;
    counterpartyName: string;
    activationUrl: string;
    botStartLink: string | null;
    contactName: string | null;
  }) {
    const botUrl = this.configService.get<string>("BOT_URL") || "http://localhost:4002";
    const internalApiKey =
      this.secretsService.getOptionalSecret("INTERNAL_API_KEY") || "";

    try {
      const response = await fetch(
        `${botUrl}/internal/front-office/send-invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": internalApiKey,
          },
          body: JSON.stringify(input),
        },
      );

      if (!response.ok) {
        return {
          delivered: false,
          reason: `BOT ${response.status}`,
        };
      }

      return {
        delivered: true,
      };
    } catch (error) {
      return {
        delivered: false,
        reason:
          error instanceof Error ? error.message : "Не удалось отправить приглашение",
      };
    }
  }

  private async syncPartyContactRegistrationData(input: {
    partyId: string;
    registrationData: unknown;
    partyContactId: string;
    snapshot: ContactSnapshot;
    telegramId: string;
    status: PartyContactAccessStatus;
    invitationId?: string | null;
    bindingId?: string | null;
    userId?: string | null;
    proposedLogin?: string | null;
    invitedAt?: Date | null;
    activatedAt?: Date | null;
  }) {
    const registrationData =
      input.registrationData && typeof input.registrationData === "object"
        ? { ...(input.registrationData as Record<string, unknown>) }
        : {};

    const contacts = Array.isArray(registrationData.contacts)
      ? [...(registrationData.contacts as Array<Record<string, unknown>>)]
      : [];

    const contactIndex = contacts.findIndex((item) =>
      this.matchesPartyContactRecord(item, input.partyContactId, input.snapshot),
    );

    const existingContact =
      contactIndex >= 0 && contacts[contactIndex] && typeof contacts[contactIndex] === "object"
        ? { ...(contacts[contactIndex] as Record<string, unknown>) }
        : {};

    const existingAccess =
      existingContact.frontOfficeAccess &&
      typeof existingContact.frontOfficeAccess === "object"
        ? { ...(existingContact.frontOfficeAccess as Record<string, unknown>) }
        : {};

    const mergedContact: Record<string, unknown> = {
      ...existingContact,
      id: input.partyContactId,
      roleType: this.mapContactRoleType(input.snapshot.position, existingContact.roleType),
      fullName:
        this.normalizeOptional(input.snapshot.fullName) ??
        this.normalizeOptional(String(existingContact.fullName ?? "")) ??
        "Контакт контрагента",
      position:
        this.normalizeOptional(input.snapshot.position) ??
        this.normalizeOptional(String(existingContact.position ?? "")) ??
        undefined,
      phones:
        this.normalizeOptional(input.snapshot.phone) ??
        this.normalizeOptional(String(existingContact.phones ?? "")) ??
        undefined,
      email:
        this.normalizeEmail(input.snapshot.email) ??
        this.normalizeEmail(String(existingContact.email ?? "")) ??
        undefined,
      telegramId: input.telegramId,
      frontOfficeAccess: {
        ...existingAccess,
        status: input.status,
        telegramId: input.telegramId,
        invitationId:
          input.invitationId ?? this.normalizeOptional(String(existingAccess.invitationId ?? "")),
        bindingId:
          input.bindingId ?? this.normalizeOptional(String(existingAccess.bindingId ?? "")),
        userId: input.userId ?? this.normalizeOptional(String(existingAccess.userId ?? "")),
        proposedLogin:
          input.proposedLogin ??
          this.normalizeOptional(String(existingAccess.proposedLogin ?? "")),
        invitedAt:
          input.invitedAt?.toISOString() ??
          this.normalizeOptional(String(existingAccess.invitedAt ?? "")),
        activatedAt:
          input.activatedAt?.toISOString() ??
          this.normalizeOptional(String(existingAccess.activatedAt ?? "")),
      },
    };

    if (contactIndex >= 0) {
      contacts[contactIndex] = mergedContact;
    } else {
      contacts.push(mergedContact);
    }

    registrationData.contacts = contacts;

    await this.prisma.party.update({
      where: { id: input.partyId },
      data: {
        registrationData: registrationData as any,
      },
    });
  }

  private matchesPartyContactRecord(
    contact: Record<string, unknown>,
    partyContactId: string,
    snapshot: ContactSnapshot,
  ) {
    if (typeof contact.id === "string" && contact.id === partyContactId) {
      return true;
    }

    const fullName = this.normalizeOptional(snapshot.fullName);
    const email = this.normalizeEmail(snapshot.email);
    const phone = this.normalizeOptional(snapshot.phone);

    return (
      this.normalizeOptional(String(contact.fullName ?? "")) === fullName &&
      this.normalizeEmail(String(contact.email ?? "")) === email &&
      this.normalizeOptional(String(contact.phones ?? "")) === phone
    );
  }

  private mapContactRoleType(position?: string | null, existingRoleType?: unknown) {
    if (existingRoleType === "SIGNATORY" || existingRoleType === "OPERATIONAL") {
      return existingRoleType;
    }

    return this.normalizeOptional(position) === "SIGNATORY"
      ? "SIGNATORY"
      : "OPERATIONAL";
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `scrypt$${salt}$${hash}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split("$");
    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (candidate.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(candidate, expected);
  }

  private signToken(input: {
    id: string;
    email: string;
    username?: string | null;
    companyId: string;
    role: UserRole;
    accountId?: string | null;
    bindingId?: string | null;
  }) {
    return this.jwtService.sign({
      sub: input.id,
      email: input.email,
      username: input.username ?? null,
      companyId: input.companyId,
      tenantId: input.companyId,
      role: input.role,
      accountId: input.accountId ?? null,
      subjectClass:
        input.role === UserRole.FRONT_OFFICE_USER ? "external" : "internal",
      bindingId: input.bindingId ?? null,
    });
  }

  private buildSyntheticEmail(invitationId: string) {
    return `fo+${invitationId}@rai.local`;
  }

  private buildDisplayNameFromEmail(email: string) {
    return email.split("@")[0];
  }

  private normalizeTelegramId(value: string) {
    const normalized = String(value || "").trim();
    if (!normalized) {
      throw new BadRequestException("Нужно указать Telegram ID");
    }
    return normalized;
  }

  private normalizeUsername(value?: string | null) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    return normalized || null;
  }

  private normalizeEmail(value?: string | null) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    return normalized || null;
  }

  private normalizeOptional(value?: string | null) {
    const normalized = String(value || "").trim();
    return normalized || null;
  }

  private digest(value: string) {
    return scryptSync(value, "fo-contact", 16).toString("hex");
  }
}
