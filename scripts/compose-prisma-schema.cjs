#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const fragmentsDir = path.join(root, 'packages/prisma-client/schema-fragments');
const outPath = path.join(root, 'packages/prisma-client/schema.composed.prisma');

const order = [
  '00_base.prisma',
  '01_platform_core.prisma',
  '02_org_legal.prisma',
  '03_agri_planning.prisma',
  '04_agri_execution.prisma',
  '05_finance.prisma',
  '06_crm_commerce.prisma',
  '07_ai_runtime.prisma',
  '08_integration_reliability.prisma',
  '09_quarantine_sandbox.prisma',
  '10_legacy_bridge.prisma',
];

const chunks = [];
for (const file of order) {
  const p = path.join(fragmentsDir, file);
  if (!fs.existsSync(p)) continue;
  chunks.push(fs.readFileSync(p, 'utf8').trim());
}

const content = chunks.filter(Boolean).join('\n\n') + '\n';
fs.writeFileSync(outPath, content, 'utf8');
console.log(`Composed schema written: ${outPath}`);
