---
id: DOC-ARV-ARCHIVE-RAI-EP-AGENT-FIRST-SPRINT-1-SPEC-V-1N1Q
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# RAI_EP — Agent-First Sprint 1 Spec (v1)

**Дата:** 2026-03-03  
**Статус:** LAW для спринта (исполняется как контракт)  
**Основание:** [SPEC_AGENT_FIRST_RAI_EP.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/SPEC_AGENT_FIRST_RAI_EP.md) + [RAI_AGENT_OS_IMPLEMENTATION_PLAN.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md) + текущий state (Gamma 1–8 + Shell + WorkspaceContext + MemoryAdapter + ControllerMetricsService)

---

## 0. Цель спринта (одна фраза)
За 5–7 дней превратить существующий Gamma 8 Controller + Engrams + Shell в два живых столпа Agent-First:
1. **A_RAI-controller** — Reactive Controller (реал-тайм план/факт, отклонения, алерты, виджеты).
2. **A_RAI-agronom** — Generative Architect (генерация и корректировка Техкарт).
3. **SupervisorAgent**, который ими рулит.

> [!IMPORTANT]
> Всё остальное (Phase 2–5) откладывается или покрывается агентами автоматически.  
> **Результат спринта:** возможность разговаривать с системой как с умным агрономом-контролёром прямо в чате, при этом она реагирует на текущую страницу и реальные данные.

---

## 1. Scope (что ВХОДИТ / НЕ входит)

### Входит:
- **A_RAI-controller** (использует существующий `ControllerMetricsService` + `AgroEscalation`).
- **A_RAI-agronom** (использует `Engrams` + `YieldOrchestrator`).
- **SupervisorAgent** + routing.
- **Structured widgets** → `RaiReactivePanel` и Telegram Recommendation Cards.
- **Минимальный Telegram Intake** (только `EventDraft` + кнопки ✅ ✏️ 🔗).
- **MemoryAdapter integration** (уже готов).

### НЕ входит:
- Полноценный CRM Agent (Phase 3).
- DaData enrichment.
- Полный Telegram Intake (voice + сложный linking) — только базовый.
- Phase 4–5 по старому плану.

---

## 2. Архитектура спринта

```mermaid
graph TD
    AppShell --> LeftRaiChatDock
    LeftRaiChatDock --> AiChatPanel
    AiChatPanel --> API[/api/rai/chat]
    API --> SupervisorAgent
    SupervisorAgent --> A_RAI_controller[A_RAI-controller (Gamma 8)]
    SupervisorAgent --> A_RAI_agronom[A_RAI-agronom (Engrams)]
    AppShell --> WorkspaceContext[WorkspaceContext Store]
    API --> RaiReactivePanel[RaiReactivePanel]
    API --> MemoryAdapter[MemoryAdapter]
```

*Всё взаимодействие через typed tool calls + Draft→Commit (согласно LAW).*

---

## 3. Подробное описание агентов

### 3.1 A_RAI-controller (Reactive Controller) — приоритет №1
**Цель:** ежесекундно считать план/факт по всем активным Техкартам и пушить алерты/виджеты.

**Tools (использует существующий код):**
- `computePlanFact(scope)`
- `computeDeviations(scope)`
- `emitAlerts(scope)`
- `renderWidget(widgetPayload)` → `DeviationList` / `TaskBacklog` / `RiskOverview`
- `requestTechCouncil` (при S3/S4)

**Интеграция:** подписка на Outbox + вызов `ControllerMetricsService.handleCommittedEvent`.

### 3.2 A_RAI-agronom (Generative Architect)
**Цель:** генерировать черновики Техкарт и предлагать корректировки.

**Tools:**
- `generateTechMapDraft(fieldRef, seasonRef)`
- `refineTechMap(techMapRef, changes)`
- `calculateEconomicImpact`
- `suggestRegenerativeAdjustment`

**Интеграция:** `Engrams` + `YieldOrchestrator`.

### 3.3 SupervisorAgent
- Определяет интент и маршрутизирует к нужному столпу.
- RBAC + RiskGate enforcement.
- Human-in-the-loop (Confirm / Fix / Link).

---

## 4. Интеграция с существующим кодом
- `ControllerMetricsService` + `AgroEscalation` (Gamma 8)
- `MemoryAdapter` + Episodes/Profile
- `WorkspaceContext Store`
- `RaiReactivePanel` + widget renderer
- `/api/rai/chat` endpoint
- Outbox + Event system
- Telegram Recommendation Cards (Gamma 4)

---

## 5. Phased Delivery (Day-by-Day)
* **День 1–2:** A_RAI-controller
* **День 3–4:** A_RAI-agronom
* **День 5:** SupervisorAgent + routing
* **День 6:** Минимальный Telegram Intake (EventDraft)
* **День 7:** E2E-тесты + merge

---

## 6. Полный чек-лист спринта

