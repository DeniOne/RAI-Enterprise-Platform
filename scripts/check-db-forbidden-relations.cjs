#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "packages/prisma-client/schema.prisma");
const prismaServicePath = path.join(
  root,
  "apps/api/src/shared/prisma/prisma.service.ts",
);

const forbiddenCompanyRootModels = [
  "AgentConfiguration",
  "AgentCapabilityBinding",
  "AgentToolBinding",
  "AgentConnectorBinding",
  "AgentConfigChangeRequest",
  "RuntimeGovernanceEvent",
  "SystemIncident",
  "IncidentRunbookExecution",
  "PendingAction",
  "PerformanceMetric",
  "EvalRun",
  "MemoryInteraction",
  "MemoryEpisode",
  "MemoryProfile",
  "EventConsumption",
  "OutboxMessage",
];

function parseModelBlocks(schemaText) {
  const blocks = new Map();
  const regex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = regex.exec(schemaText)) !== null) {
    blocks.set(match[1], match[2]);
  }
  return blocks;
}

function hasDirectCompanyRelation(block) {
  const lines = block.split(/\r?\n/).map((line) => line.trim());
  for (const line of lines) {
    if (!line || line.startsWith("//")) {
      continue;
    }
    const normalized = line.replace(/\s+/g, " ");
    if (normalized.includes(" Company") && normalized.includes("@relation")) {
      return true;
    }
  }
  return false;
}

function hasEventConsumptionConflict(prismaServiceText) {
  const tenantScopedContains = /tenantScopedModels[\s\S]*?\[([\s\S]*?)\]/m.exec(
    prismaServiceText,
  );
  const systemContains = /systemNonTenantModels[\s\S]*?\[([\s\S]*?)\]/m.exec(
    prismaServiceText,
  );

  if (!tenantScopedContains || !systemContains) {
    return false;
  }

  const tenantSet = tenantScopedContains[1];
  const systemSet = systemContains[1];
  return tenantSet.includes('"EventConsumption"') && systemSet.includes('"EventConsumption"');
}

function main() {
  const warnings = [];
  const failures = [];

  if (!fs.existsSync(schemaPath)) {
    failures.push(`Missing schema: ${schemaPath}`);
    reportAndExit(warnings, failures);
    return;
  }

  if (!fs.existsSync(prismaServicePath)) {
    failures.push(`Missing PrismaService: ${prismaServicePath}`);
    reportAndExit(warnings, failures);
    return;
  }

  const schema = fs.readFileSync(schemaPath, "utf8");
  const prismaService = fs.readFileSync(prismaServicePath, "utf8");

  const blocks = parseModelBlocks(schema);

  for (const modelName of forbiddenCompanyRootModels) {
    const block = blocks.get(modelName);
    if (!block) {
      warnings.push(`Model ${modelName} not found in schema`);
      continue;
    }

    if (hasDirectCompanyRelation(block)) {
      warnings.push(
        `Model ${modelName} has direct Company relation. Track for Company de-rooting backlog`,
      );
    }
  }

  if (hasEventConsumptionConflict(prismaService)) {
    failures.push(
      "EventConsumption is present in both tenantScopedModels and systemNonTenantModels",
    );
  }

  reportAndExit(warnings, failures);
}

function reportAndExit(warnings, failures) {
  console.log("DB Forbidden Relations and Policy Check");
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
