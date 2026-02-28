import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccountType } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";

type CanonicalAssetType = "FARM" | "FIELD" | "OBJECT";
type CanonicalAssetRole = "OWNER" | "OPERATOR" | "LESSEE" | "MANAGER" | "BENEFICIARY";

type FarmListFilters = {
  q?: string;
  holdingId?: string;
  operatorId?: string;
  hasLease?: boolean;
};

@Injectable()
export class AssetRoleService {
  constructor(private readonly prisma: PrismaService) {}

  private rangesOverlap(
    leftFrom: Date,
    leftTo: Date | null,
    rightFrom: Date,
    rightTo: Date | null,
  ): boolean {
    const leftEnd = leftTo ?? new Date("9999-12-31T00:00:00.000Z");
    const rightEnd = rightTo ?? new Date("9999-12-31T00:00:00.000Z");
    return leftFrom < rightEnd && rightFrom < leftEnd;
  }

  private async detectAssetType(companyId: string, assetId: string): Promise<CanonicalAssetType> {
    const [farm, field, machinery, stockItem] = await Promise.all([
      this.prisma.account.findFirst({ where: { companyId, id: assetId, type: AccountType.CLIENT }, select: { id: true } }),
      this.prisma.field.findFirst({ where: { companyId, id: assetId }, select: { id: true } }),
      this.prisma.machinery.findFirst({ where: { companyId, id: assetId }, select: { id: true } }),
      this.prisma.stockItem.findFirst({ where: { companyId, id: assetId }, select: { id: true } }),
    ]);

    if (farm) return "FARM";
    if (field) return "FIELD";
    if (machinery || stockItem) return "OBJECT";
    throw new NotFoundException("Asset not found");
  }

  private mapAssetStatus(value: string | null | undefined): "ACTIVE" | "ARCHIVED" {
    return value === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
  }