> [!IMPORTANT]
> **Анализ кода (2026-03-03):** `SupervisorAgent` уже существует в [`supervisor-agent.service.ts`](file:///root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts) (328 строк). LangGraph не нужен. Вся Memory инфраструктура готова. AgroEscalation работает. Telegram Draft→Commit реализован.  
> **Реальная задача Sprint 1:** наполнить `RaiToolsRegistry` боевыми инструментами.

### Phase 1: A_RAI-controller
- [x] ~~Создать `brain/agents/A_RAI_controller.ts` (LangGraph)~~ — **не нужно**: `SupervisorAgent` уже является оркестратором
- [x] Добавить tools в `RaiToolsRegistry`: `computePlanFact`, `computeDeviations`, `emitAlerts` (подключены к доменным сервисам и Prisma-scoped чтению)
- [ ] Подписка на Outbox + вызов `AgroEscalationLoopService.handleCommittedEvent` при S3/S4
- [x] ~~Structured payload → `RaiReactivePanel`~~ — **готово**: `RaiChatWidgetBuilder` + `AiChatWidgetsRail.tsx` работают
- [x] ~~Severity S3/S4 → create escalation~~ — **готово**: `AgroEscalationLoopService` реализован и протестирован
- [x] ~~Интеграция с `MemoryAdapter`~~ — **готово**: `SupervisorAgent` уже вызывает `appendInteraction` и `updateProfile`

### Phase 2: A_RAI-agronom
- [x] ~~Создать отдельный `brain/agents/A_RAI_agronom.ts`~~ — **не нужно**: реализуется как набор tools в реестре
- [x] Добавить tool `generateTechMapDraft(fieldRef, seasonRef)` → `TechMapService` (stub-черновик через `generate_tech_map_draft` зарегистрирован в `RaiToolsRegistry`)
- [ ] Добавить tool `refineTechMap(techMapRef, changes)` → `TechMapService`
- [x] ~~Engrams~~ — **готово**: `engram-rules.ts`, `episodic-retrieval.service.ts` реализованы
- [x] ~~Draft→REVIEW→ACTIVE FSM~~ — **готово**: `TechMapService` + FSM в `tech-map/fsm/`
- [x] ~~YieldOrchestrator~~ — **частично**: записывает урожай, для генерации TechMap нужна дополнительная логика

### Phase 3: SupervisorAgent
- [x] ~~`brain/agents/SupervisorAgent.ts` (LangGraph)~~ — **готово**: [`supervisor-agent.service.ts`](file:///root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts) (328 строк) уже существует
- [x] Добавить intent-based routing (минимальный keyword-based routing в `SupervisorAgent` добавлен)
- [x] ~~RBAC + RiskGate~~ — инфраструктура guards есть в `shared/guards/`
- [x] ~~Explainability протокол~~ — **есть**: `generative-engine/explainability/` реализован

### Phase 4: Telegram Intake (минимальный)
- [x] ~~`captureEventDraft` + кнопки ✅ ✏️ 🔗~~ — **готово**: `telegram.update.ts` (34KB), Draft→Commit с кнопками уже реализован
- [ ] Проверить и при необходимости улучшить linking cascade (context + field suggestion)
- [x] ~~`EventDraft` → `commitEvent`~~ — **готово**: `agro-events.orchestrator.service.ts` реализован

### Phase 5: Тестирование и запуск
- [ ] Тест-сценарии 12.2 и 12.3 из LAW
- [ ] E2E: чат → отклонение → алерт → виджет
- [ ] E2E: чат → генерация Техкарты → approval
- [ ] Merge в main + canary

---

## 7. Test Scenarios (обязательные)
1. Пользователь на странице поля пишет: «Покажи отклонения по техкарте» → `A_RAI-controller` возвращает `DeviationList` в правой панели.
2. Приходит `TASK_COMPLETED` с задержкой 4 дня → S3 → алерт + предложение `TechCouncil`.
3. «A_RAI-агроном, сделай техкарту на поле 4Б рапс» → генерит черновик + кнопки Confirm/Fix.
4. После подтверждения отклонения → `A_RAI-agronom` предлагает корректировку Техкарты.

---

## 8. Non-Negotiables (как в LAW)
- Только typed tool calls.
- Human final decision (Confirm / Override).
- Draft→Commit + MUST gates.
- `WorkspaceContext` обязателен в каждом запросе.
- Всё через `MemoryAdapter`.
- TechMap остаётся центром.

---

## 9. Definition of Done
- [ ] Чат реагирует на текущую страницу (`WorkspaceContext`).
- [ ] Появились реактивные виджеты и алерты в реальном времени.
- [ ] Можно генерировать черновики Техкарт через чат.
- [ ] `SupervisorAgent` рулит двумя столпами.
- [ ] Telegram Intake минимально работает (`EventDraft`).
- [ ] Все тесты из раздела 7 проходят.
- [ ] Документ обновлён (отчёт спринта).
