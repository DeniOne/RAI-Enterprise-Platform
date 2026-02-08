#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const EMAIL = process.env.DRILL_EMAIL || "admin@example.com";
const PASSWORD = process.env.DRILL_PASSWORD || "password123";
const TRACE_PREFIX = `progression-${Date.now()}`;

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

async function call(token, method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
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
  return parsed;
}

async function main() {
  const token = await login();
  const timeline = [];

  const before = await call(token, "GET", "/api/advisory/rollout/status");
  timeline.push({ step: "status-before", data: before });

  const stages = [
    { stage: "S2", metrics: { errorRate: 0, p95LatencyMs: 2036, conversionRate: 0.2 } },
    { stage: "S3", metrics: { errorRate: 0, p95LatencyMs: 2076, conversionRate: 0.2 } },
  ];

  for (const item of stages) {
    const gate = await call(token, "POST", "/api/advisory/rollout/gate/evaluate", {
      traceId: `${TRACE_PREFIX}-gate-${item.stage.toLowerCase()}`,
      stage: item.stage,
      metrics: item.metrics,
    });
    timeline.push({ step: `gate-${item.stage}`, data: gate });
    if (!gate.pass) {
      throw new Error(`gate failed for ${item.stage}`);
    }

    const promoted = await call(token, "POST", "/api/advisory/rollout/stage/promote", {
      traceId: `${TRACE_PREFIX}-promote-${item.stage.toLowerCase()}`,
      targetStage: item.stage,
    });
    timeline.push({ step: `promote-${item.stage}`, data: promoted });
  }

  const after = await call(token, "GET", "/api/advisory/rollout/status");
  timeline.push({ step: "status-after", data: after });

  const result = {
    sessionId: `ADVISORY-STAGE-PROGRESSION-${new Date().toISOString().slice(0, 10)}`,
    baseUrl: BASE_URL,
    tracePrefix: TRACE_PREFIX,
    timeline,
    status: after.stage === "S3" ? "PASS" : "FAIL",
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "PASS" ? 0 : 2);
}

main().catch((err) => {
  console.error(`[advisory-stage-progression] ${err.message}`);
  process.exit(1);
});
