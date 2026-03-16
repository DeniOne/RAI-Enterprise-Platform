import { createHash } from "crypto";
import { AccountStatus, AccountType, ContactRole } from "@rai/prisma-client";

export const PARTY_SYNC_SOURCE_PREFIX = "PARTY_SYNC";

export interface PartyProjectionContact {
  source: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  role: ContactRole;
  email?: string | null;
  phone?: string | null;
}

export function normalizeWorkspaceSearchValue(value: string): string {
  return value
    .trim()
    .replace(/["«»']/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function resolveProjectedAccountName(input: {
  legalName: string;
  shortName?: string | null;
}): string {
  const shortName = normalizeOptional(input.shortName);
  const legalName = normalizeOptional(input.legalName);
  return shortName ?? legalName ?? "Контрагент";
}

export function extractPartyInn(registrationData: unknown): string | undefined {
  if (!registrationData || typeof registrationData !== "object") {
    return undefined;
  }

  const data = registrationData as Record<string, unknown>;
  const directInn = normalizeOptional(data.inn);
  if (directInn) {
    return directInn;
  }

  const requisites =
    data.requisites && typeof data.requisites === "object"
      ? (data.requisites as Record<string, unknown>)
      : null;
  return normalizeOptional(requisites?.inn);
}

export function extractPartyManagerName(
  registrationData: unknown,
): string | undefined {
  if (!registrationData || typeof registrationData !== "object") {
    return undefined;
  }

  const data = registrationData as Record<string, unknown>;
  const meta =
    data.meta && typeof data.meta === "object"
      ? (data.meta as Record<string, unknown>)
      : null;
  return normalizeOptional(meta?.managerName);
}

export function buildPartySyncSourcePrefix(partyId: string): string {
  return `${PARTY_SYNC_SOURCE_PREFIX}:${partyId}:`;
}

export function buildProjectedPartyContacts(
  partyId: string,
  registrationData: unknown,
): PartyProjectionContact[] {
  const data =
    registrationData && typeof registrationData === "object"
      ? (registrationData as Record<string, unknown>)
      : {};
  const contacts = Array.isArray(data.contacts)
    ? (data.contacts as Array<Record<string, unknown>>)
    : [];
  const result = new Map<string, PartyProjectionContact>();

  for (const contact of contacts) {
    const fullName = normalizeOptional(contact.fullName);
    const email = normalizeOptional(contact.email);
    const phone =
      normalizeOptional(contact.phones) ?? normalizeOptional(contact.phone);

    if (!fullName && !email && !phone) {
      continue;
    }

    const contactId =
      normalizeOptional(contact.id) ??
      `generated_${digestIdentity(`${fullName}|${email}|${phone}|${normalizeOptional(contact.position)}`)}`;
    const displayName = fullName ?? email ?? phone ?? "Контакт контрагента";

    result.set(`${buildPartySyncSourcePrefix(partyId)}${contactId}`, {
      source: `${buildPartySyncSourcePrefix(partyId)}${contactId}`,
      displayName,
      firstName: displayName,
      lastName: null,
      role: inferProjectedContactRole(contact.position),
      email: email ?? null,
      phone: phone ?? null,
    });
  }

  const managerName = extractPartyManagerName(registrationData);
  if (managerName) {
    const managerExists = Array.from(result.values()).some(
      (contact) =>
        normalizeWorkspaceSearchValue(contact.displayName) ===
        normalizeWorkspaceSearchValue(managerName),
    );
    if (!managerExists) {
      const source = `${buildPartySyncSourcePrefix(partyId)}meta_manager`;
      result.set(source, {
        source,
        displayName: managerName,
        firstName: managerName,
        lastName: null,
        role: ContactRole.DECISION_MAKER,
        email: null,
        phone: null,
      });
    }
  }

  return Array.from(result.values());
}

export function mapPartyTypeToAccountType(value?: string | null): AccountType {
  switch (String(value || "").trim().toUpperCase()) {
    case "BANK":
      return AccountType.SUPPLIER;
    case "INSURER":
      return AccountType.PARTNER;
    case "MANAGEMENT_CO":
    case "HOLDING":
      return AccountType.PARTNER;
    default:
      return AccountType.CLIENT;
  }
}

export function mapPartyStatusToAccountStatus(
  value?: string | null,
): AccountStatus {
  return String(value || "").trim().toUpperCase() === "FROZEN"
    ? AccountStatus.FROZEN
    : AccountStatus.ACTIVE;
}

export function extractJurisdictionLabel(input?: {
  code?: string | null;
  name?: string | null;
} | null): string | undefined {
  return normalizeOptional(input?.code) ?? normalizeOptional(input?.name);
}

function inferProjectedContactRole(value: unknown): ContactRole {
  const position = normalizeOptional(value)?.toUpperCase() ?? "";
  if (/ЮР|LEGAL|КОМПЛАЕНС|LAW|АДВОКАТ/.test(position)) {
    return ContactRole.LEGAL;
  }
  if (/ДИРЕКТОР|РУКОВОД|CEO|ГЕНДИР|ГЕНЕРАЛЬН|OWNER|СОБСТВЕН/.test(position)) {
    return ContactRole.DECISION_MAKER;
  }
  return ContactRole.OPERATIONAL;
}

function normalizeOptional(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function digestIdentity(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}
