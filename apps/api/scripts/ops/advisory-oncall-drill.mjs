#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const EMAIL = process.env.DRILL_EMAIL || "admin@example.com";
const PASSWORD = process.env.DRILL_PASSWORD || "password123";
const TRACE_PREFIX = `drill-${Date.now()}`;

function nowIso() {
  return new Date().toISOString();
}

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`login failed: ${response.status}`);
  }
  const data = await response.json();
  if (!data?.access_token) {
    throw new Error("missing access token");
  }
  return data.access_token;
}

async function call(token, method, path, body) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const elapsedMs = Date.now() - started;
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${text}`);
  }

  return { elapsedMs, data: parsed };
}

async function getAuditLogs(token, action) {
  const query = new URLSearchParams({ action, page: "1", limit: "20" }).toString();
  const result = await call(token, "GET", `/api/audit/logs?${query}`);
  return result.data;
}

async function main() {
  const token = await login();
  const timeline = [];

  timeline.push({ t: nowIso(), step: "login", status: "ok" });

  await call(token, "POST", "/api/advisory/rollout/config", {
    traceId: `${TRACE_PREFIX}-cfg`,
    stage: "S2",
    autoStopEnabled: true,
  });
  timeline.push({ t: nowIso(), step: "rollout-config-S2", status: "ok" });

  const gate = await call(token, "POST", "/api/advisory/rollout/gate/evaluate", {
    traceId: `${TRACE_PREFIX}-gate-fail`,
    stage: "S2",
    metrics: {
      errorRate: 0.08,
      p95LatencyMs: 3800,
      conversionRate: 0.04,
    },
  });
  timeline.push({
    t: nowIso(),
    step: "gate-evaluate-fail",
    status: "ok",
    details: gate.data,
  });

  await call(token, "POST", "/api/advisory/incident/kill-switch/enable", {
    traceId: `${TRACE_PREFIX}-ks-on`,
    reason: "oncall-drill-sev1",
  });
  timeline.push({ t: nowIso(), step: "kill-switch-enable", status: "ok" });

  const pilot = await call(token, "GET", "/api/advisory/pilot/status");
  timeline.push({ t: nowIso(), step: "pilot-status-after-kill-switch", status: "ok", details: pilot.data });

  await call(token, "POST", "/api/advisory/incident/kill-switch/disable", {
    traceId: `${TRACE_PREFIX}-ks-off`,
  });
  timeline.push({ t: nowIso(), step: "kill-switch-disable", status: "ok" });

  await call(token, "POST", "/api/advisory/rollout/stage/rollback", {
    traceId: `${TRACE_PREFIX}-rollback`,
    targetStage: "S1",
    reason: "post-drill-stabilization",
  });
  timeline.push({ t: nowIso(), step: "rollout-rollback-S1", status: "ok" });

  const autoStopLogs = await getAuditLogs(token, "ADVISORY_ROLLOUT_AUTO_STOPPED");
  const gateLogs = await getAuditLogs(token, "ADVISORY_ROLLOUT_GATE_EVALUATED");
  const killSwitchLogs = await getAuditLogs(token, "ADVISORY_KILL_SWITCH_ENABLED");

  const report = {
    sessionId: `ADVISORY-ONCALL-DRILL-${new Date().toISOString().slice(0, 10)}`,
    dateUtc: nowIso(),
    baseUrl: BASE_URL,
    tracePrefix: TRACE_PREFIX,
    timeline,
    checks: {
      gateFailPassFlag: gate.data?.pass === false,
      autoStopAuditExists: Number(autoStopLogs?.data?.length || 0) > 0,
      gateAuditExists: Number(gateLogs?.data?.length || 0) > 0,
      killSwitchAuditExists: Number(killSwitchLogs?.data?.length || 0) > 0,
      pilotDisabledOnKillSwitch: pilot.data?.enabled === false,
    },
  };

  const allChecksPass = Object.values(report.checks).every(Boolean);
  report.status = allChecksPass ? "PASS" : "FAIL";

  console.log(JSON.stringify(report, null, 2));
  process.exit(allChecksPass ? 0 : 2);
}

main().catch((error) => {
  console.error(`[advisory-oncall-drill] ${error.message}`);
  process.exit(1);
});
