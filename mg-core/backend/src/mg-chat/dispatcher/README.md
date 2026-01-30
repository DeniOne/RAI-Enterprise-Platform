# MG Chat Action Dispatcher

## 📁 Структура

```
backend/src/mg-chat/dispatcher/
├── dispatcher.types.ts      ✅ Platform-agnostic types
├── action-dispatcher.ts     ✅ Pure dispatcher logic
└── index.ts                 ✅ Public API
```

## 🎯 Публичный API

```typescript
import { dispatchAction } from '@/mg-chat/dispatcher';

// Example 1: Direct intent
const result1 = dispatchAction("my_tasks");
// → { status: "ok", intent: "my_tasks", source: "action_dispatcher" }

// Example 2: Unknown action
const result2 = dispatchAction("invalid_action");
// → { status: "error", error_code: "UNKNOWN_ACTION" }

// Example 3: Missing action
const result3 = dispatchAction("");
// → { status: "error", error_code: "MISSING_ACTION" }
```

## 🧠 Архитектура

### Почему Action Dispatcher?

**Проблема:**
- Telegram отправляет `callback_data` (строка)
- Нужно преобразовать в `intent_id` для дальнейшей обработки
- Нельзя хардкодить маппинг (contract-driven)

**Решение:**
- Action Dispatcher = чистая функция маппинга
- Источник истины = JSON контракты
- Детерминированное поведение
- Без side effects

### Алгоритм

```
1. Validate input (empty → MISSING_ACTION)
   ↓
2. Check if action_id is direct intent
   (exists in mg_intent_map.json)
   ↓
3. Check if action_id is component reference
   (exists in mg_ux_components_map.json)
   ↓
4. Check if action_id is error intent
   (exists in error_ux_map.json)
   ↓
5. Not found → UNKNOWN_ACTION
```

### Почему такая логика?

**1. Direct Intent Check**
```typescript
// WHY: Большинство action_id = intent_id
// Example: "my_tasks", "focus_mode", "my_shifts"
const isDirectIntent = contracts.intents.intents.some(
    intent => intent.id === actionId
);
```

**2. Component Check**
```typescript
// WHY: Некоторые кнопки могут ссылаться на компоненты (навигация)
// Example: "main_entry" → показать главное меню
const componentExists = Object.keys(contracts.ux.components).includes(actionId);
```

**3. Error Intent Check**
```typescript
// WHY: Error intents тоже могут быть триггерами действий
// Example: "unknown_intent" → показать fallback UX
const isErrorIntent = contracts.errors.error_intents.some(
    err => err.id === actionId
);
```

## 🔄 Integration Flow

```typescript
// In Telegram bot callback handler:
import { dispatchAction } from '@/mg-chat/dispatcher';
import { resolveIntent } from '@/mg-chat/intent';

async function handleCallback(callbackData: string) {
    // 1. Dispatch action → intent
    const dispatchResult = dispatchAction(callbackData);
    
    if (dispatchResult.status === 'error') {
        // Handle error (unknown action)
        return handleUnknownAction(dispatchResult.error_code);
    }
    
    // 2. Resolve intent → response
    const intentResult = resolveIntent(dispatchResult.intent);
    
    // 3. Render response → Telegram
    // ... (Steps 4-5)
}
```

## ✅ Примеры

### Example 1: Successful Dispatch (Direct Intent)
```typescript
const result = dispatchAction("my_tasks");

// Result:
{
    status: "ok",
    intent: "my_tasks",
    source: "action_dispatcher"
}

// WHY: "my_tasks" exists in mg_intent_map.json
```

### Example 2: Successful Dispatch (Component)
```typescript
const result = dispatchAction("main_entry");

// Result:
{
    status: "ok",
    intent: "main_entry",
    source: "action_dispatcher"
}

// WHY: "main_entry" exists in mg_ux_components_map.json
```

### Example 3: Unknown Action
```typescript
const result = dispatchAction("non_existent_action");

// Result:
{
    status: "error",
    error_code: "UNKNOWN_ACTION"
}

// WHY: Action not found in any contract
// NEXT: Error UX Interceptor handles this
```

### Example 4: Missing Action
```typescript
const result = dispatchAction("");

// Result:
{
    status: "error",
    error_code: "MISSING_ACTION"
}

// WHY: Empty input is invalid
```

## 🔐 Архитектурные гарантии

- ✅ **Pure function**: Нет side effects
- ✅ **Deterministic**: Same input → same output
- ✅ **Contract-driven**: Единственный источник истины = JSON
- ✅ **Platform-agnostic**: Нет Telegram SDK
- ✅ **Testable**: Unit-тесты без окружения

## ❌ Что НЕ делает

- ❌ Не выполняет действия
- ❌ Не мутирует данные
- ❌ Не вызывает сервисы
- ❌ Не содержит бизнес-логику
- ❌ Не знает про Telegram API
- ❌ Не строит UX ответы

## ✅ Что делает

- ✅ Валидирует input
- ✅ Проверяет существование в контрактах
- ✅ Возвращает intent_id или error
- ✅ Детерминированное поведение

## 🧪 Unit Testing

```typescript
describe('dispatchAction', () => {
    it('should dispatch direct intent', () => {
        const result = dispatchAction('my_tasks');
        expect(result.status).toBe('ok');
        expect(result.intent).toBe('my_tasks');
    });

    it('should return error for unknown action', () => {
        const result = dispatchAction('invalid');
        expect(result.status).toBe('error');
        expect(result.error_code).toBe('UNKNOWN_ACTION');
    });

    it('should return error for empty action', () => {
        const result = dispatchAction('');
        expect(result.status).toBe('error');
        expect(result.error_code).toBe('MISSING_ACTION');
    });
});
```

## 🚀 Готово к финальной интеграции

Action Dispatcher готов для интеграции в полный MG Chat pipeline.
