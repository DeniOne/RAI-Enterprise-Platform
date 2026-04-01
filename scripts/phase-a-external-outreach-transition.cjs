#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "execution");
const LEDGER_JSON = path.join(OUTPUT_DIR, "phase-a-external-outreach-ledger.json");

const RESTRICTED_ROOT = process.env.PHASE_A_EXTERNAL_OUTREACH_LEDGER_ROOT
  ? path.resolve(process.env.PHASE_A_EXTERNAL_OUTREACH_LEDGER_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "execution", "2026-03-31");
const LEDGER_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A-EXTERNAL-OUTREACH-LEDGER");

const ALLOWED_STATUSES = new Set(["sent", "acknowledged", "replied", "closed"]);
const ALLOWED_TRANSITIONS = {
  prepared: new Set(["sent"]),
  sent: new Set(["acknowledged", "replied", "closed"]),
  acknowledged: new Set(["replied", "closed"]),
  replied: new Set(["closed"]),
  closed: new Set([]),
};

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
    console.error(`[phase-a-external-outreach-transition] ${message}`);
    process.exit(1);
  }
}

function sanitizeSlug(value) {
  return String(value || "queue")
    .replace(/^@/, "at_")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "queue";
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

function extractField(content, key) {
  const match = content.match(new RegExp(`^- ${key}: ([^\\n]+)$`, "m"));
  return match ? match[1].trim() : "";
}

function appendWorkingNote(content, note, at) {
  if (!note) return content;
  const marker = "## Working notes\n";
  const formatted = `- [${at}] ${note}`;
  if (!content.includes(marker)) {
    return `${content.trimEnd()}\n\n## Working notes\n\n${formatted}\n`;
  }
  const parts = content.split(marker);
  const prefix = parts[0];
  const suffix = parts[1] || "";
  const existing = suffix.trimEnd();
  const next = existing ? `${existing}\n${formatted}\n` : `${formatted}\n`;
  return `${prefix}${marker}\n${next}`;
}

function resolveQueue(ledger, queueArg) {
  const normalized = queueArg.trim();
  const slug = sanitizeSlug(normalized);
  const matches = (ledger.queues || []).filter(
    (queue) => queue.ownerQueue === normalized || sanitizeSlug(queue.ownerQueue) === slug,
  );
  assert(matches.length === 1, `не найдена уникальная owner queue для ${queueArg}`);
  return matches[0];
}

function printUsage() {
  console.log(
    "usage: node scripts/phase-a-external-outreach-transition.cjs --queue=@chief_legal_officer --status=sent|acknowledged|replied|closed [--contact=mail@example.com] [--assignee=@techlead] [--at=2026-03-31] [--note=...] [--dry-run]",
  );
}

function main() {
  const queueArg = getArg("queue");
  const targetStatus = getArg("status");
  const ownerContact = getArg("contact");
  const assignee = getArg("assignee");
  const at = getArg("at") || new Date().toISOString().slice(0, 10);
  const note = getArg("note");
  const dryRun = hasFlag("dry-run");

  if (hasFlag("help") || !queueArg || !targetStatus) {
    printUsage();
    process.exit(queueArg && targetStatus ? 0 : 1);
  }

  assert(ALLOWED_STATUSES.has(targetStatus), `неподдерживаемый target status: ${targetStatus}`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(at), "at должен быть в формате YYYY-MM-DD");
  assert(fs.existsSync(LEDGER_JSON), `не найден ledger json: ${LEDGER_JSON}`);
  assert(fs.existsSync(LEDGER_DIR), `не найден restricted ledger dir: ${LEDGER_DIR}`);

  const ledger = readJson(LEDGER_JSON);
  const queue = resolveQueue(ledger, queueArg);
  const trackerPath = queue.trackerPath;
  assert(trackerPath && fs.existsSync(trackerPath), `tracker не найден: ${trackerPath}`);

  let trackerContent = readText(trackerPath);
  const currentStatus = extractField(trackerContent, "outreach_status");
  const currentContact = extractField(trackerContent, "owner_contact");
  const currentAssignee = extractField(trackerContent, "current_assignee");

  assert(currentStatus, `не найден текущий outreach_status в ${trackerPath}`);
  assert(
    ALLOWED_TRANSITIONS[currentStatus] && ALLOWED_TRANSITIONS[currentStatus].has(targetStatus),
    `недопустимый переход ${currentStatus} -> ${targetStatus} для ${queue.ownerQueue}`,
  );

  const nextContact = ownerContact || currentContact;
  const nextAssignee = assignee || currentAssignee || "@techlead";

  if (targetStatus !== "closed") {
    assert(nextContact && nextContact !== "pending", "для sent/acknowledged/replied нужно указать --contact или иметь заполненный owner_contact");
  }

  trackerContent = replaceBullet(trackerContent, "outreach_status", `- outreach_status: ${targetStatus}`);
  trackerContent = replaceBullet(trackerContent, "owner_contact", `- owner_contact: ${nextContact || "pending"}`);
  trackerContent = replaceBullet(trackerContent, "current_assignee", `- current_assignee: ${nextAssignee}`);

  if (targetStatus === "sent") {
    trackerContent = replaceBullet(trackerContent, "last_contact_at", `- last_contact_at: ${at}`);
  }
  if (targetStatus === "acknowledged" || targetStatus === "replied") {
    trackerContent = replaceBullet(trackerContent, "last_response_at", `- last_response_at: ${at}`);
  }

  trackerContent = appendWorkingNote(trackerContent, note, at);

  console.log(`[phase-a-external-outreach-transition] queue=${queue.ownerQueue}`);
  console.log(`[phase-a-external-outreach-transition] current_status=${currentStatus}`);
  console.log(`[phase-a-external-outreach-transition] target_status=${targetStatus}`);
  console.log(`[phase-a-external-outreach-transition] contact=${nextContact || "pending"}`);
  console.log(`[phase-a-external-outreach-transition] assignee=${nextAssignee}`);
  console.log(`[phase-a-external-outreach-transition] tracker=${trackerPath.replace(/\\/g, "/")}`);
  console.log(`[phase-a-external-outreach-transition] dry_run=${dryRun ? "yes" : "no"}`);

  writeText(trackerPath, trackerContent, dryRun);

  console.log(`[phase-a-external-outreach-transition] status=${currentStatus}->${targetStatus}`);
}

main();
