#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const BLOCKERS_JSON = path.join(OUTPUT_DIR, "phase-a-external-blockers-packet.json");
const A5_STATUS_JSON = path.join(ROOT, "var", "compliance", "phase-a5-status.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.md");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_OWNER_QUEUES_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_OWNER_QUEUES_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const OWNER_PACKETS_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-OWNER-QUEUES");
const OWNER_INDEX = path.join(OWNER_PACKETS_DIR, "INDEX.md");

const TITLE_BY_REFERENCE = {
  "A2-S-01": "Historical CA key revocation",
  "A2-S-02": "Telegram token rotation",
  "A2-S-03": "GitHub access review",
  "A4-H-01": "Tier 1 pilot handoff report",
  "ELP-20260328-09": "First-party chain-of-title pack",
};

const TRACK_ORDER = {
  A1: 1,
  A2: 2,
  A4: 3,
  A5: 4,
};

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

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues.map((issue) => `- ${issue}`).join("\n");
}

function sanitizeOwnerQueue(value) {
  return String(value || "queue")
    .replace(/^@/, "at_")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "queue";
}

function queueKind(ownerQueue) {
  const value = String(ownerQueue || "");
  if (value.startsWith("@")) return "named_owner";
  if (value.includes(" / ")) return "shared_scope";
  return "owner_scope";
}

function pushQueueItem(ownerMap, ownerQueue, item) {
  if (!ownerMap.has(ownerQueue)) {
    ownerMap.set(ownerQueue, {
      ownerQueue,
      queueKind: queueKind(ownerQueue),
      items: [],
    });
  }
  ownerMap.get(ownerQueue).items.push(item);
}

function normalizeStatusCounts(items) {
  return {
    requested: items.filter((item) => item.status === "requested").length,
    received: items.filter((item) => item.status === "received").length,
    reviewed: items.filter((item) => item.status === "reviewed").length,
    accepted: items.filter((item) => item.status === "accepted").length,
  };
}

function sortItems(left, right) {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }
  return left.referenceId.localeCompare(right.referenceId);
}

function buildOwnerPacket(queue, report) {
  const lines = [
    `# Phase A External Owner Queue ${queue.ownerQueue}`,
    "",
    `- generated_at: ${report.generatedAt}`,
    `- owner_queue: ${queue.ownerQueue}`,
    `- queue_kind: ${queue.queueKind}`,
    `- tracks: ${queue.trackSet.join(", ")}`,
    `- item_count: ${queue.itemCount}`,
    `- requested: ${queue.counts.requested}`,
    `- received: ${queue.counts.received}`,
    `- reviewed: ${queue.counts.reviewed}`,
    `- accepted: ${queue.counts.accepted}`,
    "",
    "## Execution order",
    "",
    "1. `A1` — legal priority-eight first.",
    "2. `A2` — residual security evidence second.",
    "3. `A4` — pilot handoff after security/legal intake has started.",
    "4. `A5` — chain-of-title owner scope in parallel with legal closeout, but not instead of it.",
    "",
    "## Queue items",
    "",
    "| Track | Reference | Title | Status | Review due | Draft / packet path | Next action |",
    "|---|---|---|---|---|---|---|",
    ...queue.items.map(
      (item) =>
        `| \`${item.track}\` | \`${item.referenceId}\` | ${item.title} | \`${item.status}\` | \`${item.reviewDue}\` | \`${item.artifactPath}\` | ${item.nextAction} |`,
    ),
    "",
    "## Item details",
    "",
    ...queue.items.flatMap((item) => [
      `### ${item.track} / ${item.referenceId}`,
      "",
      `- title: ${item.title}`,
      `- status: \`${item.status}\``,
      `- review_due: \`${item.reviewDue}\``,
      `- artifact_path: \`${item.artifactPath}\``,
      `- detail: ${item.detail}`,
      "",
    ]),
  ];

  return `${lines.join("\n")}\n`;
}

