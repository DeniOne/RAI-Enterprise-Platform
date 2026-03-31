#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const HANDOFF_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-handoff.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-request-packet.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-request-packet.md");
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const OWNER_PACKETS_DIR = path.join(RESTRICTED_ROOT, "chain-of-title-owner-packets");
const OWNER_INDEX = path.join(OWNER_PACKETS_DIR, "INDEX.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sanitizeOwner(owner) {
  return owner.replace(/[^A-Za-z0-9_-]+/g, "_");
}

function buildMarkdown(report) {
  const lines = [
    "# Phase A5 Chain Of Title Request Packet",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- handoff_report: \`${report.handoffReport}\``,
    `- owner_index: \`${report.ownerIndex}\``,
    `- total_assets: \`${report.totalAssets}\``,
    `- owner_queues: \`${report.ownerQueues.length}\``,
    "",
    "## Что собирать",
    "",
    "- board ownership / repository stewardship statement",
    "- employment and contractor IP assignment evidence",
    "- database rights and schema authorship evidence",
    "- linkage для generated artifacts",
    "",
    "## Owner request queues",
    "",
  ];

  for (const ownerQueue of report.ownerQueues) {
    lines.push(`### ${ownerQueue.ownerScope}`, "");
    lines.push(
      `- asset_count: \`${ownerQueue.assetCount}\``,
      `- packet_file: \`${ownerQueue.packetFile}\``,
      "",
      "| Asset ID | Asset | Evidence class | External document needed |",
      "|---|---|---|---|",
    );
    for (const row of ownerQueue.rows) {
      lines.push(
        `| \`${row.assetId}\` | ${row.assetLabel} | \`${row.evidenceClass}\` | ${row.externalDocumentNeeded} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Intake commands",
    "",
    "После сборки внешнего файла по `ELP-20260328-09`:",
    "",
    "```bash",
    "pnpm legal:evidence:intake -- --reference=ELP-20260328-09 --source=/abs/path/file",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=reviewed",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=accepted",
    "pnpm legal:evidence:verdict",
    "```",
    "",
    "## Decision use",
    "",
    "- использовать этот packet как единый owner-facing запрос на сбор `ELP-20260328-09`;",
    "- не считать его заменой external signed evidence;",
    "- считать его последним repo-side слоем перед реальным intake.",
    "",
  );

  return lines.join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  if (!fs.existsSync(HANDOFF_JSON)) {
    console.error(
      `[phase-a5-chain-of-title-request-packet] missing_handoff_report=${rel(HANDOFF_JSON)}; сначала запусти phase:a5:chain-of-title:handoff`,
    );
    process.exit(1);
  }
  if (!fs.existsSync(OWNER_INDEX)) {
    console.error(
      `[phase-a5-chain-of-title-request-packet] missing_owner_index=${OWNER_INDEX}; сначала запусти phase:a5:chain-of-title:owner-packets`,
    );
    process.exit(1);
  }

  const handoff = readJson(HANDOFF_JSON);
  const ownerQueues = (handoff.ownerQueues || []).map((ownerQueue) => ({
    ownerScope: ownerQueue.ownerScope,
    assetCount: ownerQueue.assetCount,
    packetFile: path.join(OWNER_PACKETS_DIR, sanitizeOwner(ownerQueue.ownerScope), "HANDOFF.md").replace(/\\/g, "/"),
    rows: ownerQueue.rows,
  }));

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    handoffReport: rel(HANDOFF_JSON),
    ownerIndex: OWNER_INDEX.replace(/\\/g, "/"),
    totalAssets: handoff.totalAssets || 0,
    ownerQueues,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD, `${buildMarkdown(report)}\n`);

  console.log(`[phase-a5-chain-of-title-request-packet] report_json=${rel(REPORT_JSON)}`);
  console.log(`[phase-a5-chain-of-title-request-packet] report_md=${rel(REPORT_MD)}`);
  console.log(`[phase-a5-chain-of-title-request-packet] total_assets=${report.totalAssets}`);
  console.log(`[phase-a5-chain-of-title-request-packet] owner_queues=${report.ownerQueues.length}`);

  if (mode === "enforce" && report.ownerQueues.length === 0) {
    process.exit(1);
  }
}

main();
