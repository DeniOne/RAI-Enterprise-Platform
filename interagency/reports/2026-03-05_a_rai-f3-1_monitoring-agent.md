# Отчёт — A_RAI Фаза 3.1: MonitoringAgent & AutonomousExecutionContext

**Дата:** 2026-03-05  
**Промпт:** `interagency/prompts/2026-03-05_a_rai-f3-1_monitoring-agent.md`  
**Decision-ID:** AG-ARAI-F3-001  

---

## Выполнено

### 1. AutonomousExecutionContext и блокировка WRITE/CRITICAL

- **`tools/rai-tools.types.ts`:** добавлены `ToolRiskLevel`, в `RaiToolActorContext` — опциональное поле `isAutonomous`, экспорт `createAutonomousExecutionContext(companyId, traceId)`.
- **`security/security-violation.error.ts`:** класс `SecurityViolationError` для нарушения READ-ONLY в автономном контексте.
- **`tools/risk-tools.registry.ts`:** у каждого инструмента задан `riskLevel` (`READ` для emit_alerts и get_weather_forecast); в `execute()` при `actorContext.isAutonomous` и `riskLevel === 'WRITE' | 'CRITICAL'` выбрасывается `SecurityViolationError`.

### 2. MonitoringAgent

- **`agents/monitoring-agent.service.ts`:** агент без userId/threadId, только companyId и traceId; анализирует фоновые сигналы (мок: ndvi_drop, frost_forecast); вызывает `RiskToolsRegistry.execute('emit_alerts', ...)` в автономном контексте; rate limit 10 алертов/час на companyId (in-memory Map); дедупликация по хэшу контента алерта (SHA-256, первые 16 символов); signals snapshot в результате и в логе (traceId, companyId, signals).

### 3. Триггер мониторинга

- **`monitoring-trigger.service.ts`:** публичный метод `triggerMonitoringCycle(companyId)` — генерирует traceId, создаёт автономный контекст, вызывает `MonitoringAgent.run()`; `@Cron('0 * * * *')` hourlyCycle() — заглушка (при необходимости подключается список companyId из БД).

### 4. DI

- **`rai-chat.module.ts`:** в `providers` добавлены `MonitoringAgent`, `MonitoringTriggerService`.

### 5. Тесты

- **`tools/risk-tools.registry.spec.ts`:** READ-инструменты работают с `isAutonomous: true`; при вызове инструмента с riskLevel WRITE из автономного контекста выбрасывается `SecurityViolationError`.
- **`agents/monitoring-agent.service.spec.ts`:** вызов run с autonomous контекстом и проверка explain/signalsSnapshot; дедупликация (второй вызов с тем же результатом — 0 алертов, explain про дедуп); rate limit (после 10 алертов — RATE_LIMITED).

---

## Изменённые файлы

- `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`
- `apps/api/src/modules/rai-chat/security/security-violation.error.ts` (новый)
- `apps/api/src/modules/rai-chat/tools/risk-tools.registry.ts`
- `apps/api/src/modules/rai-chat/tools/risk-tools.registry.spec.ts`
- `apps/api/src/modules/rai-chat/agents/monitoring-agent.service.ts` (новый)
- `apps/api/src/modules/rai-chat/agents/monitoring-agent.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/monitoring-trigger.service.ts` (новый)
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`

---

## tsc --noEmit

```
PASS (exit code 0)
```

---

## Jest (целевые тесты)

```
PASS src/modules/rai-chat/tools/risk-tools.registry.spec.ts
PASS src/modules/rai-chat/agents/monitoring-agent.service.spec.ts
Tests: 8 passed, 8 total
```

---

## Пример лога MonitoringAgent

**Новый алерт:**
```
[MonitoringAgent] MonitoringAgent run companyId=c1 traceId=t1 signals=2
[MonitoringAgent] Alert emitted companyId=c1 traceId=t1 count=1 snapshot={"traceId":"t1","companyId":"c1","signals":[{"type":"ndvi_drop","payload":{"threshold":0.1}},{"type":"frost_forecast","payload":{"region":"stub","days":3}}]}
```

**Дедупликация:**
```
[MonitoringAgent] MonitoringAgent run companyId=c1 traceId=t2 signals=2
[MonitoringAgent] Dedup skip companyId=c1 traceId=t2
```

**Rate limit:**
```
[MonitoringAgent] Rate limit exceeded companyId=rate-limit-company traceId=trace-11
```

---

## Definition of Done

- [x] AutonomousExecutionContext применяется, WRITE/CRITICAL блокируются на уровне реестра.
- [x] MonitoringAgent реализован, emit_alerts с дедупликацией и лимитом частоты.
- [x] Триггер (Cron + triggerMonitoringCycle) для симуляции фоновой работы.
- [x] tsc --noEmit — ПРОХОДИТ.
- [x] Целевые юнит-тесты (AutonomousExecutionContext, MonitoringAgent) — PASS.

---

**Статус:** READY_FOR_REVIEW
