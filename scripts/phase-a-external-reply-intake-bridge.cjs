#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const OWNER_QUEUES_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.json");
const LEDGER_JSON = path.join(OUTPUT_DIR, "phase-a-external-outreach-ledger.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-external-reply-intake-bridge.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-external-reply-intake-bridge.md");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_REPLY_BRIDGE_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_REPLY_BRIDGE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const BRIDGE_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-REPLY-INTAKE-BRIDGE");
const BRIDGE_INDEX = path.join(BRIDGE_DIR, "INDEX.md");

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
  if (issues.length === 0) return "- issues: none";
  return issues.map((issue) => `- ${issue}`).join("\n");
}

function deriveCommands(referenceId) {
  if (/^ELP-\d{8}-\d{2}$/.test(referenceId)) {
    return {
      route: "legal",
      intakeCommand: `pnpm legal:evidence:intake -- --reference=${referenceId} --source=/abs/path/file`,
      reviewCommand: `pnpm legal:evidence:transition -- --reference=${referenceId} --status=reviewed`,
      acceptCommand: `pnpm legal:evidence:transition -- --reference=${referenceId} --status=accepted`,
    };
  }

  if (/^A2-S-\d{2}$/.test(referenceId)) {
    return {
      route: "security",
      intakeCommand: `pnpm security:evidence:intake -- --reference=${referenceId} --source=/abs/path/file`,
      reviewCommand: `pnpm security:evidence:transition -- --reference=${referenceId} --status=reviewed`,
      acceptCommand: `pnpm security:evidence:transition -- --reference=${referenceId} --status=accepted`,
    };
  }

  if (/^A4-H-\d{2}$/.test(referenceId)) {
    return {
      route: "pilot_handoff",
      intakeCommand: `pnpm phase:a4:handoff:intake -- --reference=${referenceId} --source=/abs/path/file`,
      reviewCommand: `pnpm phase:a4:handoff:transition -- --reference=${referenceId} --status=reviewed`,
      acceptCommand: `pnpm phase:a4:handoff:transition -- --reference=${referenceId} --status=accepted`,
    };
  }

  return {
    route: "unknown",
    intakeCommand: "manual-routing-required",
    reviewCommand: "manual-routing-required",
    acceptCommand: "manual-routing-required",
  };
}

