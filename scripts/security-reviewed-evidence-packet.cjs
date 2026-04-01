#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const INPUT_JSON = path.join(OUTPUT_DIR, "security-reviewed-evidence-input.json");
const STATUS_JSON = path.join(OUTPUT_DIR, "security-reviewed-evidence-status.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "security-reviewed-evidence-packet.json");
const REPORT_MD = path.join(OUTPUT_DIR, "security-reviewed-evidence-packet.md");
const DEFAULT_HANDOFF_ROOT = path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "security", "2026-04-01", "reviewed-ci-loop");
const HANDOFF_ROOT = process.env.SECURITY_REVIEWED_EVIDENCE_HANDOFF_ROOT
  ? path.resolve(process.env.SECURITY_REVIEWED_EVIDENCE_HANDOFF_ROOT)
  : DEFAULT_HANDOFF_ROOT;
const REQUEST_PACKET_MD = path.join(HANDOFF_ROOT, "REQUEST_PACKET.md");
const REVIEW_DRAFT_MD = path.join(HANDOFF_ROOT, "REVIEW_DRAFT.md");
const INDEX_MD = path.join(HANDOFF_ROOT, "INDEX.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ownerList() {
  return ["@techlead", "@backend-lead"];
}

function writeTextWithReadonlyFallback(filePath, content, issues) {
  try {
    fs.writeFileSync(filePath, `${content}\n`);
    return { path: filePath, reusedReadonlyArtifact: false };
  } catch (error) {
    if ((error.code === "EROFS" || error.code === "EACCES") && fs.existsSync(filePath)) {
      issues.push({
        type: "restricted_handoff_reused_readonly",
        value: filePath,
      });
      return { path: filePath, reusedReadonlyArtifact: true };
    }
    throw error;
  }
}

