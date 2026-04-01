#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-source-register.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-source-register.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findWorkspacePackageJsons(baseDir) {
  if (!exists(baseDir)) return [];
  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(baseDir, entry.name, "package.json"))
    .filter((filePath) => exists(filePath))
    .sort();
}

function assetClassForPackage(filePath) {
  if (filePath === path.join(ROOT, "package.json")) return "root_package";
  if (filePath.includes(`${path.sep}apps${path.sep}`)) return "application_workspace";
  if (filePath.includes(`${path.sep}packages${path.sep}`)) return "library_workspace";
  return "workspace";
}

function requiredExternalEvidence(assetClass) {
  switch (assetClass) {
    case "root_package":
      return "board-level ownership statement, repository stewardship basis, first-party licensing decision";
    case "application_workspace":
      return "employment / contractor IP assignment evidence for application code";
    case "library_workspace":
      return "employment / contractor IP assignment evidence for shared library or engine code";
    case "database_schema":
      return "database rights statement, schema authorship evidence, commercial-use sufficiency";
    case "database_generated_client":
      return "link to canonical schema ownership and generation basis";
    case "database_fragments":
      return "fragment ownership evidence and schema composition responsibility";
    default:
      return "employment / contractor / IP assignment evidence";
  }
}

function buildPackageAssetRows() {
  const rows = [];
  const packageFiles = [
    path.join(ROOT, "package.json"),
    ...findWorkspacePackageJsons(path.join(ROOT, "apps")),
    ...findWorkspacePackageJsons(path.join(ROOT, "packages")),
  ];

  let index = 1;
  for (const filePath of packageFiles) {
    const pkg = readJson(filePath);
    const assetClass = assetClassForPackage(filePath);
    rows.push({
      assetId: `A5-CT-${String(index).padStart(2, "0")}`,
      assetClass,
      assetLabel: pkg.name || path.basename(path.dirname(filePath)),
      path: rel(filePath),
      localBasis: [`private=${pkg.private ? "true" : "false"}`, `license=${pkg.license || "missing"}`].join(", "),
      requiredExternalEvidence: requiredExternalEvidence(assetClass),
    });
    index += 1;
  }

  return rows;
}

function buildDatabaseRows(startIndex) {
  const rows = [];
  const schemaPath = path.join(ROOT, "packages", "prisma-client", "schema.prisma");
  const composedPath = path.join(ROOT, "packages", "prisma-client", "schema.composed.prisma");
  const fragmentsDir = path.join(ROOT, "packages", "prisma-client", "schema-fragments");
  const generatedClientDir = path.join(ROOT, "packages", "prisma-client", "generated-client");

  let index = startIndex;

  if (exists(schemaPath)) {
    rows.push({
      assetId: `A5-CT-${String(index).padStart(2, "0")}`,
      assetClass: "database_schema",
      assetLabel: "canonical Prisma schema",
      path: rel(schemaPath),
      localBasis: "canonical schema present in repo",
      requiredExternalEvidence: requiredExternalEvidence("database_schema"),
    });
    index += 1;
  }

  if (exists(composedPath)) {
    rows.push({
      assetId: `A5-CT-${String(index).padStart(2, "0")}`,
      assetClass: "database_schema",
      assetLabel: "composed Prisma schema",
      path: rel(composedPath),
      localBasis: "composed schema present in repo",
      requiredExternalEvidence: requiredExternalEvidence("database_schema"),
    });
    index += 1;
  }

  if (exists(fragmentsDir)) {
    const fragmentCount = fs.readdirSync(fragmentsDir).filter((name) => name.endsWith(".prisma")).length;
    rows.push({
      assetId: `A5-CT-${String(index).padStart(2, "0")}`,
      assetClass: "database_fragments",
      assetLabel: "schema fragments perimeter",
      path: rel(fragmentsDir),
      localBasis: `${fragmentCount} schema fragments present`,
      requiredExternalEvidence: requiredExternalEvidence("database_fragments"),
    });
    index += 1;
  }

  if (exists(generatedClientDir)) {
    rows.push({
      assetId: `A5-CT-${String(index).padStart(2, "0")}`,
      assetClass: "database_generated_client",
      assetLabel: "generated Prisma client perimeter",
      path: rel(generatedClientDir),
      localBasis: "generated client directory present",
      requiredExternalEvidence: requiredExternalEvidence("database_generated_client"),
    });
  }

  return rows;
}

function renderMarkdown(report) {
  return [
    "# Phase A5 Chain Of Title Source Register",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- root_package: \`${report.rootPackage}\``,
    `- application_workspaces: \`${report.counts.applicationWorkspaces}\``,
    `- library_workspaces: \`${report.counts.libraryWorkspaces}\``,
    `- database_assets: \`${report.counts.databaseAssets}\``,
    "",
    "## Assets",
    "",
    "| Asset ID | Class | Asset | Path | Local basis | External evidence needed |",
    "|---|---|---|---|---|---|",
    ...report.rows.map(
      (row) =>
        `| \`${row.assetId}\` | \`${row.assetClass}\` | ${row.assetLabel} | \`${row.path}\` | ${row.localBasis} | ${row.requiredExternalEvidence} |`,
    ),
    "",
    "## Decision use",
    "",
    "- использовать этот register как repo-derived source map для `ELP-20260328-09`;",
    "- не считать его заменой signed chain-of-title evidence;",
    "- считать его картой того, какие first-party активы должны быть покрыты внешним пакетом прав.",
    "",
  ].join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const packageRows = buildPackageAssetRows();
  const databaseRows = buildDatabaseRows(packageRows.length + 1);
  const rows = [...packageRows, ...databaseRows];

  const report = {
    generatedAt: new Date().toISOString(),
    rootPackage: "rai-enterprise-platform",
    counts: {
      totalAssets: rows.length,
      applicationWorkspaces: rows.filter((row) => row.assetClass === "application_workspace").length,
      libraryWorkspaces: rows.filter((row) => row.assetClass === "library_workspace").length,
      databaseAssets: rows.filter((row) => row.assetClass.startsWith("database_")).length,
    },
    rows,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(REPORT_MD, renderMarkdown(report));

  console.log(`[phase-a5-chain-of-title] report_json=${rel(REPORT_JSON)}`);
  console.log(`[phase-a5-chain-of-title] report_md=${rel(REPORT_MD)}`);
  console.log(`[phase-a5-chain-of-title] total_assets=${report.counts.totalAssets}`);
  console.log(`[phase-a5-chain-of-title] application_workspaces=${report.counts.applicationWorkspaces}`);
  console.log(`[phase-a5-chain-of-title] library_workspaces=${report.counts.libraryWorkspaces}`);
  console.log(`[phase-a5-chain-of-title] database_assets=${report.counts.databaseAssets}`);

  const requiredPaths = [
    path.join(ROOT, "package.json"),
    path.join(ROOT, "apps", "api", "package.json"),
    path.join(ROOT, "apps", "web", "package.json"),
    path.join(ROOT, "packages", "prisma-client", "schema.prisma"),
  ];
  const missing = requiredPaths.filter((filePath) => !exists(filePath));
  if (mode === "enforce" && missing.length > 0) {
    missing.forEach((filePath) => console.error(`[phase-a5-chain-of-title] missing_required_path=${rel(filePath)}`));
    process.exit(1);
  }
}

main();
