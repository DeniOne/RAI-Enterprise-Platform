#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const PHASE_A_STATUS_JSON = path.join(OUTPUT_DIR, "phase-a-status.json");
const EXTERNAL_BLOCKERS_JSON = path.join(OUTPUT_DIR, "phase-a-external-blockers-packet.json");
const EXTERNAL_OWNER_QUEUES_JSON = path.join(OUTPUT_DIR, "phase-a-external-owner-queues.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-closeout-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-closeout-status.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function unique(values) {
  return [...new Set(values)];
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues.map((issue) => `- ${issue}`).join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  for (const filePath of [PHASE_A_STATUS_JSON, EXTERNAL_BLOCKERS_JSON, EXTERNAL_OWNER_QUEUES_JSON]) {
    if (!fs.existsSync(filePath)) {
      issues.push(`missing required file ${filePath}`);
    }
  }

  ensureDir(OUTPUT_DIR);

  if (issues.length > 0) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    writeJson(REPORT_JSON, report);
    writeText(
      REPORT_MD,
      ["# Phase A Closeout Status", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
    );
    if (mode === "enforce") process.exit(1);
    return;
  }

  const phaseA = readJson(PHASE_A_STATUS_JSON);
  const blockers = readJson(EXTERNAL_BLOCKERS_JSON);
  const ownerQueues = readJson(EXTERNAL_OWNER_QUEUES_JSON);

  const trackStates = (phaseA.tracks || []).map((track) => ({ id: track.id, state: track.state }));
  const repoSideIncompleteTracks = trackStates.filter((track) => track.state === "repo_side_incomplete").map((track) => track.id);
  const externalHoldingTracks = trackStates
    .filter((track) => track.state === "external_blocked" || track.state === "external_in_progress")
    .map((track) => track.id);
  const repoSidePreparedTracks = trackStates
    .filter((track) => track.state === "done" || track.state === "repo_side_complete" || track.state === "external_blocked" || track.state === "external_in_progress")
    .map((track) => track.id);

  const repoSideExhausted = repoSideIncompleteTracks.length === 0;
  const phaseClosed = (phaseA.summary?.overallState || "unknown") === "repo_side_complete" && externalHoldingTracks.length === 0;
  const externalOnlyBlocked =
    repoSideExhausted &&
    !phaseClosed &&
    ((phaseA.summary?.overallState || "unknown") === "external_blocked" || (phaseA.summary?.overallState || "unknown") === "external_in_progress");

  let closeoutState = "repo_side_work_remaining";
  if (phaseClosed) {
    closeoutState = "phase_a_closed";
  } else if (externalOnlyBlocked) {
    closeoutState = "repo_side_exhausted_external_only";
  }

  const remainingReferences = unique(
    (ownerQueues.ownerQueues || []).flatMap((queue) => (queue.items || []).map((item) => item.referenceId)),
  ).sort();

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    inputs: {
      phaseAStatus: rel(PHASE_A_STATUS_JSON),
      externalBlockers: rel(EXTERNAL_BLOCKERS_JSON),
      externalOwnerQueues: rel(EXTERNAL_OWNER_QUEUES_JSON),
    },
    summary: {
      overallState: phaseA.summary?.overallState || "unknown",
      closeoutState,
      repoSideExhausted,
      phaseClosed,
      externalOnlyBlocked,
      repoSidePreparedTracks,
      repoSideIncompleteTracks,
      externalHoldingTracks,
      remainingOwnerQueues: ownerQueues.totalOwnerQueues || 0,
      remainingReferencesCount: remainingReferences.length,
      remainingReferences,
    },
    blockers: blockers.tracks || [],
    ownerQueues: (ownerQueues.ownerQueues || []).map((queue) => ({
      ownerQueue: queue.ownerQueue,
      queueKind: queue.queueKind,
      itemCount: queue.itemCount,
      trackSet: queue.trackSet,
      counts: queue.counts,
    })),
    issues,
  };

  const md = [
    "# Phase A Closeout Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- overall_state: \`${report.summary.overallState}\``,
    `- closeout_state: \`${report.summary.closeoutState}\``,
    `- repo_side_exhausted: \`${report.summary.repoSideExhausted}\``,
    `- phase_closed: \`${report.summary.phaseClosed}\``,
    `- external_only_blocked: \`${report.summary.externalOnlyBlocked}\``,
    "",
    "## Summary",
    "",
    `- repo_side_prepared_tracks: \`${report.summary.repoSidePreparedTracks.join(", ") || "none"}\``,
    `- repo_side_incomplete_tracks: \`${report.summary.repoSideIncompleteTracks.join(", ") || "none"}\``,
    `- external_holding_tracks: \`${report.summary.externalHoldingTracks.join(", ") || "none"}\``,
    `- remaining_owner_queues: \`${report.summary.remainingOwnerQueues}\``,
    `- remaining_references_count: \`${report.summary.remainingReferencesCount}\``,
    `- remaining_references: \`${report.summary.remainingReferences.join(", ") || "none"}\``,
    "",
    "## External Holding Tracks",
    "",
    "| Track | State | External items | Owner queues | Next action |",
    "|---|---|---:|---:|---|",
    ...(report.blockers || []).map(
      (track) =>
        `| \`${track.id}\` | \`${track.state}\` | ${track.itemCount || 0} | ${track.ownerQueues || 0} | ${track.nextAction || ""} |`,
    ),
    "",
    "## Owner Queue Snapshot",
    "",
    "| Owner queue | Queue kind | Tracks | Items | Requested | Received | Reviewed | Accepted |",
    "|---|---|---|---:|---:|---:|---:|---:|",
    ...(report.ownerQueues || []).map(
      (queue) =>
        `| ${queue.ownerQueue} | \`${queue.queueKind}\` | ${(queue.trackSet || []).join(", ")} | ${queue.itemCount} | ${queue.counts?.requested || 0} | ${queue.counts?.received || 0} | ${queue.counts?.reviewed || 0} | ${queue.counts?.accepted || 0} |`,
    ),
    "",
    "## Decision",
    "",
    closeoutState === "repo_side_exhausted_external_only"
      ? "- Внутри репозитория `Phase A` выжата до предела; дальше фазу держат только внешние evidence."
      : closeoutState === "phase_a_closed"
        ? "- `Phase A` закрыта полностью."
        : "- Внутри репозитория ещё остаётся работа; фаза не упирается только во внешние артефакты.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  writeJson(REPORT_JSON, report);
  writeText(REPORT_MD, `${md}\n`);

  console.log("[phase-a-closeout-status] summary");
  console.log(`- overall_state=${report.summary.overallState}`);
  console.log(`- closeout_state=${report.summary.closeoutState}`);
  console.log(`- repo_side_exhausted=${report.summary.repoSideExhausted}`);
  console.log(`- external_holding_tracks=${report.summary.externalHoldingTracks.join(",") || "none"}`);
  console.log(`- remaining_owner_queues=${report.summary.remainingOwnerQueues}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !phaseClosed && !externalOnlyBlocked) {
    process.exit(1);
  }
}

main();
