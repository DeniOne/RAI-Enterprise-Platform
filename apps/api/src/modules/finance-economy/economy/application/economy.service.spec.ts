import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@rai/prisma-client';
import { EconomyService } from './economy.service';

describe('EconomyService replay/duplicate protection', () => {
    afterEach(() => {
        delete process.env.FINANCIAL_REQUIRE_IDEMPOTENCY;
        delete process.env.FINANCE_CONTRACT_COMPATIBILITY_MODE;
    });

    const makeService = () => {
        const tx = {
            economicEvent: { create: jest.fn() },
            ledgerEntry: { createMany: jest.fn() },
            outboxMessage: { create: jest.fn() },
        };
        const prisma = {
            $transaction: jest.fn(),
            economicEvent: {
                findFirst: jest.fn(),
            },
        } as any;
        const outbox = {
            createEvent: jest.fn().mockReturnValue({}),
        } as any;
        const service = new EconomyService(prisma, outbox);
        return { service, prisma, tx };
    };

    it('throws when idempotency is required but missing', async () => {
        const { service } = makeService();
        process.env.FINANCIAL_REQUIRE_IDEMPOTENCY = 'true';

        await expect(
            service.ingestEvent({
                type: 'COST_INCURRED' as any,
                amount: 100,
                companyId: 'c1',
                metadata: {},
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws in strict mode when integration contract version is missing', async () => {
        const { service } = makeService();
        process.env.FINANCE_CONTRACT_COMPATIBILITY_MODE = 'strict';
        process.env.FINANCIAL_REQUIRE_IDEMPOTENCY = 'false';

        await expect(
            service.ingestEvent({
                type: 'COST_INCURRED' as any,
                amount: 100,
                companyId: 'c1',
                metadata: { source: 'TASK_MODULE' },
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns existing event on unique conflict by replay/idempotency key', async () => {
        const { service, prisma } = makeService();
        process.env.FINANCIAL_REQUIRE_IDEMPOTENCY = 'false';

        const uniqueError = new Prisma.PrismaClientKnownRequestError(
            'Unique constraint failed',
            { code: 'P2002', clientVersion: 'test' },
        );
        prisma.$transaction.mockRejectedValue(uniqueError);
        prisma.economicEvent.findFirst.mockResolvedValue({ id: 'evt-existing' });

        const result = await service.ingestEvent({
            type: 'COST_INCURRED' as any,
            amount: 200,
            companyId: 'c1',
            metadata: { idempotencyKey: 'idem-1' },
        });

        expect(result).toEqual({ id: 'evt-existing' });
    });

    it('extracts deterministic replay fingerprint when no explicit keys', async () => {
        const { service } = makeService();
        const replayKey = (service as any).extractReplayKey(
            {
                type: 'COST_INCURRED',
                amount: 500,
                companyId: 'c1',
                currency: 'RUB',
                metadata: { source: 'TASK_MODULE', traceId: 'trace-1' },
            },
            null,
        );
        expect(replayKey).toMatch(/^fp:/);
    });

    it('applies canonical monetary rounding to economic event and ledger entries', async () => {
        const { service, prisma, tx } = makeService();
        process.env.FINANCIAL_REQUIRE_IDEMPOTENCY = 'false';

        tx.economicEvent.create.mockResolvedValue({
            id: 'evt-1',
            type: 'COST_INCURRED',
            amount: 12.3457,
            currency: 'RUB',
            metadata: {},
            companyId: 'c1',
        });
        tx.ledgerEntry.createMany.mockResolvedValue({ count: 2 });
        tx.outboxMessage.create.mockResolvedValue({ id: 'ob-1' });
        prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

        await service.ingestEvent({
            type: 'COST_INCURRED' as any,
            amount: 12.345678,
            companyId: 'c1',
            metadata: {},
        });

        expect(tx.economicEvent.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    amount: 12.3457,
                }),
            }),
        );
        const createManyArg = tx.ledgerEntry.createMany.mock.calls[0][0];
        expect(createManyArg.data[0].amount).toBe(12.3457);
        expect(createManyArg.data[1].amount).toBe(12.3457);
    });

    it('enriches metadata with journal phase and settlement reference', async () => {
        const { service, prisma, tx } = makeService();
        process.env.FINANCIAL_REQUIRE_IDEMPOTENCY = 'false';

        tx.economicEvent.create.mockResolvedValue({
            id: 'evt-settle',
            type: 'OBLIGATION_SETTLED',
            amount: 100,
            currency: 'RUB',
            metadata: { obligationId: 'obl-42' },
            companyId: 'c1',
        });
        tx.ledgerEntry.createMany.mockResolvedValue({ count: 2 });
        tx.outboxMessage.create.mockResolvedValue({ id: 'ob-2' });
        prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

        await service.ingestEvent({
            type: 'OBLIGATION_SETTLED' as any,
            amount: 100,
            companyId: 'c1',
            metadata: { obligationId: 'obl-42' },
        });

        expect(tx.economicEvent.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    metadata: expect.objectContaining({
                        journalPhase: 'SETTLEMENT',
                        settlementRef: 'obligation:obl-42',
                    }),
                }),
            }),
        );
    });
});
