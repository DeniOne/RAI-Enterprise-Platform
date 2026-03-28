#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REGISTER_FILE = process.env.LEGAL_EVIDENCE_REGISTER_FILE
  ? path.resolve(process.env.LEGAL_EVIDENCE_REGISTER_FILE)
  : path.join(
      ROOT,
      "docs",
      "05_OPERATIONS",
      "EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md",
    );
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const METADATA_DIR = path.join(RESTRICTED_ROOT, "metadata");
const INDEX_FILE = path.join(METADATA_DIR, "INDEX.md");
const ALLOWED_STATUSES = new Set(["reviewed", "accepted", "expired"]);
const ALLOWED_TRANSITIONS = {
  requested: new Set(["expired"]),
  received: new Set(["reviewed", "expired"]),
  reviewed: new Set(["accepted", "expired"]),
  accepted: new Set(["expired"]),
  expired: new Set(["received", "reviewed", "accepted"]),
};

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[legal-evidence-transition] ${message}`);
    process.exit(1);
  }
}

function replaceBullet(content, key, newLine) {
  const regex = new RegExp(`^- \\\`(${key})\\\`: .+$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, newLine);
  }
  const lines = content.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith("- `notes`:"));
  if (index >= 0) {
    lines.splice(index, 0, newLine);
    return `${lines.join("\n")}\n`;
  }
  lines.push(newLine);
  return `${lines.join("\n")}\n`;
}

function findMetadataFile(referenceId) {
  const entries = fs.readdirSync(METADATA_DIR).filter((name) => name.startsWith(`${referenceId}-`));
  assert(entries.length === 1, `не найден уникальный metadata file для ${referenceId}`);
  return path.join(METADATA_DIR, entries[0]);
}

function extractCurrentStatus(content) {
  const match = content.match(/^- `status`: `([^`]+)`$/m);
  return match ? match[1] : "";
}

function parseStatusCounts(registerContent) {
  const rows = [];
  for (const line of registerContent.split(/\r?\n/)) {
    if (!line.startsWith("| `ELP-")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 9) continue;
    rows.push({
      referenceId: cells[0].replace(/`/g, ""),
      status: cells[2].replace(/`/g, ""),
    });
  }
  return rows;
}

function syncCounts(content) {
  const rows = parseStatusCounts(content);
  const counts = {
    total: rows.length,
    requested: rows.filter((row) => row.status === "requested").length,
    received: rows.filter((row) => row.status === "received").length,
    reviewed: rows.filter((row) => row.status === "reviewed").length,
    accepted: rows.filter((row) => row.status === "accepted").length,
    expired: rows.filter((row) => row.status === "expired").length,
  };

  return content
    .replace(/\| Total evidence items \| `\d+` \|/, `| Total evidence items | \`${counts.total}\` |`)
    .replace(/\| `requested` \| `\d+` \|/, `| \`requested\` | \`${counts.requested}\` |`)
    .replace(/\| `received` \| `\d+` \|/, `| \`received\` | \`${counts.received}\` |`)
    .replace(/\| `reviewed` \| `\d+` \|/, `| \`reviewed\` | \`${counts.reviewed}\` |`)
    .replace(/\| `accepted` \| `\d+` \|/, `| \`accepted\` | \`${counts.accepted}\` |`)
    .replace(/\| `expired` \| `\d+` \|/, `| \`expired\` | \`${counts.expired}\` |`);
}

function updateRegister(content, referenceId, status, nextAction) {
  const lines = content.split(/\r?\n/);
  const updated = lines.map((line) => {
    if (!line.startsWith(`| \`${referenceId}\` |`)) return line;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    assert(cells.length >= 9, `неожиданный формат строки register для ${referenceId}`);
    cells[2] = `\`${status}\``;
    cells[8] = nextAction;
    return `| ${cells.join(" | ")} |`;
  });
  return syncCounts(updated.join("\n"));
}

