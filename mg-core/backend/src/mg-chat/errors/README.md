# MG Chat Error UX Interceptor

## 📁 Структура

```
backend/src/mg-chat/errors/
├── error.types.ts          ✅ Strict types
├── error-detector.ts       ✅ Deterministic heuristics
├── error-router.ts         ✅ Contract-based routing
└── index.ts                ✅ Public API
```

## 🎯 Публичный API

```typescript
import { detectError, ErrorContext } from '@/mg-chat/errors';

// Example 1: Empty message
const result1 = detectError("", {});
// → { matched: true, match: { errorId: "empty_message", severity: "low", text: "...", actions: [...] } }

// Example 2: Aggression
const result2 = detectError("ты тупой бот", {});
// → { matched: true, match: { errorId: "aggression_detected", severity: "high", ... } }

// Example 3: Normal message (no error)
const result3 = detectError("что у меня сегодня", {});
// → { matched: false }
```

## 🧠 Детекторы (v1)

| Error ID | Detection Logic | Severity |
|----------|----------------|----------|
| `empty_message` | `message.trim().length === 0` | low |
| `spam_repetition` | Same message ≥ 3 times (session) | medium |
| `flooding` | Messages per minute > 5 | medium |
| `aggression_detected` | Profanity wordlist match | high |
| `emotional_overload` | Phrases: "не вывожу", "устал", etc. | high |

## 🔄 Interception Flow

```typescript
// In message handler:
import { detectError } from '@/mg-chat/errors';
import { resolveIntent } from '@/mg-chat/intent';

async function handleMessage(message: string, context: ErrorContext) {
    // 1. Error interception (BEFORE intent resolution)
    const errorResult = detectError(message, context);
    
    if (errorResult.matched) {
        // Return error UX response (STOP here)
        return {
            text: errorResult.match.text,
            actions: errorResult.match.actions
        };
    }
    
    // 2. Normal intent resolution
    const intentResult = resolveIntent(message);
    
    if (!intentResult.resolved) {
        // Fallback to unknown_intent
        return handleUnknownIntent();
    }
    
    // 3. Route to intent handler
    return handleIntent(intentResult.intent.intentId);
}
```

## 🔐 Архитектурные гарантии

- ✅ **Pre-intent**: Errors handled BEFORE intent resolution
- ✅ **Contract-driven**: All responses from `error_ux_map.json`
- ✅ **Deterministic**: Same input → same output
- ✅ **Fail-safe**: Never throws (except missing contract error)
- ✅ **No side effects**: Pure detection logic

## ❌ Что НЕ делает

- ❌ Не использует ML/AI
- ❌ Не обращается к БД
- ❌ Не логирует аналитику
- ❌ Не персистит состояние
- ❌ Не модерирует/наказывает пользователей

## ✅ Что делает

- ✅ Детектирует аномальные входы
- ✅ Маппит error ID → UX response
- ✅ Предотвращает эскалацию конфликтов
- ✅ Обеспечивает de-escalation first

## 🧪 Session Context

```typescript
interface ErrorContext {
    recentMessages?: string[];      // Last N messages
    messageTimestamps?: number[];   // Last N timestamps
}

// Example usage:
const context: ErrorContext = {
    recentMessages: ["привет", "привет", "привет"], // spam detection
    messageTimestamps: [Date.now() - 1000, Date.now() - 500, Date.now()] // flood detection
};
```

## 🚀 Готово к Step 4

Error UX Interceptor готов для интеграции с Response Builder.
