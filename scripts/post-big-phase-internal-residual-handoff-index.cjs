#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECURITY_DIR = path.join(ROOT, "var", "security");
const STATUS_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-status.json");
const RECONCILE_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-reconcile.json");
const RUN_CARD_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-run-card.json");
const PR_TEMPLATE_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-pr-template.json");
const OUTPUT_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-handoff-index.json");
const OUTPUT_MD = path.join(SECURITY_DIR, "post-big-phase-internal-residual-handoff-index.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function assertExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[post-big-phase-internal-residual-handoff-index] missing ${label}: ${rel(filePath)}`);
    process.exit(1);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  assertExists(STATUS_JSON, "status");
  assertExists(RECONCILE_JSON, "reconcile");
  assertExists(RUN_CARD_JSON, "run card");
  assertExists(PR_TEMPLATE_JSON, "pr template");

  const status = readJson(STATUS_JSON);
  const reconcile = readJson(RECONCILE_JSON);
  const runCard = readJson(RUN_CARD_JSON);
  const prTemplate = readJson(PR_TEMPLATE_JSON);

  const report = {
    generatedAt: new Date().toISOString(),
    track: "POST_BIG_PHASE_INTERNAL_RESIDUAL",
    status: reconcile.status,
    verdict: reconcile.verdict,
    nextAction: reconcile.nextAction,
    entrypoints: {
      prepare: "pnpm security:post-big-phase:prepare",
      reconcile: runCard.commands?.reconcile || null,
      gate: runCard.commands?.gate || null,
      reviewedReconcile: runCard.commands?.reviewedReconcile || null,
      reviewedGate: runCard.commands?.reviewedGate || null,
    },
    artifacts: {
      status: rel(STATUS_JSON),
      reconcile: rel(RECONCILE_JSON),
      runCard: rel(RUN_CARD_JSON),
      prTemplate: rel(PR_TEMPLATE_JSON),
    },
    summary: {
      tracks: status.tracks,
      requestedReviewers: runCard.requestedReviewers || [],
      missingItems: runCard.missingItems || [],
      handoffPacketPath: runCard.handoffPacketPath || null,
      handoffDraftPath: runCard.handoffDraftPath || null,
    },
    evidenceRefs: [
      rel(STATUS_JSON),
      rel(RECONCILE_JSON),
      rel(RUN_CARD_JSON),
      rel(PR_TEMPLATE_JSON),
    ],
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Post Big Phase Internal Residual Handoff Index",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- next_action: ${report.nextAction}`,
    "",
    "## Entrypoints",
    "",
    `- prepare: \`${report.entrypoints.prepare}\``,
    `- reconcile: \`${report.entrypoints.reconcile}\``,
    `- gate: \`${report.entrypoints.gate}\``,
    `- reviewed_reconcile: \`${report.entrypoints.reviewedReconcile}\``,
    `- reviewed_gate: \`${report.entrypoints.reviewedGate}\``,
    "",
    "## Artifacts",
    "",
    `- status: \`${report.artifacts.status}\``,
    `- reconcile: \`${report.artifacts.reconcile}\``,
    `- run_card: \`${report.artifacts.runCard}\``,
    `- pr_template: \`${report.artifacts.prTemplate}\``,
    "",
    "## Summary",
    "",
    `- tracks: R0=\`${report.summary.tracks?.R0 || "n/a"}\`, R1=\`${report.summary.tracks?.R1 || "n/a"}\`, R2=\`${report.summary.tracks?.R2 || "n/a"}\`, R3=\`${report.summary.tracks?.R3 || "n/a"}\``,
    `- requested_reviewers: ${(report.summary.requestedReviewers || []).map((item) => `\`${item}\``).join(", ")}`,
    `- handoff_packet_path: \`${report.summary.handoffPacketPath || "n/a"}\``,
    `- handoff_draft_path: \`${report.summary.handoffDraftPath || "n/a"}\``,
    "",
  ].join("\n");

  fs.writeFileSync(OUTPUT_MD, `${md}\n`);

  console.log("[post-big-phase-internal-residual-handoff-index] summary");
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- handoff_index_json=${rel(OUTPUT_JSON)}`);
  console.log(`- handoff_index_md=${rel(OUTPUT_MD)}`);
}

main();
