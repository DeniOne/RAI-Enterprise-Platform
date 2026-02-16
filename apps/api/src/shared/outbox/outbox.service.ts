import { Injectable } from '@nestjs/common';
import { Prisma } from '@rai/prisma-client';
import { resolveEventVersion } from './event-contracts';

interface OutboxEventOptions {
    allowSystemScope?: boolean;
}

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
        options?: OutboxEventOptions,
    ): Prisma.OutboxMessageCreateInput {
        const allowSystemScope = options?.allowSystemScope === true;
        if (!allowSystemScope && !this.hasCompanyId(payload)) {
            throw new Error(`Outbox tenant contract violation: event=${eventType} requires payload.companyId`);
        }
        const eventVersion = resolveEventVersion(eventType, payload);
        const payloadWithContract = this.withEventContract(payload, eventVersion);

        return {
            aggregateId,
            aggregateType,
            type: eventType,
            payload: payloadWithContract as Prisma.InputJsonValue,
            status: 'PENDING',
        };
    }

    private hasCompanyId(payload: any): boolean {
        if (!payload || typeof payload !== 'object') {
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'companyId')) {
            const v = payload.companyId;
            return typeof v === 'string' && v.trim().length > 0;
        }
        return false;
    }

    private withEventContract(payload: any, eventVersion: number): any {
        if (!payload || typeof payload !== 'object') {
            return { eventVersion };
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'eventVersion')) {
            return payload;
        }
        return { ...payload, eventVersion };
    }
}
