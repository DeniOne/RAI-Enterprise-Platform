import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.user.count();
    console.log('User count:', count);
}
main().catch(err => console.error(err)).finally(() => process.exit());
