import { EconomicEventType } from '@rai/prisma-client';
import { buildFinanceIngestEvent, FINANCE_INGEST_CONTRACT_VERSION } from '../../contracts/finance-ingest.contract';

describe('finance-ingest.contract', () => {
    it('builds versioned metadata envelope with deterministic idempotency key', () => {
        const a = buildFinanceIngestEvent({
            source: 'TASK_MODULE',
            sourceEventId: 'task-1',
            traceId: 'task:task-1',
            companyId: 'c1',
            type: EconomicEventType.COST_INCURRED,
            amount: 123.45,
        });

        const b = buildFinanceIngestEvent({
            source: 'TASK_MODULE',
            sourceEventId: 'task-1',
            traceId: 'task:task-1',
            companyId: 'c1',
            type: EconomicEventType.COST_INCURRED,
            amount: 123.45,
        });

        expect(a.metadata.contractVersion).toBe(FINANCE_INGEST_CONTRACT_VERSION);
        expect(a.metadata.idempotencyKey).toBeDefined();
        expect(a.metadata.idempotencyKey).toBe(b.metadata.idempotencyKey);
    });
});
