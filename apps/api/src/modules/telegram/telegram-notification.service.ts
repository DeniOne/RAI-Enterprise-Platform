import { Injectable, Logger } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf, Context, Markup } from "telegraf";
import { ConfigService } from "@nestjs/config";
import { SecretsService } from "../../shared/config/secrets.service";

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
  ) {}

  async sendAssetProposal(
    telegramId: string,
    asset: { id: string; name: string; category: string; isRepeat?: boolean },
  ) {
    const typeRu = asset.category === "MACHINERY" ? "Техника" : "ТМЦ";
    const repeatLabel = asset.isRepeat
      ? "⚠️ <b>[ПОВТОРНОЕ РАСПОЗНАВАНИЕ]</b>\n"
      : "";

    try {
      const botUrl = this.configService.get<string>("BOT_URL") || "http://localhost:4002";
      await fetch(
        `${botUrl}/internal/notify-asset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": this.getInternalApiKey(),
          },
          body: JSON.stringify({
            telegramId,
            asset: {
              id: asset.id,
              name: asset.name,
              category: asset.category,
              isRepeat: asset.isRepeat,
            },
          }),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify bot about asset proposal: ${error.message}`,
      );
    }
  }

  async sendToGroup(message: string, groupId: string) {
    try {
      const botUrl = this.configService.get<string>("BOT_URL") || "http://localhost:4002";
      await fetch(
        `${botUrl}/internal/notify-group`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": this.getInternalApiKey(),
          },
          body: JSON.stringify({
            groupId,
            message,
          }),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send telegram group notification: ${error.message}`,
      );
    }
  }

  async sendFrontOfficeReply(chatId: string, messageText: string) {
    try {
      const botUrl = this.configService.get<string>("BOT_URL") || "http://localhost:4002";
      const response = await fetch(
        `${botUrl}/internal/front-office/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": this.getInternalApiKey(),
          },
          body: JSON.stringify({
            chatId,
            messageText,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`BOT ${response.status}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error(
        `Failed to send front-office reply via bot gateway: ${error.message}`,
      );
      throw error;
    }
  }

  async notifyFrontOfficeThread(params: {
    telegramIds: string[];
    farmName: string;
    threadKey: string;
    preview: string;
  }) {
    const workspaceUrl =
      process.env.TELEGRAM_MINIAPP_URL ||
      process.env.WEBAPP_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000/telegram/workspace";

    await Promise.all(
      params.telegramIds.map(async (telegramId) => {
        try {
          const botUrl =
            this.configService.get<string>("BOT_URL") || "http://localhost:4002";
          await fetch(
            `${botUrl}/internal/front-office/notify-thread`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Internal-API-Key": this.getInternalApiKey(),
              },
              body: JSON.stringify({
                telegramId,
                farmName: params.farmName,
                threadKey: params.threadKey,
                preview: params.preview,
                workspaceUrl,
              }),
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to notify manager ${telegramId} about front-office thread: ${error.message}`,
          );
        }
      }),
    );
  }

  private getInternalApiKey(): string {
    return this.secretsService.getOptionalSecret("INTERNAL_API_KEY") || "";
  }
}
