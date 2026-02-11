import { Injectable, Logger } from '@nestjs/common';
import { EconomyService } from '../../economy/application/economy.service';
import { EconomicEventType } from '@rai/prisma-client';

@Injectable()
export class IntegrationService {
    private readonly logger = new Logger(IntegrationService.name);

    constructor(private readonly economyService: EconomyService) { }

    /**
     * Интеграция с Task Module.
     * Вызывается при завершении задачи.
     */
    async handleTaskCompletion(data: {
        taskId: string;
        companyId: string;
        seasonId?: string;
        fieldId?: string;
        amount?: number; // Фактическая стоимость ресурсов или работ
    }) {
        this.logger.log(`Handling task completion for task ${data.taskId}`);

        // Мапинг операционного события в EconomicEvent
        await this.economyService.ingestEvent({
            type: 'COST_INCURRED',
            amount: data.amount || 0,
            companyId: data.companyId,
            seasonId: data.seasonId,
            fieldId: data.fieldId,
            metadata: {
                source: 'TASK_MODULE',
                taskId: data.taskId,
            },
        });
    }

    /**
     * Интеграция с HR Module.
     * Вызывается при выплате бонусов или начислении зарплаты.
     */
    async handleHrPayment(data: {
        employeeId: string;
        companyId: string;
        amount: number;
        type: 'BONUS' | 'SALARY';
    }) {
        this.logger.log(`Handling HR payment for employee ${data.employeeId}`);

        await this.economyService.ingestEvent({
            type: 'COST_INCURRED',
            amount: data.amount,
            companyId: data.companyId,
            employeeId: data.employeeId,
            metadata: {
                source: 'HR_MODULE',
                paymentType: data.type,
            },
        });
    }
}
