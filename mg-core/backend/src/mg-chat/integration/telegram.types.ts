/**
 * Telegram Integration Types
 * 
 * Platform-specific types for Telegram webhook integration.
 * These types are ONLY used in the glue layer.
 */

/**
 * Telegram Update (simplified)
 * Only fields we actually use.
 */
export interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
    message_id: number;
    from?: TelegramUser;
    chat: TelegramChat;
    text?: string;
}

export interface TelegramCallbackQuery {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
}

export interface TelegramUser {
    id: number;
    first_name: string;
    username?: string;
}

export interface TelegramChat {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
}

/**
 * Normalized input for Core pipeline
 */
export interface NormalizedTextInput {
    type: 'text';
    chatId: number;
    messageId: number;
    userId: number;
    text: string;
}

export interface NormalizedCallbackInput {
    type: 'callback';
    chatId: number;
    messageId: number;
    userId: number;
    callbackQueryId: string;
    actionId: string;
}

export type NormalizedInput = NormalizedTextInput | NormalizedCallbackInput;

/**
 * Telegram API request payloads
 */
export interface SendMessagePayload {
    chat_id: number;
    text: string;
    reply_markup?: any;
}

export interface EditMessagePayload {
    chat_id: number;
    message_id: number;
    text: string;
    reply_markup?: any;
}

export interface AnswerCallbackQueryPayload {
    callback_query_id: string;
    text?: string;
}
