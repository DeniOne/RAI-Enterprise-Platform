#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const PHASE_A_STATUS_JSON = path.join(OUTPUT_DIR, "phase-a-status.json");
const A1_HANDOFF_JSON = path.join(ROOT, "var", "compliance", "external-legal-evidence-handoff.json");
const A2_STATUS_JSON = path.join(ROOT, "var", "security", "security-evidence-status.json");
const A4_STATUS_JSON = path.join(ROOT, "var", "ops", "phase-a4-pilot-handoff-status.json");
const A5_STATUS_JSON = path.join(ROOT, "var", "compliance", "phase-a5-status.json");
const A5_HANDOFF_JSON = path.join(ROOT, "var", "compliance", "phase-a5-chain-of-title-handoff.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-external-blockers-packet.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-external-blockers-packet.md");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_BLOCKERS_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_BLOCKERS_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const DELIVERY_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-BLOCKERS");
const DELIVERY_FILE = path.join(DELIVERY_DIR, "REQUEST_PACKET.md");

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

function normalizeOwner(owner) {
  return String(owner || "").replace(/`/g, "").trim();
}

function buildCounts(items) {
  return {
    requested: items.filter((item) => item.status === "requested").length,
    received: items.filter((item) => item.status === "received").length,
    reviewed: items.filter((item) => item.status === "reviewed").length,
    accepted: items.filter((item) => item.status === "accepted").length,
  };
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const dryRun = process.argv.includes("--dry-run");
  const issues = [];

  const requiredFiles = [
    PHASE_A_STATUS_JSON,
    A1_HANDOFF_JSON,
    A2_STATUS_JSON,
    A4_STATUS_JSON,
    A5_STATUS_JSON,
    A5_HANDOFF_JSON,
  ];

  for (const filePath of requiredFiles) {
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
      ["# Phase A External Blockers Packet", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
      dryRun,
    );
    if (mode === "enforce") process.exit(1);
    return;
  }

  const phaseA = readJson(PHASE_A_STATUS_JSON);
  const a1 = readJson(A1_HANDOFF_JSON);
  const a2 = readJson(A2_STATUS_JSON);
  const a4 = readJson(A4_STATUS_JSON);
  const a5 = readJson(A5_STATUS_JSON);
  const a5Handoff = readJson(A5_HANDOFF_JSON);

  const a1Track = phaseA.tracks.find((track) => track.id === "A1");
  const a2Track = phaseA.tracks.find((track) => track.id === "A2");
  const a4Track = phaseA.tracks.find((track) => track.id === "A4");
  const a5Track = phaseA.tracks.find((track) => track.id === "A5");

  const a1OwnerQueues = (a1.ownerQueues || []).map((queue) => {
    const items = (queue.tasks || []).map((task, index) => ({
      priority: index + 1,
      referenceId: task.referenceId,
      title: task.artifact,
      wave: "remaining_tail",
      status: task.currentStatus,
      namedOwners: normalizeOwner(queue.owner),
      reviewDue: task.reviewDue || "unknown",
      draftPath: task.draftPath || "pending",
      requiredFields: task.reason || "remaining external legal evidence",
      intakeCommand: task.intakeCommand,
      reviewCommand: task.reviewCommand,
      acceptCommand: task.acceptCommand,
      nextAction: task.nextAction,
    }));

    return {
      owner: normalizeOwner(queue.owner),
      itemCount: items.length,
      counts: buildCounts(items),
      items,
    };
  });

  const a2ResidualRows = (a2.rows || []).filter((row) => row.status !== "accepted");
  const a4ResidualRows = (a4.rows || []).filter((row) => row.status !== "accepted");
  const a5Active = a5Track?.state === "external_blocked" || a5Track?.state === "external_in_progress";
  const a5ResidualOwnerQueues = a5Active ? (a5Handoff.ownerQueues || []) : [];
  const tracks = [
    {
      id: "A1",
      state: a1Track?.state || "unknown",
      itemCount: a1.blockerCount || 0,
      ownerQueues: a1OwnerQueues.length,
      currentLegalVerdict: a1.currentVerdict || "unknown",
      nextAction:
        (a1OwnerQueues[0]?.items || []).length > 0
          ? `добирать remaining legal tail до \`${a1.nextTargetVerdict || "GO"}\`, начиная с \`${a1OwnerQueues[0].items[0].referenceId}\``
          : "удерживать legal contour без drift",
    },
    {
      id: "A2",
      state: a2Track?.state || "unknown",
      itemCount: a2ResidualRows.length,
      ownerQueues: a2ResidualRows.length,
      nextAction: a2Track?.nextAction || "",
    },
    {
      id: "A4",
      state: a4Track?.state || "unknown",
      itemCount: a4ResidualRows.length,
      ownerQueues: a4ResidualRows.length,
      nextAction: a4Track?.nextAction || "",
    },
  ];

  if (a5Active) {
    tracks.push({
      id: "A5",
      state: a5Track?.state || "unknown",
      itemCount: 1,
      ownerQueues: a5ResidualOwnerQueues.length,
      tier1State: a5.summary?.tier1State || "unknown",
      nextAction: a5Track?.nextAction || "",
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourcePhaseAStatus: rel(PHASE_A_STATUS_JSON),
    sourceA1ResidualHandoff: rel(A1_HANDOFF_JSON),
    sourceA2Status: rel(A2_STATUS_JSON),
    sourceA4Status: rel(A4_STATUS_JSON),
    sourceA5Status: rel(A5_STATUS_JSON),
    overallState: phaseA.summary?.overallState || "unknown",
    blockedBy: phaseA.summary?.blockedBy || [],
    tracks,
    details: {
      a1OwnerQueues,
      a2Rows: a2ResidualRows,
      a4Rows: a4ResidualRows,
      a5OwnerQueues: a5ResidualOwnerQueues,
    },
    issues,
  };

  const md = [
    "# Phase A External Blockers Packet",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- overall_state: \`${report.overallState}\``,
    `- blocked_by: \`${report.blockedBy.join(", ") || "none"}\``,
    "",
    "## External Blocker Tracks",
    "",
    "| Track | State | External items | Owner queues | Next action |",
    "|---|---|---:|---:|---|",
    ...report.tracks.map(
      (track) =>
        `| \`${track.id}\` | \`${track.state}\` | ${track.itemCount} | ${track.ownerQueues} | ${track.nextAction} |`,
    ),
    "",
    "## A1 Owner Queues",
    "",
    "| Owner | Items | Requested | Received | Reviewed | Accepted |",
    "|---|---:|---:|---:|---:|---:|",
    ...(a1OwnerQueues || []).map(
      (queue) =>
        `| ${queue.owner} | ${queue.itemCount} | ${queue.counts.requested} | ${queue.counts.received} | ${queue.counts.reviewed} | ${queue.counts.accepted} |`,
    ),
    "",
    "## A2 Security Evidence",
    "",
    "| Reference | Status | Owner | Review due | Draft path |",
    "|---|---|---|---|---|",
    ...(a2ResidualRows || []).map(
      (row) =>
        `| \`${row.referenceId}\` | \`${row.status}\` | ${row.owner} | \`${row.reviewDue}\` | \`${row.draftPath}\` |`,
    ),
    "",
    "## A4 Pilot Handoff",
    "",
    "| Reference | Status | Owner | Review due | Draft path |",
    "|---|---|---|---|---|",
    ...(a4ResidualRows || []).map(
      (row) =>
        `| \`${row.referenceId}\` | \`${row.status}\` | ${row.owner} | \`${row.reviewDue}\` | \`${row.draftPath}\` |`,
    ),
    "",
    ...(a5ResidualOwnerQueues.length > 0
      ? [
          "## A5 Chain Of Title Owner Queues",
          "",
          "| Owner scope | Assets | Evidence classes |",
          "|---|---:|---|",
          ...a5ResidualOwnerQueues.map(
            (queue) =>
              `| ${queue.ownerScope} | ${queue.assetCount} | ${queue.evidenceClasses.join(", ")} |`,
          ),
          "",
        ]
      : []),
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  const restricted = [
    "# Phase A External Blockers Request Packet",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- overall_state: ${report.overallState}`,
    `- blocked_by: ${report.blockedBy.join(", ") || "none"}`,
    "",
    "## Execution Order",
    "",
    "1. `A1` — добивать remaining legal tail до `GO`.",
    "2. `A2` — собрать residual security evidence, которое ещё не `accepted`.",
    "3. `A4` — провести intake по `A4-H-01`.",
    ...(a5ResidualOwnerQueues.length > 0 ? ["4. `A5` — собирать signed evidence по `ELP-20260328-09` через chain-of-title owner queues."] : []),
    "",
    "## A1 Owner Queues",
    "",
    ...((a1OwnerQueues || []).map(
      (queue) => `- ${queue.owner}: ${queue.itemCount} item(s)`,
    )),
    "",
    "## A2 Security Evidence",
    "",
    ...((a2ResidualRows || []).map(
      (row) => `- ${row.referenceId} | ${row.owner} | draft=${row.draftPath}`,
    )),
    "",
    "## A4 Pilot Handoff",
    "",
    ...((a4ResidualRows || []).map(
      (row) => `- ${row.referenceId} | ${row.owner} | draft=${row.draftPath}`,
    )),
    "",
    ...(a5ResidualOwnerQueues.length > 0
      ? [
          "## A5 Chain Of Title",
          "",
          ...a5ResidualOwnerQueues.map(
            (queue) => `- ${queue.ownerScope}: ${queue.assetCount} asset(s)`,
          ),
          "",
        ]
      : []),
  ].join("\n");

  ensureDir(OUTPUT_DIR, dryRun);
  ensureDir(DELIVERY_DIR, dryRun);
  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, `${md}\n`, dryRun);
  writeText(DELIVERY_FILE, `${restricted}\n`, dryRun);

  console.log("[phase-a-external-blockers-packet] summary");
  console.log(`- overall_state=${report.overallState}`);
  console.log(`- blocked_by=${report.blockedBy.join(",") || "none"}`);
  console.log(`- track_count=${report.tracks.length}`);
  console.log(`- issues=${report.issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- delivery_file=${DELIVERY_FILE}`);

  if (mode === "enforce" && report.issues.length > 0) {
    process.exit(1);
  }
}

main();
