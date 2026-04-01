#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RESTRICTED_ROOT = process.env.PHASE_D_HANDOFF_ROOT
  ? path.resolve(process.env.PHASE_D_HANDOFF_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "pilot-handoffs", "2026-04-01");
const METADATA_DIR = path.join(RESTRICTED_ROOT, "metadata");
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
    console.error(`[phase-d-pilot-transition] ${message}`);
    process.exit(1);
  }
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

function findMetadataFile(referenceId) {
  const entries = fs.readdirSync(METADATA_DIR).filter((name) => name.startsWith(`${referenceId}-`));
  assert(entries.length === 1, `не найден уникальный metadata file для ${referenceId}`);
  return path.join(METADATA_DIR, entries[0]);
}

function extractCurrentStatus(content) {
  const match = content.match(/^- status: ([^\n]+)$/m);
  return match ? match[1].trim() : "";
}

function extractArtifactPath(content) {
  const match = content.match(/^- artifact_path: ([^\n]+)$/m);
  return match ? match[1].trim() : "";
}

function printUsage() {
  console.log(
    "usage: node scripts/phase-d-pilot-transition.cjs --reference=D-H-01 --status=reviewed|accepted|expired [--at=2026-04-01] [--dry-run]",
  );
}

function main() {
  const referenceId = getArg("reference");
  const targetStatus = getArg("status");
  const at = getArg("at") || new Date().toISOString().slice(0, 10);
  const dryRun = hasFlag("dry-run");

  if (hasFlag("help") || !referenceId || !targetStatus) {
    printUsage();
    process.exit(referenceId && targetStatus ? 0 : 1);
  }

  assert(/^D-H-\d{2}$/.test(referenceId), "reference должен быть в формате D-H-01");
  assert(ALLOWED_STATUSES.has(targetStatus), `неподдерживаемый target status: ${targetStatus}`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(at), "at должен быть в формате YYYY-MM-DD");
  assert(fs.existsSync(METADATA_DIR), `не найден metadata dir: ${METADATA_DIR}`);

  const metadataFile = findMetadataFile(referenceId);
  let metadataContent = readText(metadataFile);
  const currentStatus = extractCurrentStatus(metadataContent);
  const artifactPath = extractArtifactPath(metadataContent);

  assert(currentStatus, `не найден текущий status в ${metadataFile}`);
  assert(
    ALLOWED_TRANSITIONS[currentStatus] && ALLOWED_TRANSITIONS[currentStatus].has(targetStatus),
    `недопустимый переход ${currentStatus} -> ${targetStatus} для ${referenceId}`,
  );
  if (targetStatus === "reviewed" || targetStatus === "accepted") {
    assert(artifactPath && artifactPath !== "pending", "для reviewed/accepted нужен заполненный artifact_path");
    assert(fs.existsSync(artifactPath), `artifact_path не найден: ${artifactPath}`);
  }

  metadataContent = replaceBullet(metadataContent, "status", `- status: ${targetStatus}`);
  if (targetStatus === "reviewed") {
    metadataContent = replaceBullet(metadataContent, "reviewed_at", `- reviewed_at: ${at}`);
  }
  if (targetStatus === "accepted") {
    metadataContent = replaceBullet(metadataContent, "accepted_at", `- accepted_at: ${at}`);
  }
  if (targetStatus === "expired") {
    metadataContent = replaceBullet(metadataContent, "expired_at", `- expired_at: ${at}`);
  }

  console.log(`[phase-d-pilot-transition] reference=${referenceId}`);
  console.log(`[phase-d-pilot-transition] current_status=${currentStatus}`);
  console.log(`[phase-d-pilot-transition] target_status=${targetStatus}`);
  console.log(`[phase-d-pilot-transition] at=${at}`);
  console.log(`[phase-d-pilot-transition] metadata_file=${metadataFile.replace(/\\/g, "/")}`);
  console.log(`[phase-d-pilot-transition] dry_run=${dryRun ? "yes" : "no"}`);

  writeText(metadataFile, metadataContent, dryRun);

  console.log(`[phase-d-pilot-transition] status=${currentStatus}->${targetStatus}`);
}

main();
