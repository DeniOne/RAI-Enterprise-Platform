#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-install-dry-run.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-install-dry-run.md");

const INSTALL_REPORT_JSON = path.join(ROOT, "var", "ops", "phase-a4-install-dry-run-2026-03-31.json");
const BLANK_BOOTSTRAP_JSON = path.join(ROOT, "var", "ops", "phase-a4-blank-worktree-bootstrap-2026-03-31.json");
const INSTALL_REPORT_DOC = path.join(ROOT, "docs", "07_EXECUTION", "ONE_BIG_PHASE", "PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md");
const BLANK_BOOTSTRAP_DOC = path.join(ROOT, "docs", "07_EXECUTION", "ONE_BIG_PHASE", "PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md");
const INSTALL_PACKET_DOC = path.join(ROOT, "docs", "07_EXECUTION", "ONE_BIG_PHASE", "PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md");

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
  const evidenceRefs = [
    rel(INSTALL_REPORT_JSON),
    rel(BLANK_BOOTSTRAP_JSON),
    rel(INSTALL_REPORT_DOC),
    rel(BLANK_BOOTSTRAP_DOC),
    rel(INSTALL_PACKET_DOC),
  ];

  for (const filePath of [INSTALL_REPORT_JSON, BLANK_BOOTSTRAP_JSON, INSTALL_REPORT_DOC, BLANK_BOOTSTRAP_DOC, INSTALL_PACKET_DOC]) {
    if (!fs.existsSync(filePath)) {
      issues.push({ type: "missing_evidence", file: rel(filePath) });
    }
  }

  let installReport = null;
  let blankBootstrap = null;

  if (fs.existsSync(INSTALL_REPORT_JSON)) {
    try {
      installReport = readJson(INSTALL_REPORT_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(INSTALL_REPORT_JSON) });
    }
  }

  if (fs.existsSync(BLANK_BOOTSTRAP_JSON)) {
    try {
      blankBootstrap = readJson(BLANK_BOOTSTRAP_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(BLANK_BOOTSTRAP_JSON) });
    }
  }

  const installStepsPass = !!installReport && Array.isArray(installReport.steps)
    && installReport.steps.every((step) => ["PASS", "SKIPPED_EXISTING_ENV"].includes(step.result));
  const installReproducible = installReport?.verdict?.reproducible || "UNKNOWN";

  const blankCommandsPass = !!blankBootstrap && Array.isArray(blankBootstrap.commands)
    && blankBootstrap.commands.length > 0
    && blankBootstrap.commands.every((command) => command.status === "PASS");
  const blankEnvClean = !!blankBootstrap
    && blankBootstrap.rootEnvPresent === false
    && blankBootstrap.webEnvLocalPresent === false;

  if (installReport && !installStepsPass) {
    issues.push({ type: "install_steps_not_passed", file: rel(INSTALL_REPORT_JSON), value: installReproducible });
  }
  if (blankBootstrap && !blankCommandsPass) {
    issues.push({ type: "blank_bootstrap_commands_not_passed", file: rel(BLANK_BOOTSTRAP_JSON) });
  }
  if (blankBootstrap && !blankEnvClean) {
    issues.push({ type: "blank_bootstrap_env_not_clean", file: rel(BLANK_BOOTSTRAP_JSON) });
  }

  const hasEvidence = fs.existsSync(INSTALL_REPORT_JSON) || fs.existsSync(BLANK_BOOTSTRAP_JSON);
  const installReady =
    issues.length === 0
    && installStepsPass
    && blankCommandsPass
    && blankEnvClean
    && ["PASS", "PARTIAL_PASS"].includes(installReproducible);

  const status = installReady ? "done" : hasEvidence ? "in_progress" : "open";
  const verdict = installReady ? "install_rehearsed" : "install_blocked";
  const nextAction = installReady
    ? "зафиксировать upgrade rehearsal evidence и перевести D-2.2.2 в done"
    : "устранить пробелы в install/blank-bootstrap evidence и повторить dry-run";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "D1",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      installStepsPass,
      installReproducible,
      blankCommandsPass,
      blankEnvClean,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D Install Dry Run",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- install_steps_pass: \`${installStepsPass}\``,
    `- install_reproducible: \`${installReproducible}\``,
    `- blank_commands_pass: \`${blankCommandsPass}\``,
    `- blank_env_clean: \`${blankEnvClean}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-d-install-dry-run] summary");
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
