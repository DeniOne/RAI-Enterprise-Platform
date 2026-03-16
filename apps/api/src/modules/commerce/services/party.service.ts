import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { CreatePartyDto, UpdatePartyDto, CreatePartyRelationDto, UpdatePartyRelationDto } from "../../../shared/commerce/dto/create-party.dto";
import { CreateJurisdictionDto, UpdateJurisdictionDto } from "../../../shared/commerce/dto/create-jurisdiction.dto";
import { CreateRegulatoryProfileDto, UpdateRegulatoryProfileDto, ListRegulatoryProfilesQueryDto } from "../../../shared/commerce/dto/create-regulatory-profile.dto";
import { assertOwnershipShareIfProvided, assertOwnershipShareRequired, assertRelationPeriod, mapPartyRelationResponse, mapRelationTypeFromDb, mapRelationTypeToDb, normalizeRulesJson } from "../../../shared/commerce/party.helpers";
import {
    buildProjectedPartyContacts,
    buildPartySyncSourcePrefix,
    extractJurisdictionLabel,
    extractPartyInn,
    mapPartyStatusToAccountStatus,
    mapPartyTypeToAccountType,
    resolveProjectedAccountName,
} from "../../../shared/commerce/party-account-projection";

@Injectable()
export class PartyService {
    constructor(private readonly prisma: PrismaService) { }

