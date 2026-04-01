#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECURITY_DIR = path.join(ROOT, "var", "security");
const RUN_CARD_JSON = path.join(SECURITY_DIR, "post-big-phase-internal-residual-run-card.json");
const OUTPUT_SH = path.join(SECURITY_DIR, "post-big-phase-internal-residual-commands.template.sh");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function main() {
  if (!fs.existsSync(RUN_CARD_JSON)) {
    console.error(`[post-big-phase-internal-residual-command-template] missing ${rel(RUN_CARD_JSON)}; run pnpm security:post-big-phase:prepare first`);
    process.exit(1);
  }

  const runCard = JSON.parse(fs.readFileSync(RUN_CARD_JSON, "utf8"));
  const prPlaceholder = runCard.prNumberPlaceholder || "<PR_NUMBER>";
  const reconcile = runCard.commands?.reconcile || `pnpm security:post-big-phase:reconcile -- --pr-number=${prPlaceholder}`;
  const gate = runCard.commands?.gate || `pnpm gate:security:post-big-phase:reconcile -- --pr-number=${prPlaceholder}`;
  const reviewedReconcile = runCard.commands?.reviewedReconcile || `pnpm security:reviewed-evidence:reconcile -- --pr-number=${prPlaceholder}`;
  const reviewedGate = runCard.commands?.reviewedGate || `pnpm gate:security:reviewed-evidence:reconcile -- --pr-number=${prPlaceholder}`;

  const content = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    `PR_NUMBER=\"${prPlaceholder}\"`,
    "",
    "if [ \"$PR_NUMBER\" = \"<PR_NUMBER>\" ]; then",
    "  echo \"Укажи реальный PR_NUMBER перед запуском.\"",
    "  exit 1",
    "fi",
    "",
    `# Requested reviewers: ${(runCard.requestedReviewers || []).join(", ")}`,
    `# Handoff packet: ${runCard.handoffPacketPath || "n/a"}`,
    `# Handoff draft: ${runCard.handoffDraftPath || "n/a"}`,
    "",
    `echo \"> ${reviewedReconcile.replace(prPlaceholder, '${PR_NUMBER}')}\"`,
    reviewedReconcile.replace(prPlaceholder, "${PR_NUMBER}"),
    "",
    `echo \"> ${reviewedGate.replace(prPlaceholder, '${PR_NUMBER}')}\"`,
    reviewedGate.replace(prPlaceholder, "${PR_NUMBER}"),
    "",
    `echo \"> ${reconcile.replace(prPlaceholder, '${PR_NUMBER}')}\"`,
    reconcile.replace(prPlaceholder, "${PR_NUMBER}"),
    "",
    `echo \"> ${gate.replace(prPlaceholder, '${PR_NUMBER}')}\"`,
    gate.replace(prPlaceholder, "${PR_NUMBER}"),
    "",
  ].join("\n");

  fs.writeFileSync(OUTPUT_SH, `${content}\n`, { mode: 0o755 });

  console.log("[post-big-phase-internal-residual-command-template] summary");
  console.log(`- template_sh=${rel(OUTPUT_SH)}`);
}

main();
