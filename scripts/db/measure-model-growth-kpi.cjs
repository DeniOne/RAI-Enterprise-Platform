#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const enforce = process.argv.includes('--enforce');
const threshold = 0.8;

const schemaPath = path.resolve(process.cwd(), 'packages/prisma-client/schema.prisma');
const baselinePath = path.resolve(process.cwd(), 'docs/01_ARCHITECTURE/DATABASE/DB_MODEL_GROWTH_BASELINE.json');
const manifestPath = path.resolve(process.cwd(), 'docs/01_ARCHITECTURE/DATABASE/MODEL_SCOPE_MANIFEST.md');
const outPath = path.resolve(process.cwd(), 'docs/01_ARCHITECTURE/DATABASE/DB_MODEL_GROWTH_KPI.md');

function parseModels(schema) {
  return [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((m) => m[1]);
}

function parseOwnerMap(md) {
  const ownerByModel = new Map();
  for (const line of md.split('\n')) {
    const m = line.match(/^\| `([^`]+)` \| `([^`]+)` \|/);
    if (!m) continue;
    ownerByModel.set(m[1], m[2]);
  }
  return ownerByModel;
}

function parseRelations(schema, modelsSet) {
  const rels = new Map();
  for (const model of modelsSet) rels.set(model, new Set());

  const blocks = [...schema.matchAll(/^model\s+(\w+)\s+\{([\s\S]*?)^\}/gm)];
  for (const b of blocks) {
    const model = b[1];
    const body = b[2];
    if (!modelsSet.has(model)) continue;
    for (const raw of body.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue;
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      let type = parts[1].replace(/[\[\]?]/g, '');
      if (modelsSet.has(type) && type !== model) rels.get(model).add(type);
    }
  }
  return rels;
}

const schema = fs.readFileSync(schemaPath, 'utf8');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const manifest = fs.readFileSync(manifestPath, 'utf8');

const currentModels = parseModels(schema).sort();
const baselineModels = new Set(baseline.models);
const currentSet = new Set(currentModels);
const ownerByModel = parseOwnerMap(manifest);
const relations = parseRelations(schema, currentSet);

const newModels = currentModels.filter((m) => !baselineModels.has(m));
const details = [];
let noRewire = 0;

for (const m of newModels) {
  const owner = ownerByModel.get(m) || 'unknown';
  const relTargets = [...(relations.get(m) || [])];
  const cross = relTargets.filter((t) => ownerByModel.get(t) && ownerByModel.get(t) !== owner);
  const ok = cross.length === 0;
  if (ok) noRewire++;
  details.push({ model: m, owner, relTargets, crossDomainTargets: cross, status: ok ? 'ok' : 'rewire' });
}

const total = newModels.length;
const ratio = total === 0 ? 1 : noRewire / total;

const lines = [];
lines.push('# DB_MODEL_GROWTH_KPI');
lines.push('');
lines.push(`- Baseline file: \`${path.relative(process.cwd(), baselinePath)}\``);
lines.push(`- Baseline date: \`${baseline.createdAt}\``);
lines.push(`- Snapshot date: \`${new Date().toISOString()}\``);
lines.push(`- Total current models: \`${currentModels.length}\``);
lines.push(`- New models since baseline: \`${total}\``);
lines.push(`- New models without cross-domain rewiring: \`${noRewire}\``);
lines.push(`- KPI ratio: \`${(ratio * 100).toFixed(1)}%\``);
lines.push(`- Target ratio: \">= 80%\"`);
lines.push('');

if (total === 0) {
  lines.push('## Window status');
  lines.push('');
  lines.push('- Новые модели за окно отсутствуют; KPI window активен, данных для ratio-compliance пока нет.');
  lines.push('');
} else {
  lines.push('## New model details');
  lines.push('');
  lines.push('| Model | Owner | Cross-domain targets | Status |');
  lines.push('| --- | --- | --- | --- |');
  for (const d of details) {
    lines.push(`| \`${d.model}\` | \`${d.owner}\` | ${d.crossDomainTargets.length ? d.crossDomainTargets.map((x)=>'`'+x+'`').join(', ') : '-'} | \`${d.status}\` |`);
  }
  lines.push('');
}

fs.writeFileSync(outPath, lines.join('\n') + '\n');
console.log(outPath);

if (enforce && total > 0 && ratio < threshold) {
  console.error(`Growth KPI failed: ratio ${(ratio * 100).toFixed(1)}% < 80%`);
  process.exit(1);
}
