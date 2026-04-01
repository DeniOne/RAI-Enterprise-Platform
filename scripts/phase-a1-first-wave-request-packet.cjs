#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const STATUS_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-status.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a1-first-wave-request-packet.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a1-first-wave-request-packet.md");

const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const DELIVERY_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A1-FIRST-WAVE");
const DELIVERY_FILE = path.join(DELIVERY_DIR, "REQUEST_PACKET.md");

const FIRST_WAVE = [
  {
    referenceId: "ELP-20260328-01",
    title: "Operator identity and role memo",
    priority: 1,
    draftPath: path.join(
      RESTRICTED_ROOT,
      "drafts",
      "ELP-20260328-01",
      "ELP-20260328-01__repo-derived-draft.md",
    ),
    checklistDoc: path.join(
      ROOT,
      "docs",
      "07_EXECUTION",
      "ONE_BIG_PHASE",
      "PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md",
    ),
    requiredFields:
      "юрлицо, ОГРН/ИНН, адрес, operator/processor split, owner signature, issue date",
  },
  {
    referenceId: "ELP-20260328-03",
    title: "Hosting / residency attestation",
    priority: 2,
    draftPath: path.join(
      RESTRICTED_ROOT,
      "drafts",
      "ELP-20260328-03",
      "ELP-20260328-03__repo-derived-draft.md",
    ),
    checklistDoc: path.join(
      ROOT,
      "docs",
      "07_EXECUTION",
      "ONE_BIG_PHASE",
      "PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md",
    ),
    requiredFields:
      "provider, country, region, account reference, DB/storage residency, contract or invoice reference",
  },
  {
    referenceId: "ELP-20260328-04",
    title: "Processor / subprocessor register + DPA pack",
    priority: 3,
    draftPath: path.join(
      RESTRICTED_ROOT,
      "drafts",
      "ELP-20260328-04",
      "ELP-20260328-04__repo-derived-draft.md",
    ),
    checklistDoc: path.join(
      ROOT,
      "docs",
      "07_EXECUTION",
      "ONE_BIG_PHASE",
      "PHASE_A1_ELP_04_PROCESSOR_DPA_CHECKLIST.md",
    ),
    requiredFields:
      "provider list, role split, country, purpose, data categories, contract reference, DPA reference",
  },
  {
    referenceId: "ELP-20260328-06",
    title: "Lawful basis matrix + privacy notice pack",
    priority: 4,
    draftPath: path.join(
      RESTRICTED_ROOT,
      "drafts",
      "ELP-20260328-06",
      "ELP-20260328-06__repo-derived-draft.md",
    ),
    checklistDoc: path.join(
      ROOT,
      "docs",
      "07_EXECUTION",
      "ONE_BIG_PHASE",
      "PHASE_A1_ELP_06_LAWFUL_BASIS_CHECKLIST.md",
    ),
    requiredFields:
      "lawful basis per flow, consent/no-consent, notice source, linkage to operator and processor perimeter",
  },
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function renderMarkdown(report) {
  const lines = [
    "# Phase A1 First Wave Request Packet",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- total_items: \`${report.totalItems}\``,
    `- requested: \`${report.counts.requested}\``,
    `- received: \`${report.counts.received}\``,
    `- reviewed: \`${report.counts.reviewed}\``,
    `- accepted: \`${report.counts.accepted}\``,
    "",
    "## First Wave",
    "",
    "| Priority | Reference | Status | Owners | Review due | Draft | Checklist |",
    "|---:|---|---|---|---|---|---|",
    ...report.items.map(
      (item) =>
        `| ${item.priority} | \`${item.referenceId}\` | \`${item.status}\` | ${item.namedOwners} | \`${item.reviewDue}\` | \`${item.draftPath}\` | \`${item.checklistDoc}\` |`,
    ),
    "",
    "## Intake Commands",
    "",
  ];

  for (const item of report.items) {
    lines.push(
      `### ${item.referenceId}`,
      "",
      `- title: ${item.title}`,
      `- required_fields: ${item.requiredFields}`,
      "",
      "```bash",
      item.intakeCommand,
      item.reviewCommand,
      item.acceptCommand,
      "pnpm legal:evidence:status",
      "pnpm legal:evidence:verdict",
      "```",
      "",
    );
  }

  lines.push("## Issues", "", report.issues.length === 0 ? "- issues: none" : report.issues.map((issue) => `- ${issue}`).join("\n"), "");
  return lines.join("\n");
}

function renderRestrictedPacket(report) {
  const lines = [
    "# PHASE A1 First Wave Request Packet",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- total_items: ${report.totalItems}`,
    `- source_packet: ${report.sourcePacket}`,
    "",
    "## Что входит в первую волну",
    "",
    "- `ELP-20260328-01` — operator identity and role memo",
    "- `ELP-20260328-03` — hosting / residency attestation",
    "- `ELP-20260328-04` — processor / subprocessor register + DPA pack",
    "- `ELP-20260328-06` — lawful basis matrix + privacy notice pack",
    "",
    "## Packet Rows",
    "",
    "| Priority | Reference | Current status | Named owners | Draft path | Required fields |",
    "|---:|---|---|---|---|---|",
    ...report.items.map(
      (item) =>
        `| ${item.priority} | ${item.referenceId} | ${item.status} | ${item.namedOwners} | ${item.draftPath} | ${item.requiredFields} |`,
    ),
    "",
    "## Intake Flow",
    "",
    "```bash",
    "pnpm legal:evidence:intake -- --reference=ELP-20260328-01 --source=/abs/path/file",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=reviewed",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=accepted",
    "pnpm legal:evidence:verdict",
    "```",
    "",
    "Повторить тот же цикл для `ELP-20260328-03`, `ELP-20260328-04`, `ELP-20260328-06`.",
    "",
    "## Напоминание",
    "",
    "- Этот packet не заменяет signed external evidence.",
    "- Он нужен, чтобы owner-очередь первой legal-волны открывалась одним файлом.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const dryRun = process.argv.includes("--dry-run");

  if (!fs.existsSync(STATUS_JSON)) {
    console.error(`[phase-a1-first-wave-request-packet] missing_status_json=${STATUS_JSON}; сначала запусти pnpm legal:evidence:status`);
    process.exit(1);
  }

  const statusReport = readJson(STATUS_JSON);
  const statusByReference = new Map((statusReport.items || []).map((item) => [item.referenceId, item]));
  const issues = [];

  const items = FIRST_WAVE.map((definition) => {
    const current = statusByReference.get(definition.referenceId);
    if (!current) {
      issues.push(`missing status row for ${definition.referenceId}`);
    }
    if (!fs.existsSync(definition.draftPath)) {
      issues.push(`missing draft ${definition.draftPath}`);
    }
    if (!fs.existsSync(definition.checklistDoc)) {
      issues.push(`missing checklist ${definition.checklistDoc}`);
    }
    return {
      priority: definition.priority,
      referenceId: definition.referenceId,
      title: definition.title,
      status: current?.status || "missing",
      namedOwners: current?.namedOwners || "-",
      reviewDue: current?.reviewDue || "-",
      draftPath: definition.draftPath.replace(/\\/g, "/"),
      checklistDoc: rel(definition.checklistDoc),
      requiredFields: definition.requiredFields,
      intakeCommand: `pnpm legal:evidence:intake -- --reference=${definition.referenceId} --source=/abs/path/file`,
      reviewCommand: `pnpm legal:evidence:transition -- --reference=${definition.referenceId} --status=reviewed`,
      acceptCommand: `pnpm legal:evidence:transition -- --reference=${definition.referenceId} --status=accepted`,
    };
  });

  const counts = {
    requested: items.filter((item) => item.status === "requested").length,
    received: items.filter((item) => item.status === "received").length,
    reviewed: items.filter((item) => item.status === "reviewed").length,
    accepted: items.filter((item) => item.status === "accepted").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    totalItems: items.length,
    counts,
    items,
    issues,
  };

  ensureDir(OUTPUT_DIR, dryRun);
  ensureDir(DELIVERY_DIR, dryRun);
  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, renderMarkdown(report), dryRun);
  writeText(
    DELIVERY_FILE,
    renderRestrictedPacket({
      ...report,
      sourcePacket: REPORT_JSON.replace(/\\/g, "/"),
    }),
    dryRun,
  );

  console.log("[phase-a1-first-wave-request-packet] summary");
  console.log(`- total_items=${report.totalItems}`);
  console.log(`- requested=${counts.requested}`);
  console.log(`- received=${counts.received}`);
  console.log(`- reviewed=${counts.reviewed}`);
  console.log(`- accepted=${counts.accepted}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- delivery_file=${DELIVERY_FILE.replace(/\\/g, "/")}`);

  if (mode === "enforce" && issues.length > 0) {
    process.exit(1);
  }
}

main();
