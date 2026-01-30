import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function list() {
    const departments = await prisma.department.findMany({
        orderBy: { level: 'asc' }
    });
    console.log('--- DEPARTMENTS ---');
    console.log(JSON.stringify(departments, null, 2));
}

list()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
