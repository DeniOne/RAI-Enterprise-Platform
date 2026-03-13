#!/usr/bin/env node
const { spawnSync } = require('child_process');

const args = new Set(process.argv.slice(2));
const mode = args.has('--mode=enforce') ? 'enforce' : 'warn';

const checks = [
  ['split-prisma-schema-by-domain.cjs', []],
  ['compose-prisma-schema.cjs', []],
  ['check-prisma-fragments.cjs', []],
];

let failures = 0;

console.log('DB Phase 3 Fragmentation Gate');
console.log(`mode=${mode}`);

for (const [script, scriptArgs] of checks) {
  const res = spawnSync('node', [`scripts/${script}`, ...scriptArgs], {
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    failures += 1;
  }
}

if (mode === 'enforce' && failures > 0) {
  process.exit(1);
}
