import { PrismaClient } from './generated-client/index.js';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating test user...');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found. Run seed.ts first.');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('test123', 10);

    const user = await prisma.user.upsert({
        where: { email: 'test@rai.local' },
        update: {
            passwordHash: hashedPassword,
        },
        create: {
            email: 'test@rai.local',
            passwordHash: hashedPassword,
            role: 'USER',
            accessLevel: 'ACTIVE',
            companyId: company.id,
            emailVerified: true,
        },
    });

    console.log(`✅ Test user created: ${user.email}`);
    console.log(`   Password: test123`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
