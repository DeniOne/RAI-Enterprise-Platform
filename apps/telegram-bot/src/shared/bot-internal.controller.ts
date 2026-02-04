import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';

interface NotifyLoginDto {
    telegramId: string;
    sessionId: string;
}

@Controller('internal')
export class BotInternalController {
    constructor(@InjectBot() private bot: Telegraf) { }

    @Post('notify-login')
    async notifyLogin(
        @Headers('x-internal-api-key') apiKey: string,
        @Body() dto: NotifyLoginDto,
    ) {
        // Validate internal API key
        if (apiKey !== process.env.INTERNAL_API_KEY) {
            throw new UnauthorizedException('Invalid internal API key');
        }

        // Send Telegram notification
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
}
