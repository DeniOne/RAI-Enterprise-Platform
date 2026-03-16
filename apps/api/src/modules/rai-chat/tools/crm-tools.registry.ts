import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ObjectSchema } from "joi";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { PartyService } from "../../commerce/services/party.service";
import { PartyLookupService } from "../../commerce/services/party-lookup.service";
import { CrmService } from "../../crm/crm.service";
import {
  CreateCounterpartyRelationResult,
  CreateCrmAccountResult,
  CreateCrmContactResult,
  DeleteCrmContactResult,
  DeleteCrmInteractionResult,
  DeleteCrmObligationResult,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  UpdateCrmContactResult,
  UpdateCrmInteractionResult,
  UpdateCrmObligationResult,
} from "./rai-tools.types";
import {
  createCounterpartyRelationSchema,
  createCrmAccountSchema,
  createCrmContactSchema,
  createCrmInteractionSchema,
  createCrmObligationSchema,
  deleteCrmContactSchema,
  deleteCrmInteractionSchema,
  deleteCrmObligationSchema,
  getCrmAccountWorkspaceSchema,
  lookupCounterpartyByInnSchema,
  registerCounterpartySchema,
  updateCrmAccountSchema,
  updateCrmContactSchema,
  updateCrmInteractionSchema,
  updateCrmObligationSchema,
} from "../../../shared/rai-chat/crm-tool-schemas";
import {
  buildRegistrationData,
  extractJurisdictionCode,
  hasPartyInn,
  mapLookupTypeToPartyType,
  resolveLookupPartyType,
} from "../../../shared/rai-chat/crm-tool-helpers";

const CRM_TOOL_NAMES: RaiToolName[] = [
  RaiToolName.LookupCounterpartyByInn,
  RaiToolName.RegisterCounterparty,
  RaiToolName.CreateCounterpartyRelation,
  RaiToolName.CreateCrmAccount,
  RaiToolName.GetCrmAccountWorkspace,
  RaiToolName.UpdateCrmAccount,
  RaiToolName.CreateCrmContact,
  RaiToolName.UpdateCrmContact,
  RaiToolName.DeleteCrmContact,
  RaiToolName.CreateCrmInteraction,
  RaiToolName.UpdateCrmInteraction,
  RaiToolName.DeleteCrmInteraction,
  RaiToolName.CreateCrmObligation,
  RaiToolName.UpdateCrmObligation,
  RaiToolName.DeleteCrmObligation,
];

type CrmToolName =
  | RaiToolName.LookupCounterpartyByInn
  | RaiToolName.RegisterCounterparty
  | RaiToolName.CreateCounterpartyRelation
  | RaiToolName.CreateCrmAccount
  | RaiToolName.GetCrmAccountWorkspace
  | RaiToolName.UpdateCrmAccount
  | RaiToolName.CreateCrmContact
  | RaiToolName.UpdateCrmContact
  | RaiToolName.DeleteCrmContact
  | RaiToolName.CreateCrmInteraction
  | RaiToolName.UpdateCrmInteraction
  | RaiToolName.DeleteCrmInteraction
  | RaiToolName.CreateCrmObligation
  | RaiToolName.UpdateCrmObligation
  | RaiToolName.DeleteCrmObligation;

type ToolHandler<TName extends CrmToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredCrmTool<TName extends CrmToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

