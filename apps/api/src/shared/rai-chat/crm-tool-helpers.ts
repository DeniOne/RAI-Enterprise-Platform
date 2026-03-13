export type LookupPartyType = "LEGAL_ENTITY" | "IP" | "KFH";

export function resolveLookupPartyType(
  inn: string,
  explicitType?: LookupPartyType,
): LookupPartyType {
  if (explicitType) {
    return explicitType;
  }
  if (inn.length === 10) {
    return "LEGAL_ENTITY";
  }
  return "IP";
}

export function mapLookupTypeToPartyType(
  partyType: LookupPartyType,
): "LEGAL_ENTITY" | "IP" | "KFH" {
  if (partyType === "IP") {
    return "IP";
  }
  if (partyType === "KFH") {
    return "KFH";
  }
  return "LEGAL_ENTITY";
}

export function buildRegistrationData(
  inn: string,
  lookup: {
    status: string;
    result?: {
      requisites?: Record<string, unknown>;
      addresses?: Array<{ type: string; full: string }>;
      meta?: Record<string, unknown>;
    };
  },
) {
  return {
    inn,
    requisites: {
      ...(lookup.result?.requisites ?? {}),
      inn,
    },
    addresses: lookup.result?.addresses ?? [],
    meta: lookup.result?.meta ?? {},
    lookupStatus: lookup.status,
  };
}

export function extractJurisdictionCode(
  party: { jurisdiction?: { code?: string | null } | null },
): string {
  return party.jurisdiction?.code ?? "RU";
}

export function hasPartyInn(
  party: { registrationData?: unknown },
  inn: string,
): boolean {
  const registrationData =
    party.registrationData && typeof party.registrationData === "object"
      ? (party.registrationData as Record<string, unknown>)
      : {};
  const requisites =
    registrationData.requisites &&
    typeof registrationData.requisites === "object"
      ? (registrationData.requisites as Record<string, unknown>)
      : {};
  return registrationData.inn === inn || requisites.inn === inn;
}
