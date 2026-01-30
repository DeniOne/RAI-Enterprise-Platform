
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const requests = await prisma.employeeRegistrationRequest.findMany({
        orderBy: { created_at: 'desc' },
        take: 5
    });

    console.log('Recent Registration Requests:');
    requests.forEach(r => {
        console.log(`ID: ${r.id}`);
        console.log(`Telegram: ${r.telegram_id}`);
        console.log(`Status: ${r.status}`);
        console.log(`Current Step: ${r.current_step}`);
        console.log(`Updated At: ${r.updated_at}`);
        console.log('---');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
