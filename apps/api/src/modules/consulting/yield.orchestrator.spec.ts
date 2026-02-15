import { Test, TestingModule } from '@nestjs/testing';
import { YieldOrchestrator } from './yield.orchestrator';
import { YieldService } from './yield.service';
import { KpiService } from './kpi.service';
import { DecisionService } from '../cmr/decision.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('YieldOrchestrator', () => {
    let orchestrator: YieldOrchestrator;
    let yieldService: any;
    let kpiService: any;
    let prisma: any;

    beforeEach(async () => {
        yieldService = {
            saveHarvestResult: jest.fn().mockResolvedValue({ id: 'res-1' }),
        };
        kpiService = {
            calculatePlanKPI: jest.fn().mockResolvedValue({ total_actual_cost: 10000 }),
        };
        prisma = {
            harvestPlan: {
                findUnique: jest.fn().mockResolvedValue({
                    id: 'plan-1',
                    activeBudgetPlan: { id: 'budget-1', version: 2 },
                }),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                YieldOrchestrator,
                { provide: YieldService, useValue: yieldService },
                { provide: KpiService, useValue: kpiService },
                { provide: DecisionService, useValue: { logDecision: jest.fn() } },
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        orchestrator = module.get<YieldOrchestrator>(YieldOrchestrator);
    });

    it('should capture cost snapshot and delegate saving to YieldService', async () => {
        const dto = {
            planId: 'plan-1',
            fieldId: 'field-1',
            crop: 'Wheat',
            actualYield: 50,
        } as any;

        const context = { userId: 'u-1', role: 'ADMIN', companyId: 'c-1' } as any;

        await orchestrator.recordHarvest(dto, context);

        // Verify that calculation was called BEFORE saving
        expect(kpiService.calculatePlanKPI).toHaveBeenCalledWith('plan-1');

        // Verify that saveHarvestResult was called with the snapshot
        expect(yieldService.saveHarvestResult).toHaveBeenCalledWith(
            expect.objectContaining({
                costSnapshot: 10000,
                budgetPlanId: 'budget-1',
                budgetVersion: 2,
            }),
            context
        );
    });
});
