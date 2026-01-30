/**
 * Action Dispatcher Examples
 * 
 * Demonstrates action dispatching with various scenarios.
 */

import { dispatchAction } from './index';

console.log('='.repeat(80));
console.log('MG CHAT ACTION DISPATCHER — EXAMPLES');
console.log('='.repeat(80));

// =============================================================================
// EXAMPLE 1: Direct Intent (Success)
// =============================================================================

console.log('\n[Example 1] Direct Intent: "my_tasks"');
const result1 = dispatchAction('my_tasks');
console.log(JSON.stringify(result1, null, 2));
/*
Output:
{
  "status": "ok",
  "intent": "my_tasks",
  "source": "action_dispatcher"
}

WHY: "my_tasks" exists in mg_intent_map.json as a direct intent
*/

// =============================================================================
// EXAMPLE 2: Component Reference (Success)
// =============================================================================

console.log('\n[Example 2] Component Reference: "main_entry"');
const result2 = dispatchAction('main_entry');
console.log(JSON.stringify(result2, null, 2));
/*
Output:
{
  "status": "ok",
  "intent": "main_entry",
  "source": "action_dispatcher"
}

WHY: "main_entry" exists in mg_ux_components_map.json as a component
*/

// =============================================================================
// EXAMPLE 3: Error Intent (Success)
// =============================================================================

console.log('\n[Example 3] Error Intent: "unknown_intent"');
const result3 = dispatchAction('unknown_intent');
console.log(JSON.stringify(result3, null, 2));
/*
Output:
{
  "status": "ok",
  "intent": "unknown_intent",
  "source": "action_dispatcher"
}

WHY: "unknown_intent" exists in error_ux_map.json as an error intent
*/

// =============================================================================
// EXAMPLE 4: Unknown Action (Error)
// =============================================================================

console.log('\n[Example 4] Unknown Action: "non_existent_action"');
const result4 = dispatchAction('non_existent_action');
console.log(JSON.stringify(result4, null, 2));
/*
Output:
{
  "status": "error",
  "error_code": "UNKNOWN_ACTION"
}

WHY: Action not found in any contract
NEXT: Error UX Interceptor will handle this
*/

// =============================================================================
// EXAMPLE 5: Missing Action (Error)
// =============================================================================

console.log('\n[Example 5] Missing Action: ""');
const result5 = dispatchAction('');
console.log(JSON.stringify(result5, null, 2));
/*
Output:
{
  "status": "error",
  "error_code": "MISSING_ACTION"
}

WHY: Empty input is invalid
*/

// =============================================================================
// EXAMPLE 6: Utility Intent (Success)
// =============================================================================

console.log('\n[Example 6] Utility Intent: "cancel"');
const result6 = dispatchAction('cancel');
console.log(JSON.stringify(result6, null, 2));
/*
Output:
{
  "status": "ok",
  "intent": "cancel",
  "source": "action_dispatcher"
}

WHY: "cancel" exists in mg_intent_map.json as a utility intent
*/

// =============================================================================
// INTEGRATION EXAMPLE
// =============================================================================

console.log('\n' + '='.repeat(80));
console.log('INTEGRATION EXAMPLE');
console.log('='.repeat(80));

function handleTelegramCallback(callbackData: string) {
    console.log(`\n[Telegram Callback] Received: "${callbackData}"`);

    // 1. Dispatch action
    const dispatchResult = dispatchAction(callbackData);
    console.log('[Action Dispatcher]', JSON.stringify(dispatchResult, null, 2));

    if (dispatchResult.status === 'error') {
        console.log('[Error Handler] Handling error:', dispatchResult.error_code);
        return;
    }

    // 2. Pass to Intent Resolver
    console.log('[Intent Resolver] Processing intent:', dispatchResult.intent);

    // 3. Continue pipeline...
    console.log('[Pipeline] → Scenario Router → UX Renderer → Telegram');
}

// Test integration
handleTelegramCallback('my_tasks');
handleTelegramCallback('invalid_action');

console.log('\n' + '='.repeat(80));
