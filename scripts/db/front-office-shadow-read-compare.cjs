#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("../../packages/prisma-client");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const DEFAULT_COMPANY_ID = "default-rai-company";

function readArg(name) {
  const prefix = `${name}=`;
  const entry = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : null;
}

async function resolveTenantId(companyId) {
  const binding = await prisma.tenantCompanyBinding.findFirst({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: [{ isPrimary: "desc" }, { boundAt: "asc" }],
    select: {
      tenantId: true,
    },
  });

  if (binding?.tenantId) {
    return binding.tenantId;
  }

  const state = await prisma.tenantState.findUnique({
    where: {
      companyId,
    },
    select: {
      tenantId: true,
    },
  });

  if (state?.tenantId) {
    return state.tenantId;
  }

  throw new Error(`No tenant mapping found for companyId=${companyId}`);
}

function summarizeRows(rows, fields) {
  return rows.map((row) => {
    const summary = {};
    for (const field of fields) {
      summary[field] = row[field] ?? null;
    }
    return summary;
  });
}

function sortRows(rows) {
  return rows
    .map((row) => JSON.stringify(row))
    .sort()
    .map((entry) => JSON.parse(entry));
}

function compareRowSets(name, legacyRows, tenantRows, fields) {
  const legacySummary = sortRows(summarizeRows(legacyRows, fields));
  const tenantSummary = sortRows(summarizeRows(tenantRows, fields));
  const legacySerialized = legacySummary.map((row) => JSON.stringify(row));
  const tenantSerialized = tenantSummary.map((row) => JSON.stringify(row));

  const onlyLegacy = legacySerialized.filter((row) => !tenantSerialized.includes(row));
  const onlyTenant = tenantSerialized.filter((row) => !legacySerialized.includes(row));

  return {
    name,
    legacyCount: legacyRows.length,
    tenantCount: tenantRows.length,
    onlyLegacyCount: onlyLegacy.length,
    onlyTenantCount: onlyTenant.length,
    status: onlyLegacy.length === 0 && onlyTenant.length === 0 ? "PASS" : "FAIL",
  };
}

async function run() {
  const companyId = readArg("--company-id") || DEFAULT_COMPANY_ID;
  const tenantId = await resolveTenantId(companyId);
  const generatedAt = new Date().toISOString();

  const [legacyThreads, tenantThreads] = await Promise.all([
    prisma.frontOfficeThread.findMany({
      where: { companyId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
    prisma.frontOfficeThread.findMany({
      where: { companyId, tenantId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
  ]);

  const threadIds = legacyThreads.map((thread) => thread.id);

  const [
    legacyMessages,
    tenantMessages,
    legacyHandoffs,
    tenantHandoffs,
    legacyParticipantStates,
    tenantParticipantStates,
  ] = await Promise.all([
    prisma.frontOfficeThreadMessage.findMany({
      where: { companyId, threadId: { in: threadIds } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.frontOfficeThreadMessage.findMany({
      where: { companyId, tenantId, threadId: { in: threadIds } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.frontOfficeHandoffRecord.findMany({
      where: { companyId, threadId: { in: threadIds } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.frontOfficeHandoffRecord.findMany({
      where: { companyId, tenantId, threadId: { in: threadIds } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.frontOfficeThreadParticipantState.findMany({
      where: { companyId, threadId: { in: threadIds } },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
    prisma.frontOfficeThreadParticipantState.findMany({
      where: { companyId, tenantId, threadId: { in: threadIds } },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
  ]);

  const checks = [
    compareRowSets("threads", legacyThreads, tenantThreads, [
      "id",
      "threadKey",
      "farmAccountId",
      "currentClassification",
      "currentHandoffStatus",
    ]),
    compareRowSets("messages", legacyMessages, tenantMessages, [
      "id",
      "threadId",
      "draftId",
      "direction",
      "channel",
    ]),
    compareRowSets("handoffs", legacyHandoffs, tenantHandoffs, [
      "id",
      "threadId",
      "status",
      "targetOwnerRole",
    ]),
    compareRowSets(
      "participant_states",
      legacyParticipantStates,
      tenantParticipantStates,
      ["id", "threadId", "userId", "lastReadMessageId"],
    ),
  ];

  const report = [
    "# DB_FRONT_OFFICE_SHADOW_COMPARE",
    "",
    `- Generated at: \`${generatedAt}\``,
    `- companyId: \`${companyId}\``,
    `- tenantId: \`${tenantId}\``,
    "- compare mode: legacy `companyId` path vs dual-key `companyId + tenantId` path.",
    "",
    "## Thresholds",
    "",
    "- row-count mismatch: `0`",
    "- identity mismatch: `0`",
    "- allowed scope drift: `0`",
    "",
    "## Results",
    "",
    "| Slice | Legacy rows | Dual-key rows | Legacy-only | Dual-key-only | Status |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
    ...checks.map(
      (check) =>
        `| \`${check.name}\` | ${check.legacyCount} | ${check.tenantCount} | ${check.onlyLegacyCount} | ${check.onlyTenantCount} | \`${check.status}\` |`,
    ),
    "",
    "## Verdict",
    "",
    checks.every((check) => check.status === "PASS")
      ? "- Shadow-read compare: `PASS`."
      : "- Shadow-read compare: `FAIL`.",
  ].join("\n");

  const out = path.resolve(
    process.cwd(),
    "docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_SHADOW_COMPARE.md",
  );
  fs.writeFileSync(out, `${report}\n`);
  console.log(out);

  if (!checks.every((check) => check.status === "PASS")) {
    process.exit(1);
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
