
import { PrismaClient } from '@prisma/client';

async function test5433() {
    const url = 'postgresql://rai_admin:secret@127.0.0.1:5433/rai_platform?schema=public';
    console.log('Connecting to:', url);
    const prisma = new PrismaClient({
        datasources: { db: { url } }
    });

    try {
        await prisma.$connect();
        console.log('✅ Connected to 5433!');
        const users = await prisma.user.findMany();
        console.log(`Users on 5433:`, users.map(u => u.email));
    } catch (err) {
        console.error('❌ Failed to connect to 5433:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

test5433();
