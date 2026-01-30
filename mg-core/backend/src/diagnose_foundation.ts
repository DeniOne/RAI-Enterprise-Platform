import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@photomatrix.ru';

    console.log('--- USER DATA ---');
    const user = await prisma.user.findUnique({
        where: { email }
    });
    console.log(JSON.stringify(user, null, 2));

    console.log('\n--- SYSTEM GATE COURSE ---');
    const gateCourse = await prisma.course.findUnique({
        where: { id: 'foundation-admission-gate-v2' },
        include: {
            modules: {
                include: {
                    material: true
                }
            }
        }
    });
    console.log(JSON.stringify(gateCourse, null, 2));

    console.log('\n--- MATERIALS FOR FOUNDATION ---');
    const materials = await prisma.material.findMany({
        where: { id: { startsWith: 'foundation-block-' } }
    });
    console.log(JSON.stringify(materials, null, 2));

    console.log('\n--- FOUNDATION ACCEPTANCE ---');
    const acceptance = await prisma.foundationAcceptance.findUnique({
        where: { person_id: user?.id }
    });
    console.log(JSON.stringify(acceptance, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
