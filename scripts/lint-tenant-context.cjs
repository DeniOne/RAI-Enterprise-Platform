#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "apps", "api", "src");
const MODE = (process.argv.includes("--enforce") ? "enforce" : "warn").toLowerCase();

const NON_TENANT_MODELS = new Set([
  "company",
  "outboxmessage",
  "eventconsumption",
  "rapeseed",
  "rapeseedhistory",
]);

const ACTIONS = [
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "create",
  "createMany",
  "upsert",
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(full, acc);
    } else if (name.endsWith(".ts") && !name.endsWith(".spec.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

function hasTenantIgnore(line) {
  return line.includes("tenant-lint:ignore");
}

function run() {
  const files = walk(SRC);
  const issues = [];
  const callRegex = new RegExp(
    String.raw`(?:this\.prisma|tx)\.(\w+)\.(${ACTIONS.join("|")})\s*\(`,
    "g",
  );

  for (const file of files) {
    const txt = fs.readFileSync(file, "utf8");
    const lines = txt.split(/\r?\n/);
    let match;
    while ((match = callRegex.exec(txt)) !== null) {
      const model = match[1];
      const action = match[2];
      const modelLc = model.toLowerCase();
      if (NON_TENANT_MODELS.has(modelLc)) continue;

      const pos = match.index;
      const line = txt.slice(0, pos).split(/\r?\n/).length;
      const lineText = lines[line - 1] || "";
      if (hasTenantIgnore(lineText)) continue;

      // Heuristic: inspect near call site payload for companyId presence.
      const snippet = txt.slice(pos, pos + 500);
      if (!snippet.includes("companyId")) {
        issues.push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          line,
          model,
          action,
        });
      }
    }
  }

  console.log(`[tenant-context-lint] mode=${MODE}`);
  console.log(`tenant_context_suspects=${issues.length}`);
  for (const i of issues.slice(0, 200)) {
    console.log(`- ${i.file}:${i.line} model=${i.model} action=${i.action}`);
  }
  if (issues.length > 200) {
    console.log(`... truncated ${issues.length - 200} more`);
  }

  if (MODE === "enforce" && issues.length > 0) {
    process.exit(1);
  }
}

run();
