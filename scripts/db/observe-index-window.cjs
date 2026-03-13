#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('../../packages/prisma-client/generated-client');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const CANDIDATES = [
  { table: 'seasons', indexes: ['seasons_companyId_status_idx', 'seasons_status_companyId_idx'] },
  { table: 'tasks', indexes: ['tasks_companyId_idx'] },
  { table: 'harvest_plans', indexes: ['harvest_plans_companyId_idx'] },
  { table: 'commerce_parties', indexes: ['commerce_parties_companyId_legalName_idx', 'commerce_parties_companyId_status_createdAt_idx'] },
];

async function run() {
  const snapshotAt = new Date().toISOString();
  const windowDays = 14;

  const idxRows = await prisma.$queryRawUnsafe(`
    SELECT
      ui.schemaname,
      ui.relname,
      ui.indexrelname,
      ui.idx_scan,
      ui.idx_tup_read,
      ui.idx_tup_fetch,
      pg_relation_size(ui.indexrelid) AS index_size_bytes,
      pg_get_indexdef(ui.indexrelid) AS index_def
    FROM pg_stat_user_indexes ui
  `);

  const tableRows = await prisma.$queryRawUnsafe(`
    SELECT
      schemaname,
      relname,
      n_live_tup,
      n_tup_ins,
      n_tup_upd,
      n_tup_del,
      seq_scan,
      idx_scan
    FROM pg_stat_user_tables
  `);

  const idxByName = new Map(idxRows.map((r) => [r.indexrelname, r]));
  const tblByName = new Map(tableRows.map((r) => [r.relname, r]));

  const lines = [];
  lines.push('# DB_INDEX_OBSERVATION_WINDOW_2026-03-13');
  lines.push('');
  lines.push(`- Snapshot at: \`${snapshotAt}\``);
  lines.push(`- Observation window: \`${windowDays} days\``);
  lines.push('- Goal: подтвердить low-value index removal перед drop wave.');
  lines.push('');

  lines.push('## Candidate index usage snapshot');
  lines.push('');
  lines.push('| Table | Index | idx_scan | idx_tup_read | idx_tup_fetch | index_size_bytes | Observation |');
  lines.push('| --- | --- | ---: | ---: | ---: | ---: | --- |');

  for (const c of CANDIDATES) {
    for (const idx of c.indexes) {
      const r = idxByName.get(idx);
      if (!r) {
        lines.push(`| \`${c.table}\` | \`${idx}\` | n/a | n/a | n/a | n/a | index not found in current DB |`);
        continue;
      }
      const observation = Number(r.idx_scan) === 0 ? 'candidate for removal (needs full window)' : 'used (keep)';
      lines.push(`| \`${c.table}\` | \`${idx}\` | ${r.idx_scan} | ${r.idx_tup_read} | ${r.idx_tup_fetch} | ${r.index_size_bytes} | ${observation} |`);
    }
  }

  lines.push('');
  lines.push('## Table write pressure snapshot');
  lines.push('');
  lines.push('| Table | n_live_tup | n_tup_ins | n_tup_upd | n_tup_del | seq_scan | idx_scan |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');

  for (const c of CANDIDATES) {
    const t = tblByName.get(c.table);
    if (!t) {
      lines.push(`| \`${c.table}\` | n/a | n/a | n/a | n/a | n/a | n/a |`);
      continue;
    }
    lines.push(`| \`${c.table}\` | ${t.n_live_tup} | ${t.n_tup_ins} | ${t.n_tup_upd} | ${t.n_tup_del} | ${t.seq_scan} | ${t.idx_scan} |`);
  }

  lines.push('');
  lines.push('## Decision policy');
  lines.push('');
  lines.push('- Drop допускается только если `idx_scan=0` на всем observation window и нет регрессий по latency.');
  lines.push('- Для mirror pair `season_company_status_idx` / `season_status_company_idx` удаляется только один индекс после финального confirm.');
  lines.push('- Перед drop обязателен rollback migration для recreate индекса.');

  const out = path.resolve(process.cwd(), 'docs/01_ARCHITECTURE/DATABASE/DB_INDEX_OBSERVATION_WINDOW_2026-03-13.md');
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(out);
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
