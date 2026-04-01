#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-dr-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-dr-status.md");
const RESTORE_DRILL_JSON = path.join(OUTPUT_DIR, "phase-d-restore-drill.json");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  const issues = [];
  const evidenceRefs = [rel(RESTORE_DRILL_JSON)];

  let restoreDrill = null;
  if (!fs.existsSync(RESTORE_DRILL_JSON)) {
    issues.push({ type: "missing_restore_drill_report", file: rel(RESTORE_DRILL_JSON) });
  } else {
    try {
      restoreDrill = readJson(RESTORE_DRILL_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(RESTORE_DRILL_JSON) });
    }
  }

  const restoreReady = restoreDrill?.verdict === "restore_rehearsed";
  if (restoreDrill && !restoreReady) {
    issues.push({ type: "restore_drill_not_ready", file: rel(RESTORE_DRILL_JSON), value: restoreDrill.verdict });
  }

  const status = restoreReady ? "done" : restoreDrill ? "in_progress" : "open";
  const verdict = restoreReady ? "restore_ready" : "restore_blocked";
  const nextAction = restoreReady
    ? "перейти к operational hardening (D3)"
    : "довести `phase:d:restore:drill` до `restore_rehearsed`";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "D2",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      restoreReady,
      sourceVerdict: restoreDrill?.verdict || "MISSING",
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D DR Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- restore_ready: \`${restoreReady}\``,
    `- source_verdict: \`${report.checks.sourceVerdict}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-d-dr-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !restoreReady) {
    process.exit(1);
  }
}

main();
