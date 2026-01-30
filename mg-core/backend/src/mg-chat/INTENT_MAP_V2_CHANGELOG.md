# MG Chat: Intent Map v2 — FROZEN

## Статус: ✅ ПРИНЯТО

**Версия:** 2.0.0  
**Дата:** 2026-01-16  
**Файл:** `documentation/ai/mg-chat/mg_intent_map.json`

## Что изменилось

### v1 → v2

**Структурные изменения:**
- ✅ Добавлены management namespaces: `employee.*`, `manager.*`, `exec.*`
- ✅ Добавлены поля: `contour`, `scope`, `entry_points`, `confidence_threshold`
- ✅ Обновлена структура `response` для совместимости с Scenario Router
- ✅ Удалены устаревшие поля: `category`, `data_sources`, `template`

**Количество интентов:**
- v1: 25 интентов (без namespaces)
- v2: 14 интентов (с namespaces)

**Архитектурные гарантии:**
- ✅ MG Chat Core НЕ МЕНЯЕТСЯ
- ✅ Один движок для всех contours
- ✅ Namespace = техническая структура
- ✅ Access Control — вне Core

## Namespaces

### 🟢 Employee (`employee.*`)
**Contour:** Execution  
**Scope:** `self`  
**Интенты:** 5
- `employee.show_my_schedule`
- `employee.show_my_tasks`
- `employee.show_my_kpi`
- `employee.explain_status`
- `employee.guide_next_step`

### 🔵 Manager (`manager.*`)
**Contour:** Tactical Control  
**Scope:** `own_unit`  
**Интенты:** 5
- `manager.show_shift_status`
- `manager.show_team_overview`
- `manager.show_absences`
- `manager.resolve_incident`
- `manager.manage_shift_reassign`

### 🟣 Executive (`exec.*`)
**Contour:** Signal / Navigate  
**Scope:** `global`  
**Интенты:** 4
- `exec.show_system_health`
- `exec.show_kpi_summary`
- `exec.explain_risk`
- `exec.navigate_dashboard`

## Совместимость

**Компоненты, которые НЕ требуют изменений:**
- ✅ Contract Loader (загружает как есть)
- ✅ Intent Resolver (работает с `id` и `examples`)
- ✅ Error UX Interceptor (не зависит от интентов)
- ✅ Telegram UX Renderer (работает с `response`)
- ✅ Action Dispatcher (работает с `actions`)

**Компоненты, которые используют новые поля:**
- ✅ Scenario Router (использует namespace для routing)
- 🔜 Access Control (будет использовать `contour` и `scope`)

## Git

```bash
commit de1588c
Author: DeniOne
Date: 2026-01-16

MG Chat: intent map v2 with management namespaces (employee/manager/exec)

1 file changed, 259 insertions(+), 257 deletions(-)
```

## Следующие шаги

1. ✅ Контракт заменён
2. 🔜 Прогнать линтер
3. 🔜 Протестировать с test-local.js
4. 🔜 Создать Access Control mapping

---

**Контракт FROZEN. Дальнейшие изменения только через версионирование.**
