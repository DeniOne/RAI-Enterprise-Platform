
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const telegramId = '441615808';
    const email = 'admin@example.com';

    // 1. Ensure Default Company exists
    const company = await prisma.company.upsert({
        where: { id: 'default-rai-company' },
        update: {},
        create: {
            id: 'default-rai-company',
            name: 'RAI Enterprise',
        },
    });

    // Check if user exists
    let user = await prisma.user.findFirst({
        where: { email }
    });

    if (!user) {
        console.log('⚠️ No users found. Creating initial admin user...');
        user = await prisma.user.create({
            data: {
                email,
                role: UserRole.ADMIN,
                telegramId,
                emailVerified: true,
                accessLevel: 'ACTIVE',
                company: { connect: { id: company.id } }
            },
        });
        console.log(`✅ Created user: ${user.email} with Telegram ID: ${user.telegramId}`);
    } else {
        console.log(`🔍 Found user: ${user.email} (${user.id})`);
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                telegramId,
                company: { connect: { id: company.id } }
            },
        });
        console.log(`✅ Updated user ${updatedUser.email} with Telegram ID: ${updatedUser.telegramId}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
