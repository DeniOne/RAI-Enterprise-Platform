import { Injectable, Logger } from '@nestjs/common';
import { CommittedEvent } from '../EVENTS/event-draft.schema';

@Injectable()
export class ControllerMetricsService {
    private readonly logger = new Logger(ControllerMetricsService.name);

    async handleCommittedEvent(event: CommittedEvent) {
        this.logger.log(`Handling committed event: ${event.id} of type ${event.eventType}`);
        // Здесь будет логика пересчета метрик на основе поступившего события
        // Например, если это внесение азота, обновляем nitrogenApplied_vs_planned
    }
}
