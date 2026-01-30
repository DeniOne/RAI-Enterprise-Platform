"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const count = await prisma.user.count();
    console.log('User count:', count);
}
main().catch(err => console.error(err)).finally(() => process.exit());
