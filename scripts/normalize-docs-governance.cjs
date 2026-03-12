#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(ROOT, "docs");

const REQUIRED_KEYS = new Set(["id", "layer", "type", "status", "version"]);

const LAYER_CODE = {
  Strategy: "STR",
  Architecture: "ARC",
  Domain: "DOM",
  Product: "PRD",
  Engineering: "ENG",
  Operations: "OPS",
  Metrics: "MET",
  Execution: "EXE",
  Testing: "TST",
  Frontend: "FRN",
  Instructions: "INS",
  Archive: "ARV",
  Meta: "META",
};

const ROOT_CLASSIFICATION = {
  "README.md": { layer: "Meta", type: "Navigation" },
  "INDEX.md": { layer: "Meta", type: "Navigation" },
  "1️⃣ Архитектурный профиль системы.md": {
    layer: "Architecture",
    type: "HLD",
  },
  "ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md": {
    layer: "Architecture",
    type: "ADR",
  },
  "ANTIGRAVITY SOFTWARE FACTORY — FINALIZATION PROMPT.md": {
    layer: "Archive",
    type: "Legacy",
  },
  "ANTIGRAVITY SOFTWARE FACTORY — ORCHESTRATOR PROMPT.md": {
    layer: "Archive",
    type: "Legacy",
  },
  "ANTIGRAVITY SOFTWARE FACTORY — REVIEW PACKET PROMPT.md": {
    layer: "Archive",
    type: "Legacy",
  },
  "API_OUTBOX_FINANCE_SLO_SLI_ERROR_BUDGET_POLICY_RU.md": {
    layer: "Operations",
    type: "Policy",
  },
  "ARCHITECTURAL CONSISTENCY CHECK (RAI_EP).md": {
    layer: "Architecture",
    type: "Report",
  },
  "ARCHITECTURAL_CONSISTENCY_CHECK_REPORT.md": {
    layer: "Architecture",
    type: "Report",
  },
  "CHAOS_GAME_DAY_RUNBOOK_RU.md": {
    layer: "Operations",
    type: "Runbook",
  },
  "CURSOR SOFTWARE FACTORY — STARTER PROMPT.md": {
    layer: "Archive",
    type: "Legacy",
  },
  "EMERGENCY_TENANT_ISOLATION_SCAN_REPORT.md": {
    layer: "Operations",
    type: "Incident Report",
  },
  "FORENSIC_TECHNICAL_AUDIT_RU.md": {
    layer: "Operations",
    type: "Incident Report",
  },
  "FOUNDATION_STABILIZATION_CHECKLIST_RU.md": {
    layer: "Execution",
    type: "Checklist",
  },
  "INVARIANT_ALERT_RUNBOOK_RU.md": {
    layer: "Operations",
    type: "Runbook",
  },
  "INVARIANT_MATURITY_DASHBOARD_RU.md": {
    layer: "Metrics",
    type: "Report",
  },
  "INVARIANT_SLO_POLICY_RU.md": {
    layer: "Operations",
    type: "Policy",
  },
  "LEVEL_D_ARCHITECTURE.md": {
    layer: "Architecture",
    type: "HLD",
  },
  "MONTHLY_FORENSIC_REAUDIT_RUNBOOK_RU.md": {
    layer: "Operations",
    type: "Runbook",
  },
  "OUTBOX_TENANT_CONTRACT_MIGRATION_DRAFT_RU.md": {
    layer: "Engineering",
    type: "Implementation Plan",
  },
  "Promt_RAI_EP_Ai_local_backup.md": {
    layer: "Archive",
    type: "Legacy",
  },
  "TENANT_ENFORCEMENT_RECOVERY_STRATEGY.md": {
    layer: "Operations",
    type: "Runbook",
  },
  "TENANT_MIDDLEWARE_SHADOW_TO_ENFORCE_ROLLOUT_RU.md": {
    layer: "Execution",
    type: "Phase Plan",
  },
  "WEEK1_INVARIANT_BASELINE_RU.md": {
    layer: "Operations",
    type: "Report",
  },
  "WEEK2_PROGRESS_RU.md": {
    layer: "Operations",
    type: "Report",
  },
  "WEEKLY_INVARIANT_TREND_REVIEW_RU.md": {
    layer: "Operations",
    type: "Report",
  },
};

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === ".git" || name === "node_modules") continue;
      walk(full, acc);
    } else if (name.endsWith(".md")) {
      acc.push(full);
    }
  }
  return acc;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toUpperCase();
}

function hash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(6, "0");
}

