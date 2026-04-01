#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const REPORT_JSON = path.join(OUTPUT_DIR, "post-big-phase-internal-residual-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "post-big-phase-internal-residual-status.md");
const WORKPACK_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "POST_BIG_PHASE_INTERNAL_RESIDUAL_APPSEC_HYGIENE_WORKPACK_2026-04-01.md",
);
const AUDIT_JSON = path.join(OUTPUT_DIR, "security-audit-summary.json");
const HYGIENE_JSON = path.join(OUTPUT_DIR, "workspace-secret-hygiene-inventory.json");
const REVIEWED_JSON = path.join(OUTPUT_DIR, "security-reviewed-evidence-status.json");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readTrack(filePath, label, issues) {
  if (!fs.existsSync(filePath)) {
    issues.push({ type: "missing_track_report", track: label, file: rel(filePath) });
    return null;
  }
  try {
    return readJson(filePath);
  } catch {
    issues.push({ type: "invalid_track_report", track: label, file: rel(filePath) });
    return null;
  }
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.track) parts.push(`track=\`${issue.track}\``);
      if (issue.file) parts.push(`file=\`${issue.file}\``);
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function run(options = {}) {
  const argv = options.argv || process.argv.slice(2);
  const modeArg = argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  if (!fs.existsSync(WORKPACK_DOC)) {
    issues.push({ type: "missing_workpack_doc", file: rel(WORKPACK_DOC) });
  }

  const audit = readTrack(AUDIT_JSON, "R1", issues);
  const hygiene = readTrack(HYGIENE_JSON, "R2", issues);
  const reviewed = readTrack(REVIEWED_JSON, "R3", issues);

  const r1Done = Boolean(audit && audit.counts && audit.counts.high === 0 && audit.counts.critical === 0);
  const r2Done = Boolean(
    hygiene &&
    hygiene.status === "done" &&
    ["workspace_secret_hygiene_clear", "workspace_local_warning_only"].includes(hygiene.verdict),
  );
  const r3Done = Boolean(
    reviewed &&
    reviewed.status === "done" &&
    reviewed.verdict === "reviewed_ci_evidence_loop_ready",
  );

  if (audit && !r1Done) {
    issues.push({ type: "r1_not_ready", track: "R1", value: `high=${audit.counts.high},critical=${audit.counts.critical}` });
  }
  if (hygiene && !r2Done) {
    issues.push({ type: "r2_not_ready", track: "R2", value: `${hygiene.status}/${hygiene.verdict}` });
  }
  if (reviewed && !r3Done) {
    issues.push({ type: "r3_not_ready", track: "R3", value: `${reviewed.status}/${reviewed.verdict}` });
  }

  const tracks = {
    R0: "guard_active",
    R1: r1Done ? "done" : audit ? audit.status || "in_progress" : "open",
    R2: r2Done ? "done" : hygiene ? hygiene.status || "in_progress" : "open",
    R3: r3Done ? "done" : reviewed ? reviewed.status || "in_progress" : "open",
  };

  const allDone = r1Done && r2Done && r3Done;
  const status = allDone
    ? "done"
    : [tracks.R1, tracks.R2, tracks.R3].some((value) => value === "done" || value === "in_progress")
      ? "in_progress"
      : "open";
  const verdict = allDone ? "post_big_phase_internal_residual_closed" : "post_big_phase_internal_residual_open";
  const nextAction = allDone
    ? "удерживать baseline `R1/R2/R3` и не допускать регрессий residual AppSec hygiene"
    : !r1Done
      ? "повторить remediation dependency advisory tail до `high=0` и `critical=0`"
      : !r2Done
        ? "снять local secret blocker до warning-only residue"
        : "собрать первый PR-backed reviewed CI evidence cycle и довести `R3` до green";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "POST_BIG_PHASE_INTERNAL_RESIDUAL",
    status,
    issues,
    evidenceRefs: [
      rel(WORKPACK_DOC),
      rel(AUDIT_JSON),
      rel(HYGIENE_JSON),
      rel(REVIEWED_JSON),
    ],
    nextAction,
    verdict,
    tracks,
    checks: {
      r1_high: audit && audit.counts ? audit.counts.high : null,
      r1_critical: audit && audit.counts ? audit.counts.critical : null,
      r2_status: hygiene ? hygiene.status : null,
      r2_verdict: hygiene ? hygiene.verdict : null,
      r3_status: reviewed ? reviewed.status : null,
      r3_verdict: reviewed ? reviewed.verdict : null,
      allDone,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Post Big Phase Internal Residual Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- next_action: ${report.nextAction}`,
    "",
    "## Tracks",
    "",
    `- R0: \`${report.tracks.R0}\``,
    `- R1: \`${report.tracks.R1}\``,
    `- R2: \`${report.tracks.R2}\``,
    `- R3: \`${report.tracks.R3}\``,
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, `${md}\n`);

  console.log("[post-big-phase-internal-residual-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && (status !== "done" || issues.length > 0)) {
    const error = new Error("post-big-phase residual is not done");
    error.exitCode = 1;
    error.report = report;
    throw error;
  }

  return report;
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(`[post-big-phase-internal-residual-status] ${error.message}`);
    process.exit(error.exitCode || 1);
  }
}

module.exports = { run };
