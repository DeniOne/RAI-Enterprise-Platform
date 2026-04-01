#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-e-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-e-status.md");

const GOVERNANCE_STATUS_JSON = path.join(OUTPUT_DIR, "phase-e-governance-status.json");
const OPS_STATUS_JSON = path.join(OUTPUT_DIR, "phase-e-ops-status.json");
const LEGAL_STATUS_JSON = path.join(OUTPUT_DIR, "phase-e-legal-status.json");
const PILOT_STATUS_JSON = path.join(OUTPUT_DIR, "phase-e-pilot-status.json");
const PHASE_D_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-status.json");
const SCOPE_INPUT_JSON = path.join(OUTPUT_DIR, "phase-e-scope-input.json");
const PHASE_E_BOARD_DOC = path.join(ROOT, "docs", "07_EXECUTION", "ONE_BIG_PHASE", "PHASE_E_EXECUTION_BOARD.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readTrackStatus(filePath, requiredVerdict, issues) {
  if (!fs.existsSync(filePath)) {
    issues.push({ type: "missing_track_report", file: rel(filePath) });
    return { status: "open", verdict: "MISSING", ready: false };
  }

  try {
    const report = readJson(filePath);
    const ready = report.verdict === requiredVerdict;
    if (!ready) {
      issues.push({ type: "track_not_ready", file: rel(filePath), value: report.verdict || "UNKNOWN" });
    }
    return {
      status: report.status || "open",
      verdict: report.verdict || "UNKNOWN",
      ready,
      report,
    };
  } catch {
    issues.push({ type: "invalid_json", file: rel(filePath) });
    return { status: "open", verdict: "INVALID_JSON", ready: false };
  }
}

