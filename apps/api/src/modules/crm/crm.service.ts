import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  Holding,
  Account,
  AccountStatus,
  AccountType,
  RiskCategory,
  StrategicValue,
  ContactRole,
  InteractionType,
  ObligationStatus,
} from "@rai/prisma-client";
import {
  buildProjectedPartyContacts,
  buildPartySyncSourcePrefix,
  extractJurisdictionLabel,
  extractPartyInn,
  extractPartyManagerName,
  mapPartyStatusToAccountStatus,
  mapPartyTypeToAccountType,
  normalizeWorkspaceSearchValue,
  resolveProjectedAccountName,
} from "../../shared/commerce/party-account-projection";

type FarmSeverity = "ok" | "warning" | "critical";

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) { }

  // --- Holdings ---

  async createHolding(
    data: { name: string; description?: string },
    companyId: string,
  ): Promise<Holding> {
    return this.prisma.holding.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async findAllHoldings(companyId: string): Promise<Holding[]> {
    return this.prisma.holding.findMany({
      where: { companyId },
      include: { accounts: true },
    });
  }

  async findOneHolding(id: string, companyId: string): Promise<Holding> {
    const holding = await this.prisma.holding.findFirst({
      where: { id, companyId },
      include: { accounts: true },
    });

    if (!holding) {
      throw new NotFoundException(`Holding ${id} not found or access denied`);
    }

    return holding;
  }

  async deleteHolding(id: string, companyId: string): Promise<void> {
    await this.findOneHolding(id, companyId);

    // Architectural Constraint: Cannot delete holding with active accounts
    const accountsCount = await this.prisma.account.count({
      where: { holdingId: id, companyId },
    });

    if (accountsCount > 0) {
      throw new ConflictException(
        `Cannot delete holding ${id} because it has active accounts linked to it`,
      );
    }

    await this.prisma.holding.delete({
      where: { id },
    });
  }

  // --- Accounts (ex-Clients / Farm Registry) ---

  async createAccount(
    data: {
      name: string;
      inn?: string;
      type?: string;
      holdingId?: string;
      partyId?: string;
    },
    companyId: string,
  ): Promise<Account> {
    if (data.holdingId) {
      const holding = await this.prisma.holding.findFirst({
        where: { id: data.holdingId, companyId },
      });
      if (!holding) {
        throw new ForbiddenException(
          `Holding ${data.holdingId} does not belong to your company`,
        );
      }
    }

    const linkedParty = await this.resolvePartyForAccountInput(companyId, data);
    const accountName =
      this.normalizeOptional(data.name) ??
      (linkedParty ? resolveProjectedAccountName(linkedParty) : undefined);
    if (!accountName) {
      throw new BadRequestException("Для CRM-аккаунта требуется name");
    }

    const accountInn =
      this.normalizeOptional(data.inn) ??
      (linkedParty ? extractPartyInn(linkedParty.registrationData) : undefined) ??
      null;
    const accountType =
      this.normalizeAccountType(data.type) ??
      (linkedParty ? mapPartyTypeToAccountType(linkedParty.type) : undefined);
    const accountStatus = linkedParty
      ? mapPartyStatusToAccountStatus(linkedParty.status)
      : undefined;
    const accountJurisdiction = linkedParty
      ? extractJurisdictionLabel(linkedParty.jurisdiction ?? null) ?? null
      : null;

    const existingAccount = await this.resolveExistingAccountForCreate(companyId, {
      partyId: linkedParty?.id,
      inn: accountInn,
      name: accountName,
    });

    const account = existingAccount
      ? await this.prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            name: accountName,
            ...(accountInn !== null ? { inn: accountInn } : {}),
            ...(accountType ? { type: accountType } : {}),
            ...(accountStatus ? { status: accountStatus } : {}),
            ...(accountJurisdiction !== null
              ? { jurisdiction: accountJurisdiction }
              : {}),
            ...(typeof data.holdingId === "string"
              ? { holdingId: data.holdingId }
              : {}),
            ...(linkedParty ? { partyId: linkedParty.id } : {}),
          },
        })
      : await this.prisma.account.create({
          data: {
            name: accountName,
            ...(accountInn !== null ? { inn: accountInn } : {}),
            ...(accountType ? { type: accountType } : {}),
            ...(accountStatus ? { status: accountStatus } : {}),
            ...(accountJurisdiction !== null
              ? { jurisdiction: accountJurisdiction }
              : {}),
            holdingId: data.holdingId,
            companyId,
            partyId: linkedParty?.id,
          },
        });

    if (linkedParty) {
      await this.syncProjectedContactsToAccount(
        account.id,
        linkedParty.id,
        linkedParty.registrationData,
      );
    }

    return account;
  }

  async updateAccountHolding(
    accountId: string,
    holdingId: string | null,
    companyId: string,
  ): Promise<Account> {
    // 1. Verify Account belongs to Company
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      throw new NotFoundException(
        `Account ${accountId} not found or access denied`,
      );
    }

    // 2. Verify Holding belongs to Company (if provided)
    if (holdingId) {
      const holding = await this.prisma.holding.findFirst({
        where: { id: holdingId, companyId },
      });

      if (!holding) {
        throw new ForbiddenException(
          `Holding ${holdingId} does not belong to your company`,
        );
      }
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: { holdingId },
    });
  }

  async findAccountsByHolding(
    holdingId: string,
    companyId: string,
  ): Promise<Account[]> {
    await this.findOneHolding(holdingId, companyId); // Validate existence and access

    return this.prisma.account.findMany({
      where: { holdingId, companyId },
    });
  }

  // New CRM Methods (Skeletons for now, strictly implementing existing logic first)
  private normalizeAccountType(value?: string): AccountType | undefined {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (Object.values(AccountType).includes(normalized as AccountType)) {
      return normalized as AccountType;
    }
    return undefined;
  }

  private normalizeAccountStatus(value?: string): AccountStatus | undefined {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (Object.values(AccountStatus).includes(normalized as AccountStatus)) {
      return normalized as AccountStatus;
    }
    return undefined;
  }

  private normalizeRiskCategory(value?: string): RiskCategory | undefined {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (Object.values(RiskCategory).includes(normalized as RiskCategory)) {
      return normalized as RiskCategory;
    }
    return undefined;
  }

  private normalizeStrategicValue(value?: string): StrategicValue | undefined {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (Object.values(StrategicValue).includes(normalized as StrategicValue)) {
      return normalized as StrategicValue;
    }
    return undefined;
  }

  private normalizeContactRole(value?: string): ContactRole | undefined {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (Object.values(ContactRole).includes(normalized as ContactRole)) {
      return normalized as ContactRole;
    }
    return undefined;
  }

  private normalizeInteractionType(
    value?: string,
  ): InteractionType | undefined {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (
      Object.values(InteractionType).includes(normalized as InteractionType)
    ) {
      return normalized as InteractionType;
    }
    return undefined;
  }

  private normalizeObligationStatus(
    value?: string,
  ): ObligationStatus | undefined {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (
      Object.values(ObligationStatus).includes(normalized as ObligationStatus)
    ) {
      return normalized as ObligationStatus;
    }
    return undefined;
  }

  async getAccounts(
    companyId: string,
    filters?: {
      search?: string;
      type?: string;
      status?: string;
      riskCategory?: string;
      responsibleId?: string;
    },
  ): Promise<Account[]> {
    const search = String(filters?.search || "").trim();
    const type = this.normalizeAccountType(filters?.type);
    const status = this.normalizeAccountStatus(filters?.status);
    const riskCategory = this.normalizeRiskCategory(filters?.riskCategory);
    const responsibleId = String(filters?.responsibleId || "").trim();

    return this.prisma.account.findMany({
      where: {
        companyId,
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(riskCategory ? { riskCategory } : {}),
        ...(search
          ? {
            OR: [
              { id: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
              { inn: { contains: search, mode: "insensitive" } },
            ],
          }
          : {}),
        ...(responsibleId
          ? {
            obligations: {
              some: {
                responsibleUserId: responsibleId,
                status: { not: "FULFILLED" },
              },
            },
          }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async resolveWorkspaceAccountId(
    payload: { accountId?: string; query?: string },
    companyId: string,
  ): Promise<string> {
    const explicitAccountId = String(payload.accountId || "").trim();
    if (explicitAccountId) {
      return explicitAccountId;
    }

    const query = String(payload.query || "").trim();
    if (!query) {
      throw new BadRequestException("accountId or query is required");
    }

    const matches = await this.getAccounts(companyId, { search: query });
    if (matches.length === 0) {
      return this.resolveWorkspaceAccountIdFromParty(query, companyId);
    }

    const normalizedQuery = normalizeWorkspaceSearchValue(query);
    const exactMatch = matches.find((account) =>
      normalizeWorkspaceSearchValue(account.name) === normalizedQuery ||
      String(account.inn || "").trim() === query,
    );
    if (exactMatch) {
      return exactMatch.id;
    }

    if (matches.length === 1) {
      return matches[0].id;
    }

    const startsWithMatches = matches.filter(
      (account) =>
        normalizeWorkspaceSearchValue(account.name).startsWith(normalizedQuery),
    );
    if (startsWithMatches.length === 1) {
      return startsWithMatches[0].id;
    }

    throw new BadRequestException(
      `Найдено несколько CRM-аккаунтов по запросу "${query}". Уточните название или откройте карточку из реестра.`,
    );
  }

  async getAccountDetails(accountId: string, companyId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
      include: {
        contacts: true,
        interactions: { take: 5, orderBy: { date: "desc" } },
        obligations: { where: { status: { not: "FULFILLED" } } },
      },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);
    return account;
  }

  async getAccountWorkspace(accountId: string, companyId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
      select: {
        id: true,
        name: true,
        inn: true,
        partyId: true,
        type: true,
        status: true,
        riskCategory: true,
        strategicValue: true,
        jurisdiction: true,
        holdingId: true,
        updatedAt: true,
      },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const linkedParty = await this.findLinkedPartyForAccount(account, companyId);

    const legalEntities = account.holdingId
      ? await this.prisma.account.findMany({
        where: {
          companyId,
          holdingId: account.holdingId,
        },
        select: {
          id: true,
          name: true,
          inn: true,
          status: true,
          type: true,
          riskCategory: true,
        },
        orderBy: { updatedAt: "desc" },
      })
      : [];

    const contacts = await this.prisma.contact.findMany({
      where: { accountId: account.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        influenceLevel: true,
        email: true,
        phone: true,
        source: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const fields = await this.prisma.field.findMany({
      where: {
        companyId,
        clientId: account.id,
      },
      select: {
        id: true,
        name: true,
        area: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const tasks = await this.prisma.task.findMany({
      where: {
        companyId,
        field: {
          clientId: account.id,
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        plannedDate: true,
        slaExpiration: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const documents = await this.prisma.interaction.findMany({
      where: {
        accountId: account.id,
        type: "DOC_SUBMISSION",
      },
      select: {
        id: true,
        date: true,
        summary: true,
        type: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    const interactions = await this.prisma.interaction.findMany({
      where: {
        accountId: account.id,
      },
      select: {
        id: true,
        date: true,
        summary: true,
        type: true,
        contactId: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    const risks = await this.prisma.obligation.findMany({
      where: {
        accountId: account.id,
        status: { in: ["PENDING", "BREACHED"] },
      },
      select: {
        id: true,
        description: true,
        dueDate: true,
        status: true,
      },
      orderBy: { dueDate: "asc" },
      take: 100,
    });

    const obligations = await this.prisma.obligation.findMany({
      where: {
        accountId: account.id,
      },
      select: {
        id: true,
        description: true,
        dueDate: true,
        status: true,
        responsibleUserId: true,
      },
      orderBy: { dueDate: "asc" },
      take: 100,
    });

    const plans = await this.prisma.harvestPlan.findMany({
      where: {
        companyId,
        accountId: account.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    const activePlans = plans.filter((item) =>
      ["REVIEW", "APPROVED", "ACTIVE"].includes(String(item.status)),
    ).length;
    const completedTasks = tasks.filter(
      (item) => String(item.status) === "COMPLETED",
    ).length;

    return {
      account,
      linkedParty,
      legalEntities,
      contacts,
      interactions,
      obligations,
      fields,
      tasks,
      documents,
      risks,
      planFact: {
        plansTotal: plans.length,
        activePlans,
        tasksTotal: tasks.length,
        tasksCompleted: completedTasks,
      },
      agriMetrics: {
        totalArea: fields.reduce(
          (sum, field) => sum + Number(field.area || 0),
          0,
        ),
        fieldsTotal: fields.length,
        season: "CURRENT",
        ndviState: "NO_DATA",
      },
    };
  }

  private async findLinkedPartyForAccount(
    account: { id: string; name: string; inn?: string | null; partyId?: string | null },
    companyId: string,
  ): Promise<{
    id: string;
    legalName: string;
    shortName?: string | null;
    inn?: string;
    managerName?: string | null;
  } | null> {
    if (account.partyId) {
      const linkedParty = await this.prisma.party.findFirst({
        where: {
          companyId,
          id: account.partyId,
        },
        select: {
          id: true,
          legalName: true,
          shortName: true,
          registrationData: true,
        },
      });
      if (linkedParty) {
        return {
          id: linkedParty.id,
          legalName: linkedParty.legalName,
          shortName: linkedParty.shortName,
          inn: extractPartyInn(linkedParty.registrationData),
          managerName: extractPartyManagerName(linkedParty.registrationData),
        };
      }
    }

    const accountName = String(account.name || "").trim();
    if (!accountName) {
      return null;
    }

    const partyMatches = await this.prisma.party.findMany({
      where: {
        companyId,
        OR: [
          { legalName: { contains: accountName, mode: "insensitive" } },
          { shortName: { contains: accountName, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        legalName: true,
        shortName: true,
        registrationData: true,
      },
      take: 25,
    });

    if (partyMatches.length === 0) {
      return null;
    }

    const accountInn = typeof account.inn === "string" ? account.inn.trim() : "";
    const matchByInn = accountInn
      ? partyMatches.find((party) => extractPartyInn(party.registrationData) === accountInn)
      : undefined;

    const normalizedName = normalizeWorkspaceSearchValue(accountName);
    const matchByName = partyMatches.find(
      (party) =>
        normalizeWorkspaceSearchValue(party.legalName) === normalizedName ||
        normalizeWorkspaceSearchValue(party.shortName ?? "") === normalizedName,
    );

    const selected = matchByInn ?? matchByName ?? (partyMatches.length === 1 ? partyMatches[0] : null);
    if (!selected) {
      return null;
    }

    return {
      id: selected.id,
      legalName: selected.legalName,
      shortName: selected.shortName,
      inn: extractPartyInn(selected.registrationData),
      managerName: extractPartyManagerName(selected.registrationData),
    };
  }

  private async resolveWorkspaceAccountIdFromParty(
    query: string,
    companyId: string,
  ): Promise<string> {
    const partyMatches = await this.prisma.party.findMany({
      where: {
        companyId,
        OR: [
          { legalName: { contains: query, mode: "insensitive" } },
          { shortName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        legalName: true,
        shortName: true,
        type: true,
        status: true,
        registrationData: true,
        jurisdiction: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      take: 25,
    });

    if (partyMatches.length === 0) {
      throw new NotFoundException(
        `ACCOUNT_AND_PARTY_NOT_FOUND:${query}`,
      );
    }

    const normalizedQuery = normalizeWorkspaceSearchValue(query);
    const exactPartyMatch = partyMatches.find(
      (party) =>
        normalizeWorkspaceSearchValue(party.legalName) === normalizedQuery ||
        normalizeWorkspaceSearchValue(party.shortName ?? "") === normalizedQuery,
    );
    const selectedParty = exactPartyMatch ?? (partyMatches.length === 1 ? partyMatches[0] : null);

    if (!selectedParty) {
      throw new BadRequestException(
        `Найдено несколько контрагентов по запросу "${query}". Уточните название или выберите карточку в реестре.`,
      );
    }

    const linkedAccount = await this.prisma.account.findFirst({
      where: {
        companyId,
        partyId: selectedParty.id,
      },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });
    if (linkedAccount) {
      await this.syncProjectedContactsToAccount(
        linkedAccount.id,
        selectedParty.id,
        selectedParty.registrationData,
      );
      return linkedAccount.id;
    }

    const partyInn = extractPartyInn(selectedParty.registrationData);
    if (partyInn) {
      const existingByInn = await this.prisma.account.findFirst({
        where: {
          companyId,
          inn: partyInn,
        },
        select: { id: true },
      });
      if (existingByInn) {
        await this.prisma.account.update({
          where: { id: existingByInn.id },
          data: {
            partyId: selectedParty.id,
            jurisdiction:
              extractJurisdictionLabel(selectedParty.jurisdiction ?? null) ?? null,
            type: mapPartyTypeToAccountType(selectedParty.type),
            status: mapPartyStatusToAccountStatus(selectedParty.status),
          },
        });
        await this.syncProjectedContactsToAccount(
          existingByInn.id,
          selectedParty.id,
          selectedParty.registrationData,
        );
        return existingByInn.id;
      }
    }

    const accountName = resolveProjectedAccountName(selectedParty);
    const existingByNameMatches = await this.prisma.account.findMany({
      where: {
        companyId,
        name: {
          equals: accountName,
          mode: "insensitive",
        },
      },
      select: { id: true },
      take: 2,
      orderBy: { updatedAt: "desc" },
    });
    if (existingByNameMatches.length === 1) {
      await this.prisma.account.update({
        where: { id: existingByNameMatches[0].id },
        data: {
          partyId: selectedParty.id,
          inn: partyInn ?? null,
          jurisdiction:
            extractJurisdictionLabel(selectedParty.jurisdiction ?? null) ?? null,
          type: mapPartyTypeToAccountType(selectedParty.type),
          status: mapPartyStatusToAccountStatus(selectedParty.status),
        },
      });
      await this.syncProjectedContactsToAccount(
        existingByNameMatches[0].id,
        selectedParty.id,
        selectedParty.registrationData,
      );
      return existingByNameMatches[0].id;
    }

    const created = await this.createAccount(
      {
        name: accountName,
        inn: partyInn,
        type: "CLIENT",
        partyId: selectedParty.id,
      },
      companyId,
    );
    return created.id;
  }

  async updateAccountProfile(
    accountId: string,
    companyId: string,
    data: {
      name?: string;
      inn?: string | null;
      type?: string;
      status?: string;
      holdingId?: string | null;
      jurisdiction?: string | null;
      riskCategory?: string;
      strategicValue?: string;
    },
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
      select: {
        id: true,
        holdingId: true,
        status: true,
        partyId: true,
      },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    if (typeof data.holdingId === "string" && data.holdingId.trim()) {
      const holding = await this.prisma.holding.findFirst({
        where: { id: data.holdingId, companyId },
        select: { id: true },
      });
      if (!holding) {
        throw new ForbiddenException(
          `Holding ${data.holdingId} does not belong to your company`,
        );
      }
    }

    const nextStatus = this.normalizeAccountStatus(data.status);
    if (nextStatus === "FROZEN") {
      const linkedFields = await this.prisma.field.count({
        where: {
          companyId,
          clientId: accountId,
        },
      });

      if (linkedFields === 0) {
        throw new BadRequestException(
          "Нельзя закрыть структуру: у контрагента отсутствуют связанные хозяйства (поля).",
        );
      }
    }

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...(typeof data.name === "string" && data.name.trim()
          ? { name: data.name.trim() }
          : {}),
        ...(data.inn === null ? { inn: null } : {}),
        ...(typeof data.inn === "string" && data.inn.trim()
          ? { inn: data.inn.trim() }
          : {}),
        ...(typeof data.holdingId === "string"
          ? { holdingId: data.holdingId.trim() || null }
          : {}),
        ...(data.holdingId === null ? { holdingId: null } : {}),
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(this.normalizeAccountType(data.type)
          ? { type: this.normalizeAccountType(data.type) }
          : {}),
        ...(this.normalizeRiskCategory(data.riskCategory)
          ? { riskCategory: this.normalizeRiskCategory(data.riskCategory) }
          : {}),
        ...(this.normalizeStrategicValue(data.strategicValue)
          ? {
            strategicValue: this.normalizeStrategicValue(data.strategicValue),
          }
          : {}),
        ...(typeof data.jurisdiction === "string"
          ? { jurisdiction: data.jurisdiction.trim() || null }
          : {}),
      },
    });

    if (
      account.partyId &&
      (typeof data.name === "string" ||
        typeof data.inn === "string" ||
        data.inn === null ||
        typeof data.jurisdiction === "string")
    ) {
      await this.syncLinkedPartyMasterFromAccount(companyId, account.partyId, data);
    }

    return updated;
  }

  private async resolvePartyForAccountInput(
    companyId: string,
    data: {
      name: string;
      inn?: string;
      partyId?: string;
    },
  ) {
    const explicitPartyId = this.normalizeOptional(data.partyId);
    if (explicitPartyId) {
      const party = await this.prisma.party.findFirst({
        where: {
          companyId,
          id: explicitPartyId,
        },
        select: {
          id: true,
          legalName: true,
          shortName: true,
          type: true,
          status: true,
          registrationData: true,
          jurisdiction: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });
      if (!party) {
        throw new NotFoundException(`Party ${explicitPartyId} not found`);
      }
      return party;
    }

    const inn = this.normalizeOptional(data.inn);
    if (inn) {
      const byInn = await this.prisma.party.findFirst({
        where: {
          companyId,
          OR: [
            { registrationData: { path: ["inn"], equals: inn } },
            { registrationData: { path: ["requisites", "inn"], equals: inn } },
          ],
        },
        select: {
          id: true,
          legalName: true,
          shortName: true,
          type: true,
          status: true,
          registrationData: true,
          jurisdiction: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });
      if (byInn) {
        return byInn;
      }
    }

    const name = this.normalizeOptional(data.name);
    if (!name) {
      return null;
    }

    const exactByName = await this.prisma.party.findMany({
      where: {
        companyId,
        OR: [
          { legalName: { equals: name, mode: "insensitive" } },
          { shortName: { equals: name, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        legalName: true,
        shortName: true,
        type: true,
        status: true,
        registrationData: true,
        jurisdiction: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      take: 2,
      orderBy: { updatedAt: "desc" },
    });
    return exactByName.length === 1 ? exactByName[0] : null;
  }

  private async resolveExistingAccountForCreate(
    companyId: string,
    input: {
      partyId?: string;
      inn?: string | null;
      name: string;
    },
  ) {
    if (input.partyId) {
      const existingByParty = await this.prisma.account.findFirst({
        where: {
          companyId,
          partyId: input.partyId,
        },
      });
      if (existingByParty) {
        return existingByParty;
      }
    }

    if (input.inn) {
      const existingByInn = await this.prisma.account.findFirst({
        where: {
          companyId,
          inn: input.inn,
        },
      });
      if (existingByInn) {
        return existingByInn;
      }
    }

    const exactNameMatches = await this.prisma.account.findMany({
      where: {
        companyId,
        name: {
          equals: input.name,
          mode: "insensitive",
        },
      },
      take: 2,
      orderBy: { updatedAt: "desc" },
    });
    return exactNameMatches.length === 1 ? exactNameMatches[0] : null;
  }

  private async syncProjectedContactsToAccount(
    accountId: string,
    partyId: string,
    registrationData: unknown,
  ) {
    const projectedContacts = buildProjectedPartyContacts(
      partyId,
      registrationData,
    );
    const sourcePrefix = buildPartySyncSourcePrefix(partyId);
    const existingContacts = await this.prisma.contact.findMany({
      where: {
        accountId,
        source: {
          startsWith: sourcePrefix,
        },
      },
      select: {
        id: true,
        source: true,
      },
    });

    const projectedBySource = new Map(
      projectedContacts.map((contact) => [contact.source, contact]),
    );

    for (const existing of existingContacts) {
      if (!existing.source || projectedBySource.has(existing.source)) {
        continue;
      }

      await this.prisma.contact.delete({
        where: { id: existing.id },
      });
    }

    for (const contact of projectedContacts) {
      const existing = existingContacts.find(
        (item) => item.source === contact.source,
      );
      if (existing) {
        await this.prisma.contact.update({
          where: { id: existing.id },
          data: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            role: contact.role,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            source: contact.source,
          },
        });
        continue;
      }

      await this.prisma.contact.create({
        data: {
          accountId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          role: contact.role,
          email: contact.email ?? null,
          phone: contact.phone ?? null,
          source: contact.source,
        },
      });
    }
  }

  private async syncLinkedPartyMasterFromAccount(
    companyId: string,
    partyId: string,
    data: {
      name?: string;
      inn?: string | null;
      jurisdiction?: string | null;
    },
  ) {
    const party = await this.prisma.party.findFirst({
      where: {
        companyId,
        id: partyId,
      },
      select: {
        id: true,
        shortName: true,
        jurisdictionId: true,
        registrationData: true,
      },
    });
    if (!party) {
      return;
    }

    const nextRegistrationData = this.mergePartyRegistrationDataFromAccount(
      party.registrationData,
      data,
    );

    const nextJurisdictionLabel = this.normalizeOptional(data.jurisdiction);
    let jurisdictionId: string | undefined;
    if (typeof nextJurisdictionLabel === "string") {
      const jurisdiction = await this.prisma.jurisdiction.findFirst({
        where: {
          companyId,
          OR: [
            { code: { equals: nextJurisdictionLabel.toUpperCase() } },
            { name: { equals: nextJurisdictionLabel, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      if (jurisdiction) {
        jurisdictionId = jurisdiction.id;
      }
    }

    await this.prisma.party.update({
      where: { id: partyId },
      data: {
        ...(typeof data.name === "string" && data.name.trim()
          ? { shortName: data.name.trim() }
          : {}),
        registrationData: nextRegistrationData as any,
        ...(jurisdictionId ? { jurisdictionId } : {}),
      },
    });
  }

  private mergePartyRegistrationDataFromAccount(
    registrationData: unknown,
    data: {
      inn?: string | null;
      name?: string;
    },
  ) {
    const nextData =
      registrationData && typeof registrationData === "object"
        ? { ...(registrationData as Record<string, unknown>) }
        : {};
    const nextRequisites =
      nextData.requisites && typeof nextData.requisites === "object"
        ? { ...(nextData.requisites as Record<string, unknown>) }
        : {};

    if (data.inn === null) {
      delete nextData.inn;
      delete nextRequisites.inn;
    } else if (typeof data.inn === "string" && data.inn.trim()) {
      nextData.inn = data.inn.trim();
      nextRequisites.inn = data.inn.trim();
    }

    if (typeof data.name === "string" && data.name.trim()) {
      nextData.shortName = data.name.trim();
    }

    nextData.requisites = nextRequisites;
    return nextData;
  }

  private normalizeOptional(value?: string | null): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  async createContact(
    accountId: string,
    companyId: string,
    data: {
      firstName: string;
      lastName?: string;
      role?: string;
      influenceLevel?: number;
      email?: string;
      phone?: string;
      source?: string;
    },
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
      select: { id: true },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    return this.prisma.contact.create({
      data: {
        accountId,
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() || null,
        role: this.normalizeContactRole(data.role) || ContactRole.OPERATIONAL,
        influenceLevel:
          typeof data.influenceLevel === "number" ? data.influenceLevel : null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        source: data.source?.trim() || null,
      },
    });
  }

  async updateContact(
    contactId: string,
    companyId: string,
    data: {
      firstName?: string;
      lastName?: string | null;
      role?: string;
      influenceLevel?: number | null;
      email?: string | null;
      phone?: string | null;
      source?: string | null;
    },
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, account: { companyId } },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found`);

    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(typeof data.firstName === "string"
          ? { firstName: data.firstName.trim() || undefined }
          : {}),
        ...(typeof data.lastName === "string"
          ? { lastName: data.lastName.trim() || null }
          : {}),
        ...(data.lastName === null ? { lastName: null } : {}),
        ...(this.normalizeContactRole(data.role)
          ? { role: this.normalizeContactRole(data.role) }
          : {}),
        ...(typeof data.influenceLevel === "number"
          ? { influenceLevel: data.influenceLevel }
          : {}),
        ...(data.influenceLevel === null ? { influenceLevel: null } : {}),
        ...(typeof data.email === "string"
          ? { email: data.email.trim() || null }
          : {}),
        ...(data.email === null ? { email: null } : {}),
        ...(typeof data.phone === "string"
          ? { phone: data.phone.trim() || null }
          : {}),
        ...(data.phone === null ? { phone: null } : {}),
        ...(typeof data.source === "string"
          ? { source: data.source.trim() || null }
          : {}),
        ...(data.source === null ? { source: null } : {}),
      },
    });
  }

  async deleteContact(contactId: string, companyId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, account: { companyId } },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found`);
    return this.prisma.contact.delete({ where: { id: contactId } });
  }

  async createInteraction(
    accountId: string,
    companyId: string,
    data: {
      type: string;
      summary: string;
      date?: string;
      contactId?: string | null;
      relatedEventId?: string | null;
    },
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
      select: { id: true },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    if (data.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: data.contactId, account: { companyId } },
        select: { id: true },
      });
      if (!contact) {
        throw new NotFoundException(`Contact ${data.contactId} not found`);
      }
    }

    return this.prisma.interaction.create({
      data: {
        accountId,
        type:
          this.normalizeInteractionType(data.type) ||
          InteractionType.CORRESPONDENCE,
        summary: data.summary.trim(),
        date: data.date ? new Date(data.date) : new Date(),
        contactId: data.contactId || null,
        relatedEventId: data.relatedEventId || null,
      },
    });
  }

  async updateInteraction(
    interactionId: string,
    companyId: string,
    data: {
      type?: string;
      summary?: string;
      date?: string;
      contactId?: string | null;
      relatedEventId?: string | null;
    },
  ) {
    const interaction = await this.prisma.interaction.findFirst({
      where: { id: interactionId, account: { companyId } },
      select: { id: true },
    });
    if (!interaction) {
      throw new NotFoundException(`Interaction ${interactionId} not found`);
    }

    if (data.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: data.contactId, account: { companyId } },
        select: { id: true },
      });
      if (!contact) {
        throw new NotFoundException(`Contact ${data.contactId} not found`);
      }
    }

    return this.prisma.interaction.update({
      where: { id: interactionId },
      data: {
        ...(this.normalizeInteractionType(data.type)
          ? { type: this.normalizeInteractionType(data.type) }
          : {}),
        ...(typeof data.summary === "string"
          ? { summary: data.summary.trim() || undefined }
          : {}),
        ...(typeof data.date === "string" ? { date: new Date(data.date) } : {}),
        ...(typeof data.contactId === "string"
          ? { contactId: data.contactId.trim() || null }
          : {}),
        ...(data.contactId === null ? { contactId: null } : {}),
        ...(typeof data.relatedEventId === "string"
          ? { relatedEventId: data.relatedEventId.trim() || null }
          : {}),
        ...(data.relatedEventId === null ? { relatedEventId: null } : {}),
      },
    });
  }

  async deleteInteraction(interactionId: string, companyId: string) {
    const interaction = await this.prisma.interaction.findFirst({
      where: { id: interactionId, account: { companyId } },
      select: { id: true },
    });
    if (!interaction) {
      throw new NotFoundException(`Interaction ${interactionId} not found`);
    }
    return this.prisma.interaction.delete({ where: { id: interactionId } });
  }

  async createObligation(
    accountId: string,
    companyId: string,
    data: {
      description: string;
      dueDate: string;
      responsibleUserId?: string | null;
      status?: string;
    },
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
      select: { id: true },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    if (data.responsibleUserId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.responsibleUserId, companyId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException(
          `User ${data.responsibleUserId} not found in company`,
        );
      }
    }

    return this.prisma.obligation.create({
      data: {
        accountId,
        description: data.description.trim(),
        dueDate: new Date(data.dueDate),
        responsibleUserId: data.responsibleUserId || null,
        status:
          this.normalizeObligationStatus(data.status) ||
          ObligationStatus.PENDING,
      },
    });
  }

  async updateObligation(
    obligationId: string,
    companyId: string,
    data: {
      description?: string;
      dueDate?: string;
      responsibleUserId?: string | null;
      status?: string;
    },
  ) {
    const obligation = await this.prisma.obligation.findFirst({
      where: { id: obligationId, account: { companyId } },
      select: { id: true },
    });
    if (!obligation) {
      throw new NotFoundException(`Obligation ${obligationId} not found`);
    }

    if (data.responsibleUserId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.responsibleUserId, companyId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException(
          `User ${data.responsibleUserId} not found in company`,
        );
      }
    }

    return this.prisma.obligation.update({
      where: { id: obligationId },
      data: {
        ...(typeof data.description === "string"
          ? { description: data.description.trim() || undefined }
          : {}),
        ...(typeof data.dueDate === "string"
          ? { dueDate: new Date(data.dueDate) }
          : {}),
        ...(typeof data.responsibleUserId === "string"
          ? { responsibleUserId: data.responsibleUserId.trim() || null }
          : {}),
        ...(data.responsibleUserId === null ? { responsibleUserId: null } : {}),
        ...(this.normalizeObligationStatus(data.status)
          ? { status: this.normalizeObligationStatus(data.status) }
          : {}),
      },
    });
  }

  async deleteObligation(obligationId: string, companyId: string) {
    const obligation = await this.prisma.obligation.findFirst({
      where: { id: obligationId, account: { companyId } },
      select: { id: true },
    });
    if (!obligation) {
      throw new NotFoundException(`Obligation ${obligationId} not found`);
    }
    return this.prisma.obligation.delete({ where: { id: obligationId } });
  }

  async getFarmMap(farmId: string, companyId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        companyId,
        OR: [{ id: farmId }, { name: farmId }],
      },
      select: {
        id: true,
        name: true,
        inn: true,
        holdingId: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Farm ${farmId} not found`);
    }

    const plans = await this.prisma.harvestPlan.findMany({
      where: {
        companyId,
        accountId: account.id,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const planIds = plans.map((plan) => plan.id);

    const fields = await this.prisma.field.findMany({
      where: {
        companyId,
        clientId: account.id,
      },
      select: {
        id: true,
        name: true,
        area: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const techMaps =
      planIds.length === 0
        ? []
        : await this.prisma.techMap.findMany({
          where: {
            companyId,
            harvestPlanId: { in: planIds },
          },
          select: {
            id: true,
            status: true,
            harvestPlanId: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
        });

    const totalArea = fields.reduce(
      (sum, field) => sum + Number(field.area || 0),
      0,
    );
    const activePlans = plans.filter((plan) =>
      ["REVIEW", "APPROVED", "ACTIVE"].includes(String(plan.status)),
    ).length;
    const activeTechMaps = techMaps.filter(
      (techMap) => String(techMap.status) === "ACTIVE",
    ).length;

    return {
      farm: {
        id: account.id,
        name: account.name || account.id,
        inn: account.inn,
        holdingId: account.holdingId,
        companyId,
      },
      metrics: {
        plans: plans.length,
        activePlans,
        fields: fields.length,
        totalArea,
        techMaps: techMaps.length,
        activeTechMaps,
      },
      plans: plans.slice(0, 20),
      fields: fields.slice(0, 20),
      techMaps: techMaps.slice(0, 20),
    };
  }

  async getFarmsRegistry(
    companyId: string,
    options?: {
      search?: string;
      severity?: string;
      sort?: string;
      onlyRisk?: boolean;
      page?: number;
      pageSize?: number;
    },
  ) {
    const search = String(options?.search || "").trim();
    const severityFilter = String(options?.severity || "")
      .trim()
      .toLowerCase();
    const page = Math.max(1, Number(options?.page || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(options?.pageSize || 20)),
    );
    const sort = String(options?.sort || "plans_desc").toLowerCase();
    const onlyRisk = Boolean(options?.onlyRisk);

    const accounts = await this.prisma.account.findMany({
      where: {
        companyId,
        ...(search
          ? {
            OR: [
              { id: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
          : {}),
      },
      select: {
        id: true,
        name: true,
        harvestPlans: {
          select: {
            status: true,
          },
        },
      },
    });

    type FarmSeverity = "ok" | "warning" | "critical";

    const toSeverity = (
      plansCount: number,
      activeCount: number,
    ): FarmSeverity => {
      if (plansCount > 0 && activeCount === 0) return "critical";
      if (plansCount > 0 && activeCount / plansCount < 0.5) return "warning";
      return "ok";
    };

    const all = accounts.map((acc) => {
      const plansCount = acc.harvestPlans.length;
      const activeCount = acc.harvestPlans.filter((p) =>
        ["REVIEW", "APPROVED", "ACTIVE"].includes(String(p.status)),
      ).length;

      return {
        id: acc.id,
        name: acc.name,
        plans: plansCount,
        active: activeCount,
        severity: toSeverity(plansCount, activeCount),
      };
    });

    const sorters: Record<
      string,
      (a: any, b: any) => number
    > = {
      plans_desc: (a, b) => b.plans - a.plans,
      plans_asc: (a, b) => a.plans - b.plans,
      active_desc: (a, b) => b.active - a.active,
      active_asc: (a, b) => a.active - b.active,
      name_asc: (a, b) => a.name.localeCompare(b.name),
      name_desc: (a, b) => b.name.localeCompare(a.name),
    };
    const sorter = sorters[sort] || sorters.plans_desc;
    all.sort(sorter);

    const severitySeed: Record<FarmSeverity, number> = {
      ok: 0,
      warning: 0,
      critical: 0,
    };
    const bySeverity = all.reduce(
      (acc: Record<FarmSeverity, number>, item: { severity: FarmSeverity }) => {
        acc[item.severity] += 1;
        return acc;
      },
      severitySeed,
    );

    const severityFiltered =
      severityFilter === "ok" ||
        severityFilter === "warning" ||
        severityFilter === "critical"
        ? all.filter((item) => item.severity === severityFilter)
        : all;
    const filtered = onlyRisk
      ? severityFiltered.filter(
        (item) => item.severity === "warning" || item.severity === "critical",
      )
      : severityFiltered;

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      stats: {
        total: all.length,
        ok: bySeverity.ok,
        warning: bySeverity.warning,
        critical: bySeverity.critical,
      },
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      filters: {
        severity: severityFilter || null,
        sort,
        onlyRisk,
      },
    };
  }
}
