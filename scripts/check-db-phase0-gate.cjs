#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

const checks = [
  "check-model-scope-manifest.cjs",
  "check-domain-ownership-manifest.cjs",
  "check-db-forbidden-relations.cjs",
  "check-db-enum-growth.cjs",
  "check-db-duplicate-indexes.cjs",
  "check-heavy-prisma-includes.cjs",
];

let hasFailure = false;

console.log("DB Phase 0 Governance Gate");
console.log(`mode=${mode}`);

for (const check of checks) {
  const checkPath = path.join(__dirname, check);
  console.log(`\nRunning ${check} ...`);
  const result = spawnSync(process.execPath, [checkPath, `--mode=${mode}`], {
    stdio: "inherit",
  });

  if ((result.status || 0) !== 0) {
    hasFailure = true;
  }
}

if (mode === "enforce" && hasFailure) {
  process.exit(1);
}
