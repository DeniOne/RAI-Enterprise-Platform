/**
 * Telegram Message Renderer
 * 
 * Renders MG Chat response to Telegram-compatible message.
 * Pure renderer - no business logic, no SDK.
 */

import { MGChatResponse, TelegramRenderedMessage } from './telegram.types';
import { renderKeyboard } from './keyboard-renderer';

/**
 * Render MG Chat response to Telegram message.
 * 
 * @param response - MG Chat response (text + actions)
 * @returns Telegram-compatible message with optional keyboard
 */
export function renderTelegramMessage(
    response: MGChatResponse
): TelegramRenderedMessage {
    // 1. Text (passed through untouched)
    const text = response.text;

    // 2. Keyboard (optional, from actions)
    const reply_markup = renderKeyboard(response.actions);

    // 3. Build result
    const result: TelegramRenderedMessage = {
        text
    };

    if (reply_markup) {
        result.reply_markup = reply_markup;
    }

    return result;
}
