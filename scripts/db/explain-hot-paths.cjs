#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('../../packages/prisma-client/generated-client');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function explain(sql, params = []) {
  const rows = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`, ...params);
  return rows.map((r) => r['QUERY PLAN']).join('\n');
}

async function one(sql, params = []) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows[0] || null;
}

function section(title, sql, plan, note = '') {
  return [
    `## ${title}`,
    '',
    note ? `- ${note}` : '',
    note ? '' : '',
    '```sql',
    sql.trim(),
    '```',
    '',
    '```text',
    plan,
    '```',
    '',
  ].join('\n');
}

async function run() {
  const now = new Date().toISOString();

  const sampleCompany = await one(`
    SELECT "companyId" FROM seasons
    UNION ALL
    SELECT "companyId" FROM tasks
    UNION ALL
    SELECT "companyId" FROM harvest_plans
    UNION ALL
    SELECT "companyId" FROM commerce_parties
    LIMIT 1
  `);

  if (!sampleCompany || !sampleCompany.companyId) {
    throw new Error('No sample companyId found in seasons/tasks/harvest_plans/commerce_parties');
  }

  const companyId = sampleCompany.companyId;

  const seasonRow = await one(
    `SELECT id, status FROM seasons WHERE "companyId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [companyId],
  );
  const taskRow = await one(
    `SELECT status FROM tasks WHERE "companyId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [companyId],
  );
  const hpRow = await one(
    `SELECT "seasonId", status FROM harvest_plans WHERE "companyId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [companyId],
  );
  const partyRow = await one(
    `SELECT status FROM commerce_parties WHERE "companyId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [companyId],
  );

  const seasonStatus = seasonRow?.status || 'DRAFT';
  const taskStatus = taskRow?.status || 'PLANNED';
  const seasonId = hpRow?.seasonId || seasonRow?.id;
  const partyStatus = partyRow?.status || 'ACTIVE';

  const blocks = [];

const q1 = `SELECT id, "companyId", status, "createdAt"
FROM seasons
WHERE "companyId" = $1 AND status = $2::"SeasonStatus"
ORDER BY "createdAt" DESC
LIMIT 50;`;
  blocks.push(section(
    'Season hot path: companyId + status + createdAt DESC',
    q1,
    await explain(q1, [companyId, seasonStatus]),
    `params: companyId=${companyId}, status=${seasonStatus}`,
  ));

const q2 = `SELECT id, "companyId", "seasonId", status, "createdAt"
FROM tasks
WHERE "companyId" = $1 AND status = $2::"TaskStatus"
ORDER BY "createdAt" DESC
LIMIT 100;`;
  blocks.push(section(
    'Task hot path: companyId + status + createdAt DESC',
    q2,
    await explain(q2, [companyId, taskStatus]),
    `params: companyId=${companyId}, status=${taskStatus}`,
  ));

  const q3 = `SELECT id, "companyId", "seasonId", status, "createdAt"
FROM harvest_plans
WHERE "companyId" = $1 AND "seasonId" = $2
ORDER BY "createdAt" DESC
LIMIT 100;`;
  blocks.push(section(
    'HarvestPlan hot path: companyId + seasonId + createdAt DESC',
    q3,
    await explain(q3, [companyId, seasonId]),
    `params: companyId=${companyId}, seasonId=${seasonId}`,
  ));

const q4 = `SELECT id, "companyId", status, "createdAt"
FROM commerce_parties
WHERE "companyId" = $1 AND status = $2::"PartyEntityStatus"
ORDER BY "createdAt" DESC
LIMIT 100;`;
  blocks.push(section(
    'Party hot path: companyId + status + createdAt DESC',
    q4,
    await explain(q4, [companyId, partyStatus]),
    `params: companyId=${companyId}, status=${partyStatus}`,
  ));

  const md = [
    '# DB_EXPLAIN_ANALYZE_2026-03-13',
    '',
    `- Generated at: \
\`${now}\``,
    '- Source: staging/local DB from `.env` `DATABASE_URL`',
    '- Scope: `Season`, `Task`, `HarvestPlan`, `Party` hot-path queries',
    '',
    ...blocks,
  ].join('\n');

  const out = path.resolve(process.cwd(), 'docs/01_ARCHITECTURE/DATABASE/DB_EXPLAIN_ANALYZE_2026-03-13.md');
  fs.writeFileSync(out, md);
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
