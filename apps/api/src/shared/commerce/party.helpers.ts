import { BadRequestException } from "@nestjs/common";
import { normalizeVatRate, RegulatoryRulesJson } from "./dto/create-regulatory-profile.dto";
import { CreatePartyRelationDto } from "./dto/create-party.dto";

export type DbPartyRelationType = "OWNERSHIP" | "COMMERCIAL" | "AFFILIATION";
export type ApiPartyRelationType = "OWNERSHIP" | "MANAGEMENT" | "AFFILIATED" | "AGENCY";

export function mapRelationTypeToDb(value: CreatePartyRelationDto["relationType"]): DbPartyRelationType {
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

export function mapRelationTypeFromDb(value: string): ApiPartyRelationType {
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

export function normalizeRulesJson(raw: RegulatoryRulesJson | undefined): RegulatoryRulesJson | undefined {
  if (!raw) {
    return undefined;
  }

  return {
    ...raw,
    vatRate: normalizeVatRate(raw.vatRate),
    vatRateReduced: raw.vatRateReduced !== undefined ? normalizeVatRate(raw.vatRateReduced) : undefined,
    vatRateZero: raw.vatRateZero !== undefined ? normalizeVatRate(raw.vatRateZero) : undefined,
    crossBorderVatRate: normalizeVatRate(raw.crossBorderVatRate),
  };
}

export function mapPartyRelationResponse<T extends {
  sourcePartyId: string;
  targetPartyId: string;
  relationType: string;
  sharePct: number | null;
  basisDocId: string | null;
}>(item: T) {
  return {
    ...item,
    fromPartyId: item.sourcePartyId,
    toPartyId: item.targetPartyId,
    relationType: mapRelationTypeFromDb(String(item.relationType)),
    sharePct: item.sharePct ?? undefined,
    basisDocId: item.basisDocId ?? undefined,
  };
}

export function assertOwnershipShareRequired(
  relationType: ApiPartyRelationType,
  sharePct: unknown,
): void {
  if (relationType !== "OWNERSHIP") {
    return;
  }

  if (!(Number(sharePct) > 0 && Number(sharePct) <= 100)) {
    throw new BadRequestException("OWNERSHIP relation requires sharePct in range (0, 100]");
  }
}

export function assertOwnershipShareIfProvided(
  relationType: ApiPartyRelationType,
  sharePct: unknown,
): void {
  if (relationType !== "OWNERSHIP" || sharePct === null || sharePct === undefined) {
    return;
  }

  if (!(Number(sharePct) > 0 && Number(sharePct) <= 100)) {
    throw new BadRequestException("OWNERSHIP relation requires sharePct in range (0, 100]");
  }
}

export function assertRelationPeriod(validFrom: Date, validTo: Date | null): void {
  if (Number.isNaN(validFrom.getTime())) {
    throw new BadRequestException("validFrom is invalid");
  }
  if (validTo && Number.isNaN(validTo.getTime())) {
    throw new BadRequestException("validTo is invalid");
  }
  if (validTo && validFrom.getTime() >= validTo.getTime()) {
    throw new BadRequestException("validFrom must be earlier than validTo");
  }
}
