#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a-status.md");

const A1_STATUS_JSON = path.join(ROOT, "var", "compliance", "phase-a1-status.json");
const A2_SECURITY_EVIDENCE_JSON = path.join(ROOT, "var", "security", "security-evidence-status.json");
const A3_EVAL_SUMMARY_JSON = path.join(ROOT, "var", "ops", "phase-a3-release-eval-summary-2026-03-31.json");
const A4_HANDOFF_STATUS_JSON = path.join(ROOT, "var", "ops", "phase-a4-pilot-handoff-status.json");
const A5_STATUS_JSON = path.join(ROOT, "var", "compliance", "phase-a5-status.json");

const A0_RULES_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A0_TRIAGE_EXECUTION_RULES.md",
);
const A0_DAILY_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A0_DAILY_TRIAGE_CHECKLIST.md",
);
const A2_TIER1_DECISION_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A2_TIER1_TOOLCHAIN_DECISION.md",
);
const A2_HISTORICAL_CHECKLIST_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md",
);
const A2_ACCESS_CHECKLIST_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md",
);
const A3_TOOL_MATRIX_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A3_TOOL_PERMISSION_MATRIX.md",
);
const A3_HITL_MATRIX_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A3_HITL_MATRIX.md",
);
const A3_ADVISORY_REGISTER_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A3_ADVISORY_ONLY_REGISTER.md",
);
const A3_EVAL_SUITE_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A3_RELEASE_EVAL_SUITE.md",
);
const A4_INSTALL_REPORT_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md",
);
const A4_BLANK_BOOTSTRAP_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md",
);
const A4_BACKUP_RESTORE_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md",
);
const A4_SUPPORT_BOUNDARY_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A4_SUPPORT_BOUNDARY_PACKET.md",
);

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n");
}

function renderTrackRows(tracks) {
  return tracks
    .map(
      (track) =>
        `| \`${track.id}\` | ${track.label} | \`${track.state}\` | ${track.evidence} | ${track.nextAction} |`,
    )
    .join("\n");
}

