#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGET_DIRS = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/shared/components',
  'apps/web/lib/config',
  'apps/gripil-web/src',
];

const EXCLUDED_PATH_PARTS = [
  '__tests__',
  '.next',
  'node_modules',
];

const EXCLUDED_FILE_PATTERNS = [
  /\.spec\.[jt]sx?$/,
  /\.test\.[jt]sx?$/,
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const ENFORCE = process.argv.includes('--enforce');

const TECHNICAL_ALLOWLIST = new Set([
  'API',
  'BS',
  'CLI',
  'Claude',
  'CRM',
  'CSS',
  'CDU',
  'Codex',
  'Ctrl',
  'Cmd',
  'CNY',
  'DAG',
  'EUR',
  'ERP',
  'FSM',
  'Flash',
  'Gemini',
  'Git',
  'GR',
  'GRIPIL',
  'GPT',
  'HDRI',
  'Haiku',
  'HR',
  'HTTP',
  'IBAN',
  'JSON',
  'JWT',
  'KPI',
  'LLM',
  'Lite',
  'Mini',
  'OFS',
  'PAYLOAD',
  'PDF',
  'PII',
  'Pro',
  'Promise',
  'QR',
  'R&D',
  'RAI',
  'REST',
  'ROI',
  'RND',
  'RUB',
  'SEU',
  'SHA',
  'SMS',
  'SLO',
  'SRI',
  'Sonnet',
  'SQL',
  'SWIFT',
  'Telegram',
  'URL',
  'USD',
  'WEBAPP',
  'EXR',
]);

const PATTERNS = [
  { kind: 'jsx', regex: />\s*([^<>{}\n][^<>{}\n]{1,160}?)\s*</g },
  { kind: 'prop', regex: /\b(?:label|title|placeholder|description|subtitle|aria-label|alt|helperText|emptyText|message|triggerLabel|text)\s*=\s*["'`]([^"'`\n]{2,200})["'`]/g },
  { kind: 'object', regex: /\b(?:label|title|description|message|subtitle|placeholder|text|error)\s*:\s*["'`]([^"'`\n]{2,200})["'`]/g },
  { kind: 'throw', regex: /throw new Error\(\s*["'`]([^"'`\n]{2,200})["'`]\s*\)/g },
];

function shouldSkipFile(filePath) {
  if (!EXTENSIONS.has(path.extname(filePath))) {
    return true;
  }

  if (EXCLUDED_PATH_PARTS.some((part) => filePath.includes(`${path.sep}${part}${path.sep}`))) {
    return true;
  }

  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function walk(dirPath, bucket = []) {
  if (!fs.existsSync(dirPath)) {
    return bucket;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const nextPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(nextPath, bucket);
      continue;
    }

    if (!shouldSkipFile(nextPath)) {
      bucket.push(nextPath);
    }
  }

  return bucket;
}

function looksTechnical(text) {
  if (/https?:\/\//i.test(text) || /^\/[A-Za-z0-9/_-]+$/.test(text)) {
    return true;
  }

  if (/SHA-\d+/i.test(text)) {
    return true;
  }

  if (/^(?:GPT|Claude|Gemini)[A-Za-z0-9 .-]+$/.test(text.trim())) {
    return true;
  }

  if (/scripts\/[A-Za-z0-9._/-]+/.test(text) || /\b[A-Za-z0-9_-]+\.(?:py|ts|tsx|js|jsx|json)\b/.test(text)) {
    return true;
  }

  if (/^[A-Z0-9_:/.+# -]+$/.test(text) && !/\b(?:Active|Warning|Draft|Review|Approved)\b/i.test(text)) {
    return true;
  }

  if (/[`]/.test(text) && !/\b[A-Za-z]{3,}\b/.test(text.replace(/`[^`]*`/g, ''))) {
    return true;
  }

  return false;
}

function isAllowedWord(word) {
  return TECHNICAL_ALLOWLIST.has(word) || TECHNICAL_ALLOWLIST.has(word.toUpperCase());
}

function isViolation(text) {
  const stripped = text.replace(/\$\{[^}]+\}/g, ' ');

  if (!/[A-Za-z]/.test(stripped)) {
    return false;
  }

  if (looksTechnical(stripped)) {
    return false;
  }

  const words = stripped.match(/[A-Za-z][A-Za-z&/-]*/g) ?? [];
  if (words.length === 0) {
    return false;
  }

  const meaningfulWords = words.filter((word) => word.length >= 3);
  if (meaningfulWords.length === 0) {
    return false;
  }

  return meaningfulWords.some((word) => !isAllowedWord(word));
}

function scanFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  const lines = source.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) {
      continue;
    }

    for (const { kind, regex } of PATTERNS) {
      for (const match of line.matchAll(regex)) {
        const text = match[1].trim();
        if (
          (
            kind === 'jsx' &&
            (
              line.includes('function ') ||
              line.includes('=>') ||
              line.includes('Promise<') ||
              line.includes('):') ||
              line.includes('&&') ||
              line.includes('?')
            )
          ) ||
          (
            (kind === 'object' || kind === 'prop') &&
            line.includes('${') &&
            line.includes('?')
          )
        ) {
          continue;
        }
        if (!text || !isViolation(text)) {
          continue;
        }

        findings.push({
          filePath,
          kind,
          line: index + 1,
          text,
        });
      }
    }
  }

  return findings;
}

const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const findings = files.flatMap((filePath) => scanFile(filePath));

if (findings.length === 0) {
  console.log('UI language audit: нарушений не найдено.');
  process.exit(0);
}

console.log('UI language audit: найдены подозрительные англоязычные пользовательские строки.');
for (const finding of findings) {
  const relativePath = path.relative(ROOT, finding.filePath);
  console.log(`${relativePath}:${finding.line} [${finding.kind}] ${finding.text}`);
}

console.log(`Всего нарушений: ${findings.length}`);

if (ENFORCE) {
  process.exit(1);
}
