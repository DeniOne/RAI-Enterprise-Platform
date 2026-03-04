# PROMPT — A_RAI Фаза 1.1: IntentRouter + AgroToolsRegistry + TraceId Binding
Дата: 2026-03-04  
Статус: active  
Приоритет: P0 (блокирующий для A_RAI архитектуры)  
Decision-ID: AG-ARAI-F1-001

---

## Цель

Реализовать первые три пункта ФАЗЫ 1 из `A_RAI_IMPLEMENTATION_CHECKLIST.md`:

1. **IntentRouter** — выделить из монолитного `SupervisorAgent.detectIntent()` в отдельный сервис `IntentRouterService` с LLM-ready архитектурой (сейчас — детерминированный regex, потом — GPT-4o-mini).
2. **AgroToolsRegistry** — выделить агро-инструменты (`compute_deviations`, `generate_tech_map_draft`) из общего `RaiToolsRegistry` в отдельный `AgroToolsRegistry`, сохранив backward compatibility.
3. **TraceId Binding** — прокинуть `traceId` из `SupervisorAgent.orchestrate()` в `AuditLog` (таблица `aiGenerationRecord` или новая `aiAuditEntry`), чтобы каждый вызов оставлял forensic-след.

По завершении: `SupervisorAgent` не содержит логику классификации; входящие запросы маршрутизируются через `IntentRouterService`; агро-инструменты изолированы в `AgroToolsRegistry`; каждый ответ чата оставляет запись в БД с `traceId`.

---

## Контекст

- **Архитектурный манифест:** `docs/00_STRATEGY/STAGE 2/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`
- **Техническая архитектура:** `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md` — §2.1 «Декомпозированная топология», §5.2 «Доменные реестры», §9.1 «Единый traceId»
- **Мастер-чеклист:** `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` — пп. 1.1 (IntentRouter), 1.2 (AgroToolsRegistry), 1.4 (TraceId)
- **Текущий монолит:** `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` — метод `detectIntent()` строки 349–369, метод `buildAutoToolCall()` строки 371–440
- **Текущий реестр:** `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` — 5 инструментов в одной куче
- **Security канон:** `memory-bank/SECURITY_CANON.md`

---

## Ограничения (жёстко)

- **Мультитенантность:** `companyId` берётся ТОЛЬКО из проверенного контекста (`actorContext.companyId`), никогда не из payload или body запроса.
- **Backward compatibility:** `RaiToolsRegistry` должен продолжать работать для существующих тестов. Нельзя удалять инструменты без их переноса в доменный реестр.
- **Scope запрещён:** не трогать UI, не трогать схему Prisma, не трогать модуль памяти.
- **Нет LLM-вызова в этой задаче:** `IntentRouterService` реализуется детерминированно (regex + правила), структура — LLM-ready (метод `classify()` возвращает `IntentClassification`). LLM будет подключён в следующей задаче.
- **Нет лишних провайдеров:** не дублировать инструменты. Каждый инструмент регистрируется ровно в одном реестре.

---

## Задачи (что сделать)

### 1. IntentRouterService
- [ ] Создать `apps/api/src/modules/rai-chat/intent-router/intent-router.service.ts`
- [ ] Контракт:
  ```typescript
  interface IntentClassification {
    toolName: RaiToolName | null;
    confidence: number;          // 0.0–1.0 (regex → 0.7, LLM → 0.9+)
    method: 'regex' | 'llm';    // для будущего переключения
    reason: string;              // логируемая причина
  }
  
  class IntentRouterService {
    classify(message: string, workspaceContext?: WorkspaceContext): IntentClassification
  }
  ```
- [ ] Перенести логику из `SupervisorAgent.detectIntent()` и `buildAutoToolCall()` в `IntentRouterService`
- [ ] В `SupervisorAgent.orchestrate()` заменить вызов `this.detectIntent()` на `this.intentRouter.classify()`
- [ ] Добавить в `RaiChatModule` провайдер `IntentRouterService`

### 2. AgroToolsRegistry
- [ ] Создать `apps/api/src/modules/rai-chat/tools/agro-tools.registry.ts`
- [ ] Перенести в него `ComputeDeviations` и `GenerateTechMapDraft` из `RaiToolsRegistry`
- [ ] `AgroToolsRegistry` реализует тот же интерфейс `register()` / `execute()`, что и `RaiToolsRegistry`
- [ ] `RaiToolsRegistry` делегирует агро-вызовы в `AgroToolsRegistry` (через `delegate()` или прямой вызов)
- [ ] Добавить провайдер в `RaiChatModule`

### 3. TraceId Binding в AuditLog
- [ ] Проверить наличие модели `AiGenerationRecord` или аналогичной в `schema.prisma`
- [ ] Если нет — создать минимальную модель `AiAuditEntry` (id, traceId, companyId, toolName, tokensUsed=0, createdAt)
- [ ] В `SupervisorAgent.orchestrate()` после формирования ответа записывать строку в `AiAuditEntry` (fire-and-forget, без блокировки ответа)
- [ ] Логировать: `traceId`, `companyId`, `toolName[]` (из `executedTools`), `model: 'deterministic'`, `intentMethod` из `IntentClassification`

---

## Definition of Done (DoD)

- [ ] `tsc --noEmit` в `apps/api` проходит без ошибок
- [ ] Все существующие тесты в `apps/api/src/modules/rai-chat/` проходят (jest, без регрессий)
- [ ] Новые unit-тесты для `IntentRouterService` (минимум 6 сценариев: 4 известных интента + 2 unknown)
- [ ] Новые unit-тесты для `AgroToolsRegistry` (минимум 3 сценария: execute compute_deviations, generate_tech_map_draft, invalid tool)
- [ ] BД `AiAuditEntry` создана (prisma validate + db push PASS)
- [ ] После POST /api/rai/chat в БД присутствует запись с `traceId` из ответа

---

## Тест-план (минимум)

```bash
# 1. TypeScript
cd apps/api && pnpm exec tsc -p tsconfig.json --noEmit

# 2. Все тесты rai-chat модуля
cd apps/api && pnpm test -- --runInBand --testPathPattern="src/modules/rai-chat"

# 3. Верификация IntentRouter
cd apps/api && pnpm test -- --runInBand src/modules/rai-chat/intent-router/intent-router.service.spec.ts

# 4. Верификация AgroToolsRegistry
cd apps/api && pnpm test -- --runInBand src/modules/rai-chat/tools/agro-tools.registry.spec.ts

# 5. Smoke — проверка traceId в БД
curl -sS -X POST 'http://localhost:4000/api/rai/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message":"покажи отклонения","workspaceContext":{"route":"/consulting/techmaps"}}' \
  | jq .traceId
# Взять traceId из ответа, найти запись в AiAuditEntry
```

---

## Что вернуть на ревью

1. Список изменённых файлов (новые + модифицированные)
2. Вывод `tsc --noEmit` (без ошибок)
3. Вывод jest для rai-chat модуля (все тесты PASS)
4. Скриншот/вывод: запись в `AiAuditEntry` с `traceId`
5. Статус: `READY_FOR_REVIEW` в `interagency/INDEX.md`
