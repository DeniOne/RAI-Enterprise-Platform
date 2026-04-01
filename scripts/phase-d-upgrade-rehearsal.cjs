#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-upgrade-rehearsal.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-upgrade-rehearsal.md");
const DEFAULT_INPUT_JSON = path.join(OUTPUT_DIR, "phase-d-upgrade-rehearsal-input.json");
const UPGRADE_PACKET_DOC = path.join(ROOT, "docs", "07_EXECUTION", "ONE_BIG_PHASE", "PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const inputArg = getArg("input");
  const inputPath = inputArg ? path.resolve(inputArg) : DEFAULT_INPUT_JSON;

  const issues = [];
  const evidenceRefs = [rel(UPGRADE_PACKET_DOC), rel(inputPath)];

  if (!fs.existsSync(UPGRADE_PACKET_DOC)) {
    issues.push({ type: "missing_upgrade_packet", file: rel(UPGRADE_PACKET_DOC) });
  }

  let inputReport = null;
  if (fs.existsSync(inputPath)) {
    try {
      inputReport = readJson(inputPath);
    } catch {
      issues.push({ type: "invalid_json", file: rel(inputPath) });
    }
  } else {
    issues.push({ type: "missing_upgrade_execution_report", file: rel(inputPath) });
  }

  const stepsPass = !!inputReport
    && Array.isArray(inputReport.steps)
    && inputReport.steps.length > 0
    && inputReport.steps.every((step) => step.status === "PASS");
  const reportVerdict = inputReport?.verdict || "UNKNOWN";

  if (inputReport && !stepsPass) {
    issues.push({ type: "upgrade_steps_not_passed", file: rel(inputPath), value: reportVerdict });
  }

  const upgradeReady =
    issues.length === 0
    && stepsPass
    && ["PASS", "UPGRADE_REHEARSAL_PASS", "upgrade_rehearsed"].includes(String(reportVerdict));

  const status = upgradeReady ? "done" : fs.existsSync(UPGRADE_PACKET_DOC) ? "in_progress" : "open";
  const verdict = upgradeReady ? "upgrade_rehearsed" : "upgrade_blocked";
  const nextAction = upgradeReady
    ? "удерживать upgrade evidence синхронизированным с install packet"
    : `подготовить execution-report по upgrade rehearsal в \`${rel(inputPath)}\``;

  const report = {
    generatedAt: new Date().toISOString(),
    track: "D1",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      upgradePacketPresent: fs.existsSync(UPGRADE_PACKET_DOC),
      inputReportPresent: fs.existsSync(inputPath),
      stepsPass,
      reportVerdict,
      inputPath: rel(inputPath),
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D Upgrade Rehearsal",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- upgrade_packet_present: \`${report.checks.upgradePacketPresent}\``,
    `- input_report_present: \`${report.checks.inputReportPresent}\``,
    `- steps_pass: \`${stepsPass}\``,
    `- report_verdict: \`${reportVerdict}\``,
    `- input_path: \`${report.checks.inputPath}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-d-upgrade-rehearsal] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !upgradeReady) {
    process.exit(1);
  }
}

main();
