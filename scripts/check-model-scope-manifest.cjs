#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(
  root,
  "docs/01_ARCHITECTURE/DATABASE/MODEL_SCOPE_MANIFEST.md",
);
const schemaPath = path.join(root, "packages/prisma-client/schema.prisma");

const allowedScopeTypes = new Set([
  "tenant",
  "business",
  "global",
  "preset",
  "system",
  "mixed-transition",
]);

const requiredModels = [
  "Company",
  "TenantState",
  "AgentConfiguration",
  "RuntimeGovernanceEvent",
  "SystemIncident",
  "EventConsumption",
  "OutboxMessage",
  "Season",
  "TechMap",
  "HarvestPlan",
  "Task",
  "EconomicEvent",
  "LedgerEntry",
  "Party",
  "CommerceContract",
  "Engram",
  "SemanticFact",
];

function unwrap(value) {
  const v = String(value || "").trim();
  const m = v.match(/`([^`]+)`/);
  return (m ? m[1] : v).trim();
}

function parseMarkdownTableRows(content) {
  const lines = content.split(/\r?\n/);
  const tableLines = lines.filter((line) => line.trim().startsWith("|"));
  if (tableLines.length < 3) {
    return [];
  }

  const headerCells = tableLines[0]
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());

  const rows = [];
  for (const line of tableLines.slice(2)) {
    const isSeparator = /^\|[\s:-]+\|$/.test(line.trim());
    if (isSeparator) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length !== headerCells.length) {
      continue;
    }

    const row = {};
    for (let i = 0; i < headerCells.length; i += 1) {
      row[headerCells[i]] = cells[i];
    }
    rows.push(row);
  }

  return rows;
}

function main() {
  const warnings = [];
  const failures = [];

  if (!fs.existsSync(manifestPath)) {
    failures.push(`Missing manifest: ${manifestPath}`);
    reportAndExit(warnings, failures);
    return;
  }

  const content = fs.readFileSync(manifestPath, "utf8");
  const rows = parseMarkdownTableRows(content);
  const schema = fs.existsSync(schemaPath)
    ? fs.readFileSync(schemaPath, "utf8")
    : "";
  const schemaModels = parseSchemaModels(schema);

  if (rows.length === 0) {
    failures.push("MODEL_SCOPE_MANIFEST has no parseable table rows");
    reportAndExit(warnings, failures);
    return;
  }

  const modelColumn = "Model";
  const ownerColumn = "Owner domain";
  const scopeColumn = "Scope type";
  const migrationColumn = "Migration phase";

  const models = new Map();

  for (const row of rows) {
    const modelName = unwrap(row[modelColumn]);
    const owner = unwrap(row[ownerColumn]);
    const scope = unwrap(row[scopeColumn]);
    const migrationPhase = unwrap(row[migrationColumn]);

    if (!modelName) {
      warnings.push("Found manifest row without model name");
      continue;
    }

    if (models.has(modelName)) {
      failures.push(`Duplicate manifest row for model: ${modelName}`);
    }

    models.set(modelName, {
      owner,
      scope,
      migrationPhase,
    });

    if (!scope) {
      failures.push(`Model ${modelName} has empty scope type`);
    } else if (!allowedScopeTypes.has(scope)) {
      failures.push(`Model ${modelName} has invalid scope type: ${scope}`);
    }

    if (!owner) {
      failures.push(`Model ${modelName} has empty owner domain`);
    }

    if (!migrationPhase) {
      warnings.push(`Model ${modelName} has empty migration phase`);
    }
  }

  for (const model of requiredModels) {
    if (!models.has(model)) {
      failures.push(`Required model missing in manifest: ${model}`);
    }
  }

  for (const model of schemaModels) {
    if (!models.has(model)) {
      failures.push(`Schema model missing in manifest: ${model}`);
    }
  }

  const mixedTransitionRows = Array.from(models.entries()).filter(
    ([, row]) => row.scope === "mixed-transition",
  );

  for (const [modelName, row] of mixedTransitionRows) {
    if (!String(row.migrationPhase || "").startsWith("phase_")) {
      warnings.push(
        `Model ${modelName} is mixed-transition but migration phase is not explicit`,
      );
    }
  }

  for (const [modelName, row] of models.entries()) {
    if (row.owner === "unclassified") {
      if (mode === "enforce") {
        failures.push(`Model ${modelName} has unclassified owner`);
      } else {
        warnings.push(`Model ${modelName} has unclassified owner`);
      }
    }
  }

  reportAndExit(warnings, failures);
}

function parseSchemaModels(schemaText) {
  const result = [];
  const re = /^model\s+(\w+)\s*\{/gm;
  let m;
  while ((m = re.exec(schemaText)) !== null) {
    result.push(m[1]);
  }
  return result;
}

function reportAndExit(warnings, failures) {
  console.log("DB Scope Manifest Check");
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
