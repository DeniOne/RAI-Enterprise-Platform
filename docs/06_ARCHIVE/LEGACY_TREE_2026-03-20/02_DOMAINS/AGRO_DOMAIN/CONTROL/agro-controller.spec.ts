import { ControllerMetricsService } from './controller-metrics.service';
import { CommittedEvent } from '../EVENTS/commit/committed-event.schema';

describe('Agro Controller MVP: operationDelayDays', () => {
    let service: ControllerMetricsService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            mapOperation: {
                findUnique: jest.fn(),
            },
            agroEscalation: {
                create: jest.fn(),
            },
        };
        service = new ControllerMetricsService(prisma);
    });

    const createMockEvent = (delayDays: number): CommittedEvent => {
        const plannedEnd = new Date('2026-03-01T12:00:00Z');
        const committedAt = new Date(plannedEnd.getTime() + delayDays * 24 * 60 * 60 * 1000);

        return {
            id: 'evt-1',
            companyId: 'c1',
            eventType: 'FIELD_OPERATION',
            taskRef: 'task-1',
            payload: { status: 'COMPLETED' },
            timestamp: committedAt.toISOString(),
            committedAt: committedAt.toISOString(),
            committedBy: 'u1',
            provenanceHash: 'h1',
            evidence: []
        };
    };

    it('Test 1: Normal flow, delay = 0 -> Severity S0, no escalation', async () => {
        prisma.mapOperation.findUnique.mockResolvedValue({ plannedEndTime: new Date('2026-03-01T12:00:00Z') });
        const event = createMockEvent(0);

        const result = await service.handleCommittedEvent(event);

        expect(result?.value).toBe(0);
        expect(result?.severity).toBe('S0');
        expect(prisma.agroEscalation.create).not.toHaveBeenCalled();
    });

    it('Test 2: Delay = 2 -> Severity S1 (per policy s1=1, s2=3) -> No escalation', async () => {
        prisma.mapOperation.findUnique.mockResolvedValue({ plannedEndTime: new Date('2026-03-01T12:00:00Z') });
        const event = createMockEvent(2);

        const result = await service.handleCommittedEvent(event);

        expect(result?.value).toBe(2);
        expect(result?.severity).toBe('S1'); // s1=1
        expect(prisma.agroEscalation.create).not.toHaveBeenCalled();
    });

    it('Test 3: Delay = 5 -> Severity S3 (per policy s3=5) -> Escalation created', async () => {
        prisma.mapOperation.findUnique.mockResolvedValue({ plannedEndTime: new Date('2026-03-01T12:00:00Z') });
        const event = createMockEvent(5);

        await service.handleCommittedEvent(event);

        expect(prisma.agroEscalation.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                severity: 'S3',
                status: 'OPEN'
            })
        }));
    });

    it('Test 4: Delay = 8 -> Severity S4 (per policy s4=7) -> Escalation created', async () => {
        prisma.mapOperation.findUnique.mockResolvedValue({ plannedEndTime: new Date('2026-03-01T12:00:00Z') });
        const event = createMockEvent(8);

        const result = await service.handleCommittedEvent(event);

        expect(result?.severity).toBe('S4');
        expect(prisma.agroEscalation.create).toHaveBeenCalled();
    });

    it('Test 5: Not COMPLETED status -> Skipped', async () => {
        const event = createMockEvent(10);
        event.payload.status = 'IN_PROGRESS';

        const result = await service.handleCommittedEvent(event);

        expect(result).toBeNull();
        expect(prisma.mapOperation.findUnique).not.toHaveBeenCalled();
    });
});
