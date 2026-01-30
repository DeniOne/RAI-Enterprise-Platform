"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function check() {
    const count = await prisma.employeeRegistrationRequest.count();
    const all = await prisma.employeeRegistrationRequest.findMany();
    console.log('--- REGISTRATION REQUESTS ---');
    console.log('Count:', count);
    console.log('Data:', JSON.stringify(all, null, 2));
    const users = await prisma.user.findMany({
        select: { email: true, role: true, foundation_status: true }
    });
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));
}
check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