function parseScopeInput(filePath, issues) {
  if (!fs.existsSync(filePath)) {
    return { requested_models: [], feature_breadth_requested: false, source: "default" };
  }

  try {
    const payload = readJson(filePath);
    return {
      requested_models: Array.isArray(payload.requested_models) ? payload.requested_models : [],
      feature_breadth_requested: Boolean(payload.feature_breadth_requested),
      source: rel(filePath),
    };
  } catch {
    issues.push({ type: "invalid_scope_input_json", file: rel(filePath) });
    return { requested_models: [], feature_breadth_requested: false, source: rel(filePath) };
  }
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  const issues = [];
  const evidenceRefs = [
    rel(GOVERNANCE_STATUS_JSON),
    rel(OPS_STATUS_JSON),
    rel(LEGAL_STATUS_JSON),
    rel(PILOT_STATUS_JSON),
    rel(PHASE_D_STATUS_JSON),
    rel(SCOPE_INPUT_JSON),
    rel(PHASE_E_BOARD_DOC),
  ];

  if (!fs.existsSync(PHASE_E_BOARD_DOC)) {
    issues.push({ type: "missing_phase_e_board", file: rel(PHASE_E_BOARD_DOC) });
  }

  const e1 = readTrackStatus(GOVERNANCE_STATUS_JSON, "governance_ready_tier2", issues);
  const e2 = readTrackStatus(OPS_STATUS_JSON, "ops_ready_tier2", issues);
  const e3 = readTrackStatus(LEGAL_STATUS_JSON, "legal_ready_tier2", issues);
  const e4 = readTrackStatus(PILOT_STATUS_JSON, "pilot_ready_tier2", issues);

  let phaseDReady = false;
  if (!fs.existsSync(PHASE_D_STATUS_JSON)) {
    issues.push({ type: "missing_phase_d_status", file: rel(PHASE_D_STATUS_JSON) });
  } else {
    try {
      const phaseDStatus = readJson(PHASE_D_STATUS_JSON);
      phaseDReady = phaseDStatus.verdict === "phase_d_ready";
      if (!phaseDReady) {
        issues.push({ type: "phase_d_not_ready", file: rel(PHASE_D_STATUS_JSON), value: phaseDStatus.verdict || "UNKNOWN" });
      }
    } catch {
      issues.push({ type: "invalid_json", file: rel(PHASE_D_STATUS_JSON) });
    }
  }

  if (e2.status === "done" && e1.status !== "done") {
    issues.push({ type: "ordering_violation", file: "E2->E1", value: `${e2.status}/${e1.status}` });
  }
  if (e3.status === "done" && e2.status !== "done") {
    issues.push({ type: "ordering_violation", file: "E3->E2", value: `${e3.status}/${e2.status}` });
  }
  if (e4.status === "done" && e3.status !== "done") {
    issues.push({ type: "ordering_violation", file: "E4->E3", value: `${e4.status}/${e3.status}` });
  }

  const scopeInputPath = process.env.PHASE_E_SCOPE_INPUT ? path.resolve(process.env.PHASE_E_SCOPE_INPUT) : SCOPE_INPUT_JSON;
  const scopeInput = parseScopeInput(scopeInputPath, issues);

  const targetModel = (process.env.PHASE_E_TARGET_MODEL || "managed").toLowerCase();
  const envFeatureBreadth = ["1", "true", "yes"].includes((process.env.PHASE_E_FEATURE_BREADTH_REQUESTED || "").toLowerCase());
  const requestedModels = [
    targetModel,
    ...scopeInput.requested_models.map((value) => String(value).toLowerCase()),
  ];

  const scopeViolations = [];
  const pilotReady = e4.ready;

  if (!pilotReady) {
    if (requestedModels.some((value) => value.includes("saas") || value.includes("hybrid"))) {
      scopeViolations.push({
        type: "premature_target_model",
        message: "До managed pilot acceptance запрещено продвигать SaaS/Hybrid модель.",
      });
    }
    if (envFeatureBreadth || scopeInput.feature_breadth_requested) {
      scopeViolations.push({
        type: "premature_feature_breadth",
        message: "До managed pilot acceptance запрещено расширение feature-breadth.",
      });
    }
  }

  const tracks = {
    E1: e1.status,
    E2: e2.status,
    E3: e3.status,
    E4: e4.status,
    E5: "guard_active",
  };

  const allCoreDone = phaseDReady && e1.ready && e2.ready && e3.ready && e4.ready;
  const status = allCoreDone && scopeViolations.length === 0 && issues.length === 0
    ? "done"
    : [e1.status, e2.status, e3.status, e4.status].some((value) => value === "in_progress" || value === "done")
      ? "in_progress"
      : "open";

  const verdict = status === "done" ? "phase_e_ready_tier2" : "phase_e_blocked_tier2";
  const nextAction = status === "done"
    ? "удерживать E5 guardrails и выпускать только controlled managed решения"
    : !phaseDReady
      ? "восстановить baseline `phase_d_ready` перед движением в Phase E"
      : !e1.ready
        ? "закрыть E1 governance evidence (`phase:e:governance:status`)"
        : !e2.ready
          ? "закрыть E2 managed ops contour (`phase:e:ops:*`)"
          : !e3.ready
            ? "закрыть E3 legal/transborder closure (`phase:e:legal:status`)"
            : !e4.ready
              ? "закрыть E4 managed pilot acceptance (`phase:e:pilot:*`)"
              : "устранить scope/order violations и повторить gate";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "PHASE_E",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    scope_violations: scopeViolations,
    tracks,
    checks: {
      phase_d_ready: phaseDReady,
      allCoreDone,
      target_model: targetModel,
      requested_models: requestedModels,
      feature_breadth_requested: envFeatureBreadth || scopeInput.feature_breadth_requested,
      scope_input_source: scopeInput.source,
      e1_verdict: e1.verdict,
      e2_verdict: e2.verdict,
      e3_verdict: e3.verdict,
      e4_verdict: e4.verdict,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase E Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Tracks",
    "",
    `- E1: \`${tracks.E1}\``,
    `- E2: \`${tracks.E2}\``,
    `- E3: \`${tracks.E3}\``,
    `- E4: \`${tracks.E4}\``,
    `- E5: \`${tracks.E5}\``,
    "",
    "## Scope violations",
    "",
    scopeViolations.length === 0
      ? "- scope_violations: none"
      : scopeViolations.map((item) => `- \`${item.type}\` ${item.message}`).join("\n"),
    "",
    "## Issues",
    "",
    issues.length === 0
      ? "- issues: none"
      : issues.map((issue) => `- \`${issue.type}\` file=\`${issue.file}\`${issue.value ? ` value=\`${issue.value}\`` : ""}`).join("\n"),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-e-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- scope_violations=${scopeViolations.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && (status !== "done" || issues.length > 0 || scopeViolations.length > 0)) {
    process.exit(1);
  }
}

main();
