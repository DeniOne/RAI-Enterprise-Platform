#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const EMAIL = process.env.DRILL_EMAIL || "admin@example.com";
const PASSWORD = process.env.DRILL_PASSWORD || "password123";
const TRACE_PREFIX = `progression-${Date.now()}`;
const MAX_LOGIN_ATTEMPTS = Number(process.env.DRILL_LOGIN_MAX_ATTEMPTS || 4);
const DEFAULT_LOGIN_RETRY_MS = Number(process.env.DRILL_LOGIN_RETRY_MS || 1500);

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
      if (!data?.access_token) throw new Error("missing access token");
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
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
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