function run() {
  if (!fs.existsSync(INPUT_JSON)) {
    const error = new Error(`missing ${rel(INPUT_JSON)}`);
    error.exitCode = 1;
    throw error;
  }
  if (!fs.existsSync(STATUS_JSON)) {
    const error = new Error(`missing ${rel(STATUS_JSON)}; run pnpm security:reviewed-evidence:status first`);
    error.exitCode = 1;
    throw error;
  }

  const input = readJson(INPUT_JSON);
  const status = readJson(STATUS_JSON);
  const reviewScope = input.reviewScope || {};
  const controls = input.controls || {};
  const missingItems = [];
  const writeIssues = [];

  if (ensureArray(reviewScope.reviewerRefs).length === 0) {
    missingItems.push("Добавить reviewer refs в reviewScope.reviewerRefs");
  }
  if (!controls.dependencyReview || (!controls.dependencyReview.prNumber && !controls.dependencyReview.runId)) {
    missingItems.push("Зафиксировать dependencyReview prNumber и/или runId");
  }
  if (controls.provenance && ensureArray(controls.provenance.reviewerRefs).length === 0) {
    missingItems.push("Привязать provenance reviewer refs");
  }
  if (controls.dependencyReview && ensureArray(controls.dependencyReview.reviewerRefs).length === 0) {
    missingItems.push("Привязать dependencyReview reviewer refs");
  }

  fs.mkdirSync(HANDOFF_ROOT, { recursive: true });

  const requestPacket = [
    "# R3 Reviewed CI Evidence Request Packet",
    "",
    `- generated_at: ${new Date().toISOString()}`,
    `- repository: ${input.repository.owner}/${input.repository.name}`,
    `- head_branch: ${reviewScope.headBranch}`,
    `- head_sha: ${reviewScope.headSha}`,
    `- owner: ${reviewScope.owner}`,
    `- requested_reviewers: ${ownerList().join(", ")}`,
    `- current_status: ${status.status}`,
    `- current_verdict: ${status.verdict}`,
    "",
    "## Verified baseline",
    "",
    `- CodeQL run: ${controls.codeql.runUrl}`,
    `- Security Baseline run: ${controls.securityBaseline.runUrl}`,
    `- Provenance source control: ${controls.provenance.sourceControl}`,
    `- Provenance attestation run: ${controls.provenance.attestationRunUrl}`,
    "",
    "## Missing items",
    "",
    ...missingItems.map((item) => `- ${item}`),
    "",
    "## Required next action",
    "",
    "- Открыть первый security-critical PR на `main`-contour.",
    "- Дождаться `Dependency Review` run и зафиксировать `prNumber`/`runId`.",
    "- Добавить reviewer refs после owner review.",
    "- Обновить `var/security/security-reviewed-evidence-input.json` и повторить `pnpm gate:security:reviewed-evidence`.",
    "",
  ].join("\n");

  const reviewDraft = [
    "# R3 Reviewed CI Evidence Draft",
    "",
    `- reviewed_at: ${reviewScope.reviewedAt}`,
    `- review_owner: ${reviewScope.owner}`,
    `- repository: ${input.repository.owner}/${input.repository.name}`,
    `- head_branch: ${reviewScope.headBranch}`,
    `- head_sha: ${reviewScope.headSha}`,
    `- baseline_status: ${status.status}`,
    `- baseline_verdict: ${status.verdict}`,
    "",
    "## Controls snapshot",
    "",
    `- codeql: ${status.controls.codeql.status} (${controls.codeql.runUrl})`,
    `- security_baseline: ${status.controls.securityBaseline.status} (${controls.securityBaseline.runUrl})`,
    `- dependency_review: ${status.controls.dependencyReview.status}`,
    `- provenance: ${status.controls.provenance.status} (${controls.provenance.attestationRunUrl})`,
    "",
    "## Reviewer section",
    "",
    "- reviewer: pending",
    "- reviewer_ref: pending",
    "- dependency_review_pr: pending",
    "- dependency_review_run: pending",
    "- verdict: pending",
    "- notes: pending first PR-backed cycle",
    "",
  ].join("\n");

  const index = [
    "# R3 Reviewed CI Evidence Packet Index",
    "",
    `- request_packet: ${REQUEST_PACKET_MD}`,
    `- review_draft: ${REVIEW_DRAFT_MD}`,
    `- source_input: ${INPUT_JSON}`,
    `- source_status: ${STATUS_JSON}`,
    "",
  ].join("\n");

  const requestWrite = writeTextWithReadonlyFallback(REQUEST_PACKET_MD, requestPacket, writeIssues);
  const draftWrite = writeTextWithReadonlyFallback(REVIEW_DRAFT_MD, reviewDraft, writeIssues);
  const indexWrite = writeTextWithReadonlyFallback(INDEX_MD, index, writeIssues);

  const report = {
    generatedAt: new Date().toISOString(),
    track: "R3",
    status: missingItems.length === 0 ? "ready_for_review" : "prepared",
    issues: [
      ...missingItems.map((item) => ({ type: "missing_review_input", value: item })),
      ...writeIssues,
    ],
    evidenceRefs: [
      rel(INPUT_JSON),
      rel(STATUS_JSON),
      REQUEST_PACKET_MD,
      REVIEW_DRAFT_MD,
      INDEX_MD,
      ".github/CODEOWNERS",
    ],
    nextAction: "заполнить reviewer refs и первый dependency-review PR/run, затем обновить input-контракт и повторить gate",
    verdict: missingItems.length === 0 ? "reviewed_evidence_packet_ready_for_fill" : "reviewed_evidence_packet_prepared",
    handoffRoot: HANDOFF_ROOT,
    packetPath: REQUEST_PACKET_MD,
    draftPath: REVIEW_DRAFT_MD,
    requestedReviewers: ownerList(),
    missingItems,
    handoffWritable: writeIssues.length === 0,
    handoffReuseMode: writeIssues.length > 0 ? "readonly_existing_artifacts" : "fresh_write",
    handoffPaths: {
      request: requestWrite.path,
      draft: draftWrite.path,
      index: indexWrite.path,
    },
  };

  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const reportMd = [
    "# Security Reviewed Evidence Packet",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- handoff_root: \`${report.handoffRoot}\``,
    `- packet_path: \`${report.packetPath}\``,
    `- draft_path: \`${report.draftPath}\``,
    `- next_action: ${report.nextAction}`,
    "",
    "## Requested reviewers",
    "",
    ...report.requestedReviewers.map((item) => `- \`${item}\``),
    "",
    "## Missing items",
    "",
    ...(report.missingItems.length > 0 ? report.missingItems.map((item) => `- ${item}`) : ["- none"]),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, `${reportMd}\n`);

  console.log("[security-reviewed-evidence-packet] summary");
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- missing_items=${report.missingItems.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  return report;
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(`[security-reviewed-evidence-packet] ${error.message}`);
    process.exit(error.exitCode || 1);
  }
}

module.exports = { run };
