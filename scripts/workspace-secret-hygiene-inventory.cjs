#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const SOURCE_REPORT = path.join(OUTPUT_DIR, "secret-scan-report.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "workspace-secret-hygiene-inventory.json");
const REPORT_MD = path.join(OUTPUT_DIR, "workspace-secret-hygiene-inventory.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function classifyContour(file) {
  if (file === ".env") return "repo-root";
  if (file.startsWith("apps/web/")) return "apps/web";
  if (file.startsWith("apps/api/")) return "apps/api";
  if (file.startsWith("apps/telegram-bot/")) return "apps/telegram-bot";
  if (file.startsWith("mg-core/backend/src/mg-chat/")) return "mg-core/mg-chat";
  if (file.startsWith("mg-core/backend/")) return "mg-core/backend";
  const parts = file.split("/");
  return parts.length > 1 ? parts.slice(0, 2).join("/") : "workspace-root";
}

function ownerHint(contour) {
  switch (contour) {
    case "repo-root":
      return "techlead / ops";
    case "apps/web":
      return "web / techlead";
    case "apps/api":
      return "backend / techlead";
    case "apps/telegram-bot":
      return "bot-owner / backend";
    case "mg-core/backend":
    case "mg-core/mg-chat":
      return "legacy-owner / bot-owner / techlead";
    default:
      return "techlead";
  }
}

function recommendAction(file, groupedFindings) {
  const ids = new Set(groupedFindings.map((finding) => finding.id));
  const hasCritical = groupedFindings.some((finding) => finding.severity === "critical");

  if (file === ".env") {
    return hasCritical
      ? "вынести живые root secrets во внешний secret store или restricted packet, затем заменить локальный `.env` на sanitized placeholders"
      : "оставить только template-переменные и убедиться, что runtime bootstrap не зависит от живого секрета в repo-root `.env`";
  }

  if (file === "apps/web/.env.local") {
    return hasCritical
      ? "вынести web local secrets из `.env.local`, оставить только sanitized local overrides или `.env.example`-эквивалент"
      : "сохранить файл только как untracked local override без реальных секретов; использовать sanitized placeholders для onboarding";
  }

  if (file === "mg-core/backend/.env" || file === "mg-core/backend/src/mg-chat/.env") {
    if (ids.has("telegram-bot-token")) {
      return "подтвердить rotation Telegram token, убрать живой токен из legacy `.env`, перенести секрет во внешний store и оставить только sanitized placeholders";
    }
    return "убрать живые legacy secrets из локального `.env`, перенести их во внешний store и оставить только sanitized placeholders";
  }

  return hasCritical
    ? "вынести живые секреты во внешний store или restricted packet, затем оставить только sanitized placeholders"
    : "оставить только untracked local template без живых секретов";
}

function findingsForFile(groupedFindings) {
  return unique(groupedFindings.map((finding) => `${finding.type}:${finding.id}`));
}

function severitiesForFile(groupedFindings) {
  const order = { critical: 3, warning: 2, low: 1 };
  return unique(groupedFindings.map((finding) => finding.severity)).sort(
    (left, right) => (order[right] || 0) - (order[left] || 0),
  );
}