function buildQueuePacket(queue, report) {
  const lines = [
    `# Reply Intake Bridge: ${queue.ownerQueue}`,
    "",
    `- generated_at: ${report.generatedAt}`,
    `- owner_queue: ${queue.ownerQueue}`,
    `- queue_kind: ${queue.queueKind}`,
    `- outreach_status: ${queue.outreachStatus}`,
    `- ready_for_intake: ${queue.readyForIntake ? "yes" : "no"}`,
    `- item_count: ${queue.itemCount}`,
    "",
    "## Rule",
    "",
    queue.readyForIntake
      ? "- Очередь уже в `replied`, поэтому следующий шаг — не новое сообщение, а соответствующий intake по каждому reference."
      : "- Пока очередь не в `replied`, этот packet служит как заранее подготовленный маршрут. Реальный intake запускать после фактического ответа владельца.",
    "",
    "## Intake Routes",
    "",
    "| Reference | Track | Route | Intake | Review | Accept |",
    "|---|---|---|---|---|---|",
    ...queue.items.map(
      (item) =>
        `| ${item.referenceId} | \`${item.track}\` | \`${item.route}\` | \`${item.intakeCommand}\` | \`${item.reviewCommand}\` | \`${item.acceptCommand}\` |`,
    ),
    "",
    "## Closure Rule",
    "",
    "- статус owner queue нельзя переводить в `closed`, пока соответствующие evidence не прошли как минимум в `received`, а удерживающий blocker не перестал быть активным;",
    "- для legal/security/pilot handoff закрытие очереди должно происходить уже после фактического intake и дальнейшего review/accept пути.",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildIndex(queues, report) {
  const lines = [
    "# Phase A External Reply Intake Bridge Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- phase_a_state: ${report.phaseAState}`,
    `- outreach_state: ${report.outreachState}`,
    `- total_owner_queues: ${report.totalOwnerQueues}`,
    `- reply_ready_queues: ${report.replyReadyQueues}`,
    "",
    "| Owner queue | Outreach | Ready for intake | Items | Packet |",
    "|---|---|---|---:|---|",
    ...queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.outreachStatus}\` | ${queue.readyForIntake ? "yes" : "no"} | ${queue.itemCount} | ${queue.packetPath} |`,
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

  for (const filePath of [OWNER_QUEUES_JSON, LEDGER_JSON]) {
    if (!fs.existsSync(filePath)) {
      issues.push(`missing required file ${filePath}`);
    }
  }

  ensureDir(OUTPUT_DIR, dryRun);

  if (issues.length > 0) {
    const report = { generatedAt: new Date().toISOString(), mode, issues };
    writeJson(REPORT_JSON, report, dryRun);
    writeText(REPORT_MD, ["# Phase A External Reply Intake Bridge", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"), dryRun);
    if (mode === "enforce") process.exit(1);
    return;
  }

  const ownerQueues = readJson(OWNER_QUEUES_JSON);
  const ledger = readJson(LEDGER_JSON);
  const ledgerMap = new Map((ledger.queues || []).map((queue) => [queue.ownerQueue, queue]));

  ensureDir(BRIDGE_DIR, dryRun);

  const queues = [];
  for (const queue of ownerQueues.ownerQueues || []) {
    const ledgerQueue = ledgerMap.get(queue.ownerQueue);
    const outreachStatus = ledgerQueue?.outreachStatus || "prepared";
    const readyForIntake = outreachStatus === "replied";
    const slug = sanitizeSlug(queue.ownerQueue);
    const packetPath = path.join(BRIDGE_DIR, slug, "INTAKE.md");

    const items = (queue.items || []).map((item) => {
      const commands = deriveCommands(item.referenceId);
      if (commands.route === "unknown") {
        issues.push(`unknown intake routing for ${item.referenceId}`);
      }
      return {
        ...item,
        ...commands,
      };
    });

    const queueReport = {
      ownerQueue: queue.ownerQueue,
      queueKind: queue.queueKind,
      itemCount: queue.itemCount,
      trackSet: queue.trackSet,
      outreachStatus,
      readyForIntake,
      items,
      packetPath,
    };

    ensureDir(path.dirname(packetPath), dryRun);
    writeText(packetPath, buildQueuePacket(queueReport, { generatedAt: new Date().toISOString() }), dryRun);
    queues.push(queueReport);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourceOwnerQueues: rel(OWNER_QUEUES_JSON),
    sourceLedger: rel(LEDGER_JSON),
    phaseAState: ledger.phaseAState || ownerQueues.overallState || "unknown",
    outreachState: ledger.outreachState || "unknown",
    totalOwnerQueues: queues.length,
    replyReadyQueues: queues.filter((queue) => queue.readyForIntake).length,
    queues: queues.map((queue) => ({
      ownerQueue: queue.ownerQueue,
      queueKind: queue.queueKind,
      outreachStatus: queue.outreachStatus,
      readyForIntake: queue.readyForIntake,
      itemCount: queue.itemCount,
      packetPath: queue.packetPath,
      trackSet: queue.trackSet,
    })),
    issues,
  };

  const md = [
    "# Phase A External Reply Intake Bridge",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_owner_queues: \`${report.sourceOwnerQueues}\``,
    `- source_ledger: \`${report.sourceLedger}\``,
    `- phase_a_state: \`${report.phaseAState}\``,
    `- outreach_state: \`${report.outreachState}\``,
    `- total_owner_queues: \`${report.totalOwnerQueues}\``,
    `- reply_ready_queues: \`${report.replyReadyQueues}\``,
    "",
    "## Queue Mapping",
    "",
    "| Owner queue | Outreach | Ready for intake | Items | Packet |",
    "|---|---|---|---:|---|",
    ...report.queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.outreachStatus}\` | ${queue.readyForIntake ? "yes" : "no"} | ${queue.itemCount} | ${queue.packetPath} |`,
    ),
    "",
    "## Decision",
    "",
    "- этот bridge не подменяет внешний ответ, а заранее связывает `replied` с конкретным intake-маршрутом;",
    "- после первого внешнего ответа следующий шаг уже не нужно угадывать: он заранее собран как CLI-route для каждого reference;",
    "- это сокращает разрыв между owner reply и реальным evidence lifecycle по `A1/A2/A4/A5`.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, `${md}\n`, dryRun);
  writeText(BRIDGE_INDEX, buildIndex(queues, report), dryRun);

  console.log("[phase-a-external-reply-intake-bridge] summary");
  console.log(`- phase_a_state=${report.phaseAState}`);
  console.log(`- outreach_state=${report.outreachState}`);
  console.log(`- total_owner_queues=${report.totalOwnerQueues}`);
  console.log(`- reply_ready_queues=${report.replyReadyQueues}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- bridge_index=${BRIDGE_INDEX}`);

  if (mode === "enforce" && (report.totalOwnerQueues === 0 || report.issues.length > 0)) {
    process.exit(1);
  }
}

main();
