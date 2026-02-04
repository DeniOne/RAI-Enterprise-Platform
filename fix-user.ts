import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.update({
            where: { email: 'admin@example.com' },
            data: { telegramId: '441610858' },
        });
        console.log('✅ Updated user:', user.email, 'with telegramId:', user.telegramId);
    } catch (error) {
        console.error('❌ Failed to update user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
