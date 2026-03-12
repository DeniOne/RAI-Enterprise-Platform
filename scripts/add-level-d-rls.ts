import { Prisma, PrismaClient } from '../packages/prisma-client/generated-client';

const prisma = new PrismaClient();

async function main() {
    console.log('🛡️ Applying Level D Row-Level Security (RLS) Policies...');

    const tables = [
        'rai_model_versions',
        'rai_training_runs',
        'rai_drift_reports',
        'rai_learning_events'
    ];

    try {
        for (const table of tables) {
            console.log(`🔹 Enabling RLS for ${table}...`);
            const tableRef = Prisma.raw(`"${table}"`);

            // 1. Enable RLS
            await prisma.$executeRaw(
                Prisma.sql`ALTER TABLE ${tableRef} ENABLE ROW LEVEL SECURITY;`,
            );

            // 2. Drop existing policy if any
            await prisma.$executeRaw(
                Prisma.sql`DROP POLICY IF EXISTS tenant_isolation ON ${tableRef};`,
            );

            // 3. Create Policy (Isolation based on app.current_company_id)
            await prisma.$executeRaw(
                Prisma.sql`
                    CREATE POLICY tenant_isolation ON ${tableRef}
                    FOR ALL
                    USING ("companyId" = current_setting('app.current_company_id', true));
                `,
            );

            // 4. Force RLS for table owner (important for rai_admin if it's the owner)
            await prisma.$executeRaw(
                Prisma.sql`ALTER TABLE ${tableRef} FORCE ROW LEVEL SECURITY;`,
            );
        }

        console.log('✅ Level D RLS Policies applied successfully.');

    } catch (error) {
        console.error('❌ Failed to apply RLS policies:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
