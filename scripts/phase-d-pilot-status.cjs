#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-d-pilot-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-d-pilot-status.md");
const RESTRICTED_ROOT = process.env.PHASE_D_HANDOFF_ROOT
  ? path.resolve(process.env.PHASE_D_HANDOFF_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "pilot-handoffs", "2026-04-01");
const METADATA_DIR = path.join(RESTRICTED_ROOT, "metadata");
const INDEX_FILE = path.join(METADATA_DIR, "INDEX.md");
const ALLOWED_STATUSES = new Set(["requested", "received", "reviewed", "accepted", "expired"]);
const REQUIRED_KEYS = ["status", "owner", "review_due", "artifact_path", "draft_path"];
const STATUS_REQUIRED_KEYS = {
  requested: ["draft_path"],
  received: ["draft_path", "artifact_path", "received_at"],
  reviewed: ["draft_path", "artifact_path", "received_at", "reviewed_at"],
  accepted: ["draft_path", "artifact_path", "received_at", "reviewed_at", "accepted_at"],
  expired: ["draft_path", "expired_at"],
};

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseMetadataFile(filePath) {
  const content = readText(filePath);
  const lines = content.split(/\r?\n/);
  const heading = lines.find((line) => line.startsWith("# ")) || "";
  const fields = {};

  for (const line of lines) {
    const match = line.match(/^- ([^:]+): (.+)$/);
    if (!match) continue;
    fields[match[1].trim()] = match[2].trim();
  }

  const basename = path.basename(filePath);
  const refMatch = basename.match(/^(D-H-\d{2})-/);
  const referenceId = refMatch ? refMatch[1] : "";

  return {
    filePath,
    file: rel(filePath),
    title: heading.replace(/^# /, "").trim(),
    referenceId,
    fields,
  };
}

function parseIndex(content) {
  const items = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^- `([^`]+)` — (.+)$/);
    if (!match) continue;
    items.push({
      referenceId: match[1],
      title: match[2].trim(),
    });
  }
  return items;
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }

  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.referenceId) parts.push(`reference=\`${issue.referenceId}\``);
      if (issue.file) parts.push(`file=\`${issue.file}\``);
      if (issue.fields && issue.fields.length > 0) parts.push(`fields=\`${issue.fields.join(", ")}\``);
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function computeStatus(counts, issues) {
  if (counts.total === 0) return "open";
  if (issues.length > 0) return "in_progress";
  if (counts.requested === 0 && counts.received === 0 && counts.reviewed === 0 && counts.accepted > 0) {
    return "done";
  }
  return "in_progress";
}

