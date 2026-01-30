
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    try {
        console.log('--- ALL REGISTRATION REQUESTS ---');
        const requests = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id, status, telegram_id, first_name, last_name, created_at 
            FROM "employee_registration_requests"
            ORDER BY created_at DESC
        `);
        console.log(JSON.stringify(requests, null, 2));

        console.log('\n--- STATUS COUNTS ---');
        const counts = await prisma.$queryRawUnsafe<any[]>(`
            SELECT status, COUNT(*) 
            FROM "employee_registration_requests"
            GROUP BY status
        `);
        console.log(counts);

    } catch (error: any) {
        console.error('DEBUG ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
