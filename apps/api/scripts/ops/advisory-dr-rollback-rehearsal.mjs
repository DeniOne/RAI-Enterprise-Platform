#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const EMAIL = process.env.DRILL_EMAIL || "admin@example.com";
const PASSWORD = process.env.DRILL_PASSWORD || "password123";
const TRACE_PREFIX = `dr-${Date.now()}`;
const MAX_LOGIN_ATTEMPTS = Number(process.env.DRILL_LOGIN_MAX_ATTEMPTS || 4);
const DEFAULT_LOGIN_RETRY_MS = Number(process.env.DRILL_LOGIN_RETRY_MS || 1500);

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveRetryMs(response, attempt) {
  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfterSeconds = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  return DEFAULT_LOGIN_RETRY_MS * attempt;
}

async function login() {
  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt += 1) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    if (response.ok) {
      const data = await response.json();
      if (!data?.access_token) {
        throw new Error("missing access token");
      }
      return data.access_token;
    }

    if (response.status === 429 && attempt < MAX_LOGIN_ATTEMPTS) {
      await sleep(resolveRetryMs(response, attempt));
      continue;
    }

    throw new Error(`login failed: ${response.status}`);
  }

  throw new Error("login failed: retry budget exhausted");
}

async function call(token, method, path, body) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (method !== "GET" && method !== "HEAD") {
    headers["Idempotency-Key"] = `${TRACE_PREFIX}:${method}:${path}:${Date.now()}`;
  }
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const elapsedMs = Date.now() - started;
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${text}`);
  }
  return { elapsedMs, data: parsed };
}

async function getAuditCount(token, action) {
  const query = new URLSearchParams({ action, page: "1", limit: "20" }).toString();
  const result = await call(token, "GET", `/api/audit/logs?${query}`);
  return Number(result.data?.data?.length ?? 0);
}

async function main() {
  const token = await login();
  const timeline = [];
  const startedAtMs = Date.now();

  timeline.push({ t: nowIso(), step: "start", status: "ok" });

  await call(token, "POST", "/api/advisory/rollout/config", {
    traceId: `${TRACE_PREFIX}-cfg-s3`,
    stage: "S3",
    autoStopEnabled: true,
  });
  timeline.push({ t: nowIso(), step: "configure-stage-S3", status: "ok" });

  const incidentDetectedAtMs = Date.now();
  timeline.push({ t: nowIso(), step: "incident-detected-simulated", status: "ok" });

  await call(token, "POST", "/api/advisory/incident/kill-switch/enable", {
    traceId: `${TRACE_PREFIX}-ks-on`,
    reason: "dr-rehearsal-simulated-outage",
  });
  const containmentAtMs = Date.now();
  timeline.push({ t: nowIso(), step: "kill-switch-enable", status: "ok" });

  const pilotAfterKill = await call(token, "GET", "/api/advisory/pilot/status");
  timeline.push({ t: nowIso(), step: "pilot-status-after-kill", status: "ok", details: pilotAfterKill.data });

  await call(token, "POST", "/api/advisory/rollout/stage/rollback", {
    traceId: `${TRACE_PREFIX}-rollback-s1`,
    targetStage: "S1",
    reason: "dr-rehearsal-safe-stage",
  });
  timeline.push({ t: nowIso(), step: "rollback-to-S1", status: "ok" });

  await call(token, "POST", "/api/advisory/incident/kill-switch/disable", {
    traceId: `${TRACE_PREFIX}-ks-off`,
  });
  const recoveryAtMs = Date.now();
  timeline.push({ t: nowIso(), step: "kill-switch-disable", status: "ok" });

  const rolloutAfter = await call(token, "GET", "/api/advisory/rollout/status");
  timeline.push({ t: nowIso(), step: "rollout-status-after-recovery", status: "ok", details: rolloutAfter.data });

  const auditChecks = {
    killSwitchEnabled: await getAuditCount(token, "ADVISORY_KILL_SWITCH_ENABLED") > 0,
    killSwitchDisabled: await getAuditCount(token, "ADVISORY_KILL_SWITCH_DISABLED") > 0,
    rollbackRecorded: await getAuditCount(token, "ADVISORY_ROLLOUT_STAGE_ROLLED_BACK") > 0,
  };

  const containmentRtoSec = Number(((containmentAtMs - incidentDetectedAtMs) / 1000).toFixed(2));
  const fullRecoveryRtoSec = Number(((recoveryAtMs - incidentDetectedAtMs) / 1000).toFixed(2));
  const simulatedRpoSec = 0;

  const checks = {
    pilotDisabledOnContainment: pilotAfterKill.data?.enabled === false,
    rollbackReachedS1: rolloutAfter.data?.stage === "S1",
    ...auditChecks,
  };

  const pass = Object.values(checks).every(Boolean);
  const report = {
    sessionId: `ADVISORY-DR-REHEARSAL-${new Date().toISOString().slice(0, 10)}`,
    dateUtc: nowIso(),
    baseUrl: BASE_URL,
    tracePrefix: TRACE_PREFIX,
    timeline,
    metrics: {
      containmentRtoSec,
      fullRecoveryRtoSec,
      simulatedRpoSec,
      totalDurationSec: Number(((Date.now() - startedAtMs) / 1000).toFixed(2)),
    },
    checks,
    status: pass ? "PASS" : "FAIL",
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(pass ? 0 : 2);
}

main().catch((error) => {
  console.error(`[advisory-dr-rehearsal] ${error.message}`);
  process.exit(1);
});
