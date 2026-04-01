#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-install-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-install-status.md");
const DRY_RUN_REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-install-dry-run.json");
const UPGRADE_REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-upgrade-rehearsal.json");

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
  const evidenceRefs = [rel(DRY_RUN_REPORT_JSON), rel(UPGRADE_REPORT_JSON)];

  let dryRunReport = null;
  let upgradeReport = null;

  if (!fs.existsSync(DRY_RUN_REPORT_JSON)) {
    issues.push({ type: "missing_install_dry_run_report", file: rel(DRY_RUN_REPORT_JSON) });
  } else {
    try {
      dryRunReport = readJson(DRY_RUN_REPORT_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(DRY_RUN_REPORT_JSON) });
    }
  }

  if (!fs.existsSync(UPGRADE_REPORT_JSON)) {
    issues.push({ type: "missing_upgrade_rehearsal_report", file: rel(UPGRADE_REPORT_JSON) });
  } else {
    try {
      upgradeReport = readJson(UPGRADE_REPORT_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(UPGRADE_REPORT_JSON) });
    }
  }

  const dryRunReady = dryRunReport?.verdict === "install_rehearsed";
  const upgradeReady = upgradeReport?.verdict === "upgrade_rehearsed";

  if (dryRunReport && !dryRunReady) {
    issues.push({ type: "install_dry_run_not_ready", file: rel(DRY_RUN_REPORT_JSON), value: dryRunReport.verdict });
  }
  if (upgradeReport && !upgradeReady) {
    issues.push({ type: "upgrade_rehearsal_not_ready", file: rel(UPGRADE_REPORT_JSON), value: upgradeReport.verdict });
  }

  const hasEvidence = !!dryRunReport || !!upgradeReport;
  const installReady = issues.length === 0 && dryRunReady && upgradeReady;
  const status = installReady ? "done" : hasEvidence ? "in_progress" : "open";
  const verdict = installReady ? "install_ready" : "install_blocked";
  const nextAction = installReady
    ? "удерживать D1 evidence и перейти к D2 restore gate"
    : "довести `phase:d:install:dry-run` и `phase:d:upgrade:rehearsal` до `*_rehearsed`";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "D1",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      dryRunReady,
      upgradeReady,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D Install Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- dry_run_ready: \`${dryRunReady}\``,
    `- upgrade_ready: \`${upgradeReady}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-d-install-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !installReady) {
    process.exit(1);
  }
}

main();
