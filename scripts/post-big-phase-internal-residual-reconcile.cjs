#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { run: runReviewedEvidenceReconcile } = require("./security-reviewed-evidence-reconcile.cjs");
const { run: runPostBigPhaseStatus } = require("./post-big-phase-internal-residual-status.cjs");
const { run: runReviewedEvidencePacket } = require("./security-reviewed-evidence-packet.cjs");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const REPORT_JSON = path.join(OUTPUT_DIR, "post-big-phase-internal-residual-reconcile.json");
const REPORT_MD = path.join(OUTPUT_DIR, "post-big-phase-internal-residual-reconcile.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function hasFlag(argv, name) {
  return argv.includes(`--${name}`);
}

function getArg(argv, name) {
  const prefix = `--${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function renderIssuesMarkdown(issues) {
  if (!issues.length) {
    return "- issues: none";
  }
  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function printUsage() {
  console.log(
    "usage: node scripts/post-big-phase-internal-residual-reconcile.cjs (--prepare | --pr-number=123) [--reviewer-refs=@techlead,@backend-lead] [--dependency-reviewer-refs=@techlead] [--provenance-reviewer-refs=@backend-lead] [--reviewed-at=2026-04-01] [--dry-run] [--mode=enforce]",
  );
}

function buildActionBundle(report, handoffPacket) {
  const prPlaceholder = "<PR_NUMBER>";
  const reconcileCommand = `pnpm security:post-big-phase:reconcile -- --pr-number=${prPlaceholder}`;
  const gateCommand = `pnpm gate:security:post-big-phase:reconcile -- --pr-number=${prPlaceholder}`;
  const reviewedReconcileCommand = `pnpm security:reviewed-evidence:reconcile -- --pr-number=${prPlaceholder}`;
  const reviewedGateCommand = `pnpm gate:security:reviewed-evidence:reconcile -- --pr-number=${prPlaceholder}`;
  const isDone = report.status === "done";

  return {
    prepareCommand: "pnpm security:post-big-phase:prepare",
    reconcileCommandTemplate: reconcileCommand,
    gateCommandTemplate: gateCommand,
    reviewedReconcileCommandTemplate: reviewedReconcileCommand,
    reviewedGateCommandTemplate: reviewedGateCommand,
    prNumberPlaceholder: prPlaceholder,
    handoffPacketPath: handoffPacket ? handoffPacket.packetPath : null,
    handoffDraftPath: handoffPacket ? handoffPacket.draftPath : null,
    requestedReviewers: isDone ? [] : handoffPacket ? handoffPacket.requestedReviewers : [],
    missingItems: isDone ? [] : handoffPacket ? handoffPacket.missingItems : [],
    operatorChecklist: isDone
      ? [
          "Удерживать current reviewed-evidence baseline без регрессий.",
          "При каждом следующем security-critical merge обновлять PR/run refs через intake.",
          `Повторно прогонять ${gateCommand} после новых security-critical merge.`,
        ]
      : [
          "Открыть первый security-relevant PR.",
          `Подставить номер PR в ${reconcileCommand}.`,
          `Прогнать ${gateCommand}.`,
          "Проверить, что verdict residual-пакета перешёл в done.",
        ],
    nextAction: report.nextAction,
  };
}

function run(options = {}) {
  const argv = options.argv || process.argv.slice(2);
  if (hasFlag(argv, "help")) {
    printUsage();
    return { help: true };
  }

  const mode = getArg(argv, "mode") || "warn";
  const dryRun = hasFlag(argv, "dry-run");
  const prepareOnly = hasFlag(argv, "prepare");
  const prNumber = getArg(argv, "pr-number");
  const issues = [];
  const evidenceRefs = [];
  const steps = [];

  let reviewedReport = null;
  let handoffPacket = null;
  let statusReport = null;
  let statusError = null;

  if (prepareOnly) {
    try {
      handoffPacket = runReviewedEvidencePacket();
      evidenceRefs.push("var/security/security-reviewed-evidence-packet.json");
      steps.push({
        step: "r3_packet",
        status: handoffPacket.status,
        verdict: handoffPacket.verdict,
      });
    } catch (error) {
      issues.push({ type: "r3_packet_failed", value: error.message || "unknown_error" });
      steps.push({
        step: "r3_packet",
        status: "failed",
        verdict: "reviewed_evidence_packet_failed",
      });
    }
    issues.push({ type: "waiting_for_pr_cycle", value: "security-reviewed-evidence reconcile требует реальный PR-backed dependency review cycle" });
    steps.push({
      step: "r3_reconcile",
      status: "waiting_for_pr",
      verdict: "reviewed_evidence_reconcile_waiting_for_dependency_review",
    });
    evidenceRefs.push(
      "var/security/security-reviewed-evidence-input.json",
      "var/security/security-reviewed-evidence-status.json",
      "var/security/security-reviewed-evidence-packet.json",
    );
  } else {
    if (!/^\d+$/.test(prNumber)) {
      const error = new Error("нужен --prepare или --pr-number=<целое число>");
      error.exitCode = 1;
      throw error;
    }

    try {
      reviewedReport = runReviewedEvidenceReconcile({
        argv: [...argv.filter((arg) => arg !== "--mode=enforce"), "--gate"],
      });
      steps.push({
        step: "r3_reconcile",
        status: reviewedReport.status,
        verdict: reviewedReport.verdict,
      });
      evidenceRefs.push(
        "var/security/security-reviewed-evidence-reconcile.json",
        "var/security/security-reviewed-evidence-status.json",
      );
    } catch (error) {
      reviewedReport = error.report || null;
      issues.push({ type: "r3_reconcile_failed", value: error.message || "unknown_error" });
      steps.push({
        step: "r3_reconcile",
        status: reviewedReport ? reviewedReport.status : "failed",
        verdict: reviewedReport ? reviewedReport.verdict : "reviewed_evidence_reconcile_failed",
      });
      evidenceRefs.push("var/security/security-reviewed-evidence-reconcile.json");
    }
  }

  try {
    statusReport = runPostBigPhaseStatus({
      argv: mode === "enforce" ? ["--mode=enforce"] : [],
    });
    steps.push({
      step: "post_big_phase_status",
      status: statusReport.status,
      verdict: statusReport.verdict,
    });
    evidenceRefs.push("var/security/post-big-phase-internal-residual-status.json");
  } catch (error) {
    statusError = error;
    statusReport = error.report || null;
    issues.push({ type: "post_big_phase_status_failed", value: error.message || "unknown_error" });
    steps.push({
      step: "post_big_phase_status",
      status: statusReport ? statusReport.status : "failed",
      verdict: statusReport ? statusReport.verdict : "post_big_phase_internal_residual_open",
    });
    evidenceRefs.push("var/security/post-big-phase-internal-residual-status.json");
  }

  const done = Boolean(
    !prepareOnly &&
    reviewedReport &&
    reviewedReport.status === "done" &&
    statusReport &&
    statusReport.status === "done",
  );
  const report = {
    generatedAt: new Date().toISOString(),
    track: "POST_BIG_PHASE_INTERNAL_RESIDUAL",
    status: done ? "done" : prepareOnly ? "prepared" : issues.length > 0 ? "in_progress" : "prepared",
    issues,
    evidenceRefs: Array.from(new Set(evidenceRefs)),
    nextAction: done
      ? "удерживать `R3` и общий residual baseline без регрессий"
      : prepareOnly
        ? "использовать подготовленный R3 handoff packet, открыть первый security-relevant PR и затем запустить `pnpm security:post-big-phase:reconcile -- --pr-number=<PR_NUMBER>`"
      : statusReport && statusReport.nextAction
        ? statusReport.nextAction
        : "дождаться real PR-backed reviewed CI cycle и повторить reconcile",
    verdict: done
      ? "post_big_phase_internal_residual_reconcile_complete"
      : prepareOnly
        ? "post_big_phase_internal_residual_reconcile_waiting_for_pr"
      : dryRun
        ? "post_big_phase_internal_residual_reconcile_dry_run"
        : "post_big_phase_internal_residual_reconcile_pending",
    dryRun,
    prepareOnly,
    steps,
    reviewedEvidence: reviewedReport
      ? {
          status: reviewedReport.status,
          verdict: reviewedReport.verdict,
          nextAction: reviewedReport.nextAction,
        }
      : null,
    handoffPacket: handoffPacket
      ? {
          status: handoffPacket.status,
          verdict: handoffPacket.verdict,
          nextAction: handoffPacket.nextAction,
          handoffWritable: handoffPacket.handoffWritable,
          handoffReuseMode: handoffPacket.handoffReuseMode,
          requestedReviewers: handoffPacket.requestedReviewers,
          missingItems: handoffPacket.missingItems,
          packetPath: handoffPacket.packetPath,
          draftPath: handoffPacket.draftPath,
        }
      : null,
    packetStatus: statusReport
      ? {
          status: statusReport.status,
          verdict: statusReport.verdict,
          nextAction: statusReport.nextAction,
          tracks: statusReport.tracks,
        }
      : null,
  };
  report.actionBundle = buildActionBundle(report, report.handoffPacket);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Post Big Phase Internal Residual Reconcile",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- dry_run: \`${report.dryRun}\``,
    "",
    "## Steps",
    "",
    ...report.steps.map((step) => `- step=\`${step.step}\` status=\`${step.status}\` verdict=\`${step.verdict}\``),
    "",
    "## Handoff Packet",
    "",
    report.handoffPacket
      ? `- status: \`${report.handoffPacket.status}\`\n- verdict: \`${report.handoffPacket.verdict}\`\n- handoff_writable: \`${report.handoffPacket.handoffWritable}\`\n- handoff_reuse_mode: \`${report.handoffPacket.handoffReuseMode}\`\n- packet_path: \`${report.handoffPacket.packetPath}\`\n- draft_path: \`${report.handoffPacket.draftPath}\`\n- requested_reviewers: ${report.handoffPacket.requestedReviewers.map((item) => `\`${item}\``).join(", ")}`
      : "- handoff packet: unavailable",
    "",
    "## Action Bundle",
    "",
    `- prepare_command: \`${report.actionBundle.prepareCommand}\``,
    `- reconcile_command_template: \`${report.actionBundle.reconcileCommandTemplate}\``,
    `- gate_command_template: \`${report.actionBundle.gateCommandTemplate}\``,
    `- reviewed_reconcile_command_template: \`${report.actionBundle.reviewedReconcileCommandTemplate}\``,
    `- reviewed_gate_command_template: \`${report.actionBundle.reviewedGateCommandTemplate}\``,
    `- pr_number_placeholder: \`${report.actionBundle.prNumberPlaceholder}\``,
    "",
    "## Operator Checklist",
    "",
    ...report.actionBundle.operatorChecklist.map((item) => `- ${item}`),
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
    "## Next Action",
    "",
    `- ${report.nextAction}`,
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, `${md}\n`);

  console.log("[post-big-phase-internal-residual-reconcile] summary");
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if ((mode === "enforce" && !done) || (statusError && !prepareOnly)) {
    const error = new Error("post-big-phase residual reconcile is not done");
    error.exitCode = 1;
    error.report = report;
    throw error;
  }

  return report;
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(`[post-big-phase-internal-residual-reconcile] ${error.message}`);
    process.exit(error.exitCode || 1);
  }
}

module.exports = { run };
