
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing connection...');
// Mask password in log just in case, but usually safe locally if simple prompt
// console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':***@'));

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected!');
        const count = await prisma.company.count();
        console.log('Company count:', count);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
