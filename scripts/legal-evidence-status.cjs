#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const REPORT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "external-legal-evidence-status.md");
const REGISTER_FILE = path.join(
  ROOT,
  "docs",
  "05_OPERATIONS",
  "EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md",
);
const METADATA_DIR = process.env.LEGAL_EVIDENCE_METADATA_DIR
  ? path.resolve(process.env.LEGAL_EVIDENCE_METADATA_DIR)
  : path.resolve(
      ROOT,
      "..",
      "RAI_EP_RESTRICTED_EVIDENCE",
      "legal-compliance",
      "2026-03-28",
      "metadata",
    );
const INDEX_FILE = path.join(METADATA_DIR, "INDEX.md");
const ALLOWED_STATUSES = new Set(["requested", "received", "reviewed", "accepted", "expired"]);
const REQUIRED_KEYS = [
  "reference_id",
  "status",
  "requested_at",
  "review_due",
  "owner_scope",
  "named_owners",
  "scope",
  "linked_docs",
  "acceptance_summary",
  "notes",
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractBacktickValues(rawValue) {
  return [...rawValue.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

function stripBulletValue(rawValue) {
  const trimmed = rawValue.trim();
  const values = extractBacktickValues(trimmed);
  if (values.length === 1 && /^`[^`]+`$/.test(trimmed)) {
    return values[0];
  }
  if (values.length > 0) {
    return values.join(", ");
  }
  return trimmed;
}

function parseMetadataFile(filePath) {
  const content = readText(filePath);
  const lines = content.split(/\r?\n/);
  const heading = lines.find((line) => line.startsWith("# ")) || "";
  const fields = {};

  for (const line of lines) {
    const match = line.match(/^- `([^`]+)`: (.+)$/);
    if (!match) continue;
    fields[match[1]] = stripBulletValue(match[2]);
  }

  return {
    filePath,
    file: filePath.replace(/\\/g, "/"),
    title: heading.replace(/^# /, "").trim(),
    fields,
  };
}

function parseRegisterRows(content) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith("| `ELP-")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 9) continue;
    rows.push({
      referenceId: cells[0].replace(/`/g, ""),
      artifact: cells[1],
      status: cells[2].replace(/`/g, ""),
      ownerScope: cells[3],
      namedOwners: cells[4],
      requestedAt: cells[5].replace(/`/g, ""),
      reviewDue: cells[6].replace(/`/g, ""),
      linkedDocs: cells[7],
      nextAction: cells[8],
    });
  }
  return rows;
}

function parseIndex(content) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^- `([^`]+)` `([^`]+)` `(.+)`$/);
    if (!match) continue;
    rows.push({
      referenceId: match[1],
      status: match[2],
      title: match[3],
    });
  }
  return rows;
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const today = new Date().toISOString().slice(0, 10);
  const issues = [];

  if (!fs.existsSync(REGISTER_FILE)) {
    console.error(`[legal-evidence-status] отсутствует register: ${rel(REGISTER_FILE)}`);
    process.exit(1);
  }
  if (!fs.existsSync(METADATA_DIR)) {
    console.error(`[legal-evidence-status] отсутствует metadata dir: ${METADATA_DIR}`);
    process.exit(1);
  }
  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`[legal-evidence-status] отсутствует index file: ${INDEX_FILE}`);
    process.exit(1);
  }

  const registerRows = parseRegisterRows(readText(REGISTER_FILE));
  const registerMap = new Map(registerRows.map((row) => [row.referenceId, row]));
  const indexRows = parseIndex(readText(INDEX_FILE));
  const indexMap = new Map(indexRows.map((row) => [row.referenceId, row]));
  const metadataFiles = fs
    .readdirSync(METADATA_DIR)
    .filter((name) => /^ELP-20260328-\d{2}.*\.md$/.test(name))
    .sort();
  const metadataItems = metadataFiles.map((name) => parseMetadataFile(path.join(METADATA_DIR, name)));
  const items = [];
  const counts = {
    total: metadataItems.length,
    requested: 0,
    received: 0,
    reviewed: 0,
    accepted: 0,
    expired: 0,
    overdue: 0,
  };

  for (const item of metadataItems) {
    const referenceId = item.fields.reference_id || "";
    const status = item.fields.status || "";
    const reviewDue = item.fields.review_due || "";
    const registerRow = registerMap.get(referenceId);
    const indexRow = indexMap.get(referenceId);
    const missingKeys = REQUIRED_KEYS.filter((key) => !item.fields[key]);
    if (!referenceId) {
      issues.push({ severity: "error", type: "missing_reference_id", file: item.file });
      continue;
    }
    if (!ALLOWED_STATUSES.has(status)) {
      issues.push({
        severity: "error",
        type: "invalid_status",
        referenceId,
        file: item.file,
        value: status || "<empty>",
      });
    }
    if (missingKeys.length > 0) {
      issues.push({
        severity: "error",
        type: "missing_fields",
        referenceId,
        file: item.file,
        fields: missingKeys,
      });
    }
    if (!isValidDate(reviewDue)) {
      issues.push({
        severity: "error",
        type: "invalid_review_due",
        referenceId,
        file: item.file,
        value: reviewDue || "<empty>",
      });
    }
    if (!registerRow) {
      issues.push({ severity: "error", type: "missing_in_register", referenceId, file: item.file });
    } else {
      if (registerRow.status !== status) {
        issues.push({
          severity: "error",
          type: "register_status_drift",
          referenceId,
          file: item.file,
          registerStatus: registerRow.status,
          metadataStatus: status,
        });
      }
      if (registerRow.reviewDue !== reviewDue) {
        issues.push({
          severity: "warning",
          type: "register_review_due_drift",
          referenceId,
          file: item.file,
          registerReviewDue: registerRow.reviewDue,
          metadataReviewDue: reviewDue,
        });
      }
    }
    if (!indexRow) {
      issues.push({ severity: "error", type: "missing_in_index", referenceId, file: item.file });
    } else if (indexRow.status !== status) {
      issues.push({
        severity: "error",
        type: "index_status_drift",
        referenceId,
        file: item.file,
        indexStatus: indexRow.status,
        metadataStatus: status,
      });
    }

    if (counts[status] !== undefined) {
      counts[status] += 1;
    }
    const overdue = isValidDate(reviewDue) && reviewDue < today;
    if (overdue) {
      counts.overdue += 1;
      issues.push({ severity: "warning", type: "overdue_review", referenceId, reviewDue });
    }

    items.push({
      referenceId,
      status,
      reviewDue,
      overdue,
      namedOwners: item.fields.named_owners || "",
      linkedDocs: item.fields.linked_docs || "",
      file: item.file,
      title: item.title,
    });
  }

  for (const referenceId of registerMap.keys()) {
    if (!items.find((item) => item.referenceId === referenceId)) {
      issues.push({ severity: "error", type: "register_without_metadata_file", referenceId });
    }
  }
  for (const referenceId of indexMap.keys()) {
    if (!items.find((item) => item.referenceId === referenceId)) {
      issues.push({ severity: "error", type: "index_without_metadata_file", referenceId });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    registerFile: rel(REGISTER_FILE),
    metadataDir: METADATA_DIR,
    indexFile: INDEX_FILE,
    counts,
    issues,
    items,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const mdLines = [
    "# External Legal Evidence Status",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- register_file: ${rel(REGISTER_FILE)}`,
    `- metadata_dir: ${METADATA_DIR}`,
    `- total: ${counts.total}`,
    `- requested: ${counts.requested}`,
    `- received: ${counts.received}`,
    `- reviewed: ${counts.reviewed}`,
    `- accepted: ${counts.accepted}`,
    `- expired: ${counts.expired}`,
    `- overdue: ${counts.overdue}`,
    "",
    "## Items",
    "",
    "| Reference ID | Status | Review due | Overdue | Named owners | File |",
    "|---|---|---|---|---|---|",
  ];
  for (const item of items) {
    mdLines.push(
      `| ${item.referenceId} | ${item.status} | ${item.reviewDue || "-"} | ${item.overdue ? "yes" : "no"} | ${item.namedOwners || "-"} | ${item.file} |`,
    );
  }
  mdLines.push("", "## Issues", "");
  if (issues.length === 0) {
    mdLines.push("- none");
  } else {
    for (const issue of issues) {
      mdLines.push(`- ${issue.severity}: ${issue.type} ${issue.referenceId || issue.file || ""}`.trim());
    }
  }
  mdLines.push("");
  fs.writeFileSync(REPORT_MD, `${mdLines.join("\n")}\n`);

  console.log(`[legal-evidence-status] report_json=${rel(REPORT_JSON)}`);
  console.log(`[legal-evidence-status] report_md=${rel(REPORT_MD)}`);
  console.log(`[legal-evidence-status] total=${counts.total}`);
  console.log(`[legal-evidence-status] requested=${counts.requested}`);
  console.log(`[legal-evidence-status] received=${counts.received}`);
  console.log(`[legal-evidence-status] reviewed=${counts.reviewed}`);
  console.log(`[legal-evidence-status] accepted=${counts.accepted}`);
  console.log(`[legal-evidence-status] expired=${counts.expired}`);
  console.log(`[legal-evidence-status] overdue=${counts.overdue}`);
  console.log(`[legal-evidence-status] issues=${issues.length}`);
  for (const issue of issues.slice(0, 20)) {
    console.log(`- ${issue.severity} ${issue.type} ${issue.referenceId || issue.file || ""}`.trim());
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  process.exit(mode === "enforce" && errors.length > 0 ? 1 : 0);
}

main();
