#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const RAW_FILE = path.join(OUTPUT_DIR, "npm-audit.json");
const SUMMARY_FILE = path.join(OUTPUT_DIR, "security-audit-summary.json");

function argValue(name, fallback) {
  const hit = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
}

function severityRank(value) {
  return {
    critical: 4,
    high: 3,
    moderate: 2,
    low: 1,
    info: 0,
  }[String(value || "").toLowerCase()] ?? -1;
}

function summarizeAdvisories(advisories) {
  return Object.values(advisories || {})
    .map((entry) => ({
      id: entry.id ?? null,
      module: entry.module_name ?? entry.module ?? null,
      severity: entry.severity ?? "unknown",
      title: entry.title ?? "",
      recommendation: entry.recommendation ?? "",
      url: entry.url ?? null,
      cves: entry.cves ?? [],
      findings: Array.isArray(entry.findings) ? entry.findings.length : 0,
      paths: Array.isArray(entry.findings)
        ? entry.findings.flatMap((finding) => finding.paths || []).slice(0, 10)
        : [],
    }))
    .sort((left, right) => {
      const bySeverity = severityRank(right.severity) - severityRank(left.severity);
      if (bySeverity !== 0) return bySeverity;
      return String(left.module || "").localeCompare(String(right.module || ""));
    })
    .slice(0, 25);
}

function main() {
  const timeoutMs = Number(argValue("--timeout-ms", "180000"));
  const failOnFindings = process.argv.includes("--fail-on-findings");
  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const startedAt = new Date().toISOString();

  const res = spawnSync(
    pnpmCmd,
    ["audit", "--audit-level=high", "--json"],
    {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
      timeout: timeoutMs,
      maxBuffer: 64 * 1024 * 1024,
    },
  );

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (res.error) {
    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      status: res.error.code === "ETIMEDOUT" ? "timeout" : "spawn_error",
      timeoutMs,
      exitCode: res.status ?? 1,
      error: res.error.message,
    };
    fs.writeFileSync(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`);
    console.error(`[security-audit-ci] status=${summary.status}`);
    console.error(`[security-audit-ci] error=${summary.error}`);
    console.error(`[security-audit-ci] report=${path.relative(ROOT, SUMMARY_FILE).replace(/\\/g, "/")}`);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(res.stdout || "{}");
  } catch (error) {
    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "invalid_json",
      timeoutMs,
      exitCode: res.status ?? 1,
      error: error instanceof Error ? error.message : String(error),
      stderr: (res.stderr || "").trim(),
    };
    fs.writeFileSync(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`);
    console.error("[security-audit-ci] status=invalid_json");
    if (summary.stderr) {
      console.error(summary.stderr);
    }
    process.exit(1);
  }

  fs.writeFileSync(RAW_FILE, `${JSON.stringify(parsed, null, 2)}\n`);

  const counts = parsed.metadata?.vulnerabilities || {};
  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    status: "ok",
    timeoutMs,
    exitCode: res.status ?? 0,
    dependencies: parsed.metadata?.dependencies ?? null,
    totalDependencies: parsed.metadata?.totalDependencies ?? null,
    counts: {
      info: counts.info ?? 0,
      low: counts.low ?? 0,
      moderate: counts.moderate ?? 0,
      high: counts.high ?? 0,
      critical: counts.critical ?? 0,
    },
    topAdvisories: summarizeAdvisories(parsed.advisories),
  };
  fs.writeFileSync(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`);

  console.log("[security-audit-ci] status=ok");
  console.log(`[security-audit-ci] high=${summary.counts.high}`);
  console.log(`[security-audit-ci] critical=${summary.counts.critical}`);
  console.log(`[security-audit-ci] raw=${path.relative(ROOT, RAW_FILE).replace(/\\/g, "/")}`);
  console.log(`[security-audit-ci] summary=${path.relative(ROOT, SUMMARY_FILE).replace(/\\/g, "/")}`);

  if (failOnFindings && (summary.counts.high > 0 || summary.counts.critical > 0)) {
    process.exit(1);
  }

  process.exit(0);
}

main();
