#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const INVENTORY_FILE = path.join(OUTPUT_DIR, "workspace-secret-hygiene-inventory.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "workspace-secret-hygiene-remediation-packet.json");
const REPORT_MD = path.join(OUTPUT_DIR, "workspace-secret-hygiene-remediation-packet.md");

const TEMPLATE_MAP = {
  ".env": ".env.example",
  "mg-core/backend/.env": "mg-core/backend/.env.example",
  "mg-core/backend/src/mg-chat/.env": "mg-core/backend/src/mg-chat/.env.example",
  "apps/web/.env.local": ".env.example",
};

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function classifyActionPlan(row) {
  const findingSet = new Set(row.findings || []);
  const steps = [];
  const targetState = [];

  if (row.file === ".env") {
    steps.push("вынести живые root secrets во внешний secret store или restricted evidence packet");
    if (findingSet.has("content:telegram-bot-token")) {
      steps.push("убрать живой `TELEGRAM_BOT_TOKEN` из локального root `.env` и вернуть placeholder-значение уровня `.env.example`");
      targetState.push("root `.env` не содержит живой `TELEGRAM_BOT_TOKEN`");
    }
    if (findingSet.has("content:dadata-key")) {
      steps.push("убрать живые `DADATA_API_KEY` / `DADATA_SECRET_KEY` из локального root `.env` и оставить template-only placeholders");
      targetState.push("root `.env` не содержит живые `DADATA_*` ключи");
    }
    steps.push("оставить в root `.env` только локальные placeholders или non-secret connectivity overrides");
    targetState.push("root `.env` не даёт `critical` content findings");
  } else if (row.file === "mg-core/backend/.env" || row.file === "mg-core/backend/src/mg-chat/.env") {
    steps.push("подтвердить rotation Telegram token, если legacy contour ещё используется");
    steps.push("убрать живой `TELEGRAM_BOT_TOKEN` из legacy `.env` и вернуть placeholder из соответствующего `.env.example`");
    steps.push("если legacy contour не используется в текущем runtime, оставить только template-only файл и не держать живой токен локально");
    targetState.push("legacy `.env` не содержит живой `TELEGRAM_BOT_TOKEN`");
    targetState.push("legacy `.env` не даёт `critical` content findings");
  } else if (row.file === "apps/web/.env.local") {
    steps.push("не хранить секреты в `apps/web/.env.local`; использовать его только как untracked local override при реальной необходимости");
    steps.push("если файл дублирует root connectivity contract, удалить локальный override или оставить только non-secret значения");
    targetState.push("`apps/web/.env.local` не содержит secret-like content");
    targetState.push("файл остаётся только warning-level local override либо отсутствует");
  } else {
    steps.push("вынести живые секреты во внешний secret store или restricted packet");
    steps.push("оставить в локальном файле только sanitized placeholders");
    targetState.push("локальный файл не даёт `critical` content findings");
  }

  return { steps, targetState };
}

function buildPacketRows(inventory) {
  return (inventory.workspaceFiles || []).map((row, index) => {
    const templatePath = TEMPLATE_MAP[row.file] || null;
    const templateExists = templatePath ? fileExists(templatePath) : false;
    const actionPlan = classifyActionPlan(row);

    return {
      id: `R2-P-${String(index + 1).padStart(2, "0")}`,
      file: row.file,
      contour: row.contour,
      ownerHint: row.ownerHint,
      severity: row.severities || [],
      findings: row.findings || [],
      hasCritical: Boolean(row.hasCritical),
      templatePath,
      templateExists,
      recommendedAction: row.recommendedAction,
      steps: actionPlan.steps,
      targetState: actionPlan.targetState,
      verification: {
        inventoryCommand: "pnpm security:workspace-hygiene:inventory",
        gateCommand: "pnpm gate:security:workspace-hygiene",
        successCondition:
          row.hasCritical
            ? `файл \`${row.file}\` больше не попадает в critical findings`
            : `файл \`${row.file}\` остаётся только warning-level local override`,
      },
    };
  });
}

