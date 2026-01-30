# Telegram Integration Glue

## 📁 Структура

```
backend/src/mg-chat/integration/
├── telegram.types.ts       ✅ Telegram-specific types
├── telegram.normalizer.ts  ✅ Update → Core DTO
├── telegram.adapter.ts     ✅ Pipeline orchestration
├── telegram.sender.ts      ✅ HTTP transport
├── telegram.webhook.ts     ✅ Webhook entry point
└── index.ts                ✅ Public API
```

## 🎯 Назначение

**Glue Layer = Adapter, NOT Logic**

Этот слой существует ТОЛЬКО для связи Telegram с MG Chat Core.

### Что это НЕ

- ❌ НЕ бизнес-логика
- ❌ НЕ принятие решений
- ❌ НЕ обработка ошибок (это делает Core)
- ❌ НЕ генерация текстов
- ❌ НЕ валидация смысла

### Что это ЕСТЬ

- ✅ Нормализация входов
- ✅ Маршрутизация по типу (text/callback)
- ✅ Вызов Core pipeline
- ✅ HTTP транспорт в Telegram

## 🧠 Архитектура

### Почему Glue Layer?

**Проблема:**
- Core не должен знать про Telegram
- Telegram не понимает Core DTOs
- Нужен переводчик

**Решение:**
- Glue = тонкий adapter слой
- Легко заменить Telegram на другую платформу
- Core остаётся platform-agnostic

### Поток данных

```
┌─────────────────────────────────────────────────────────┐
│                    TEXT MESSAGE FLOW                     │
└─────────────────────────────────────────────────────────┘

Telegram Webhook
    ↓
telegram.normalizer (Telegram Update → NormalizedTextInput)
    ↓
telegram.adapter.processTextMessage()
    ├─→ Error UX Interceptor (Core)
    ├─→ Intent Resolver (Core)
    └─→ Telegram UX Renderer (Core)
    ↓
telegram.sender.sendMessage()
    ↓
Telegram API

┌─────────────────────────────────────────────────────────┐
│                   CALLBACK QUERY FLOW                    │
└─────────────────────────────────────────────────────────┘

Telegram Webhook
    ↓
telegram.normalizer (Telegram Update → NormalizedCallbackInput)
    ↓
telegram.adapter.processCallback()
    ├─→ Action Dispatcher (Core)
    ├─→ Intent Resolver (Core)
    └─→ Telegram UX Renderer (Core)
    ↓
telegram.sender.answerCallbackQuery()
telegram.sender.editMessage()
    ↓
Telegram API
```

## 📦 Компоненты

### 1. telegram.types.ts

**Назначение:** Telegram-specific типы

**Почему здесь:**
- Core не должен импортировать Telegram типы
- Изоляция platform-specific деталей

```typescript
export interface TelegramUpdate { ... }
export interface NormalizedInput { ... }
```

### 2. telegram.normalizer.ts

**Назначение:** Преобразование Telegram Update → Core DTO

**Почему здесь:**
- Telegram отправляет сложные nested объекты
- Core ожидает простые, плоские DTOs
- Sanitization (trim whitespace)

```typescript
export function normalizeUpdate(update: TelegramUpdate): NormalizedInput | null
```

**Правила:**
- ❌ NO business logic
- ✅ ONLY data transformation
- ✅ Trim whitespace
- ✅ Extract required fields

### 3. telegram.adapter.ts

**Назначение:** Orchestration Core pipeline

**Почему здесь:**
- Enforces correct pipeline order
- Разные flows для text/callback
- NO skipping steps

```typescript
export function processTextMessage(text: string): TelegramRenderedMessage
export function processCallback(actionId: string): TelegramRenderedMessage
```

**Правила:**
- ❌ NO decision making
- ✅ ONLY call Core functions in order
- ✅ Enforce full pipeline

### 4. telegram.sender.ts

**Назначение:** HTTP transport to Telegram API

**Почему здесь:**
- Core returns platform-agnostic TelegramRenderedMessage
- This layer sends it via HTTP
- Decouples Core from Telegram API

```typescript
export async function sendMessage(chatId: number, rendered: TelegramRenderedMessage)
export async function editMessage(chatId: number, messageId: number, rendered: TelegramRenderedMessage)
export async function answerCallbackQuery(callbackQueryId: string)
```

**Правила:**
- ❌ NO business logic
- ✅ ONLY HTTP calls
- ✅ Log errors, don't propagate to Core

### 5. telegram.webhook.ts

**Назначение:** Webhook entry point

**Почему здесь:**
- Single entry point for all Telegram updates
- Routes to appropriate pipeline
- Always returns HTTP 200

```typescript
export async function handleTelegramWebhook(req: Request, res: Response)
```

**Правила:**
- ❌ NO business logic
- ✅ ONLY routing
- ✅ Always return 200 (prevent Telegram retries)

## ✅ Критерии приёмки (выполнены)

- ✅ Core не импортирует Telegram
- ✅ Glue не содержит бизнес-логики
- ✅ Любой update проходит полный pipeline
- ✅ Callback → Action Dispatcher → Core
- ✅ Легко заменить Telegram на другую платформу
- ✅ Glue можно удалить без влияния на Core

## 🔌 Integration

### Express Route Setup

```typescript
import express from 'express';
import { handleTelegramWebhook } from '@/mg-chat/integration';

const app = express();

app.post('/webhook/telegram', handleTelegramWebhook);

app.listen(3000);
```

### Environment Variables

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## 🧪 Testing

### Unit Tests (Glue Layer)

```typescript
describe('telegram.normalizer', () => {
    it('should normalize text message', () => {
        const update = { message: { text: '  hello  ', ... } };
        const normalized = normalizeUpdate(update);
        expect(normalized.text).toBe('hello'); // trimmed
    });
});
```

### Integration Tests (Full Flow)

```typescript
describe('Telegram Webhook', () => {
    it('should process text message end-to-end', async () => {
        const update = { message: { text: 'что у меня сегодня', ... } };
        await handleTelegramWebhook(mockReq(update), mockRes);
        // Verify sendMessage called with correct payload
    });
});
```

## 🚀 Готово к деплою

Telegram Integration Glue полностью реализован и готов к интеграции с Express/Fastify.
