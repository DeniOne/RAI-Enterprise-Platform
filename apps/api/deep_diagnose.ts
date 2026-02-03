
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function diagnose() {
    const envPath = path.resolve(__dirname, '.env');
    console.log(`Loading .env from: ${envPath}`);

    let databaseUrl = '';
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('DATABASE_URL=')) {
                databaseUrl = trimmedLine.split('=')[1].replace(/["']/g, '');
            }
        });
    }

    console.log(`DATABASE_URL from .env: ${databaseUrl}`);

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not found in .env');
        return;
    }

    const prisma = new PrismaClient({
        datasources: { db: { url: databaseUrl } }
    });

    try {
        await prisma.$connect();
        console.log('✅ Connected to DB using .env URL');

        const dbNameResult: any = await prisma.$queryRaw`SELECT current_database()`;
        console.log('Current Database:', dbNameResult[0].current_database);

        const users = await prisma.user.findMany();
        console.log(`Total users found: ${users.length}`);
        users.forEach(u => {
            console.log(`- Email: ${u.email}, TG ID: ${u.telegramId}, Name: ${u.name}`);
        });

        const tables: any[] = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables:', tables.map(t => t.table_name).join(', '));

    } catch (err) {
        console.error('❌ Failed to connect/query:', err);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
