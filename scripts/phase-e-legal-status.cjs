#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-e-legal-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-e-legal-status.md");

const LEGAL_STATUS_JSON = path.join(ROOT, "var", "compliance", "external-legal-evidence-status.json");
const LEGAL_VERDICT_JSON = path.join(ROOT, "var", "compliance", "external-legal-evidence-verdict.json");
const TRANSBORDER_MATRIX_DOC = path.join(ROOT, "docs", "05_OPERATIONS", "HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md");

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
  const evidenceRefs = [rel(LEGAL_STATUS_JSON), rel(LEGAL_VERDICT_JSON), rel(TRANSBORDER_MATRIX_DOC)];

  let legalStatus = null;
  let legalVerdict = null;

  for (const [filePath, setter] of [
    [LEGAL_STATUS_JSON, (value) => {
      legalStatus = value;
    }],
    [LEGAL_VERDICT_JSON, (value) => {
      legalVerdict = value;
    }],
  ]) {
    if (!fs.existsSync(filePath)) {
      issues.push({ type: "missing_report", file: rel(filePath) });
      continue;
    }

    try {
      setter(readJson(filePath));
    } catch {
      issues.push({ type: "invalid_json", file: rel(filePath) });
    }
  }

  if (!fs.existsSync(TRANSBORDER_MATRIX_DOC)) {
    issues.push({ type: "missing_transborder_matrix", file: rel(TRANSBORDER_MATRIX_DOC) });
  }

  const currentVerdict = legalVerdict?.currentVerdict || "";
  const legalVerdictReady = currentVerdict && currentVerdict !== "NO-GO";
  if (!legalVerdictReady) {
    issues.push({ type: "legal_verdict_not_ready", file: rel(LEGAL_VERDICT_JSON), value: currentVerdict || "MISSING" });
  }

  const elp05 = Array.isArray(legalStatus?.items)
    ? legalStatus.items.find((item) => item.referenceId === "ELP-20260328-05")
    : null;
  const elp05Accepted = elp05?.status === "accepted";

  if (!elp05) {
    issues.push({ type: "missing_elp_05_reference", file: rel(LEGAL_STATUS_JSON), value: "ELP-20260328-05" });
  } else if (!elp05Accepted) {
    issues.push({ type: "elp_05_not_accepted", file: rel(LEGAL_STATUS_JSON), value: elp05.status || "<empty>" });
  }

  const overdueCount = Number(legalStatus?.counts?.overdue || 0);
  if (overdueCount > 0) {
    issues.push({ type: "overdue_legal_reviews", file: rel(LEGAL_STATUS_JSON), value: String(overdueCount) });
  }

  if (Array.isArray(legalStatus?.issues) && legalStatus.issues.length > 0) {
    issues.push({ type: "legal_status_has_issues", file: rel(LEGAL_STATUS_JSON), value: String(legalStatus.issues.length) });
  }

  if (Array.isArray(legalVerdict?.issues) && legalVerdict.issues.length > 0) {
    issues.push({ type: "legal_verdict_has_issues", file: rel(LEGAL_VERDICT_JSON), value: String(legalVerdict.issues.length) });
  }

  const legalReady = issues.length === 0;
  const hasEvidence = Boolean(legalStatus) || Boolean(legalVerdict);
  const status = legalReady ? "done" : hasEvidence ? "in_progress" : "open";
  const verdict = legalReady ? "legal_ready_tier2" : "legal_blocked_tier2";
  const nextAction = legalReady
    ? "удерживать legal/transborder closure и перейти к managed pilot wave"
    : "довести legal verdict выше NO-GO и перевести ELP-20260328-05 в accepted";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "E3",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      currentVerdict: currentVerdict || "MISSING",
      overdueCount,
      elp_20260328_05_status: elp05?.status || "MISSING",
      legalStatusIssues: Array.isArray(legalStatus?.issues) ? legalStatus.issues.length : "MISSING",
      legalVerdictIssues: Array.isArray(legalVerdict?.issues) ? legalVerdict.issues.length : "MISSING",
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase E Legal Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- current_verdict: \`${report.checks.currentVerdict}\``,
    `- elp_20260328_05_status: \`${report.checks.elp_20260328_05_status}\``,
    `- overdue_count: \`${report.checks.overdueCount}\``,
    `- legal_status_issues: \`${report.checks.legalStatusIssues}\``,
    `- legal_verdict_issues: \`${report.checks.legalVerdictIssues}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-e-legal-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !legalReady) {
    process.exit(1);
  }
}

main();
