import { Test, TestingModule } from '@nestjs/testing';
import { PersonalFileService } from '../services/personal-file.service';
import { HRDomainEventService } from '../services/hr-domain-event.service';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Event Causality and Order Tests
 * 
 * CRITICAL: Events подтверждают состояние, НЕ восстанавливают его
 * Source of truth = Prisma (relational state)
 * Event Layer = audit / integration / compliance
 */
describe('Event Causality and Order Tests', () => {
    let personalFileService: PersonalFileService;
    let hrEventService: HRDomainEventService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PersonalFileService,
                HRDomainEventService,
                PrismaService,
            ],
        }).compile();

        personalFileService = module.get<PersonalFileService>(PersonalFileService);
        hrEventService = module.get<HRDomainEventService>(HRDomainEventService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(async () => {
        await prisma.hrDomainEvent.deleteMany();
        await prisma.personalFile.deleteMany();
    });

    describe('Event Order Verification', () => {
        it('should verify events are ordered by timestamp', async () => {
            // Create PersonalFile
            const file = await personalFileService.create(
                'emp-123',
                'actor',
                'HR_MANAGER',
                'Hire'
            );

            // Update status
            await personalFileService.updateStatus(
                file.id,
                'ACTIVE',
                'actor',
                'HR_MANAGER'
            );

            // Get events
            const events = await prisma.hrDomainEvent.findMany({
                where: { aggregateId: file.id },
                orderBy: { timestamp: 'asc' },
            });

            // Verify order
            expect(events.length).toBeGreaterThanOrEqual(2);
            expect(events[0].eventType).toBe('EMPLOYEE_HIRED');
            expect(events[1].eventType).toBe('STATUS_CHANGED');

            // Verify timestamps are ordered
            for (let i = 1; i < events.length; i++) {
                expect(events[i].timestamp.getTime()).toBeGreaterThan(
                    events[i - 1].timestamp.getTime()
                );
            }
        });
    });

    describe('Event Causality Verification', () => {
        it('should verify events reflect causality (hire → onboarding → active)', async () => {
            // Create PersonalFile (ONBOARDING)
            const file = await personalFileService.create(
                'emp-123',
                'actor',
                'HR_MANAGER',
                'Hire'
            );

            // Update to ACTIVE
            await personalFileService.updateStatus(
                file.id,
                'ACTIVE',
                'actor',
                'HR_MANAGER'
            );

            // Get events
            const events = await prisma.hrDomainEvent.findMany({
                where: { aggregateId: file.id },
                orderBy: { timestamp: 'asc' },
            });

            // Verify causality chain
            expect(events[0].newState.hrStatus).toBe('ONBOARDING');
            expect(events[1].previousState.hrStatus).toBe('ONBOARDING');
            expect(events[1].newState.hrStatus).toBe('ACTIVE');
        });
    });

    describe('Snapshot Consistency Verification', () => {
        it('should verify DB state matches latest event', async () => {
            // Create and update PersonalFile
            const file = await personalFileService.create(
                'emp-123',
                'actor',
                'HR_MANAGER',
                'Hire'
            );

            await personalFileService.updateStatus(
                file.id,
                'ACTIVE',
                'actor',
                'HR_MANAGER'
            );

            // Get current DB state
            const currentFile = await prisma.personalFile.findUnique({
                where: { id: file.id },
            });

            // Get latest event
            const latestEvent = await prisma.hrDomainEvent.findFirst({
                where: { aggregateId: file.id },
                orderBy: { timestamp: 'desc' },
            });

            // Verify consistency
            expect(currentFile.hrStatus).toBe(latestEvent.newState.hrStatus);
            expect(currentFile.hrStatus).toBe('ACTIVE');
        });
    });
});
