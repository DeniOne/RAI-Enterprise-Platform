#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, 'apps/api/src');
const exts = new Set(['.ts', '.tsx']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

function findMatchingBrace(s, openIdx) {
  let depth = 0;
  let str = null;
  for (let i = openIdx; i < s.length; i++) {
    const ch = s[i];
    const prev = s[i - 1];
    if (str) {
      if (ch === str && prev !== '\\') str = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      str = ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function includeDepth(objText) {
  let max = 1;
  const re = /\binclude\s*:\s*\{/g;
  let m;
  while ((m = re.exec(objText))) {
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(objText, open);
    if (close < 0) continue;
    const sub = objText.slice(open + 1, close);
    max = Math.max(max, 1 + includeDepth(sub));
    re.lastIndex = close + 1;
  }
  return max;
}

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const hits = [];
  const re = /\binclude\s*:\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(text, open);
    if (close < 0) continue;
    const obj = text.slice(open + 1, close);
    const depth = includeDepth(obj);
    hits.push(depth);
    re.lastIndex = close + 1;
  }
  return hits;
}

const files = walk(TARGET_DIR);
const depths = [];
const perFile = [];
for (const file of files) {
  const hits = scanFile(file);
  if (!hits.length) continue;
  for (const d of hits) depths.push(d);
  perFile.push({
    file: path.relative(ROOT, file),
    includeBlocks: hits.length,
    maxDepth: Math.max(...hits),
    medianDepth: hits.slice().sort((a, b) => a - b)[Math.floor(hits.length / 2)],
  });
}

function median(arr) {
  if (!arr.length) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const result = {
  generatedAt: new Date().toISOString(),
  filesScanned: files.length,
  includeBlocksTotal: depths.length,
  medianIncludeDepth: median(depths),
  p95IncludeDepth: (() => {
    if (!depths.length) return 0;
    const s = depths.slice().sort((a, b) => a - b);
    const idx = Math.floor(0.95 * (s.length - 1));
    return s[idx];
  })(),
  maxIncludeDepth: depths.length ? Math.max(...depths) : 0,
  topHeavyFiles: perFile
    .sort((a, b) => b.maxDepth - a.maxDepth || b.includeBlocks - a.includeBlocks)
    .slice(0, 15),
};

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(result, null, 2));
} else {
  console.log(`files_scanned=${result.filesScanned}`);
  console.log(`include_blocks_total=${result.includeBlocksTotal}`);
  console.log(`median_include_depth=${result.medianIncludeDepth}`);
  console.log(`p95_include_depth=${result.p95IncludeDepth}`);
  console.log(`max_include_depth=${result.maxIncludeDepth}`);
  for (const f of result.topHeavyFiles) {
    console.log(`${f.file}: blocks=${f.includeBlocks} max=${f.maxDepth} median=${f.medianDepth}`);
  }
}
