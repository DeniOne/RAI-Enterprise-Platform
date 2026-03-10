import { Injectable, Logger } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf, Context, Markup } from "telegraf";

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor() {}

  async sendAssetProposal(
    telegramId: string,
    asset: { id: string; name: string; category: string; isRepeat?: boolean },
  ) {
    const typeRu = asset.category === "MACHINERY" ? "Техника" : "ТМЦ";
    const repeatLabel = asset.isRepeat
      ? "⚠️ <b>[ПОВТОРНОЕ РАСПОЗНАВАНИЕ]</b>\n"
      : "";

    try {
      await fetch(
        `${process.env.BOT_URL || "http://localhost:4002"}/internal/notify-asset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": process.env.INTERNAL_API_KEY || "",
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
      await fetch(
        `${process.env.BOT_URL || "http://localhost:4002"}/internal/notify-group`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": process.env.INTERNAL_API_KEY || "",
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
      const response = await fetch(
        `${process.env.BOT_URL || "http://localhost:4002"}/internal/front-office/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": process.env.INTERNAL_API_KEY || "",
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
          await fetch(
            `${process.env.BOT_URL || "http://localhost:4002"}/internal/front-office/notify-thread`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Internal-API-Key": process.env.INTERNAL_API_KEY || "",
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
}
