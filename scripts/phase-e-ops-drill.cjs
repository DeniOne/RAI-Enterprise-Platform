#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-e-ops-drill.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-e-ops-drill.md");

const D_INSTALL_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-install-status.json");
const D_DR_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-dr-status.json");
const D_OPS_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-ops-status.json");
const INPUT_JSON = path.join(OUTPUT_DIR, "phase-e-ops-input.json");

const REQUIRED_INPUT_KEYS = [
  "slo_baseline_ref",
  "alert_routing_ref",
  "incident_owner",
  "rollback_owner",
  "support_owner",
  "escalation_owner",
  "support_boundary_ref",
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveRefPath(input) {
  if (!input || typeof input !== "string") return "";
  return path.isAbsolute(input) ? input : path.resolve(ROOT, input);
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  const issues = [];
  const evidenceRefs = [
    rel(D_INSTALL_STATUS_JSON),
    rel(D_DR_STATUS_JSON),
    rel(D_OPS_STATUS_JSON),
    rel(INPUT_JSON),
  ];

  let dInstallStatus = null;
  let dDrStatus = null;
  let dOpsStatus = null;
  let opsInput = null;

  for (const [filePath, setter] of [
    [D_INSTALL_STATUS_JSON, (value) => {
      dInstallStatus = value;
    }],
    [D_DR_STATUS_JSON, (value) => {
      dDrStatus = value;
    }],
    [D_OPS_STATUS_JSON, (value) => {
      dOpsStatus = value;
    }],
  ]) {
    if (!fs.existsSync(filePath)) {
      issues.push({ type: "missing_phase_d_baseline_report", file: rel(filePath) });
      continue;
    }

    try {
      setter(readJson(filePath));
    } catch {
      issues.push({ type: "invalid_json", file: rel(filePath) });
    }
  }

  if (!fs.existsSync(INPUT_JSON)) {
    issues.push({ type: "missing_ops_input", file: rel(INPUT_JSON) });
  } else {
    try {
      opsInput = readJson(INPUT_JSON);
    } catch {
      issues.push({ type: "invalid_json", file: rel(INPUT_JSON) });
    }
  }

  const installReady = dInstallStatus?.verdict === "install_ready";
  const drReady = dDrStatus?.verdict === "restore_ready";
  const dOpsReady = dOpsStatus?.verdict === "ops_ready";

  if (dInstallStatus && !installReady) {
    issues.push({ type: "phase_d_install_not_ready", file: rel(D_INSTALL_STATUS_JSON), value: dInstallStatus.verdict || "UNKNOWN" });
  }
  if (dDrStatus && !drReady) {
    issues.push({ type: "phase_d_dr_not_ready", file: rel(D_DR_STATUS_JSON), value: dDrStatus.verdict || "UNKNOWN" });
  }
  if (dOpsStatus && !dOpsReady) {
    issues.push({ type: "phase_d_ops_not_ready", file: rel(D_OPS_STATUS_JSON), value: dOpsStatus.verdict || "UNKNOWN" });
  }

  const resolvedRefs = {
    slo_baseline_ref: "",
    alert_routing_ref: "",
    support_boundary_ref: "",
  };

  const owners = {
    incident_owner: "",
    rollback_owner: "",
    support_owner: "",
    escalation_owner: "",
  };

  if (opsInput) {
    for (const key of REQUIRED_INPUT_KEYS) {
      if (!opsInput[key] || String(opsInput[key]).trim() === "") {
        issues.push({ type: "missing_input_field", file: rel(INPUT_JSON), value: key });
      }
    }

    for (const key of ["incident_owner", "rollback_owner", "support_owner", "escalation_owner"]) {
      owners[key] = opsInput[key] || "";
      if (!owners[key] || String(owners[key]).trim().length === 0) {
        issues.push({ type: "missing_owner", file: rel(INPUT_JSON), value: key });
      }
    }

    for (const key of ["slo_baseline_ref", "alert_routing_ref", "support_boundary_ref"]) {
      if (!opsInput[key]) continue;
      const resolved = resolveRefPath(opsInput[key]);
      resolvedRefs[key] = resolved;
      if (!fs.existsSync(resolved)) {
        issues.push({ type: "missing_ref_file", file: rel(INPUT_JSON), value: `${key}:${opsInput[key]}` });
      } else {
        evidenceRefs.push(path.isAbsolute(resolved) ? resolved.replace(/\\/g, "/") : rel(resolved));
      }
    }
  }

  const opsRehearsed = issues.length === 0;
  const hasEvidence = Boolean(dInstallStatus) || Boolean(dDrStatus) || Boolean(dOpsStatus) || Boolean(opsInput);
  const status = opsRehearsed ? "done" : hasEvidence ? "in_progress" : "open";
  const verdict = opsRehearsed ? "ops_rehearsed_tier2" : "ops_blocked_tier2";
  const nextAction = opsRehearsed
    ? "перейти к статусному gate `phase:e:ops:status`"
    : "закрыть phase-d baseline gaps и заполнить phase-e-ops-input.json";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "E2",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      phase_d_install_verdict: dInstallStatus?.verdict || "MISSING",
      phase_d_dr_verdict: dDrStatus?.verdict || "MISSING",
      phase_d_ops_verdict: dOpsStatus?.verdict || "MISSING",
      installReady,
      drReady,
      dOpsReady,
      owners,
      refs: {
        slo_baseline_ref: opsInput?.slo_baseline_ref || "MISSING",
        alert_routing_ref: opsInput?.alert_routing_ref || "MISSING",
        support_boundary_ref: opsInput?.support_boundary_ref || "MISSING",
      },
      resolved_refs: resolvedRefs,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase E Ops Drill",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- phase_d_install_verdict: \`${report.checks.phase_d_install_verdict}\``,
    `- phase_d_dr_verdict: \`${report.checks.phase_d_dr_verdict}\``,
    `- phase_d_ops_verdict: \`${report.checks.phase_d_ops_verdict}\``,
    `- incident_owner: \`${owners.incident_owner || "MISSING"}\``,
    `- rollback_owner: \`${owners.rollback_owner || "MISSING"}\``,
    `- support_owner: \`${owners.support_owner || "MISSING"}\``,
    `- escalation_owner: \`${owners.escalation_owner || "MISSING"}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-e-ops-drill] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && !opsRehearsed) {
    process.exit(1);
  }
}

main();
