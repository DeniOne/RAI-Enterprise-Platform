#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "packages/prisma-client/schema.prisma");

const budget = {
  warnEnums: 150,
  maxEnums: 170,
};

function parseEnumCount(schema) {
  const matches = schema.match(/^enum\s+\w+\s*\{/gm);
  return matches ? matches.length : 0;
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
  const enumCount = parseEnumCount(schema);

  if (enumCount > budget.maxEnums) {
    failures.push(`Enum count ${enumCount} exceeds max ${budget.maxEnums}`);
  } else if (enumCount >= budget.warnEnums) {
    warnings.push(`Enum count ${enumCount} reached warn threshold ${budget.warnEnums}`);
  }

  console.log(`Enum count: ${enumCount}`);
  reportAndExit(warnings, failures);
}

function reportAndExit(warnings, failures) {
  console.log("DB Enum Growth Check");
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
