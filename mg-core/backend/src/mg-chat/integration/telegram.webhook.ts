/**
 * Telegram Webhook Handler
 * 
 * Entry point for Telegram webhook updates.
 * 
 * WHY THIS EXISTS:
 * - Telegram sends updates via webhook
 * - This layer routes them to Core pipeline
 * - Returns HTTP 200 to Telegram
 * 
 * ARCHITECTURE:
 * 1. Receive Telegram update
 * 2. Normalize input
 * 3. Route to appropriate pipeline
 * 4. Send response back to Telegram
 * 5. Return HTTP 200
 * 
 * RULES:
 * - NO business logic
 * - NO decision making beyond routing
 * - ONLY glue code
 */

import { Request, Response } from 'express';
import { TelegramUpdate } from './telegram.types';
import { normalizeUpdate } from './telegram.normalizer';
import { processTextMessage, processCallback } from './telegram.adapter';
import { sendMessage, editMessage, answerCallbackQuery } from './telegram.sender';
import { AccessContext } from '../../access/mg-chat-acl';
import auditLogService from '../../services/audit-log.service';

/**
 * TEMP: Demo user mapping for ACL integration.
 * 
 * TODO: Replace with Auth service call in production.
 * This inline mapping is explicitly marked as temporary.
 */
function getDemoAccessContext(telegramUserId: number): AccessContext {
    const DEMO_USERS: Record<number, AccessContext> = {
        123456: { userId: 'user1', roles: ['EMPLOYEE'], contour: 'employee', scope: 'self' },
        789012: { userId: 'user2', roles: ['MANAGER'], contour: 'manager', scope: 'own_unit' },
        345678: { userId: 'user3', roles: ['EXECUTIVE'], contour: 'exec', scope: 'global' }
    };

    return DEMO_USERS[telegramUserId] || {
        userId: `telegram_${telegramUserId}`,
        roles: ['EMPLOYEE'],
        contour: 'employee',
        scope: 'self'
    };
}

/**
 * Handle Telegram webhook update.
 * 
 * This is the ONLY entry point for Telegram integration.
 */
export async function handleTelegramWebhook(req: Request, res: Response): Promise<void> {
    try {
        // 0. Signature Verification (Security MUST)
        const secretToken = req.headers['x-telegram-bot-api-secret-token'];
        const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;

        if (expectedToken && secretToken !== expectedToken) {
            console.warn('[Telegram Webhook] Unauthorized request blocked (Invalid Secret Token)');
            res.status(403).send('Forbidden: Invalid secret token');
            return;
        }

        // 1. Normalize input (Strict Sandbox)
        // Pass the raw body to let the normalizer handle validation
        const normalized = normalizeUpdate(req.body);

        if (!normalized) {
            console.log('[Telegram Webhook] Invalid update or unsupported type, ignoring');
            res.status(200).send('OK');
            return;
        }

        console.log('[Telegram Webhook] Processing normalized input:', normalized.type);

        // 2. Access Context (DMZ boundary)
        const accessContext = getDemoAccessContext(normalized.userId);

        // 3. Route to appropriate pipeline
        if (normalized.type === 'text') {
            const rendered = await processTextMessage(normalized, accessContext);
            await sendMessage(normalized.chatId, rendered);
        } else if (normalized.type === 'callback') {
            const rendered = await processCallback(normalized, accessContext);

            // Answer callback query (acknowledge)
            await answerCallbackQuery(normalized.callbackQueryId);

            // Edit message with new content
            await editMessage(normalized.chatId, normalized.messageId, rendered);
        }

        // 4. Audit Trail (Compliance)
        await auditLogService.createLog({
            userId: accessContext.userId,
            action: `TELEGRAM_${normalized.type.toUpperCase()}`,
            details: {
                chatId: normalized.chatId,
                messageId: normalized.messageId,
                payload: normalized.type === 'text' ? normalized.text : normalized.actionId
            },
            ipAddress: req.ip
        });

        // 5. Return HTTP 200 to Telegram
        res.status(200).send('OK');
    } catch (error) {
        console.error('[Telegram Webhook] Error processing update:', error);

        // WHY: Always return 200 to Telegram to prevent retries
        res.status(200).send('OK');
    }
}
