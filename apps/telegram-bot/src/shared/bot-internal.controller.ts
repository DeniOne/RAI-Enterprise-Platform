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

interface SendFrontOfficeThreadMessageDto {
    chatId: string;
    messageText: string;
}

interface NotifyFrontOfficeThreadDto {
    telegramId: string;
    farmName: string;
    threadKey: string;
    preview: string;
    workspaceUrl: string;
}

interface SendFrontOfficeInviteDto {
    telegramId: string;
    companyName: string;
    counterpartyName: string;
    activationUrl: string;
    botStartLink?: string | null;
    contactName?: string | null;
}

@Controller('internal')
export class BotInternalController {
    private readonly logger = new Logger(BotInternalController.name);

    constructor(
        @InjectBot() private bot: Telegraf,
        private apiClient: ApiClientService,
    ) { }

    private normalizeTelegramChatId(rawChatId: string): string {
        return rawChatId.startsWith('telegram:')
            ? rawChatId.slice('telegram:'.length)
            : rawChatId;
    }

    private appendThreadKey(workspaceUrl: string, threadKey: string): string {
        const separator = workspaceUrl.includes('?') ? '&' : '?';
        return `${workspaceUrl}${separator}threadKey=${encodeURIComponent(threadKey)}`;
    }

    private isTelegramMiniAppUrl(workspaceUrl: string): boolean {
        return /^https:\/\//i.test(workspaceUrl);
    }

    private buildWorkspaceKeyboard(label: string, workspaceUrl: string, threadKey?: string) {
        if (!this.isTelegramMiniAppUrl(workspaceUrl)) {
            return null;
        }
        const targetUrl = threadKey
            ? this.appendThreadKey(workspaceUrl, threadKey)
            : workspaceUrl;
        const button = Markup.button.webApp(label, targetUrl);

        return Markup.inlineKeyboard([[button]]);
    }

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

    @Post('front-office/send-message')
    async sendFrontOfficeThreadMessage(
        @Headers('x-internal-api-key') apiKey: string,
        @Body() dto: SendFrontOfficeThreadMessageDto,
    ) {
        this.validateApiKey(apiKey);

        const sent = await this.bot.telegram.sendMessage(
            this.normalizeTelegramChatId(dto.chatId),
            dto.messageText,
            {
                parse_mode: 'HTML',
            },
        );

        return {
            success: true,
            messageId: sent.message_id?.toString?.() ?? null,
            chatId: dto.chatId,
        };
    }

    @Post('front-office/notify-thread')
    async notifyFrontOfficeThread(
        @Headers('x-internal-api-key') apiKey: string,
        @Body() dto: NotifyFrontOfficeThreadDto,
    ) {
        this.validateApiKey(apiKey);

        const keyboard = this.buildWorkspaceKeyboard(
            'Открыть диалог',
            dto.workspaceUrl,
            dto.threadKey,
        );
        const manualUrl = this.appendThreadKey(dto.workspaceUrl, dto.threadKey);
        await this.bot.telegram.sendMessage(
            dto.telegramId,
            keyboard
                ? `📨 <b>${dto.farmName}</b>\n${dto.preview}`
                : `📨 <b>${dto.farmName}</b>\n${dto.preview}\n\nMini App локально: ${manualUrl}`,
            {
                parse_mode: 'HTML',
                ...(keyboard ?? {}),
            },
        );

        return { success: true };
    }

    @Post('front-office/send-invite')
    async sendFrontOfficeInvite(
        @Headers('x-internal-api-key') apiKey: string,
        @Body() dto: SendFrontOfficeInviteDto,
    ) {
        this.validateApiKey(apiKey);

        const buttons = [
            [Markup.button.url('Открыть регистрацию', dto.activationUrl)],
        ];

        if (dto.botStartLink) {
            buttons.push([Markup.button.url('Открыть бота', dto.botStartLink)]);
        }

        const contactLine = dto.contactName
            ? `\nКонтакт: <b>${dto.contactName}</b>`
            : '';

        await this.bot.telegram.sendMessage(
            dto.telegramId,
            `🔐 <b>Приглашение в RAI_EP</b>\n\nВас пригласили в систему как представителя контрагента <b>${dto.counterpartyName}</b> в компании <b>${dto.companyName}</b>.${contactLine}\n\nНажмите кнопку ниже, чтобы завершить активацию доступа.`,
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(buttons),
            },
        );

        return { success: true };
    }

    private validateApiKey(apiKey: string) {
        if (apiKey !== process.env.INTERNAL_API_KEY) {
            throw new UnauthorizedException('Invalid internal API key');
        }
    }
}
