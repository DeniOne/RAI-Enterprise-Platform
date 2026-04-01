#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-ops-drill.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-ops-drill.md");

const DR_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-dr-status.json");
const PILOT_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-pilot-status.json");
const ONCALL_DRILL_JSON = path.join(OUTPUT_DIR, "phase-a4-advisory-oncall-drill-2026-03-31.json");
const DR_REHEARSAL_JSON = path.join(OUTPUT_DIR, "phase-a4-advisory-dr-rehearsal-2026-03-31.json");
const SUPPORT_BOUNDARY_DOC = path.join(ROOT, "docs", "07_EXECUTION", "ONE_BIG_PHASE", "PHASE_A4_SUPPORT_BOUNDARY_PACKET.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveOwnerChain() {
  return {
    incident_owner: process.env.PHASE_D_INCIDENT_OWNER || "techlead",
    rollback_owner: process.env.PHASE_D_ROLLBACK_OWNER || "techlead",
    support_owner: process.env.PHASE_D_SUPPORT_OWNER || "ops",
    communication_owner: process.env.PHASE_D_COMMUNICATION_OWNER || "product-governance",
  };
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  const issues = [];
  const evidenceRefs = [
    rel(DR_STATUS_JSON),
    rel(PILOT_STATUS_JSON),
    rel(ONCALL_DRILL_JSON),
    rel(DR_REHEARSAL_JSON),
    rel(SUPPORT_BOUNDARY_DOC),
  ];

  for (const filePath of [DR_STATUS_JSON, ONCALL_DRILL_JSON, DR_REHEARSAL_JSON, SUPPORT_BOUNDARY_DOC]) {
    if (!fs.existsSync(filePath)) {
      issues.push({ type: "missing_evidence", file: rel(filePath) });
    }
  }

  let drStatus = null;
  let pilotStatus = null;
  let oncallDrill = null;
  let drRehearsal = null;

  for (const [filePath, setter] of [
    [DR_STATUS_JSON, (value) => { drStatus = value; }],
    [PILOT_STATUS_JSON, (value) => { pilotStatus = value; }],
    [ONCALL_DRILL_JSON, (value) => { oncallDrill = value; }],
    [DR_REHEARSAL_JSON, (value) => { drRehearsal = value; }],
  ]) {
    if (!fs.existsSync(filePath)) continue;
    try {
      setter(readJson(filePath));
    } catch {
      issues.push({ type: "invalid_json", file: rel(filePath) });
    }
  }

  const ownerChain = resolveOwnerChain();
  for (const [key, value] of Object.entries(ownerChain)) {
    if (!value || !String(value).trim()) {
      issues.push({ type: "missing_owner", file: key });
    }
  }

  const supportBoundaryPresent = fs.existsSync(SUPPORT_BOUNDARY_DOC);
  const drReady = drStatus?.verdict === "restore_ready";
  const oncallPass = oncallDrill?.status === "PASS";
  const drRehearsalPass = drRehearsal?.status === "PASS";
  const pilotAccepted = Number(pilotStatus?.counts?.accepted || 0);

  if (drStatus && !drReady) {
    issues.push({ type: "dr_status_not_ready", file: rel(DR_STATUS_JSON), value: drStatus.verdict });
  }
  if (oncallDrill && !oncallPass) {
    issues.push({ type: "oncall_drill_not_passed", file: rel(ONCALL_DRILL_JSON), value: oncallDrill.status });
  }
  if (drRehearsal && !drRehearsalPass) {
    issues.push({ type: "dr_rehearsal_not_passed", file: rel(DR_REHEARSAL_JSON), value: drRehearsal.status });
  }

  const hasEvidence = !!drStatus || !!oncallDrill || !!drRehearsal || supportBoundaryPresent;
  const opsReady = issues.length === 0 && supportBoundaryPresent && drReady && oncallPass && drRehearsalPass;
  const status = opsReady ? "done" : hasEvidence ? "in_progress" : "open";
  const verdict = opsReady ? "ops_rehearsed" : "ops_blocked";
  const nextAction = opsReady
    ? "удерживать owner chain и incident discipline до pilot acceptance"
    : "закрыть gaps по owner chain/DR readiness и повторить ops drill";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "D3",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    checks: {
      supportBoundaryPresent,
      drReady,
      oncallPass,
      drRehearsalPass,
      ownerChain,
      pilotAccepted,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D Ops Drill",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Checks",
    "",
    `- support_boundary_present: \`${supportBoundaryPresent}\``,
    `- dr_ready: \`${drReady}\``,
    `- oncall_pass: \`${oncallPass}\``,
    `- dr_rehearsal_pass: \`${drRehearsalPass}\``,
    `- incident_owner: \`${ownerChain.incident_owner}\``,
    `- rollback_owner: \`${ownerChain.rollback_owner}\``,
    `- support_owner: \`${ownerChain.support_owner}\``,
    `- communication_owner: \`${ownerChain.communication_owner}\``,
    `- pilot_accepted: \`${pilotAccepted}\``,
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-d-ops-drill] summary");
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
