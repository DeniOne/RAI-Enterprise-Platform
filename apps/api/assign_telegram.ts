
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const telegramId = '441615808';

    // Find the first user (usually admin/developer)
    const user = await prisma.user.findFirst();

    if (!user) {
        console.error('❌ No users found in the database. Please seed the database first.');
        process.exit(1);
    }

    console.log(`🔍 Found user: ${user.email} (${user.id})`);

    // Update user with Telegram ID
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { telegramId },
    });

    console.log(`✅ User ${updatedUser.email} linked to Telegram ID: ${updatedUser.telegramId}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
