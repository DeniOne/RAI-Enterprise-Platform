import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function main() {
    const prisma = new PrismaClient();
    try {
        const users = await prisma.user.findMany();
        fs.writeFileSync('users_snapshot.json', JSON.stringify(users, null, 2));
        console.log('✅ Snapshot created');
    } catch (e) {
        fs.writeFileSync('users_snapshot.json', JSON.stringify({ error: e.message }, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}
main();
