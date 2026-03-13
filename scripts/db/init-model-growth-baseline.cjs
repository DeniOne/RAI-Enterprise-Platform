#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(process.cwd(), 'packages/prisma-client/schema.prisma');
const outPath = path.resolve(process.cwd(), 'docs/01_ARCHITECTURE/DATABASE/DB_MODEL_GROWTH_BASELINE.json');

const schema = fs.readFileSync(schemaPath, 'utf8');
const models = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((m) => m[1]).sort();

const payload = {
  createdAt: new Date().toISOString(),
  source: 'packages/prisma-client/schema.prisma',
  modelCount: models.length,
  models,
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
console.log(outPath);
