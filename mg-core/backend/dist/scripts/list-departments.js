"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
