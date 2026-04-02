#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("../packages/prisma-client");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_ENV_PATH = path.join(ROOT, ".env");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");

dotenv.config({ path: DEFAULT_ENV_PATH });

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function requestJson(baseUrl, endpoint, token) {
  return fetch(`${baseUrl}${endpoint}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `HTTP ${response.status} для ${endpoint}: ${body.slice(0, 500)}`,
      );
    }
    return response.json();
  });
}

function withCompanyScope(endpoint, companyId) {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedCompanyId) {
    return endpoint;
  }

  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}companyId=${encodeURIComponent(normalizedCompanyId)}`;
}

function classifyCompany(company) {
  if (company.id === "default-rai-company") {
    return {
      companyType: "demo_root",
      isOperationalScope: true,
      reason: "seed_root_demo",
    };
  }

  if (
    company.id.startsWith("STRESS_") ||
    String(company.name || "").startsWith("Stress ")
  ) {
    return {
      companyType: "stress_test",
      isOperationalScope: false,
      reason: "concurrency_stress_fixture",
    };
  }

  return {
    companyType: "operational_tenant",
    isOperationalScope: true,
    reason: "regular_tenant",
  };
}

function buildMarkdownReport(report) {
  const lines = [
    "# Rapeseed Cutover Matrix",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- scope: \`${report.scope}\``,
    `- total_companies: \`${report.totalCompanies}\``,
    `- included_companies: \`${report.includedCompanies.length}\``,
    `- excluded_companies: \`${report.excludedCompanies.length}\``,
    `- pass_companies: \`${report.passCompanies.length}\``,
    `- blocked_companies: \`${report.blockedCompanies.length}\``,
    "",
    "## Included PASS",
    "",
    ...(report.passCompanies.length > 0
      ? report.passCompanies.map((companyId) => `- \`${companyId}\``)
      : ["- none"]),
    "",
    "## Excluded Sample",
    "",
    ...(report.excludedCompanies.slice(0, 8).length > 0
      ? report.excludedCompanies.slice(0, 8).map(
          (item) =>
            `- \`${item.companyId}\` \`${item.companyType}\` ${item.reason}`,
        )
      : ["- none"]),
    "",
    "## Blocked Sample",
    "",
    ...(report.results.filter((item) => item.verdict === "BLOCKED").slice(0, 8).length >
    0
      ? report.results
          .filter((item) => item.verdict === "BLOCKED")
          .slice(0, 8)
          .map(
            (item) =>
              `- \`${item.companyId}\`: ${(item.blockers || []).join("; ")}`,
          )
      : ["- none"]),
    "",
  ];

  return lines.join("\n");
}

async function main() {
  const scope = getArg("scope") || "operational";
  if (scope !== "operational" && scope !== "all") {
    console.error("Ожидается --scope=operational|all");
    process.exit(1);
  }

  const token = getArg("token") || process.env.RAI_API_TOKEN || "";
  const apiBaseUrl =
    getArg("api-url") ||
    process.env.RAI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api";

  const prisma = new PrismaClient();

  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });

    const classified = companies.map((company) => ({
      companyId: company.id,
      companyName: company.name,
      ...classifyCompany(company),
    }));

    const includedCompanies =
      scope === "all"
        ? classified
        : classified.filter((item) => item.isOperationalScope);
    const excludedCompanies =
      scope === "all"
        ? []
        : classified.filter((item) => !item.isOperationalScope);

    const results = [];
    for (const company of includedCompanies) {
      const [summary, readiness, packet] = await Promise.all([
        requestJson(
          apiBaseUrl,
          withCompanyScope("/tech-map/generation-rollout/summary", company.companyId),
          token,
        ),
        requestJson(
          apiBaseUrl,
          withCompanyScope("/tech-map/generation-rollout/readiness", company.companyId),
          token,
        ),
        requestJson(
          apiBaseUrl,
          withCompanyScope(
            "/tech-map/generation-rollout/cutover-packet",
            company.companyId,
          ),
          token,
        ),
      ]);

      results.push({
        companyId: company.companyId,
        companyName: company.companyName,
        companyType: company.companyType,
        status:
          readiness.verdict === "PASS" ? "ready_for_cutover" : "cutover_blocked",
        verdict: readiness.verdict,
        blockers: readiness.blockers ?? [],
        warnings: readiness.warnings ?? [],
        canEnableCanonicalDefault: readiness.canEnableCanonicalDefault ?? false,
        suggestedMode: readiness.suggestedMode ?? null,
        totalRapeseedMaps: summary.totalRapeseedMaps ?? 0,
        rolloutManagedMaps: summary.rolloutManagedMaps ?? 0,
        canonicalSchema: summary?.strategies?.canonicalSchema ?? 0,
        packetVerdict: packet.verdict ?? null,
      });
    }

    const report = {
      generatedAt: new Date().toISOString(),
      scope,
      totalCompanies: classified.length,
      includedCompanies,
      excludedCompanies,
      passCompanies: results
        .filter((item) => item.verdict === "PASS")
        .map((item) => item.companyId),
      blockedCompanies: results
        .filter((item) => item.verdict === "BLOCKED")
        .map((item) => item.companyId),
      warnCompanies: results
        .filter((item) => item.verdict === "WARN")
        .map((item) => item.companyId),
      results,
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const suffix = scope === "all" ? "all" : "operational";
    const reportJson = path.join(
      OUTPUT_DIR,
      `techmap-rapeseed-cutover-matrix-${suffix}.json`,
    );
    const reportMd = path.join(
      OUTPUT_DIR,
      `techmap-rapeseed-cutover-matrix-${suffix}.md`,
    );

    fs.writeFileSync(reportJson, JSON.stringify(report, null, 2));
    fs.writeFileSync(reportMd, buildMarkdownReport(report));

    console.log("[techmap-rapeseed-cutover-matrix] summary");
    console.log(`- scope=${scope}`);
    console.log(`- total_companies=${report.totalCompanies}`);
    console.log(`- included_companies=${report.includedCompanies.length}`);
    console.log(`- excluded_companies=${report.excludedCompanies.length}`);
    console.log(`- pass_companies=${report.passCompanies.length}`);
    console.log(`- blocked_companies=${report.blockedCompanies.length}`);
    console.log(`- report_json=${rel(reportJson)}`);
    console.log(`- report_md=${rel(reportMd)}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[techmap-rapeseed-cutover-matrix] error");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
