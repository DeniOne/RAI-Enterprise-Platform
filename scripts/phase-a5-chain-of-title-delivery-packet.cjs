#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const REQUEST_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-request-packet.json");
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const DELIVERY_DIR = path.join(RESTRICTED_ROOT, "request-packets", "ELP-20260328-09");
const DELIVERY_FILE = path.join(DELIVERY_DIR, "REQUEST_PACKET.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function renderPacket(report) {
  const lines = [
    "# ELP-20260328-09 Chain Of Title Request Packet",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- total_assets: ${report.totalAssets}`,
    `- owner_queues: ${report.ownerQueues.length}`,
    `- source_request_packet: ${report.sourceRequestPacket}`,
    "",
    "## Что собрать",
    "",
    "- board ownership / repository stewardship statement",
    "- employment and contractor IP assignment evidence",
    "- database rights and schema authorship evidence",
    "- linkage для generated artifacts",
    "",
    "## Owner packet index",
    "",
    `- ${report.ownerIndex}`,
    "",
    "## Owner queues",
    "",
  ];

  for (const ownerQueue of report.ownerQueues) {
    lines.push(`### ${ownerQueue.ownerScope}`, "");
    lines.push(
      `- asset_count: ${ownerQueue.assetCount}`,
      `- packet_file: ${ownerQueue.packetFile}`,
      "",
      "| Asset ID | Asset | Evidence class | External document needed |",
      "|---|---|---|---|",
    );
    for (const row of ownerQueue.rows) {
      lines.push(
        `| ${row.assetId} | ${row.assetLabel} | ${row.evidenceClass} | ${row.externalDocumentNeeded} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Intake commands",
    "",
    "```bash",
    "pnpm legal:evidence:intake -- --reference=ELP-20260328-09 --source=/abs/path/file",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=reviewed",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=accepted",
    "pnpm legal:evidence:verdict",
    "```",
    "",
    "## Напоминание",
    "",
    "- Этот packet не заменяет signed external evidence.",
    "- Он является последним repo-side handoff слоем перед фактическим intake.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!fs.existsSync(REQUEST_JSON)) {
    console.error(
      `[phase-a5-chain-of-title-delivery-packet] missing_request_packet=${REQUEST_JSON}; сначала запусти phase:a5:chain-of-title:request-packet`,
    );
    process.exit(1);
  }

  const report = readJson(REQUEST_JSON);
  ensureDir(DELIVERY_DIR, dryRun);
  writeText(
    DELIVERY_FILE,
    renderPacket({
      generatedAt: new Date().toISOString(),
      totalAssets: report.totalAssets,
      ownerQueues: report.ownerQueues || [],
      sourceRequestPacket: REQUEST_JSON.replace(/\\/g, "/"),
      ownerIndex: report.ownerIndex,
    }),
    dryRun,
  );

  console.log(`[phase-a5-chain-of-title-delivery-packet] delivery_file=${DELIVERY_FILE.replace(/\\/g, "/")}`);
}

main();
