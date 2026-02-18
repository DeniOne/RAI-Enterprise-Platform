import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { InternalApiKeyGuard } from './internal-api-key.guard';

@Controller('internal/telegram')
@UseGuards(InternalApiKeyGuard)
export class TelegramAuthInternalController {
    constructor(
        private telegramAuthService: TelegramAuthService,
    ) { }

    @Post('confirm-login')
    async confirmLogin(
        @Body() body: { sessionId: string },
    ) {
        return this.telegramAuthService.confirmLogin(body.sessionId);
    }

    @Post('deny-login')
    async denyLogin(
        @Body() body: { sessionId: string },
    ) {
        await this.telegramAuthService.denyLogin(body.sessionId);
        return { success: true };
    }

    @Post('user/upsert')
    async upsertUser(
        @Body() body: any,
    ) {
        return this.telegramAuthService.upsertUserFromTelegram(body);
    }

    @Post('user/get') // Using POST for convenience with body or just query
    async getUser(
        @Body() body: { telegramId: string; companyId?: string },
    ) {
        return this.telegramAuthService.getUserByTelegramId(body.telegramId, body.companyId);
    }

    @Post('company/first')
    async getFirstCompany() {
        return this.telegramAuthService.getFirstCompany();
    }

    @Post('users/active')
    async getActiveUsers(
        @Body() body: { companyId?: string },
    ) {
        return this.telegramAuthService.getActiveUsers(body?.companyId);
    }
}
