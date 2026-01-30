
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConflicts() {
    try {
        console.log('--- CHECKING REGISTRATION CONFLICTS ---');

        // Get all requests in REVIEW status
        const requests = await prisma.$queryRaw<any[]>`
            SELECT id, email, telegram_id, first_name, last_name 
            FROM "employee_registration_requests"
            WHERE status = 'REVIEW'::registration_status
        `;

        console.log(`Found ${requests.length} requests in REVIEW status.`);

        for (const reg of requests) {
            console.log(`\nChecking request ${reg.id} (${reg.email}, TG: ${reg.telegram_id}):`);

            // Check email conflict
            const emailUser = await prisma.user.findUnique({
                where: { email: reg.email }
            });

            if (emailUser) {
                console.log(`[CONFLICT] Email ${reg.email} already exists for User ID: ${emailUser.id}`);
            } else {
                console.log(`[OK] Email ${reg.email} is available.`);
            }

            // Check telegram_id conflict
            const tgUser = await prisma.user.findFirst({
                where: { telegram_id: reg.telegram_id }
            });

            if (tgUser) {
                console.log(`[CONFLICT] Telegram ID ${reg.telegram_id} already exists for User ID: ${tgUser.id} (${tgUser.email})`);
            } else {
                console.log(`[OK] Telegram ID ${reg.telegram_id} is available.`);
            }
        }

    } catch (error: any) {
        console.error('DIAGNOSTIC ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkConflicts();
