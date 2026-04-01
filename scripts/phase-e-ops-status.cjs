#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-e-ops-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-e-ops-status.md");
const OPS_DRILL_JSON = path.join(OUTPUT_DIR, "phase-e-ops-drill.json");

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
  const evidenceRefs = [rel(OPS_DRILL_JSON)];

  let opsDrill = null;
  if (!fs.existsSync(OPS_DRILL_JSON)) {
    issues.push({ type: "missing_ops_drill_report", file: rel(OPS_DRILL_JSON) });
  } else {
    try {
      opsDrill = readJson(OPS_DRILL_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(OPS_DRILL_JSON) });
    }
  }

  const opsReady = opsDrill?.verdict === "ops_rehearsed_tier2";
  if (opsDrill && !opsReady) {
    issues.push({ type: "ops_drill_not_ready", file: rel(OPS_DRILL_JSON), value: opsDrill.verdict || "UNKNOWN" });
  }

  const status = opsReady ? "done" : opsDrill ? "in_progress" : "open";
  const verdict = opsReady ? "ops_ready_tier2" : "ops_blocked_tier2";
  const nextAction = opsReady
    ? "перейти к legal/transborder closure (E3)"
    : "довести `phase:e:ops:drill` до `ops_rehearsed_tier2`";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "E2",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      opsReady,
      sourceVerdict: opsDrill?.verdict || "MISSING",
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase E Ops Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- ops_ready: \`${opsReady}\``,
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

  console.log("[phase-e-ops-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !opsReady) {
    process.exit(1);
  }
}

main();
