# MatrixGin AI Configuration

Эта папка содержит **неизменяемые конфигурационные файлы** для AI Core системы MatrixGin.

## 📁 Структура

```
ai/
├── constitution.md      # 12 Immutable Rules (L0)
├── system_prompt.md     # System Prompt для LLM агентов
├── agent_card.json      # Machine-readable Agent Card
├── config.loader.ts     # TypeScript loader для конфигов
└── README.md            # Этот файл
```

---

## 📄 Файлы

### `constitution.md`
**Назначение**: Неизменяемые законы системы (12 правил)  
**Использование**: Проверка AI Orchestrator перед каждым действием  
**Приоритет**: L0 (высший)

### `system_prompt.md`
**Назначение**: System Prompt для LLM агентов (Gemini, Claude, GPT)  
**Использование**: Инициализация AI агентов  
**Формат**: Plain text (markdown)

### `agent_card.json`
**Назначение**: Machine-readable конфигурация MatrixGin  
**Использование**: Программная проверка permissions, behavior, failure modes  
**Формат**: JSON

---

## 🔒 Immutability

**Эти файлы НЕ ДОЛЖНЫ изменяться кодом.**

Изменения допустимы только:
- Через Учредителя / Конституционную процедуру
- Вручную (не программно)
- С полным аудитом

---

## 🚀 Использование

### TypeScript

```typescript
import { loadAIConfig } from './config/ai/config.loader';

const aiConfig = await loadAIConfig();

// Проверка разрешений
if (!aiConfig.permissions.allowed.includes('analyze_data')) {
  throw new Error('Action not permitted by Constitution');
}

// Загрузка system prompt
const systemPrompt = aiConfig.systemPrompt;
```

### AI Orchestrator

```typescript
import { validateAction } from './services/ai-orchestrator.service';

// Перед каждым AI действием
const isAllowed = await validateAction({
  action: 'recommend_task_assignment',
  context: { ... }
});

if (!isAllowed) {
  // Escalate or reject
}
```

---

## 📚 Связанные документы

- `documentation/MatrixGin/MATRIXGIN — ОСНОВОПОЛАГАЮЩИЙ ДОКУМЕНТ (L0).md`
- `documentation/MatrixGin/🤖 MATRIXGIN — AGENT CARD v1.0.md`
- `documentation/AI/Matrix Gin Rules Dsl V1 Specification.md`

---

## ⚠️ ВАЖНО

**НЕ ИЗМЕНЯЙТЕ ЭТИ ФАЙЛЫ БЕЗ АВТОРИЗАЦИИ**

Любое изменение должно быть:
1. Одобрено Учредителем
2. Задокументировано
3. Залогировано в `ai_audit` таблице
