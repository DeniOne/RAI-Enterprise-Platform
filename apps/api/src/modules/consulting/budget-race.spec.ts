
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetPlanService } from '../../apps/api/src/modules/consulting/budget-plan.service';
import { PrismaService } from '../../apps/api/src/shared/prisma/prisma.service';
import { DeviationService } from '../../apps/api/src/modules/cmr/deviation.service';
import { BudgetStatus } from '@rai/prisma-client';

// Mock DeviationService
const mockDeviationService = {
    createReview: jest.fn(),
};

describe('BudgetPlanService Concurrency', () => {
    let service: BudgetPlanService;
    let prisma: PrismaService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BudgetPlanService,
                PrismaService,
                { provide: DeviationService, useValue: mockDeviationService },
            ],
        }).compile();

        service = module.get<BudgetPlanService>(BudgetPlanService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    // Clean up or ensure DB connection
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should handle concurrent updates with Optimistic Locking', async () => {
        // 1. Create a Test Budget
        // We need a harvestPlanId. Assuming one exists or we create dummy.
        // For this test, we might mock Prisma methods to simulate DB delay and version conflict?
        // OR use real DB if available.
        // Given the environment, mocking Prisma's failures is easier to prove the "Retry Logic" works.

        // Let's spy on prisma.budgetPlan.update
        const updateSpy = jest.spyOn(prisma.budgetPlan, 'update');
        const findUniqueSpy = jest.spyOn(prisma.budgetPlan, 'findUnique');

        // Mock initial find
        findUniqueSpy.mockResolvedValue({
            id: 'test-budget',
            version: 1,
            status: BudgetStatus.LOCKED,
            companyId: 'test-company',
            items: []
        } as any);

        // Mock update implementation to simulate conflict on first try
        let attempt = 0;
        updateSpy.mockImplementation(async (args) => {
            attempt++;
            if (attempt === 1) {
                throw { code: 'P2025', message: 'Record to update not found.' }; // Simulate Version Mismatch
            }
            return { id: 'test-budget', version: 2 } as any; // Success on retry
        });

        const context = { userId: 'u1', companyId: 'test-company', role: 'ADMIN' as any };

        // Run syncActuals
        await service.syncActuals('test-budget', context);

        // Assertions
        expect(updateSpy).toHaveBeenCalledTimes(2); // Initial try + 1 retry
        // First call uses version 1
        expect(updateSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
            where: { id: 'test-budget', version: 1 }
        }));
        // Second call (retry) -> Wait, logic re-reads!
        // If logic re-reads, `findUnique` should be called again.
        expect(findUniqueSpy).toHaveBeenCalledTimes(2);
    });
});
