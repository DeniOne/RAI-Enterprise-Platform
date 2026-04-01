#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SECURITY_DIR = path.join(ROOT, "var", "security");
const LOOKUP_JSON = path.join(SECURITY_DIR, "security-reviewed-evidence-pr-lookup.json");
const STATUS_JSON = path.join(SECURITY_DIR, "security-reviewed-evidence-status.json");
const INPUT_JSON = path.join(SECURITY_DIR, "security-reviewed-evidence-input.json");
const OUTPUT_JSON = path.join(SECURITY_DIR, "security-reviewed-evidence-reconcile.json");
const OUTPUT_MD = path.join(SECURITY_DIR, "security-reviewed-evidence-reconcile.md");

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[security-reviewed-evidence-reconcile] ${message}`);
    process.exit(1);
  }
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function runNodeScript(scriptName, args) {
  return execFileSync("node", [path.join(ROOT, "scripts", scriptName), ...args], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function printUsage() {
  console.log(
    "usage: node scripts/security-reviewed-evidence-reconcile.cjs --pr-number=123 [--reviewer-refs=@techlead,@backend-lead] [--dependency-reviewer-refs=@techlead] [--provenance-reviewer-refs=@backend-lead] [--reviewed-at=2026-04-01] [--gate] [--dry-run] [--mode=enforce]",
  );
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

function run(options = {}) {
  const argv = options.argv || process.argv.slice(2);
  const getArgLocal = (name) => {
    const prefix = `--${name}=`;
    const found = argv.find((arg) => arg.startsWith(prefix));
    return found ? found.slice(prefix.length) : "";
  };
  const hasFlagLocal = (name) => argv.includes(`--${name}`);

  if (hasFlagLocal("help")) {
    printUsage();
    return { help: true };
  }

  const prNumberRaw = getArgLocal("pr-number");
  if (!/^\d+$/.test(prNumberRaw)) {
    const error = new Error("нужен --pr-number=<целое число>");
    error.exitCode = 1;
    throw error;
  }

  const prNumber = Number(prNumberRaw);
  const dryRun = hasFlagLocal("dry-run");
  const gateRequested = hasFlagLocal("gate");
  const mode = getArgLocal("mode") || "warn";

  const explicitReviewerRefs = splitCsv(getArgLocal("reviewer-refs"));
  const explicitDependencyRefs = splitCsv(getArgLocal("dependency-reviewer-refs"));
  const explicitProvenanceRefs = splitCsv(getArgLocal("provenance-reviewer-refs"));
  const reviewedAt = getArgLocal("reviewed-at");

  const issues = [];
  const evidenceRefs = [rel(INPUT_JSON)];
  const steps = [];

  let lookupReport = null;
  let statusReport = null;
  let intakeArgs = [];
  let gateStatus = gateRequested ? "pending" : "not_requested";
  let reconcileStatus = "in_progress";
  let verdict = "reviewed_evidence_reconcile_pending";
  let nextAction = "дождаться lookup/status цикла";

  try {
    runNodeScript("security-reviewed-evidence-pr-lookup.cjs", [`--pr-number=${prNumber}`]);
    lookupReport = readJson(LOOKUP_JSON);
    evidenceRefs.push(rel(LOOKUP_JSON));
    steps.push({
      step: "pr_lookup",
      status: lookupReport.status,
      verdict: lookupReport.verdict,
    });

    const lookupReviewerRefs = unique(
      (((lookupReport.githubReviews || {}).reviewerRefs) || []).filter(Boolean),
    );

    const reviewScopeRefs = unique(
      explicitReviewerRefs.length > 0 ? explicitReviewerRefs : lookupReviewerRefs,
    );
    const dependencyRefs = unique(
      explicitDependencyRefs.length > 0 ? explicitDependencyRefs : reviewScopeRefs,
    );
    const provenanceRefs = unique(
      explicitProvenanceRefs.length > 0 ? explicitProvenanceRefs : reviewScopeRefs,
    );

    if (!lookupReport.dependencyReviewRun) {
      issues.push({ type: "dependency_review_run_not_found", value: String(prNumber) });
    }
    if (!lookupReport.pr || !lookupReport.pr.mergeCommitSha) {
      issues.push({ type: "merge_commit_sha_missing", value: String(prNumber) });
    }
    if (reviewScopeRefs.length === 0) {
      issues.push({ type: "reviewer_refs_missing", value: String(prNumber) });
    }

    const canApplyIntake =
      Boolean(lookupReport.dependencyReviewRun) &&
      Boolean(lookupReport.pr && lookupReport.pr.mergeCommitSha) &&
      reviewScopeRefs.length > 0;

    if (canApplyIntake) {
      intakeArgs = [
        `--pr-number=${lookupReport.pr.number}`,
        `--dependency-run-id=${lookupReport.dependencyReviewRun.id}`,
        `--merge-commit-sha=${lookupReport.pr.mergeCommitSha}`,
        `--reviewer-refs=${reviewScopeRefs.join(",")}`,
        `--dependency-reviewer-refs=${dependencyRefs.join(",")}`,
        `--provenance-reviewer-refs=${provenanceRefs.join(",")}`,
      ];
      if (reviewedAt) {
        intakeArgs.push(`--reviewed-at=${reviewedAt}`);
      }
      if (dryRun) {
        intakeArgs.push("--dry-run");
      }

      runNodeScript("security-reviewed-evidence-intake.cjs", intakeArgs);
      steps.push({
        step: "intake",
        status: dryRun ? "dry_run" : "applied",
        reviewerRefs: reviewScopeRefs,
      });
    } else {
      steps.push({
        step: "intake",
        status: "blocked",
        reviewerRefs: reviewScopeRefs,
      });
    }

    runNodeScript("security-reviewed-evidence-status.cjs", []);
    statusReport = readJson(STATUS_JSON);
    evidenceRefs.push(rel(STATUS_JSON));
    steps.push({
      step: "status",
      status: statusReport.status,
      verdict: statusReport.verdict,
    });

    if (gateRequested) {
      try {
        runNodeScript("security-reviewed-evidence-status.cjs", ["--mode=enforce"]);
        gateStatus = "green";
      } catch (error) {
        gateStatus = "red";
        issues.push({
          type: "gate_failed",
          value: error.status ? `exit_${error.status}` : "unknown",
        });
      }
    }

    if (statusReport.status === "done" && statusReport.verdict === "reviewed_ci_evidence_loop_ready") {
      reconcileStatus = "done";
      verdict = "reviewed_evidence_reconcile_complete";
      nextAction = gateRequested && gateStatus !== "green"
        ? "разобрать причину падения enforce-gate"
        : "повторить pnpm gate:security:post-big-phase для пакетного verdict";
    } else if (lookupReport.dependencyReviewRun && dryRun) {
      reconcileStatus = "prepared";
      verdict = "reviewed_evidence_reconcile_dry_run_ready";
      nextAction = "запустить reconcile без --dry-run для записи input и повторного status/gate";
    } else if (!lookupReport.dependencyReviewRun) {
      reconcileStatus = "blocked";
      verdict = "reviewed_evidence_reconcile_waiting_for_dependency_review";
      nextAction = "дождаться завершения Dependency Review workflow для PR и повторить reconcile";
    } else {
      reconcileStatus = "in_progress";
      verdict = "reviewed_evidence_reconcile_partial";
      nextAction = statusReport.nextAction || "проверить status report и добить отсутствующие refs";
    }
  } catch (error) {
    issues.push({
      type: "reconcile_execution_failed",
      value: error.message || "unknown_error",
    });
    reconcileStatus = "failed";
    verdict = "reviewed_evidence_reconcile_failed";
    nextAction = "проверить lookup/status automation и повторить reconcile";
  }

  const report = {
    generatedAt: new Date().toISOString(),
    track: "R3",
    status: reconcileStatus,
    issues,
    evidenceRefs: unique(evidenceRefs),
    nextAction,
    verdict,
    prNumber,
    dryRun,
    gateRequested,
    gateStatus,
    intakeArgs,
    steps,
    lookup: lookupReport
      ? {
          status: lookupReport.status,
          verdict: lookupReport.verdict,
          pr: lookupReport.pr,
          dependencyReviewRun: lookupReport.dependencyReviewRun,
        }
      : null,
    statusReport: statusReport
      ? {
          status: statusReport.status,
          verdict: statusReport.verdict,
          nextAction: statusReport.nextAction,
          issues: statusReport.issues,
        }
      : null,
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Security Reviewed Evidence Reconcile",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- pr_number: \`${report.prNumber}\``,
    `- dry_run: \`${report.dryRun}\``,
    `- gate_requested: \`${report.gateRequested}\``,
    `- gate_status: \`${report.gateStatus}\``,
    "",
    "## Steps",
    "",
    ...report.steps.map((step) => `- step=\`${step.step}\` status=\`${step.status}\`${step.verdict ? ` verdict=\`${step.verdict}\`` : ""}`),
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

  fs.writeFileSync(OUTPUT_MD, `${md}\n`);

  console.log("[security-reviewed-evidence-reconcile] summary");
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- report_json=${rel(OUTPUT_JSON)}`);
  console.log(`- report_md=${rel(OUTPUT_MD)}`);

  if (mode === "enforce" && report.status !== "done") {
    const error = new Error("reconcile status is not done");
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
    console.error(`[security-reviewed-evidence-reconcile] ${error.message}`);
    process.exit(error.exitCode || 1);
  }
}

module.exports = { run };
