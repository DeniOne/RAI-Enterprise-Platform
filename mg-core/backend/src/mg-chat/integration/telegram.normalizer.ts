/**
 * Telegram Input Normalizer
 * 
 * Converts Telegram webhook updates to Core-compatible DTOs.
 * 
 * WHY THIS EXISTS:
 * - Telegram sends complex nested objects
 * - Core expects simple, normalized inputs
 * - This layer decouples Core from Telegram specifics
 * 
 * RULES:
 * - NO business logic
 * - NO decision making
 * - ONLY data transformation
 */

import { NormalizedInput, NormalizedTextInput, NormalizedCallbackInput, TelegramUpdate } from './telegram.types';

// Constants for Sandbox limits
const MAX_PAYLOAD_SIZE = 1024 * 50; // 50KB limit to prevent flood
const MAX_TEXT_LENGTH = 4096; // Telegram's own limit
const MAX_ACTION_ID_LENGTH = 64;

/**
 * Strict Sandbox Validator & Normalizer.
 * 
 * WHY: This is the ONLY place where raw Telegram data is handled.
 * It enforces hard bounds and cleans input before it touches Core.
 */
export function normalizeUpdate(rawUpdate: any): NormalizedInput | null {
    // 1. Basic sanity check (Size/Type)
    if (!rawUpdate || typeof rawUpdate !== 'object') return null;

    // 2. Reject if too large (approximate size check)
    if (JSON.stringify(rawUpdate).length > MAX_PAYLOAD_SIZE) {
        console.warn('[Sandbox] Payload exceeded size limit');
        return null;
    }

    const update = rawUpdate as TelegramUpdate;

    // 3. Mandatory field validation
    if (!update.update_id) return null;

    // 4. Route to specific normalizers
    if (update.message?.text) {
        return normalizeTextMessage(update);
    }

    if (update.callback_query?.data) {
        return normalizeCallbackQuery(update);
    }

    return null;
}

function normalizeTextMessage(update: TelegramUpdate): NormalizedTextInput | null {
    const msg = update.message!;

    // Strict field validation
    if (!msg.chat?.id || !msg.message_id || !msg.from?.id) return null;
    if (typeof msg.text !== 'string') return null;

    // Enforcement: Trim and limit
    const cleanText = msg.text.trim().substring(0, MAX_TEXT_LENGTH);

    return {
        type: 'text',
        chatId: msg.chat.id,
        messageId: msg.message_id,
        userId: msg.from.id,
        text: cleanText
    };
}

function normalizeCallbackQuery(update: TelegramUpdate): NormalizedCallbackInput | null {
    const cb = update.callback_query!;

    // Strict field validation
    if (!cb.id || !cb.from?.id || !cb.message?.chat?.id || !cb.message.message_id) return null;
    if (typeof cb.data !== 'string') return null;

    // Enforcement: Trim and limit
    const cleanActionId = cb.data.trim().substring(0, MAX_ACTION_ID_LENGTH);

    return {
        type: 'callback',
        chatId: cb.message.chat.id,
        messageId: cb.message.message_id,
        userId: cb.from.id,
        callbackQueryId: cb.id,
        actionId: cleanActionId
    };
}
