#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../../..");
const LOG_PATH = path.join(ROOT, "docs/04-ENGINEERING/ADVISORY_S3_MONITORING_LOG.jsonl");

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
    console.log(JSON.stringify({ snapshots: 0, windowHours: 0, remainingHours: 72, status: "NO-DATA" }, null, 2));
    process.exit(0);
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  const windowHours = hoursBetween(first.capturedAtUtc, last.capturedAtUtc);
  const remainingHours = Math.max(0, 72 - windowHours);

  const failCount = rows.filter((r) => r.status !== "PASS").length;
  const status = remainingHours === 0 && failCount === 0 ? "READY-FOR-S4-GATE" : "MONITORING";

  console.log(JSON.stringify({
    snapshots: rows.length,
    firstSnapshotUtc: first.capturedAtUtc,
    lastSnapshotUtc: last.capturedAtUtc,
    windowHours: Number(windowHours.toFixed(2)),
    remainingHours: Number(remainingHours.toFixed(2)),
    failCount,
    status,
  }, null, 2));
}

main().catch((err) => {
  console.error(`[advisory-s3-window-status] ${err.message}`);
  process.exit(1);
});
