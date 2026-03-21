import { Controller, Post, Body } from '@nestjs/common';
import { EventActionsService } from './event-actions.service';
import { ConfirmEventDto, FixEventDto, LinkEventDto } from './dtos';

@Controller('api/agro/events')
export class EventActionsController {
    constructor(private readonly service: EventActionsService) { }

    @Post('confirm')
    async confirm(@Body() dto: ConfirmEventDto) {
        // В реальности tenantId/userId берутся из AuthContext/Request
        const tenantId = '441610858'; // Тестовый TenantID из memory bank
        const userId = 'system';

        return this.service.confirm(tenantId, userId, dto.draftId);
    }

    @Post('fix')
    async fix(@Body() dto: FixEventDto) {
        const tenantId = '441610858';
        const userId = 'system';

        return this.service.fix(tenantId, userId, dto.draftId, dto.patch);
    }

    @Post('link')
    async link(@Body() dto: LinkEventDto) {
        const tenantId = '441610858';
        const userId = 'system';

        return this.service.link(tenantId, userId, dto.draftId, dto);
    }
}