    async getDefaultTenant() {
        const company = await this.prisma.company.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true },
        });
        if (!company) {
            console.warn('[PartyService] No company found in DB. Using fallback.');
            return {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Dev Company (Fallback)',
            };
        }
        return company;
    }


    async listJurisdictions(companyId: string) {
        return this.prisma.jurisdiction.findMany({
            where: { companyId },
            orderBy: { code: "asc" },
        });
    }

    async createJurisdiction(companyId: string, dto: CreateJurisdictionDto) {
        const existing = await this.prisma.jurisdiction.findFirst({
            where: { companyId, code: dto.code },
        });
        if (existing) {
            throw new BadRequestException(`Jurisdiction with code "${dto.code}" already exists`);
        }

        return this.prisma.jurisdiction.create({
            data: {
                companyId,
                code: dto.code.trim().toUpperCase(),
                name: dto.name,
            },
        });
    }

    async updateJurisdiction(companyId: string, jurisdictionId: string, dto: UpdateJurisdictionDto) {
        const existing = await this.prisma.jurisdiction.findFirst({
            where: { companyId, id: jurisdictionId },
        });
        if (!existing) {
            throw new NotFoundException("Jurisdiction not found");
        }

        const nextCode = dto.code?.trim().toUpperCase();
        if (nextCode && nextCode !== existing.code) {
            const duplicate = await this.prisma.jurisdiction.findFirst({
                where: { companyId, code: nextCode },
            });
            if (duplicate) {
                throw new BadRequestException(`Jurisdiction with code "${nextCode}" already exists`);
            }
        }

        return this.prisma.jurisdiction.update({
            where: { id: jurisdictionId },
            data: {
                ...(nextCode !== undefined && { code: nextCode }),
                ...(dto.name !== undefined && { name: dto.name }),
            },
        });
    }

    async deleteJurisdiction(companyId: string, jurisdictionId: string) {
        const existing = await this.prisma.jurisdiction.findFirst({
            where: { companyId, id: jurisdictionId },
        });
        if (!existing) {
            throw new NotFoundException("Jurisdiction not found");
        }

        const [profilesCount, partiesCount, contractsCount] = await Promise.all([
            this.prisma.regulatoryProfile.count({ where: { companyId, jurisdictionId } }),
            this.prisma.party.count({ where: { companyId, jurisdictionId } }),
            this.prisma.commerceContract.count({ where: { companyId, jurisdictionId } }),
        ]);

        const linkedCount = profilesCount + partiesCount + contractsCount;
        if (linkedCount > 0) {
            throw new BadRequestException(
                "Cannot delete jurisdiction: it is used by parties, regulatory profiles, or contracts",
            );
        }

        await this.prisma.jurisdiction.delete({
            where: { id: jurisdictionId },
        });

        return { ok: true };
    }


    async listRegulatoryProfiles(companyId: string, query?: ListRegulatoryProfilesQueryDto) {
        const where: Record<string, unknown> = { companyId };

        if (query?.jurisdictionId) {
            where.jurisdictionId = query.jurisdictionId;
        }
        if (query?.isSystemPreset !== undefined) {
            where.isSystemPreset = query.isSystemPreset;
        }

        return this.prisma.regulatoryProfile.findMany({
            where,
            include: { jurisdiction: true },
            orderBy: [{ isSystemPreset: "desc" }, { code: "asc" }],
        });
    }

    async createRegulatoryProfile(companyId: string, dto: CreateRegulatoryProfileDto) {
        const jurisdiction = await this.prisma.jurisdiction.findFirst({
            where: { companyId, id: dto.jurisdictionId },
        });
        if (!jurisdiction) {
            throw new BadRequestException("Jurisdiction not found");
        }

        const existing = await this.prisma.regulatoryProfile.findFirst({
            where: { companyId, code: dto.code },
        });
        if (existing) {
            throw new BadRequestException(`Regulatory profile with code "${dto.code}" already exists`);
        }

        const normalizedRules = normalizeRulesJson(dto.rulesJson);

        return this.prisma.regulatoryProfile.create({
            data: {
                companyId,
                code: dto.code.trim().toUpperCase(),
                name: dto.name,
                jurisdictionId: dto.jurisdictionId,
                rulesJson: normalizedRules as unknown as Prisma.InputJsonValue | undefined,
            },
            include: { jurisdiction: true },
        });
    }

    async updateRegulatoryProfile(
        companyId: string,
        profileId: string,
        dto: UpdateRegulatoryProfileDto,
    ) {
        const existing = await this.prisma.regulatoryProfile.findFirst({
            where: { companyId, id: profileId },
        });
        if (!existing) {
            throw new NotFoundException("Regulatory profile not found");
        }

        // Системный пресет: запрещаем смену code
        if ((existing as any).isSystemPreset && dto.code && dto.code !== existing.code) {
            throw new ForbiddenException("Cannot change code of a system preset");
        }

        // Проверяем уникальность нового кода
        const nextCode = dto.code?.trim().toUpperCase();
        if (nextCode && nextCode !== existing.code) {
            const duplicate = await this.prisma.regulatoryProfile.findFirst({
                where: { companyId, code: nextCode },
            });
            if (duplicate) {
                throw new BadRequestException(`Regulatory profile with code "${nextCode}" already exists`);
            }
        }

        if (dto.jurisdictionId) {
            const jur = await this.prisma.jurisdiction.findFirst({
                where: { companyId, id: dto.jurisdictionId },
            });
            if (!jur) throw new BadRequestException("Jurisdiction not found");
        }

        const normalizedRules = dto.rulesJson ? normalizeRulesJson(dto.rulesJson) : undefined;

        return this.prisma.regulatoryProfile.update({
            where: { id: profileId },
            data: {
                ...(nextCode !== undefined && { code: nextCode }),
                ...(dto.name !== undefined && { name: dto.name }),
                companyId,
                ...(dto.jurisdictionId !== undefined && { jurisdictionId: dto.jurisdictionId }),
                ...(normalizedRules !== undefined && { rulesJson: normalizedRules as unknown as Prisma.InputJsonValue }),
            },
            include: { jurisdiction: true },
        });
    }

    async deleteRegulatoryProfile(companyId: string, profileId: string) {
        const existing = await this.prisma.regulatoryProfile.findFirst({
            where: { companyId, id: profileId },
        });
        if (!existing) {
            throw new NotFoundException("Regulatory profile not found");
        }

        // Системный пресет — запрет удаления
        if ((existing as any).isSystemPreset) {
            throw new ForbiddenException("Cannot delete a system preset regulatory profile");
        }

        // Проверяем привязанных контрагентов
        const partiesCount = await this.prisma.party.count({
            where: { companyId, regulatoryProfileId: profileId },
        });
        if (partiesCount > 0) {
            throw new BadRequestException(
                `Cannot delete regulatory profile: it is used by ${partiesCount} party(ies)`,
            );
        }

        await this.prisma.regulatoryProfile.delete({ where: { id: profileId } });
        return { ok: true };
    }


    async listParties(companyId: string) {
        const parties = await this.prisma.party.findMany({
            where: { companyId },
            include: {
                jurisdiction: true,
                regulatoryProfile: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return this.attachLinkedAccounts(companyId, parties);
    }

    async getParty(companyId: string, partyId: string) {
        const party = await this.prisma.party.findFirst({
            where: { companyId, id: partyId },
            include: {
                jurisdiction: true,
                regulatoryProfile: true,
                contractRoles: {
                    include: {
                        contract: {
                            select: {
                                id: true,
                                number: true,
                                type: true,
                                status: true,
                            },
                        },
                    },
                },
                sourceRelations: {
                    include: {
                        targetParty: { select: { id: true, legalName: true } },
                    },
                },
                targetRelations: {
                    include: {
                        sourceParty: { select: { id: true, legalName: true } },
                    },
                },
            },
        });

        if (!party) {
            throw new NotFoundException("Party not found");
        }

        return this.attachLinkedAccount(companyId, party);
    }

    async createParty(companyId: string, dto: CreatePartyDto) {
        const jurisdiction = await this.prisma.jurisdiction.findFirst({
            where: { companyId, id: dto.jurisdictionId },
        });
        if (!jurisdiction) {
            throw new BadRequestException("Jurisdiction not found");
        }

        if (dto.regulatoryProfileId) {
            const profile = await this.prisma.regulatoryProfile.findFirst({
                where: { companyId, id: dto.regulatoryProfileId },
            });
            if (!profile) {
                throw new BadRequestException("RegulatoryProfile not found");
            }
        }

        const created = await this.prisma.party.create({
            data: {
                companyId,
                type: (dto.type ?? "LEGAL_ENTITY") as any,
                legalName: dto.legalName,
                shortName: dto.shortName ?? null,
                jurisdictionId: dto.jurisdictionId,
                status: (dto.status ?? "ACTIVE") as any,
                comment: dto.comment ?? null,
                regulatoryProfileId: dto.regulatoryProfileId ?? null,
                registrationData: dto.registrationData ?? null,
            },
            include: {
                jurisdiction: true,
                regulatoryProfile: true,
            },
        });

        await this.syncAccountProjectionForPartyRecord(companyId, created);
        return this.attachLinkedAccount(companyId, created);
    }

    async updateParty(companyId: string, partyId: string, dto: UpdatePartyDto) {
        const party = await this.prisma.party.findFirst({
            where: { companyId, id: partyId },
            include: {
                jurisdiction: true,
                regulatoryProfile: true,
            },
        });
        if (!party) {
            throw new NotFoundException("Party not found");
        }

        if (dto.jurisdictionId) {
            const jurisdiction = await this.prisma.jurisdiction.findFirst({
                where: { companyId, id: dto.jurisdictionId },
            });
            if (!jurisdiction) {
                throw new BadRequestException("Jurisdiction not found");
            }
        }

        const updated = await this.prisma.party.update({
            where: { id: partyId },
            data: {
                ...(dto.type !== undefined && { type: dto.type as any }),
                ...(dto.legalName !== undefined && { legalName: dto.legalName }),
                ...(dto.shortName !== undefined && { shortName: dto.shortName ?? null }),
                ...(dto.jurisdictionId !== undefined && { jurisdictionId: dto.jurisdictionId }),
                ...(dto.status !== undefined && { status: dto.status as any }),
                ...(dto.comment !== undefined && { comment: dto.comment ?? null }),
                ...(dto.regulatoryProfileId !== undefined && {
                    regulatoryProfileId: dto.regulatoryProfileId ?? null,
                }),
                ...(dto.registrationData !== undefined && {
                    registrationData: dto.registrationData ?? null,
                }),
            },
            include: {
                jurisdiction: true,
                regulatoryProfile: true,
            },
        });

        await this.syncAccountProjectionForPartyRecord(companyId, updated, party);
        return this.attachLinkedAccount(companyId, updated);
    }


    async createPartyRelation(companyId: string, dto: CreatePartyRelationDto) {
        const [source, target] = await Promise.all([
            this.prisma.party.findFirst({ where: { companyId, id: dto.fromPartyId } }),
            this.prisma.party.findFirst({ where: { companyId, id: dto.toPartyId } }),
        ]);

        if (!source) throw new BadRequestException("Source party not found");
        if (!target) throw new BadRequestException("Target party not found");
        if (dto.fromPartyId === dto.toPartyId) {
            throw new BadRequestException("Cannot create relation with self");
        }
        const validFrom = new Date(dto.validFrom);
        const validTo = dto.validTo ? new Date(dto.validTo) : null;
        assertOwnershipShareRequired(dto.relationType, dto.sharePct);
        assertRelationPeriod(validFrom, validTo);

        return this.prisma.partyRelation.create({
            data: {
                companyId,
                sourcePartyId: dto.fromPartyId,
                targetPartyId: dto.toPartyId,
                relationType: mapRelationTypeToDb(dto.relationType) as any,
                sharePct: dto.sharePct ?? null,
                validFrom,
                validTo,
                basisDocId: dto.basisDocId ?? null,
            },
            include: {
                sourceParty: { select: { id: true, legalName: true } },
                targetParty: { select: { id: true, legalName: true } },
            },
        });
    }

    async updatePartyRelation(companyId: string, relationId: string, dto: UpdatePartyRelationDto) {
        const existing = await this.prisma.partyRelation.findFirst({
            where: { companyId, id: relationId },
        });
        if (!existing) {
            throw new NotFoundException("Party relation not found");
        }

        const nextFromPartyId = dto.fromPartyId ?? existing.sourcePartyId;
        const nextToPartyId = dto.toPartyId ?? existing.targetPartyId;
        const nextRelationType = dto.relationType ?? mapRelationTypeFromDb(String(existing.relationType));
        const nextSharePct = dto.sharePct === undefined ? existing.sharePct : dto.sharePct;
        const nextValidFrom = dto.validFrom ? new Date(dto.validFrom) : existing.validFrom;
        const nextValidTo =
            dto.validTo === undefined
                ? existing.validTo
                : dto.validTo
                    ? new Date(dto.validTo)
                    : null;

        const [source, target] = await Promise.all([
            this.prisma.party.findFirst({ where: { companyId, id: nextFromPartyId } }),
            this.prisma.party.findFirst({ where: { companyId, id: nextToPartyId } }),
        ]);

        if (!source) throw new BadRequestException("Source party not found");
        if (!target) throw new BadRequestException("Target party not found");
        if (nextFromPartyId === nextToPartyId) {
            throw new BadRequestException("Cannot create relation with self");
        }
        assertOwnershipShareIfProvided(nextRelationType, nextSharePct);
        assertRelationPeriod(nextValidFrom, nextValidTo);

        return this.prisma.partyRelation.update({
            where: { id: relationId },
            data: {
                sourcePartyId: nextFromPartyId,
                targetPartyId: nextToPartyId,
                relationType: mapRelationTypeToDb(nextRelationType) as any,
                sharePct: nextSharePct ?? null,
                validFrom: nextValidFrom,
                validTo: nextValidTo,
                basisDocId:
                    dto.basisDocId === undefined
                        ? existing.basisDocId
                        : dto.basisDocId ?? null,
            },
            include: {
                sourceParty: { select: { id: true, legalName: true } },
                targetParty: { select: { id: true, legalName: true } },
            },
        });
    }

    async deletePartyRelation(companyId: string, relationId: string) {
        const existing = await this.prisma.partyRelation.findFirst({
            where: { companyId, id: relationId },
            select: { id: true },
        });
        if (!existing) {
            throw new NotFoundException("Party relation not found");
        }

        await this.prisma.partyRelation.delete({
            where: { id: relationId },
        });

        return { ok: true };
    }

    async listPartyRelations(companyId: string, partyId: string) {
        const rows = await this.prisma.partyRelation.findMany({
            where: {
                companyId,
                OR: [{ sourcePartyId: partyId }, { targetPartyId: partyId }],
            },
            include: {
                sourceParty: { select: { id: true, legalName: true } },
                targetParty: { select: { id: true, legalName: true } },
            },
        });

        return rows.map(mapPartyRelationResponse);
    }

    private async attachLinkedAccounts<T extends { id: string } & Record<string, unknown>>(
        companyId: string,
        parties: T[],
    ) {
        if (parties.length === 0) {
            return parties;
        }

        const partyIds = parties.map((party) => party.id);
        const accounts = await this.prisma.account.findMany({
            where: {
                companyId,
                partyId: { in: partyIds },
            },
            select: {
                id: true,
                name: true,
                inn: true,
                status: true,
                partyId: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
        });
        const accountMap = new Map<string, (typeof accounts)[number]>();
        for (const account of accounts) {
            if (account.partyId && !accountMap.has(account.partyId)) {
                accountMap.set(account.partyId, account);
            }
        }

        return parties.map((party) => ({
            ...party,
            linkedAccount: accountMap.get(party.id) ?? null,
        }));
    }

    private async attachLinkedAccount<T extends { id: string } & Record<string, unknown>>(
        companyId: string,
        party: T,
    ) {
        const [result] = await this.attachLinkedAccounts(companyId, [party]);
        return result;
    }

    private async syncAccountProjectionForPartyRecord(
        companyId: string,
        party: {
            id: string;
            legalName: string;
            shortName: string | null;
            type: string;
            status: string;
            registrationData: unknown;
            jurisdiction?: { code?: string | null; name?: string | null } | null;
        },
        previousParty?: {
            legalName: string;
            shortName: string | null;
        } | null,
    ) {
        const projectedName = resolveProjectedAccountName(party);
        const projectedInn = extractPartyInn(party.registrationData) ?? null;
        const projectedJurisdiction =
            extractJurisdictionLabel(party.jurisdiction ?? null) ?? null;
        const accountType = mapPartyTypeToAccountType(party.type);
        const accountStatus = mapPartyStatusToAccountStatus(party.status);
        const previousProjectedName = previousParty
            ? resolveProjectedAccountName(previousParty)
            : null;

        const linkedAccount = await this.resolveProjectedAccount(companyId, {
            partyId: party.id,
            accountName: projectedName,
            inn: projectedInn,
        });

        const shouldRefreshName =
            !linkedAccount ||
            !String(linkedAccount.name || "").trim() ||
            (previousProjectedName !== null &&
                String(linkedAccount.name || "").trim() === previousProjectedName);

        const account = linkedAccount
            ? await this.prisma.account.update({
                where: { id: linkedAccount.id },
                data: {
                    partyId: party.id,
                    ...(shouldRefreshName ? { name: projectedName } : {}),
                    inn: projectedInn,
                    jurisdiction: projectedJurisdiction,
                    type: accountType,
                    status: accountStatus,
                },
                select: {
                    id: true,
                    name: true,
                },
            })
            : await this.prisma.account.create({
                data: {
                    companyId,
                    partyId: party.id,
                    name: projectedName,
                    inn: projectedInn,
                    jurisdiction: projectedJurisdiction,
                    type: accountType,
                    status: accountStatus,
                },
                select: {
                    id: true,
                    name: true,
                },
            });

        await this.syncProjectedContactsToAccount(
            account.id,
            party.id,
            party.registrationData,
        );
    }

    private async resolveProjectedAccount(
        companyId: string,
        input: {
            partyId: string;
            accountName: string;
            inn?: string | null;
        },
    ) {
        const existingByParty = await this.prisma.account.findFirst({
            where: {
                companyId,
                partyId: input.partyId,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: { updatedAt: "desc" },
        });
        if (existingByParty) {
            return existingByParty;
        }

        if (input.inn) {
            const existingByInn = await this.prisma.account.findFirst({
                where: {
                    companyId,
                    inn: input.inn,
                },
                select: {
                    id: true,
                    name: true,
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
                    equals: input.accountName,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                name: true,
            },
            take: 2,
            orderBy: { updatedAt: "desc" },
        });
        if (exactNameMatches.length === 1) {
            return exactNameMatches[0];
        }

        return null;
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
}
