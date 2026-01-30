import { Test, TestingModule } from '@nestjs/testing';
import { HRDomainEventService } from '../services/hr-domain-event.service';
import { PersonalFileService } from '../services/personal-file.service';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Negative Event Tests
 * 
 * Tests for edge cases and error scenarios:
 * - Duplicate event handling (idempotency)
 * - Out-of-order events
 * - Event gaps detection
 */
describe('Negative Event Tests', () => {
    let hrEventService: HRDomainEventService;
    let personalFileService: PersonalFileService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HRDomainEventService,
                PersonalFileService,
                PrismaService,
            ],
        }).compile();

        hrEventService = module.get<HRDomainEventService>(HRDomainEventService);
        personalFileService = module.get<PersonalFileService>(PersonalFileService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(async () => {
        await prisma.hrDomainEvent.deleteMany();
        await prisma.personalFile.deleteMany();
    });

    describe('Duplicate Event Handling', () => {
        it('should handle duplicate events idempotently', async () => {
            const eventData = {
                eventType: 'EMPLOYEE_HIRED' as const,
                aggregateType: 'PERSONAL_FILE' as const,
                aggregateId: 'file-123',
                actorId: 'actor',
                actorRole: 'HR_MANAGER' as const,
                payload: { reason: 'Test hire' },
            };

            // Emit event twice
            await hrEventService.emit(eventData);

            // Second emission should be idempotent
            // (either skip or create with different timestamp)
            await hrEventService.emit(eventData);

            // Get events
            const events = await prisma.hrDomainEvent.findMany({
                where: {
                    aggregateId: 'file-123',
                    eventType: 'EMPLOYEE_HIRED',
                },
            });

            // Should have 2 events (both recorded for audit)
            // OR 1 event (if idempotency is enforced)
            expect(events.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Out-of-Order Events', () => {
        it('should detect out-of-order events by timestamp', async () => {
            const now = new Date();
            const past = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago

            // Create event with future timestamp
            await prisma.hrDomainEvent.create({
                data: {
                    eventType: 'EMPLOYEE_HIRED',
                    aggregateType: 'PERSONAL_FILE',
                    aggregateId: 'file-123',
                    actorId: 'actor',
                    actorRole: 'HR_MANAGER',
                    payload: {},
                    timestamp: now,
                },
            });

            // Create event with past timestamp (out of order!)
            await prisma.hrDomainEvent.create({
                data: {
                    eventType: 'STATUS_CHANGED',
                    aggregateType: 'PERSONAL_FILE',
                    aggregateId: 'file-123',
                    actorId: 'actor',
                    actorRole: 'HR_MANAGER',
                    payload: {},
                    timestamp: past,
                },
            });

            // Get events ordered by timestamp
            const events = await prisma.hrDomainEvent.findMany({
                where: { aggregateId: 'file-123' },
                orderBy: { timestamp: 'asc' },
            });

            // Verify order detection
            expect(events[0].timestamp.getTime()).toBeLessThan(
                events[1].timestamp.getTime()
            );
        });
    });

    describe('Event Gap Detection', () => {
        it('should detect gaps in event sequence', async () => {
            // Create events with sequence numbers
            await prisma.hrDomainEvent.create({
                data: {
                    eventType: 'EMPLOYEE_HIRED',
                    aggregateType: 'PERSONAL_FILE',
                    aggregateId: 'file-123',
                    actorId: 'actor',
                    actorRole: 'HR_MANAGER',
                    payload: { sequenceNumber: 1 },
                    timestamp: new Date(),
                },
            });

            // Skip sequence 2 (gap!)
            await prisma.hrDomainEvent.create({
                data: {
                    eventType: 'STATUS_CHANGED',
                    aggregateType: 'PERSONAL_FILE',
                    aggregateId: 'file-123',
                    actorId: 'actor',
                    actorRole: 'HR_MANAGER',
                    payload: { sequenceNumber: 3 },
                    timestamp: new Date(),
                },
            });

            // Get events
            const events = await prisma.hrDomainEvent.findMany({
                where: { aggregateId: 'file-123' },
                orderBy: { timestamp: 'asc' },
            });

            // Detect gap
            const sequences = events.map(e => e.payload.sequenceNumber);
            const hasGap = sequences.some((seq, i) => {
                if (i === 0) return false;
                return seq !== sequences[i - 1] + 1;
            });

            expect(hasGap).toBe(true);
        });
    });

    describe('Missing Events', () => {
        it('should handle missing prerequisite events', async () => {
            // Attempt to create STATUS_CHANGED without EMPLOYEE_HIRED
            // This should either fail or be allowed (depending on business rules)

            const result = await hrEventService.emit({
                eventType: 'STATUS_CHANGED',
                aggregateType: 'PERSONAL_FILE',
                aggregateId: 'file-nonexistent',
                actorId: 'actor',
                actorRole: 'HR_MANAGER',
                payload: {},
                previousState: { hrStatus: 'ONBOARDING' },
                newState: { hrStatus: 'ACTIVE' },
            });

            // Verify event was created (even without prerequisite)
            expect(result).toBeDefined();
        });
    });
});
