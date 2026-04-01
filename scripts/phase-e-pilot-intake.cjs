#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RESTRICTED_ROOT = process.env.PHASE_E_HANDOFF_ROOT
  ? path.resolve(process.env.PHASE_E_HANDOFF_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "managed-pilot-handoffs", "2026-04-01");
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
    console.error(`[phase-e-pilot-intake] ${message}`);
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
    "usage: node scripts/phase-e-pilot-intake.cjs --reference=E-H-01 --source=/abs/path/file.md [--received-at=2026-04-01] [--copy-name=custom.md] [--dry-run]",
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

  assert(/^E-H-\d{2}$/.test(referenceId), "reference должен быть в формате E-H-01");
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
  metadataContent = replaceBullet(metadataContent, "status", "- status: received");
  metadataContent = replaceBullet(metadataContent, "received_at", `- received_at: ${receivedAt}`);
  metadataContent = replaceBullet(metadataContent, "artifact_path", `- artifact_path: ${targetFile.replace(/\\/g, "/")}`);

  console.log(`[phase-e-pilot-intake] reference=${referenceId}`);
  console.log(`[phase-e-pilot-intake] source=${source}`);
  console.log(`[phase-e-pilot-intake] target=${targetFile.replace(/\\/g, "/")}`);
  console.log(`[phase-e-pilot-intake] metadata_file=${metadataFile.replace(/\\/g, "/")}`);
  console.log(`[phase-e-pilot-intake] dry_run=${dryRun ? "yes" : "no"}`);

  if (!dryRun) {
    ensureDir(artifactDir, false);
    fs.copyFileSync(source, targetFile);
  }

  writeText(metadataFile, metadataContent, dryRun);

  console.log("[phase-e-pilot-intake] status=requested->received");
  console.log("[phase-e-pilot-intake] next_action=owner review");
}

main();
