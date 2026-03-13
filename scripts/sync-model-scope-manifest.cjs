#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "packages/prisma-client/schema.prisma");
const domainMapPath = path.join(root, "docs/01_ARCHITECTURE/DATABASE/DB_DOMAIN_MAP.md");
const manifestPath = path.join(root, "docs/01_ARCHITECTURE/DATABASE/MODEL_SCOPE_MANIFEST.md");

const phase1Models = new Set([
  "TenantState",
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
  "EventConsumption",
  "MemoryInteraction",
  "MemoryEpisode",
  "MemoryProfile",
]);

const presetModels = new Set([
  "Rapeseed",
  "CropVariety",
  "BusinessRule",
  "RegionProfile",
  "InputCatalog",
  "HybridPhenologyModel",
  "Engram",
  "SemanticFact",
]);

const businessModels = new Set(["Company", "Party", "CommerceContract"]);
const systemModels = new Set(["OutboxMessage"]);
const ownerOverrides = new Map([
  ["HrOnboardingPlan", "platform_core"],
  ["HrSupportCase", "platform_core"],
  ["OkrCycle", "platform_core"],
  ["Objective", "platform_core"],
  ["KeyResult", "platform_core"],
  ["HrKPIIndicator", "platform_core"],
  ["HrRecognitionEvent", "platform_core"],
  ["HrRewardEvent", "platform_core"],
  ["PulseSurvey", "platform_core"],
  ["SurveyResponse", "platform_core"],
  ["HumanAssessmentSnapshot", "platform_core"],
  ["PersonalCompetencyState", "platform_core"],
  ["HrDevelopmentPlan", "platform_core"],
  ["HrDevelopmentAction", "platform_core"],
]);

function parseSchemaModels(schemaText) {
  const models = [];
  const re = /^model\s+(\w+)\s*\{/gm;
  let m;
  while ((m = re.exec(schemaText)) !== null) {
    models.push(m[1]);
  }
  return models;
}

function parseExistingRows(markdown) {
  const rows = new Map();
  const lines = markdown.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return rows;

  const headers = lines[0]
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());

  for (const line of lines.slice(2)) {
    if (/^\|[\s:-]+\|$/.test(line.trim())) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length !== headers.length) continue;
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i];
    });
    const modelCell = unwrap(row["Model"] || "");
    if (!modelCell) continue;
    rows.set(modelCell, {
      owner: unwrap(row["Owner domain"]),
      scope: unwrap(row["Scope type"]),
      key: unwrap(row["Authoritative key"]),
      companyPolicy: unwrap(row["companyId policy"]),
      tenantPolicy: unwrap(row["tenantId policy"]),
      globalRow: unwrap(row["Global row"]),
      presetRow: unwrap(row["Preset row"]),
      phase: unwrap(row["Migration phase"]),
      notes: unwrap(row["Notes"]),
    });
  }

  return rows;
}

