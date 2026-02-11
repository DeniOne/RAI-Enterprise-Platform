
import { PrismaClient } from '@rai/prisma-client';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env loading
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Checking .env at: ${envPath}`);
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;

        const firstEquals = trimmedLine.indexOf('=');
        if (firstEquals === -1) return;

        const key = trimmedLine.substring(0, firstEquals).trim();
        let value = trimmedLine.substring(firstEquals + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (key && !process.env[key]) {
            process.env[key] = value;
            if (key === 'DATABASE_URL') console.log(`Set DATABASE_URL from .env: ${value}`);
        }
    });
} else {
    console.error('.env not found!');
}

console.log(`Final DATABASE_URL in process.env: ${process.env.DATABASE_URL}`);

const prisma = new PrismaClient();

async function main() {
    const correctId = '441610858';
    const email = 'admin@example.com';

    console.log(`Attempting to update user with email ${email} to ID ${correctId}`);

    try {
        // 1. Ensure Default Company exists
        const company = await prisma.company.upsert({
            where: { id: 'default-rai-company' },
            update: {},
            create: {
                id: 'default-rai-company',
                name: 'RAI Enterprise',
            },
        });

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            console.log(`Found user: ${user.email} (Current ID: ${user.telegramId})`);
            const updated = await prisma.user.update({
                where: { id: user.id },
                data: {
                    telegramId: correctId,
                    company: { connect: { id: company.id } }
                }
            });
            console.log(`✅ Successfully updated to ID: ${updated.telegramId}`);
        } else {
            console.log(`❌ User ${email} not found. Creating user...`);
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name: 'Admin',
                    role: 'ADMIN',
                    telegramId: correctId,
                    company: { connect: { id: company.id } }
                }
            });
            console.log(`✅ Created new user with ID: ${newUser.telegramId}`);
        }
    } catch (err) {
        console.error('Prisma Error:', err);
    }
}

main()
    .finally(() => prisma.$disconnect());
