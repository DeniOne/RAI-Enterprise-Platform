#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const SOURCE_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-source-register.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-collection.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-collection.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function classifyRow(row) {
  switch (row.assetClass) {
    case "root_package":
      return {
        evidenceClass: "board_ownership_and_licensing",
        ownerScope: "board / legal / product-governance",
        externalDocumentNeeded: "repository stewardship memo, board ownership statement, first-party licensing decision",
      };
    case "application_workspace":
      return {
        evidenceClass: "employment_or_contractor_ip_assignment",
        ownerScope: "legal / engineering management",
        externalDocumentNeeded: "employment clauses or contractor/IP assignment covering application code",
      };
    case "library_workspace":
      return {
        evidenceClass: "employment_or_contractor_ip_assignment",
        ownerScope: "legal / engineering management",
        externalDocumentNeeded: "employment clauses or contractor/IP assignment covering shared library or engine code",
      };
    case "database_schema":
      return {
        evidenceClass: "database_rights_and_schema_authorship",
        ownerScope: "legal / data governance / architecture",
        externalDocumentNeeded: "database rights statement, schema authorship evidence, commercial-use sufficiency",
      };
    case "database_fragments":
      return {
        evidenceClass: "database_rights_and_schema_authorship",
        ownerScope: "legal / data governance / architecture",
        externalDocumentNeeded: "schema fragment ownership evidence and composition responsibility",
      };
    case "database_generated_client":
      return {
        evidenceClass: "derived_artifact_linkage",
        ownerScope: "legal / engineering management",
        externalDocumentNeeded: "link generated client to canonical schema rights and authorship basis",
      };
    default:
      return {
        evidenceClass: "manual_review",
        ownerScope: "legal / techlead",
        externalDocumentNeeded: "manual evidence mapping required",
      };
  }
}

function renderMarkdown(report) {
  return [
    "# Phase A5 Chain Of Title Collection",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_register: \`${report.sourceRegister}\``,
    `- total_assets: \`${report.counts.totalAssets}\``,
    `- evidence_classes: \`${report.counts.evidenceClasses}\``,
    "",
    "## Collection matrix",
    "",
    "| Asset ID | Asset | Path | Evidence class | Owner scope | External document needed |",
    "|---|---|---|---|---|---|",
    ...report.rows.map(
      (row) =>
        `| \`${row.assetId}\` | ${row.assetLabel} | \`${row.path}\` | \`${row.evidenceClass}\` | ${row.ownerScope} | ${row.externalDocumentNeeded} |`,
    ),
    "",
    "## Summary by evidence class",
    "",
    "| Evidence class | Asset count |",
    "|---|---:|",
    ...report.summary.map((item) => `| \`${item.evidenceClass}\` | ${item.assetCount} |`),
    "",
    "## Decision use",
    "",
    "- использовать этот collection-пакет как рабочую матрицу для `ELP-20260328-09`;",
    "- не считать его заменой signed external evidence;",
    "- считать его bridge между repo-derived source map и фактическим legal intake.",
    "",
  ].join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  if (!fs.existsSync(SOURCE_JSON)) {
    console.error(`[phase-a5-chain-of-title-collection] missing_source_register=${rel(SOURCE_JSON)}`);
    process.exit(1);
  }

  const source = JSON.parse(fs.readFileSync(SOURCE_JSON, "utf8"));
  const rows = source.rows.map((row) => ({
    ...row,
    ...classifyRow(row),
  }));

  const summaryMap = new Map();
  for (const row of rows) {
    summaryMap.set(row.evidenceClass, (summaryMap.get(row.evidenceClass) || 0) + 1);
  }
  const summary = [...summaryMap.entries()]
    .map(([evidenceClass, assetCount]) => ({ evidenceClass, assetCount }))
    .sort((a, b) => a.evidenceClass.localeCompare(b.evidenceClass));

  const report = {
    generatedAt: new Date().toISOString(),
    sourceRegister: rel(SOURCE_JSON),
    counts: {
      totalAssets: rows.length,
      evidenceClasses: summary.length,
    },
    summary,
    rows,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(REPORT_MD, renderMarkdown(report));

  console.log(`[phase-a5-chain-of-title-collection] report_json=${rel(REPORT_JSON)}`);
  console.log(`[phase-a5-chain-of-title-collection] report_md=${rel(REPORT_MD)}`);
  console.log(`[phase-a5-chain-of-title-collection] total_assets=${report.counts.totalAssets}`);
  console.log(`[phase-a5-chain-of-title-collection] evidence_classes=${report.counts.evidenceClasses}`);

  if (mode === "enforce" && rows.length === 0) {
    console.error("[phase-a5-chain-of-title-collection] empty_collection");
    process.exit(1);
  }
}

main();
