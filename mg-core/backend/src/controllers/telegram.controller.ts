import { Request, Response } from 'express';
import telegramService from '../services/telegram.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TelegramController {
    // Webhook endpoint for receiving Telegram updates
    async webhook(req: Request, res: Response): Promise<void> {
        try {
            const bot = telegramService.getBot();

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
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    // Link Telegram account to user
    async linkAccount(req: Request, res: Response): Promise<void> {
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

            await telegramService.linkUserAccount(userId, telegramId);

            res.status(200).json({
                success: true,
                data: { message: 'Account linked successfully' }
            });
        } catch (error) {
            console.error('Link account error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    // Get bot status
    async getStatus(req: Request, res: Response): Promise<void> {
        try {
            const bot = telegramService.getBot();

            const status = {
                initialized: bot !== null,
                mode: process.env.TELEGRAM_USE_POLLING === 'true' ? 'polling' : 'webhook',
                webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || null
            };

            res.status(200).json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('Get status error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }
}

export default new TelegramController();
