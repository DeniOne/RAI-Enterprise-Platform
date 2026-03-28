#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REGISTER_FILE = path.join(
  ROOT,
  "docs",
  "05_OPERATIONS",
  "EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md",
);
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const METADATA_DIR = path.join(RESTRICTED_ROOT, "metadata");
const ARTIFACTS_DIR = path.join(RESTRICTED_ROOT, "artifacts");
const INDEX_FILE = path.join(METADATA_DIR, "INDEX.md");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[legal-evidence-intake] ${message}`);
    process.exit(1);
  }
}

function sanitizeFilename(input) {
  return input
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findMetadataFile(referenceId) {
  const entries = fs.readdirSync(METADATA_DIR).filter((name) => name.startsWith(`${referenceId}-`));
  assert(entries.length === 1, `не найден уникальный metadata file для ${referenceId}`);
  return path.join(METADATA_DIR, entries[0]);
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

function printUsage() {
  console.log("usage: node scripts/legal-evidence-intake.cjs --reference=ELP-20260328-01 --source=/abs/path/file.pdf [--received-at=2026-03-28] [--copy-name=custom.pdf] [--dry-run]");
}

function main() {
  const referenceId = getArg("reference");
  const source = getArg("source");
  const receivedAt = getArg("received-at") || new Date().toISOString().slice(0, 10);
  const copyNameRaw = getArg("copy-name");
  const dryRun = hasFlag("dry-run");

  if (hasFlag("help") || !referenceId || !source) {
    printUsage();
    process.exit(referenceId && source ? 0 : 1);
  }

  assert(/^\d{4}-\d{2}-\d{2}$/.test(receivedAt), "received-at должен быть в формате YYYY-MM-DD");
  assert(fs.existsSync(source), `source не найден: ${source}`);
  assert(fs.statSync(source).isFile(), `source должен быть файлом: ${source}`);
  assert(fs.existsSync(REGISTER_FILE), `не найден register: ${REGISTER_FILE}`);
  assert(fs.existsSync(METADATA_DIR), `не найден metadata dir: ${METADATA_DIR}`);
  assert(fs.existsSync(INDEX_FILE), `не найден index file: ${INDEX_FILE}`);

  const metadataFile = findMetadataFile(referenceId);
  const artifactDir = path.join(ARTIFACTS_DIR, referenceId);
  const targetBase = sanitizeFilename(copyNameRaw || path.basename(source));
  assert(targetBase.length > 0, "не удалось построить имя файла артефакта");
  const targetFile = path.join(artifactDir, `${receivedAt}__${targetBase}`);

  let metadataContent = readText(metadataFile);
  assert(metadataContent.includes(`- \`reference_id\`: \`${referenceId}\``), `reference_id mismatch в ${metadataFile}`);

  metadataContent = replaceBullet(metadataContent, "status", `- \`status\`: \`received\``);
  metadataContent = replaceBullet(metadataContent, "received_at", `- \`received_at\`: \`${receivedAt}\``);
  metadataContent = replaceBullet(metadataContent, "artifact_path", `- \`artifact_path\`: \`${targetFile.replace(/\\/g, "/")}\``);
  metadataContent = replaceBullet(
    metadataContent,
    "notes",
    `- \`notes\`: \`artifact received from ${source.replace(/\\/g, "/")} -> ${targetFile.replace(/\\/g, "/")}\``,
  );

  const indexContent = updateIndex(readText(INDEX_FILE), referenceId, "received");
  const registerContent = updateRegister(
    readText(REGISTER_FILE),
    referenceId,
    "received",
    "провести owner review и перевести карточку в `reviewed`",
  );

  console.log(`[legal-evidence-intake] reference=${referenceId}`);
  console.log(`[legal-evidence-intake] source=${source}`);
  console.log(`[legal-evidence-intake] target=${targetFile.replace(/\\/g, "/")}`);
  console.log(`[legal-evidence-intake] metadata_file=${metadataFile.replace(/\\/g, "/")}`);
  console.log(`[legal-evidence-intake] dry_run=${dryRun ? "yes" : "no"}`);

  if (!dryRun) {
    ensureDir(artifactDir, false);
    fs.copyFileSync(source, targetFile);
  }

  writeText(metadataFile, metadataContent, dryRun);
  writeText(INDEX_FILE, indexContent, dryRun);
  writeText(REGISTER_FILE, registerContent, dryRun);

  console.log("[legal-evidence-intake] status=requested->received");
  console.log("[legal-evidence-intake] next_action=owner review");
}

main();
