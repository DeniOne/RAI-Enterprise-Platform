#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function readJson(filePath) {
  const full = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(full)) {
    throw new Error(`Input JSON not found: ${full}`);
  }
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function fail(msg, failures) {
  failures.push(msg);
}

function main() {
  const args = parseArgs(process.argv);
  const input = args.input || process.env.INVARIANT_GUARD_INPUT;
  if (!input) {
    console.error("Usage: node scripts/invariant-rollout-guard.cjs --input <snapshot.json>");
    process.exit(1);
  }

  const payload = readJson(input);
  const metrics = payload.metrics || {};
  const panic = payload.panic || {};
  const system = payload.system || {};

  const thresholds = {
    tenantViolation: toNum(process.env.SLO_MAX_TENANT_VIOLATIONS_DELTA_5M, 0),
    crossTenant: toNum(process.env.SLO_MAX_CROSS_TENANT_ATTEMPTS_DELTA_5M, 0),
    illegalTransition: toNum(process.env.SLO_MAX_ILLEGAL_TRANSITIONS_DELTA_10M, 0),
    financialFailure: toNum(process.env.SLO_MAX_FINANCIAL_FAILURES_DELTA_5M, 0),
    http5xxRate: toNum(process.env.SLO_MAX_HTTP_5XX_RATE, 0.01),
    http4xxRate: toNum(process.env.SLO_MAX_HTTP_4XX_RATE, 0.1),
    p95LatencyMs: toNum(process.env.SLO_MAX_P95_LATENCY_MS, 1200),
  };

  const current = {
    tenantViolation: toNum(metrics.tenant_violation_rate, 0),
    crossTenant: toNum(metrics.cross_tenant_access_attempts_total, 0),
    illegalTransition: toNum(metrics.illegal_transition_attempts_total, 0),
    financialFailure: toNum(metrics.financial_invariant_failures_total, 0),
    financialPanic: Boolean(panic.financial),
    http5xxRate: toNum(system.http_5xx_rate, 0),
    http4xxRate: toNum(system.http_4xx_rate, 0),
    p95LatencyMs: toNum(system.p95_latency_ms, 0),
  };

  const failures = [];
  if (current.tenantViolation > thresholds.tenantViolation) {
    fail(
      `tenant_violation_rate=${current.tenantViolation} > ${thresholds.tenantViolation}`,
      failures,
    );
  }
  if (current.crossTenant > thresholds.crossTenant) {
    fail(
      `cross_tenant_access_attempts_total=${current.crossTenant} > ${thresholds.crossTenant}`,
      failures,
    );
  }
  if (current.illegalTransition > thresholds.illegalTransition) {
    fail(
      `illegal_transition_attempts_total=${current.illegalTransition} > ${thresholds.illegalTransition}`,
      failures,
    );
  }
  if (current.financialFailure > thresholds.financialFailure) {
    fail(
      `financial_invariant_failures_total=${current.financialFailure} > ${thresholds.financialFailure}`,
      failures,
    );
  }
  if (current.financialPanic) {
    fail("financial_panic_mode=ON", failures);
  }

  // Optional system rollout checks (used when provided by monitoring aggregator).
  if ("http_5xx_rate" in system && current.http5xxRate > thresholds.http5xxRate) {
    fail(`http_5xx_rate=${current.http5xxRate} > ${thresholds.http5xxRate}`, failures);
  }
  if ("http_4xx_rate" in system && current.http4xxRate > thresholds.http4xxRate) {
    fail(`http_4xx_rate=${current.http4xxRate} > ${thresholds.http4xxRate}`, failures);
  }
  if ("p95_latency_ms" in system && current.p95LatencyMs > thresholds.p95LatencyMs) {
    fail(`p95_latency_ms=${current.p95LatencyMs} > ${thresholds.p95LatencyMs}`, failures);
  }

  console.log("[invariant-rollout-guard] thresholds=", JSON.stringify(thresholds));
  console.log("[invariant-rollout-guard] current=", JSON.stringify(current));

  if (failures.length > 0) {
    console.log("[invariant-rollout-guard] STOP");
    for (const f of failures) console.log(`- ${f}`);
    process.exit(1);
  }

  console.log("[invariant-rollout-guard] GO");
}

main();

