import { PrismaClient } from "@rai/prisma-client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const parties = await prisma.party.findMany({
    include: {
      jurisdiction: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let createdAccounts = 0;
  let updatedAccounts = 0;
  let skippedAmbiguous = 0;
  let syncedContacts = 0;

  for (const party of parties) {
    const projectedName = resolveProjectedAccountName(party);
    const projectedInn = extractPartyInn(party.registrationData) ?? null;
    const projectedJurisdiction =
      extractJurisdictionLabel(party.jurisdiction ?? null) ?? null;

    const existingByParty = await prisma.account.findFirst({
      where: {
        companyId: party.companyId,
        partyId: party.id,
      },
      orderBy: { updatedAt: "desc" },
    });

    let account = existingByParty;
    if (!account && projectedInn) {
      account = await prisma.account.findFirst({
        where: {
          companyId: party.companyId,
          inn: projectedInn,
        },
      });
    }

    if (!account) {
      const exactNameMatches = await prisma.account.findMany({
        where: {
          companyId: party.companyId,
          name: {
            equals: projectedName,
            mode: "insensitive",
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 2,
      });

      if (exactNameMatches.length === 1) {
        account = exactNameMatches[0];
      } else if (exactNameMatches.length > 1) {
        skippedAmbiguous += 1;
        continue;
      }
    }

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          partyId: party.id,
          ...(projectedInn ? { inn: projectedInn } : {}),
          ...(projectedJurisdiction ? { jurisdiction: projectedJurisdiction } : {}),
          type: mapPartyTypeToAccountType(party.type),
          status: mapPartyStatusToAccountStatus(party.status),
        },
      });
      updatedAccounts += 1;
    } else {
      account = await prisma.account.create({
        data: {
          companyId: party.companyId,
          partyId: party.id,
          name: projectedName,
          ...(projectedInn ? { inn: projectedInn } : {}),
          ...(projectedJurisdiction ? { jurisdiction: projectedJurisdiction } : {}),
          type: mapPartyTypeToAccountType(party.type),
          status: mapPartyStatusToAccountStatus(party.status),
        },
      });
      createdAccounts += 1;
    }

    syncedContacts += await syncProjectedContactsToAccount(
      account.id,
      party.id,
      party.registrationData,
    );
  }

  console.log(
    JSON.stringify(
      {
        parties: parties.length,
        createdAccounts,
        updatedAccounts,
        skippedAmbiguous,
        syncedContacts,
      },
      null,
      2,
    ),
  );
}

async function syncProjectedContactsToAccount(
  accountId: string,
  partyId: string,
  registrationData: unknown,
) {
  const projectedContacts = buildProjectedPartyContacts(partyId, registrationData);
  const sourcePrefix = buildPartySyncSourcePrefix(partyId);
  const existingContacts = await prisma.contact.findMany({
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

    await prisma.contact.delete({
      where: { id: existing.id },
    });
  }

  for (const contact of projectedContacts) {
    const existing = existingContacts.find((item) => item.source === contact.source);
    if (existing) {
      await prisma.contact.update({
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

    await prisma.contact.create({
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

  return projectedContacts.length;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function resolveProjectedAccountName(input: {
  legalName: string;
  shortName?: string | null;
}) {
  return normalizeOptional(input.shortName) ?? normalizeOptional(input.legalName) ?? "Контрагент";
}

function extractPartyInn(registrationData: unknown): string | undefined {
  if (!registrationData || typeof registrationData !== "object") {
    return undefined;
  }
  const data = registrationData as Record<string, unknown>;
  return (
    normalizeOptional(data.inn) ??
    normalizeOptional(
      data.requisites && typeof data.requisites === "object"
        ? (data.requisites as Record<string, unknown>).inn
        : undefined,
    )
  );
}

function extractPartyManagerName(registrationData: unknown): string | undefined {
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

function extractJurisdictionLabel(input?: { code?: string | null; name?: string | null } | null) {
  return normalizeOptional(input?.code) ?? normalizeOptional(input?.name);
}

function mapPartyTypeToAccountType(value?: string | null) {
  switch (String(value || "").trim().toUpperCase()) {
    case "BANK":
      return "SUPPLIER";
    case "INSURER":
    case "MANAGEMENT_CO":
    case "HOLDING":
      return "PARTNER";
    default:
      return "CLIENT";
  }
}

function mapPartyStatusToAccountStatus(value?: string | null) {
  return String(value || "").trim().toUpperCase() === "FROZEN"
    ? "FROZEN"
    : "ACTIVE";
}

function buildPartySyncSourcePrefix(partyId: string) {
  return `PARTY_SYNC:${partyId}:`;
}

function buildProjectedPartyContacts(partyId: string, registrationData: unknown) {
  const data =
    registrationData && typeof registrationData === "object"
      ? (registrationData as Record<string, unknown>)
      : {};
  const contacts = Array.isArray(data.contacts)
    ? (data.contacts as Array<Record<string, unknown>>)
    : [];
  const result = new Map<
    string,
    {
      source: string;
      firstName: string;
      lastName: string | null;
      role: "DECISION_MAKER" | "LEGAL" | "OPERATIONAL";
      email?: string | null;
      phone?: string | null;
      displayName: string;
    }
  >();

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
    const source = `${buildPartySyncSourcePrefix(partyId)}${contactId}`;

    result.set(source, {
      source,
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
        role: "DECISION_MAKER",
        email: null,
        phone: null,
      });
    }
  }

  return Array.from(result.values());
}

function inferProjectedContactRole(value: unknown): "DECISION_MAKER" | "LEGAL" | "OPERATIONAL" {
  const position = normalizeOptional(value)?.toUpperCase() ?? "";
  if (/ЮР|LEGAL|КОМПЛАЕНС|LAW|АДВОКАТ/.test(position)) {
    return "LEGAL";
  }
  if (/ДИРЕКТОР|РУКОВОД|CEO|ГЕНДИР|ГЕНЕРАЛЬН|OWNER|СОБСТВЕН/.test(position)) {
    return "DECISION_MAKER";
  }
  return "OPERATIONAL";
}

function normalizeWorkspaceSearchValue(value: string) {
  return value
    .trim()
    .replace(/["«»']/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeOptional(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function digestIdentity(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}
