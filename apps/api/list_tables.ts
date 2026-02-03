
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env loading
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        const firstEquals = trimmedLine.indexOf('=');
        if (firstEquals === -1) return;
        const key = trimmedLine.substring(0, firstEquals).trim();
        let value = trimmedLine.substring(firstEquals + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    });
}

const prisma = new PrismaClient();

async function main() {
    console.log('Listing tables in public schema:');
    const result: any[] = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(result.map(r => r.table_name).join(', '));
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
