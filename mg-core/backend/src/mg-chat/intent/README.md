# MG Chat Intent Resolver

## 📁 Структура

```
backend/src/mg-chat/intent/
├── intent.types.ts         ✅ Strict types (no magic fields)
├── intent-matcher.ts       ✅ Deterministic matcher (Jaccard + substring)
├── intent-resolver.ts      ✅ Resolver with confidence threshold
└── index.ts                ✅ Public API
```

## 🎯 Публичный API

```typescript
import { resolveIntent } from '@/mg-chat/intent';

const result = resolveIntent("что у меня сегодня");

if (result.resolved) {
    console.log(result.intent.intentId);      // "get_my_day"
    console.log(result.intent.confidence);    // 0.92
    console.log(result.intent.matchedExample); // "что у меня сегодня"
} else {
    console.log(result.reason); // "LOW_CONFIDENCE" | "NO_MATCH"
}
```

## 🧠 Алгоритм

### 1. Нормализация
```typescript
"Что У Меня   Сегодня?" → "что у меня сегодня"
```

### 2. Token Overlap (Jaccard Similarity)
```typescript
message:  ["что", "у", "меня", "сегодня"]
example:  ["что", "у", "меня", "сегодня"]
intersection: 4
union: 4
score: 4/4 = 1.0
```

### 3. Substring Bonus
```typescript
if (message.includes(example) || example.includes(message)) {
    score += 0.2 (capped at 1.0)
}
```

### 4. Confidence Threshold
```typescript
const CONFIDENCE_THRESHOLD = 0.6;

if (score < 0.6) → { resolved: false, reason: "LOW_CONFIDENCE" }
```

## ✅ Примеры

| Input | Intent ID | Confidence | Resolved |
|-------|-----------|------------|----------|
| "что у меня сегодня" | `get_my_day` | 1.0 | ✅ |
| "мой день" | `get_my_day` | 1.0 | ✅ |
| "мои задачи" | `my_tasks` | 1.0 | ✅ |
| "покажи что-нибудь" | - | 0.3 | ❌ LOW_CONFIDENCE |
| "ээээ" | - | 0.0 | ❌ NO_MATCH |

## 🔐 Архитектурные гарантии

- ✅ **Детерминистичность**: Одинаковый input → одинаковый output
- ✅ **Без side effects**: Чистая функция
- ✅ **Без бизнес-логики**: Только классификация
- ✅ **Без внешних API**: Нет LLM, нет сети
- ✅ **Fail-safe**: Никогда не бросает исключения

## ❌ Что НЕ делает

- ❌ Не читает БД
- ❌ Не вызывает LLM
- ❌ Не логирует аналитику
- ❌ Не изменяет состояние
- ❌ Не содержит hardcoded intents

## ✅ Что делает

- ✅ Нормализует текст
- ✅ Сравнивает с примерами из контрактов
- ✅ Вычисляет similarity score
- ✅ Применяет confidence threshold
- ✅ Возвращает intent_id или reason

## 🧪 Интеграция

```typescript
// В Telegram bot handler:
import { resolveIntent } from '@/mg-chat/intent';

async function handleMessage(message: string) {
    const result = resolveIntent(message);
    
    if (!result.resolved) {
        // Fallback to unknown_intent
        return handleUnknownIntent(result.reason);
    }
    
    // Route to intent handler
    return handleIntent(result.intent.intentId);
}
```

## 🚀 Готово к Step 3

Intent Resolver готов для интеграции с Error UX Interceptor.
