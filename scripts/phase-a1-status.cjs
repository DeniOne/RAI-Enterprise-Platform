#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a1-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a1-status.md");

const EXTERNAL_STATUS_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-status.json");
const EXTERNAL_VERDICT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.json");
const FIRST_WAVE_PACKET_JSON = path.join(OUTPUT_DIR, "phase-a1-first-wave-request-packet.json");
const FIRST_WAVE_STATUS_JSON = path.join(OUTPUT_DIR, "phase-a1-first-wave-status.json");

const A1_PLAN_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A1_LEGAL_CLOSEOUT_PLAN.md",
);
const FIRST_WAVE_PACKET_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md",
);
const FIRST_WAVE_STATUS_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A1_FIRST_WAVE_STATUS_GATE.md",
);
const SECOND_WAVE_CHECKLIST_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md",
);

const FIRST_WAVE_REFS = new Set([
  "ELP-20260328-01",
  "ELP-20260328-03",
  "ELP-20260328-04",
  "ELP-20260328-06",
]);
const SECOND_WAVE_REFS = new Set([
  "ELP-20260328-02",
  "ELP-20260328-05",
  "ELP-20260328-08",
  "ELP-20260328-09",
]);
const NON_PRIORITY_REFS = new Set([
  "ELP-20260328-07",
  "ELP-20260328-10",
  "ELP-20260328-11",
]);

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }

  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.file) parts.push(`file=\`${issue.file}\``);
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function computeCounts(items) {
  return {
    total: items.length,
    requested: items.filter((item) => item.status === "requested").length,
    received: items.filter((item) => item.status === "received").length,
    reviewed: items.filter((item) => item.status === "reviewed").length,
    accepted: items.filter((item) => item.status === "accepted").length,
  };
}

function computeWaveState(counts) {
  if (counts.total === 0) {
    return "not_configured";
  }
  if (counts.accepted === counts.total) {
    return "completed";
  }
  if (counts.received > 0 || counts.reviewed > 0 || counts.accepted > 0) {
    return "in_progress";
  }
  return "not_started";
}

function sameCounts(left, right) {
  return (
    left.total === right.total &&
    left.requested === right.requested &&
    left.received === right.received &&
    left.reviewed === right.reviewed &&
    left.accepted === right.accepted
  );
}

