import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 Checking for existing user...');

        // Check by Email
        const userByEmail = await prisma.user.findUnique({
            where: { email: 'admin@example.com' },
        });
        console.log('User by Email:', userByEmail);

        // Check by Telegram ID
        const userByTg = await prisma.user.findFirst({
            where: { telegramId: '441610858' },
        });
        console.log('User by Telegram ID:', userByTg);

        if (userByEmail) {
            console.log('🔄 Updating existing user...');
            const updated = await prisma.user.update({
                where: { email: 'admin@example.com' },
                data: {
                    telegramId: '441610858',
                    name: 'Admin',
                    role: 'ADMIN'
                },
            });
            console.log('✅ User updated:', updated);
        } else {
            console.log('🆕 Creating new user...');
            const created = await prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    telegramId: '441610858',
                    name: 'Admin',
                    role: 'ADMIN',
                    passwordHash: 'placeholder_hash_for_now' // We aren't using password auth yet but schema might require it
                },
            });
            console.log('✅ User created:', created);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
