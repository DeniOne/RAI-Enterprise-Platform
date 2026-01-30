import { Test, TestingModule } from '@nestjs/testing';
import { HRDomainEventService } from '../services/hr-domain-event.service';
import { PersonalFileService } from '../services/personal-file.service';
import { PersonnelOrderService } from '../services/personnel-order.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('Event Emission Tests', () => {
    let hrEventService: HRDomainEventService;
    let personalFileService: PersonalFileService;
    let personnelOrderService: PersonnelOrderService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HRDomainEventService,
                PersonalFileService,
                PersonnelOrderService,
                PrismaService,
            ],
        }).compile();

        hrEventService = module.get<HRDomainEventService>(HRDomainEventService);
        personalFileService = module.get<PersonalFileService>(PersonalFileService);
        personnelOrderService = module.get<PersonnelOrderService>(PersonnelOrderService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(async () => {
        // Cleanup
        await prisma.hrDomainEvent.deleteMany();
        await prisma.personalFile.deleteMany();
    });

    describe('EMPLOYEE_HIRED event', () => {
        it('should emit EMPLOYEE_HIRED event on PersonalFile creation', async () => {
            const eventSpy = jest.spyOn(hrEventService, 'emit');

            await personalFileService.create(
                'employee-123',
                'actor-456',
                'HR_MANAGER',
                'Test hire'
            );

            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'EMPLOYEE_HIRED',
                    aggregateType: 'PERSONAL_FILE',
                    actorRole: 'HR_MANAGER',
                })
            );
        });

        it('should persist EMPLOYEE_HIRED event to database', async () => {
            await personalFileService.create(
                'employee-123',
                'actor-456',
                'HR_MANAGER',
                'Test hire'
            );

            const events = await prisma.hrDomainEvent.findMany({
                where: { eventType: 'EMPLOYEE_HIRED' },
            });

            expect(events.length).toBeGreaterThan(0);
            expect(events[0].actorId).toBe('actor-456');
        });
    });

    describe('ORDER_SIGNED event', () => {
        it('should emit ORDER_SIGNED event on order signing', async () => {
            // Create order first
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
                'actor-456',
                'HR_MANAGER'
            );

            const eventSpy = jest.spyOn(hrEventService, 'emit');

            // Sign order
            await personnelOrderService.sign(
                order.id,
                'director-123',
                'DIRECTOR'
            );

            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'ORDER_SIGNED',
                    aggregateType: 'PERSONNEL_ORDER',
                    actorRole: 'DIRECTOR',
                })
            );
        });
    });

    describe('STATUS_CHANGED event', () => {
        it('should emit STATUS_CHANGED event on status update', async () => {
            // Create PersonalFile first
            const file = await personalFileService.create(
                'employee-123',
                'actor-456',
                'HR_MANAGER',
                'Test hire'
            );

            const eventSpy = jest.spyOn(hrEventService, 'emit');

            // Update status
            await personalFileService.updateStatus(
                file.id,
                'ACTIVE',
                'actor-456',
                'HR_MANAGER',
                'Onboarding completed'
            );

            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'STATUS_CHANGED',
                    previousState: expect.objectContaining({ hrStatus: 'ONBOARDING' }),
                    newState: expect.objectContaining({ hrStatus: 'ACTIVE' }),
                })
            );
        });
    });
});
