/**
 * Keyboard Renderer
 * 
 * Renders Telegram inline keyboard from action IDs using UX contracts.
 * Fail-fast on contract violations.
 */

import { loadMGChatContracts } from '../contracts';
import { TelegramInlineKeyboard, TelegramButton } from './telegram.types';

// =============================================================================
// CONFIGURATION (from UX contract)
// =============================================================================

const MAX_BUTTONS_PER_ROW = 2;
const MAX_ROWS = 3;

// =============================================================================
// RENDERER
// =============================================================================

/**
 * Render inline keyboard from action IDs.
 * 
 * @param actions - Array of action IDs to render
 * @returns Telegram inline keyboard or undefined if no actions
 * @throws Error if action not found in UX contract
 */
export function renderKeyboard(actions?: string[]): TelegramInlineKeyboard | undefined {
    if (!actions || actions.length === 0) {
        return undefined;
    }

    const contracts = loadMGChatContracts();
    const buttons: TelegramButton[] = [];

    // Resolve each action to button via UX contract
    for (const actionId of actions) {
        const button = resolveActionToButton(actionId, contracts.ux.components);
        buttons.push(button);
    }

    // Build keyboard respecting UX limits
    const keyboard = buildKeyboardLayout(buttons);

    return {
        inline_keyboard: keyboard
    };
}

/**
 * Resolve action ID to Telegram button.
 * 
 * Searches UX components for button with matching action_id.
 * 
 * @throws Error if action not found (contract violation)
 */
function resolveActionToButton(
    actionId: string,
    components: Record<string, any>
): TelegramButton {
    // Search all components for button with this action_id
    for (const [componentId, component] of Object.entries(components)) {
        for (const row of component.layout) {
            for (const btn of row) {
                if (btn.action_id === actionId) {
                    return {
                        text: btn.text,
                        callback_data: actionId
                    };
                }
            }
        }
    }

    // Action not found in any component → contract violation
    throw new Error(`Action "${actionId}" not found in UX contract`);
}

/**
 * Build keyboard layout respecting Telegram limits.
 * 
 * Rules:
 * - Max 2 buttons per row
 * - Max 3 rows
 * - Order preserved from input
 */
function buildKeyboardLayout(buttons: TelegramButton[]): TelegramButton[][] {
    const rows: TelegramButton[][] = [];
    let currentRow: TelegramButton[] = [];

    for (const button of buttons) {
        currentRow.push(button);

        // Start new row if current row is full
        if (currentRow.length >= MAX_BUTTONS_PER_ROW) {
            rows.push(currentRow);
            currentRow = [];
        }

        // Stop if max rows reached
        if (rows.length >= MAX_ROWS) {
            break;
        }
    }

    // Add remaining buttons if any
    if (currentRow.length > 0 && rows.length < MAX_ROWS) {
        rows.push(currentRow);
    }

    return rows;
}
