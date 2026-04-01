#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-status.md");

const INSTALL_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-install-status.json");
const DR_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-dr-status.json");
const OPS_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-ops-status.json");
const PILOT_STATUS_JSON = path.join(OUTPUT_DIR, "phase-d-pilot-status.json");
const SCOPE_INPUT_JSON = path.join(OUTPUT_DIR, "phase-d-scope-input.json");
const PHASE_D_BOARD_DOC = path.join(ROOT, "docs", "07_EXECUTION", "ONE_BIG_PHASE", "PHASE_D_EXECUTION_BOARD.md");

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
    rel(INSTALL_STATUS_JSON),
    rel(DR_STATUS_JSON),
    rel(OPS_STATUS_JSON),
    rel(PILOT_STATUS_JSON),
    rel(SCOPE_INPUT_JSON),
    rel(PHASE_D_BOARD_DOC),
  ];

  if (!fs.existsSync(PHASE_D_BOARD_DOC)) {
    issues.push({ type: "missing_phase_d_board", file: rel(PHASE_D_BOARD_DOC) });
  }

  const d1 = readTrackStatus(INSTALL_STATUS_JSON, "install_ready", issues);
  const d2 = readTrackStatus(DR_STATUS_JSON, "restore_ready", issues);
  const d3 = readTrackStatus(OPS_STATUS_JSON, "ops_ready", issues);
  const d4 = readTrackStatus(PILOT_STATUS_JSON, "pilot_ready", issues);

  if (d2.status === "done" && d1.status !== "done") {
    issues.push({ type: "ordering_violation", file: "D2->D1", value: `${d2.status}/${d1.status}` });
  }
  if (d3.status === "done" && d2.status !== "done") {
    issues.push({ type: "ordering_violation", file: "D3->D2", value: `${d3.status}/${d2.status}` });
  }
  if (d4.status === "done" && d3.status !== "done") {
    issues.push({ type: "ordering_violation", file: "D4->D3", value: `${d4.status}/${d3.status}` });
  }

  const scopeInputPath = process.env.PHASE_D_SCOPE_INPUT ? path.resolve(process.env.PHASE_D_SCOPE_INPUT) : SCOPE_INPUT_JSON;
  const scopeInput = parseScopeInput(scopeInputPath, issues);

  const targetModel = (process.env.PHASE_D_TARGET_MODEL || "self-host").toLowerCase();
  const envFeatureBreadth = ["1", "true", "yes"].includes((process.env.PHASE_D_FEATURE_BREADTH_REQUESTED || "").toLowerCase());
  const requestedModels = [
    targetModel,
    ...scopeInput.requested_models.map((value) => String(value).toLowerCase()),
  ];

  const scopeViolations = [];
  const pilotReady = d4.ready;

  if (!pilotReady) {
    if (requestedModels.some((value) => value.includes("saas") || value.includes("hybrid"))) {
      scopeViolations.push({
        type: "premature_target_model",
        message: "До pilot acceptance запрещено продвигать SaaS/Hybrid модель.",
      });
    }
    if (envFeatureBreadth || scopeInput.feature_breadth_requested) {
      scopeViolations.push({
        type: "premature_feature_breadth",
        message: "До pilot acceptance запрещено расширение feature-breadth.",
      });
    }
  }

  const tracks = {
    D1: d1.status,
    D2: d2.status,
    D3: d3.status,
    D4: d4.status,
    D5: "guard_active",
  };

  const allCoreDone = d1.ready && d2.ready && d3.ready && d4.ready;
  const status = allCoreDone && scopeViolations.length === 0 && issues.length === 0
    ? "done"
    : [d1.status, d2.status, d3.status, d4.status].some((value) => value === "in_progress" || value === "done")
      ? "in_progress"
      : "open";

  const verdict = status === "done" ? "phase_d_ready" : "phase_d_blocked";
  const nextAction = status === "done"
    ? "удерживать D5 guardrails и выпускать только controlled pilot решения"
    : !d1.ready
      ? "закрыть D1 installability (`phase:d:install:*`)"
      : !d2.ready
        ? "закрыть D2 restore/DR (`phase:d:restore:*`)"
        : !d3.ready
          ? "закрыть D3 operations (`phase:d:ops:*`)"
          : !d4.ready
            ? "закрыть D4 pilot acceptance (`phase:d:pilot:*`)"
            : "устранить scope/order violations и повторить gate";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "PHASE_D",
    status,
    issues,
    evidenceRefs,
    nextAction,
    verdict,
    scope_violations: scopeViolations,
    tracks,
    checks: {
      allCoreDone,
      target_model: targetModel,
      requested_models: requestedModels,
      feature_breadth_requested: envFeatureBreadth || scopeInput.feature_breadth_requested,
      scope_input_source: scopeInput.source,
      d1_verdict: d1.verdict,
      d2_verdict: d2.verdict,
      d3_verdict: d3.verdict,
      d4_verdict: d4.verdict,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Tracks",
    "",
    `- D1: \`${tracks.D1}\``,
    `- D2: \`${tracks.D2}\``,
    `- D3: \`${tracks.D3}\``,
    `- D4: \`${tracks.D4}\``,
    `- D5: \`${tracks.D5}\``,
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

  console.log("[phase-d-status] summary");
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
