import { Injectable, Logger } from '@nestjs/common';
import { EconomyService } from '../../economy/application/economy.service';
import { EconomicEventType } from '@rai/prisma-client';
import { buildFinanceIngestEvent } from '../../contracts/finance-ingest.contract';

@Injectable()
export class IntegrationService {
    private readonly logger = new Logger(IntegrationService.name);

    constructor(private readonly economyService: EconomyService) { }

    async handleTaskCompletion(data: {
        taskId: string;
        companyId: string;
        seasonId?: string;
        fieldId?: string;
        amount?: number;
    }) {
        this.logger.log(`Handling task completion for task ${data.taskId}`);

        await this.economyService.ingestEvent(
            buildFinanceIngestEvent({
                source: 'TASK_MODULE',
                sourceEventId: data.taskId,
                traceId: `task:${data.taskId}`,
                type: EconomicEventType.COST_INCURRED,
                amount: data.amount || 0,
                companyId: data.companyId,
                seasonId: data.seasonId,
                fieldId: data.fieldId,
                metadata: {
                    taskId: data.taskId,
                },
            }),
        );
    }

    async handleHrPayment(data: {
        employeeId: string;
        companyId: string;
        amount: number;
        type: 'BONUS' | 'SALARY';
    }) {
        this.logger.log(`Handling HR payment for employee ${data.employeeId}`);

        await this.economyService.ingestEvent(
            buildFinanceIngestEvent({
                source: 'HR_MODULE',
                sourceEventId: `${data.employeeId}:${data.type}`,
                traceId: `hr:${data.employeeId}:${data.type}`,
                type: EconomicEventType.COST_INCURRED,
                amount: data.amount,
                companyId: data.companyId,
                employeeId: data.employeeId,
                metadata: {
                    paymentType: data.type,
                },
            }),
        );
    }
}
