#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../../..");
const LOG_PATH = path.join(ROOT, "docs/04-ENGINEERING/ADVISORY_S3_MONITORING_LOG.jsonl");
const OUT_PATH = path.join(ROOT, "docs/04-ENGINEERING/ADVISORY_S3_MONITORING_REPORT.md");

function avg(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function main() {
  let content = "";
  try {
    content = await fs.readFile(LOG_PATH, "utf8");
  } catch {
    throw new Error(`log file not found: ${LOG_PATH}`);
  }

  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  if (rows.length === 0) {
    throw new Error("no monitoring snapshots found");
  }

  const failCount = rows.filter((r) => r.status !== "PASS").length;
  const passCount = rows.length - failCount;
  const p95 = rows.map((r) => Number(r.ops?.decisionLagAvgMinutes ?? 0));
  const acceptRates = rows.map((r) => Number(r.ops?.acceptRate ?? 0));
  const stages = [...new Set(rows.map((r) => String(r.rollout?.stage ?? "UNKNOWN")))];

  const report = [
    "# Advisory S3 Monitoring Report",
    "",
    `- Generated at (UTC): ${new Date().toISOString()}`,
    `- Snapshots: ${rows.length}`,
    `- PASS: ${passCount}`,
    `- FAIL: ${failCount}`,
    `- Observed rollout stages: ${stages.join(", ")}`,
    "",
    "## Aggregates",
    `- Avg decision lag (minutes): ${avg(p95).toFixed(2)}`,
    `- Avg accept rate: ${avg(acceptRates).toFixed(4)}`,
    "",
    "## Latest Snapshot",
    `- Captured at: ${rows[rows.length - 1].capturedAtUtc}`,
    `- Stage: ${rows[rows.length - 1].rollout?.stage}`,
    `- Status: ${rows[rows.length - 1].status}`,
    "",
    "## Source",
    `- Log file: \`docs/04-ENGINEERING/ADVISORY_S3_MONITORING_LOG.jsonl\``,
  ].join("\n");

  await fs.writeFile(OUT_PATH, `${report}\n`, "utf8");
  console.log(JSON.stringify({ outPath: OUT_PATH, snapshots: rows.length, failCount }, null, 2));
}

main().catch((err) => {
  console.error(`[advisory-s3-monitoring-summarize] ${err.message}`);
  process.exit(1);
});
