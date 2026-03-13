#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const canonical = path.join(root, 'packages/prisma-client/schema.prisma');
const composed = path.join(root, 'packages/prisma-client/schema.composed.prisma');

function count(re, text) { return (text.match(re) || []).length; }

function modelSet(text) {
  return new Set(Array.from(text.matchAll(/^model\s+(\w+)\s*\{/gm)).map((m) => m[1]));
}

function enumSet(text) {
  return new Set(Array.from(text.matchAll(/^enum\s+(\w+)\s*\{/gm)).map((m) => m[1]));
}

function diff(a, b) {
  const out = [];
  for (const v of a) if (!b.has(v)) out.push(v);
  return out;
}

if (!fs.existsSync(canonical) || !fs.existsSync(composed)) {
  console.error('Missing schema.prisma or schema.composed.prisma');
  process.exit(1);
}

const c = fs.readFileSync(canonical, 'utf8');
const x = fs.readFileSync(composed, 'utf8');

const cm = modelSet(c), xm = modelSet(x);
const ce = enumSet(c), xe = enumSet(x);

const modelMissing = diff(cm, xm);
const modelExtra = diff(xm, cm);
const enumMissing = diff(ce, xe);
const enumExtra = diff(xe, ce);

console.log('Prisma Fragment Check');
console.log(`canonical models=${cm.size}, composed models=${xm.size}`);
console.log(`canonical enums=${ce.size}, composed enums=${xe.size}`);

if (modelMissing.length || modelExtra.length || enumMissing.length || enumExtra.length) {
  if (modelMissing.length) console.log('modelMissing:', modelMissing.join(','));
  if (modelExtra.length) console.log('modelExtra:', modelExtra.join(','));
  if (enumMissing.length) console.log('enumMissing:', enumMissing.join(','));
  if (enumExtra.length) console.log('enumExtra:', enumExtra.join(','));
  process.exit(1);
}

if (!/^generator\s+client/m.test(x) || !/^datasource\s+db/m.test(x)) {
  console.error('composed schema misses generator/datasource');
  process.exit(1);
}

console.log('ok');
