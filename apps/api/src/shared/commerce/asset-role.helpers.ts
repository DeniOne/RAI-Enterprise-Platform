import { NotFoundException } from "@nestjs/common";
import { AccountType } from "@rai/prisma-client";
import { PrismaService } from "../prisma/prisma.service";

export type CanonicalAssetType = "FARM" | "FIELD" | "OBJECT";
export type CanonicalAssetRole = "OWNER" | "OPERATOR" | "LESSEE" | "MANAGER" | "BENEFICIARY";
export type FarmListFilters = {
  q?: string;
  holdingId?: string;
  operatorId?: string;
  hasLease?: boolean;
};
export type CreateAssetRoleInput = {
  partyId: string;
  role: CanonicalAssetRole;
  validFrom: string;
  validTo?: string;
  assetType?: CanonicalAssetType;
  basisDoc?: string;
};
export type UpdateAssetRoleInput = {
  role?: CanonicalAssetRole;
  validFrom?: string;
  validTo?: string | null;
  assetType?: CanonicalAssetType;
  basisDoc?: string | null;
};

const OPEN_ENDED_DATE = new Date("9999-12-31T00:00:00.000Z");

export function rangesOverlap(
  leftFrom: Date,
  leftTo: Date | null,
  rightFrom: Date,
  rightTo: Date | null,
): boolean {
  const leftEnd = leftTo ?? OPEN_ENDED_DATE;
  const rightEnd = rightTo ?? OPEN_ENDED_DATE;
  return leftFrom < rightEnd && rightFrom < leftEnd;
}

export function mapAssetStatus(value: string | null | undefined): "ACTIVE" | "ARCHIVED" {
  return value === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
}

export function mapAssetRoleRow(item: {
  id: string;
  assetId: string;
  partyId: string;
  role: string;
  validFrom: Date;
  validTo: Date | null;
  basisDoc: string | null;
}) {
  return {
    id: item.id,
    assetId: item.assetId,
    partyId: item.partyId,
    role: item.role as CanonicalAssetRole,
    validFrom: item.validFrom.toISOString().slice(0, 10),
    validTo: item.validTo ? item.validTo.toISOString().slice(0, 10) : undefined,
    basisDoc: item.basisDoc ?? undefined,
  };
}

export function mapFarmAssetRow(item: {
  id: string;
  name: string;
  jurisdiction?: string | null;
  status?: string | null;
}) {
  return {
    id: item.id,
    type: "FARM" as const,
    name: item.name,
    regionCode: item.jurisdiction ?? undefined,
    status: mapAssetStatus(item.status),
  };
}

export function mapFieldAssetRow(item: {
  id: string;
  name: string;
  status?: string | null;
}) {
  return {
    id: item.id,
    type: "FIELD" as const,
    name: item.name,
    status: mapAssetStatus(item.status),
  };
}

export function mapObjectAssetRow(item: {
  id: string;
  name: string;
  status?: string | null;
}) {
  return {
    id: item.id,
    type: "OBJECT" as const,
    name: item.name,
    status: mapAssetStatus(item.status),
  };
}

export async function detectAssetType(
  prisma: PrismaService,
  companyId: string,
  assetId: string,
): Promise<CanonicalAssetType> {
  const [farm, field, machinery, stockItem] = await Promise.all([
    prisma.account.findFirst({ where: { companyId, id: assetId, type: AccountType.CLIENT }, select: { id: true } }),
    prisma.field.findFirst({ where: { companyId, id: assetId }, select: { id: true } }),
    prisma.machinery.findFirst({ where: { companyId, id: assetId }, select: { id: true } }),
    prisma.stockItem.findFirst({ where: { companyId, id: assetId }, select: { id: true } }),
  ]);

  if (farm) return "FARM";
  if (field) return "FIELD";
  if (machinery || stockItem) return "OBJECT";
  throw new NotFoundException("Asset not found");
}
