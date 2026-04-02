#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(
  ROOT,
  "docs",
  "02_DOMAINS",
  "AGRO_DOMAIN",
  "TEMPLATES",
);

const JOBS = [
  {
    source: path.join(
      ROOT,
      "docs",
      "02_DOMAINS",
      "AGRO_DOMAIN",
      "TECHMAP_FARM_INTAKE_BRIEF.md",
    ),
    output: path.join(OUTPUT_DIR, "techmap_farm_intake_brief_template.csv"),
  },
  {
    source: path.join(
      ROOT,
      "docs",
      "02_DOMAINS",
      "AGRO_DOMAIN",
      "TECHMAP_SOURCE_DATA_REGISTER.md",
    ),
    output: path.join(OUTPUT_DIR, "techmap_source_data_register_template.csv"),
  },
  {
    source: path.join(
      ROOT,
      "docs",
      "02_DOMAINS",
      "AGRO_DOMAIN",
      "TECHMAP_HISTORICAL_FARM_DATA_BRIEF.md",
    ),
    output: path.join(
      OUTPUT_DIR,
      "techmap_historical_farm_data_brief_template.csv",
    ),
  },
  {
    source: path.join(
      ROOT,
      "docs",
      "02_DOMAINS",
      "AGRO_DOMAIN",
      "TECHMAP_AI_CORE_HISTORICAL_DATA_BRIEF.md",
    ),
    output: path.join(
      OUTPUT_DIR,
      "techmap_ai_core_historical_data_brief_template.csv",
    ),
  },
];

function parseRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(line) {
  return /^\|\s*[:\- ]+\|/.test(line.trim());
}

function sanitizeSection(line) {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/`/g, "")
    .trim();
}

function parseMarkdownTables(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  let section = "Общее";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (/^#{2,6}\s+/.test(trimmed)) {
      section = sanitizeSection(trimmed);
      continue;
    }

    const nextLine = lines[index + 1] ?? "";
    if (!trimmed.startsWith("|") || !isSeparatorRow(nextLine)) {
      continue;
    }

    const headers = parseRow(trimmed);
    const isFactorTable = headers.some((header) =>
      /фактор/i.test(header),
    );
    if (!isFactorTable) {
      index += 2;
      while (index < lines.length) {
        const rowLine = (lines[index] ?? "").trim();
        if (!rowLine.startsWith("|")) {
          index -= 1;
          break;
        }
        index += 1;
      }
      continue;
    }
    index += 2;

    while (index < lines.length) {
      const rowLine = (lines[index] ?? "").trim();
      if (!rowLine.startsWith("|")) {
        index -= 1;
        break;
      }

      const cells = parseRow(rowLine);
      if (cells.length === headers.length) {
        const row = { Раздел: section };
        headers.forEach((header, headerIndex) => {
          row[header] = cells[headerIndex] ?? "";
        });
        rows.push(row);
      }

      index += 1;
    }
  }

  return rows;
}

function makeColumnOrder(rows) {
  const seen = new Set(["Раздел"]);
  const columns = ["Раздел"];

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    });
  });

  ["Фактическое значение", "Источник / файл", "Дата источника", "Комментарий"].forEach(
    (column) => {
      if (!seen.has(column)) {
        columns.push(column);
      }
    },
  );

  return columns;
}

function toCsvValue(value) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(columns, rows) {
  const lines = [];
  lines.push(columns.map(toCsvValue).join(";"));
  rows.forEach((row) => {
    const values = columns.map((column) => toCsvValue(row[column] ?? ""));
    lines.push(values.join(";"));
  });
  return `\uFEFF${lines.join("\n")}\n`;
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function exportTemplate(job) {
  const content = fs.readFileSync(job.source, "utf8");
  const rows = parseMarkdownTables(content);

  if (rows.length === 0) {
    throw new Error(`В документе не найдены таблицы: ${job.source}`);
  }

  const columns = makeColumnOrder(rows);
  const csv = toCsv(columns, rows);
  fs.writeFileSync(job.output, csv, "utf8");
  return { output: job.output, rowCount: rows.length };
}

function main() {
  ensureOutputDir();
  const results = JOBS.map(exportTemplate);
  console.log("Сгенерированы шаблоны:");
  results.forEach((item) => {
    console.log(`- ${path.relative(ROOT, item.output)} (${item.rowCount} строк)`);
  });
}

main();
