#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "packages/prisma-client/schema.prisma");

function parseModelBlocks(schemaText) {
  const blocks = new Map();
  const regex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = regex.exec(schemaText)) !== null) {
    blocks.set(match[1], match[2]);
  }
  return blocks;
}

function normalizeFields(part) {
  return part
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .join(",");
}

function main() {
  const warnings = [];
  const failures = [];

  if (!fs.existsSync(schemaPath)) {
    failures.push(`Missing schema: ${schemaPath}`);
    reportAndExit(warnings, failures);
    return;
  }

  const schema = fs.readFileSync(schemaPath, "utf8");
  const blocks = parseModelBlocks(schema);

  let weakCompanyOnly = 0;

  for (const [modelName, block] of blocks.entries()) {
    const seen = new Set();
    const lines = block.split(/\r?\n/).map((l) => l.trim());

    for (const line of lines) {
      const m = line.match(/^@@(index|unique)\(\[([^\]]+)\]/);
      if (!m) continue;

      const kind = m[1];
      const fields = normalizeFields(m[2]);
      const key = `${kind}:${fields}`;

      if (seen.has(key)) {
        failures.push(`Duplicate ${kind} in ${modelName} on [${fields}]`);
      }
      seen.add(key);

      if (kind === "index" && fields === "companyId") {
        weakCompanyOnly += 1;
      }
    }
  }

  if (weakCompanyOnly >= 80) {
    warnings.push(`High count of weak single-field indexes @@index([companyId]): ${weakCompanyOnly}`);
  }

  reportAndExit(warnings, failures);
}

function reportAndExit(warnings, failures) {
  console.log("DB Duplicate/Weak Index Check");
  console.log(`mode=${mode}`);

  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (failures.length > 0) {
    console.log("Failures:");
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
  }

  if (mode === "enforce" && failures.length > 0) {
    process.exit(1);
  }
}

main();
