import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { CreatePartyDto, UpdatePartyDto, CreatePartyRelationDto } from "../dto/create-party.dto";
import { CreateJurisdictionDto, UpdateJurisdictionDto } from "../dto/create-jurisdiction.dto";
import {
    CreateRegulatoryProfileDto,
    UpdateRegulatoryProfileDto,
    ListRegulatoryProfilesQueryDto,
    normalizeVatRate,
    RegulatoryRulesJson,
} from "../dto/create-regulatory-profile.dto";

@Injectable()
export class PartyService {
    constructor(private readonly prisma: PrismaService) { }

    private mapRelationTypeToDb(value: CreatePartyRelationDto["relationType"]): "OWNERSHIP" | "COMMERCIAL" | "AFFILIATION" {
        switch (value) {
            case "OWNERSHIP":
                return "OWNERSHIP";
            case "MANAGEMENT":
            case "AGENCY":
                return "COMMERCIAL";
            case "AFFILIATED":
            default:
                return "AFFILIATION";
        }
    }

    private mapRelationTypeFromDb(value: string): "OWNERSHIP" | "MANAGEMENT" | "AFFILIATED" | "AGENCY" {
        switch (value) {
            case "OWNERSHIP":
                return "OWNERSHIP";
            case "COMMERCIAL":
                return "MANAGEMENT";
            case "AFFILIATION":
            default:
                return "AFFILIATED";
        }
    }

    // ─── Tenant Discovery (no JWT required) ──────────────────────

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

    // ─── Jurisdictions ──────────────────────────────────────────

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

    // ─── Regulatory Profiles ────────────────────────────────────

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

    private normalizeRulesJson(raw: CreateRegulatoryProfileDto["rulesJson"]): RegulatoryRulesJson | undefined {
        if (!raw) return undefined;
        return {
            ...raw,
            vatRate: normalizeVatRate(raw.vatRate),
            vatRateReduced: raw.vatRateReduced !== undefined ? normalizeVatRate(raw.vatRateReduced) : undefined,
            vatRateZero: raw.vatRateZero !== undefined ? normalizeVatRate(raw.vatRateZero) : undefined,
            crossBorderVatRate: normalizeVatRate(raw.crossBorderVatRate),
        };
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

        const normalizedRules = this.normalizeRulesJson(dto.rulesJson);

        return this.prisma.regulatoryProfile.create({
            data: {
                companyId,
                code: dto.code.trim().toUpperCase(),
                name: dto.name,
                jurisdictionId: dto.jurisdictionId,
                rulesJson: normalizedRules ?? undefined,
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

        const normalizedRules = dto.rulesJson ? this.normalizeRulesJson(dto.rulesJson) : undefined;

        return this.prisma.regulatoryProfile.update({
            where: { id: profileId },
            data: {
                ...(nextCode !== undefined && { code: nextCode }),
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.jurisdictionId !== undefined && { jurisdictionId: dto.jurisdictionId }),
                ...(normalizedRules !== undefined && { rulesJson: normalizedRules }),
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

    // ─── Parties ────────────────────────────────────────────────

    async listParties(companyId: string) {
        return this.prisma.party.findMany({
            where: { companyId },
            include: {
                jurisdiction: true,
                regulatoryProfile: true,
            },
            orderBy: { createdAt: "desc" },
        });
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

        return party;
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

        return this.prisma.party.create({
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
    }

    async updateParty(companyId: string, partyId: string, dto: UpdatePartyDto) {
        const party = await this.prisma.party.findFirst({
            where: { companyId, id: partyId },
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

        return this.prisma.party.update({
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
    }

    // ─── Party Relations ────────────────────────────────────────

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
        if (dto.relationType === "OWNERSHIP" && !(Number(dto.sharePct) > 0 && Number(dto.sharePct) <= 100)) {
            throw new BadRequestException("OWNERSHIP relation requires sharePct in range (0, 100]");
        }
        if (dto.validTo && new Date(dto.validFrom).getTime() >= new Date(dto.validTo).getTime()) {
            throw new BadRequestException("validFrom must be earlier than validTo");
        }

        return this.prisma.partyRelation.create({
            data: {
                companyId,
                sourcePartyId: dto.fromPartyId,
                targetPartyId: dto.toPartyId,
                relationType: this.mapRelationTypeToDb(dto.relationType) as any,
                validFrom: new Date(dto.validFrom),
                validTo: dto.validTo ? new Date(dto.validTo) : null,
            },
            include: {
                sourceParty: { select: { id: true, legalName: true } },
                targetParty: { select: { id: true, legalName: true } },
            },
        });
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

        return rows.map((item) => ({
            ...item,
            fromPartyId: item.sourcePartyId,
            toPartyId: item.targetPartyId,
            relationType: this.mapRelationTypeFromDb(String(item.relationType)),
        }));
    }
}
