#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const PACKET_JSON = path.join(OUTPUT_DIR, "phase-a1-first-wave-request-packet.json");
const VERDICT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a1-first-wave-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a1-first-wave-status.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues.map((issue) => `- ${issue}`).join("\n");
}

function normalizeBlockers(blockers) {
  if (!Array.isArray(blockers) || blockers.length === 0) {
    return [];
  }

  return blockers.map((blocker) => {
    if (!blocker || typeof blocker !== "object") {
      return String(blocker);
    }

    const referenceId = blocker.referenceId || "unknown";
    const artifact = blocker.artifact || "artifact not specified";
    return `${referenceId} (${artifact})`;
  });
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  if (!fs.existsSync(PACKET_JSON)) {
    issues.push(`missing packet ${PACKET_JSON}`);
  }
  if (!fs.existsSync(VERDICT_JSON)) {
    issues.push(`missing verdict ${VERDICT_JSON}`);
  }

  if (issues.length > 0) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
    fs.writeFileSync(REPORT_MD, `# Phase A1 First Wave Status\n\n## Issues\n\n${renderIssuesMarkdown(issues)}\n`);
    console.log("[phase-a1-first-wave-status] issues");
    console.log(`- issues=${issues.length}`);
    if (mode === "enforce") {
      process.exit(1);
    }
    return;
  }

  const packet = readJson(PACKET_JSON);
  const verdict = readJson(VERDICT_JSON);
  const items = packet.items || [];
  const counts = {
    total: items.length,
    requested: items.filter((item) => item.status === "requested").length,
    received: items.filter((item) => item.status === "received").length,
    reviewed: items.filter((item) => item.status === "reviewed").length,
    accepted: items.filter((item) => item.status === "accepted").length,
  };

  let waveState = "not_started";
  if (counts.accepted === counts.total && counts.total > 0) {
    waveState = "completed";
  } else if (counts.received > 0 || counts.reviewed > 0 || counts.accepted > 0) {
    waveState = "in_progress";
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourcePacket: rel(PACKET_JSON),
    sourceVerdict: rel(VERDICT_JSON),
    counts,
    currentLegalVerdict: verdict.currentVerdict,
    nextTargetVerdict: verdict.nextTargetVerdict,
    completionPct: verdict.completionPct,
    blockersToNextTarget: normalizeBlockers(verdict.blockersToNextTarget),
    waveState,
    items,
    issues,
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase A1 First Wave Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_packet: \`${report.sourcePacket}\``,
    `- source_verdict: \`${report.sourceVerdict}\``,
    `- current_legal_verdict: \`${report.currentLegalVerdict}\``,
    `- next_target_verdict: \`${report.nextTargetVerdict}\``,
    `- completion_pct: \`${report.completionPct}\``,
    `- blockers_to_next_target: \`${report.blockersToNextTarget.join(", ")}\``,
    `- wave_state: \`${report.waveState}\``,
    `- total: \`${counts.total}\``,
    `- requested: \`${counts.requested}\``,
    `- received: \`${counts.received}\``,
    `- reviewed: \`${counts.reviewed}\``,
    `- accepted: \`${counts.accepted}\``,
    "",
    "## First Wave Items",
    "",
    "| Priority | Reference | Status | Owners | Review due |",
    "|---:|---|---|---|---|",
    ...items.map(
      (item) =>
        `| ${item.priority} | \`${item.referenceId}\` | \`${item.status}\` | ${item.namedOwners} | \`${item.reviewDue}\` |`,
    ),
    "",
    "## Decision",
    "",
    report.waveState === "completed"
      ? "- Первая legal-волна полностью принята и больше не является чистым внешним blocker."
      : "- Первая legal-волна ещё не принята и остаётся внешним blocker для реального движения `A1`.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(issues),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-a1-first-wave-status] summary");
  console.log(`- wave_state=${waveState}`);
  console.log(`- total=${counts.total}`);
  console.log(`- requested=${counts.requested}`);
  console.log(`- received=${counts.received}`);
  console.log(`- reviewed=${counts.reviewed}`);
  console.log(`- accepted=${counts.accepted}`);
  console.log(`- current_legal_verdict=${report.currentLegalVerdict}`);
  console.log(`- blockers_to_next_target=${report.blockersToNextTarget.join(", ")}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && issues.length > 0) {
    process.exit(1);
  }
}

main();
