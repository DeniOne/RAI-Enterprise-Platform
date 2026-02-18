
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetPlanService } from './budget-plan.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { DeviationService } from '../cmr/deviation.service';
import { BudgetStatus } from '@rai/prisma-client';

// Mock DeviationService
const mockDeviationService = {
    createReview: jest.fn(),
};

describe('BudgetPlanService Concurrency', () => {
    let service: BudgetPlanService;
    let prisma: any; // Use any to avoid complex Prisma types in testing

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BudgetPlanService,
                {
                    provide: PrismaService,
                    useValue: {
                        budgetPlan: {
                            update: jest.fn(),
                            findUnique: jest.fn(),
                        },
                        $disconnect: jest.fn(),
                    },
                },
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
        // Let's spy on prisma.budgetPlan.update
        // Since prisma.budgetPlan were defined in useValue, they are already mocks
        const updateSpy = prisma.budgetPlan.update;
        const findUniqueSpy = prisma.budgetPlan.findUnique;

        // Mock initial find
        findUniqueSpy.mockResolvedValue({
            id: 'test-budget',
            version: 1,
            status: BudgetStatus.LOCKED,
            companyId: 'test-company',
            items: []
        });

        // Mock update implementation to simulate conflict on first try
        let attempt = 0;
        updateSpy.mockImplementation(async () => {
            attempt++;
            if (attempt === 1) {
                const err: any = new Error('Record to update not found.');
                err.code = 'P2025';
                throw err; // Simulate Version Mismatch
            }
            return { id: 'test-budget', version: 2 }; // Success on retry
        });

        const context = { userId: 'u1', companyId: 'test-company', role: 'ADMIN' as any };

        // Run syncActuals
        await service.syncActuals('test-budget', context);

        // Assertions
        expect(updateSpy).toHaveBeenCalledTimes(2); // Initial try + 1 retry
        expect(findUniqueSpy).toHaveBeenCalledTimes(2);
    });
});
