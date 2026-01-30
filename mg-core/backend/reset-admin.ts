import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
        where: { email: 'admin@photomatrix.ru' },
        data: {
            password_hash: passwordHash,
            // @ts-ignore
            must_reset_password: false,
            // @ts-ignore
            foundation_status: 'ACCEPTED'
        }
    });
    console.log('ADMIN_PASSWORD_RESET_SUCCESS');
}

main().catch(console.error).finally(() => prisma.$disconnect());
