#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MODE = (
  process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] ||
  (process.argv.includes("--enforce") ? "enforce" : "warn")
).toLowerCase();
const ENFORCE = MODE === "enforce" || MODE === "hard-fail";

const ALLOWLIST_PATH = path.join(__dirname, "raw-sql-allowlist.json");
const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"));
const allowlistMap = new Map(
  (allowlist.entries || []).map((entry) => [entry.path, entry]),
);

const SEARCH_ROOTS = ["apps", "packages", "scripts"];
const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".next",
  "coverage",
  ".git",
  "generated-client",
]);
const RAW_SQL_CALL_RE = /(?:\.\s*|\]\s*)\$(queryRaw|executeRaw|queryRawUnsafe|executeRawUnsafe)\b/g;

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }

  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (IGNORE_DIRS.has(name)) {
        continue;
      }
      walk(full, acc);
      continue;
    }
    if (!/\.(ts|js|cjs|mjs)$/.test(name)) {
      continue;
    }
    acc.push(full);
  }

  return acc;
}

function classifyScope(file) {
  if (
    file.endsWith(".spec.ts") ||
    file.includes("/__tests__/") ||
    file.includes("/test/")
  ) {
    return "test";
  }

  if (
    file.startsWith("scripts/") ||
    file === "apps/api/deep_diagnose.ts" ||
    file === "apps/api/list_tables.ts" ||
    file.startsWith("packages/prisma-client/")
  ) {
    return "tooling";
  }

  return "production";
}

function isApproved(file, method) {
  const entry = allowlistMap.get(file);
  if (!entry) {
    return false;
  }
  return entry.methods.includes(method) || entry.methods.includes("*");
}

function scan() {
  const findings = [];

  for (const root of SEARCH_ROOTS) {
    const files = walk(path.join(ROOT, root));
    for (const filePath of files) {
      const file = rel(filePath);
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        let match;
        while ((match = RAW_SQL_CALL_RE.exec(line)) !== null) {
          const method = match[1];
          const scope = classifyScope(file);
          const approved = isApproved(file, method);
          findings.push({
            file,
            line: index + 1,
            method,
            scope,
            approved,
            reason: allowlistMap.get(file)?.reason || null,
          });
        }
        RAW_SQL_CALL_RE.lastIndex = 0;
      });
    }
  }

  return findings;
}

function printFindings(title, findings) {
  console.log(`\n=== ${title} ===`);
  if (findings.length === 0) {
    console.log("none");
    return;
  }

  for (const finding of findings) {
    const suffix = finding.reason ? ` | ${finding.reason}` : "";
    console.log(
      `- ${finding.file}:${finding.line} method=${finding.method} scope=${finding.scope}${suffix}`,
    );
  }
}

function main() {
  const findings = scan();
  const unsafe = findings.filter((finding) => finding.method.includes("Unsafe"));
  const reviewRequired = findings.filter(
    (finding) => finding.scope !== "test" && !finding.approved,
  );
  const approved = findings.filter(
    (finding) => finding.scope !== "test" && finding.approved,
  );

  const summary = {
    total: findings.length,
    production: findings.filter((finding) => finding.scope === "production").length,
    tooling: findings.filter((finding) => finding.scope === "tooling").length,
    test: findings.filter((finding) => finding.scope === "test").length,
    approved: approved.length,
    reviewRequired: reviewRequired.length,
    unsafe: unsafe.length,
  };

  console.log(`[raw-sql-governance] mode=${MODE}`);
  console.log(`raw_sql_hits_total=${summary.total}`);
  console.log(`raw_sql_hits_production=${summary.production}`);
  console.log(`raw_sql_hits_tooling=${summary.tooling}`);
  console.log(`raw_sql_hits_test=${summary.test}`);
  console.log(`raw_sql_approved=${summary.approved}`);
  console.log(`raw_sql_review_required=${summary.reviewRequired}`);
  console.log(`raw_sql_unsafe=${summary.unsafe}`);

  printFindings("Approved Raw SQL Paths", approved);
  printFindings("Review Required Raw SQL Paths", reviewRequired);
  printFindings("Unsafe Raw SQL Paths", unsafe);

  if (ENFORCE && (summary.reviewRequired > 0 || summary.unsafe > 0)) {
    process.exit(1);
  }
}

main();
