/**
 * Telegram Sender
 * 
 * HTTP transport layer for Telegram Bot API.
 * 
 * WHY THIS EXISTS:
 * - Core returns platform-agnostic TelegramRenderedMessage
 * - This layer sends it to Telegram via HTTP
 * - Decouples Core from Telegram API specifics
 * 
 * RULES:
 * - NO business logic
 * - NO decision making
 * - ONLY HTTP calls
 * - Log errors, don't propagate to Core
 */

import axios from 'axios';
import { TelegramRenderedMessage } from '../telegram';

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

interface SendMessagePayload {
    chat_id: number;
    text: string;
    reply_markup?: any;
}

interface EditMessagePayload {
    chat_id: number;
    message_id: number;
    text: string;
    reply_markup?: any;
}

interface AnswerCallbackQueryPayload {
    callback_query_id: string;
    text?: string;
}

/**
 * Send new message to Telegram.
 * 
 * WHY: Text messages create new messages.
 */
export async function sendMessage(
    chatId: number,
    rendered: TelegramRenderedMessage
): Promise<void> {
    const payload: SendMessagePayload = {
        chat_id: chatId,
        text: rendered.text,
        reply_markup: rendered.reply_markup
    };

    try {
        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, payload);
    } catch (error) {
        console.error('[Telegram Sender] Failed to send message:', error);
        // WHY: Don't propagate to Core, just log
    }
}

/**
 * Edit existing message in Telegram.
 * 
 * WHY: Callback queries update existing messages.
 */
export async function editMessage(
    chatId: number,
    messageId: number,
    rendered: TelegramRenderedMessage
): Promise<void> {
    const payload: EditMessagePayload = {
        chat_id: chatId,
        message_id: messageId,
        text: rendered.text,
        reply_markup: rendered.reply_markup
    };

    try {
        await axios.post(`${TELEGRAM_API_URL}/editMessageText`, payload);
    } catch (error) {
        console.error('[Telegram Sender] Failed to edit message:', error);
        // WHY: Don't propagate to Core, just log
    }
}

/**
 * Answer callback query (acknowledge button press).
 * 
 * WHY: Telegram requires acknowledging callbacks to remove loading state.
 */
export async function answerCallbackQuery(
    callbackQueryId: string,
    text?: string
): Promise<void> {
    const payload: AnswerCallbackQueryPayload = {
        callback_query_id: callbackQueryId,
        text
    };

    try {
        await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, payload);
    } catch (error) {
        console.error('[Telegram Sender] Failed to answer callback:', error);
        // WHY: Don't propagate to Core, just log
    }
}
