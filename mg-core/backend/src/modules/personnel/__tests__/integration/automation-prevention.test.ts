import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PersonnelOrderService } from '../services/personnel-order.service';
import { LaborContractService } from '../services/labor-contract.service';
import { HRDomainEventService } from '../services/hr-domain-event.service';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Automation Prevention Tests
 * 
 * CRITICAL: Only DIRECTOR can perform sensitive actions
 * - Order signing
 * - Contract termination
 * 
 * Intent verification: who initiated, who confirmed, audit log
 */
describe('Automation Prevention Tests', () => {
    let personnelOrderService: PersonnelOrderService;
    let laborContractService: LaborContractService;
    let hrEventService: HRDomainEventService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PersonnelOrderService,
                LaborContractService,
                HRDomainEventService,
                PrismaService,
            ],
        }).compile();

        personnelOrderService = module.get<PersonnelOrderService>(PersonnelOrderService);
        laborContractService = module.get<LaborContractService>(LaborContractService);
        hrEventService = module.get<HRDomainEventService>(HRDomainEventService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(async () => {
        await prisma.hrDomainEvent.deleteMany();
        await prisma.personnelOrder.deleteMany();
        await prisma.laborContract.deleteMany();
    });

    describe('DIRECTOR-Only Order Signing', () => {
        it('should prevent automatic order signing by SYSTEM', async () => {
            // Create order
            const order = await personnelOrderService.create(
                'file-123',
                'HIRING',
                {
                    title: 'Test Order',
                    content: 'Test content',
                    basis: 'Test basis',
                    orderDate: new Date(),
                    effectiveDate: new Date(),
                },
                'actor',
                'HR_MANAGER'
            );

            // Attempt to sign with SYSTEM role
            await expect(
                personnelOrderService.sign(order.id, 'system', 'SYSTEM')
            ).rejects.toThrow();
        });

        it('should prevent order signing by HR_MANAGER', async () => {
            // Create order
            const order = await personnelOrderService.create(
                'file-123',
                'HIRING',
                {
                    title: 'Test Order',
                    content: 'Test content',
                    basis: 'Test basis',
                    orderDate: new Date(),
                    effectiveDate: new Date(),
                },
                'actor',
                'HR_MANAGER'
            );

            // Attempt to sign with HR_MANAGER role
            await expect(
                personnelOrderService.sign(order.id, 'manager-123', 'HR_MANAGER')
            ).rejects.toThrow();
        });

        it('should allow DIRECTOR to sign orders', async () => {
            // Create order
            const order = await personnelOrderService.create(
                'file-123',
                'HIRING',
                {
                    title: 'Test Order',
                    content: 'Test content',
                    basis: 'Test basis',
                    orderDate: new Date(),
                    effectiveDate: new Date(),
                },
                'actor',
                'HR_MANAGER'
            );

            // Sign with DIRECTOR role
            const signedOrder = await personnelOrderService.sign(
                order.id,
                'director-123',
                'DIRECTOR'
            );

            expect(signedOrder.status).toBe('SIGNED');
            expect(signedOrder.signedById).toBe('director-123');
        });
    });

    describe('Intent Verification in Audit Log', () => {
        it('should verify intent in audit log for order signing', async () => {
            // Create and sign order
            const order = await personnelOrderService.create(
                'file-123',
                'HIRING',
                {
                    title: 'Test Order',
                    content: 'Test content',
                    basis: 'Test basis',
                    orderDate: new Date(),
                    effectiveDate: new Date(),
                },
                'actor',
                'HR_MANAGER'
            );

            await personnelOrderService.sign(
                order.id,
                'director-123',
                'DIRECTOR'
            );

            // Get audit event
            const event = await prisma.hrDomainEvent.findFirst({
                where: {
                    eventType: 'ORDER_SIGNED',
                    aggregateId: order.id,
                },
            });

            // Verify intent
            expect(event).toBeDefined();
            expect(event.actorId).toBe('director-123');
            expect(event.actorRole).toBe('DIRECTOR');
            expect(event.payload.orderNumber).toBeDefined();
        });
    });

    describe('DIRECTOR-Only Contract Termination', () => {
        it('should prevent contract termination by HR_MANAGER', async () => {
            // Create contract
            const contract = await laborContractService.create(
                'file-123',
                {
                    contractType: 'PERMANENT',
                    contractDate: new Date(),
                    startDate: new Date(),
                    positionId: 'pos-123',
                    departmentId: 'dept-123',
                    salary: 100000,
                    salaryType: 'MONTHLY',
                    workSchedule: 'FULL_TIME',
                },
                'actor',
                'HR_MANAGER'
            );

            // Attempt to terminate with HR_MANAGER role
            await expect(
                laborContractService.terminate(
                    contract.id,
                    'Resignation',
                    new Date(),
                    'manager-123',
                    'HR_MANAGER'
                )
            ).rejects.toThrow();
        });

        it('should allow DIRECTOR to terminate contracts', async () => {
            // Create contract
            const contract = await laborContractService.create(
                'file-123',
                {
                    contractType: 'PERMANENT',
                    contractDate: new Date(),
                    startDate: new Date(),
                    positionId: 'pos-123',
                    departmentId: 'dept-123',
                    salary: 100000,
                    salaryType: 'MONTHLY',
                    workSchedule: 'FULL_TIME',
                },
                'actor',
                'HR_MANAGER'
            );

            // Terminate with DIRECTOR role
            const terminatedContract = await laborContractService.terminate(
                contract.id,
                'Resignation',
                new Date(),
                'director-123',
                'DIRECTOR'
            );

            expect(terminatedContract.status).toBe('TERMINATED');
            expect(terminatedContract.terminationReason).toBe('Resignation');
        });
    });
});
