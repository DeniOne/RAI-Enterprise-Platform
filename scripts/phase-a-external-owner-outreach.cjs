#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const OWNER_QUEUES_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-outreach.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-external-owner-outreach.md");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_OWNER_OUTREACH_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_OWNER_OUTREACH_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const OUTREACH_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-OWNER-OUTREACH");
const OUTREACH_INDEX = path.join(OUTREACH_DIR, "INDEX.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function sanitizeSlug(value) {
  return String(value || "queue")
    .replace(/^@/, "at_")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "queue";
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues.map((issue) => `- ${issue}`).join("\n");
}

function outreachSubject(queue) {
  return `Phase A external evidence request: ${queue.ownerQueue}`;
}

function buildMessage(queue, report) {
  const lines = [
    `# Outreach Packet: ${queue.ownerQueue}`,
    "",
    `- generated_at: ${report.generatedAt}`,
    `- owner_queue: ${queue.ownerQueue}`,
    `- queue_kind: ${queue.queueKind}`,
    `- items: ${queue.itemCount}`,
    "",
    "## Ready-to-send message",
    "",
    `Тема: ${outreachSubject(queue)}`,
    "",
    `Нужно закрыть внешний хвост \`Phase A\` по очереди \`${queue.ownerQueue}\`.`,
    "",
    "Что требуется прислать или подтвердить:",
    "",
    ...queue.items.map(
      (item, index) =>
        `${index + 1}. ${item.referenceId} (${item.track}) — ${item.title}. Срок review: ${item.reviewDue}. Основа: ${item.artifactPath}.`,
    ),
    "",
    "После получения файла следующий шаг:",
    "",
    ...queue.items.map((item) => `- ${item.nextAction}`),
    "",
    "Важно:",
    "",
    "- draft/template из packet используется только как подсказка;",
    "- blocker снимается только после реального внешнего evidence и его перехода в `received -> reviewed -> accepted`;",
    "- порядок приоритета по фазе сохраняется: `A1 -> A2 -> A4 -> A5`.",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildIndex(queues, report) {
  const lines = [
    "# Phase A External Owner Outreach Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- overall_state: ${report.overallState}`,
    `- total_owner_queues: ${queues.length}`,
    "",
    "| Owner queue | Queue kind | Items | Subject | Packet file |",
    "|---|---|---:|---|---|",
    ...queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.queueKind}\` | ${queue.itemCount} | ${outreachSubject(queue)} | ${queue.packetPath} |`,
    ),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const dryRun = process.argv.includes("--dry-run");
  const issues = [];

  if (!fs.existsSync(OWNER_QUEUES_JSON)) {
    issues.push(`missing required file ${OWNER_QUEUES_JSON}`);
  }

  ensureDir(OUTPUT_DIR, dryRun);

  if (issues.length > 0) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    writeJson(REPORT_JSON, report, dryRun);
    writeText(
      REPORT_MD,
      ["# Phase A External Owner Outreach", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
      dryRun,
    );
    if (mode === "enforce") process.exit(1);
    return;
  }

  const ownerQueuesReport = readJson(OWNER_QUEUES_JSON);
  const queues = ownerQueuesReport.ownerQueues || [];

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourceOwnerQueues: rel(OWNER_QUEUES_JSON),
    overallState: ownerQueuesReport.overallState || "unknown",
    blockedBy: ownerQueuesReport.blockedBy || [],
    totalOwnerQueues: queues.length,
    queues: queues.map((queue) => ({
      ownerQueue: queue.ownerQueue,
      queueKind: queue.queueKind,
      itemCount: queue.itemCount,
      trackSet: queue.trackSet,
      subject: outreachSubject(queue),
    })),
    issues,
  };

  const md = [
    "# Phase A External Owner Outreach",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_owner_queues: \`${report.sourceOwnerQueues}\``,
    `- overall_state: \`${report.overallState}\``,
    `- blocked_by: \`${report.blockedBy.join(", ") || "none"}\``,
    `- total_owner_queues: \`${report.totalOwnerQueues}\``,
    "",
    "## Outreach Summary",
    "",
    "| Owner queue | Queue kind | Items | Subject |",
    "|---|---|---:|---|",
    ...report.queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.queueKind}\` | ${queue.itemCount} | ${queue.subject} |`,
    ),
    "",
    "## Decision",
    "",
    "- owner queues уже можно не только читать, но и отправлять как ready-to-send outreach packet;",
    "- этот слой не меняет evidence-status сам по себе и не подменяет intake;",
    "- его задача — сократить расстояние между repo-side preparation и реальным внешним запросом.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  ensureDir(OUTREACH_DIR, dryRun);

  const indexQueues = [];
  for (const queue of queues) {
    const slug = sanitizeSlug(queue.ownerQueue);
    const queueDir = path.join(OUTREACH_DIR, slug);
    const packetPath = path.join(queueDir, "MESSAGE.md");
    ensureDir(queueDir, dryRun);
    writeText(packetPath, buildMessage(queue, report), dryRun);
    indexQueues.push({
      ...queue,
      packetPath,
    });
  }

  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, `${md}\n`, dryRun);
  writeText(OUTREACH_INDEX, buildIndex(indexQueues, report), dryRun);

  console.log("[phase-a-external-owner-outreach] summary");
  console.log(`- overall_state=${report.overallState}`);
  console.log(`- blocked_by=${report.blockedBy.join(",") || "none"}`);
  console.log(`- total_owner_queues=${report.totalOwnerQueues}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- outreach_index=${OUTREACH_INDEX}`);

  if (mode === "enforce" && (report.totalOwnerQueues === 0 || report.issues.length > 0)) {
    process.exit(1);
  }
}

main();