function extractFrontmatter(raw) {
  const content = raw.replace(/^\uFEFF/, "");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: "", body: content, hadFrontmatter: false };
  }
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
    hadFrontmatter: true,
  };
}

function stripSecondaryFrontmatter(body) {
  const withoutBom = body.replace(/^\uFEFF/, "");
  const leading = withoutBom.match(/^\s*/)?.[0] || "";
  const trimmed = withoutBom.slice(leading.length);
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return withoutBom;

  const looksLikeHeader = match[1]
    .split(/\r?\n/)
    .some((line) => /^[A-Za-z_][A-Za-z0-9_-]*\s*:/.test(line.trim()));
  if (!looksLikeHeader) return withoutBom;

  return leading + trimmed.slice(match[0].length).replace(/^\s+/, "");
}

function parseHeaderLines(frontmatter) {
  if (!frontmatter) return { fields: {}, extras: [] };
  const fields = {};
  const extras = [];
  for (const line of frontmatter.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const keyMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    const value = keyMatch[2];
    if (REQUIRED_KEYS.has(key)) {
      fields[key] = value;
    } else {
      extras.push(trimmed);
    }
  }
  return { fields, extras };
}

function normalizeVersion(value, hadFrontmatter) {
  if (value && /^\d+\.\d+\.\d+$/.test(value.trim())) {
    return value.trim();
  }
  return hadFrontmatter ? "1.0.0" : "0.1.0";
}

function normalizeStatus(value, layer, hadFrontmatter) {
  if (layer === "Archive") return "archived";
  const normalized = (value || "").trim().toLowerCase();
  if (["approved", "active", "enforced", "final"].includes(normalized)) {
    return "approved";
  }
  if (["draft", "wip", "planned"].includes(normalized)) {
    return "draft";
  }
  if (["archived", "legacy", "superseded"].includes(normalized)) {
    return "archived";
  }
  return hadFrontmatter ? "approved" : "draft";
}

function buildId(rel, layer) {
  const code = LAYER_CODE[layer] || "DOC";
  const base = rel.replace(/\.md$/i, "").split("/").slice(-2).join("-");
  const slug = slugify(base) || "DOCUMENT";
  const shortSlug = slug.length > 42 ? slug.slice(0, 42) : slug;
  return `DOC-${code}-${shortSlug}-${hash(rel).slice(0, 4)}`;
}

function inferLayer(rel) {
  if (ROOT_CLASSIFICATION[rel]) return ROOT_CLASSIFICATION[rel].layer;

  if (rel.startsWith("00_STRATEGY/STAGE 2/Archive/")) return "Archive";
  if (rel.startsWith("00_STRATEGY/TECHMAP/")) {
    const base = path.basename(rel).toLowerCase();
    if (
      /(chatgpt|gemini|grok|comet|cluade|prompt|promt|synthesis|промт|синтез)/i.test(
        base,
      )
    ) {
      return "Archive";
    }
  }

  if (rel.startsWith("00_STRATEGY/")) return "Strategy";
  if (rel.startsWith("01_ARCHITECTURE/")) return "Architecture";
  if (rel.startsWith("02_DOMAINS/")) return "Domain";
  if (rel.startsWith("03_PRODUCT/")) return "Product";
  if (rel.startsWith("04_ENGINEERING/")) return "Engineering";
  if (rel.startsWith("05_OPERATIONS/")) return "Operations";
  if (rel.startsWith("06_METRICS/")) return "Metrics";
  if (rel.startsWith("07_EXECUTION/")) return "Execution";
  if (rel.startsWith("08_TESTING/")) return "Testing";
  if (rel.startsWith("09_ARCHIVE/")) return "Archive";
  if (rel.startsWith("10_FRONTEND_MENU_IMPLEMENTATION/")) return "Frontend";
  if (rel.startsWith("11_INSTRUCTIONS/")) return "Instructions";

  return "Archive";
}

