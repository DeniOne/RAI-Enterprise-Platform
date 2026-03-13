#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

const root = path.resolve(__dirname, "..");
const apiPath = path.join(root, "apps/api/src");

function walkTsFiles(dirPath) {
  const collected = [];
  if (!fs.existsSync(dirPath)) {
    return collected;
  }
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...walkTsFiles(full));
      continue;
    }
    if (entry.isFile() && full.endsWith(".ts")) {
      collected.push(full);
    }
  }
  return collected;
}

function findHeavyIncludes(content) {
  const hits = [];
  const re = /include\s*:\s*\{/g;
  let m;

  while ((m = re.exec(content)) !== null) {
    const start = m.index;
    let i = re.lastIndex;
    let depth = 1;
    let nestedIncludes = 0;

    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;

      if (content.startsWith("include", i)) {
        nestedIncludes += 1;
      }

      i += 1;
    }

    if (nestedIncludes >= 2) {
      hits.push({ start, nestedIncludes });
    }
  }

  return hits;
}

function main() {
  const warnings = [];
  const failures = [];

  const files = walkTsFiles(apiPath);
  let heavyCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const hits = findHeavyIncludes(content);
    if (hits.length > 0) {
      heavyCount += hits.length;
      warnings.push(`${path.relative(root, file)} has ${hits.length} heavy include blocks`);
    }
  }

  if (heavyCount > 40) {
    failures.push(`Too many heavy include blocks detected: ${heavyCount}`);
  }

  reportAndExit(warnings, failures);
}

function reportAndExit(warnings, failures) {
  console.log("DB Heavy Prisma Include Check");
  console.log(`mode=${mode}`);

  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings.slice(0, 50)) {
      console.log(`- ${warning}`);
    }
    if (warnings.length > 50) {
      console.log(`- ... and ${warnings.length - 50} more`);
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