function updateIndex(content, referenceId, status) {
  const lines = content.split(/\r?\n/);
  return `${lines
    .map((line) =>
      line.startsWith(`- \`${referenceId}\` `)
        ? line.replace(/`(requested|received|reviewed|accepted|expired)`/, `\`${status}\``)
        : line,
    )
    .join("\n")}\n`;
}

function nextActionFor(status) {
  if (status === "reviewed") {
    return "обновить связанные docs и перевести карточку в `accepted`";
  }
  if (status === "accepted") {
    return "evidence принято; синхронизировать verdict и следить за revalidation";
  }
  return "нужна revalidation или новый evidence cycle";
}

function printUsage() {
  console.log("usage: node scripts/legal-evidence-transition.cjs --reference=ELP-20260328-01 --status=reviewed|accepted|expired [--at=2026-03-28] [--note=text] [--dry-run]");
}

function main() {
  const referenceId = getArg("reference");
  const targetStatus = getArg("status");
  const at = getArg("at") || new Date().toISOString().slice(0, 10);
  const note = getArg("note");
  const dryRun = hasFlag("dry-run");

  if (hasFlag("help") || !referenceId || !targetStatus) {
    printUsage();
    process.exit(referenceId && targetStatus ? 0 : 1);
  }

  assert(ALLOWED_STATUSES.has(targetStatus), `неподдерживаемый target status: ${targetStatus}`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(at), "at должен быть в формате YYYY-MM-DD");
  assert(fs.existsSync(REGISTER_FILE), `не найден register: ${REGISTER_FILE}`);
  assert(fs.existsSync(METADATA_DIR), `не найден metadata dir: ${METADATA_DIR}`);
  assert(fs.existsSync(INDEX_FILE), `не найден index file: ${INDEX_FILE}`);

  const metadataFile = findMetadataFile(referenceId);
  let metadataContent = readText(metadataFile);
  assert(metadataContent.includes(`- \`reference_id\`: \`${referenceId}\``), `reference_id mismatch в ${metadataFile}`);
  const currentStatus = extractCurrentStatus(metadataContent);
  assert(currentStatus, `не найден текущий status в ${metadataFile}`);
  assert(
    ALLOWED_TRANSITIONS[currentStatus] && ALLOWED_TRANSITIONS[currentStatus].has(targetStatus),
    `недопустимый переход ${currentStatus} -> ${targetStatus} для ${referenceId}`,
  );

  metadataContent = replaceBullet(metadataContent, "status", `- \`status\`: \`${targetStatus}\``);
  if (targetStatus === "reviewed") {
    metadataContent = replaceBullet(metadataContent, "reviewed_at", `- \`reviewed_at\`: \`${at}\``);
  }
  if (targetStatus === "accepted") {
    metadataContent = replaceBullet(metadataContent, "accepted_at", `- \`accepted_at\`: \`${at}\``);
  }
  if (targetStatus === "expired") {
    metadataContent = replaceBullet(metadataContent, "expired_at", `- \`expired_at\`: \`${at}\``);
  }

  if (note) {
    metadataContent = replaceBullet(metadataContent, "notes", `- \`notes\`: \`${note}\``);
  }

  const indexContent = updateIndex(readText(INDEX_FILE), referenceId, targetStatus);
  const registerContent = updateRegister(
    readText(REGISTER_FILE),
    referenceId,
    targetStatus,
    nextActionFor(targetStatus),
  );

  console.log(`[legal-evidence-transition] reference=${referenceId}`);
  console.log(`[legal-evidence-transition] current_status=${currentStatus}`);
  console.log(`[legal-evidence-transition] target_status=${targetStatus}`);
  console.log(`[legal-evidence-transition] at=${at}`);
  console.log(`[legal-evidence-transition] metadata_file=${metadataFile.replace(/\\/g, "/")}`);
  console.log(`[legal-evidence-transition] dry_run=${dryRun ? "yes" : "no"}`);

  writeText(metadataFile, metadataContent, dryRun);
  writeText(INDEX_FILE, indexContent, dryRun);
  writeText(REGISTER_FILE, registerContent, dryRun);

  console.log(`[legal-evidence-transition] status=${currentStatus}->${targetStatus}`);
}

main();
