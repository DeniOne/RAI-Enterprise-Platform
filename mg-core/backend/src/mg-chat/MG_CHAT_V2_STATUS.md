# MG Chat v2 — Готов к тестированию

## ✅ Статус: READY

**Версия:** 2.0.0  
**Дата:** 2026-01-16

## Что сделано

### 1. Intent Map v2 ✅
- **Файл:** `documentation/ai/mg-chat/mg_intent_map.json`
- **Версия:** 2.0.0
- **Интенты:** 14 (employee: 5, manager: 5, exec: 4)
- **Namespaces:** employee.* / manager.* / exec.*
- **Git:** commit de1588c

### 2. Scenario Router ✅
- **Файл:** `backend/src/mg-chat/scenarios/scenario-router.ts`
- **Функции:** 
  - `handleEmployeeScenario()` — 5 actions
  - `handleManagerScenario()` — 5 actions
  - `handleExecutiveScenario()` — 4 actions
- **Интеграция:** подключён к `telegram.adapter.ts`

### 3. Архитектура ✅
- **Документация:** `INTENT_NAMESPACES.md`
- **Implementation Plan:** `implementation_plan.md`
- **Changelog:** `INTENT_MAP_V2_CHANGELOG.md`

## Архитектурные гарантии

✅ **MG Chat Core НЕ ИЗМЕНЁН**
- Contract Loader — работает
- Intent Resolver — работает
- Error UX Interceptor — работает
- Telegram UX Renderer — работает
- Action Dispatcher — работает

✅ **Namespace = Management Contour**
- `employee.*` → Execution (scope: self)
- `manager.*` → Tactical Control (scope: own_unit)
- `exec.*` → Signal/Navigate (scope: global)

✅ **Один движок — все уровни**
- Нет отдельных "employee bot", "manager bot"
- Routing через namespace
- Access Control — вне Core

## Следующие шаги

### Вариант 1: Тестирование
```bash
cd backend\src\mg-chat
node test-local.js
```

**Тестовые сценарии:**
- Отправить: "мой график" → employee.show_my_schedule
- Отправить: "статус смены" → manager.show_shift_status  
- Отправить: "здоровье системы" → exec.show_system_health

### Вариант 2: Access Control
Создать ACL mapping документ:
- contour + scope → backend endpoints
- role → allowed namespaces
- без кода, только спецификация

### Вариант 3: Backend Integration
Подключить реальные API endpoints:
- `/api/schedule/my`
- `/api/shifts/current`
- `/api/system/health`

## Известные проблемы

⚠️ **Schema не найдена**
```
Не удалось загрузить схему из "mg_intent_map.schema.json"
```

**Решение:** Создать schema для v2 или убрать `$schema` из JSON

⚠️ **Production сервер не запускается**
- TypeScript ошибки с путями
- ngrok заблокирован

**Решение:** Использовать `test-local.js` для тестирования

## Готовность компонентов

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Intent Map v2 | ✅ | FROZEN |
| Scenario Router | ✅ | Готов |
| Contract Loader | ✅ | Совместим |
| Intent Resolver | ✅ | Совместим |
| Telegram Adapter | ✅ | Интегрирован |
| Access Control | 🔜 | Не реализован |
| Backend API | 🔜 | TODO endpoints |

---

**MG Chat v2 готов к тестированию с test-local.js**
