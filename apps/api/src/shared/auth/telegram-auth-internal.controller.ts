import { Controller, Post, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('internal/telegram')
export class TelegramAuthInternalController {
    private readonly apiKey: string;

    constructor(
        private telegramAuthService: TelegramAuthService,
        private configService: ConfigService,
    ) {
        this.apiKey = this.configService.get<string>('INTERNAL_API_KEY') || '';
    }

    private validateApiKey(apiKey: string) {
        if (!this.apiKey || apiKey !== this.apiKey) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
    }

    @Post('confirm-login')
    async confirmLogin(
        @Body() body: { sessionId: string },
        @Headers('x-internal-api-key') apiKey: string,
    ) {
        this.validateApiKey(apiKey);
        return this.telegramAuthService.confirmLogin(body.sessionId);
    }

    @Post('deny-login')
    async denyLogin(
        @Body() body: { sessionId: string },
        @Headers('x-internal-api-key') apiKey: string,
    ) {
        this.validateApiKey(apiKey);
        await this.telegramAuthService.denyLogin(body.sessionId);
        return { success: true };
    }

    @Post('user/upsert')
    async upsertUser(
        @Body() body: any,
        @Headers('x-internal-api-key') apiKey: string,
    ) {
        this.validateApiKey(apiKey);
        return this.telegramAuthService.upsertUserFromTelegram(body);
    }

    @Post('user/get') // Using POST for convenience with body or just query
    async getUser(
        @Body() body: { telegramId: string },
        @Headers('x-internal-api-key') apiKey: string,
    ) {
        this.validateApiKey(apiKey);
        return this.telegramAuthService.getUserByTelegramId(body.telegramId);
    }

    @Post('company/first')
    async getFirstCompany(
        @Headers('x-internal-api-key') apiKey: string,
    ) {
        this.validateApiKey(apiKey);
        return this.telegramAuthService.getFirstCompany();
    }
}
