
import { PrismaClient } from '@rai/prisma-client';

async function test() {
    const url = 'postgresql://rai_admin:secret@127.0.0.1:5432/rai_platform?schema=public';
    console.log('Connecting to:', url);
    const prisma = new PrismaClient({
        datasources: {
            db: { url },
        },
    });

    try {
        await prisma.$connect();
        console.log('✅ Connection Successful!');
        const usersCount = await prisma.user.count();
        console.log('Users count:', usersCount);

        const tables: any[] = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
    } catch (err) {
        console.error('❌ Connection Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
