#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECURITY_DIR = path.join(ROOT, "var", "security");
const RUN_CARD_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-run-card.json");
const PACKET_JSON = path.join(SECURITY_DIR, "security-reviewed-evidence-packet.json");
const OUTPUT_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-pr-template.json");
const OUTPUT_MD = path.join(SECURITY_DIR, "post-big-phase-internal-residual-pr-template.md");

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
  if (!fs.existsSync(RUN_CARD_JSON)) {
    console.error(`[post-big-phase-internal-residual-pr-template] missing ${rel(RUN_CARD_JSON)}; run pnpm security:post-big-phase:prepare first`);
    process.exit(1);
  }
  if (!fs.existsSync(PACKET_JSON)) {
    console.error(`[post-big-phase-internal-residual-pr-template] missing ${rel(PACKET_JSON)}; run pnpm security:post-big-phase:prepare first`);
    process.exit(1);
  }

  const runCard = readJson(RUN_CARD_JSON);
  const packet = readJson(PACKET_JSON);
  const prPlaceholder = runCard.prNumberPlaceholder || "<PR_NUMBER>";
  const isDone = runCard.status === "done";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "POST_BIG_PHASE_INTERNAL_RESIDUAL",
    status: runCard.status,
    verdict: runCard.verdict,
    titleTemplate: isDone
      ? "chore(security): refresh reviewed evidence loop after security-critical merge"
      : "chore(security): close first reviewed dependency evidence cycle",
    branchHint: "chore/security-reviewed-evidence-cycle",
    requestedReviewers: runCard.requestedReviewers || [],
    missingItems: runCard.missingItems || [],
    commands: runCard.commands || {},
    handoffPacketPath: runCard.handoffPacketPath || null,
    handoffDraftPath: runCard.handoffDraftPath || null,
    prNumberPlaceholder: prPlaceholder,
    bodyTemplate: isDone
      ? [
          "## Summary",
          "",
          "- Refresh the reviewed CI evidence loop after a new security-critical merge.",
          "- Keep scope limited to the minimum change set needed for a real `Dependency Review` workflow cycle.",
          "",
          "## Why",
          "",
          "- The current post-big-phase residual baseline is already closed.",
          "- This PR exists only to keep `CodeQL / Security Baseline / Dependency Review / provenance` refs fresh after the next merge.",
          "",
          "## Required Reviewers",
          "",
          ...(runCard.requestedReviewers || []).map((item) => `- ${item}`),
          "",
          "## After Merge",
          "",
          `- Replace \`${prPlaceholder}\` in:`,
          `  - \`${runCard.commands?.reconcile || "pnpm security:post-big-phase:reconcile -- --pr-number=<PR_NUMBER>"}\``,
          `  - \`${runCard.commands?.gate || "pnpm gate:security:post-big-phase:reconcile -- --pr-number=<PR_NUMBER>"}\``,
          "",
          "## Handoff References",
          "",
          `- Packet: ${runCard.handoffPacketPath || "n/a"}`,
          `- Draft: ${runCard.handoffDraftPath || "n/a"}`,
          `- Prepared packet verdict: ${packet.verdict}`,
          "",
        ].join("\n")
      : [
          "## Summary",
          "",
          "- Open the first security-relevant PR to close the reviewed CI evidence loop for `R3`.",
          "- Keep scope limited to the minimum change set needed for a real `Dependency Review` workflow cycle.",
          "",
          "## Why",
          "",
          "- `R1=done`, `R2=done`, `R3=in_progress`.",
          "- The only remaining blocker is the absence of a real `PR-backed dependency review cycle`.",
          "",
          "## Required Reviewers",
          "",
          ...(runCard.requestedReviewers || []).map((item) => `- ${item}`),
          "",
          "## Missing Items To Capture",
          "",
          ...(runCard.missingItems || []).map((item) => `- ${item}`),
          "",
          "## After Merge",
          "",
          `- Replace \`${prPlaceholder}\` in:`,
          `  - \`${runCard.commands?.reconcile || "pnpm security:post-big-phase:reconcile -- --pr-number=<PR_NUMBER>"}\``,
          `  - \`${runCard.commands?.gate || "pnpm gate:security:post-big-phase:reconcile -- --pr-number=<PR_NUMBER>"}\``,
          "",
          "## Handoff References",
          "",
          `- Packet: ${runCard.handoffPacketPath || "n/a"}`,
          `- Draft: ${runCard.handoffDraftPath || "n/a"}`,
          `- Prepared packet verdict: ${packet.verdict}`,
          "",
        ].join("\n"),
    evidenceRefs: [
      rel(RUN_CARD_JSON),
      rel(PACKET_JSON),
      ...(runCard.evidenceRefs || []),
    ],
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Post Big Phase Internal Residual PR Template",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- title_template: \`${report.titleTemplate}\``,
    `- branch_hint: \`${report.branchHint}\``,
    "",
    "## Requested Reviewers",
    "",
    renderList(report.requestedReviewers.map((item) => `\`${item}\``)),
    "",
    "## Missing Items",
    "",
    renderList(report.missingItems),
    "",
    "## Commands",
    "",
    `- reconcile: \`${report.commands.reconcile || "n/a"}\``,
    `- gate: \`${report.commands.gate || "n/a"}\``,
    `- reviewed_reconcile: \`${report.commands.reviewedReconcile || "n/a"}\``,
    `- reviewed_gate: \`${report.commands.reviewedGate || "n/a"}\``,
    "",
    "## PR Body Template",
    "",
    "```md",
    report.bodyTemplate,
    "```",
    "",
  ].join("\n");

  fs.writeFileSync(OUTPUT_MD, `${md}\n`);

  console.log("[post-big-phase-internal-residual-pr-template] summary");
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- template_json=${rel(OUTPUT_JSON)}`);
  console.log(`- template_md=${rel(OUTPUT_MD)}`);
}

main();