  async listFarms(companyId: string, filters?: FarmListFilters) {
    const q = String(filters?.q || "").trim();
    const accounts = await this.prisma.account.findMany({
      where: {
        companyId,
        type: AccountType.CLIENT,
        ...(filters?.holdingId ? { holdingId: filters.holdingId } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        holding: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const farmIds = accounts.map((item) => item.id);
    const activeRoles = farmIds.length
      ? await this.prisma.assetPartyRole.findMany({
          where: {
            companyId,
            assetType: "FARM",
            assetId: { in: farmIds },
            OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          },
          include: {
            party: { select: { id: true, legalName: true } },
          },
          orderBy: { validFrom: "desc" },
        })
      : [];

    const roleMap = activeRoles.reduce<Record<string, typeof activeRoles>>((acc, item) => {
      acc[item.assetId] = acc[item.assetId] ?? [];
      acc[item.assetId].push(item);
      return acc;
    }, {});

    return accounts
      .map((account) => {
        const roles = roleMap[account.id] ?? [];
        const operator = roles.find((item) => item.role === "OPERATOR");
        const owner = roles.find((item) => item.role === "OWNER");
        const hasLease = roles.some((item) => item.role === "LESSEE");

        return {
          id: account.id,
          type: "FARM",
          name: account.name,
          regionCode: account.jurisdiction ?? undefined,
          status: this.mapAssetStatus(String(account.status)),
          holdingDerivedName: account.holding?.name ?? undefined,
          operatorParty: operator ? { id: operator.party.id, name: operator.party.legalName } : undefined,
          ownerParty: owner ? { id: owner.party.id, name: owner.party.legalName } : undefined,
          hasLease,
        };
      })
      .filter((item) => {
        if (filters?.operatorId && item.operatorParty?.id !== filters.operatorId) {
          return false;
        }
        if (typeof filters?.hasLease === "boolean" && item.hasLease !== filters.hasLease) {
          return false;
        }
        return true;
      });
  }

  async getFarm(companyId: string, farmId: string) {
    const farm = await this.prisma.account.findFirst({
      where: { companyId, id: farmId, type: AccountType.CLIENT },
      include: { holding: { select: { name: true } } },
    });

    if (!farm) {
      throw new NotFoundException("Farm not found");
    }

    return {
      id: farm.id,
      type: "FARM",
      name: farm.name,
      regionCode: farm.jurisdiction ?? undefined,
      status: this.mapAssetStatus(String(farm.status)),
      holdingDerivedName: farm.holding?.name ?? undefined,
    };
  }

  async createFarm(companyId: string, input: { name: string; regionCode?: string }) {
    const farm = await this.prisma.account.create({
      data: {
        companyId,
        name: input.name.trim(),
        type: AccountType.CLIENT,
        jurisdiction: input.regionCode?.trim() || null,
      },
    });

    return {
      id: farm.id,
      type: "FARM",
      name: farm.name,
      regionCode: farm.jurisdiction ?? undefined,
      status: "ACTIVE" as const,
      holdingDerivedName: undefined,
    };
  }

  async getFarmFields(companyId: string, farmId: string) {
    const fields = await this.prisma.field.findMany({
      where: { companyId, clientId: farmId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return fields.map((field) => ({
      id: field.id,
      type: "FIELD",
      name: field.name,
      status: this.mapAssetStatus(String(field.status)),
    }));
  }

  async listFields(companyId: string) {
    const fields = await this.prisma.field.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return fields.map((field) => ({
      id: field.id,
      type: "FIELD",
      name: field.name,
      status: this.mapAssetStatus(String(field.status)),
    }));
  }

  async listObjects(companyId: string) {
    const [machinery, stockItems] = await Promise.all([
      this.prisma.machinery.findMany({
        where: { companyId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, status: true },
      }),
      this.prisma.stockItem.findMany({
        where: { companyId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, status: true },
      }),
    ]);

    return [...machinery, ...stockItems].map((item) => ({
      id: item.id,
      type: "OBJECT",
      name: item.name,
      status: this.mapAssetStatus(String(item.status)),
    }));
  }

  async listAssetRoles(companyId: string, assetId: string) {
    const rows = await this.prisma.assetPartyRole.findMany({
      where: { companyId, assetId },
      orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
    });

    return rows.map((item) => ({
      id: item.id,
      assetId: item.assetId,
      partyId: item.partyId,
      role: item.role as CanonicalAssetRole,
      validFrom: item.validFrom.toISOString().slice(0, 10),
      validTo: item.validTo ? item.validTo.toISOString().slice(0, 10) : undefined,
    }));
  }

  async createAssetRole(
    companyId: string,
    assetId: string,
    input: {
      partyId: string;
      role: CanonicalAssetRole;
      validFrom: string;
      validTo?: string;
      assetType?: CanonicalAssetType;
    },
  ) {
    const party = await this.prisma.party.findFirst({
      where: { companyId, id: input.partyId },
      select: { id: true },
    });

    if (!party) {
      throw new NotFoundException("Party not found");
    }

    const assetType = input.assetType ?? (await this.detectAssetType(companyId, assetId));
    const validFrom = new Date(input.validFrom);
    const validTo = input.validTo ? new Date(input.validTo) : null;

    if (Number.isNaN(validFrom.getTime())) {
      throw new BadRequestException("validFrom is invalid");
    }
    if (validTo && Number.isNaN(validTo.getTime())) {
      throw new BadRequestException("validTo is invalid");
    }
    if (validTo && validFrom.getTime() >= validTo.getTime()) {
      throw new BadRequestException("validFrom must be earlier than validTo");
    }

    const duplicates = await this.prisma.assetPartyRole.findMany({
      where: {
        companyId,
        assetId,
        assetType: assetType as any,
        partyId: input.partyId,
        role: input.role as any,
      },
    });

    if (
      duplicates.some((item) =>
        this.rangesOverlap(validFrom, validTo, item.validFrom, item.validTo),
      )
    ) {
      throw new BadRequestException("Duplicate asset role with overlapping dates is forbidden");
    }

    const created = await this.prisma.assetPartyRole.create({
      data: {
        companyId,
        assetId,
        assetType: assetType as any,
        partyId: input.partyId,
        role: input.role as any,
        validFrom,
        validTo,
      },
    });

    return {
      id: created.id,
      assetId: created.assetId,
      partyId: created.partyId,
      role: created.role as CanonicalAssetRole,
      validFrom: created.validFrom.toISOString().slice(0, 10),
      validTo: created.validTo ? created.validTo.toISOString().slice(0, 10) : undefined,
    };
  }

  async listPartyAssets(companyId: string, partyId: string) {
    const rows = await this.prisma.assetPartyRole.findMany({
      where: { companyId, partyId },
      orderBy: { validFrom: "desc" },
    });

    const farmIds = rows.filter((item) => item.assetType === "FARM").map((item) => item.assetId);
    const fieldIds = rows.filter((item) => item.assetType === "FIELD").map((item) => item.assetId);
    const objectIds = rows.filter((item) => item.assetType === "OBJECT").map((item) => item.assetId);

    const [farms, fields, machinery, stockItems] = await Promise.all([
      farmIds.length
        ? this.prisma.account.findMany({
            where: { companyId, id: { in: farmIds }, type: AccountType.CLIENT },
            select: { id: true, name: true, jurisdiction: true, status: true },
          })
        : Promise.resolve([]),
      fieldIds.length
        ? this.prisma.field.findMany({
            where: { companyId, id: { in: fieldIds } },
            select: { id: true, name: true, status: true },
          })
        : Promise.resolve([]),
      objectIds.length
        ? this.prisma.machinery.findMany({
            where: { companyId, id: { in: objectIds } },
            select: { id: true, name: true, status: true },
          })
        : Promise.resolve([]),
      objectIds.length
        ? this.prisma.stockItem.findMany({
            where: { companyId, id: { in: objectIds } },
            select: { id: true, name: true, status: true },
          })
        : Promise.resolve([]),
    ]);

    const assets = [
      ...farms.map((item) => ({
        id: item.id,
        type: "FARM" as const,
        name: item.name,
        regionCode: item.jurisdiction ?? undefined,
        status: this.mapAssetStatus(String(item.status)),
      })),
      ...fields.map((item) => ({
        id: item.id,
        type: "FIELD" as const,
        name: item.name,
        status: this.mapAssetStatus(String(item.status)),
      })),
      ...machinery.map((item) => ({
        id: item.id,
        type: "OBJECT" as const,
        name: item.name,
        status: this.mapAssetStatus(String(item.status)),
      })),
      ...stockItems.map((item) => ({
        id: item.id,
        type: "OBJECT" as const,
        name: item.name,
        status: this.mapAssetStatus(String(item.status)),
      })),
    ];

    const roles = rows.map((item) => ({
      id: item.id,
      assetId: item.assetId,
      partyId: item.partyId,
      role: item.role as CanonicalAssetRole,
      validFrom: item.validFrom.toISOString().slice(0, 10),
      validTo: item.validTo ? item.validTo.toISOString().slice(0, 10) : undefined,
    }));

    return { assets, roles };
  }
}