@Injectable()
export class CrmToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<CrmToolName, RegisteredCrmTool<CrmToolName>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly partyService: PartyService,
    private readonly partyLookupService: PartyLookupService,
    private readonly crmService: CrmService,
  ) {}

  onModuleInit() {
    this.register(
      RaiToolName.LookupCounterpartyByInn,
      lookupCounterpartyByInnSchema,
      async (payload, actorContext) => {
        const normalizedInn = payload.inn.trim();
        const partyType = resolveLookupPartyType(normalizedInn, payload.partyType);
        const lookup = await this.partyLookupService.lookup({
          companyId: actorContext.companyId,
          userId: actorContext.userId,
          request: {
            jurisdictionId: payload.jurisdictionCode ?? "RU",
            partyType,
            identifiers: { inn: normalizedInn },
          },
        });
        const existing = await this.findExistingPartyByInn(
          actorContext.companyId,
          normalizedInn,
        );

        return {
          status: lookup.status,
          source: lookup.source,
          requestKey: lookup.requestKey,
          existingPartyId: existing?.id,
          existingPartyName: existing?.legalName,
          result: lookup.result
            ? {
                legalName: lookup.result.legalName,
                shortName: lookup.result.shortName,
                inn: lookup.result.requisites?.inn,
                kpp: lookup.result.requisites?.kpp,
                ogrn: lookup.result.requisites?.ogrn,
                ogrnip: lookup.result.requisites?.ogrnip,
                address: lookup.result.addresses?.[0]?.full,
                managerName: lookup.result.meta?.managerName,
                registeredAt: lookup.result.meta?.registeredAt,
              }
            : undefined,
          error: lookup.error,
        };
      },
    );

    this.register(
      RaiToolName.RegisterCounterparty,
      registerCounterpartySchema,
      async (payload, actorContext) => {
        const normalizedInn = payload.inn.trim();
        const partyType = resolveLookupPartyType(normalizedInn, payload.partyType);
        const existing = await this.findExistingPartyByInn(
          actorContext.companyId,
          normalizedInn,
        );
        if (existing) {
          return {
            created: false,
            source: "existing_registry",
            partyId: existing.id,
            legalName: existing.legalName,
            shortName: existing.shortName,
            inn: normalizedInn,
            jurisdictionCode: extractJurisdictionCode(existing),
            lookupStatus: "FOUND" as const,
            alreadyExisted: true,
          };
        }

        const lookup = await this.partyLookupService.lookup({
          companyId: actorContext.companyId,
          userId: actorContext.userId,
          request: {
            jurisdictionId: payload.jurisdictionCode ?? "RU",
            partyType,
            identifiers: { inn: normalizedInn },
          },
        });
        const jurisdiction = await this.resolveJurisdictionId(
          actorContext.companyId,
          payload.jurisdictionCode ?? "RU",
        );
        const legalName =
          lookup.result?.legalName?.trim() ||
          payload.legalName?.trim() ||
          null;
        if (!legalName) {
          throw new BadRequestException(
            "Не удалось определить наименование контрагента по ИНН. Укажите legalName вручную.",
          );
        }

        const registrationData = buildRegistrationData(normalizedInn, lookup);
        const created = await this.partyService.createParty(actorContext.companyId, {
          type: mapLookupTypeToPartyType(partyType),
          legalName,
          shortName: lookup.result?.shortName?.trim() || payload.shortName?.trim() || undefined,
          jurisdictionId: jurisdiction.id,
          comment: payload.comment?.trim(),
          registrationData,
        });

        return {
          created: true,
          source: lookup.source,
          partyId: created.id,
          legalName: created.legalName,
          shortName: created.shortName,
          inn: normalizedInn,
          jurisdictionCode: jurisdiction.code,
          lookupStatus: lookup.status,
          alreadyExisted: false,
        };
      },
    );

    this.register(
      RaiToolName.CreateCounterpartyRelation,
      createCounterpartyRelationSchema,
      async (payload, actorContext) => {
        const relation = await this.partyService.createPartyRelation(
          actorContext.companyId,
          {
            fromPartyId: payload.fromPartyId,
            toPartyId: payload.toPartyId,
            relationType: payload.relationType,
            sharePct: payload.sharePct,
            validFrom: payload.validFrom,
            validTo: payload.validTo,
          },
        );

        return {
          relationId: relation.id,
          fromPartyId: relation.sourcePartyId,
          toPartyId: relation.targetPartyId,
          relationType: String(relation.relationType),
          validFrom: relation.validFrom.toISOString(),
          validTo: relation.validTo?.toISOString() ?? null,
        } as CreateCounterpartyRelationResult;
      },
    );

    this.register(
      RaiToolName.CreateCrmAccount,
      createCrmAccountSchema,
      async (payload, actorContext) => {
        const account = await this.crmService.createAccount(
          {
            name: payload.name,
            inn: payload.inn,
            type: payload.type,
            holdingId: payload.holdingId,
            partyId: payload.partyId,
          },
          actorContext.companyId,
        );

        return {
          accountId: account.id,
          name: account.name,
          inn: account.inn,
          type: account.type,
          holdingId: account.holdingId,
          status: account.status,
          partyId: account.partyId ?? null,
        } as CreateCrmAccountResult;
      },
    );

    this.register(
      RaiToolName.GetCrmAccountWorkspace,
      getCrmAccountWorkspaceSchema,
      async (payload, actorContext) => {
        let accountId: string;
        try {
          accountId = await this.crmService.resolveWorkspaceAccountId(
            payload,
            actorContext.companyId,
          );
        } catch (error) {
          if (
            typeof payload.query === "string" &&
            payload.query.trim().length > 0 &&
            this.isCrmWorkspaceNotFoundError(error)
          ) {
            accountId = await this.resolveWorkspaceAccountIdFromPartyRegistry(
              payload.query,
              actorContext.companyId,
            );
          } else {
            throw error;
          }
        }
        return this.crmService.getAccountWorkspace(accountId, actorContext.companyId);
      },
    );

    this.register(
      RaiToolName.UpdateCrmAccount,
      updateCrmAccountSchema,
      async (payload, actorContext) => {
        const updated = await this.crmService.updateAccountProfile(payload.accountId, actorContext.companyId, {
          name: payload.name,
          inn: payload.inn,
          type: payload.type,
          status: payload.status,
          holdingId: payload.holdingId,
          jurisdiction: payload.jurisdiction,
          riskCategory: payload.riskCategory,
          strategicValue: payload.strategicValue,
        });

        return {
          accountId: updated.id,
          name: updated.name,
          inn: updated.inn,
          status: updated.status,
          riskCategory: updated.riskCategory,
          strategicValue: updated.strategicValue,
          updatedAt: updated.updatedAt.toISOString(),
        };
      },
    );

    this.register(
      RaiToolName.CreateCrmContact,
      createCrmContactSchema,
      async (payload, actorContext) => {
        const contact = await this.crmService.createContact(
          payload.accountId,
          actorContext.companyId,
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            role: payload.role,
            influenceLevel: payload.influenceLevel,
            email: payload.email,
            phone: payload.phone,
            source: payload.source,
          },
        );

        return {
          contactId: contact.id,
          accountId: contact.accountId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          role: contact.role,
          email: contact.email,
          phone: contact.phone,
        } as CreateCrmContactResult;
      },
    );

    this.register(
      RaiToolName.UpdateCrmContact,
      updateCrmContactSchema,
      async (payload, actorContext) => {
        const contact = await this.crmService.updateContact(
          payload.contactId,
          actorContext.companyId,
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            role: payload.role,
            influenceLevel: payload.influenceLevel,
            email: payload.email,
            phone: payload.phone,
            source: payload.source,
          },
        );

        return {
          contactId: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          role: contact.role,
          email: contact.email,
          phone: contact.phone,
        } as UpdateCrmContactResult;
      },
    );

    this.register(
      RaiToolName.DeleteCrmContact,
      deleteCrmContactSchema,
      async (payload, actorContext) => {
        const contact = await this.crmService.deleteContact(
          payload.contactId,
          actorContext.companyId,
        );
        return {
          contactId: contact.id,
          deleted: true,
        } as DeleteCrmContactResult;
      },
    );

    this.register(
      RaiToolName.CreateCrmInteraction,
      createCrmInteractionSchema,
      async (payload, actorContext) => {
        const interaction = await this.crmService.createInteraction(payload.accountId, actorContext.companyId, {
          type: payload.type,
          summary: payload.summary,
          date: payload.date,
          contactId: payload.contactId,
          relatedEventId: payload.relatedEventId,
        });

        return {
          interactionId: interaction.id,
          accountId: interaction.accountId,
          type: String(interaction.type),
          summary: interaction.summary,
          date: interaction.date.toISOString(),
        };
      },
    );

    this.register(
      RaiToolName.UpdateCrmInteraction,
      updateCrmInteractionSchema,
      async (payload, actorContext) => {
        const interaction = await this.crmService.updateInteraction(
          payload.interactionId,
          actorContext.companyId,
          {
            type: payload.type,
            summary: payload.summary,
            date: payload.date,
            contactId: payload.contactId,
            relatedEventId: payload.relatedEventId,
          },
        );

        return {
          interactionId: interaction.id,
          accountId: interaction.accountId,
          type: String(interaction.type),
          summary: interaction.summary,
          date: interaction.date.toISOString(),
        } as UpdateCrmInteractionResult;
      },
    );

    this.register(
      RaiToolName.DeleteCrmInteraction,
      deleteCrmInteractionSchema,
      async (payload, actorContext) => {
        const interaction = await this.crmService.deleteInteraction(
          payload.interactionId,
          actorContext.companyId,
        );
        return {
          interactionId: interaction.id,
          deleted: true,
        } as DeleteCrmInteractionResult;
      },
    );

    this.register(
      RaiToolName.CreateCrmObligation,
      createCrmObligationSchema,
      async (payload, actorContext) => {
        const obligation = await this.crmService.createObligation(payload.accountId, actorContext.companyId, {
          description: payload.description,
          dueDate: payload.dueDate,
          responsibleUserId: payload.responsibleUserId,
          status: payload.status,
        });

        return {
          obligationId: obligation.id,
          accountId: obligation.accountId,
          description: obligation.description,
          dueDate: obligation.dueDate.toISOString(),
          status: String(obligation.status),
        };
      },
    );

    this.register(
      RaiToolName.UpdateCrmObligation,
      updateCrmObligationSchema,
      async (payload, actorContext) => {
        const obligation = await this.crmService.updateObligation(
          payload.obligationId,
          actorContext.companyId,
          {
            description: payload.description,
            dueDate: payload.dueDate,
            responsibleUserId: payload.responsibleUserId,
            status: payload.status,
          },
        );

        return {
          obligationId: obligation.id,
          accountId: obligation.accountId,
          description: obligation.description,
          dueDate: obligation.dueDate.toISOString(),
          status: String(obligation.status),
        } as UpdateCrmObligationResult;
      },
    );

    this.register(
      RaiToolName.DeleteCrmObligation,
      deleteCrmObligationSchema,
      async (payload, actorContext) => {
        const obligation = await this.crmService.deleteObligation(
          payload.obligationId,
          actorContext.companyId,
        );
        return {
          obligationId: obligation.id,
          deleted: true,
        } as DeleteCrmObligationResult;
      },
    );
  }

  register<TName extends CrmToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`CRM_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }
    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredCrmTool<CrmToolName>);
  }

  has(name: RaiToolName): boolean {
    return CRM_TOOL_NAMES.includes(name);
  }

  async execute<TName extends CrmToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as RegisteredCrmTool<TName> | undefined;
    if (!tool) {
      throw new BadRequestException(`Unknown CRM tool: ${name}`);
    }
    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });
    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for CRM tool ${name}: ${validation.error.message}`,
      );
    }
    return tool.handler(validation.value, actorContext) as Promise<
      RaiToolResultMap[TName]
    >;
  }

  private async resolveJurisdictionId(companyId: string, code: string) {
    const jurisdiction = await this.prisma.jurisdiction.findFirst({
      where: { companyId, code: code.trim().toUpperCase() },
      select: { id: true, code: true },
    });
    if (!jurisdiction) {
      throw new BadRequestException(
        `В компании не найдена юрисдикция ${code.toUpperCase()} для регистрации контрагента.`,
      );
    }
    return jurisdiction;
  }

  private async findExistingPartyByInn(companyId: string, inn: string) {
    const parties = await this.partyService.listParties(companyId);
    return parties.find((party) => hasPartyInn(party, inn)) ?? null;
  }

  private isCrmWorkspaceNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }
    const name = String((error as { name?: unknown }).name ?? "");
    return name === "NotFoundException";
  }

  private normalizeWorkspaceSearchValue(value: string): string {
    return value
      .trim()
      .replace(/["«»']/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  private extractInnFromRegistrationData(registrationData: unknown): string | undefined {
    if (!registrationData || typeof registrationData !== "object") {
      return undefined;
    }

    const data = registrationData as Record<string, unknown>;
    const directInn = typeof data.inn === "string" ? data.inn.trim() : "";
    if (directInn.length > 0) {
      return directInn;
    }

    const requisites =
      data.requisites && typeof data.requisites === "object"
        ? (data.requisites as Record<string, unknown>)
        : null;
    const reqInn = requisites && typeof requisites.inn === "string" ? requisites.inn.trim() : "";
    return reqInn.length > 0 ? reqInn : undefined;
  }

  private async resolveWorkspaceAccountIdFromPartyRegistry(
    query: string,
    companyId: string,
  ): Promise<string> {
    const needle = this.normalizeWorkspaceSearchValue(query);
    if (!needle) {
      throw new NotFoundException(`ACCOUNT_AND_PARTY_NOT_FOUND:${query}`);
    }

    const parties = await this.partyService.listParties(companyId);
    const matches = parties.filter((party) => {
      const legalName = this.normalizeWorkspaceSearchValue(String(party.legalName ?? ""));
      const shortName = this.normalizeWorkspaceSearchValue(String(party.shortName ?? ""));
      return (
        legalName.includes(needle) ||
        shortName.includes(needle) ||
        needle.includes(legalName) ||
        needle.includes(shortName)
      );
    });

    if (matches.length === 0) {
      throw new NotFoundException(`ACCOUNT_AND_PARTY_NOT_FOUND:${query}`);
    }

    const exact = matches.find((party) => {
      const legalName = this.normalizeWorkspaceSearchValue(String(party.legalName ?? ""));
      const shortName = this.normalizeWorkspaceSearchValue(String(party.shortName ?? ""));
      return legalName === needle || shortName === needle;
    });

    const selected = exact ?? (matches.length === 1 ? matches[0] : null);
    if (!selected) {
      throw new BadRequestException(
        `Найдено несколько контрагентов по запросу "${query}". Уточните название или выберите карточку в реестре.`,
      );
    }

    const partyInn = this.extractInnFromRegistrationData(selected.registrationData);
    if (partyInn) {
      const existingByInn = await this.prisma.account.findFirst({
        where: {
          companyId,
          inn: partyInn,
        },
        select: { id: true },
      });
      if (existingByInn) {
        return existingByInn.id;
      }
    }

    const accountName = String(selected.shortName || selected.legalName || query).trim();
    const existingByName = await this.prisma.account.findFirst({
      where: {
        companyId,
        name: {
          equals: accountName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });
    if (existingByName) {
      return existingByName.id;
    }

    const created = await this.crmService.createAccount(
      {
        name: accountName,
        inn: partyInn,
        type: "CLIENT",
      },
      companyId,
    );
    return created.id;
  }
}
