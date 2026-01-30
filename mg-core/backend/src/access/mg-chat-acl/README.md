# ACL Mapping Layer для MG Chat

**Backend policy layer для контроля доступа к intents.**

---

## Purpose

### Зачем ACL существует

ACL Mapping Layer определяет, **какие intents в каком управленческом контуре имеют право вызывать backend-ресурсы**.

### Почему ACL вне MG Chat Core

**MG Chat Core** — это deterministic, contract-driven движок, который:
- НЕ знает ролей
- НЕ проверяет доступ
- НЕ содержит бизнес-логику авторизации

**ACL** — это backend policy layer, который:
- Живёт **вне Core**
- Проверяет доступ **до** выполнения сценария
- Работает по **контурам** (contours), не по ролям
- Полностью **декларативный** и **детерминированный**

**Принцип разделения:**
```
MG Chat исполняет intent.
ACL разрешает intent.
Backend действует.
```

---

## Concepts

### Intent
Fully-qualified строка, описывающая намерение пользователя:
- `employee.show_my_tasks`
- `manager.show_shift_status`
- `exec.show_kpi_summary`

### Contour (Управленческий контур)
Уровень управления в организации:
- `employee` — сотрудник
- `manager` — менеджер
- `exec` — руководитель

### Scope (Область доступа)
Зона ответственности:
- `self` — только свои данные
- `own_unit` — своё подразделение
- `global` — вся организация

### Policy
Декларативная карта правил доступа по контурам.

---

## How it works

### Lifecycle одного intent

```
1. Telegram / HTTP
   ↓
2. MG Chat Core
   ↓
3. Intent resolved (string)
   ↓
4. ACL Middleware  ✅ ПРОВЕРКА ЗДЕСЬ
   ↓
5. Scenario Execution
   ↓
6. Backend services
```

### Точка в пайплайне

**ACL вызывается:**
- ✅ **После** Intent Resolution
- ✅ **До** Scenario Execution
- ✅ **До** любых backend API вызовов

**ACL НЕ вызывается:**
- ❌ Внутри MG Chat Core
- ❌ В Intent Resolver
- ❌ В Scenario Router
- ❌ В Telegram Glue

---

## Policy structure

### Формат policy map

```typescript
export const MG_CHAT_ACL_POLICY: ACLPolicy = {
  employee: [
    {
      intent: "employee.*",
      allowedScopes: ["self"]
    }
  ],

  manager: [
    {
      intent: "manager.*",
      allowedScopes: ["own_unit"]
    },
    {
      intent: "employee.*",
      allowedScopes: ["self"]
    }
  ],

  exec: [
    {
      intent: "exec.*",
      allowedScopes: ["global"]
    },
    {
      intent: "manager.show_team_overview",
      allowedScopes: ["own_unit"]
    }
  ]
};
```

### Как читать policy map

1. **Контур** — ключ верхнего уровня (`employee`, `manager`, `exec`)
2. **Правила** — массив объектов `{ intent, allowedScopes }`
3. **Intent** — exact match (`manager.show_team_overview`) или namespace wildcard (`manager.*`)
4. **Allowed scopes** — массив разрешённых областей доступа

### Порядок обработки

1. **Exact match** — точное совпадение intent
2. **Namespace match** — wildcard паттерн (`employee.*`)
3. **Не найдено** — `FORBIDDEN`

### Wildcard правила

**НЕ regex, НЕ glob, ТОЛЬКО namespace prefix match:**

```typescript
"employee.*" → matches "employee.show_my_tasks"
"employee.*" → matches "employee.request_time_off"
"employee.*" → NOT matches "employeeX.foo"
```

---

## Как добавлять новые intents

### Шаг 1: Определить intent в `mg_intent_map.json`

```json
{
  "intent": "manager.approve_timesheet",
  "contour": "manager",
  "scope": "own_unit",
  ...
}
```

### Шаг 2: Добавить правило в `acl.policy.ts`

**Если intent покрывается wildcard:**
```typescript
manager: [
  {
    intent: "manager.*",  // уже покрывает manager.approve_timesheet
    allowedScopes: ["own_unit"]
  }
]
```

**Если нужно специфичное правило:**
```typescript
manager: [
  {
    intent: "manager.approve_timesheet",  // exact match
    allowedScopes: ["own_unit", "global"]  // специфичные scope
  },
  {
    intent: "manager.*",
    allowedScopes: ["own_unit"]
  }
]
```

**Порядок важен:** exact match должен быть **перед** wildcard.

---

## Как добавлять новый контур

### Шаг 1: Обновить тип `ManagementContour` в `acl.types.ts`

```typescript
export type ManagementContour = "employee" | "manager" | "exec" | "director";
```

### Шаг 2: Добавить правила в `acl.policy.ts`

```typescript
export const MG_CHAT_ACL_POLICY: ACLPolicy = {
  // ... existing contours

  director: [
    {
      intent: "director.*",
      allowedScopes: ["global"]
    },
    {
      intent: "exec.*",
      allowedScopes: ["global"]
    }
  ]
};
```

### Шаг 3: Обновить тесты в `acl.test.ts`

```typescript
test("director + director.strategic_planning + global → allowed", () => {
  const context: AccessContext = {
    userId: "user4",
    roles: ["DIRECTOR"],
    contour: "director",
    scope: "global"
  };

  const decision = resolveACL("director.strategic_planning", context);

  expect(decision).toEqual({ allowed: true });
});
```

**Рефакторинг НЕ требуется** — достаточно обновить типы и policy.

---

## Non-goals

### ACL ≠ RBAC

ACL работает по **контурам** (contours), не по ролям (roles).

Роли присутствуют в `AccessContext.roles`, но **не используются** в логике ACL (future-proof).

### ACL ≠ бизнес-логика

ACL **не содержит** бизнес-правил:
- ❌ Проверка статусов
- ❌ Проверка владельца ресурса
- ❌ Проверка временных ограничений

ACL проверяет **только** соответствие `intent + contour + scope`.

### ACL ≠ UX

ACL **не форматирует** ответы:
- ❌ Не строит UX-сообщения
- ❌ Не возвращает JSON для Telegram

ACL бросает **доменные ошибки**:
- `ACLForbiddenError`
- `ACLOutOfScopeError`

Ошибки ловятся **выше** и уходят в **Error UX Interceptor**.

---

## Usage Example

```typescript
import { aclMiddleware } from "./acl.middleware";
import { AccessContext } from "./acl.types";

// После Intent Resolution
const intent = "manager.show_shift_status";

const accessContext: AccessContext = {
  userId: "user123",
  roles: ["MANAGER"],
  contour: "manager",
  scope: "own_unit"
};

try {
  // ACL check
  aclMiddleware({ intent, accessContext });

  // allowed === true → продолжаем выполнение сценария
  executeScenario(intent);

} catch (error) {
  // allowed === false → ошибка уходит в Error UX Interceptor
  handleACLError(error);
}
```

---

## Testing

Запуск тестов:

```bash
npm test acl.test.ts
```

Тесты **не требуют окружения** — `resolveACL` это pure function.

---

## Architecture Guarantees

✅ **MG Chat Core не изменён**  
✅ **Один intent → один ACL check**  
✅ **Поведение меняется ТОЛЬКО при правке policy**  
✅ **Добавление роли/контура без рефакторинга**  
✅ **Unit-тестируемо без окружения**

---

## Финальный якорь

> **MG Chat исполняет.**  
> **ACL разрешает.**  
> **Backend действует.**