function summarizeWorkspaceFindings(findings) {
  const grouped = new Map();
  for (const finding of findings) {
    if (!grouped.has(finding.file)) {
      grouped.set(finding.file, []);
    }
    grouped.get(finding.file).push(finding);
  }

  return Array.from(grouped.entries())
    .map(([file, fileFindings]) => {
      const contour = classifyContour(file);
      return {
        file,
        contour,
        ownerHint: ownerHint(contour),
        findingCount: fileFindings.length,
        severities: severitiesForFile(fileFindings),
        findings: findingsForFile(fileFindings),
        hasCritical: fileFindings.some((finding) => finding.severity === "critical"),
        recommendedAction: recommendAction(file, fileFindings),
      };
    })
    .sort((left, right) => {
      if (left.hasCritical !== right.hasCritical) {
        return left.hasCritical ? -1 : 1;
      }
      return left.file.localeCompare(right.file);
    });
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- none";
  }

  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.file) parts.push(`file=\`${issue.file}\``);
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function renderTable(rows) {
  const header = [
    "| File | Contour | Severity | Findings | Recommended action |",
    "|---|---|---|---|---|",
  ];

  const body = rows.map((row) => {
    return `| \`${row.file}\` | \`${row.contour}\` | \`${row.severities.join(", ")}\` | \`${row.findings.join(", ")}\` | ${row.recommendedAction} |`;
  });

  return header.concat(body).join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";

  if (!fs.existsSync(SOURCE_REPORT)) {
    console.error(
      `[workspace-secret-hygiene-inventory] missing ${rel(SOURCE_REPORT)}; run pnpm gate:secrets first`,
    );
    process.exit(1);
  }

  const source = readJson(SOURCE_REPORT);
  const trackedFindings = ensureArray(source.trackedFindings);
  const workspaceLocalFindings = ensureArray(source.workspaceLocalFindings);
  const workspaceRows = summarizeWorkspaceFindings(workspaceLocalFindings);

  const trackedCriticalCount = trackedFindings.filter((finding) => finding.severity === "critical").length;
  const localCriticalCount = workspaceLocalFindings.filter((finding) => finding.severity === "critical").length;
  const localWarningCount = workspaceLocalFindings.filter((finding) => finding.severity === "warning").length;

  let status = "done";
  let verdict = "workspace_secret_hygiene_clear";
  if (trackedCriticalCount > 0) {
    status = "blocked";
    verdict = "tracked_secret_regression";
  } else if (localCriticalCount > 0) {
    status = "in_progress";
    verdict = "workspace_local_secret_cleanup_required";
  } else if (workspaceLocalFindings.length > 0) {
    status = "done";
    verdict = "workspace_local_warning_only";
  }

  const issues = [];
  if (trackedCriticalCount > 0) {
    issues.push({
      type: "tracked_critical_findings_present",
      value: String(trackedCriticalCount),
    });
  }
  for (const row of workspaceRows) {
    if (!row.hasCritical) continue;
    issues.push({
      type: "workspace_file_contains_critical_secret_patterns",
      file: row.file,
      value: row.findings.join(", "),
    });
  }

  const nextAction =
    localCriticalCount > 0
      ? "сначала убрать critical content findings из локальных `.env`, не меняя tracked repo-state"
      : workspaceLocalFindings.length > 0
        ? "удерживать local `.env` только как untracked warning-level files без живых секретов и не допускать возврата critical content findings"
        : "удерживать clean local secret baseline и не допускать возврата critical local findings";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "R2",
    sourceReport: rel(SOURCE_REPORT),
    status,
    issues,
    evidenceRefs: [
      rel(SOURCE_REPORT),
      "docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md",
      "docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md",
    ],
    nextAction,
    verdict,
    summary: {
      trackedFindings: trackedFindings.length,
      trackedCritical: trackedCriticalCount,
      workspaceLocalFindings: workspaceLocalFindings.length,
      workspaceLocalCritical: localCriticalCount,
      workspaceLocalWarning: localWarningCount,
      filesWithFindings: workspaceRows.length,
    },
    workspaceFiles: workspaceRows,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Workspace Secret Hygiene Inventory",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- source_report: \`${report.sourceReport}\``,
    `- tracked_findings: \`${report.summary.trackedFindings}\``,
    `- tracked_critical: \`${report.summary.trackedCritical}\``,
    `- workspace_local_findings: \`${report.summary.workspaceLocalFindings}\``,
    `- workspace_local_critical: \`${report.summary.workspaceLocalCritical}\``,
    `- workspace_local_warning: \`${report.summary.workspaceLocalWarning}\``,
    `- files_with_findings: \`${report.summary.filesWithFindings}\``,
    `- next_action: ${report.nextAction}`,
    "",
    "## Issues",
    renderIssuesMarkdown(report.issues),
    "",
    "## Inventory",
    renderTable(report.workspaceFiles),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, `${md}\n`);

  console.log(`[workspace-secret-hygiene-inventory] json=${rel(REPORT_JSON)}`);
  console.log(`[workspace-secret-hygiene-inventory] md=${rel(REPORT_MD)}`);
  console.log(`[workspace-secret-hygiene-inventory] status=${status}`);
  console.log(`[workspace-secret-hygiene-inventory] verdict=${verdict}`);
  console.log(
    `[workspace-secret-hygiene-inventory] workspace_local_critical=${report.summary.workspaceLocalCritical}`,
  );

  if (mode === "enforce" && status !== "done") {
    process.exit(1);
  }
}

main();
