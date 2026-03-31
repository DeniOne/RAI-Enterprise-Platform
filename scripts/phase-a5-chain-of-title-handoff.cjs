#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const COLLECTION_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-collection.json");
const HANDOFF_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-handoff.json");
const HANDOFF_MD = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-handoff.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function unique(values) {
  return [...new Set(values)];
}

function sortByAssetId(left, right) {
  return left.assetId.localeCompare(right.assetId);
}

function sortByOwnerScope(left, right) {
  return left.ownerScope.localeCompare(right.ownerScope);
}

function buildMarkdown(report) {
  const lines = [
    "# Phase A5 Chain Of Title Handoff",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- collection_report: \`${report.collectionReport}\``,
    `- total_assets: \`${report.totalAssets}\``,
    `- owner_queues: \`${report.ownerQueues.length}\``,
    `- evidence_classes: \`${report.evidenceClasses.length}\``,
    "",
    "## Owner queues",
    "",
  ];

  if (report.ownerQueues.length === 0) {
    lines.push("- none", "");
  } else {
    for (const ownerQueue of report.ownerQueues) {
      lines.push(`### ${ownerQueue.ownerScope}`, "");
      lines.push(
        `- asset_count: \`${ownerQueue.assetCount}\``,
        `- evidence_classes: ${ownerQueue.evidenceClasses.map((value) => `\`${value}\``).join(", ")}`,
        "",
        "| Asset ID | Asset | Path | Evidence class | External document needed |",
        "|---|---|---|---|---|",
      );
      for (const row of ownerQueue.rows) {
        lines.push(
          `| \`${row.assetId}\` | ${row.assetLabel} | \`${row.path}\` | \`${row.evidenceClass}\` | ${row.externalDocumentNeeded} |`,
        );
      }
      lines.push("");
    }
  }

  lines.push(
    "## Decision use",
    "",
    "- использовать этот handoff как owner-ready bridge между repo-side collection packet и внешним `ELP-20260328-09`;",
    "- не считать его заменой signed external evidence;",
    "- собирать employment / contractor / DB-rights / board-ownership документы по очередям ниже, а не по общей памяти о проекте.",
    "",
  );

  return lines.join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  if (!fs.existsSync(COLLECTION_JSON)) {
    console.error(
      `[phase-a5-chain-of-title-handoff] missing_collection_report=${rel(COLLECTION_JSON)}; сначала запусти phase:a5:chain-of-title:collection`,
    );
    process.exit(1);
  }

  const collection = readJson(COLLECTION_JSON);
  const rows = (collection.rows || []).slice().sort(sortByAssetId);
  const ownerMap = new Map();
  const issues = [];

  for (const row of rows) {
    if (!row.ownerScope) {
      issues.push({
        severity: "error",
        type: "missing_owner_scope",
        assetId: row.assetId,
      });
      continue;
    }
    if (!ownerMap.has(row.ownerScope)) {
      ownerMap.set(row.ownerScope, []);
    }
    ownerMap.get(row.ownerScope).push(row);
  }

  const ownerQueues = [...ownerMap.entries()]
    .map(([ownerScope, ownerRows]) => ({
      ownerScope,
      assetCount: ownerRows.length,
      evidenceClasses: unique(ownerRows.map((row) => row.evidenceClass)).sort(),
      rows: ownerRows.sort(sortByAssetId),
    }))
    .sort(sortByOwnerScope);

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    collectionReport: rel(COLLECTION_JSON),
    totalAssets: rows.length,
    evidenceClasses: unique(rows.map((row) => row.evidenceClass)).sort(),
    ownerQueues,
    issues,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(HANDOFF_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(HANDOFF_MD, `${buildMarkdown(report)}\n`);

  console.log(`[phase-a5-chain-of-title-handoff] report_json=${rel(HANDOFF_JSON)}`);
  console.log(`[phase-a5-chain-of-title-handoff] report_md=${rel(HANDOFF_MD)}`);
  console.log(`[phase-a5-chain-of-title-handoff] total_assets=${report.totalAssets}`);
  console.log(`[phase-a5-chain-of-title-handoff] owner_queues=${report.ownerQueues.length}`);

  const errors = issues.filter((issue) => issue.severity === "error");
  if (mode === "enforce" && (report.ownerQueues.length === 0 || errors.length > 0)) {
    process.exit(1);
  }
}

main();
