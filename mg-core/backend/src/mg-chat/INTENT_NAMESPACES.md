# Intent Namespaces Architecture

## Концепция

**Management Contour = Intent Namespace**

Это НЕ философия, это **техническая структура**.

## Три пространства

### 🟢 Employee Namespace (`employee.*`)

**Контур:** Execution  
**Смысл:** Только "я", без агрегаций, без управления

**Примеры интентов:**
- `employee.show_my_schedule` — мой график
- `employee.show_my_tasks` — мои задачи
- `employee.show_my_kpi` — мои показатели
- `employee.explain_status` — объясни мой статус
- `employee.guide_next_step` — что делать дальше

**Характеристики:**
- Только личные данные пользователя
- Нет агрегаций
- Нет управленческих действий
- Простые ответы

---

### 🔵 Manager Namespace (`manager.*`)

**Контур:** Tactical Control  
**Смысл:** Моя зона ответственности, агрегаты, регламентные действия

**Примеры интентов:**
- `manager.show_shift_status` — статус смены
- `manager.show_team_overview` — обзор команды
- `manager.show_absences` — отсутствия
- `manager.resolve_incident` — решить инцидент
- `manager.manage_shift_reassign` — переназначить смену

**Характеристики:**
- Агрегированные данные команды
- Управленческие действия
- Регламентные процессы
- Тактические решения

---

### 🟣 Executive Namespace (`exec.*`)

**Контур:** Signal / Navigate  
**Смысл:** Сигналы, отклонения, навигация, БЕЗ действий

**Примеры интентов:**
- `exec.show_system_health` — здоровье системы
- `exec.show_kpi_summary` — сводка KPI
- `exec.explain_risk` — объяснить риск
- `exec.navigate_dashboard` — навигация по дашборду

**Характеристики:**
- Только сигналы и метрики
- Никаких действий
- Навигация между представлениями
- Стратегический обзор

---

## Архитектурные гарантии

### ✅ MG Chat Core НЕ ЗНАЕТ про namespaces

Core просто:
1. Резолвит интент
2. Передаёт в Scenario Router
3. Рендерит ответ

### ✅ Namespace = техническая структура

```
employee.show_my_schedule
   ↑         ↑
namespace  action
```

### ✅ Один движок — все уровни

Нет отдельных "employee bot", "manager bot", "exec bot".

Один MG Chat обрабатывает все namespaces.

### ✅ Access Control — вне Core

```typescript
// Integration Layer (НЕ Core)
const SCOPES = {
  'employee.*': ['EMPLOYEE', 'MANAGER', 'EXECUTIVE'],
  'manager.*': ['MANAGER', 'EXECUTIVE'],
  'exec.*': ['EXECUTIVE']
};
```

---

## Пример: "Статус смены"

### Сотрудник пишет: "статус смены"

```
Intent Resolver → "employee.show_my_schedule"
  ↓
Scenario Router → call /api/schedule/my
  ↓
Response: "Твоя смена: 09:00-18:00"
```

### Менеджер пишет: "статус смены"

```
Intent Resolver → "manager.show_shift_status"
  ↓
Scenario Router → call /api/shifts/current
  ↓
Response: "На смене 5 человек, 2 отсутствуют"
```

### Директор пишет: "статус смены"

```
Intent Resolver → "exec.show_system_health"
  ↓
Scenario Router → call /api/system/health
  ↓
Response: "Все смены укомплектованы, нет критических отклонений"
```

---

## Почему это работает

### 1. Telegram = просто транспорт

Telegram не знает про contours.  
Он просто передаёт текст в MG Chat.

### 2. Интент сам знает свой уровень

`manager.show_shift_status` **сам говорит**, что это Manager-уровень.

### 3. Нет if/else по ролям

Нет кода типа:
```typescript
if (user.role === 'MANAGER') {
  // manager logic
}
```

Есть:
```typescript
const namespace = intent.split('.')[0];
routeToScenario(namespace, intent);
```

### 4. Легко масштабировать

Новый contour = новый namespace:
- `analyst.*` — аналитические запросы
- `support.*` — техподдержка
- `audit.*` — аудит

---

## Что НЕ меняется

✅ Contract Loader  
✅ Intent Resolver  
✅ Error UX Interceptor  
✅ Telegram UX Renderer  
✅ Action Dispatcher  
✅ Integration Glue  

**Всё остаётся как есть.**

---

## Что добавляется

### 1. Scenario Router (Step 4)

```typescript
export function routeScenario(intent: ResolvedIntent): MGChatResponse {
  const [namespace, action] = intent.intentId.split('.');
  
  switch (namespace) {
    case 'employee':
      return handleEmployeeScenario(action, intent);
    case 'manager':
      return handleManagerScenario(action, intent);
    case 'exec':
      return handleExecutiveScenario(action, intent);
  }
}
```

### 2. Access Control (Integration Layer)

```typescript
export function checkAccess(intentId: string, userRole: string): boolean {
  const namespace = intentId.split('.')[0];
  const allowedRoles = SCOPES[`${namespace}.*`];
  return allowedRoles.includes(userRole);
}
```

### 3. Namespace интенты в `mg_intent_map.json`

```json
{
  "intents": [
    {
      "id": "employee.show_my_schedule",
      "examples": ["мой график", "моя смена"],
      "response": { ... }
    },
    {
      "id": "manager.show_shift_status",
      "examples": ["статус смены", "кто на смене"],
      "response": { ... }
    },
    {
      "id": "exec.show_system_health",
      "examples": ["здоровье системы", "общий статус"],
      "response": { ... }
    }
  ]
}
```

---

## Итог

**Intent Namespace = Management Contour**

Это превращает философскую концепцию в техническую структуру.

MG Chat Core остаётся чистым.  
Масштабирование становится тривиальным.  
Telegram перестаёт быть проблемой.

**Всё становится очевидным.**