function computeVerdict(status) {
  return status === "done" ? "pilot_ready" : "pilot_blocked";
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const today = new Date().toISOString().slice(0, 10);
  const issues = [];

  if (!fs.existsSync(METADATA_DIR)) {
    issues.push({ type: "missing_metadata_dir", file: rel(METADATA_DIR) });
  }
  if (!fs.existsSync(INDEX_FILE)) {
    issues.push({ type: "missing_index_file", file: rel(INDEX_FILE) });
  }

  const indexItems = fs.existsSync(INDEX_FILE) ? parseIndex(readText(INDEX_FILE)) : [];
  const indexMap = new Map(indexItems.map((item) => [item.referenceId, item]));
  const metadataFiles = fs.existsSync(METADATA_DIR)
    ? fs
      .readdirSync(METADATA_DIR)
      .filter((name) => /^D-H-\d{2}.*\.md$/.test(name))
      .sort()
    : [];
  const metadataItems = metadataFiles.map((name) => parseMetadataFile(path.join(METADATA_DIR, name)));

  const counts = {
    total: metadataItems.length,
    requested: 0,
    received: 0,
    reviewed: 0,
    accepted: 0,
    expired: 0,
    overdue: 0,
  };

  const rows = [];

  for (const item of metadataItems) {
    const { referenceId, fields } = item;
    const status = fields.status || "";
    const reviewDue = fields.review_due || "";
    const requiredKeys = REQUIRED_KEYS.filter((key) => !fields[key]);
    const statusRequiredKeys = (STATUS_REQUIRED_KEYS[status] || []).filter((key) => !fields[key]);
    const indexItem = indexMap.get(referenceId);

    if (!referenceId) {
      issues.push({ type: "missing_reference_id", file: item.file });
      continue;
    }
    if (!ALLOWED_STATUSES.has(status)) {
      issues.push({ type: "invalid_status", referenceId, file: item.file, value: status || "<empty>" });
    }
    if (requiredKeys.length > 0) {
      issues.push({ type: "missing_fields", referenceId, file: item.file, fields: requiredKeys });
    }
    if (statusRequiredKeys.length > 0) {
      issues.push({ type: "missing_status_fields", referenceId, file: item.file, fields: statusRequiredKeys });
    }
    if (!isValidDate(reviewDue)) {
      issues.push({ type: "invalid_review_due", referenceId, file: item.file, value: reviewDue || "<empty>" });
    }
    if (!indexItem) {
      issues.push({ type: "missing_in_index", referenceId, file: item.file });
    }
    if (fields.draft_path && fields.draft_path !== "pending" && !fs.existsSync(fields.draft_path)) {
      issues.push({ type: "missing_draft_path", referenceId, file: item.file, value: fields.draft_path });
    }
    if (fields.artifact_path && fields.artifact_path !== "pending" && !fs.existsSync(fields.artifact_path)) {
      issues.push({ type: "missing_artifact_path", referenceId, file: item.file, value: fields.artifact_path });
    }

    if (ALLOWED_STATUSES.has(status)) {
      counts[status] += 1;
    }

    if (isValidDate(reviewDue) && reviewDue < today && status !== "accepted" && status !== "expired") {
      counts.overdue += 1;
      issues.push({ type: "overdue_review", referenceId, file: item.file, value: reviewDue });
    }

    rows.push({
      referenceId,
      status,
      owner: fields.owner || "",
      reviewDue,
      artifactPath: fields.artifact_path || "",
      draftPath: fields.draft_path || "",
    });
  }

  for (const indexItem of indexItems) {
    const exists = metadataItems.some((item) => item.referenceId === indexItem.referenceId);
    if (!exists) {
      issues.push({ type: "index_without_metadata", referenceId: indexItem.referenceId, file: rel(INDEX_FILE) });
    }
  }

  const status = computeStatus(counts, issues);
  const verdict = computeVerdict(status);
  const nextAction =
    status === "done"
      ? "удерживать pilot evidence и не допускать scope drift"
      : "перевести минимум один `D-H-XX` reference в `accepted` и закрыть pending review";

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    track: "D4",
    status,
    issues,
    evidenceRefs: [rel(INDEX_FILE), rel(METADATA_DIR)],
    nextAction,
    verdict,
    restrictedRoot: RESTRICTED_ROOT,
    metadataDir: METADATA_DIR,
    indexFile: INDEX_FILE,
    counts,
    rows,
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase D Pilot Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${status}\``,
    `- verdict: \`${verdict}\``,
    `- restricted_root: \`${RESTRICTED_ROOT}\``,
    `- metadata_dir: \`${METADATA_DIR}\``,
    `- index_file: \`${INDEX_FILE}\``,
    `- total: \`${counts.total}\``,
    `- requested: \`${counts.requested}\``,
    `- received: \`${counts.received}\``,
    `- reviewed: \`${counts.reviewed}\``,
    `- accepted: \`${counts.accepted}\``,
    `- expired: \`${counts.expired}\``,
    `- overdue: \`${counts.overdue}\``,
    `- next_action: ${nextAction}`,
    "",
    "## Items",
    "",
    "| Reference | Status | Owner | Review due | Draft | Artifact |",
    "|---|---|---|---|---|---|",
    ...rows.map(
      (row) =>
        `| \`${row.referenceId}\` | \`${row.status || "missing"}\` | ${row.owner || "-"} | \`${row.reviewDue || "-"}\` | \`${row.draftPath || "-"}\` | \`${row.artifactPath || "-"}\` |`,
    ),
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(issues),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-d-pilot-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- total=${counts.total}`);
  console.log(`- accepted=${counts.accepted}`);
  console.log(`- overdue=${counts.overdue}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && (status !== "done" || issues.length > 0 || counts.overdue > 0)) {
    process.exit(1);
  }
}

main();
