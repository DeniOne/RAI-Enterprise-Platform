#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const OWNER_QUEUES_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.json");
const LEDGER_JSON = path.join(OUTPUT_DIR, "phase-a-external-outreach-ledger.json");
const CAPTURE_JSON = path.join(OUTPUT_DIR, "phase-a-external-reply-capture-packet.json");
const LEGAL_STATUS_JSON = path.join(ROOT, "var", "compliance", "external-legal-evidence-status.json");
const SECURITY_STATUS_JSON = path.join(ROOT, "var", "security", "security-evidence-status.json");
const PILOT_STATUS_JSON = path.join(ROOT, "var", "ops", "phase-a4-pilot-handoff-status.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-external-evidence-reconciliation.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-external-evidence-reconciliation.md");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_RECONCILIATION_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_RECONCILIATION_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const RECON_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-EVIDENCE-RECONCILIATION");
const RECON_INDEX = path.join(RECON_DIR, "INDEX.md");

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

function buildStatusMap(legalStatus, securityStatus, pilotStatus) {
  const map = new Map();

  for (const row of legalStatus.items || []) {
    map.set(row.referenceId, {
      referenceId: row.referenceId,
      route: "legal",
      status: row.status,
      sourceFile: LEGAL_STATUS_JSON,
      owner: row.namedOwners || "n/a",
      reviewDue: row.reviewDue || "n/a",
      artifactPath: row.artifactPath || "pending",
    });
  }

  for (const row of securityStatus.rows || []) {
    map.set(row.referenceId, {
      referenceId: row.referenceId,
      route: "security",
      status: row.status,
      sourceFile: SECURITY_STATUS_JSON,
      owner: row.owner || "n/a",
      reviewDue: row.reviewDue || "n/a",
      artifactPath: row.artifactPath || "pending",
    });
  }

  for (const row of pilotStatus.rows || []) {
    map.set(row.referenceId, {
      referenceId: row.referenceId,
      route: "pilot_handoff",
      status: row.status,
      sourceFile: PILOT_STATUS_JSON,
      owner: row.owner || "n/a",
      reviewDue: row.reviewDue || "n/a",
      artifactPath: row.artifactPath || "pending",
    });
  }

  return map;
}

function listCapturedFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((entry) => !entry.startsWith(".") && entry !== "DROP_HERE.md")
    .map((entry) => path.join(dirPath, entry));
}

function deriveReconciliationState(outreachStatus, capturePresent, evidenceStatus) {
  if (evidenceStatus === "accepted") return "accepted";
  if (evidenceStatus === "reviewed") return "waiting_acceptance";
  if (evidenceStatus === "received") return "waiting_review";
  if (capturePresent && evidenceStatus === "requested") return "waiting_intake";
  if (outreachStatus === "replied") return "waiting_capture";
  if (outreachStatus === "acknowledged") return "waiting_reply_payload";
  if (outreachStatus === "sent") return "waiting_ack_or_reply";
  return "waiting_outreach";
}

function deriveNextAction(state, item) {
  switch (state) {
    case "accepted":
      return "закрыть owner queue, если этот reference больше не держит blocker";
    case "waiting_acceptance":
      return `выполнить accept для ${item.referenceId}`;
    case "waiting_review":
      return `выполнить review для ${item.referenceId}`;
    case "waiting_intake":
      return `выполнить intake по сохранённому raw reply для ${item.referenceId}`;
    case "waiting_capture":
      return `сохранить raw owner reply в drop-zone для ${item.referenceId}`;
    case "waiting_reply_payload":
      return `дождаться содержательного reply и затем сохранить его в capture-perimeter для ${item.referenceId}`;
    case "waiting_ack_or_reply":
      return `добиться acknowledgement или reply по очереди, удерживая tracker`;
    default:
      return `перевести owner queue в sent/acknowledged/replied для ${item.referenceId}`;
  }
}

