#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function toNum(name, fallback = 0) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = String(raw).toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function parseOutArg(argv) {
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--out" && argv[i + 1]) return argv[i + 1];
  }
  return "artifacts/rollout-guard-input.json";
}

function main() {
  const out = parseOutArg(process.argv);
  const outPath = path.resolve(process.cwd(), out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const payload = {
    metrics: {
      tenant_violation_rate: toNum("GUARD_METRIC_TENANT_VIOLATION_RATE", 0),
      cross_tenant_access_attempts_total: toNum("GUARD_METRIC_CROSS_TENANT_ACCESS_ATTEMPTS_TOTAL", 0),
      illegal_transition_attempts_total: toNum("GUARD_METRIC_ILLEGAL_TRANSITION_ATTEMPTS_TOTAL", 0),
      financial_invariant_failures_total: toNum("GUARD_METRIC_FINANCIAL_INVARIANT_FAILURES_TOTAL", 0),
    },
    panic: {
      financial: toBool("GUARD_PANIC_FINANCIAL", false),
    },
    system: {
      http_5xx_rate: toNum("GUARD_SYSTEM_HTTP_5XX_RATE", 0),
      http_4xx_rate: toNum("GUARD_SYSTEM_HTTP_4XX_RATE", 0),
      p95_latency_ms: toNum("GUARD_SYSTEM_P95_LATENCY_MS", 0),
    },
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Rollout guard input generated: ${outPath}`);
}

main();

