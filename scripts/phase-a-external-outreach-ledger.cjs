#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const OWNER_QUEUES_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.json");
const OUTREACH_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-outreach.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-external-outreach-ledger.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-external-outreach-ledger.md");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_OUTREACH_LEDGER_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_OUTREACH_LEDGER_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const OUTREACH_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-OWNER-OUTREACH");
const LEDGER_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-OUTREACH-LEDGER");
const LEDGER_INDEX = path.join(LEDGER_DIR, "INDEX.md");

const ALLOWED_STATUSES = ["prepared", "sent", "acknowledged", "replied", "closed"];
const DEFAULT_NOTES = "- после первого реального контакта зафиксировать дату, канал и краткий итог\n";

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

function readTrackerField(content, key) {
  const match = content.match(new RegExp(`^- ${key}:\\s*(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function extractWorkingNotes(content) {
  const marker = "## Working notes\n";
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    return DEFAULT_NOTES;
  }
  const notes = content.slice(markerIndex + marker.length).trim();
  return notes ? `${notes}\n` : DEFAULT_NOTES;
}

function parseTracker(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      outreachStatus: "prepared",
      ownerContact: "pending",
      currentAssignee: "@techlead",
      lastContactAt: "not_sent",
      lastResponseAt: "not_received",
      notes: DEFAULT_NOTES,
      invalidStatus: false,
    };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const outreachStatus = readTrackerField(content, "outreach_status") || "prepared";

  return {
    outreachStatus,
    ownerContact: readTrackerField(content, "owner_contact") || "pending",
    currentAssignee: readTrackerField(content, "current_assignee") || "@techlead",
    lastContactAt: readTrackerField(content, "last_contact_at") || "not_sent",
    lastResponseAt: readTrackerField(content, "last_response_at") || "not_received",
    notes: extractWorkingNotes(content),
    invalidStatus: !ALLOWED_STATUSES.includes(outreachStatus),
  };
}

function buildTracker(queue, report, trackerState, messagePacketPath) {
  const lines = [
    `# Phase A External Outreach Tracker: ${queue.ownerQueue}`,
    "",
    `- generated_at: ${report.generatedAt}`,
    `- owner_queue: ${queue.ownerQueue}`,
    `- queue_kind: ${queue.queueKind}`,
    `- outreach_status: ${trackerState.outreachStatus}`,
    `- owner_contact: ${trackerState.ownerContact}`,
    `- current_assignee: ${trackerState.currentAssignee}`,
    `- last_contact_at: ${trackerState.lastContactAt}`,
    `- last_response_at: ${trackerState.lastResponseAt}`,
    `- items: ${queue.itemCount}`,
    `- tracks: ${(queue.trackSet || []).join(", ") || "none"}`,
    `- message_packet: ${messagePacketPath}`,
    "",
    "## Status meanings",
    "",
    "- `prepared` — пакет собран, но ещё не отправлен",
    "- `sent` — сообщение отправлено, ждём подтверждение получения",
    "- `acknowledged` — владелец подтвердил, что запрос получен",
    "- `replied` — пришёл ответ или файл, но intake/review ещё не завершён",
    "- `closed` — эта очередь больше не держит внешний blocker",
    "",
    "## Items in scope",
    "",
    ...queue.items.map(
      (item, index) =>
        `${index + 1}. ${item.referenceId} (${item.track}) — ${item.title}; текущий evidence-status: ${item.status}; next action: ${item.nextAction}`,
    ),
    "",
    "## Update rule",
    "",
    "- менять `outreach_status` вручную только после фактического действия или ответа;",
    "- после статуса `replied` следующий шаг должен быть уже в evidence lifecycle соответствующего трека;",
    "- статус `closed` ставить только когда очередь больше не держит внешний blocker по факту, а не по намерению.",
    "",
    "## Working notes",
    "",
    trackerState.notes.trimEnd(),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildIndex(queues, report) {
  const lines = [
    "# Phase A External Outreach Ledger Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- phase_a_state: ${report.phaseAState}`,
    `- outreach_state: ${report.outreachState}`,
    `- total_owner_queues: ${report.totalOwnerQueues}`,
    "",
    "| Owner queue | Queue kind | Outreach status | Items | Tracks | Tracker file |",
    "|---|---|---|---:|---|---|",
    ...queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.queueKind}\` | \`${queue.outreachStatus}\` | ${queue.itemCount} | ${(queue.trackSet || []).join(", ")} | ${queue.trackerPath} |`,
    ),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function resolveOutreachState(queues) {
  if (queues.length === 0) return "no_queues";
  const statuses = queues.map((queue) => queue.outreachStatus);
  if (statuses.every((status) => status === "closed")) {
    return "outreach_closed";
  }
  if (statuses.some((status) => status !== "prepared")) {
    return "outreach_in_progress";
  }
  return "outreach_prepared";
}

function buildStatusCounts(queues) {
  return ALLOWED_STATUSES.reduce((acc, status) => {
    acc[status] = queues.filter((queue) => queue.outreachStatus === status).length;
    return acc;
  }, {});
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const dryRun = process.argv.includes("--dry-run");
  const issues = [];

  for (const filePath of [OWNER_QUEUES_JSON, OUTREACH_JSON]) {
    if (!fs.existsSync(filePath)) {
      issues.push(`missing required file ${filePath}`);
    }
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
      ["# Phase A External Outreach Ledger", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
      dryRun,
    );
    if (mode === "enforce") process.exit(1);
    return;
  }

  const ownerQueuesReport = readJson(OWNER_QUEUES_JSON);
  const outreachReport = readJson(OUTREACH_JSON);
  const queues = ownerQueuesReport.ownerQueues || [];

  ensureDir(LEDGER_DIR, dryRun);

  const queueReports = [];
  for (const queue of queues) {
    const slug = sanitizeSlug(queue.ownerQueue);
    const trackerDir = path.join(LEDGER_DIR, slug);
    const trackerPath = path.join(trackerDir, "TRACKER.md");
    const messagePacketPath = path.join(OUTREACH_DIR, slug, "MESSAGE.md");
    const trackerState = parseTracker(trackerPath);

    if (trackerState.invalidStatus) {
      issues.push(`invalid outreach_status for ${queue.ownerQueue}: ${trackerState.outreachStatus}`);
      trackerState.outreachStatus = "prepared";
    }

    ensureDir(trackerDir, dryRun);
    writeText(trackerPath, buildTracker(queue, outreachReport, trackerState, messagePacketPath), dryRun);

    queueReports.push({
      ownerQueue: queue.ownerQueue,
      queueKind: queue.queueKind,
      itemCount: queue.itemCount,
      trackSet: queue.trackSet,
      outreachStatus: trackerState.outreachStatus,
      ownerContact: trackerState.ownerContact,
      currentAssignee: trackerState.currentAssignee,
      lastContactAt: trackerState.lastContactAt,
      lastResponseAt: trackerState.lastResponseAt,
      trackerPath,
      messagePacketPath,
      items: queue.items || [],
    });
  }

  const statusCounts = buildStatusCounts(queueReports);
  const outreachState = resolveOutreachState(queueReports);

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourceOwnerQueues: rel(OWNER_QUEUES_JSON),
    sourceOutreach: rel(OUTREACH_JSON),
    phaseAState: ownerQueuesReport.overallState || "unknown",
    outreachState,
    totalOwnerQueues: queueReports.length,
    statusCounts,
    queues: queueReports.map((queue) => ({
      ownerQueue: queue.ownerQueue,
      queueKind: queue.queueKind,
      itemCount: queue.itemCount,
      trackSet: queue.trackSet,
      outreachStatus: queue.outreachStatus,
      ownerContact: queue.ownerContact,
      currentAssignee: queue.currentAssignee,
      lastContactAt: queue.lastContactAt,
      lastResponseAt: queue.lastResponseAt,
      trackerPath: queue.trackerPath,
      messagePacketPath: queue.messagePacketPath,
    })),
    issues,
  };

  const md = [
    "# Phase A External Outreach Ledger",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_owner_queues: \`${report.sourceOwnerQueues}\``,
    `- source_outreach: \`${report.sourceOutreach}\``,
    `- phase_a_state: \`${report.phaseAState}\``,
    `- outreach_state: \`${report.outreachState}\``,
    `- total_owner_queues: \`${report.totalOwnerQueues}\``,
    "",
    "## Status Counts",
    "",
    ...ALLOWED_STATUSES.map((status) => `- ${status}: \`${report.statusCounts[status] || 0}\``),
    "",
    "## Queue Ledger",
    "",
    "| Owner queue | Queue kind | Outreach status | Items | Tracks | Last contact | Last response | Tracker |",
    "|---|---|---|---:|---|---|---|---|",
    ...report.queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.queueKind}\` | \`${queue.outreachStatus}\` | ${queue.itemCount} | ${(queue.trackSet || []).join(", ")} | ${queue.lastContactAt} | ${queue.lastResponseAt} | ${queue.trackerPath} |`,
    ),
    "",
    "## Decision",
    "",
    "- этот ledger не заменяет evidence lifecycle и не меняет blocker сам по себе;",
    "- его задача — превратить ready-to-send outreach в наблюдаемую внешнюю очередь с явным operational status;",
    "- реальный прогресс фазы теперь можно видеть не только по `requested`, но и по фактическому движению `prepared -> sent -> acknowledged -> replied -> closed`.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, `${md}\n`, dryRun);
  writeText(LEDGER_INDEX, buildIndex(queueReports, report), dryRun);

  console.log("[phase-a-external-outreach-ledger] summary");
  console.log(`- phase_a_state=${report.phaseAState}`);
  console.log(`- outreach_state=${report.outreachState}`);
  console.log(`- total_owner_queues=${report.totalOwnerQueues}`);
  console.log(`- prepared=${report.statusCounts.prepared || 0}`);
  console.log(`- sent=${report.statusCounts.sent || 0}`);
  console.log(`- replied=${report.statusCounts.replied || 0}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- ledger_index=${LEDGER_INDEX}`);

  if (mode === "enforce" && (report.totalOwnerQueues === 0 || report.issues.length > 0)) {
    process.exit(1);
  }
}

main();
