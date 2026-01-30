import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPurchases() {
    try {
        const count = await prisma.purchase.count();
        console.log('✅ Purchases count:', count);

        if (count > 0) {
            console.log('⚠️  WARNING: Table contains data! Migration will FAIL.');
            const samples = await prisma.purchase.findMany({ take: 5 });
            console.log('Sample records:', JSON.stringify(samples, null, 2));
        } else {
            console.log('✅ Table is empty. Migration is SAFE to apply.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPurchases();
