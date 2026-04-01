#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-e-governance-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-e-governance-status.md");
const SECURITY_STATUS_JSON = path.join(ROOT, "var", "security", "security-evidence-status.json");
const INPUT_JSON = path.join(OUTPUT_DIR, "phase-e-governance-input.json");

const REQUIRED_INPUT_KEYS = [
  "branch_protection_evidence_ref",
  "release_approval_chain_ref",
  "exception_register_ref",
  "reviewed_at",
  "owner",
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function resolveRefPath(input) {
  if (!input || typeof input !== "string") return "";
  return path.isAbsolute(input) ? input : path.resolve(ROOT, input);
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  const issues = [];
  const evidenceRefs = [rel(SECURITY_STATUS_JSON), rel(INPUT_JSON)];

  let securityStatus = null;
  let governanceInput = null;

  if (!fs.existsSync(SECURITY_STATUS_JSON)) {
    issues.push({ type: "missing_security_status_report", file: rel(SECURITY_STATUS_JSON) });
  } else {
    try {
      securityStatus = readJson(SECURITY_STATUS_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(SECURITY_STATUS_JSON) });
    }
  }

  if (!fs.existsSync(INPUT_JSON)) {
    issues.push({ type: "missing_governance_input", file: rel(INPUT_JSON) });
  } else {
    try {
      governanceInput = readJson(INPUT_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(INPUT_JSON) });
    }
  }

  const a2s03 = Array.isArray(securityStatus?.rows)
    ? securityStatus.rows.find((row) => row.referenceId === "A2-S-03")
    : null;

  if (!a2s03) {
    issues.push({ type: "missing_security_reference", file: rel(SECURITY_STATUS_JSON), value: "A2-S-03" });
  } else if (a2s03.status !== "accepted") {
    issues.push({ type: "a2_s_03_not_accepted", file: rel(SECURITY_STATUS_JSON), value: a2s03.status || "<empty>" });
  }

  if (Array.isArray(securityStatus?.issues) && securityStatus.issues.length > 0) {
    issues.push({
      type: "security_status_has_issues",
      file: rel(SECURITY_STATUS_JSON),
      value: String(securityStatus.issues.length),
    });
  }

  const resolvedRefs = {
    branch_protection_evidence_ref: "",
    release_approval_chain_ref: "",
    exception_register_ref: "",
  };

  if (governanceInput) {
    for (const key of REQUIRED_INPUT_KEYS) {
      if (!governanceInput[key] || String(governanceInput[key]).trim() === "") {
        issues.push({ type: "missing_input_field", file: rel(INPUT_JSON), value: key });
      }
    }

    if (governanceInput.reviewed_at && !isValidDate(governanceInput.reviewed_at)) {
      issues.push({ type: "invalid_reviewed_at", file: rel(INPUT_JSON), value: governanceInput.reviewed_at });
    }

    if (governanceInput.owner && String(governanceInput.owner).trim().length === 0) {
      issues.push({ type: "invalid_owner", file: rel(INPUT_JSON), value: "<empty>" });
    }

    for (const key of [
      "branch_protection_evidence_ref",
      "release_approval_chain_ref",
      "exception_register_ref",
    ]) {
      if (!governanceInput[key]) continue;
      const resolved = resolveRefPath(governanceInput[key]);
      resolvedRefs[key] = resolved;
      if (!fs.existsSync(resolved)) {
        issues.push({ type: "missing_evidence_ref_file", file: rel(INPUT_JSON), value: `${key}:${governanceInput[key]}` });
      } else {
        evidenceRefs.push(path.isAbsolute(resolved) ? resolved.replace(/\\/g, "/") : rel(resolved));
      }
    }
  }

  const governanceReady = issues.length === 0;
  const hasEvidence = Boolean(securityStatus) || Boolean(governanceInput);
  const status = governanceReady ? "done" : hasEvidence ? "in_progress" : "open";
  const verdict = governanceReady ? "governance_ready_tier2" : "governance_blocked_tier2";
  const nextAction = governanceReady
    ? "удерживать governance evidence и перейти к managed ops contour"
    : "довести A2-S-03 до accepted и заполнить phase-e-governance-input.json обязательными refs";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "E1",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      a2_s_03_status: a2s03?.status || "MISSING",
      security_overdue: Number(securityStatus?.counts?.overdue || 0),
      reviewed_at: governanceInput?.reviewed_at || "MISSING",
      owner: governanceInput?.owner || "MISSING",
      branch_protection_evidence_ref: governanceInput?.branch_protection_evidence_ref || "MISSING",
      release_approval_chain_ref: governanceInput?.release_approval_chain_ref || "MISSING",
      exception_register_ref: governanceInput?.exception_register_ref || "MISSING",
      resolved_refs: resolvedRefs,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase E Governance Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- a2_s_03_status: \`${report.checks.a2_s_03_status}\``,
    `- security_overdue: \`${report.checks.security_overdue}\``,
    `- reviewed_at: \`${report.checks.reviewed_at}\``,
    `- owner: \`${report.checks.owner}\``,
    `- branch_protection_evidence_ref: \`${report.checks.branch_protection_evidence_ref}\``,
    `- release_approval_chain_ref: \`${report.checks.release_approval_chain_ref}\``,
    `- exception_register_ref: \`${report.checks.exception_register_ref}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-e-governance-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !governanceReady) {
    process.exit(1);
  }
}

main();
