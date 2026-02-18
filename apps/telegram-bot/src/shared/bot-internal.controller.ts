import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';
import { ApiClientService } from './api-client/api-client.service';

interface NotifyLoginDto {
    telegramId: string;
    sessionId: string;
}

interface NotifyAssetDto {
    telegramId: string;
    asset: {
        id: string;
        name: string;
        category: string;
        isRepeat?: boolean;
    };
}

interface PushProgressDto {
    report: string;
}

@Controller('internal')
export class BotInternalController {
    private readonly logger = new Logger(BotInternalController.name);

    constructor(
        @InjectBot() private bot: Telegraf,
        private apiClient: ApiClientService,
    ) { }

    @Post('notify-login')
    async notifyLogin(
        @Headers('x-internal-api-key') apiKey: string,
        @Body() dto: NotifyLoginDto,
    ) {
        this.validateApiKey(apiKey);

        await this.bot.telegram.sendMessage(
            dto.telegramId,
            `🔐 <b>Попытка входа в веб-интерфейс</b>\n\nКто-то пытается войти в ваш аккаунт RAI_EP.\n\n<b>Это Вы?</b>`,
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Да, это я', `confirm_login:${dto.sessionId}`),
                        Markup.button.callback('❌ Нет, не я', `deny_login:${dto.sessionId}`),
                    ],
                ]),
            },
        );

        return { success: true };
    }

    @Post('notify-asset')
    async notifyAsset(
        @Headers('x-internal-api-key') apiKey: string,
        @Body() dto: NotifyAssetDto,
    ) {
        this.validateApiKey(apiKey);
        const { telegramId, asset } = dto;

        const typeRu = asset.category === "MACHINERY" ? "Техника" : "ТМЦ";
        const repeatLabel = asset.isRepeat ? "⚠️ <b>[ПОВТОРНОЕ РАСПОЗНАВАНИЕ]</b>\n" : "";

        await this.bot.telegram.sendMessage(
            telegramId,
            `🤖 <b>ИИ: Обнаружен новый актив</b>\n\n${repeatLabel}Тип: ${typeRu}\nНазвание: <b>${asset.name}</b>\n\nДобавить это в реестр клиента?`,
            {
                parse_mode: "HTML",
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback("✅ Да", `confirm_asset:${asset.category}:${asset.id}`),
                        Markup.button.callback("❌ Нет", `reject_asset:${asset.category}:${asset.id}`),
                    ],
                ]),
            }
        );

        return { success: true };
    }

    @Post('push-progress')
    async pushProgress(
        @Headers('x-internal-api-key') apiKey: string,
        @Body() dto: PushProgressDto,
    ) {
        this.validateApiKey(apiKey);

        const users = await this.apiClient.getActiveUsers();

        this.logger.log(`Broadcasting progress to ${users.length} users...`);

        for (const user of users) {
            try {
                if (user.telegramId) {
                    await this.bot.telegram.sendMessage(user.telegramId, dto.report, {
                        parse_mode: "HTML",
                    });
                }
            } catch (e) {
                this.logger.error(
                    `❌ Failed to send push to ${user.telegramId}: ${e.message}`,
                );
            }
        }

        return { success: true, count: users.length };
    }

    private validateApiKey(apiKey: string) {
        if (apiKey !== process.env.INTERNAL_API_KEY) {
            throw new UnauthorizedException('Invalid internal API key');
        }
    }
}
