const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENFORCE = process.argv.includes("--enforce");

const TARGET_MODELS = ["task", "budget"];
const ALLOWED_FILES = new Set([
  "apps/api/src/modules/task/task.service.ts",
  "apps/api/src/modules/finance-economy/finance/application/budget.service.ts",
]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".git" || name === "dist") continue;
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function hasForbiddenStatusUpdate(content, model) {
  const rgx = new RegExp(
    String.raw`prisma\.${model}\.(update|updateMany)\s*\(\s*\{[\s\S]{0,800}?data\s*:\s*\{[\s\S]{0,500}?\bstatus\s*:`,
    "m",
  );
  return rgx.test(content);
}

function main() {
  const files = walk(path.join(ROOT, "apps", "api", "src")).filter((f) => f.endsWith(".ts"));
  const suspects = [];

  for (const file of files) {
    const relPath = rel(file);
    if (ALLOWED_FILES.has(relPath)) continue;
    const txt = fs.readFileSync(file, "utf-8");
    for (const model of TARGET_MODELS) {
      if (hasForbiddenStatusUpdate(txt, model)) {
        suspects.push(`${relPath} (model=${model})`);
      }
    }
  }

  console.log(`[fsm-status-lint] mode=${ENFORCE ? "enforce" : "warn"}`);
  console.log(`fsm_status_update_suspects=${suspects.length}`);
  for (const s of suspects) console.log(`- ${s}`);

  if (ENFORCE && suspects.length > 0) {
    process.exit(1);
  }
}

main();

