#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const HANDOFF_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-handoff.json");
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const OWNER_PACKETS_DIR = path.join(RESTRICTED_ROOT, "chain-of-title-owner-packets");
const OWNER_INDEX = path.join(OWNER_PACKETS_DIR, "INDEX.md");

function sanitizeOwner(owner) {
  return owner.replace(/[^A-Za-z0-9_-]+/g, "_");
}

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

function buildOwnerPacket(ownerQueue, report) {
  const lines = [
    `# Phase A5 Chain Of Title Owner Packet ${ownerQueue.ownerScope}`,
    "",
    `- generated_at: ${report.generatedAt}`,
    `- owner_scope: ${ownerQueue.ownerScope}`,
    `- asset_count: ${ownerQueue.assetCount}`,
    `- evidence_classes: ${ownerQueue.evidenceClasses.join(", ")}`,
    "",
    "## Что делать",
    "",
    "1. Открыть `var/compliance/phase-a5-chain-of-title-handoff.md` как master handoff.",
    "2. Для каждой строки ниже собрать только указанный внешний документ.",
    "3. Свести owner-пакет в один внешний файл для `ELP-20260328-09` или в комплект подтверждающих приложений.",
    "4. Перед intake перепроверить, что все строки owner queue покрыты.",
    "",
    "## Очередь",
    "",
    "| Asset ID | Asset | Path | Evidence class | External document needed |",
    "|---|---|---|---|---|",
  ];

  for (const row of ownerQueue.rows) {
    lines.push(
      `| ${row.assetId} | ${row.assetLabel} | ${row.path} | ${row.evidenceClass} | ${row.externalDocumentNeeded} |`,
    );
  }

  lines.push(
    "",
    "## Intake reminder",
    "",
    "- Этот owner packet не является external evidence сам по себе.",
    "- Он нужен только как owner-ready handoff для `ELP-20260328-09`.",
    "- После сборки внешнего файла использовать:",
    "  - `pnpm legal:evidence:intake -- --reference=ELP-20260328-09 --source=/abs/path/file`",
    "  - `pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=reviewed`",
    "  - `pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=accepted`",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function buildIndex(entries, report) {
  const lines = [
    "# Phase A5 Chain Of Title Owner Packet Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- total_assets: ${report.totalAssets}`,
    `- owner_queues: ${report.ownerQueues.length}`,
    "",
    "| Owner scope | Asset count | Packet file |",
    "|---|---:|---|",
  ];

  for (const entry of entries) {
    lines.push(`| ${entry.ownerScope} | ${entry.assetCount} | ${entry.packetPath} |`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!fs.existsSync(HANDOFF_JSON)) {
    console.error(
      `[phase-a5-chain-of-title-owner-packets] missing_handoff_report=${HANDOFF_JSON}; сначала запусти phase:a5:chain-of-title:handoff`,
    );
    process.exit(1);
  }

  const report = readJson(HANDOFF_JSON);
  const ownerQueues = report.ownerQueues || [];
  ensureDir(OWNER_PACKETS_DIR, dryRun);

  const entries = [];
  for (const ownerQueue of ownerQueues) {
    const ownerSlug = sanitizeOwner(ownerQueue.ownerScope);
    const ownerDir = path.join(OWNER_PACKETS_DIR, ownerSlug);
    const packetPath = path.join(ownerDir, "HANDOFF.md");
    ensureDir(ownerDir, dryRun);
    writeText(packetPath, buildOwnerPacket(ownerQueue, report), dryRun);
    entries.push({
      ownerScope: ownerQueue.ownerScope,
      assetCount: ownerQueue.assetCount,
      packetPath: packetPath.replace(/\\/g, "/"),
    });
    console.log(`[phase-a5-chain-of-title-owner-packets] packet=${packetPath.replace(/\\/g, "/")}`);
  }

  writeText(OWNER_INDEX, buildIndex(entries, report), dryRun);
  console.log(`[phase-a5-chain-of-title-owner-packets] index=${OWNER_INDEX.replace(/\\/g, "/")}`);
}

main();
