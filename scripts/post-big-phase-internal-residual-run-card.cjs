#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECURITY_DIR = path.join(ROOT, "var", "security");
const RECONCILE_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-reconcile.json");
const RUN_CARD_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-run-card.json");
const RUN_CARD_MD = path.join(SECURITY_DIR, "post-big-phase-internal-residual-run-card.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function renderList(items) {
  return (items && items.length > 0 ? items : ["none"]).map((item) => `- ${item}`).join("\n");
}

function main() {
  if (!fs.existsSync(RECONCILE_JSON)) {
    console.error(`[post-big-phase-internal-residual-run-card] missing ${rel(RECONCILE_JSON)}; run pnpm security:post-big-phase:prepare first`);
    process.exit(1);
  }

  const reconcile = readJson(RECONCILE_JSON);
  const actionBundle = reconcile.actionBundle || {};
  const handoffPacket = reconcile.handoffPacket || {};

  const report = {
    generatedAt: new Date().toISOString(),
    track: "POST_BIG_PHASE_INTERNAL_RESIDUAL",
    status: reconcile.status || "unknown",
    verdict: reconcile.verdict || "unknown",
    nextAction: reconcile.nextAction || "",
    commands: {
      prepare: actionBundle.prepareCommand || null,
      reconcile: actionBundle.reconcileCommandTemplate || null,
      gate: actionBundle.gateCommandTemplate || null,
      reviewedReconcile: actionBundle.reviewedReconcileCommandTemplate || null,
      reviewedGate: actionBundle.reviewedGateCommandTemplate || null,
    },
    operatorChecklist: actionBundle.operatorChecklist || [],
    prNumberPlaceholder: actionBundle.prNumberPlaceholder || "<PR_NUMBER>",
    requestedReviewers: actionBundle.requestedReviewers || [],
    missingItems: actionBundle.missingItems || [],
    handoffPacketPath: actionBundle.handoffPacketPath || handoffPacket.packetPath || null,
    handoffDraftPath: actionBundle.handoffDraftPath || handoffPacket.draftPath || null,
    handoffReuseMode: handoffPacket.handoffReuseMode || null,
    evidenceRefs: [
      rel(RECONCILE_JSON),
      ...(reconcile.evidenceRefs || []),
    ],
  };

  fs.writeFileSync(RUN_CARD_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Post Big Phase Internal Residual Run Card",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- next_action: ${report.nextAction}`,
    "",
    "## Commands",
    "",
    `- prepare: \`${report.commands.prepare || "n/a"}\``,
    `- reconcile: \`${report.commands.reconcile || "n/a"}\``,
    `- gate: \`${report.commands.gate || "n/a"}\``,
    `- reviewed_reconcile: \`${report.commands.reviewedReconcile || "n/a"}\``,
    `- reviewed_gate: \`${report.commands.reviewedGate || "n/a"}\``,
    `- pr_number_placeholder: \`${report.prNumberPlaceholder}\``,
    "",
    "## Operator Checklist",
    "",
    renderList(report.operatorChecklist),
    "",
    "## Requested Reviewers",
    "",
    renderList(report.requestedReviewers.map((item) => `\`${item}\``)),
    "",
    "## Missing Items",
    "",
    renderList(report.missingItems),
    "",
    "## Handoff",
    "",
    `- packet_path: \`${report.handoffPacketPath || "n/a"}\``,
    `- draft_path: \`${report.handoffDraftPath || "n/a"}\``,
    `- handoff_reuse_mode: \`${report.handoffReuseMode || "n/a"}\``,
    "",
  ].join("\n");

  fs.writeFileSync(RUN_CARD_MD, `${md}\n`);

  console.log("[post-big-phase-internal-residual-run-card] summary");
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- run_card_json=${rel(RUN_CARD_JSON)}`);
  console.log(`- run_card_md=${rel(RUN_CARD_MD)}`);
}

main();
