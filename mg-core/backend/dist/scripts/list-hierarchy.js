"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function list() {
    const levels = await prisma.$queryRaw `SELECT * FROM org_hierarchy_levels ORDER BY level_number`;
    console.log('--- ORG HIERARCHY LEVELS ---');
    console.log(JSON.stringify(levels, null, 2));
}
list()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
