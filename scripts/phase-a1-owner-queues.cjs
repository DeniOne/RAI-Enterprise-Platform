#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const PRIORITY_PACKET_JSON = path.join(OUTPUT_DIR, "phase-a1-priority-eight-request-packet.json");
const A1_STATUS_JSON = path.join(OUTPUT_DIR, "phase-a1-status.json");
const VERDICT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a1-owner-queues.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a1-owner-queues.md");

const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const OWNER_PACKETS_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A1-OWNER-QUEUES");
const OWNER_INDEX = path.join(OWNER_PACKETS_DIR, "INDEX.md");

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

function sanitizeOwner(owner) {
  return owner.replace(/^@/, "").replace(/[^A-Za-z0-9_-]+/g, "_");
}

function parseOwners(namedOwners) {
  return String(namedOwners || "")
    .split(",")
    .map((owner) => owner.trim())
    .filter(Boolean);
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues.map((issue) => `- ${issue}`).join("\n");
}

function buildOwnerPacket(ownerQueue, report) {
  const lines = [
    `# Phase A1 Owner Queue ${ownerQueue.owner}`,
    "",
    `- generated_at: ${report.generatedAt}`,
    `- owner: ${ownerQueue.owner}`,
    `- item_count: ${ownerQueue.itemCount}`,
    `- requested: ${ownerQueue.counts.requested}`,
    `- received: ${ownerQueue.counts.received}`,
    `- reviewed: ${ownerQueue.counts.reviewed}`,
    `- accepted: ${ownerQueue.counts.accepted}`,
    "",
    "## Что делать",
    "",
    "1. Открыть packet `PHASE-A1-PRIORITY-EIGHT/REQUEST_PACKET.md` как master legal path.",
    "2. По строкам ниже собрать только те внешние документы, где этот owner реально участвует.",
    "3. Двигать сначала `first_wave`, затем `second_wave`.",
    "4. После получения файла выполнять `intake -> reviewed -> accepted` по соответствующему `ELP-*`.",
    "",
    "## Очередь owner-а",
    "",
    "| Priority | Reference | Wave | Status | Review due | Draft path | Required fields |",
    "|---:|---|---|---|---|---|---|",
    ...ownerQueue.items.map(
      (item) =>
        `| ${item.priority} | ${item.referenceId} | ${item.wave} | ${item.status} | ${item.reviewDue} | ${item.draftPath} | ${item.requiredFields} |`,
    ),
    "",
    "## Intake reminder",
    "",
    "```bash",
    ...ownerQueue.items.flatMap((item) => [
      item.intakeCommand,
      item.reviewCommand,
      item.acceptCommand,
      "",
    ]),
    "pnpm legal:evidence:verdict",
    "pnpm phase:a1:status",
    "pnpm phase:a1:owner-queues",
    "```",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildOwnerIndex(ownerQueues, report) {
  const lines = [
    "# Phase A1 Owner Queue Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- current_legal_verdict: ${report.currentLegalVerdict}`,
    `- next_target_verdict: ${report.nextTargetVerdict}`,
    `- current_state: ${report.currentState}`,
    `- tier1_state: ${report.tier1State}`,
    `- total_items: ${report.totalItems}`,
    `- owner_queues: ${ownerQueues.length}`,
    "",
    "| Owner | Item count | Packet file |",
    "|---|---:|---|",
    ...ownerQueues.map(
      (queue) =>
        `| ${queue.owner} | ${queue.itemCount} | ${queue.packetPath} |`,
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

  for (const filePath of [PRIORITY_PACKET_JSON, A1_STATUS_JSON, VERDICT_JSON]) {
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
      ["# Phase A1 Owner Queues", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
      dryRun,
    );
    if (mode === "enforce") process.exit(1);
    return;
  }

  const priorityPacket = readJson(PRIORITY_PACKET_JSON);
  const a1Status = readJson(A1_STATUS_JSON);
  const verdict = readJson(VERDICT_JSON);

  const ownerMap = new Map();
  for (const item of priorityPacket.items || []) {
    const owners = parseOwners(item.namedOwners);
    if (owners.length === 0) {
      issues.push(`missing named owners for ${item.referenceId}`);
      continue;
    }

    for (const owner of owners) {
      const queue = ownerMap.get(owner) || {
        owner,
        items: [],
      };
      queue.items.push(item);
      ownerMap.set(owner, queue);
    }
  }

  const ownerQueues = Array.from(ownerMap.values())
    .map((queue) => {
      const items = [...queue.items].sort((left, right) => left.priority - right.priority);
      const counts = {
        requested: items.filter((item) => item.status === "requested").length,
        received: items.filter((item) => item.status === "received").length,
        reviewed: items.filter((item) => item.status === "reviewed").length,
        accepted: items.filter((item) => item.status === "accepted").length,
      };
      return {
        owner: queue.owner,
        itemCount: items.length,
        counts,
        items,
      };
    })
    .sort((left, right) => left.owner.localeCompare(right.owner));

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourcePriorityPacket: rel(PRIORITY_PACKET_JSON),
    sourceA1Status: rel(A1_STATUS_JSON),
    sourceVerdict: rel(VERDICT_JSON),
    currentLegalVerdict: verdict.currentVerdict,
    nextTargetVerdict: verdict.nextTargetVerdict,
    currentState: a1Status.currentState,
    tier1State: a1Status.tier1State,
    totalItems: priorityPacket.totalItems || 0,
    ownerQueuesCount: ownerQueues.length,
    ownerQueues,
    issues,
  };

  const md = [
    "# Phase A1 Owner Queues",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_priority_packet: \`${report.sourcePriorityPacket}\``,
    `- source_a1_status: \`${report.sourceA1Status}\``,
    `- source_verdict: \`${report.sourceVerdict}\``,
    `- current_legal_verdict: \`${report.currentLegalVerdict}\``,
    `- next_target_verdict: \`${report.nextTargetVerdict}\``,
    `- current_state: \`${report.currentState}\``,
    `- tier1_state: \`${report.tier1State}\``,
    `- total_items: \`${report.totalItems}\``,
    `- owner_queues: \`${report.ownerQueuesCount}\``,
    "",
    "## Owner Queues",
    "",
    "| Owner | Items | Requested | Received | Reviewed | Accepted |",
    "|---|---:|---:|---:|---:|---:|",
    ...ownerQueues.map(
      (queue) =>
        `| ${queue.owner} | ${queue.itemCount} | ${queue.counts.requested} | ${queue.counts.received} | ${queue.counts.reviewed} | ${queue.counts.accepted} |`,
    ),
    "",
    "## Execution Rule",
    "",
    "- owner queue не отменяет приоритетную последовательность `ELP-01 -> 03 -> 04 -> 06 -> 02 -> 05 -> 08 -> 09`",
    "- owner queue нужна, чтобы каждому owner было видно только его ответственность",
    "- first-wave items всё равно двигаются раньше second-wave",
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
    const ownerSlug = sanitizeOwner(queue.owner);
    const ownerDir = path.join(OWNER_PACKETS_DIR, ownerSlug);
    const packetPath = path.join(ownerDir, "HANDOFF.md");
    ensureDir(ownerDir, dryRun);
    writeText(packetPath, buildOwnerPacket(queue, report), dryRun);
    ownerIndexRows.push({
      owner: queue.owner,
      itemCount: queue.itemCount,
      packetPath: packetPath.replace(/\\/g, "/"),
    });
    console.log(`[phase-a1-owner-queues] packet=${packetPath.replace(/\\/g, "/")}`);
  }

  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, `${md}\n`, dryRun);
  writeText(OWNER_INDEX, buildOwnerIndex(ownerIndexRows, report), dryRun);

  console.log("[phase-a1-owner-queues] summary");
  console.log(`- total_items=${report.totalItems}`);
  console.log(`- owner_queues=${report.ownerQueuesCount}`);
  console.log(`- current_state=${report.currentState}`);
  console.log(`- tier1_state=${report.tier1State}`);
  console.log(`- issues=${report.issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- owner_index=${OWNER_INDEX.replace(/\\/g, "/")}`);

  if (mode === "enforce" && report.issues.length > 0) {
    process.exit(1);
  }
}

main();
