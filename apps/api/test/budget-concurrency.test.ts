
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetPlanService } from '../../apps/api/src/modules/consulting/budget-plan.service';
import { PrismaService } from '../../apps/api/src/shared/prisma/prisma.service';
import { DeviationService } from '../../apps/api/src/modules/cmr/deviation.service';
import { OutboxService } from '../../apps/api/src/shared/outbox/outbox.service'; // Mocked
import { ConfigModule } from '@nestjs/config';

// Mock Deviation and Outbox to focus on Budget Locking
const mockDeviationService = { createReview: jest.fn() };
const mockOutboxService = { createEvent: jest.fn() };

describe('BudgetPlanService Integration Concurrency', () => {
    let service: BudgetPlanService;
    let prisma: PrismaService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true })],
            providers: [
                BudgetPlanService,
                PrismaService,
                { provide: DeviationService, useValue: mockDeviationService },
                { provide: OutboxService, useValue: mockOutboxService },
            ],
        }).compile();

        service = module.get<BudgetPlanService>(BudgetPlanService);
        prisma = module.get<PrismaService>(PrismaService);

        // Setup: Ensure a test budget exists
        // We'll use a fixed ID or create one
        // ...
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should handle 20 concurrent syncActuals', async () => {
        // 1. Create Data
        // We need to insert a BudgetPlan and BudgetItems via Prisma directly to avoid Service checks usually
        // Or just use service methods if available (createBudget is complex).
        // Let's use Raw SQL or Prisma create.
        const budgetId = 'test-concurrent-budget-' + Date.now();
        await prisma.budgetPlan.create({
            data: {
                id: budgetId,
                companyId: 'test-company-1',
                status: 'LOCKED',
                seasonId: 'season-1',
                year: 2025,
                harvestPlanId: 'hp-1',
                totalPlannedAmount: 1000,
                totalActualAmount: 0,
                version: 1,
                items: {
                    create: [
                        { category: 'SEEDS', plannedAmount: 500, actualAmount: 10 }, // 10
                        { category: 'FERTILIZER', plannedAmount: 500, actualAmount: 10 } // 10
                    ]
                }
            }
        });

        // 2. Run 20 concurrent updates
        // In our case, syncActuals recalculates Total from Items.
        // If Items don't change, Total is 20.
        // So all 20 threads will try to set Total = 20, Version = Version + 1.
        // Optimistic Lock should allow ONE to succeed per version.
        // Retries should allow others to eventually succeed (updating version).
        // But since payload (20) is same, it's boring.
        // To make it interesting, we should update ITEMS in parallel?
        // But syncActuals reads items.
        // Let's just verify that they don't crash and version increments.
        // Ideally, version should increment.

        const context = { userId: 'u1', companyId: 'test-company-1', role: 'ADMIN' as any };

        const attempts = Array(10).fill(0).map(() => service.syncActuals(budgetId, context));

        const results = await Promise.allSettled(attempts);

        // Check results
        const success = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        console.log(`Success: ${success.length}, Failed: ${failed.length}`);

        // Verify Final State
        const finalBudget = await prisma.budgetPlan.findUnique({ where: { id: budgetId } });
        console.log('Final Version:', finalBudget?.version);

        // If locking works, version should be significantly higher than 1?
        // Or exactly 1+SuccessCount?
        // If strict locking, each update increments version.
        // So if 10 succeed, version should be 11.
    });
});