function renderTrackRows(tracks) {
  return tracks
    .map(
      (track) =>
        `| \`${track.id}\` | ${track.label} | \`${track.state}\` | ${track.evidence} | ${track.nextAction} |`,
    )
    .join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  const requiredFiles = [
    EXTERNAL_STATUS_JSON,
    EXTERNAL_VERDICT_JSON,
    FIRST_WAVE_PACKET_JSON,
    FIRST_WAVE_STATUS_JSON,
    A1_PLAN_DOC,
    FIRST_WAVE_PACKET_DOC,
    FIRST_WAVE_STATUS_DOC,
    SECOND_WAVE_CHECKLIST_DOC,
  ];

  for (const filePath of requiredFiles) {
    if (!fileExists(filePath)) {
      issues.push({ type: "missing_required_file", file: rel(filePath) });
    }
  }

  if (issues.some((issue) => issue.type === "missing_required_file")) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
    fs.writeFileSync(
      REPORT_MD,
      ["# Phase A1 Status", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
    );
    console.error("[phase-a1-status] missing required inputs");
    if (mode === "enforce") process.exit(1);
    process.exit(0);
  }

  const externalStatus = readJson(EXTERNAL_STATUS_JSON);
  const externalVerdict = readJson(EXTERNAL_VERDICT_JSON);
  const firstWavePacket = readJson(FIRST_WAVE_PACKET_JSON);
  const firstWaveStatus = readJson(FIRST_WAVE_STATUS_JSON);

  const allItems = externalStatus.items || [];
  const firstWaveItems = allItems.filter((item) => FIRST_WAVE_REFS.has(item.referenceId));
  const secondWaveItems = allItems.filter((item) => SECOND_WAVE_REFS.has(item.referenceId));
  const nonPriorityItems = allItems.filter((item) => NON_PRIORITY_REFS.has(item.referenceId));
  const priorityEightItems = allItems.filter(
    (item) => FIRST_WAVE_REFS.has(item.referenceId) || SECOND_WAVE_REFS.has(item.referenceId),
  );

  const firstWaveCounts = computeCounts(firstWaveItems);
  const secondWaveCounts = computeCounts(secondWaveItems);
  const nonPriorityCounts = computeCounts(nonPriorityItems);
  const priorityEightCounts = computeCounts(priorityEightItems);

  if (!sameCounts(firstWaveCounts, firstWaveStatus.counts || {})) {
    issues.push({
      type: "first_wave_count_drift",
      file: rel(FIRST_WAVE_STATUS_JSON),
      value: JSON.stringify({
        fromGlobal: firstWaveCounts,
        fromFirstWaveStatus: firstWaveStatus.counts || {},
      }),
    });
  }

  if (!sameCounts(firstWaveCounts, { total: firstWavePacket.totalItems || 0, ...(firstWavePacket.counts || {}) })) {
    issues.push({
      type: "first_wave_packet_drift",
      file: rel(FIRST_WAVE_PACKET_JSON),
      value: JSON.stringify({
        fromGlobal: firstWaveCounts,
        fromFirstWavePacket: {
          total: firstWavePacket.totalItems || 0,
          ...(firstWavePacket.counts || {}),
        },
      }),
    });
  }

  const firstWaveState = firstWaveStatus.waveState || computeWaveState(firstWaveCounts);
  const secondWaveState = computeWaveState(secondWaveCounts);
  const priorityEightState = computeWaveState(priorityEightCounts);
  const nonPriorityState = computeWaveState(nonPriorityCounts);

  const repoSideReady = fileExists(A1_PLAN_DOC) && fileExists(FIRST_WAVE_PACKET_DOC) && fileExists(FIRST_WAVE_STATUS_DOC);

  let currentState = "repo_side_incomplete";
  if (externalVerdict.currentVerdict === "GO") {
    currentState = "closed";
  } else if (externalStatus.counts.accepted > 0 || externalStatus.counts.reviewed > 0 || externalStatus.counts.received > 0) {
    currentState = "external_in_progress";
  } else if (repoSideReady) {
    currentState = "external_blocked";
  }

  let tier1State = "not_ready";
  if (externalVerdict.currentVerdict === "GO") {
    tier1State = "ready";
  } else if (externalVerdict.currentVerdict === "CONDITIONAL GO") {
    tier1State = "conditional_ready";
  } else if (repoSideReady) {
    tier1State = "no_go_pending_external_evidence";
  }

  const tracks = [
    {
      id: "A1.1",
      label: "First wave `ELP-01 / 03 / 04 / 06`",
      state: firstWaveState,
      evidence: `[phase-a1-first-wave-status.md](/root/RAI_EP/var/compliance/phase-a1-first-wave-status.md)`,
      nextAction:
        firstWaveState === "completed"
          ? "держать первую волну в accepted и не возвращать drift в metadata/register"
          : "двигать первую волну через `intake -> reviewed -> accepted`, начиная с `ELP-20260328-01`",
    },
    {
      id: "A1.2",
      label: "Second wave `ELP-02 / 05 / 08 / 09`",
      state: secondWaveState,
      evidence:
        `[PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md), [external-legal-evidence-status.md](/root/RAI_EP/var/compliance/external-legal-evidence-status.md)`,
      nextAction:
        firstWaveState === "completed"
          ? "после первой волны заводить `ELP-02`, затем `05`, `08`, `09`"
          : "не поднимать вторую волну раньше реального движения по `ELP-01 / 03 / 04 / 06`",
    },
    {
      id: "A1.3",
      label: "Priority eight `Tier 1` legal blockers",
      state: priorityEightState,
      evidence: `[external-legal-evidence-verdict.md](/root/RAI_EP/var/compliance/external-legal-evidence-verdict.md)`,
      nextAction:
        priorityEightState === "completed"
          ? "пересмотреть `Tier 1` legal verdict и снять чистый priority-eight blocker"
          : "держать focus только на приоритетной восьмёрке до изменения verdict",
    },
    {
      id: "A1.4",
      label: "Non-priority tail `ELP-07 / 10 / 11`",
      state: nonPriorityState,
      evidence: `[external-legal-evidence-status.md](/root/RAI_EP/var/compliance/external-legal-evidence-status.md)`,
      nextAction:
        priorityEightState === "completed"
          ? "после сдвига priority-eight добирать tail без подмены `GO`-логики"
          : "не считать этот tail прогрессом `A1`, пока priority-eight не сдвинулась",
    },
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sources: {
      externalStatus: rel(EXTERNAL_STATUS_JSON),
      externalVerdict: rel(EXTERNAL_VERDICT_JSON),
      firstWavePacket: rel(FIRST_WAVE_PACKET_JSON),
      firstWaveStatus: rel(FIRST_WAVE_STATUS_JSON),
    },
    currentLegalVerdict: externalVerdict.currentVerdict,
    nextTargetVerdict: externalVerdict.nextTargetVerdict,
    completionPct: externalVerdict.completionPct,
    blockersToNextTarget: externalVerdict.blockersToNextTarget || [],
    counts: externalStatus.counts,
    firstWave: {
      state: firstWaveState,
      counts: firstWaveCounts,
      items: firstWaveItems,
    },
    secondWave: {
      state: secondWaveState,
      counts: secondWaveCounts,
      items: secondWaveItems,
    },
    priorityEight: {
      state: priorityEightState,
      counts: priorityEightCounts,
    },
    nonPriorityTail: {
      state: nonPriorityState,
      counts: nonPriorityCounts,
      items: nonPriorityItems,
    },
    currentState,
    tier1State,
    repoSideReady,
    tracks,
    issues,
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const blockers =
    Array.isArray(report.blockersToNextTarget) && report.blockersToNextTarget.length > 0
      ? report.blockersToNextTarget
          .map((blocker) => (blocker.referenceId ? `${blocker.referenceId} (${blocker.artifact})` : String(blocker)))
          .join(", ")
      : "none";

  const md = [
    "# Phase A1 Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_external_status: \`${report.sources.externalStatus}\``,
    `- source_external_verdict: \`${report.sources.externalVerdict}\``,
    `- source_first_wave_packet: \`${report.sources.firstWavePacket}\``,
    `- source_first_wave_status: \`${report.sources.firstWaveStatus}\``,
    `- current_legal_verdict: \`${report.currentLegalVerdict}\``,
    `- next_target_verdict: \`${report.nextTargetVerdict}\``,
    `- completion_pct: \`${report.completionPct}\``,
    `- current_state: \`${report.currentState}\``,
    `- tier1_state: \`${report.tier1State}\``,
    `- repo_side_ready: \`${report.repoSideReady ? "yes" : "no"}\``,
    `- blockers_to_next_target: \`${blockers}\``,
    `- total: \`${report.counts.total}\``,
    `- requested: \`${report.counts.requested}\``,
    `- received: \`${report.counts.received}\``,
    `- reviewed: \`${report.counts.reviewed}\``,
    `- accepted: \`${report.counts.accepted}\``,
    "",
    "## Wave Summary",
    "",
    "| Slice | State | Requested | Received | Reviewed | Accepted |",
    "|---|---|---:|---:|---:|---:|",
    `| First wave | \`${report.firstWave.state}\` | ${report.firstWave.counts.requested} | ${report.firstWave.counts.received} | ${report.firstWave.counts.reviewed} | ${report.firstWave.counts.accepted} |`,
    `| Second wave | \`${report.secondWave.state}\` | ${report.secondWave.counts.requested} | ${report.secondWave.counts.received} | ${report.secondWave.counts.reviewed} | ${report.secondWave.counts.accepted} |`,
    `| Priority eight | \`${report.priorityEight.state}\` | ${report.priorityEight.counts.requested} | ${report.priorityEight.counts.received} | ${report.priorityEight.counts.reviewed} | ${report.priorityEight.counts.accepted} |`,
    `| Non-priority tail | \`${report.nonPriorityTail.state}\` | ${report.nonPriorityTail.counts.requested} | ${report.nonPriorityTail.counts.received} | ${report.nonPriorityTail.counts.reviewed} | ${report.nonPriorityTail.counts.accepted} |`,
    "",
    "## A1 Tracks",
    "",
    "| Track | Label | State | Evidence | Next action |",
    "|---|---|---|---|---|",
    renderTrackRows(tracks),
    "",
    "## Decision",
    "",
    report.currentState === "closed"
      ? "- `A1` больше не удерживает legal contour как внешний blocker."
      : report.currentState === "external_in_progress"
        ? "- `A1` уже движется по реальным внешним файлам, но legal closeout ещё не завершён."
        : "- `A1` repo-side подготовлена, но всё ещё удерживается внешним intake и acceptance.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(issues),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-a1-status] summary");
  console.log(`- current_state=${currentState}`);
  console.log(`- tier1_state=${tier1State}`);
  console.log(`- first_wave_state=${firstWaveState}`);
  console.log(`- second_wave_state=${secondWaveState}`);
  console.log(`- priority_eight_state=${priorityEightState}`);
  console.log(`- current_legal_verdict=${report.currentLegalVerdict}`);
  console.log(`- requested=${report.counts.requested}`);
  console.log(`- received=${report.counts.received}`);
  console.log(`- reviewed=${report.counts.reviewed}`);
  console.log(`- accepted=${report.counts.accepted}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && issues.length > 0) {
    process.exit(1);
  }
}

main();