function renderIssues(rows) {
  const issues = [];
  for (const row of rows) {
    if (row.templatePath && !row.templateExists) {
      issues.push({
        type: "missing_template_path",
        file: row.file,
        value: row.templatePath,
      });
    }
  }
  return issues;
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) return "- none";
  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.file) parts.push(`file=\`${issue.file}\``);
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function renderRowsMarkdown(rows) {
  const header = [
    "| Packet | File | Severity | Template | Primary action |",
    "|---|---|---|---|---|",
  ];
  const body = rows.map((row) => {
    const templateValue = row.templatePath
      ? `${row.templatePath}${row.templateExists ? "" : " (missing)"}`
      : "n/a";
    return `| \`${row.id}\` | \`${row.file}\` | \`${row.severity.join(", ")}\` | \`${templateValue}\` | ${row.recommendedAction} |`;
  });
  return header.concat(body).join("\n");
}

function main() {
  if (!fs.existsSync(INVENTORY_FILE)) {
    console.error(
      `[workspace-secret-hygiene-remediation-packet] missing ${rel(INVENTORY_FILE)}; run pnpm security:workspace-hygiene:inventory first`,
    );
    process.exit(1);
  }

  const inventory = readJson(INVENTORY_FILE);
  const rows = buildPacketRows(inventory);
  const issues = renderIssues(rows);
  const criticalRows = rows.filter((row) => row.hasCritical);
  const status = issues.length > 0 ? "blocked" : "prepared";
  const verdict = issues.length > 0
    ? "workspace_secret_remediation_packet_blocked"
    : "workspace_secret_remediation_packet_ready";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "R2",
    status,
    issues,
    evidenceRefs: [
      rel(INVENTORY_FILE),
      ".env.example",
      "mg-core/backend/.env.example",
      "mg-core/backend/src/mg-chat/.env.example",
      "docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md",
    ],
    nextAction:
      criticalRows.length > 0
        ? "обработать критичные packet-строки сверху вниз и затем повторить inventory/gate"
        : "удерживать template-only rule и повторять inventory после изменений local env",
    verdict,
    summary: {
      totalRows: rows.length,
      criticalRows: criticalRows.length,
      warningOnlyRows: rows.filter((row) => !row.hasCritical).length,
    },
    rows,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Workspace Secret Hygiene Remediation Packet",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- total_rows: \`${report.summary.totalRows}\``,
    `- critical_rows: \`${report.summary.criticalRows}\``,
    `- warning_only_rows: \`${report.summary.warningOnlyRows}\``,
    `- next_action: ${report.nextAction}`,
    "",
    "## Issues",
    renderIssuesMarkdown(report.issues),
    "",
    "## Packet",
    renderRowsMarkdown(report.rows),
    "",
    "## Per-file steps",
    ...report.rows.flatMap((row) => [
      `### ${row.id} ${row.file}`,
      "",
      `- contour: \`${row.contour}\``,
      `- owner_hint: \`${row.ownerHint}\``,
      `- severity: \`${row.severity.join(", ")}\``,
      `- findings: \`${row.findings.join(", ")}\``,
      `- template: \`${row.templatePath || "n/a"}\``,
      "- steps:",
      ...row.steps.map((step) => `  - ${step}`),
      "- target_state:",
      ...row.targetState.map((state) => `  - ${state}`),
      `- verification_inventory: \`${row.verification.inventoryCommand}\``,
      `- verification_gate: \`${row.verification.gateCommand}\``,
      `- success_condition: ${row.verification.successCondition}`,
      "",
    ]),
  ].join("\n");

  fs.writeFileSync(REPORT_MD, `${md}\n`);

  console.log(`[workspace-secret-hygiene-remediation-packet] json=${rel(REPORT_JSON)}`);
  console.log(`[workspace-secret-hygiene-remediation-packet] md=${rel(REPORT_MD)}`);
  console.log(`[workspace-secret-hygiene-remediation-packet] status=${status}`);
  console.log(`[workspace-secret-hygiene-remediation-packet] verdict=${verdict}`);
  console.log(`[workspace-secret-hygiene-remediation-packet] critical_rows=${report.summary.criticalRows}`);
}

main();
