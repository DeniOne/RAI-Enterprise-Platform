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

function topItems(obj, limit = 5) {
  return Object.entries(obj || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function ensureNumber(v) {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

function main() {
  const args = parseArgs(process.argv);
  const input = args.input;
  const out = args.out || "docs/WEEKLY_INVARIANT_TREND_REVIEW_RU.md";
  const week = args.week || "unknown-week";

  if (!input) {
    console.error("Usage: node scripts/invariant-weekly-review.cjs --input <metrics.json> [--week <YYYY-Www>] [--out <file>]");
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const metrics = payload.metrics || {};
  const breakdown = payload.breakdown || {};
  const alerts = payload.alerts || {};
  const panic = payload.panic || {};
  const summary = payload.summary || {};
  const generatedAt = new Date().toISOString();

  const topTenants = topItems(breakdown.tenantViolationsByTenant, 5);
  const topModules = topItems(breakdown.tenantViolationsByModule, 5);

  const lines = [];
  lines.push("---");
  lines.push("id: DOC-OPS-REP-131");
  lines.push("layer: Operations");
  lines.push("type: Report");
  lines.push("status: approved");
  lines.push("version: 1.0.0");
  lines.push("---");
  lines.push("");
  lines.push("# WEEKLY INVARIANT TREND REVIEW (RU)");
  lines.push("");
  lines.push(`РќРµРґРµР»СЏ: ${week}`);
  lines.push(`РЎРіРµРЅРµСЂРёСЂРѕРІР°РЅРѕ: ${generatedAt}`);
  lines.push("");
  lines.push("## 1) РўРµРєСѓС‰РёРµ Р·РЅР°С‡РµРЅРёСЏ РёРЅРІР°СЂРёР°РЅС‚РѕРІ");
  lines.push(`- tenant_violation_rate: ${ensureNumber(metrics.tenant_violation_rate)}`);
  lines.push(`- cross_tenant_access_attempts_total: ${ensureNumber(metrics.cross_tenant_access_attempts_total)}`);
  lines.push(`- illegal_transition_attempts_total: ${ensureNumber(metrics.illegal_transition_attempts_total)}`);
  lines.push(`- financial_invariant_failures_total: ${ensureNumber(metrics.financial_invariant_failures_total)}`);
  lines.push("");
  lines.push("## 2) РЎРѕСЃС‚РѕСЏРЅРёРµ Р°Р»РµСЂС‚РѕРІ");
  lines.push(`- tenant_violation_rate: ${alerts.tenant_violation_rate ? "ALERT" : "ok"}`);
  lines.push(`- cross_tenant_access_attempts_total: ${alerts.cross_tenant_access_attempts_total ? "ALERT" : "ok"}`);
  lines.push(`- illegal_transition_attempts_total: ${alerts.illegal_transition_attempts_total ? "ALERT" : "ok"}`);
  lines.push(`- financial_invariant_failures_total: ${alerts.financial_invariant_failures_total ? "ALERT" : "ok"}`);
  lines.push(`- financial_panic_mode: ${panic.financial ? "ON" : "off"} (threshold=${ensureNumber(panic.financialPanicThreshold)})`);
  lines.push("");
  lines.push("## 3) Hotspots РїРѕ tenant");
  if (topTenants.length === 0) {
    lines.push("- РќРµС‚ tenant violations Р·Р° РїРµСЂРёРѕРґ.");
  } else {
    for (const [tenant, count] of topTenants) {
      lines.push(`- ${tenant}: ${count}`);
    }
  }
  lines.push("");
  lines.push("## 4) Hotspots РїРѕ module/model");
  if (topModules.length === 0) {
    lines.push("- РќРµС‚ module violations Р·Р° РїРµСЂРёРѕРґ.");
  } else {
    for (const [moduleName, count] of topModules) {
      lines.push(`- ${moduleName}: ${count}`);
    }
  }
  lines.push("");
  lines.push("## 5) РЈРїСЂР°РІР»РµРЅС‡РµСЃРєРѕРµ СЂРµС€РµРЅРёРµ РЅРµРґРµР»Рё");
  lines.push("- РЎС‚Р°С‚СѓСЃ: `Green | Yellow | Red` (Р·Р°РїРѕР»РЅРёС‚СЊ РІСЂСѓС‡РЅСѓСЋ РїРѕСЃР»Рµ review).");
  lines.push("- Р РµС€РµРЅРёРµ: `Continue rollout | Hold | Rollback`.");
  lines.push("- РћР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РґРµР№СЃС‚РІРёСЏ РґРѕ СЃР»РµРґСѓСЋС‰РµР№ РЅРµРґРµР»Рё: (Р·Р°РїРѕР»РЅРёС‚СЊ РІСЂСѓС‡РЅСѓСЋ).");
  lines.push("");

    lines.push("## 6) Weekly Metrics");
  lines.push(`- open Critical: ${ensureNumber(summary.openCritical)}`);
  lines.push(`- open High: ${ensureNumber(summary.openHigh)}`);
  lines.push(`- invariant test coverage (%): ${ensureNumber(summary.invariantTestCoveragePct)}`);
  lines.push("");
  const outPath = path.resolve(process.cwd(), out);
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Weekly invariant report generated: ${outPath}`);
}

main();


