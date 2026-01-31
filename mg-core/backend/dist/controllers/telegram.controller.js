"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramController = void 0;
const telegram_service_1 = __importDefault(require("@/services/telegram.service"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TelegramController {
    // Webhook endpoint for receiving Telegram updates
    async webhook(req, res) {
        try {
            const bot = telegram_service_1.default.getBot();
            if (!bot) {
                res.status(503).json({
                    success: false,
                    error: { message: 'Bot not initialized' }
                });
                return;
            }
            // Process the update
            await bot.handleUpdate(req.body);
            res.status(200).json({ success: true });
        }
        catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }
    // Link Telegram account to user
    async linkAccount(req, res) {
        try {
            const { userId, telegramId } = req.body;
            if (!userId || !telegramId) {
                res.status(400).json({
                    success: false,
                    error: { message: 'userId and telegramId are required' }
                });
                return;
            }
            // Check if telegram_id is already linked to another user
            const existingUser = await prisma.user.findFirst({
                where: { telegram_id: telegramId }
            });
            if (existingUser && existingUser.id !== userId) {
                res.status(409).json({
                    success: false,
                    error: { message: 'This Telegram account is already linked to another user' }
                });
                return;
            }
            await telegram_service_1.default.linkUserAccount(userId, telegramId);
            res.status(200).json({
                success: true,
                data: { message: 'Account linked successfully' }
            });
        }
        catch (error) {
            console.error('Link account error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }
    // Get bot status
    async getStatus(req, res) {
        try {
            const bot = telegram_service_1.default.getBot();
            const status = {
                initialized: bot !== null,
                mode: process.env.TELEGRAM_USE_POLLING === 'true' ? 'polling' : 'webhook',
                webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || null
            };
            res.status(200).json({
                success: true,
                data: status
            });
        }
        catch (error) {
            console.error('Get status error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }
}
exports.TelegramController = TelegramController;
exports.default = new TelegramController();
