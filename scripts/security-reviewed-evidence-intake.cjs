#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUT_JSON = process.env.SECURITY_REVIEWED_EVIDENCE_INPUT
  ? path.resolve(process.env.SECURITY_REVIEWED_EVIDENCE_INPUT)
  : path.join(ROOT, "var", "security", "security-reviewed-evidence-input.json");

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
    console.error(`[security-reviewed-evidence-intake] ${message}`);
    process.exit(1);
  }
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

function normalizeDate(value, fallback) {
  if (!value) return fallback;
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value), "дата должна быть в формате YYYY-MM-DD");
  return value;
}

function normalizeNumber(value, field) {
  if (!value) return null;
  assert(/^\d+$/.test(value), `${field} должен быть целым числом`);
  return Number(value);
}

function deriveRunUrl(owner, repo, runId) {
  return runId ? `https://github.com/${owner}/${repo}/actions/runs/${runId}` : null;
}

function derivePrUrl(owner, repo, prNumber) {
  return prNumber ? `https://github.com/${owner}/${repo}/pull/${prNumber}` : null;
}

function printUsage() {
  console.log(
    "usage: node scripts/security-reviewed-evidence-intake.cjs [--reviewer-refs=@techlead,@backend-lead] [--pr-number=123] [--dependency-run-id=456] [--dependency-reviewer-refs=@techlead] [--provenance-reviewer-refs=@backend-lead] [--reviewed-at=2026-04-01] [--dry-run]",
  );
}

function main() {
  if (hasFlag("help")) {
    printUsage();
    process.exit(0);
  }

  assert(fs.existsSync(INPUT_JSON), `не найден input file: ${INPUT_JSON}`);
  const dryRun = hasFlag("dry-run");
  const payload = readJson(INPUT_JSON);
  const repository = payload.repository || {};
  const reviewScope = payload.reviewScope || {};
  const controls = payload.controls || {};
  const dependencyReview = controls.dependencyReview || {};
  const provenance = controls.provenance || {};

  const owner = repository.owner;
  const repo = repository.name;
  assert(owner && repo, "в input должны быть repository.owner и repository.name");

  const reviewScopeReviewerRefs = splitCsv(getArg("reviewer-refs"));
  const dependencyReviewerRefs = splitCsv(getArg("dependency-reviewer-refs"));
  const provenanceReviewerRefs = splitCsv(getArg("provenance-reviewer-refs"));
  const prNumber = normalizeNumber(getArg("pr-number"), "pr-number");
  const dependencyRunId = normalizeNumber(getArg("dependency-run-id"), "dependency-run-id");
  const reviewedAt = normalizeDate(getArg("reviewed-at"), reviewScope.reviewedAt || new Date().toISOString().slice(0, 10));
  const mergeCommitSha = getArg("merge-commit-sha") || dependencyReview.mergeCommitSha || null;
  const notesAppend = getArg("notes-append");

  if (
    reviewScopeReviewerRefs.length === 0 &&
    dependencyReviewerRefs.length === 0 &&
    provenanceReviewerRefs.length === 0 &&
    !prNumber &&
    !dependencyRunId &&
    !getArg("merge-commit-sha") &&
    !notesAppend &&
    !getArg("reviewed-at")
  ) {
    printUsage();
    process.exit(1);
  }

  payload.reviewScope = {
    ...reviewScope,
    reviewedAt,
    reviewerRefs: reviewScopeReviewerRefs.length > 0
      ? unique([...(reviewScope.reviewerRefs || []), ...reviewScopeReviewerRefs])
      : reviewScope.reviewerRefs || [],
    notes: notesAppend
      ? [reviewScope.notes, notesAppend].filter(Boolean).join(" ")
      : reviewScope.notes,
  };

  payload.controls = {
    ...controls,
    dependencyReview: {
      ...dependencyReview,
      prNumber: prNumber ?? dependencyReview.prNumber ?? null,
      prUrl: prNumber ? derivePrUrl(owner, repo, prNumber) : dependencyReview.prUrl ?? null,
      runId: dependencyRunId ?? dependencyReview.runId ?? null,
      runUrl: dependencyRunId ? deriveRunUrl(owner, repo, dependencyRunId) : dependencyReview.runUrl ?? null,
      mergeCommitSha,
      reviewerRefs: dependencyReviewerRefs.length > 0
        ? unique([...(dependencyReview.reviewerRefs || []), ...dependencyReviewerRefs])
        : dependencyReview.reviewerRefs || [],
    },
    provenance: {
      ...provenance,
      reviewerRefs: provenanceReviewerRefs.length > 0
        ? unique([...(provenance.reviewerRefs || []), ...provenanceReviewerRefs])
        : provenance.reviewerRefs || [],
    },
  };

  const output = `${JSON.stringify(payload, null, 2)}\n`;

  console.log(`[security-reviewed-evidence-intake] input=${INPUT_JSON.replace(/\\/g, "/")}`);
  console.log(`[security-reviewed-evidence-intake] reviewed_at=${payload.reviewScope.reviewedAt}`);
  console.log(`[security-reviewed-evidence-intake] review_scope_reviewer_refs=${payload.reviewScope.reviewerRefs.length}`);
  console.log(`[security-reviewed-evidence-intake] dependency_pr_number=${payload.controls.dependencyReview.prNumber ?? "<unchanged>"}`);
  console.log(`[security-reviewed-evidence-intake] dependency_run_id=${payload.controls.dependencyReview.runId ?? "<unchanged>"}`);
  console.log(`[security-reviewed-evidence-intake] dependency_reviewer_refs=${payload.controls.dependencyReview.reviewerRefs.length}`);
  console.log(`[security-reviewed-evidence-intake] provenance_reviewer_refs=${payload.controls.provenance.reviewerRefs.length}`);
  console.log(`[security-reviewed-evidence-intake] dry_run=${dryRun ? "yes" : "no"}`);

  if (!dryRun) {
    fs.writeFileSync(INPUT_JSON, output);
  }

  console.log("[security-reviewed-evidence-intake] next_action=rerun pnpm security:reviewed-evidence:status and pnpm gate:security:reviewed-evidence");
}

main();
