#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../../..");
const LOG_PATH = path.join(ROOT, "docs/04-ENGINEERING/ADVISORY_S3_MONITORING_LOG.jsonl");
const OUT_PATH = path.join(ROOT, "docs/04-ENGINEERING/ADVISORY_S4_GATE_DECISION_INPUT.md");
const MIN_DEV_SNAPSHOTS = 20;

function parseRows(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .sort((a, b) => new Date(a.capturedAtUtc).getTime() - new Date(b.capturedAtUtc).getTime());
}

function hoursBetween(a, b) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60);
}

async function main() {
  const content = await fs.readFile(LOG_PATH, "utf8");
  const rows = parseRows(content);
  if (rows.length === 0) {
    throw new Error("no S3 monitoring snapshots found");
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  const windowHours = hoursBetween(first.capturedAtUtc, last.capturedAtUtc);
  const failRows = rows.filter((r) => r.status !== "PASS");
  const nonS3Rows = rows.filter((r) => String(r.rollout?.stage ?? "") !== "S3");
  const killSwitchOnRows = rows.filter((r) => Boolean(r.killSwitch?.enabled));

  const hasMinSnapshots = rows.length >= MIN_DEV_SNAPSHOTS;
  const noFails = failRows.length === 0;
  const stageStable = nonS3Rows.length === 0;
  const noKillSwitch = killSwitchOnRows.length === 0;

  const decision = hasMinSnapshots && noFails && stageStable && noKillSwitch ? "GO" : "NO-GO";
  const reasons = [];
  if (!hasMinSnapshots) reasons.push(`insufficient_snapshots (${rows.length} < ${MIN_DEV_SNAPSHOTS})`);
  if (!noFails) reasons.push(`failed_snapshots=${failRows.length}`);
  if (!stageStable) reasons.push(`non_s3_snapshots=${nonS3Rows.length}`);
  if (!noKillSwitch) reasons.push(`kill_switch_enabled_snapshots=${killSwitchOnRows.length}`);

  const out = [
    "# Advisory S4 Gate Decision Input",
    "",
    `- Generated at (UTC): ${new Date().toISOString()}`,
    `- Monitoring log: \`docs/04-ENGINEERING/ADVISORY_S3_MONITORING_LOG.jsonl\``,
    `- Gate mode: DEV_PREPROD`,
    `- Minimum snapshots required: ${MIN_DEV_SNAPSHOTS}`,
    `- Snapshots total: ${rows.length}`,
    `- Window covered: ${windowHours.toFixed(2)}h`,
    "",
    "## Gate Checks",
    `- Snapshots >= ${MIN_DEV_SNAPSHOTS}: ${hasMinSnapshots ? "PASS" : "FAIL"}`,
    `- All snapshots PASS: ${noFails ? "PASS" : "FAIL"}`,
    `- Rollout stage stable at S3: ${stageStable ? "PASS" : "FAIL"}`,
    `- Kill-switch remained disabled: ${noKillSwitch ? "PASS" : "FAIL"}`,
    "",
    "## Proposed Decision",
    `- Decision: ${decision}`,
    reasons.length > 0 ? `- Blocking reasons: ${reasons.join(", ")}` : "- Blocking reasons: none",
    "",
    "## Recommended Next Action",
    decision === "GO"
      ? "- Proceed with formal S4 (100%) go/no-go approval workflow."
      : "- Continue S3 monitoring cadence and re-run this evaluator after additional snapshots.",
  ].join("\n");

  await fs.writeFile(OUT_PATH, `${out}\n`, "utf8");
  console.log(JSON.stringify({ outPath: OUT_PATH, decision, windowHours: Number(windowHours.toFixed(2)) }, null, 2));
  process.exit(decision === "GO" ? 0 : 2);
}

main().catch((err) => {
  console.error(`[advisory-s4-gate-evaluate] ${err.message}`);
  process.exit(1);
});