function inferType(rel, layer) {
  if (ROOT_CLASSIFICATION[rel]) return ROOT_CLASSIFICATION[rel].type;

  const base = path.basename(rel, ".md");
  const lower = rel.toLowerCase();
  const relStem = lower.replace(/\.md$/i, "");
  const baseLower = base.toLowerCase();

  if (layer === "Meta") return "Navigation";
  if (layer === "Instructions") {
    return /(^|\/)index$/i.test(relStem) ? "InstructionIndex" : "Instruction";
  }
  if (layer === "Testing") {
    return /(audit|bias)/i.test(base) ? "Audit" : "Test Spec";
  }
  if (layer === "Frontend") {
    if (/(^|\/)(readme|index)$/i.test(relStem)) return "Navigation";
    if (/(menu|master_menu_map)/i.test(base)) return "Menu Map";
    if (/(template|prompt)/i.test(base)) return "Template";
    if (/(checklist|debt)/i.test(base)) return "Checklist";
    return "Screen Spec";
  }
  if (layer === "Archive") {
    return /(legacy|old|history|chatgpt|gemini|grok|comet|cluade|prompt|promt|backup|история|промт)/i.test(
      base,
    )
      ? "Legacy"
      : "Research";
  }
  if (layer === "Execution") {
    if (/(prompt|promt)/i.test(base)) return "Prompt";
    if (/(checklist|todo)/i.test(base)) return "Checklist";
    if (/wbs/i.test(base)) return "WBS";
    return "Phase Plan";
  }
  if (layer === "Metrics") {
    return /(report|dashboard|review)/i.test(base) ? "Report" : "KPI Spec";
  }
  if (layer === "Operations") {
    if (/(incident|emergency|forensic|scan)/i.test(base)) {
      return "Incident Report";
    }
    if (/(runbook|recovery)/i.test(base)) return "Runbook";
    if (/policy/i.test(base)) return "Policy";
    return "Report";
  }
  if (layer === "Engineering") {
    if (/(api|contract)/i.test(base)) return "API Contract";
    if (/(database|schema|prisma|data_model|lineage|model)/i.test(base)) {
      return "Database Spec";
    }
    if (/(checklist|todo)/i.test(base)) return "Checklist";
    if (/plan/i.test(base)) return "Implementation Plan";
    if (/(policy|threat|sla)/i.test(base)) return "Policy";
    if (/(report|assessment|drill)/i.test(base)) return "Report";
    return "Service Spec";
  }
  if (layer === "Product") {
    if (/roadmap/i.test(base)) return "Roadmap";
    if (/flow/i.test(base)) return "UX Flow";
    if (/bot/i.test(base)) return "Bot Spec";
    return "UI Spec";
  }
  if (layer === "Domain") {
    if (/(guide|user_guide)/i.test(base)) return "Guide";
    if (/policy/i.test(base)) return "Policy";
    return "Domain Spec";
  }
  if (layer === "Architecture") {
    if (/^adr_/i.test(base) || lower.includes("/decisions/")) return "ADR";
    if (/(topology|composition|c4|map)/i.test(base) || lower.includes("/topology/")) {
      return "Topology";
    }
    if (/(report|audit)/i.test(base)) return "Report";
    if (
      /(principle|canon|standard|policy|invariant|protocol|axiom|governance|trust|privacy|forbidden|admission)/i.test(
        base,
      )
    ) {
      return "Standards";
    }
    return "HLD";
  }
  if (layer === "Strategy") {
    if (/(^|\/)(index|readme)$/i.test(relStem)) return "Navigation";
    if (/(roadmap|plan|master_plan|phase|transition|checklist|todo|backlog|refactor|implementation)/i.test(base)) {
      return "Roadmap";
    }
    if (/(econom|finance|roi|profit|metrics)/i.test(base)) return "Economics";
    return "Vision";
  }
  return "Research";
}

function normalizeFile(file) {
  const rel = path.relative(DOCS_ROOT, file).replace(/\\/g, "/");
  const raw = fs.readFileSync(file, "utf8");
  const { frontmatter, body, hadFrontmatter } = extractFrontmatter(raw);
  const { fields, extras } = parseHeaderLines(frontmatter);
  const cleanedBody = stripSecondaryFrontmatter(body).replace(/^\uFEFF/, "");
  const layer = inferLayer(rel);
  const type = inferType(rel, layer);
  const status = normalizeStatus(fields.status, layer, hadFrontmatter);
  const version = normalizeVersion(fields.version, hadFrontmatter);
  const id = buildId(rel, layer);

  const header = [
    "---",
    `id: ${id}`,
    `layer: ${layer}`,
    `type: ${type}`,
    `status: ${status}`,
    `version: ${version}`,
    ...extras,
    "---",
    "",
  ].join("\n");

  const next = header + cleanedBody.trimStart();
  fs.writeFileSync(file, next.endsWith("\n") ? next : `${next}\n`);
}

function main() {
  const files = walk(DOCS_ROOT).sort();
  for (const file of files) {
    normalizeFile(file);
  }
  console.log(`normalized_docs=${files.length}`);
}

main();
