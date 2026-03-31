#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RESTRICTED_ROOT = process.env.SECURITY_EVIDENCE_ROOT
  ? path.resolve(process.env.SECURITY_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "security", "2026-03-31");
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
    console.error(`[security-evidence-intake] ${message}`);
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
  const regex = new RegExp(`^- ${key}: .+$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, newLine);
  }
  const lines = content.split(/\r?\n/);
  lines.push(newLine);
  return `${lines.join("\n")}\n`;
}

function printUsage() {
  console.log(
    "usage: node scripts/security-evidence-intake.cjs --reference=A2-S-01 --source=/abs/path/file.pdf [--received-at=2026-03-31] [--copy-name=custom.pdf] [--dry-run]",
  );
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

  assert(/^A2-S-\d{2}$/.test(referenceId), "reference должен быть в формате A2-S-01");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(receivedAt), "received-at должен быть в формате YYYY-MM-DD");
  assert(fs.existsSync(source), `source не найден: ${source}`);
  assert(fs.statSync(source).isFile(), `source должен быть файлом: ${source}`);
  assert(fs.existsSync(METADATA_DIR), `не найден metadata dir: ${METADATA_DIR}`);
  assert(fs.existsSync(INDEX_FILE), `не найден index file: ${INDEX_FILE}`);

  const metadataFile = findMetadataFile(referenceId);
  const artifactDir = path.join(ARTIFACTS_DIR, referenceId);
  const targetBase = sanitizeFilename(copyNameRaw || path.basename(source));
  assert(targetBase.length > 0, "не удалось построить имя файла артефакта");
  const targetFile = path.join(artifactDir, `${receivedAt}__${targetBase}`);

  let metadataContent = readText(metadataFile);
  metadataContent = replaceBullet(metadataContent, "status", `- status: received`);
  metadataContent = replaceBullet(metadataContent, "received_at", `- received_at: ${receivedAt}`);
  metadataContent = replaceBullet(metadataContent, "artifact_path", `- artifact_path: ${targetFile.replace(/\\/g, "/")}`);

  console.log(`[security-evidence-intake] reference=${referenceId}`);
  console.log(`[security-evidence-intake] source=${source}`);
  console.log(`[security-evidence-intake] target=${targetFile.replace(/\\/g, "/")}`);
  console.log(`[security-evidence-intake] metadata_file=${metadataFile.replace(/\\/g, "/")}`);
  console.log(`[security-evidence-intake] dry_run=${dryRun ? "yes" : "no"}`);

  if (!dryRun) {
    ensureDir(artifactDir, false);
    fs.copyFileSync(source, targetFile);
  }

  writeText(metadataFile, metadataContent, dryRun);

  console.log("[security-evidence-intake] status=requested->received");
  console.log("[security-evidence-intake] next_action=owner review");
}

main();
