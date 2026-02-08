import { Injectable, Logger } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf, Context, Markup } from "telegraf";

@Injectable()
export class TelegramNotificationService {
    private readonly logger = new Logger(TelegramNotificationService.name);

    constructor() { }

    async sendAssetProposal(telegramId: string, asset: { id: string; name: string; category: string; isRepeat?: boolean }) {
        const typeRu = asset.category === "MACHINERY" ? "Техника" : "ТМЦ";
        const repeatLabel = asset.isRepeat ? "⚠️ <b>[ПОВТОРНОЕ РАСПОЗНАВАНИЕ]</b>\n" : "";

        try {
            await fetch(`${process.env.BOT_URL || 'http://localhost:4002'}/internal/notify-asset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-API-Key': process.env.INTERNAL_API_KEY || '',
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
            });
        } catch (error) {
            this.logger.error(`Failed to notify bot about asset proposal: ${error.message}`);
        }
    }
}