function buildQueuePacket(queue) {
  const lines = [
    `# External Evidence Reconciliation: ${queue.ownerQueue}`,
    "",
    `- generated_at: ${queue.generatedAt}`,
    `- owner_queue: ${queue.ownerQueue}`,
    `- outreach_status: ${queue.outreachStatus}`,
    `- owner_contact: ${queue.ownerContact}`,
    `- last_response_at: ${queue.lastResponseAt}`,
    `- closure_ready: ${queue.closureReady ? "yes" : "no"}`,
    `- capture_packet: ${queue.capturePacketPath}`,
    "",
    "| Reference | Track | Route | Outreach | Raw reply files | Evidence status | Reconciliation state | Next action | Source |",
    "|---|---|---|---|---:|---|---|---|---|",
    ...queue.items.map(
      (item) =>
        `| ${item.referenceId} | \`${item.track}\` | \`${item.route}\` | \`${queue.outreachStatus}\` | ${item.rawReplyFileCount} | \`${item.evidenceStatus}\` | \`${item.reconciliationState}\` | ${item.nextAction} | ${item.sourceStatusFile} |`,
    ),
    "",
    "## Rule",
    "",
    "- очередь нельзя закрывать, пока хотя бы один `referenceId` не дошёл до `accepted` или не имеет отдельного подтверждённого решения, что больше не держит blocker;",
    "- raw reply без `intake` не считается движением фазы;",
    "- `intake` без дальнейшего `review / accept` тоже не считается закрытием очереди.",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildIndex(queues, report) {
  const lines = [
    "# Phase A External Evidence Reconciliation Index",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- phase_a_state: ${report.phaseAState}`,
    `- outreach_state: ${report.outreachState}`,
    `- total_owner_queues: ${report.totalOwnerQueues}`,
    `- closure_ready_queues: ${report.closureReadyQueues}`,
    "",
    "| Owner queue | Outreach | Closure ready | Accepted items | Waiting capture | Waiting intake | Waiting review | Waiting acceptance | Packet |",
    "|---|---|---|---:|---:|---:|---:|---:|---|",
    ...queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.outreachStatus}\` | ${queue.closureReady ? "yes" : "no"} | ${queue.acceptedItems} | ${queue.waitingCaptureItems} | ${queue.waitingIntakeItems} | ${queue.waitingReviewItems} | ${queue.waitingAcceptanceItems} | ${queue.packetPath} |`,
    ),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function buildMarkdown(report) {
  const lines = [
    "# Phase A External Evidence Reconciliation",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- phase_a_state: ${report.phaseAState}`,
    `- outreach_state: ${report.outreachState}`,
    `- total_owner_queues: ${report.totalOwnerQueues}`,
    `- closure_ready_queues: ${report.closureReadyQueues}`,
    `- accepted_items: ${report.acceptedItems}`,
    `- waiting_capture_items: ${report.waitingCaptureItems}`,
    `- waiting_intake_items: ${report.waitingIntakeItems}`,
    `- waiting_review_items: ${report.waitingReviewItems}`,
    `- waiting_acceptance_items: ${report.waitingAcceptanceItems}`,
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
    "| Owner queue | Outreach | Closure ready | Accepted | Waiting capture | Waiting intake | Waiting review | Waiting acceptance | Packet |",
    "|---|---|---|---:|---:|---:|---:|---:|---|",
    ...report.queues.map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.outreachStatus}\` | ${queue.closureReady ? "yes" : "no"} | ${queue.acceptedItems} | ${queue.waitingCaptureItems} | ${queue.waitingIntakeItems} | ${queue.waitingReviewItems} | ${queue.waitingAcceptanceItems} | ${queue.packetPath} |`,
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

  for (const filePath of [OWNER_QUEUES_JSON, LEDGER_JSON, CAPTURE_JSON, LEGAL_STATUS_JSON, SECURITY_STATUS_JSON, PILOT_STATUS_JSON]) {
    if (!fs.existsSync(filePath)) {
      issues.push(`missing required file ${filePath}`);
    }
  }

  ensureDir(OUTPUT_DIR, dryRun);

  if (issues.length > 0) {
    const generatedAt = new Date().toISOString();
    const report = {
      generatedAt,
      phaseAState: "unknown",
      outreachState: "unknown",
      totalOwnerQueues: 0,
      closureReadyQueues: 0,
      acceptedItems: 0,
      waitingCaptureItems: 0,
      waitingIntakeItems: 0,
      waitingReviewItems: 0,
      waitingAcceptanceItems: 0,
      issues,
      queues: [],
    };
    writeJson(REPORT_JSON, report, dryRun);
    writeText(REPORT_MD, buildMarkdown(report), dryRun);
    if (mode === "enforce") process.exit(1);
    return;
  }

  const generatedAt = new Date().toISOString();
  const ownerQueues = readJson(OWNER_QUEUES_JSON);
  const ledger = readJson(LEDGER_JSON);
  const capture = readJson(CAPTURE_JSON);
  const legalStatus = readJson(LEGAL_STATUS_JSON);
  const securityStatus = readJson(SECURITY_STATUS_JSON);
  const pilotStatus = readJson(PILOT_STATUS_JSON);
  const statusMap = buildStatusMap(legalStatus, securityStatus, pilotStatus);

  const ledgerMap = new Map((ledger.queues || []).map((queue) => [queue.ownerQueue, queue]));
  const captureMap = new Map((capture.queues || []).map((queue) => [queue.ownerQueue, queue]));

  ensureDir(RECON_DIR, dryRun);

  const queues = [];
  for (const ownerQueue of ownerQueues.ownerQueues || []) {
    const ledgerQueue = ledgerMap.get(ownerQueue.ownerQueue);
    const captureQueue = captureMap.get(ownerQueue.ownerQueue);

    if (!ledgerQueue) {
      issues.push(`missing outreach ledger queue for ${ownerQueue.ownerQueue}`);
    }
    if (!captureQueue) {
      issues.push(`missing capture packet queue for ${ownerQueue.ownerQueue}`);
    }

    const outreachStatus = ledgerQueue?.outreachStatus || "prepared";
    const queueDir = path.join(RECON_DIR, sanitizeSlug(ownerQueue.ownerQueue));
    const packetPath = path.join(queueDir, "RECONCILE.md");
    ensureDir(queueDir, dryRun);

    const items = (ownerQueue.items || []).map((item) => {
      const statusRow = statusMap.get(item.referenceId);
      if (!statusRow) {
        issues.push(`missing track status row for ${item.referenceId}`);
      }

      const incomingDirBase = captureQueue?.incomingDir || path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-REPLY-CAPTURE", sanitizeSlug(ownerQueue.ownerQueue), "incoming");
      const referenceDir = path.join(incomingDirBase, item.referenceId);
      const rawReplyFiles = listCapturedFiles(referenceDir);
      const capturePresent = rawReplyFiles.length > 0;
      const evidenceStatus = statusRow?.status || item.status || "requested";
      const reconciliationState = deriveReconciliationState(outreachStatus, capturePresent, evidenceStatus);
      const nextAction = deriveNextAction(reconciliationState, item);

      if (outreachStatus === "closed" && evidenceStatus !== "accepted") {
        issues.push(`owner queue ${ownerQueue.ownerQueue} closed before ${item.referenceId} reached accepted`);
      }

      return {
        referenceId: item.referenceId,
        title: item.title,
        track: item.track,
        route: statusRow?.route || "unknown",
        evidenceStatus,
        sourceStatusFile: statusRow ? rel(statusRow.sourceFile) : "missing",
        owner: statusRow?.owner || "n/a",
        reviewDue: statusRow?.reviewDue || "n/a",
        artifactPath: statusRow?.artifactPath || "pending",
        rawReplyFileCount: rawReplyFiles.length,
        rawReplyFiles: rawReplyFiles.map((filePath) => filePath),
        referenceDir,
        reconciliationState,
        nextAction,
      };
    });

    const queueReport = {
      generatedAt,
      ownerQueue: ownerQueue.ownerQueue,
      outreachStatus,
      ownerContact: ledgerQueue?.ownerContact || "pending",
      lastResponseAt: ledgerQueue?.lastResponseAt || "not_received",
      itemCount: items.length,
      acceptedItems: items.filter((item) => item.evidenceStatus === "accepted").length,
      waitingCaptureItems: items.filter((item) => item.reconciliationState === "waiting_capture").length,
      waitingIntakeItems: items.filter((item) => item.reconciliationState === "waiting_intake").length,
      waitingReviewItems: items.filter((item) => item.reconciliationState === "waiting_review").length,
      waitingAcceptanceItems: items.filter((item) => item.reconciliationState === "waiting_acceptance").length,
      closureReady: items.length > 0 && items.every((item) => item.evidenceStatus === "accepted"),
      capturePacketPath: captureQueue?.capturePacketPath || "missing",
      packetPath,
      items,
    };

    writeText(packetPath, buildQueuePacket(queueReport), dryRun);
    queues.push(queueReport);
  }

  const report = {
    generatedAt,
    mode,
    sourceOwnerQueues: rel(OWNER_QUEUES_JSON),
    sourceLedger: rel(LEDGER_JSON),
    sourceCapture: rel(CAPTURE_JSON),
    sourceLegalStatus: rel(LEGAL_STATUS_JSON),
    sourceSecurityStatus: rel(SECURITY_STATUS_JSON),
    sourcePilotStatus: rel(PILOT_STATUS_JSON),
    phaseAState: ledger.phaseAState || capture.phaseAState || ownerQueues.overallState || "unknown",
    outreachState: ledger.outreachState || capture.outreachState || "unknown",
    totalOwnerQueues: queues.length,
    closureReadyQueues: queues.filter((queue) => queue.closureReady).length,
    acceptedItems: queues.reduce((sum, queue) => sum + queue.acceptedItems, 0),
    waitingCaptureItems: queues.reduce((sum, queue) => sum + queue.waitingCaptureItems, 0),
    waitingIntakeItems: queues.reduce((sum, queue) => sum + queue.waitingIntakeItems, 0),
    waitingReviewItems: queues.reduce((sum, queue) => sum + queue.waitingReviewItems, 0),
    waitingAcceptanceItems: queues.reduce((sum, queue) => sum + queue.waitingAcceptanceItems, 0),
    issues,
    queues: queues.map((queue) => ({
      ownerQueue: queue.ownerQueue,
      outreachStatus: queue.outreachStatus,
      ownerContact: queue.ownerContact,
      lastResponseAt: queue.lastResponseAt,
      itemCount: queue.itemCount,
      acceptedItems: queue.acceptedItems,
      waitingCaptureItems: queue.waitingCaptureItems,
      waitingIntakeItems: queue.waitingIntakeItems,
      waitingReviewItems: queue.waitingReviewItems,
      waitingAcceptanceItems: queue.waitingAcceptanceItems,
      closureReady: queue.closureReady,
      packetPath: queue.packetPath,
      capturePacketPath: queue.capturePacketPath,
    })),
    indexPath: RECON_INDEX,
  };

  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, buildMarkdown(report), dryRun);
  writeText(RECON_INDEX, buildIndex(queues, report), dryRun);

  console.log("[phase-a-external-evidence-reconciliation] summary");
  console.log(`- phase_a_state=${report.phaseAState}`);
  console.log(`- outreach_state=${report.outreachState}`);
  console.log(`- total_owner_queues=${report.totalOwnerQueues}`);
  console.log(`- closure_ready_queues=${report.closureReadyQueues}`);
  console.log(`- accepted_items=${report.acceptedItems}`);
  console.log(`- waiting_capture_items=${report.waitingCaptureItems}`);
  console.log(`- waiting_intake_items=${report.waitingIntakeItems}`);
  console.log(`- waiting_review_items=${report.waitingReviewItems}`);
  console.log(`- waiting_acceptance_items=${report.waitingAcceptanceItems}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- reconciliation_index=${RECON_INDEX}`);

  if (mode === "enforce" && issues.length > 0) {
    console.error("[phase-a-external-evidence-reconciliation] issues detected");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }
}

main();