function buildOwnerIndex(ownerQueues, report) {
  const lines = [
    "# Phase A External Owner Queues Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- overall_state: ${report.overallState}`,
    `- blocked_by: ${report.blockedBy.join(", ") || "none"}`,
    `- total_owner_queues: ${ownerQueues.length}`,
    "",
    "| Owner queue | Queue kind | Tracks | Items | Packet file |",
    "|---|---|---|---:|---|",
    ...ownerQueues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.queueKind}\` | ${queue.trackSet.join(", ")} | ${queue.itemCount} | ${queue.packetPath} |`,
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

  for (const filePath of [BLOCKERS_JSON, A5_STATUS_JSON]) {
    if (!fs.existsSync(filePath)) {
      issues.push(`missing required file ${filePath}`);
    }
  }

  if (issues.length > 0) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    ensureDir(OUTPUT_DIR, dryRun);
    writeJson(REPORT_JSON, report, dryRun);
    writeText(
      REPORT_MD,
      ["# Phase A External Owner Queues", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
      dryRun,
    );
    if (mode === "enforce") process.exit(1);
    return;
  }

  const blockers = readJson(BLOCKERS_JSON);
  const a5Status = readJson(A5_STATUS_JSON);
  const ownerMap = new Map();

  for (const queue of blockers.details?.a1OwnerQueues || []) {
    for (const item of queue.items || []) {
      pushQueueItem(ownerMap, queue.owner, {
        track: "A1",
        sortOrder: (TRACK_ORDER.A1 * 100) + (item.priority || 99),
        referenceId: item.referenceId,
        title: item.title,
        status: item.status,
        reviewDue: item.reviewDue || "unknown",
        artifactPath: item.draftPath || "pending",
        nextAction: `собрать внешний файл и выполнить intake по ${item.referenceId}`,
        detail: `wave=${item.wave}; required_fields=${item.requiredFields}`,
      });
    }
  }

  for (const row of blockers.details?.a2Rows || []) {
    pushQueueItem(ownerMap, row.owner, {
      track: "A2",
      sortOrder: (TRACK_ORDER.A2 * 100),
      referenceId: row.referenceId,
      title: TITLE_BY_REFERENCE[row.referenceId] || row.referenceId,
      status: row.status,
      reviewDue: row.reviewDue || "unknown",
      artifactPath: row.draftPath || row.artifactPath || "pending",
      nextAction: `собрать restricted artifact и перевести ${row.referenceId} в received`,
      detail: "security residual evidence",
    });
  }

  for (const row of blockers.details?.a4Rows || []) {
    pushQueueItem(ownerMap, row.owner, {
      track: "A4",
      sortOrder: (TRACK_ORDER.A4 * 100),
      referenceId: row.referenceId,
      title: TITLE_BY_REFERENCE[row.referenceId] || row.referenceId,
      status: row.status,
      reviewDue: row.reviewDue || "unknown",
      artifactPath: row.draftPath || row.artifactPath || "pending",
      nextAction: `собрать pilot handoff evidence и перевести ${row.referenceId} в received`,
      detail: "pilot handoff evidence",
    });
  }

  for (const queue of blockers.details?.a5OwnerQueues || []) {
    pushQueueItem(ownerMap, queue.ownerScope, {
      track: "A5",
      sortOrder: (TRACK_ORDER.A5 * 100),
      referenceId: "ELP-20260328-09",
      title: TITLE_BY_REFERENCE["ELP-20260328-09"],
      status: a5Status.summary?.externalStatus || "unknown",
      reviewDue: a5Status.summary?.reviewDue || "unknown",
      artifactPath: a5Status.inputs?.restrictedDeliveryPacket || "pending",
      nextAction: "собрать signed chain-of-title evidence по owner scope",
      detail: `assets=${queue.assetCount}; evidence_classes=${(queue.evidenceClasses || []).join(",")}`,
    });
  }

  const ownerQueues = Array.from(ownerMap.values())
    .map((queue) => {
      const items = [...queue.items].sort(sortItems);
      const counts = normalizeStatusCounts(items);
      const trackSet = [...new Set(items.map((item) => item.track))];
      return {
        ownerQueue: queue.ownerQueue,
        queueKind: queue.queueKind,
        itemCount: items.length,
        trackSet,
        counts,
        items,
      };
    })
    .sort((left, right) => left.ownerQueue.localeCompare(right.ownerQueue));

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourceExternalBlockers: rel(BLOCKERS_JSON),
    sourceA5Status: rel(A5_STATUS_JSON),
    overallState: blockers.overallState || "unknown",
    blockedBy: blockers.blockedBy || [],
    totalOwnerQueues: ownerQueues.length,
    ownerQueues,
    issues,
  };

  const md = [
    "# Phase A External Owner Queues",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_external_blockers: \`${report.sourceExternalBlockers}\``,
    `- source_a5_status: \`${report.sourceA5Status}\``,
    `- overall_state: \`${report.overallState}\``,
    `- blocked_by: \`${report.blockedBy.join(", ") || "none"}\``,
    `- total_owner_queues: \`${report.totalOwnerQueues}\``,
    "",
    "## Owner Queue Summary",
    "",
    "| Owner queue | Queue kind | Tracks | Items | Requested | Received | Reviewed | Accepted |",
    "|---|---|---|---:|---:|---:|---:|---:|",
    ...ownerQueues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.queueKind}\` | ${queue.trackSet.join(", ")} | ${queue.itemCount} | ${queue.counts.requested} | ${queue.counts.received} | ${queue.counts.reviewed} | ${queue.counts.accepted} |`,
    ),
    "",
    "## Queue Details",
    "",
    ...ownerQueues.flatMap((queue) => [
      `### ${queue.ownerQueue}`,
      "",
      `- queue_kind: \`${queue.queueKind}\``,
      `- tracks: ${queue.trackSet.join(", ")}`,
      `- item_count: ${queue.itemCount}`,
      "",
      "| Track | Reference | Title | Status | Review due | Draft / packet path | Next action |",
      "|---|---|---|---|---|---|---|",
      ...queue.items.map(
        (item) =>
          `| \`${item.track}\` | \`${item.referenceId}\` | ${item.title} | \`${item.status}\` | \`${item.reviewDue}\` | \`${item.artifactPath}\` | ${item.nextAction} |`,
      ),
      "",
    ]),
    "## Execution Rule",
    "",
    "- owner queue по всей фазе не отменяет приоритет `A1 -> A2 -> A4 -> A5`",
    "- multi-owner scopes допускаются как отдельные operational очереди и не нормализуются насильно до одного handle",
    "- progress считается только после движения статусов внешних evidence, а не после выпуска ещё одного markdown-файла",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  ensureDir(OUTPUT_DIR, dryRun);
  ensureDir(OWNER_PACKETS_DIR, dryRun);

  const ownerIndexRows = [];
  for (const queue of ownerQueues) {
    const queueSlug = sanitizeOwnerQueue(queue.ownerQueue);
    const queueDir = path.join(OWNER_PACKETS_DIR, queueSlug);
    const packetPath = path.join(queueDir, "HANDOFF.md");
    ensureDir(queueDir, dryRun);
    writeText(packetPath, buildOwnerPacket(queue, report), dryRun);
    ownerIndexRows.push({
      ...queue,
      packetPath,
    });
  }

  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, `${md}\n`, dryRun);
  writeText(OWNER_INDEX, buildOwnerIndex(ownerIndexRows, report), dryRun);

  console.log("[phase-a-external-owner-queues] summary");
  console.log(`- overall_state=${report.overallState}`);
  console.log(`- blocked_by=${report.blockedBy.join(",") || "none"}`);
  console.log(`- owner_queues=${report.totalOwnerQueues}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- owner_index=${OWNER_INDEX}`);

  if (mode === "enforce" && (report.totalOwnerQueues === 0 || report.issues.length > 0)) {
    process.exit(1);
  }
}

main();
