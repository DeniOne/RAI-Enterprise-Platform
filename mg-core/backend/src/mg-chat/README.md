# MG Chat Contract Loader

## 📁 Структура

```
backend/src/mg-chat/
├── contracts/
│   ├── contract.types.ts       — TypeScript типы (read-only)
│   ├── contract-validator.ts   — AJV + cross-reference validation
│   ├── contract-loader.ts      — Singleton loader
│   └── index.ts                — Public API
└── index.ts                    — Module bootstrap
```

## 🎯 Публичный API

```typescript
import { loadMGChatContracts, initializeMGChat } from '@/mg-chat';

// В main server initialization:
initializeMGChat(); // Throws if contracts invalid

// В runtime:
const contracts = loadMGChatContracts();
console.log(contracts.intents.intents); // Read-only access
```

## ✅ Гарантии

- **Fail-fast**: Любая ошибка контракта → сервис не стартует
- **Idempotent**: Повторные вызовы возвращают кэшированный singleton
- **Read-only**: Все контракты заморожены через `Object.freeze()`
- **Type-safe**: Полная типизация TypeScript

## 🔐 Валидация

1. **JSON Schema** (AJV):
   - `mg_intent_map.json` → `intent.schema.json`
   - `mg_ux_components_map.json` → `ux_components.schema.json`
   - `error_ux_map.json` → `error_ux.schema.json`

2. **Cross-references**:
   - Intent actions → Intent/Component/Error IDs
   - UX component buttons → Valid action IDs
   - Error intent actions → Valid action IDs

## 🚀 Integration Point

Добавьте в `backend/src/server.ts` (или аналогичный entry point):

```typescript
import { initializeMGChat } from './mg-chat';

async function startServer() {
    // ... other initialization ...
    
    // Initialize MG Chat contracts (BEFORE accepting requests)
    initializeMGChat();
    
    // ... start HTTP server ...
}
```

## 🧪 Тестирование

```bash
# Lint contracts (должен быть зелёный)
npm run lint:mg-chat

# Start backend (должен загрузить контракты без ошибок)
cd backend && npm run dev
```

## ❌ Что НЕ делает loader

- ❌ Не генерирует контракты
- ❌ Не добавляет дефолты
- ❌ Не содержит бизнес-логику
- ❌ Не взаимодействует с Telegram API

## ✅ Что делает loader

- ✅ Загружает JSON контракты
- ✅ Валидирует через JSON Schema
- ✅ Проверяет cross-references
- ✅ Экспортирует read-only API
- ✅ Fail-fast при любой ошибке
