import { PrismaClient } from './generated-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const prisma = new PrismaClient();

async function main() {
    console.log('Dropping redundant trigger trg_double_entry_symmetry...');
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_double_entry_symmetry ON "ledger_entries";`);

    console.log('Verifying validate_double_entry_deferred_v6 source...');

    const hashType: any[] = await prisma.$queryRaw`SELECT pg_typeof(hashtext('test'))::text as type`;
    console.log('hashtext type:', hashType[0]?.type);

    await prisma.$disconnect();
}

main();