function unwrap(value) {
  const v = String(value || "").trim();
  const m = v.match(/`([^`]+)`/);
  return (m ? m[1] : v).trim();
}

function normalizeSection(raw) {
  const v = raw.trim().toLowerCase();
  if (v === "platform_core") return "platform_core";
  if (v === "org_legal") return "org_legal";
  if (v === "agri_planning") return "agri_planning";
  if (v === "agri_execution") return "agri_execution";
  if (v === "finance") return "finance";
  if (v === "crm_commerce") return "crm_commerce";
  if (v === "ai_runtime") return "ai_runtime";
  if (v === "integration_reliability") return "integration_reliability";
  if (v.includes("knowledge_memory")) return "ai_runtime/knowledge_memory";
  if (v.includes("risk_governance")) return "ai_runtime/risk_governance";
  if (v.includes("research_rd")) return "quarantine_sandbox/research_rd";
  return null;
}

function parseDomainAssignments(domainMap, modelSet) {
  const lines = domainMap.split(/\r?\n/);
  const assignments = new Map();
  let current = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+`([^`]+)`\s*$/);
    const h3 = line.match(/^###\s+(.+)$/);

    if (h2) {
      current = normalizeSection(h2[1]);
      continue;
    }

    if (h3) {
      current = normalizeSection(h3[1]);
      continue;
    }

    if (!current) continue;

    const matches = Array.from(line.matchAll(/`([^`]+)`/g)).map((m) => m[1]);
    for (const token of matches) {
      if (!modelSet.has(token)) continue;
      if (!assignments.has(token)) {
        assignments.set(token, current);
      }
    }
  }

  return assignments;
}

function defaultScope(owner, model) {
  if (presetModels.has(model)) return "preset";
  if (businessModels.has(model)) return "business";
  if (systemModels.has(model)) return "system";
  if (phase1Models.has(model)) return "mixed-transition";

  if (owner === "org_legal") return "business";
  if (owner === "crm_commerce") return "business";
  if (owner === "integration_reliability") return "system";
  if (owner === "platform_core") return "system";
  if (owner === "quarantine_sandbox/research_rd") return "preset";
  return "tenant";
}

function defaultCompanyPolicy(scope) {
  if (scope === "business") return "required";
  if (scope === "tenant") return "required";
  if (scope === "mixed-transition") return "temporary optional";
  if (scope === "preset") return "optional";
  if (scope === "global") return "forbidden";
  if (scope === "system") return "optional";
  return "optional";
}

function defaultTenantPolicy(scope, model) {
  if (scope === "mixed-transition") return phase1Models.has(model) ? "add nullable in phase_1" : "deferred";
  if (scope === "tenant") return "deferred";
  if (scope === "business") return "deferred";
  if (scope === "preset") return "deferred";
  if (scope === "global") return "required";
  if (scope === "system") return "forbidden";
  return "deferred";
}

function defaultGlobalRow(scope) {
  return scope === "system" || scope === "preset" || scope === "global" ? "yes" : "no";
}

function defaultPresetRow(scope) {
  return scope === "preset" ? "yes" : "no";
}

function defaultPhase(scope, model) {
  if (phase1Models.has(model)) return "phase_1";
  if (scope === "preset") return "phase_2";
  if (businessModels.has(model)) return "phase_2";
  if (scope === "system") return "phase_2";
  return "phase_3_plus";
}

function defaultNotes(owner, model, scope) {
  if (model === "Company") return "business/legal anchor; not platform root";
  if (model === "EventConsumption") return "classification conflict resolved; target control-plane semantics";
  if (phase1Models.has(model)) return "control-plane migration candidate";
  if (scope === "preset") return "explicit preset/global scope required";
  if (owner === "unclassified") return "needs explicit owner review";
  return "";
}

function tick(v) {
  return `\`${v}\``;
}

function buildManifest(rows) {
  const header = `# MODEL_SCOPE_MANIFEST\n\n## Purpose\n\nЭто канонический scope-manifest для tenancy и boundary governance.\n\nЖесткое правило:\n- модель без manifest-классификации не может участвовать в tenancy migration;\n- новая модель не может быть добавлена без scope decision;\n- \`companyId = NULL\` не может использоваться как неформальная замена \`global\` или \`preset\` scope.\n\n## Scope taxonomy\n\nДопустимые \`scope_type\`:\n- \`tenant\`\n- \`business\`\n- \`global\`\n- \`preset\`\n- \`system\`\n- \`mixed-transition\`\n\n## Full inventory coverage (current contour)\n\n| Model | Owner domain | Scope type | Authoritative key | companyId policy | tenantId policy | Global row | Preset row | Migration phase | Notes |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;

  const body = rows
    .map((r) =>
      `| ${tick(r.model)} | ${tick(r.owner)} | ${tick(r.scope)} | ${tick(r.key)} | ${tick(r.companyPolicy)} | ${tick(r.tenantPolicy)} | ${tick(r.globalRow)} | ${tick(r.presetRow)} | ${tick(r.phase)} | ${r.notes ? tick(r.notes) : ""} |`,
    )
    .join("\n");

  const footer = `\n\n## Enforcement rules\n\nНужно проверять в CI:\n- есть ли manifest entry для новой модели;\n- совпадает ли scope manifest с runtime policy;\n- не используется ли \`companyId = NULL\` вне разрешённых preset/global cases;\n- не появился ли новый \`mixed-transition\` model без migration phase;\n- не добавилась ли новая relation на \`Company\` без ADR.\n`;

  return `${header}${body}${footer}`;
}

function main() {
  const schema = fs.readFileSync(schemaPath, "utf8");
  const domainMap = fs.readFileSync(domainMapPath, "utf8");
  const existing = fs.existsSync(manifestPath)
    ? fs.readFileSync(manifestPath, "utf8")
    : "";

  const models = parseSchemaModels(schema).sort((a, b) => a.localeCompare(b));
  const modelSet = new Set(models);
  const existingRows = parseExistingRows(existing);
  const assignments = parseDomainAssignments(domainMap, modelSet);

  const rows = models.map((model) => {
    const existingRow = existingRows.get(model);
    const existingOwner =
      existingRow && existingRow.owner && existingRow.owner !== "unclassified"
        ? existingRow.owner
        : "";
    const owner =
      existingOwner ||
      ownerOverrides.get(model) ||
      assignments.get(model) ||
      "unclassified";

    const scope = (existingRow && existingRow.scope) || defaultScope(owner, model);
    const key = (existingRow && existingRow.key) || "id";
    const companyPolicy =
      (existingRow && existingRow.companyPolicy) || defaultCompanyPolicy(scope);
    const tenantPolicy =
      (existingRow && existingRow.tenantPolicy) || defaultTenantPolicy(scope, model);
    const globalRow =
      (existingRow && existingRow.globalRow) || defaultGlobalRow(scope);
    const presetRow =
      (existingRow && existingRow.presetRow) || defaultPresetRow(scope);
    const phase = (existingRow && existingRow.phase) || defaultPhase(scope, model);
    const notes = (existingRow && existingRow.notes) || defaultNotes(owner, model, scope);

    return {
      model,
      owner,
      scope,
      key,
      companyPolicy,
      tenantPolicy,
      globalRow,
      presetRow,
      phase,
      notes,
    };
  });

  const output = buildManifest(rows);
  fs.writeFileSync(manifestPath, output, "utf8");

  console.log(`Synced manifest: ${manifestPath}`);
  console.log(`Models covered: ${rows.length}`);
}

main();
