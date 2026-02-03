
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Ensure Default Company
    const company = await prisma.company.upsert({
        where: { id: 'default-rai-company' }, // Using a fixed ID for stability
        update: {},
        create: {
            id: 'default-rai-company',
            name: 'RAI Enterprise',
        },
    });
    console.log(`🏢 Company ensured: ${company.name}`);

    // 2. Load Persistent Users
    const usersPath = path.resolve(__dirname, '../../apps/api/data/persistent_users.json');
    if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        for (const u of users) {
            await prisma.user.upsert({
                where: { telegramId: u.telegramId },
                update: {
                    email: u.email,
                    role: u.role,
                    accessLevel: u.accessLevel,
                    companyId: company.id,
                },
                create: {
                    telegramId: u.telegramId,
                    email: u.email,
                    role: u.role,
                    accessLevel: u.accessLevel,
                    companyId: company.id,
                    emailVerified: true,
                },
            });
            console.log(`👤 User synced: ${u.email} (TG: ${u.telegramId})`);
        }
    } else {
        console.log('⚠️ No persistent_users.json found.');
    }

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
