
import { PrismaClient } from './generated-client/index.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Quick seeding jurisdictions...');

    const company = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!company) {
        console.error('❌ No company found. Please run main seed first.');
        return;
    }

    const jurisdictions = [
        { code: 'RU', name: 'Россия' },
        { code: 'BY', name: 'Беларусь' },
        { code: 'KZ', name: 'Казахстан' },
    ];

    for (const j of jurisdictions) {
        await prisma.jurisdiction.upsert({
            where: {
                companyId_code: {
                    companyId: company.id,
                    code: j.code
                }
            },
            update: { name: j.name },
            create: {
                companyId: company.id,
                code: j.code,
                name: j.name,
            }
        });
        console.log(`✅ Jurisdiction synced: ${j.code} (${j.name})`);
    }

    console.log('✅ Quick seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
