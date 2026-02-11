
import { PrismaClient } from '@rai/prisma-client';
console.log('Successfully imported @rai/prisma-client');
try {
    const prisma = new PrismaClient();
    console.log('Successfully instantiated PrismaClient');
} catch (e) {
    console.error(e);
}
