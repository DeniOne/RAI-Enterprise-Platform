#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const OWNER_QUEUES_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.json");
const LEDGER_JSON = path.join(OUTPUT_DIR, "phase-a-external-outreach-ledger.json");
const BRIDGE_JSON = path.join(OUTPUT_DIR, "phase-a-external-reply-intake-bridge.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-external-reply-capture-packet.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-external-reply-capture-packet.md");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_REPLY_CAPTURE_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_REPLY_CAPTURE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const CAPTURE_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-REPLY-CAPTURE");
const CAPTURE_INDEX = path.join(CAPTURE_DIR, "INDEX.md");

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

function buildDropZone(item, queue, sourcePathTemplate) {
  const lines = [
    `# Reply Drop Zone: ${item.referenceId}`,
    "",
    `- generated_at: ${queue.generatedAt}`,
    `- owner_queue: ${queue.ownerQueue}`,
    `- outreach_status: ${queue.outreachStatus}`,
    `- title: ${item.title}`,
    `- route: ${item.route}`,
    `- source_path_template: ${sourcePathTemplate}`,
    `- current_status: ${item.status}`,
    "",
    "## Что класть сюда",
    "",
    "- raw письмо, скан, PDF, screenshot или иной исходный ответ владельца очереди;",
    "- вложения, которые прямо подтверждают этот `referenceId`;",
    "- не класть сюда уже переработанный summary, если нет исходного файла.",
    "",
    "## Следующий шаг после сохранения файла",
    "",
    `- intake: \`${item.intakeCommand.replace("/abs/path/file", sourcePathTemplate)}\``,
    `- review: \`${item.reviewCommand}\``,
    `- accept: \`${item.acceptCommand}\``,
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildQueuePacket(queue) {
  const lines = [
    `# Reply Capture Packet: ${queue.ownerQueue}`,
    "",
    `- generated_at: ${queue.generatedAt}`,
    `- owner_queue: ${queue.ownerQueue}`,
    `- queue_kind: ${queue.queueKind}`,
    `- outreach_status: ${queue.outreachStatus}`,
    `- owner_contact: ${queue.ownerContact}`,
    `- last_response_at: ${queue.lastResponseAt}`,
    `- ready_for_capture: ${queue.readyForCapture ? "yes" : "no"}`,
    `- bridge_packet: ${queue.bridgePacketPath}`,
    `- incoming_dir: ${queue.incomingDir}`,
    "",
    "## Rule",
    "",
    queue.readyForCapture
      ? "- Очередь уже в `replied`: сначала положить raw reply и вложения в соответствующие `incoming/<referenceId>/`, затем выполнить intake по фактическому файлу."
      : "- Пока очередь не в `replied`, этот packet служит подготовленным capture-perimeter. Реальный intake запускать только после фактического внешнего ответа.",
    "",
    "## Capture Routes",
    "",
    "| Reference | Title | Drop zone | Source path template | Intake | Review | Accept |",
    "|---|---|---|---|---|---|---|",
    ...queue.items.map(
      (item) =>
        `| ${item.referenceId} | ${item.title} | ${item.dropZonePath} | \`${item.sourcePathTemplate}\` | \`${item.intakeCommand.replace("/abs/path/file", item.sourcePathTemplate)}\` | \`${item.reviewCommand}\` | \`${item.acceptCommand}\` |`,
    ),
    "",
    "## Capture Checklist",
    "",
    "- сохранить raw owner reply и вложения в соответствующую drop-zone;",
    "- не подменять исходный файл пересказом;",
    "- выполнить intake по фактическому пути к сохранённому файлу;",
    "- только после intake переводить evidence дальше в `reviewed` и `accepted`.",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildIndex(queues, report) {
  const lines = [
    "# Phase A External Reply Capture Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- phase_a_state: ${report.phaseAState}`,
    `- outreach_state: ${report.outreachState}`,
    `- total_owner_queues: ${report.totalOwnerQueues}`,
    `- capture_ready_queues: ${report.captureReadyQueues}`,
    "",
    "| Owner queue | Outreach | Ready for capture | Items | Packet |",
    "|---|---|---|---:|---|",
    ...queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.outreachStatus}\` | ${queue.readyForCapture ? "yes" : "no"} | ${queue.itemCount} | ${queue.capturePacketPath} |`,
    ),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function buildMarkdown(report) {
  const lines = [
    "# Phase A External Reply Capture Packet",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- phase_a_state: ${report.phaseAState}`,
    `- outreach_state: ${report.outreachState}`,
    `- total_owner_queues: ${report.totalOwnerQueues}`,
    `- capture_ready_queues: ${report.captureReadyQueues}`,
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
    "| Owner queue | Outreach | Ready for capture | Items | Contact | Packet |",
    "|---|---|---|---:|---|---|",
    ...report.queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.outreachStatus}\` | ${queue.readyForCapture ? "yes" : "no"} | ${queue.itemCount} | ${queue.ownerContact} | ${queue.capturePacketPath} |`,
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

  for (const filePath of [OWNER_QUEUES_JSON, LEDGER_JSON, BRIDGE_JSON]) {
    if (!fs.existsSync(filePath)) {
      issues.push(`missing required file ${filePath}`);
    }
  }

  ensureDir(OUTPUT_DIR, dryRun);

  if (issues.length > 0) {
    const report = { generatedAt: new Date().toISOString(), mode, issues };
    writeJson(REPORT_JSON, report, dryRun);
    writeText(REPORT_MD, buildMarkdown({ generatedAt: report.generatedAt, phaseAState: "unknown", outreachState: "unknown", totalOwnerQueues: 0, captureReadyQueues: 0, issues, queues: [] }), dryRun);
    if (mode === "enforce") process.exit(1);
    return;
  }

  const generatedAt = new Date().toISOString();
  const ownerQueues = readJson(OWNER_QUEUES_JSON);
  const ledger = readJson(LEDGER_JSON);
  const bridge = readJson(BRIDGE_JSON);

  const ledgerMap = new Map((ledger.queues || []).map((queue) => [queue.ownerQueue, queue]));
  const bridgeMap = new Map((bridge.queues || []).map((queue) => [queue.ownerQueue, queue]));

  ensureDir(CAPTURE_DIR, dryRun);

  const queues = [];
  for (const ownerQueue of ownerQueues.ownerQueues || []) {
    const ledgerQueue = ledgerMap.get(ownerQueue.ownerQueue);
    const bridgeQueue = bridgeMap.get(ownerQueue.ownerQueue);

    if (!ledgerQueue) {
      issues.push(`missing outreach ledger queue for ${ownerQueue.ownerQueue}`);
    }
    if (!bridgeQueue) {
      issues.push(`missing reply bridge queue for ${ownerQueue.ownerQueue}`);
    }

    const outreachStatus = ledgerQueue?.outreachStatus || "prepared";
    const readyForCapture = outreachStatus === "replied";
    if (bridgeQueue && Boolean(bridgeQueue.readyForIntake) !== readyForCapture) {
      issues.push(`reply bridge mismatch for ${ownerQueue.ownerQueue}`);
    }

    if (readyForCapture && (!ledgerQueue?.ownerContact || ledgerQueue.ownerContact === "pending")) {
      issues.push(`reply capture queue ${ownerQueue.ownerQueue} is replied but owner_contact is pending`);
    }

    const slug = sanitizeSlug(ownerQueue.ownerQueue);
    const queueDir = path.join(CAPTURE_DIR, slug);
    const capturePacketPath = path.join(queueDir, "CAPTURE.md");
    const incomingDir = path.join(queueDir, "incoming");

    ensureDir(queueDir, dryRun);
    ensureDir(incomingDir, dryRun);

    const items = (ownerQueue.items || []).map((item) => {
      const commands = deriveCommands(item.referenceId);
      if (commands.route === "unknown") {
        issues.push(`unknown capture route for ${item.referenceId}`);
      }
      const itemDir = path.join(incomingDir, item.referenceId);
      const dropZonePath = path.join(itemDir, "DROP_HERE.md");
      const sourcePathTemplate = path.join(itemDir, "<real_file>");
      ensureDir(itemDir, dryRun);
      const queueMeta = {
        generatedAt,
        ownerQueue: ownerQueue.ownerQueue,
        outreachStatus,
      };
      writeText(dropZonePath, buildDropZone({ ...item, ...commands }, queueMeta, sourcePathTemplate), dryRun);
      return {
        referenceId: item.referenceId,
        title: item.title,
        status: item.status,
        route: commands.route,
        intakeCommand: commands.intakeCommand,
        reviewCommand: commands.reviewCommand,
        acceptCommand: commands.acceptCommand,
        dropZonePath,
        sourcePathTemplate,
      };
    });

    const queueReport = {
      generatedAt,
      ownerQueue: ownerQueue.ownerQueue,
      queueKind: ownerQueue.queueKind,
      itemCount: ownerQueue.itemCount,
      outreachStatus,
      readyForCapture,
      ownerContact: ledgerQueue?.ownerContact || "pending",
      lastResponseAt: ledgerQueue?.lastResponseAt || "not_received",
      currentAssignee: ledgerQueue?.currentAssignee || "@techlead",
      trackSet: ownerQueue.trackSet || [],
      bridgePacketPath: bridgeQueue?.packetPath || "missing",
      incomingDir,
      capturePacketPath,
      items,
    };

    writeText(capturePacketPath, buildQueuePacket(queueReport), dryRun);
    queues.push(queueReport);
  }

  const report = {
    generatedAt,
    mode,
    sourceOwnerQueues: rel(OWNER_QUEUES_JSON),
    sourceLedger: rel(LEDGER_JSON),
    sourceBridge: rel(BRIDGE_JSON),
    phaseAState: ledger.phaseAState || bridge.phaseAState || ownerQueues.overallState || "unknown",
    outreachState: ledger.outreachState || bridge.outreachState || "unknown",
    totalOwnerQueues: queues.length,
    captureReadyQueues: queues.filter((queue) => queue.readyForCapture).length,
    issues,
    queues: queues.map((queue) => ({
      ownerQueue: queue.ownerQueue,
      queueKind: queue.queueKind,
      outreachStatus: queue.outreachStatus,
      readyForCapture: queue.readyForCapture,
      itemCount: queue.itemCount,
      ownerContact: queue.ownerContact,
      lastResponseAt: queue.lastResponseAt,
      currentAssignee: queue.currentAssignee,
      trackSet: queue.trackSet,
      bridgePacketPath: queue.bridgePacketPath,
      capturePacketPath: queue.capturePacketPath,
      incomingDir: queue.incomingDir,
    })),
    indexPath: CAPTURE_INDEX,
  };

  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, buildMarkdown(report), dryRun);
  writeText(CAPTURE_INDEX, buildIndex(queues, report), dryRun);

  console.log("[phase-a-external-reply-capture-packet] summary");
  console.log(`- phase_a_state=${report.phaseAState}`);
  console.log(`- outreach_state=${report.outreachState}`);
  console.log(`- total_owner_queues=${report.totalOwnerQueues}`);
  console.log(`- capture_ready_queues=${report.captureReadyQueues}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- capture_index=${CAPTURE_INDEX}`);

  if (mode === "enforce" && issues.length > 0) {
    console.error("[phase-a-external-reply-capture-packet] issues detected");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }
}

main();
