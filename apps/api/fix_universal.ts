
import { PrismaClient } from '@prisma/client';

async function fixAll() {
    const ports = [5432, 5433];
    const users = [
        { u: 'postgres', p: 'postgres' },
        { u: 'rai_admin', p: 'secret' }
    ];
    const targetId = '441610858';
    const targetEmail = 'admin@example.com';

    for (const port of ports) {
        for (const creds of users) {
            const url = `postgresql://${creds.u}:${creds.p}@127.0.0.1:${port}/rai_platform?schema=public`;
            console.log(`Trying: ${url}`);
            const prisma = new PrismaClient({ datasources: { db: { url } } });

            try {
                await prisma.$connect();
                console.log(`  ✅ Connected!`);

                const updated = await prisma.user.upsert({
                    where: { email: targetEmail },
                    update: { telegramId: targetId },
                    create: {
                        email: targetEmail,
                        name: 'Admin',
                        role: 'ADMIN',
                        telegramId: targetId,
                    }
                });
                console.log(`  ✅ Successfully updated/created user on port ${port} as ${creds.u}: ${updated.email}`);

                // Double check
                const check = await prisma.user.findUnique({ where: { email: targetEmail } });
                console.log(`  🔍 Verification: TG ID is ${check?.telegramId}`);

            } catch (err: any) {
                console.log(`  ❌ Failed: ${err.message.split('\n')[0]}`);
            } finally {
                await prisma.$disconnect();
            }
        }
    }
}

fixAll();
