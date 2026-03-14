#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('../../packages/prisma-client/generated-client');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function singleValue(sql) {
  const rows = await prisma.$queryRawUnsafe(sql);
  const row = rows[0] || {};
  const key = Object.keys(row)[0];
  return Number(row[key] || 0);
}

async function run() {
  const generatedAt = new Date().toISOString();
  const counts = {
    threadsNull: await singleValue('SELECT COUNT(*) FROM "rai_front_office_threads" WHERE "tenantId" IS NULL'),
    messagesNull: await singleValue('SELECT COUNT(*) FROM "rai_front_office_thread_messages" WHERE "tenantId" IS NULL'),
    handoffsNull: await singleValue('SELECT COUNT(*) FROM "rai_front_office_handoffs" WHERE "tenantId" IS NULL'),
    participantNull: await singleValue('SELECT COUNT(*) FROM "rai_front_office_thread_participant_states" WHERE "tenantId" IS NULL'),
    messageMismatch: await singleValue(`
      SELECT COUNT(*)
      FROM "rai_front_office_thread_messages" m
      JOIN "rai_front_office_threads" t ON t.id = m."threadId"
      WHERE m."tenantId" IS DISTINCT FROM t."tenantId"
    `),
    handoffMismatch: await singleValue(`
      SELECT COUNT(*)
      FROM "rai_front_office_handoffs" h
      JOIN "rai_front_office_threads" t ON t.id = h."threadId"
      WHERE h."tenantId" IS DISTINCT FROM t."tenantId"
    `),
    participantMismatch: await singleValue(`
      SELECT COUNT(*)
      FROM "rai_front_office_thread_participant_states" p
      JOIN "rai_front_office_threads" t ON t.id = p."threadId"
      WHERE p."tenantId" IS DISTINCT FROM t."tenantId"
    `),
  };

  const md = [
    '# DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION',
    '',
    `- Generated at: \`${generatedAt}\``,
    '- Scope: `FrontOfficeThread` family Phase 7 wave-1.',
    '',
    '## Null backlog',
    '',
    '| Table | Null tenantId rows |',
    '| --- | ---: |',
    `| \`rai_front_office_threads\` | ${counts.threadsNull} |`,
    `| \`rai_front_office_thread_messages\` | ${counts.messagesNull} |`,
    `| \`rai_front_office_handoffs\` | ${counts.handoffsNull} |`,
    `| \`rai_front_office_thread_participant_states\` | ${counts.participantNull} |`,
    '',
    '## Parent-child tenant consistency',
    '',
    '| Check | Mismatches |',
    '| --- | ---: |',
    `| \`message.thread tenantId\` | ${counts.messageMismatch} |`,
    `| \`handoff.thread tenantId\` | ${counts.handoffMismatch} |`,
    `| \`participant.thread tenantId\` | ${counts.participantMismatch} |`,
    '',
    '## Gate',
    '',
    counts.messageMismatch === 0 &&
    counts.handoffMismatch === 0 &&
    counts.participantMismatch === 0
      ? '- Shadow-validation consistency check: `PASS`.'
      : '- Shadow-validation consistency check: `FAIL`.',
    '',
    '- Rollback path: keep `companyId`-based read/write path as compatibility fallback.',
  ].join('\n');

  const out = path.resolve(
    process.cwd(),
    'docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION.md',
  );
  fs.writeFileSync(out, md + '\n');
  console.log(out);

  if (
    counts.messageMismatch > 0 ||
    counts.handoffMismatch > 0 ||
    counts.participantMismatch > 0
  ) {
    process.exit(1);
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
