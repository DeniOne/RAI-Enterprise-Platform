#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(
  root,
  "docs/01_ARCHITECTURE/DATABASE/DOMAIN_OWNERSHIP_MANIFEST.md",
);

const requiredTopDomains = [
  "platform_core",
  "org_legal",
  "agri_planning",
  "agri_execution",
  "finance",
  "crm_commerce",
  "ai_runtime",
  "integration_reliability",
];

const requiredSubContours = [
  "ai_runtime/knowledge_memory",
  "ai_runtime/risk_governance",
  "quarantine_sandbox/research_rd",
  "legacy_bridge",
];

const requiredForbiddenPatterns = [
  "Company",
  "cross-domain",
  "finance",
  "ai_runtime",
  "integration_reliability",
];

function main() {
  const warnings = [];
  const failures = [];

  if (!fs.existsSync(manifestPath)) {
    failures.push(`Missing manifest: ${manifestPath}`);
    reportAndExit(warnings, failures);
    return;
  }

  const content = fs.readFileSync(manifestPath, "utf8");

  for (const domain of requiredTopDomains) {
    if (!content.includes(`\`${domain}\``)) {
      failures.push(`Top-level domain missing in ownership manifest: ${domain}`);
    }
  }

  for (const sub of requiredSubContours) {
    if (!content.includes(`\`${sub}\``)) {
      failures.push(`Subcontour missing in ownership manifest: ${sub}`);
    }
  }

  for (const pattern of requiredForbiddenPatterns) {
    if (!content.includes(pattern)) {
      warnings.push(`Ownership manifest missing expected constraint keyword: ${pattern}`);
    }
  }

  if (!content.includes("Ownership table")) {
    failures.push("Ownership manifest has no 'Ownership table' section");
  }

  if (!content.includes("## Cross-domain rules")) {
    failures.push("Ownership manifest has no cross-domain rules section");
  }

  reportAndExit(warnings, failures);
}

function reportAndExit(warnings, failures) {
  console.log("DB Domain Ownership Manifest Check");
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
