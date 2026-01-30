import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@photomatrix.ru' }
    });
    if (user) {
        console.log('USER_FOUND:', {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status
        });
    } else {
        console.log('USER_NOT_FOUND');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
