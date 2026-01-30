"use strict";
/**
 * Telegram Message Renderer
 *
 * Renders MG Chat response to Telegram-compatible message.
 * Pure renderer - no business logic, no SDK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTelegramMessage = renderTelegramMessage;
const keyboard_renderer_1 = require("./keyboard-renderer");
/**
 * Render MG Chat response to Telegram message.
 *
 * @param response - MG Chat response (text + actions)
 * @returns Telegram-compatible message with optional keyboard
 */
function renderTelegramMessage(response) {
    // 1. Text (passed through untouched)
    const text = response.text;
    // 2. Keyboard (optional, from actions)
    const reply_markup = (0, keyboard_renderer_1.renderKeyboard)(response.actions);
    // 3. Build result
    const result = {
        text
    };
    if (reply_markup) {
        result.reply_markup = reply_markup;
    }
    return result;
}
