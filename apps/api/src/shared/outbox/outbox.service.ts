import { Injectable } from '@nestjs/common';
import { Prisma } from '@rai/prisma-client';

@Injectable()
export class OutboxService {
    /**
     * Generates a Prisma.OutboxMessageCreateInput for usage within a transaction.
     * Does NOT execute the write itself.
     */
    createEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: any,
    ): Prisma.OutboxMessageCreateInput {
        return {
            aggregateId,
            aggregateType,
            type: eventType,
            payload: payload as Prisma.InputJsonValue,
            status: 'PENDING',
        };
    }
}
