import { prisma } from './src/config/prisma';
import { logger } from './src/config/logger';

async function main() {
    try {
        console.log('Testing Prisma connection...');
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

        const firstUser = await prisma.user.findFirst();
        console.log('First user:', firstUser ? { id: firstUser.id, email: firstUser.email } : 'None');

        console.log('Testing admission_status access...');
        if (firstUser) {
            console.log('Admission Status:', (firstUser as any).admission_status);
        }
    } catch (error: any) {
        console.error('Prisma test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
