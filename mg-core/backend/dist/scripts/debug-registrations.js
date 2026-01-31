"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function debug() {
    try {
        console.log('--- ALL REGISTRATION REQUESTS ---');
        const requests = await prisma.$queryRawUnsafe(`
            SELECT id, status, telegram_id, first_name, last_name, created_at 
            FROM "employee_registration_requests"
            ORDER BY created_at DESC
        `);
        console.log(JSON.stringify(requests, null, 2));
        console.log('\n--- STATUS COUNTS ---');
        const counts = await prisma.$queryRawUnsafe(`
            SELECT status, COUNT(*) 
            FROM "employee_registration_requests"
            GROUP BY status
        `);
        console.log(counts);
    }
    catch (error) {
        console.error('DEBUG ERROR:', error.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
debug();
