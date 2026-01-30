"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
exports.editMessage = editMessage;
exports.answerCallbackQuery = answerCallbackQuery;
const axios_1 = __importDefault(require("axios"));
const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
/**
 * Send new message to Telegram.
 *
 * WHY: Text messages create new messages.
 */
async function sendMessage(chatId, rendered) {
    const payload = {
        chat_id: chatId,
        text: rendered.text,
        reply_markup: rendered.reply_markup
    };
    try {
        await axios_1.default.post(`${TELEGRAM_API_URL}/sendMessage`, payload);
    }
    catch (error) {
        console.error('[Telegram Sender] Failed to send message:', error);
        // WHY: Don't propagate to Core, just log
    }
}
/**
 * Edit existing message in Telegram.
 *
 * WHY: Callback queries update existing messages.
 */
async function editMessage(chatId, messageId, rendered) {
    const payload = {
        chat_id: chatId,
        message_id: messageId,
        text: rendered.text,
        reply_markup: rendered.reply_markup
    };
    try {
        await axios_1.default.post(`${TELEGRAM_API_URL}/editMessageText`, payload);
    }
    catch (error) {
        console.error('[Telegram Sender] Failed to edit message:', error);
        // WHY: Don't propagate to Core, just log
    }
}
/**
 * Answer callback query (acknowledge button press).
 *
 * WHY: Telegram requires acknowledging callbacks to remove loading state.
 */
async function answerCallbackQuery(callbackQueryId, text) {
    const payload = {
        callback_query_id: callbackQueryId,
        text
    };
    try {
        await axios_1.default.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, payload);
    }
    catch (error) {
        console.error('[Telegram Sender] Failed to answer callback:', error);
        // WHY: Don't propagate to Core, just log
    }
}
