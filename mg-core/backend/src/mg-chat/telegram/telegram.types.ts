/**
 * Telegram UX Types
 * 
 * Platform-agnostic Telegram message types.
 * NO Telegram SDK imports.
 */

export interface TelegramButton {
    text: string;
    callback_data: string;
}

export interface TelegramInlineKeyboard {
    inline_keyboard: TelegramButton[][];
}

export interface TelegramRenderedMessage {
    text: string;
    reply_markup?: TelegramInlineKeyboard;
}

/**
 * MG Chat Response (from Step 4)
 */
export interface MGChatResponse {
    text: string;
    actions?: string[];
}
