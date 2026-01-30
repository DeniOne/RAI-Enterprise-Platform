import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data via Raw SQL...');

    // 1. Seed Location
    const locationId = randomUUID();
    const locationName = 'МираТермы';

    // Check if exists
    const existingLocs = await prisma.$queryRaw<any[]>`SELECT id FROM locations WHERE name = ${locationName}`;

    if (existingLocs.length === 0) {
        await prisma.$executeRaw`
            INSERT INTO locations (id, name, city, address, is_active, created_at, updated_at)
            VALUES (${locationId}, ${locationName}, 'Новосибирск', 'г. Новосибирск', true, NOW(), NOW())
        `;
        console.log(`Location '${locationName}' created.`);
    } else {
        console.log(`Location '${locationName}' already exists.`);
    }

    // 2. Seed Positions
    const positions = ['Фотограф', 'Дизайнер', 'Продавец', 'Администратор'];

    for (const posName of positions) {
        const id = randomUUID();
        const existingPos = await prisma.$queryRaw<any[]>`SELECT id FROM positions WHERE name = ${posName}`;

        if (existingPos.length === 0) {
            await prisma.$executeRaw`
                INSERT INTO positions (id, name, is_active, created_at, updated_at)
                VALUES (${id}, ${posName}, true, NOW(), NOW())
            `;
            console.log(`Position '${posName}' created.`);
        } else {
            console.log(`Position '${posName}' already exists.`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
