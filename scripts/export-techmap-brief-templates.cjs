#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

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
    workbookOutput: path.join(OUTPUT_DIR, "techmap_farm_intake_brief_template.xlsx"),
    title: "Бриф хозяйства для разработки техкарты",
    purpose:
      "Рабочая форма для сбора исходных данных по одному хозяйству, полю и сезону перед разработкой техкарты.",
    fillScope:
      "Заполняйте один файл на один контур: хозяйство + поле или зона + сезон.",
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
    workbookOutput: path.join(OUTPUT_DIR, "techmap_source_data_register_template.xlsx"),
    title: "Полный перечень данных для разработки техкарты",
    purpose:
      "Канонический чек-лист факторов и источников, на которых строится техкарта и её объяснимость.",
    fillScope:
      "Используйте файл как реестр наличия и качества данных, а не как анкету для клиента.",
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
    workbookOutput: path.join(
      OUTPUT_DIR,
      "techmap_historical_farm_data_brief_template.xlsx",
    ),
    title: "Бриф для сбора исторических данных от хозяйства",
    purpose:
      "Форма для накопления исторических производственных, агрономических, технических и экономических данных хозяйства.",
    fillScope:
      "Рекомендуется отдельный файл на хозяйство с детализацией по полям и сезонам в строках или в копиях файла.",
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
    workbookOutput: path.join(
      OUTPUT_DIR,
      "techmap_ai_core_historical_data_brief_template.xlsx",
    ),
    title: "Бриф для сбора исторических данных для обучения ядра ИИ",
    purpose:
      "Форма для внешних и институциональных наборов данных, пригодных для обучения и калибровки ядра ИИ.",
    fillScope:
      "Включайте только обезличенные, разрешённые к использованию и методически описанные наборы данных.",
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

function buildInstructionRows(job) {
  return [
    ["Блок", "Описание"],
    ["Документ", job.title],
    ["Назначение", job.purpose],
    ["Контур заполнения", job.fillScope],
    [
      "Главное правило",
      "Одна строка на листе «Факторы» соответствует одному фактору из канонического перечня.",
    ],
    [
      "Как заполнять значение",
      "В столбец «Фактическое значение» вносите факт, число, дату, диапазон или краткое допустимое значение из справочника.",
    ],
    [
      "Единицы измерения",
      "Для числовых значений обязательно сохраняйте единицы измерения из листа «Факторы».",
    ],
    [
      "Источник",
      "В столбец «Источник / файл» указывайте протокол, выгрузку ERP, карту, журнал, отчёт, архив или название файла.",
    ],
    [
      "Дата источника",
      "Столбец «Дата источника» обязателен для анализов, погодных рядов, наблюдений, исторических данных и официальных выгрузок.",
    ],
    [
      "Критичность",
      "Значение `P0` означает критичный минимум, `P1` — рабочий стандарт, `P2` — уточняющий уровень.",
    ],
    [
      "Технические обозначения",
      "Идентификаторы в обратных кавычках, например `CropForm`, `SAT_avg`, `BBCH`, не переводятся и не переименовываются.",
    ],
    [
      "Комментарии",
      "В столбец «Комментарий» вносите ограничения, интервал достоверности, методику расчёта и причину пропуска.",
    ],
    [
      "Если данных нет",
      "Оставьте значение пустым и зафиксируйте пробел в комментарии или в отдельном журнале пробелов.",
    ],
    [
      "Формат значений",
      "Числа пишите без лишнего текста, даты — в формате `YYYY-MM-DD`, перечисления — одним из допустимых вариантов.",
    ],
    [
      "Проверка перед отправкой",
      "Проверьте, что обязательные `P0` заполнены, а источники и даты указаны там, где они требуются.",
    ],
  ];
}

function exportWorkbook(job, columns, rows) {
  const payload = {
    factorsSheetName: "Факторы",
    instructionsSheetName: "Инструкция",
    factorRows: [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))],
    instructionRows: buildInstructionRows(job),
  };

  const helperPath = path.join(os.tmpdir(), "rai-export-techmap-brief-xlsx.py");
  const helperCode = `
import json
import sys
import zipfile
from xml.sax.saxutils import escape

payload = json.loads(sys.stdin.read())
output_path = sys.argv[1]

def col_letter(index):
    result = ""
    current = index
    while current > 0:
        current, remainder = divmod(current - 1, 26)
        result = chr(65 + remainder) + result
    return result

def cell_xml(value, row_index, col_index):
    ref = f"{col_letter(col_index)}{row_index}"
    text = escape("" if value is None else str(value))
    return f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{text}</t></is></c>'

def sheet_xml(rows):
    row_chunks = []
    for row_index, row in enumerate(rows, start=1):
        cells = "".join(cell_xml(value, row_index, col_index) for col_index, value in enumerate(row, start=1))
        row_chunks.append(f'<row r="{row_index}">{cells}</row>')
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<sheetData>' + "".join(row_chunks) + '</sheetData>'
        '</worksheet>'
    )

content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

root_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

workbook = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="{escape(payload["factorsSheetName"])}" sheetId="1" r:id="rId1"/>
    <sheet name="{escape(payload["instructionsSheetName"])}" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>'''

workbook_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>'''

with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    archive.writestr("[Content_Types].xml", content_types)
    archive.writestr("_rels/.rels", root_rels)
    archive.writestr("xl/workbook.xml", workbook)
    archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
    archive.writestr("xl/styles.xml", styles)
    archive.writestr("xl/worksheets/sheet1.xml", sheet_xml(payload["factorRows"]))
    archive.writestr("xl/worksheets/sheet2.xml", sheet_xml(payload["instructionRows"]))
`;

  fs.writeFileSync(helperPath, helperCode, "utf8");
  const result = spawnSync("python3", [helperPath, job.workbookOutput], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `Не удалось собрать XLSX для ${job.source}: ${result.stderr || result.stdout || "неизвестная ошибка"}`,
    );
  }
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
  exportWorkbook(job, columns, rows);
  return {
    output: job.output,
    workbookOutput: job.workbookOutput,
    rowCount: rows.length,
  };
}

function main() {
  ensureOutputDir();
  const results = JOBS.map(exportTemplate);
  console.log("Сгенерированы шаблоны:");
  results.forEach((item) => {
    console.log(`- ${path.relative(ROOT, item.output)} (${item.rowCount} строк)`);
    console.log(`- ${path.relative(ROOT, item.workbookOutput)} (2 листа)`);
  });
}

main();
