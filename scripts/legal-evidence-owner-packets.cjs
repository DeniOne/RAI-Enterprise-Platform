#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const HANDOFF_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-handoff.json");
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const OWNER_PACKETS_DIR = path.join(RESTRICTED_ROOT, "owner-packets");
const OWNER_INDEX = path.join(OWNER_PACKETS_DIR, "INDEX.md");

function sanitizeOwner(owner) {
  return owner.replace(/`/g, "").replace(/[^A-Za-z0-9@_-]+/g, "_");
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
    `# Legal Evidence Owner Packet ${ownerQueue.owner}`,
    "",
    `- generated_at: ${report.generatedAt}`,
    `- current_verdict: ${report.currentVerdict}`,
    `- next_target_verdict: ${report.nextTargetVerdict}`,
    `- owner: ${ownerQueue.owner}`,
    `- task_count: ${ownerQueue.taskCount}`,
    `- review_due_min: ${ownerQueue.reviewDueMin || "-"}`,
    "",
    "## Что делать",
    "",
    "1. Открыть attached draft по каждой карточке.",
    "2. Заполнить внешние реквизиты, подписи, contract references или regulator evidence.",
    "3. Выполнить intake командой из таблицы ниже.",
    "4. После owner review перевести карточку в `reviewed`, затем в `accepted`.",
    "",
    "## Очередь",
    "",
    "| Reference ID | Artifact | Review due | Draft path | Next action | Intake command | Review command | Accept command |",
    "|---|---|---|---|---|---|---|---|",
  ];

  for (const task of ownerQueue.tasks) {
    lines.push(
      `| ${task.referenceId} | ${task.artifact} | ${task.reviewDue || "-"} | ${task.draftPath || "-"} | ${task.nextAction} | ${task.intakeCommand} | ${task.reviewCommand} | ${task.acceptCommand} |`,
    );
  }

  lines.push(
    "",
    "## Напоминание",
    "",
    "- Repo-derived draft не является внешним evidence сам по себе.",
    "- `received` допустим только после появления реального внешнего файла-источника.",
    "- После intake нужно заново прогнать `pnpm legal:evidence:handoff`, чтобы очередь обновилась.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function buildIndex(entries, report) {
  const lines = [
    "# Legal Evidence Owner Packet Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- current_verdict: ${report.currentVerdict}`,
    `- next_target_verdict: ${report.nextTargetVerdict}`,
    `- blocker_count: ${report.blockerCount}`,
    "",
    "| Owner | Task count | Review due min | Packet file |",
    "|---|---:|---|---|",
  ];

  for (const entry of entries) {
    lines.push(
      `| ${entry.owner} | ${entry.taskCount} | ${entry.reviewDueMin || "-"} | ${entry.packetPath} |`,
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!fs.existsSync(HANDOFF_JSON)) {
    console.error(
      `[legal-evidence-owner-packets] отсутствует handoff report: ${HANDOFF_JSON}; сначала запусти legal-evidence-handoff`,
    );
    process.exit(1);
  }

  const report = readJson(HANDOFF_JSON);
  const ownerQueues = report.ownerQueues || [];
  ensureDir(OWNER_PACKETS_DIR, dryRun);

  const entries = [];
  for (const ownerQueue of ownerQueues) {
    const ownerSlug = sanitizeOwner(ownerQueue.owner);
    const ownerDir = path.join(OWNER_PACKETS_DIR, ownerSlug);
    const packetPath = path.join(ownerDir, "HANDOFF.md");
    ensureDir(ownerDir, dryRun);
    writeText(packetPath, buildOwnerPacket(ownerQueue, report), dryRun);
    entries.push({
      owner: ownerQueue.owner,
      taskCount: ownerQueue.taskCount,
      reviewDueMin: ownerQueue.reviewDueMin,
      packetPath: packetPath.replace(/\\/g, "/"),
    });
    console.log(`[legal-evidence-owner-packets] packet=${packetPath.replace(/\\/g, "/")}`);
  }

  writeText(OWNER_INDEX, buildIndex(entries, report), dryRun);
  console.log(`[legal-evidence-owner-packets] index=${OWNER_INDEX.replace(/\\/g, "/")}`);
}

main();
