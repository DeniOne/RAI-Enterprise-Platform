# PROMPT — A_RAI Фаза 3.2: RiskPolicy Engine & Two-Person Rule
Дата: 2026-03-05  
Статус: active  
Приоритет: P0 (безопасность ФАЗЫ 3 A_RAI)  
Decision-ID: AG-ARAI-F3-002  
Зависит от: AG-ARAI-F3-001

---

## Цель

Реализовать ядро политик безопасности для AI-операций: `RiskPolicy Engine` и механизм двойного подтверждения `Two-Person Rule`. Эти компоненты гарантируют, что ни один ИИ-агент не сможет самостоятельно выполнить критическое действие (CRITICAL) без соответствующих проверок и авторизаций от людей с правильными ролями.

**Архитектурные требования:** `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` §6.1, §6.2.

---

## Задачи (что сделать)

### 1. Модель PendingAction (БД)
- [ ] Описать в `packages/prisma-client/schema.prisma` (или основном `schema.prisma` проекта) новую модель `PendingAction` (или `ToolCallAction`).
  - Поля: `id`, `createdAt`, `expiresAt`, `traceId`, `toolName`, `payload` (JSON), `riskLevel` (String: READ | WRITE | CRITICAL), `status` (PENDING | APPROVED_FIRST | APPROVED_FINAL | EXPIRED | REJECTED), `requestedByUserId` (кто инициировал / контекст), `approvedFirstBy` (userId), `approvedFinalBy` (userId).
- [ ] Выполнить `pnpm db:push` / `prisma db push` и генерацию типов.

### 2. Сервис RiskPolicyEngine (`security/risk-policy-engine.service.ts`)
- [ ] Создать `RiskPolicyEngineService`.
- [ ] Реализовать метод `evaluate(riskLevel, domain, userRole)` (опираясь на матрицу из §6.1):
  - `READ` → `ALLOWED`
  - `WRITE`, agro, agronomist → `REQUIRES_USER_CONFIRMATION`
  - `WRITE`, finance, * → `REQUIRES_DIRECTOR_CONFIRMATION`
  - `CRITICAL` → `REQUIRES_TWO_PERSON_APPROVAL`
- [ ] Реализовать `PendingActionService` для управления жизненным циклом (Saga): создание со статусом PENDING и `expiresAt` (текущее время + 1 час), методы `approveFirst(actionId, userId, role)`, `approveFinal(actionId, userId, role)`, `reject(actionId)`. При истечении 1 часа выставлять статус `EXPIRED`.

### 3. Интеграция в AgentRuntime / RaiToolsRegistry
- [ ] Встроить проверку `RiskPolicyEngine` перед непосредственным выполнением инструмента в `RaiToolsRegistry.execute` (или в `AgentRuntime` перед передачей в реестр).
- [ ] Если политика возвращает `REQUIRES_TWO_PERSON_APPROVAL` (или `REQUIRES_USER_CONFIRMATION`), вместо вызова тулзы возвращать специальный ответ агенту: "Выполнение инструмента заблокировано RiskPolicy. Создан PendingAction #ID. Ожидается подтверждение человека.". Инструмент **не выполняется**.

### 4. Тестирование
- [ ] Unit-тесты для матрицы `RiskPolicyEngineService` (проверить все ветки).
- [ ] Unit-тесты для `PendingActionService` (цепочка PENDING -> APPROVED_FIRST -> APPROVED_FINAL, а также ветки REJECTED и тайм-лока).
- [ ] Интеграционный тест: `RaiToolsRegistry` перехватывает тул с уровнем `CRITICAL`, не вызывает хэндлер и создаёт `PendingAction`.

---

## Definition of Done (DoD)

- [ ] Модель `PendingAction` добавлена в Prisma.
- [ ] `RiskPolicyEngineService` реализован и покрыт тестами на 100% ветвлений матрицы.
- [ ] Механизм `Two-Person Rule` (APPROVED_FIRST -> APPROVED_FINAL) реализован для `CRITICAL` уровня.
- [ ] Интеграция перехватывает опасные вызовы до стадии исполнения.
- [ ] `tsc --noEmit` — ПРОХОДИТ.
- [ ] Юнит-тесты по модулю `rai-chat/security` (или где размещены Policy) — PASS.

---

## Что вернуть на ревью

Отчёт с:
1. Выводом `prisma validate` или `db push`.
2. Выводом `tsc --noEmit`.
3. Результатами `jest` для новых сервисов.
4. Примером перехваченного вызова (какой ответ вернется агенту, когда он попытается дернуть CRITICAL инструмент).
