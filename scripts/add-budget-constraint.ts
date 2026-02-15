import { PrismaClient } from '@rai/prisma-client';

async function main() {
    const prisma = new PrismaClient();
    console.log('Adding "amount_non_negative" constraint to "consulting_budget_plans"...');

    try {
        // Constraint 1: totalActualAmount >= 0
        await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'budget_plan_total_actual_non_negative'
        ) THEN
          ALTER TABLE "consulting_budget_plans"
          ADD CONSTRAINT "budget_plan_total_actual_non_negative"
          CHECK ("totalActualAmount" >= 0);
          RAISE NOTICE 'Constraint budget_plan_total_actual_non_negative added';
        ELSE
          RAISE NOTICE 'Constraint budget_plan_total_actual_non_negative already exists';
        END IF;
      END
      $$;
    `);

        // Constraint 2: totalPlannedAmount >= 0
        await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'budget_plan_total_planned_non_negative'
        ) THEN
          ALTER TABLE "consulting_budget_plans"
          ADD CONSTRAINT "budget_plan_total_planned_non_negative"
          CHECK ("totalPlannedAmount" >= 0);
          RAISE NOTICE 'Constraint budget_plan_total_planned_non_negative added';
        ELSE
          RAISE NOTICE 'Constraint budget_plan_total_planned_non_negative already exists';
        END IF;
      END
      $$;
    `);

        console.log('Constraints check completed.');
    } catch (e) {
        console.error('Error adding constraints:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
