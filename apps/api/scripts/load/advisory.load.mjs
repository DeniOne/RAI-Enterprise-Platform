#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const EMAIL = process.env.LOAD_EMAIL || "admin@example.com";
const PASSWORD = process.env.LOAD_PASSWORD || "password123";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "";
const CONCURRENCY = Number(process.env.LOAD_CONCURRENCY || 20);
const DURATION_SEC = Number(process.env.LOAD_DURATION_SEC || 60);

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

async function loginAndGetToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`login failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const token = data?.access_token;
  if (!token) {
    throw new Error("login response has no access_token");
  }
  return token;
}

async function callEndpoint(path, token) {
  const started = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const ms = performance.now() - started;
    return { ok: res.ok, status: res.status, ms };
  } catch {
    const ms = performance.now() - started;
    return { ok: false, status: 0, ms };
  }
}

async function main() {
  const token = AUTH_TOKEN || await loginAndGetToken();
  const paths = [
    "/api/advisory/recommendations/my?limit=10",
    "/api/advisory/ops/metrics?windowHours=24",
    "/api/advisory/rollout/status",
  ];

  const latency = [];
  let failed = 0;
  let total = 0;
  const until = Date.now() + DURATION_SEC * 1000;

  async function worker() {
    while (Date.now() < until) {
      for (const path of paths) {
        const result = await callEndpoint(path, token);
        latency.push(result.ms);
        total += 1;
        if (!result.ok) failed += 1;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const errorRate = total === 0 ? 1 : failed / total;
  const p95 = percentile(latency, 95);
  const p99 = percentile(latency, 99);
  const reqPerSec = total / Math.max(1, DURATION_SEC);

  const report = {
    baseUrl: BASE_URL,
    concurrency: CONCURRENCY,
    durationSec: DURATION_SEC,
    totalRequests: total,
    failedRequests: failed,
    errorRate: Number(errorRate.toFixed(4)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
    throughputRps: Number(reqPerSec.toFixed(2)),
  };

  console.log(JSON.stringify(report, null, 2));

  const pass = errorRate < 0.03 && p95 < 2500 && p99 < 4000;
  process.exit(pass ? 0 : 2);
}

main().catch((error) => {
  console.error(`[advisory.load] ${error.message}`);
  process.exit(1);
});
