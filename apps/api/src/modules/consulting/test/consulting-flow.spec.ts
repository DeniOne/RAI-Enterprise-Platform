import { Test, TestingModule } from '@nestjs/testing';
import { ConsultingService, UserContext } from '../consulting.service';
import { ConsultingDomainRules } from '../domain-rules/consulting.domain-rules.service';
import { DecisionService } from '../../cmr/decision.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
    HarvestPlanStatus,
    UserRole,
    TechMapStatus,
    DeviationStatus,
} from '@rai/prisma-client';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Consulting Flow — E2E vertical slice тесты.
 * Проверяет полный цикл: Plan → Activate → Deviation → Decision
 */
describe('ConsultingFlow (Vertical Slice)', () => {
    let consultingService: ConsultingService;
    let decisionService: DecisionService;
    let prisma: any;
    let domainRules: ConsultingDomainRules;

    const ceoContext: UserContext = {
        userId: 'user-ceo',
        role: UserRole.CEO,
        companyId: 'comp-1',
    };

    const agronomContext: UserContext = {
        userId: 'user-agro',
        role: UserRole.MANAGER,
        companyId: 'comp-1',
    };

    const mockPlan = {
        id: 'plan-1',
        companyId: 'comp-1',
        status: HarvestPlanStatus.DRAFT,
        techMaps: [{ id: 'tm-1', seasonId: 'season-1', status: TechMapStatus.ACTIVE }],
    };

    beforeEach(async () => {
        prisma = {
            harvestPlan: {
                create: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                findMany: jest.fn(),
            },
            techMap: { findMany: jest.fn() },
            deviationReview: { count: jest.fn() },
        };

        decisionService = {
            logDecision: jest.fn().mockResolvedValue({ id: 'decision-1' }),
        } as any;

        // Используем реальный ConsultingDomainRules с моком Prisma
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConsultingDomainRules,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        domainRules = module.get<ConsultingDomainRules>(ConsultingDomainRules);

        consultingService = new ConsultingService(prisma, domainRules, decisionService);
    });

    // --- FSM тесты ---

    describe('FSM Transitions', () => {
        it('DRAFT → REVIEW: любой пользователь компании', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.DRAFT,
            });
            prisma.harvestPlan.update.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.REVIEW,
            });

            const result = await consultingService.transitionPlanStatus(
                'plan-1', HarvestPlanStatus.REVIEW, agronomContext,
            );

            expect(result.status).toBe(HarvestPlanStatus.REVIEW);
            expect(decisionService.logDecision).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'PLAN_TRANSITION_DRAFT_TO_REVIEW',
                    companyId: 'comp-1',
                }),
            );
        });

        it('REVIEW → APPROVED: только CEO', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.REVIEW,
            });
            prisma.harvestPlan.update.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.APPROVED,
            });

            const result = await consultingService.transitionPlanStatus(
                'plan-1', HarvestPlanStatus.APPROVED, ceoContext,
            );

            expect(result.status).toBe(HarvestPlanStatus.APPROVED);
        });

        it('REVIEW → APPROVED: MANAGER получает ForbiddenException', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.REVIEW,
            });

            await expect(
                consultingService.transitionPlanStatus(
                    'plan-1', HarvestPlanStatus.APPROVED, agronomContext,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('APPROVED → ACTIVE: CEO + DomainRules проверка', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.APPROVED,
            });
            prisma.harvestPlan.update.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.ACTIVE,
            });
            // DomainRules mocks
            prisma.techMap.findMany.mockResolvedValue([
                { id: 'tm-1', status: TechMapStatus.ACTIVE },
            ]);
            prisma.deviationReview.count.mockResolvedValue(0);

            const result = await consultingService.transitionPlanStatus(
                'plan-1', HarvestPlanStatus.ACTIVE, ceoContext,
            );

            expect(result.status).toBe(HarvestPlanStatus.ACTIVE);
            expect(decisionService.logDecision).toHaveBeenCalled();
        });

        it('Недопустимый переход DRAFT → ACTIVE: BadRequestException', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.DRAFT,
            });

            await expect(
                consultingService.transitionPlanStatus(
                    'plan-1', HarvestPlanStatus.ACTIVE, ceoContext,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // --- Audit Trail тесты ---

    describe('Audit Trail (DecisionRecord)', () => {
        it('каждый FSM-переход создаёт запись в cmr_decisions', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.DRAFT,
            });
            prisma.harvestPlan.update.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.REVIEW,
            });

            await consultingService.transitionPlanStatus(
                'plan-1', HarvestPlanStatus.REVIEW, ceoContext,
            );

            expect(decisionService.logDecision).toHaveBeenCalledTimes(1);
            expect(decisionService.logDecision).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: expect.stringContaining('PLAN_TRANSITION'),
                    seasonId: 'season-1',
                    companyId: 'comp-1',
                    userId: 'user-ceo',
                }),
            );
        });
    });

    // --- Ownership тесты ---

    describe('Company Isolation', () => {
        it('Plan из чужой компании — NotFoundException', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, companyId: 'other-company',
            });

            await expect(
                consultingService.transitionPlanStatus(
                    'plan-1', HarvestPlanStatus.REVIEW, ceoContext,
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('Несуществующий план — NotFoundException', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue(null);

            await expect(
                consultingService.transitionPlanStatus(
                    'no-plan', HarvestPlanStatus.REVIEW, ceoContext,
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // --- DRAFT editing ---

    describe('Draft Editing', () => {
        it('Редактирование DRAFT плана разрешено', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue(mockPlan);
            prisma.harvestPlan.update.mockResolvedValue({ ...mockPlan, targetMetric: 'YIELD_QPH' });

            const result = await consultingService.updateDraftPlan(
                'plan-1', { targetMetric: 'YIELD_QPH' } as any, ceoContext,
            );
            expect(result.targetMetric).toBe('YIELD_QPH');
        });

        it('Редактирование ACTIVE плана запрещено', async () => {
            prisma.harvestPlan.findUnique.mockResolvedValue({
                ...mockPlan, status: HarvestPlanStatus.ACTIVE,
            });

            await expect(
                consultingService.updateDraftPlan('plan-1', {} as any, ceoContext),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
