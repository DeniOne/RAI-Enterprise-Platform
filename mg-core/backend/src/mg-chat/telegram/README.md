# MG Chat Telegram UX Renderer

## 📁 Структура

```
backend/src/mg-chat/telegram/
├── telegram.types.ts       ✅ Platform-agnostic types
├── keyboard-renderer.ts    ✅ Contract-based keyboard builder
├── telegram-renderer.ts    ✅ Main renderer
└── index.ts                ✅ Public API
```

## 🎯 Публичный API

```typescript
import { renderTelegramMessage, MGChatResponse } from '@/mg-chat/telegram';

const response: MGChatResponse = {
    text: "Сегодня у тебя 3 задачи",
    actions: ["my_tasks", "focus_mode"]
};

const rendered = renderTelegramMessage(response);
```

**Output:**
```json
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
```

## 🧠 Алгоритм

### 1. Action Resolution

Для каждого `action_id`:
1. Поиск в `mg_ux_components_map.json`
2. Извлечение `text` и `action_id`
3. Создание `TelegramButton`

**Пример:**
```typescript
// action_id: "my_tasks"
// → Search in UX contract
// → Found in "main_entry" component
// → Extract: { text: "📋 Задачи", action_id: "my_tasks" }
// → Render: { text: "📋 Задачи", callback_data: "my_tasks" }
```

### 2. Keyboard Layout

**Правила:**
- Max 2 buttons per row
- Max 3 rows
- Order preserved from input

**Пример:**
```typescript
actions: ["a", "b", "c", "d", "e"]

→ Layout:
[
    [button_a, button_b],  // row 1
    [button_c, button_d],  // row 2
    [button_e]             // row 3
]
```

### 3. Text Rendering

Text передаётся **без изменений**:
- No markdown processing (v1)
- No HTML escaping (v1)
- No template interpolation

## ✅ Примеры

### Example 1: With Actions
```typescript
const response = {
    text: "Понял. Что случилось?",
    actions: ["problem_tech", "problem_client", "problem_task", "problem_other"]
};

renderTelegramMessage(response);
```

**Output:**
```json
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
```

### Example 2: Without Actions
```typescript
const response = {
    text: "Фокус-режим включён на 60 минут."
};

renderTelegramMessage(response);
```

**Output:**
```json
{
    "text": "Фокус-режим включён на 60 минут."
}
```

## 🔐 Архитектурные гарантии

- ✅ **Contract-driven**: Все кнопки из `mg_ux_components_map.json`
- ✅ **Fail-fast**: Action not found → throw (contract violation)
- ✅ **UX limits**: Max 2 buttons/row, max 3 rows
- ✅ **No SDK**: Platform-agnostic types only
- ✅ **Deterministic**: Same input → same output

## ❌ Что НЕ делает

- ❌ Не использует Telegram SDK
- ❌ Не отправляет сообщения
- ❌ Не содержит бизнес-логику
- ❌ Не резолвит интенты
- ❌ Не изобретает UX (hardcoded buttons)

## ✅ Что делает

- ✅ Рендерит text (pass-through)
- ✅ Резолвит actions → buttons (via contract)
- ✅ Строит keyboard layout (UX limits)
- ✅ Возвращает Telegram-совместимый JSON

## 🧪 Integration

```typescript
// In Telegram bot handler:
import { renderTelegramMessage } from '@/mg-chat/telegram';

async function sendResponse(chatId: number, response: MGChatResponse) {
    const rendered = renderTelegramMessage(response);
    
    // Send via Telegram SDK
    await bot.sendMessage(chatId, rendered.text, {
        reply_markup: rendered.reply_markup
    });
}
```

## 🚀 Готово к Step 6

Telegram UX Renderer готов для интеграции с Action Dispatcher.
