import { Controller, Post, Body, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { TenantContextService } from '../../shared/tenant-context/tenant-context.service';
import { RaiChatRequestDto, RaiChatResponseDto } from './dto/rai-chat.dto';

@Controller('rai/chat')
@UseGuards(JwtAuthGuard)
export class RaiChatController {
    private readonly logger = new Logger(RaiChatController.name);

    constructor(private readonly tenantContext: TenantContextService) { }

    @Post()
    async handleChat(@Body() body: RaiChatRequestDto): Promise<RaiChatResponseDto> {
        const companyId = this.tenantContext.getCompanyId();

        if (!companyId) {
            this.logger.error('Attempt to access RAI Chat without companyId');
            throw new BadRequestException('Security Context: companyId is missing');
        }

        const { message, workspaceContext } = body;
        this.logger.log(`RAI Chat message received for company: ${companyId}`);

        let text = `Принял: ${message}`;
        if (workspaceContext?.route) {
            text += `\nroute: ${workspaceContext.route}`;
        }

        // MVP: 1 widget-заглушка
        const widgets = [
            {
                type: 'Last24hChanges',
                payload: {
                    route: workspaceContext?.route || 'unknown',
                    ts: new Date().toISOString(),
                    companyId
                }
            }
        ];

        return {
            text,
            widgets,
            traceId: `tr_${Math.random().toString(36).substring(2, 9)}`,
            threadId: `th_${Math.random().toString(36).substring(2, 9)}` // Для совместимости с текущим web-стором
        };
    }
}
