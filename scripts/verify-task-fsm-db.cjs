#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('../packages/prisma-client/generated-client');

const prisma = new PrismaClient();

async function queryOne(sql) {
  const rows = await prisma.$queryRawUnsafe(sql);
  return rows?.[0] || {};
}

async function main() {
  const policyTable = await queryOne(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema='public' AND table_name='fsm_allowed_transitions'
    ) AS present
  `);
  const trigger = await queryOne(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      WHERE c.relname = 'tasks'
        AND t.tgname = 'trg_validate_task_fsm_transition'
        AND NOT t.tgisinternal
    ) AS present
  `);
  const fn = await queryOne(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE proname = 'validate_task_fsm_transition'
    ) AS present
  `);

  const policySeed = await queryOne(`
    SELECT COUNT(*)::int AS cnt
    FROM fsm_allowed_transitions
    WHERE entity_type = 'Task' AND is_enabled = TRUE
  `).catch(() => ({ cnt: 0 }));

  const policyTablePresent = Boolean(policyTable.present);
  const triggerPresent = Boolean(trigger.present);
  const fnPresent = Boolean(fn.present);
  const seedCount = Number(policySeed.cnt || 0);

  console.log(`[task-fsm-db] policy_table_present=${policyTablePresent}`);
  console.log(`[task-fsm-db] trigger_present=${triggerPresent}`);
  console.log(`[task-fsm-db] function_present=${fnPresent}`);
  console.log(`[task-fsm-db] enabled_task_transitions=${seedCount}`);

  if (!policyTablePresent || !triggerPresent || !fnPresent || seedCount === 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('[task-fsm-db] failed:', err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

