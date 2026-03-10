import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";

@Injectable()
export class TelegramPollingConflictGuard implements OnModuleInit {
  private readonly logger = new Logger(TelegramPollingConflictGuard.name);

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async onModuleInit() {
    const enforceNoWebhook =
      (process.env.TELEGRAM_ENFORCE_NO_WEBHOOK ?? "true").toLowerCase() !== "false";
    if (!enforceNoWebhook) {
      return;
    }

    try {
      const info = await this.bot.telegram.getWebhookInfo();
      if (info?.url) {
        const message =
          `Telegram webhook conflict detected for polling bot: ${info.url}. ` +
          "Disable the webhook or use a different bot token.";
        this.logger.error(message);
        throw new Error(message);
      }
    } catch (error) {
      this.logger.error(
        `Failed to validate Telegram webhook conflict: ${String((error as Error).message)}`,
      );
      throw error;
    }
  }
}
