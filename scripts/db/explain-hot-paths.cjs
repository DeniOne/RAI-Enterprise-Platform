#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient, Prisma } = require('../../packages/prisma-client/generated-client');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function explain(sql) {
  const rows = await prisma.$queryRaw(Prisma.sql`EXPLAIN (ANALYZE, BUFFERS) ${sql}`);
  return rows.map((r) => r['QUERY PLAN']).join('\n');
}

async function one(sql) {
  const rows = await prisma.$queryRaw(sql);
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

  const sampleCompany = await one(Prisma.sql`
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
    Prisma.sql`SELECT id, status FROM seasons WHERE "companyId" = ${companyId} ORDER BY "createdAt" DESC LIMIT 1`,
  );
  const taskRow = await one(
    Prisma.sql`SELECT status FROM tasks WHERE "companyId" = ${companyId} ORDER BY "createdAt" DESC LIMIT 1`,
  );
  const hpRow = await one(
    Prisma.sql`SELECT "seasonId", status FROM harvest_plans WHERE "companyId" = ${companyId} ORDER BY "createdAt" DESC LIMIT 1`,
  );
  const partyRow = await one(
    Prisma.sql`SELECT status FROM commerce_parties WHERE "companyId" = ${companyId} ORDER BY "createdAt" DESC LIMIT 1`,
  );

  const seasonStatus = seasonRow?.status || 'DRAFT';
  const taskStatus = taskRow?.status || 'PLANNED';
  const seasonId = hpRow?.seasonId || seasonRow?.id;
  const partyStatus = partyRow?.status || 'ACTIVE';

  const blocks = [];

const q1 = Prisma.sql`SELECT id, "companyId", status, "createdAt"
FROM seasons
WHERE "companyId" = ${companyId} AND status = CAST(${seasonStatus} AS "SeasonStatus")
ORDER BY "createdAt" DESC
LIMIT 50;`;
  blocks.push(section(
    'Season hot path: companyId + status + createdAt DESC',
    q1.sql,
    await explain(q1),
    `params: companyId=${companyId}, status=${seasonStatus}`,
  ));

const q2 = Prisma.sql`SELECT id, "companyId", "seasonId", status, "createdAt"
FROM tasks
WHERE "companyId" = ${companyId} AND status = CAST(${taskStatus} AS "TaskStatus")
ORDER BY "createdAt" DESC
LIMIT 100;`;
  blocks.push(section(
    'Task hot path: companyId + status + createdAt DESC',
    q2.sql,
    await explain(q2),
    `params: companyId=${companyId}, status=${taskStatus}`,
  ));

  const q3 = Prisma.sql`SELECT id, "companyId", "seasonId", status, "createdAt"
FROM harvest_plans
WHERE "companyId" = ${companyId} AND "seasonId" = ${seasonId}
ORDER BY "createdAt" DESC
LIMIT 100;`;
  blocks.push(section(
    'HarvestPlan hot path: companyId + seasonId + createdAt DESC',
    q3.sql,
    await explain(q3),
    `params: companyId=${companyId}, seasonId=${seasonId}`,
  ));

const q4 = Prisma.sql`SELECT id, "companyId", status, "createdAt"
FROM commerce_parties
WHERE "companyId" = ${companyId} AND status = CAST(${partyStatus} AS "PartyEntityStatus")
ORDER BY "createdAt" DESC
LIMIT 100;`;
  blocks.push(section(
    'Party hot path: companyId + status + createdAt DESC',
    q4.sql,
    await explain(q4),
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
