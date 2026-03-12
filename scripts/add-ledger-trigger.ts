
import { PrismaClient } from '@rai/prisma-client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔒 Applying Strict Ledger Immutability Trigger...');

    try {
        // 1. Create Function
        await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION prevent_ledger_update()
      RETURNS TRIGGER AS $$
      BEGIN
          RAISE EXCEPTION 'Ledger entries are immutable. UPDATE/DELETE is not allowed.';
      END;
      $$ LANGUAGE plpgsql;
    `;

        // 2. Create Trigger (Drop first if exists to be idempotent)
        await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS trigger_prevent_ledger_update ON "ledger_entries";
    `;

        await prisma.$executeRaw`
      CREATE TRIGGER trigger_prevent_ledger_update
      BEFORE UPDATE OR DELETE ON "ledger_entries"
      FOR EACH ROW EXECUTE FUNCTION prevent_ledger_update();
    `;

        console.log('✅ Trigger applied successfully: trigger_prevent_ledger_update');

    } catch (error) {
        console.error('❌ Failed to apply trigger:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
