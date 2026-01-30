/**
 * Telegram UX Renderer Examples
 * 
 * Demonstrates rendering MG Chat responses to Telegram messages.
 */

import { renderTelegramMessage, MGChatResponse } from './index';

// =============================================================================
// EXAMPLE 1: Simple response with actions
// =============================================================================

const example1: MGChatResponse = {
    text: "Сегодня у тебя 3 задачи",
    actions: ["my_tasks", "focus_mode"]
};

const rendered1 = renderTelegramMessage(example1);

console.log('Example 1:', JSON.stringify(rendered1, null, 2));
/*
Output:
{
  "text": "Сегодня у тебя 3 задачи",
  "reply_markup": {
    "inline_keyboard": [
      [
        { "text": "📋 Задачи", "callback_data": "my_tasks" },
        { "text": "🎯 Фокус", "callback_data": "focus_mode" }
      ]
    ]
  }
}
*/

// =============================================================================
// EXAMPLE 2: Multiple rows (4 buttons)
// =============================================================================

const example2: MGChatResponse = {
    text: "Понял. Что случилось?",
    actions: ["problem_tech", "problem_client", "problem_task", "problem_other"]
};

const rendered2 = renderTelegramMessage(example2);

console.log('Example 2:', JSON.stringify(rendered2, null, 2));
/*
Output:
{
  "text": "Понял. Что случилось?",
  "reply_markup": {
    "inline_keyboard": [
      [
        { "text": "🛠 Техника", "callback_data": "problem_tech" },
        { "text": "👤 Клиент", "callback_data": "problem_client" }
      ],
      [
        { "text": "📋 Задача", "callback_data": "problem_task" },
        { "text": "❓ Другое", "callback_data": "problem_other" }
      ]
    ]
  }
}
*/

// =============================================================================
// EXAMPLE 3: No actions (text only)
// =============================================================================

const example3: MGChatResponse = {
    text: "Фокус-режим включён на 60 минут."
};

const rendered3 = renderTelegramMessage(example3);

console.log('Example 3:', JSON.stringify(rendered3, null, 2));
/*
Output:
{
  "text": "Фокус-режим включён на 60 минут."
}
*/

// =============================================================================
// EXAMPLE 4: Max buttons (6 buttons → 3 rows × 2)
// =============================================================================

const example4: MGChatResponse = {
    text: "Выбери действие:",
    actions: ["my_tasks", "my_shifts", "focus_mode", "my_progress", "request_help", "cancel"]
};

const rendered4 = renderTelegramMessage(example4);

console.log('Example 4:', JSON.stringify(rendered4, null, 2));
/*
Output:
{
  "text": "Выбери действие:",
  "reply_markup": {
    "inline_keyboard": [
      [
        { "text": "📋 Задачи", "callback_data": "my_tasks" },
        { "text": "🗓 График", "callback_data": "my_shifts" }
      ],
      [
        { "text": "🎯 Фокус", "callback_data": "focus_mode" },
        { "text": "📊 Прогресс", "callback_data": "my_progress" }
      ],
      [
        { "text": "🆘 Помощь", "callback_data": "request_help" },
        { "text": "❌ Отмена", "callback_data": "cancel" }
      ]
    ]
  }
}
*/

// =============================================================================
// EXAMPLE 5: Error UX response
// =============================================================================

const example5: MGChatResponse = {
    text: "Я не понял запрос. Могу помочь с основными вещами:",
    actions: ["my_tasks", "my_shifts", "my_status"]
};

const rendered5 = renderTelegramMessage(example5);

console.log('Example 5:', JSON.stringify(rendered5, null, 2));
/*
Output:
{
  "text": "Я не понял запрос. Могу помочь с основными вещами:",
  "reply_markup": {
    "inline_keyboard": [
      [
        { "text": "📋 Задачи", "callback_data": "my_tasks" },
        { "text": "🗓 График", "callback_data": "my_shifts" }
      ],
      [
        { "text": "📍 Статус", "callback_data": "my_status" }
      ]
    ]
  }
}
*/
