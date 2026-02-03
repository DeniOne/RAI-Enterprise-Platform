
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:postgres@127.0.0.1:5432/rai_platform?schema=public',
        },
    },
});

async function main() {
    const correctId = '441610858';
    const email = 'admin@example.com';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        console.log(`Found user ${user.email} with current ID: ${user.telegramId}`);
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { telegramId: correctId },
        });
        console.log(`✅ Updated to ID: ${updated.telegramId}`);
    } else {
        console.log(`User ${email} not found. Creating...`);
        const newUser = await prisma.user.create({
            data: {
                email,
                name: 'Admin',
                role: 'ADMIN',
                telegramId: correctId,
            },
        });
        console.log(`✅ Created with ID: ${newUser.telegramId}`);
    }

    // Double check all users with this Telegram ID
    const allWithId = await prisma.user.findMany({ where: { telegramId: correctId } });
    console.log('All users with this Telegram ID:', allWithId.map(u => u.email));
}

main()
    .catch(e => console.error('Error:', e))
    .finally(() => prisma.$disconnect());
