#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('../packages/prisma-client/generated-client');

const APPLY_FLAG = '--apply';
const apply = process.argv.includes(APPLY_FLAG);

const prisma = new PrismaClient();

async function countMissing() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS cnt
    FROM outbox_messages o
    WHERE NULLIF(TRIM(o.payload::jsonb->>'companyId'), '') IS NULL
  `);
  return Number(rows?.[0]?.cnt || 0);
}

async function countMissingByAggregateType() {
  return prisma.$queryRawUnsafe(`
    SELECT COALESCE(o."aggregateType", 'NULL') AS aggregate_type, COUNT(*)::int AS cnt
    FROM outbox_messages o
    WHERE NULLIF(TRIM(o.payload::jsonb->>'companyId'), '') IS NULL
    GROUP BY COALESCE(o."aggregateType", 'NULL')
    ORDER BY cnt DESC
  `);
}

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS present
    `,
    tableName,
  );
  return Boolean(rows?.[0]?.present);
}

async function updateFromEconomicEvent() {
  return prisma.$executeRawUnsafe(`
    UPDATE outbox_messages o
    SET
      payload = jsonb_set(o.payload::jsonb, '{companyId}', to_jsonb(e."companyId"), true),
      "updatedAt" = NOW()
    FROM economic_events e
    WHERE o."aggregateId" = e.id
      AND o."aggregateType" = 'EconomicEvent'
      AND NULLIF(TRIM(o.payload::jsonb->>'companyId'), '') IS NULL
      AND e."companyId" IS NOT NULL
  `);
}

async function updateFromExecutionRecord() {
  return prisma.$executeRawUnsafe(`
    UPDATE outbox_messages o
    SET
      payload = jsonb_set(o.payload::jsonb, '{companyId}', to_jsonb(e."companyId"), true),
      "updatedAt" = NOW()
    FROM consulting_execution_records e
    WHERE o."aggregateId" = e.id
      AND o."aggregateType" = 'ExecutionRecord'
      AND NULLIF(TRIM(o.payload::jsonb->>'companyId'), '') IS NULL
      AND e."companyId" IS NOT NULL
  `);
}

async function updateFromTask() {
  return prisma.$executeRawUnsafe(`
    UPDATE outbox_messages o
    SET
      payload = jsonb_set(o.payload::jsonb, '{companyId}', to_jsonb(t."companyId"), true),
      "updatedAt" = NOW()
    FROM tasks t
    WHERE o."aggregateId" = t.id
      AND o."aggregateType" = 'Task'
      AND NULLIF(TRIM(o.payload::jsonb->>'companyId'), '') IS NULL
      AND t."companyId" IS NOT NULL
  `);
}

async function main() {
  console.log(`[outbox-backfill] mode=${apply ? 'apply' : 'dry-run'}`);
  const before = await countMissing();
  const byTypeBefore = await countMissingByAggregateType();
  console.log(`[outbox-backfill] missing_before=${before}`);
  console.log('[outbox-backfill] missing_by_aggregate_type_before=', byTypeBefore);

  if (!apply) {
    console.log(`[outbox-backfill] dry-run only. Re-run with ${APPLY_FLAG} to execute updates.`);
    return;
  }

  let economicUpdated = 0;
  let executionUpdated = 0;
  let taskUpdated = 0;

  if (await tableExists('economic_events')) {
    economicUpdated = await updateFromEconomicEvent();
  }
  if (await tableExists('consulting_execution_records')) {
    executionUpdated = await updateFromExecutionRecord();
  }
  if (await tableExists('tasks')) {
    taskUpdated = await updateFromTask();
  }

  const after = await countMissing();
  const byTypeAfter = await countMissingByAggregateType();

  console.log(`[outbox-backfill] updated_economic_event=${Number(economicUpdated || 0)}`);
  console.log(`[outbox-backfill] updated_execution_record=${Number(executionUpdated || 0)}`);
  console.log(`[outbox-backfill] updated_task=${Number(taskUpdated || 0)}`);
  console.log(`[outbox-backfill] missing_after=${after}`);
  console.log('[outbox-backfill] missing_by_aggregate_type_after=', byTypeAfter);
}

main()
  .catch((err) => {
    console.error('[outbox-backfill] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
