#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const METADATA_DIR = path.join(RESTRICTED_ROOT, "metadata");
const TEMPLATES_DIR = path.join(RESTRICTED_ROOT, "templates");

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
    console.error(`[legal-evidence-template] ${message}`);
    process.exit(1);
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseMetadata(referenceId) {
  const files = fs.readdirSync(METADATA_DIR).filter((name) => name.startsWith(`${referenceId}-`));
  assert(files.length === 1, `не найден уникальный metadata file для ${referenceId}`);
  const filePath = path.join(METADATA_DIR, files[0]);
  const content = readText(filePath);
  const fields = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^- `([^`]+)`: (.+)$/);
    if (!match) continue;
    fields[match[1]] = match[2].replace(/`/g, "").trim();
  }
  return { filePath, fields };
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function buildSpecializedSections(referenceId) {
  if (referenceId === "ELP-20260328-01") {
    return [
      "## Реквизиты оператора",
      "- Полное наименование:",
      "- ОГРН / ИНН:",
      "- Юридический адрес:",
      "- Контактное лицо:",
      "- Email / телефон:",
      "",
      "## Ролевое распределение",
      "| Контур | Роль | Основание | Комментарий |",
      "|---|---|---|---|",
      "| `prod` | operator / processor | | |",
      "| `pilot` | operator / processor | | |",
      "| `staging` | operator / processor | | |",
      "",
      "## Подпись и утверждение",
      "- Подписант:",
      "- Должность:",
      "- Дата:",
    ];
  }
  if (referenceId === "ELP-20260328-03") {
    return [
      "## Environment Residency Matrix",
      "| Среда | Provider | Country | Region | Primary DB | Object storage | Redis / cache | Путь локализации ПДн РФ |",
      "|---|---|---|---|---|---|---|---|",
      "| `prod` | | | | | | | |",
      "| `pilot` | | | | | | | |",
      "| `staging` | | | | | | | |",
      "",
      "## Supporting Evidence",
      "- Contract / invoice reference:",
      "- Account / subscription reference:",
      "- Topology / deployment note:",
    ];
  }
  if (referenceId === "ELP-20260328-04") {
    return [
      "## Processor Register",
      "| Provider | Role | Country | Purpose | Data categories | Contract reference | DPA reference |",
      "|---|---|---|---|---|---|---|",
      "| `OpenRouter` | | | | | | |",
      "| `Telegram` | | | | | | |",
      "| `DaData` | | | | | | |",
      "| `Hosting / storage` | | | | | | |",
      "",
      "## Subprocessor Notes",
      "- Дополнительные subprocessors:",
      "- Ограничения по использованию:",
      "- Исключения / carve-outs:",
    ];
  }
  if (referenceId === "ELP-20260328-06") {
    return [
      "## Lawful Basis Matrix",
      "| Flow | Subjects | Data categories | Purpose | Lawful basis | Consent needed | Notice source |",
      "|---|---|---|---|---|---|---|",
      "| `auth / front-office` | | | | | | |",
      "| `telegram notifications` | | | | | | |",
      "| `AI / explainability` | | | | | | |",
      "| `commerce / lookup` | | | | | | |",
      "| `finance / contracts` | | | | | | |",
      "",
      "## Privacy Notice Links",
      "- Public notice:",
      "- Internal notice:",
      "- Contractual wording:",
    ];
  }
  return [
    "## Основные сведения",
    "- Описание артефакта:",
    "- Подтверждающий документ:",
    "- Дата выпуска:",
    "- Ответственный:",
    "",
    "## Проверочные замечания",
    "- Scope:",
    "- Ограничения:",
    "- Follow-up:",
  ];
}

function buildTemplate(referenceId, metadata) {
  const artifactName = metadata.fields.acceptance_summary || metadata.fields.scope || "external evidence";
  const lines = [
    `# ${referenceId} Evidence Template`,
    "",
    `- reference_id: ${referenceId}`,
    `- owner_scope: ${metadata.fields.owner_scope || ""}`,
    `- named_owners: ${metadata.fields.named_owners || ""}`,
    `- requested_at: ${metadata.fields.requested_at || ""}`,
    `- review_due: ${metadata.fields.review_due || ""}`,
    `- linked_docs: ${metadata.fields.linked_docs || ""}`,
    `- acceptance_summary: ${artifactName}`,
    "",
    "## Что нужно подтвердить",
    metadata.fields.acceptance_summary || "",
    "",
    "## Артефакт",
    "- Название документа:",
    "- Версия:",
    "- Дата:",
    "- Источник:",
    "",
    ...buildSpecializedSections(referenceId),
    "",
    "## Review Checklist",
    "- Документ покрывает фактический deployment contour.",
    "- Документ соответствует `acceptance_summary`.",
    "- Документ можно связать с `reference_id` без двусмысленности.",
    "- После приёмки можно переводить карточку в `reviewed` и затем в `accepted`.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function printUsage() {
  console.log("usage: node scripts/legal-evidence-template.cjs --reference=ELP-20260328-01 [--dry-run]");
}

function main() {
  const referenceId = getArg("reference");
  const dryRun = hasFlag("dry-run");
  if (hasFlag("help") || !referenceId) {
    printUsage();
    process.exit(referenceId ? 0 : 1);
  }

  assert(fs.existsSync(METADATA_DIR), `не найден metadata dir: ${METADATA_DIR}`);
  const metadata = parseMetadata(referenceId);
  const targetDir = path.join(TEMPLATES_DIR, referenceId);
  const targetFile = path.join(targetDir, `${referenceId}__template.md`);
  const template = buildTemplate(referenceId, metadata);

  console.log(`[legal-evidence-template] reference=${referenceId}`);
  console.log(`[legal-evidence-template] target=${targetFile}`);
  console.log(`[legal-evidence-template] dry_run=${dryRun ? "yes" : "no"}`);

  ensureDir(targetDir, dryRun);
  writeText(targetFile, template, dryRun);
}

main();
