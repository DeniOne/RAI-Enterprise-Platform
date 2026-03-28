#!/usr/bin/env node

const { PrismaClient, Prisma } = require("../../packages/prisma-client");

const DEFAULT_COMPANY_ID = "default-rai-company";

function readArg(name) {
  const prefix = `${name}=`;
  const entry = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : null;
}

async function main() {
  const prisma = new PrismaClient();
  const companyId = readArg("--company-id") || DEFAULT_COMPANY_ID;

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    const tenantKey = company.id;
    const tenantDisplayName = company.name || company.id;

    const tenant = await prisma.tenant.upsert({
      where: { key: tenantKey },
      update: {
        displayName: tenantDisplayName,
        status: "ACTIVE",
      },
      create: {
        key: tenantKey,
        displayName: tenantDisplayName,
        status: "ACTIVE",
      },
      select: {
        id: true,
        key: true,
      },
    });

    await prisma.tenantCompanyBinding.upsert({
      where: {
        tenant_company_binding_unique: {
          tenantId: tenant.id,
          companyId: company.id,
        },
      },
      update: {
        isPrimary: true,
        isActive: true,
        unboundAt: null,
      },
      create: {
        tenantId: tenant.id,
        companyId: company.id,
        isPrimary: true,
        isActive: true,
      },
    });

    await prisma.tenantState.upsert({
      where: { companyId: company.id },
      update: {
        tenantId: tenant.id,
        mode: "ACTIVE",
      },
      create: {
        companyId: company.id,
        tenantId: tenant.id,
        mode: "ACTIVE",
      },
    });

    const before = await collectNullBacklog(prisma, company.id);

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "rai_front_office_threads" AS t
        SET "tenantId" = COALESCE(
          (
            SELECT b."tenantId"
            FROM "tenant_company_bindings" AS b
            WHERE b."companyId" = t."companyId"
              AND b."isActive" = TRUE
            ORDER BY b."isPrimary" DESC, b."boundAt" ASC
            LIMIT 1
          ),
          (
            SELECT s."tenantId"
            FROM "tenant_states" AS s
            WHERE s."companyId" = t."companyId"
            LIMIT 1
          )
        )
        WHERE t."tenantId" IS NULL
          AND t."companyId" = ${company.id}
      `,
    );

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "rai_front_office_thread_messages" AS m
        SET "tenantId" = t."tenantId"
        FROM "rai_front_office_threads" AS t
        WHERE m."threadId" = t."id"
          AND m."tenantId" IS NULL
          AND t."companyId" = ${company.id}
      `,
    );

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "rai_front_office_handoffs" AS h
        SET "tenantId" = t."tenantId"
        FROM "rai_front_office_threads" AS t
        WHERE h."threadId" = t."id"
          AND h."tenantId" IS NULL
          AND t."companyId" = ${company.id}
      `,
    );

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "rai_front_office_thread_participant_states" AS p
        SET "tenantId" = t."tenantId"
        FROM "rai_front_office_threads" AS t
        WHERE p."threadId" = t."id"
          AND p."tenantId" IS NULL
          AND t."companyId" = ${company.id}
      `,
    );

    const after = await collectNullBacklog(prisma, company.id);

    console.log(
      JSON.stringify(
        {
          companyId: company.id,
          tenant: {
            id: tenant.id,
            key: tenant.key,
          },
          nullBacklogBefore: before,
          nullBacklogAfter: after,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function collectNullBacklog(prisma, companyId) {
  const [threads, messages, handoffs, participantStates] = await Promise.all([
    prisma.$queryRaw(
      Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "rai_front_office_threads"
        WHERE "companyId" = ${companyId}
          AND "tenantId" IS NULL
      `,
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "rai_front_office_thread_messages" AS m
        JOIN "rai_front_office_threads" AS t ON t."id" = m."threadId"
        WHERE t."companyId" = ${companyId}
          AND m."tenantId" IS NULL
      `,
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "rai_front_office_handoffs" AS h
        JOIN "rai_front_office_threads" AS t ON t."id" = h."threadId"
        WHERE t."companyId" = ${companyId}
          AND h."tenantId" IS NULL
      `,
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "rai_front_office_thread_participant_states" AS p
        JOIN "rai_front_office_threads" AS t ON t."id" = p."threadId"
        WHERE t."companyId" = ${companyId}
          AND p."tenantId" IS NULL
      `,
    ),
  ]);

  return {
    threads: threads[0]?.count ?? 0,
    messages: messages[0]?.count ?? 0,
    handoffs: handoffs[0]?.count ?? 0,
    participantStates: participantStates[0]?.count ?? 0,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