function resolveOverallState(trackStates) {
  if (trackStates.some((state) => state === "repo_side_incomplete")) {
    return "repo_side_incomplete";
  }
  if (trackStates.some((state) => state === "external_in_progress")) {
    return "external_in_progress";
  }
  if (trackStates.some((state) => state === "external_blocked")) {
    return "external_blocked";
  }
  if (trackStates.every((state) => state === "done" || state === "repo_side_complete" || state === "closed")) {
    return "repo_side_complete";
  }
  return "in_progress";
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  const requiredJson = [
    A1_STATUS_JSON,
    A2_SECURITY_EVIDENCE_JSON,
    A3_EVAL_SUMMARY_JSON,
    A4_HANDOFF_STATUS_JSON,
    A5_STATUS_JSON,
  ];

  for (const filePath of requiredJson) {
    if (!fileExists(filePath)) {
      issues.push({ type: "missing_required_json", file: rel(filePath) });
    }
  }

  const requiredDocs = [
    A0_RULES_DOC,
    A0_DAILY_DOC,
    A2_TIER1_DECISION_DOC,
    A2_HISTORICAL_CHECKLIST_DOC,
    A2_ACCESS_CHECKLIST_DOC,
    A3_TOOL_MATRIX_DOC,
    A3_HITL_MATRIX_DOC,
    A3_ADVISORY_REGISTER_DOC,
    A3_EVAL_SUITE_DOC,
    A4_INSTALL_REPORT_DOC,
    A4_BLANK_BOOTSTRAP_DOC,
    A4_BACKUP_RESTORE_DOC,
    A4_SUPPORT_BOUNDARY_DOC,
  ];

  for (const filePath of requiredDocs) {
    if (!fileExists(filePath)) {
      issues.push({ type: "missing_required_doc", file: rel(filePath) });
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (issues.length > 0) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    writeJson(REPORT_JSON, report);
    writeText(REPORT_MD, ["# Phase A Status", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"));
    if (mode === "enforce") process.exit(1);
    return;
  }

  const a1 = readJson(A1_STATUS_JSON);
  const a2 = readJson(A2_SECURITY_EVIDENCE_JSON);
  const a3 = readJson(A3_EVAL_SUMMARY_JSON);
  const a4 = readJson(A4_HANDOFF_STATUS_JSON);
  const a5 = readJson(A5_STATUS_JSON);

  const a0State = fileExists(A0_RULES_DOC) && fileExists(A0_DAILY_DOC) ? "done" : "repo_side_incomplete";

  const a1State = a1.currentState || "repo_side_incomplete";

  const a2RepoSideReady =
    fileExists(A2_TIER1_DECISION_DOC) &&
    fileExists(A2_HISTORICAL_CHECKLIST_DOC) &&
    fileExists(A2_ACCESS_CHECKLIST_DOC);
  let a2State = "repo_side_incomplete";
  if (a2RepoSideReady) {
    if ((a2.counts?.accepted || 0) === (a2.counts?.total || 0) && (a2.counts?.total || 0) > 0) {
      a2State = "closed";
    } else if ((a2.counts?.received || 0) > 0 || (a2.counts?.reviewed || 0) > 0 || (a2.counts?.accepted || 0) > 0) {
      a2State = "external_in_progress";
    } else {
      a2State = "external_blocked";
    }
  }

  const a3RepoSideReady =
    fileExists(A3_TOOL_MATRIX_DOC) &&
    fileExists(A3_HITL_MATRIX_DOC) &&
    fileExists(A3_ADVISORY_REGISTER_DOC) &&
    fileExists(A3_EVAL_SUITE_DOC);
  const a3State = a3RepoSideReady && a3.gateStatus === "PASS" ? "repo_side_complete" : "repo_side_incomplete";

  const a4RepoSideReady =
    fileExists(A4_INSTALL_REPORT_DOC) &&
    fileExists(A4_BLANK_BOOTSTRAP_DOC) &&
    fileExists(A4_BACKUP_RESTORE_DOC) &&
    fileExists(A4_SUPPORT_BOUNDARY_DOC);
  let a4State = "repo_side_incomplete";
  if (a4RepoSideReady) {
    if ((a4.counts?.accepted || 0) === (a4.counts?.total || 0) && (a4.counts?.total || 0) > 0) {
      a4State = "closed";
    } else if ((a4.counts?.received || 0) > 0 || (a4.counts?.reviewed || 0) > 0 || (a4.counts?.accepted || 0) > 0) {
      a4State = "external_in_progress";
    } else {
      a4State = "external_blocked";
    }
  }

  const a5State = a5.summary?.currentState || "repo_side_incomplete";

  const tracks = [
    {
      id: "A0",
      label: "triage and anti-breadth governance",
      state: a0State,
      evidence:
        `[PHASE_A0_TRIAGE_EXECUTION_RULES.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_TRIAGE_EXECUTION_RULES.md), [PHASE_A0_DAILY_TRIAGE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_DAILY_TRIAGE_CHECKLIST.md)`,
      nextAction: "удерживать triage discipline и не давать breadth-задачам обходить board",
    },
    {
      id: "A1",
      label: "legal / privacy / operator / residency",
      state: a1State,
      evidence: `[phase-a1-status.md](/root/RAI_EP/var/compliance/phase-a1-status.md)`,
      nextAction: "начать реальный intake по `ELP-20260328-01`, затем вести первую волну сверху вниз",
    },
    {
      id: "A2",
      label: "security / AppSec / secret hygiene",
      state: a2State,
      evidence:
        `[security-evidence-status.md](/root/RAI_EP/var/security/security-evidence-status.md), [PHASE_A2_TIER1_TOOLCHAIN_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_TIER1_TOOLCHAIN_DECISION.md)`,
      nextAction:
        a2State === "external_blocked"
          ? "собрать первый accepted security artifact по `A2-S-01`, затем `A2-S-02`, `A2-S-03`"
          : "удерживать security closeout без дрифта и двигать residual evidence дальше",
    },
    {
      id: "A3",
      label: "AI governance / tool / HITL / eval",
      state: a3State,
      evidence:
        `[phase-a3-release-eval-summary-2026-03-31.md](/root/RAI_EP/var/ops/phase-a3-release-eval-summary-2026-03-31.md), [PHASE_A3_RELEASE_EVAL_SUITE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RELEASE_EVAL_SUITE.md)`,
      nextAction: "удерживать eval suite и governance docs синхронизированными с runtime changes",
    },
    {
      id: "A4",
      label: "installability / self-host / backup-restore",
      state: a4State,
      evidence:
        `[phase-a4-pilot-handoff-status.md](/root/RAI_EP/var/ops/phase-a4-pilot-handoff-status.md), [PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md)`,
      nextAction:
        a4State === "external_blocked"
          ? "перевести `A4-H-01` из `requested` в реальный pilot handoff intake"
          : "удерживать install/recovery perimeter и pilot handoff без drift",
    },
    {
      id: "A5",
      label: "IP / OSS / chain-of-title",
      state: a5State,
      evidence: `[phase-a5-status.md](/root/RAI_EP/var/compliance/phase-a5-status.md)`,
      nextAction:
        a5State === "external_blocked"
          ? "собрать signed external evidence по `ELP-20260328-09`"
          : "удерживать chain-of-title perimeter и Tier 1 licensing baseline",
    },
  ];

  const trackStates = tracks.map((track) => track.state);
  const overallState = resolveOverallState(trackStates);
  const blockedBy = tracks.filter((track) => track.state === "external_blocked").map((track) => track.id);
  const inProgress = tracks.filter((track) => track.state === "external_in_progress").map((track) => track.id);
  const repoComplete = tracks.filter((track) => track.state === "repo_side_complete" || track.state === "done").map((track) => track.id);

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    inputs: {
      a1Status: rel(A1_STATUS_JSON),
      a2SecurityEvidence: rel(A2_SECURITY_EVIDENCE_JSON),
      a3EvalSummary: rel(A3_EVAL_SUMMARY_JSON),
      a4PilotHandoffStatus: rel(A4_HANDOFF_STATUS_JSON),
      a5Status: rel(A5_STATUS_JSON),
    },
    summary: {
      overallState,
      blockedBy,
      inProgress,
      repoComplete,
      tracksTotal: tracks.length,
      a1CurrentState: a1State,
      a5CurrentState: a5State,
    },
    tracks,
    issues,
  };

  writeJson(REPORT_JSON, report);

  const md = [
    "# Phase A Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- overall_state: \`${report.summary.overallState}\``,
    `- blocked_by: \`${report.summary.blockedBy.join(", ") || "none"}\``,
    `- in_progress_tracks: \`${report.summary.inProgress.join(", ") || "none"}\``,
    `- repo_complete_tracks: \`${report.summary.repoComplete.join(", ") || "none"}\``,
    `- tracks_total: \`${report.summary.tracksTotal}\``,
    "",
    "## Tracks",
    "",
    "| Track | Label | State | Evidence | Next action |",
    "|---|---|---|---|---|",
    renderTrackRows(tracks),
    "",
    "## Decision",
    "",
    overallState === "external_blocked"
      ? "- `Phase A` repo-side в основном собрана, но фаза всё ещё удерживается внешними evidence по `A1`, `A2`, `A4` и/или `A5`."
      : overallState === "external_in_progress"
        ? "- `Phase A` уже двигается по реальным внешним evidence, но ещё не доведена до closure."
        : overallState === "repo_side_complete"
          ? "- `Phase A` repo-side закрыта и дальше упирается только в финальные внешние acceptance-path."
          : "- `Phase A` всё ещё не собрана даже на repo-side и требует внутренних execution-слоёв.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(issues),
    "",
  ].join("\n");

  writeText(REPORT_MD, md);

  console.log("[phase-a-status] summary");
  console.log(`- overall_state=${overallState}`);
  console.log(`- blocked_by=${blockedBy.join(",") || "none"}`);
  console.log(`- in_progress_tracks=${inProgress.join(",") || "none"}`);
  console.log(`- repo_complete_tracks=${repoComplete.join(",") || "none"}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && issues.length > 0) {
    process.exit(1);
  }
}

main();
