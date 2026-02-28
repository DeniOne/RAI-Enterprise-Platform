# RAI_EP — Agent OS Shell + Persistent Memory

**Статус:** `EXECUTION CHECKLIST`  
**Тип:** `Engineering Plan`  
**Основание:** `Agent-First / Chat-First Spec (LAW)`

---

## 0. Цель

Переход от **page-first** интерфейса к **Agent OS Shell**:
- **TopNav**: Верхняя горизонтальная навигация.
- **Left RAI Chat**: Постоянный левый пилон RAI Chat.
- **Main Workspace**: Правая рабочая зона.
- **Reactive Panel**: Реактивная панель виджетов агента.
- **Persistent Memory**: Персистентная память пользователя «на всё время пользования».

---

## 1. AppShell Архитектура (UI Foundation)

### 1.1 Создать глобальный Shell Layout
- [ ] Вынести текущий layout в `AppShell`.
- [ ] Добавить `TopNav` (горизонтальное меню).
- [ ] Добавить `LeftRaiChatDock`.
- [ ] Добавить `MainWorkspace`.
- [ ] Убедиться, что чат не размонтируется при навигации.

**Эффект:** Агент живёт на уровне системы, а не страницы.

### 1.2 Top Navigation (Horizontal)
- [ ] Перенести текущий sidebar в `TopNav`.
- [ ] Реализовать dropdown подменю.
- [ ] Добавить активное состояние маршрута.
- [ ] Проверить адаптивность.

**Эффект:** Навигация не «съедает» ширину рабочего пространства.

### 1.3 RAI Chat Dock (Left Pillar)
- [ ] Зафиксировать ширину `320–360px` (Docked).
- [ ] Реализовать режим Focus `480–560px`.
- [ ] Добавить toggle в header чата.
- [ ] Сохранить состояние режима в `localStorage`.

**Эффект:** Агент всегда доступен, но не мешает работе.

---

## 2. Workspace Context Protocol

### 2.1 Определить структуру workspaceContext
```typescript
interface WorkspaceContext {
  route: string;
  activeEntityRefs?: {
    farmRef?: string;
    fieldRef?: string;
    partyRef?: string;
    techmapRef?: string;
    taskRef?: string;
  };
  filters?: Record<string, any>;
  selectedRow?: {
    id: string;
    type: string;
    summary: string;
  };
  lastUserAction?: string;
}
```

- [ ] Реализовать генерацию `context` на каждой странице.
- [ ] Передавать `context` в `/api/rai/chat`.
- [ ] Проверить, что `context` обновляется при изменениях.

**Эффект:** Агент «видит» Main Workspace структурно, а не через догадки.

---

## 3. Chat API v1

### 3.1 Endpoint
`POST /api/rai/chat`

**Request:**
```json
{
  "message": "string",
  "workspaceContext": "WorkspaceContext"
}
```

**Response:**
```json
{
  "text": "string",
  "widgets": "WidgetPayload[]",
  "openUiToken": "string"
}
```

- [ ] Подключить `SupervisorAgent`.
- [ ] Добавить поддержку `widgetPayload`.
- [ ] Реализовать стрим ответа (если есть infra).

**Эффект:** Чат становится полноценным Agent Interface.

---

## 4. Reactive Panel (Right Overlay)

### 4.1 Создать RaiReactivePanel
- [ ] Реализовать store для `widgets`.
- [ ] Рендерить поверх `MainWorkspace`.
- [ ] Поддержать типы виджетов:
  - `DeviationList`
  - `RiskOverview`
  - `TaskBacklog`
  - `ForecastSummary`
  - `Last24hChanges`
- [ ] Не блокировать взаимодействие с основной страницей.

**Эффект:** Агент не заменяет UI, а усиливает его.

---

## 5. Persistent Memory (CRITICAL)

### 5.1 Conversation Log (Raw)
- [ ] Таблица `RaiConversation`.
- [ ] Поля: `tenantId`, `userId`, `message`, `response`, `context`, `toolCalls`.
- [ ] Индекс по `tenantId + userId`.
- [ ] Audit metadata.

**Эффект:** Полная история взаимодействий.

### 5.2 Episodic Memory
- [ ] Таблица `RaiEpisode`.
- [ ] Сжатое `summary` события.
- [ ] Vector embedding.
- [ ] Metadata (`route`, `entityRefs`, `severity`, `tags`).
- [ ] Retrieval top-K по запросу.

**Эффект:** Агент помнит релевантное, а не всё подряд.

### 5.3 Stable Profile Memory
- [ ] Таблица `RaiUserProfile`.
- [ ] Предпочтения формата отчётов.
- [ ] Часто используемые сущности.
- [ ] Поведенческие паттерны.
- [ ] Последние активные поля.

**Эффект:** Агент адаптируется к пользователю со временем.

### 5.4 Memory Flow
Каждый `chat request`:
1. `retrieveMemory(userId, tenantId, context)`
2. `composePrompt(message + context + memory)`
3. `generateResponse()`
4. `writeConversation()`
5. `writeEpisode()`

**Эффект:** Память работает «вечно», но детерминированно.

---

## 6. Security & Isolation
- [ ] `Tenant isolation`.
- [ ] `RBAC enforcement`.
- [ ] Ограничение `cross-tenant retrieval`.
- [ ] `Retention policy`.
- [ ] `Data deletion endpoint`.

**Эффект:** Память не становится юридическим риском.

---

## 7. Performance
- [ ] Лимит длины `memory retrieval`.
- [ ] `Async embedding generation`.
- [ ] `Cache frequent episodes`.
- [ ] `Background compaction`.

**Эффект:** Чат остаётся быстрым даже при долгом использовании.

---

## 8. Phase Rollout

### Phase A — Shell
- [ ] `AppShell` + `Chat Dock`.
- [ ] `WorkspaceContext`.
- [ ] `Mock API`.

### Phase B — Agent Wiring
- [ ] `SupervisorAgent` integration.
- [ ] `Widget rendering`.

### Phase C — Persistent Memory
- [ ] `Conversation log`.
- [ ] `Episodic retrieval`.
- [ ] `Profile memory`.

### Phase D — Optimization
- [ ] `Performance tuning`.
- [ ] `UX polishing`.
- [ ] `Security review`.

---

## 9. Non-Negotiables
- Чат живёт на уровне **Shell**.
- Память **персистентна**.
- **Tenant isolation** строгий.
- Агент работает только через **typed tool calls**.
- UI не содержит бизнес-логики.

---

## Итог

После выполнения RAI становится:
1. Постоянным интеллектом системы.
2. Осведомлённым о контексте.
3. Обладающим долговременной памятью.
4. Интегрированным в рабочий процесс.
5. Не нарушающим существующую архитектуру.