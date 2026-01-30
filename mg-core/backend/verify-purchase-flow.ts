
import { PrismaClient, PurchaseStatus } from '@prisma/client';
import { StorePurchaseService } from './src/matrixcoin-economy/services/store-purchase.service';
import { StoreEligibilityService } from './src/matrixcoin-economy/services/store-eligibility.service';
import { StoreEligibilityAdapterService } from './src/matrixcoin-economy/services/store-eligibility.adapter';
import { AuditEventRepository } from './src/matrixcoin-economy/services/audit-event.repository';
import { randomUUID } from 'crypto';

// Minimal mock/setup
async function main() {
    const prisma = new PrismaClient();
    const auditRepo = { saveEvent: (ev: any) => console.log('AUDIT:', ev.eventType) } as any;
    const eligibilityService = { evaluateStoreEligibilityService: () => ({ decision: { status: 'ELIGIBLE' }, events: [] }) } as any; // Mock for now

    const service = new StorePurchaseService(prisma, eligibilityService, auditRepo);

    console.log('--- STARTING PURCHASE FLOW VERIFICATION ---');

    // 1. Setup Data
    const userId = 'test-user-' + randomUUID();
    const itemId = 'test-item-' + randomUUID();
    const idempotencyKey = 'key-' + randomUUID();

    // Create User, Wallet, Item
    await prisma.user.create({
        data: {
            id: userId,
            email: `test-${randomUUID()}@example.com`,
            password_hash: 'hash',
            first_name: 'Test',
            last_name: 'User',
            wallet: {
                create: {
                    mc_balance: 100,
                    mc_frozen: 0
                }
            }
        }
    });

    await prisma.storeItem.create({
        data: {
            id: itemId,
            title: 'Test Item',
            description: 'Desc',
            priceMC: 50,
            active: true,
            stock: 5,
            category: 'TEST',
            metadata: {}
        }
    });

    console.log('STEP 1: Data Seeded. Balance: 100, Stock: 5, Price: 50');

    // 2. Execute Purchase (Success)
    console.log('STEP 2: Executing Purchase...');
    const result = await service.purchaseItem(userId, itemId, idempotencyKey);
    console.log('Result:', result.status, result.id);

    // Verify DB
    const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
    const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
    const purchase = await prisma.purchase.findUnique({ where: { id: result.id } });

    if (wallet?.mc_balance.toNumber() !== 50) throw new Error(`Balance mismatch: ${wallet?.mc_balance}`);
    if (item?.stock !== 4) throw new Error(`Stock mismatch: ${item?.stock}`);
    if (purchase?.status !== 'COMPLETED') throw new Error(`Status mismatch: ${purchase?.status}`);

    console.log('✅ SUCCESS CASE PASSED');

    // 3. Idempotency Check
    console.log('STEP 3: Checking Idempotency...');
    const result2 = await service.purchaseItem(userId, itemId, idempotencyKey);
    if (result2.id !== result.id) throw new Error('Idempotency failed: Different ID returned');
    console.log('✅ IDEMPOTENCY PASSED');

    // 4. Insufficient Funds
    console.log('STEP 4: Testing Insufficient Funds...');
    try {
        await service.purchaseItem(userId, itemId, 'new-key-fail'); // Cost 50, Bal 50. OK.
        await service.purchaseItem(userId, itemId, 'new-key-fail-2'); // Cost 50, Bal 0. Fail.
    } catch (e: any) {
        console.log('Caught expected error:', e.message);
        if (!e.message.includes('Insufficient funds')) throw new Error('Wrong error message');
    }

    // Check Rollback Status
    const failPurchase = await prisma.purchase.findMany({ where: { idempotencyKey: 'new-key-fail-2' } });
    if (failPurchase[0].status !== 'ROLLED_BACK') throw new Error(`Rollback failed, status: ${failPurchase[0].status}`);

    console.log('✅ ROLLBACK PASSED');

    console.log('--- ALL TESTS PASSED ---');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await new PrismaClient().$disconnect(); });
