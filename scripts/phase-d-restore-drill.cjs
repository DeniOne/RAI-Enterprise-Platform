#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-restore-drill.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-restore-drill.md");

const BACKUP_RESTORE_JSON = path.join(ROOT, "var", "ops", "phase-a4-backup-restore-execution-2026-03-31.json");
const DR_REHEARSAL_JSON = path.join(ROOT, "var", "ops", "phase-a4-advisory-dr-rehearsal-2026-03-31.json");
const ONCALL_DRILL_JSON = path.join(ROOT, "var", "ops", "phase-a4-advisory-oncall-drill-2026-03-31.json");
const STAGE_PROGRESSION_JSON = path.join(ROOT, "var", "ops", "phase-a3-stage-progression-2026-03-31.json");
const DR_RUNBOOK_DOC = path.join(ROOT, "docs", "05_OPERATIONS", "WORKFLOWS", "RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toMinutes(seconds) {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return null;
  return Number((seconds / 60).toFixed(4));
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  const issues = [];
  const evidenceRefs = [
    rel(BACKUP_RESTORE_JSON),
    rel(DR_REHEARSAL_JSON),
    rel(ONCALL_DRILL_JSON),
    rel(STAGE_PROGRESSION_JSON),
    rel(DR_RUNBOOK_DOC),
  ];

  for (const filePath of [BACKUP_RESTORE_JSON, DR_REHEARSAL_JSON, ONCALL_DRILL_JSON, STAGE_PROGRESSION_JSON, DR_RUNBOOK_DOC]) {
    if (!fs.existsSync(filePath)) {
      issues.push({ type: "missing_evidence", file: rel(filePath) });
    }
  }

  let backupRestore = null;
  let drRehearsal = null;
  let oncallDrill = null;
  let stageProgression = null;

  for (const [filePath, setter] of [
    [BACKUP_RESTORE_JSON, (value) => { backupRestore = value; }],
    [DR_REHEARSAL_JSON, (value) => { drRehearsal = value; }],
    [ONCALL_DRILL_JSON, (value) => { oncallDrill = value; }],
    [STAGE_PROGRESSION_JSON, (value) => { stageProgression = value; }],
  ]) {
    if (!fs.existsSync(filePath)) continue;
    try {
      setter(readJson(filePath));
    } catch {
      issues.push({ type: "invalid_json", file: rel(filePath) });
    }
  }

  const backupReady = backupRestore?.verdict?.recoveryPathExecutable === true
    && backupRestore?.verdict?.dataLossObserved === false;
  const drRehearsalPass = drRehearsal?.status === "PASS";
  const oncallDrillPass = oncallDrill?.status === "PASS";
  const stageProgressionPass = stageProgression?.status === "PASS";

  if (backupRestore && !backupReady) {
    issues.push({ type: "backup_restore_not_ready", file: rel(BACKUP_RESTORE_JSON) });
  }
  if (drRehearsal && !drRehearsalPass) {
    issues.push({ type: "dr_rehearsal_not_passed", file: rel(DR_REHEARSAL_JSON), value: drRehearsal.status });
  }
  if (oncallDrill && !oncallDrillPass) {
    issues.push({ type: "oncall_drill_not_passed", file: rel(ONCALL_DRILL_JSON), value: oncallDrill.status });
  }
  if (stageProgression && !stageProgressionPass) {
    issues.push({ type: "stage_progression_not_passed", file: rel(STAGE_PROGRESSION_JSON), value: stageProgression.status });
  }

  const rpoMinutes = toMinutes(drRehearsal?.metrics?.simulatedRpoSec);
  const rtoMinutes = toMinutes(drRehearsal?.metrics?.fullRecoveryRtoSec);

  if (rpoMinutes === null) {
    issues.push({ type: "missing_rpo_metric", file: rel(DR_REHEARSAL_JSON) });
  }
  if (rtoMinutes === null) {
    issues.push({ type: "missing_rto_metric", file: rel(DR_REHEARSAL_JSON) });
  }

  const hasEvidence = !!backupRestore || !!drRehearsal || !!oncallDrill;
  const restoreReady = issues.length === 0 && backupReady && drRehearsalPass && oncallDrillPass && stageProgressionPass;
  const status = restoreReady ? "done" : hasEvidence ? "in_progress" : "open";
  const verdict = restoreReady ? "restore_rehearsed" : "restore_blocked";
  const nextAction = restoreReady
    ? "удерживать DR evidence актуальным в каждом release-цикле"
    : "закрыть backup/restore gaps и перепройти drill до PASS по всем проверкам";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "D2",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      backupReady,
      drRehearsalPass,
      oncallDrillPass,
      stageProgressionPass,
      rpo_minutes: rpoMinutes,
      rto_minutes: rtoMinutes,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D Restore Drill",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- backup_ready: \`${backupReady}\``,
    `- dr_rehearsal_pass: \`${drRehearsalPass}\``,
    `- oncall_drill_pass: \`${oncallDrillPass}\``,
    `- stage_progression_pass: \`${stageProgressionPass}\``,
    `- rpo_minutes: \`${rpoMinutes}\``,
    `- rto_minutes: \`${rtoMinutes}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-d-restore-drill] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- rpo_minutes=${rpoMinutes}`);
  console.log(`- rto_minutes=${rtoMinutes}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !restoreReady) {
    process.exit(1);
  }
}

main();
