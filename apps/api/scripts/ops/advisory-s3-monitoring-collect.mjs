#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../../..");
const LOG_PATH = path.join(ROOT, "docs/04-ENGINEERING/ADVISORY_S3_MONITORING_LOG.jsonl");

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const EMAIL = process.env.DRILL_EMAIL || "admin@example.com";
const PASSWORD = process.env.DRILL_PASSWORD || "password123";

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`login failed: ${response.status}`);
  const data = await response.json();
  if (!data?.access_token) throw new Error("missing access token");
  return data.access_token;
}

async function call(token, path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`GET ${path} failed (${response.status}): ${text}`);
  }
  return parsed;
}

function evaluate(snapshot) {
  const errors = [];
  if (snapshot.rollout?.stage !== "S3") errors.push("rollout_stage_not_s3");
  const shadowEvaluated = Number(snapshot.ops?.shadowEvaluated ?? 0);
  if (shadowEvaluated >= 20 && snapshot.ops?.acceptRate < 0.1) {
    errors.push("accept_rate_below_floor");
  }
  if (snapshot.ops?.decisionLagAvgMinutes > 45) errors.push("decision_lag_too_high");
  return { pass: errors.length === 0, errors };
}

async function main() {
  const token = await login();
  const snapshot = {
    capturedAtUtc: new Date().toISOString(),
    baseUrl: BASE_URL,
    rollout: await call(token, "/api/advisory/rollout/status"),
    ops: await call(token, "/api/advisory/ops/metrics?windowHours=24"),
    killSwitch: await call(token, "/api/advisory/incident/kill-switch"),
  };
  const verdict = evaluate(snapshot);
  const item = {
    ...snapshot,
    verdict,
    status: verdict.pass ? "PASS" : "FAIL",
  };

  await fs.appendFile(LOG_PATH, `${JSON.stringify(item)}\n`, "utf8");
  console.log(JSON.stringify({ status: item.status, capturedAtUtc: item.capturedAtUtc, logPath: LOG_PATH }, null, 2));
  process.exit(item.status === "PASS" ? 0 : 2);
}

main().catch((err) => {
  console.error(`[advisory-s3-monitoring-collect] ${err.message}`);
  process.exit(1);
});
