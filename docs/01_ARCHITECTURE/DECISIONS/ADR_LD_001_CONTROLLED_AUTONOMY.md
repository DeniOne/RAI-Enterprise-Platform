---
id: DOC-ARC-ADR-LD-001
layer: Architecture
type: ADR
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# ADR-LD-001: Controlled Autonomy (Контролируемая автономия)

## Контекст

Level D вводит самообучение — AI начинает корректировать модели на основе фактического результата урожая. Ключевой архитектурный вопрос: **степень автономии** AI при обновлении моделей.

Два крайних варианта:
1. **Free Learning** — AI полностью автономен: обнаруживает drift, обучает, деплоит.
2. **Manual Learning** — AI только сигнализирует, человек принимает все решения вручную.

Оба крайних варианта неприемлемы:
- Free Learning порождает риск неконтролируемого bias amplification, silent degradation.
- Manual Learning теряет ценность адаптивности и не масштабируется.

## Решение

Зафиксировать: **Level D = Controlled Autonomy** — управляемая автономия с **Machine-Enforced Policy Layer**.

---

### 1. Machine-Enforced Policy Layer

Автономия ограничивается программно через `GovernancePolicyGuard`.

```typescript
class GovernancePolicyGuard {
  private readonly protectedDomains = [
    'GOVERNANCE_THRESHOLDS',  // D3
    'TARGET_FUNCTION',        // Optimization Goal
    'INVARIANT_DEFINITIONS',  // D1-D5 Rules
    'BIAS_METRICS_DEFINITIONS'// D4
  ];

  assertCanModify(parameter: string, actor: Actor) {
    if (actor === 'AI' && this.isProtected(parameter)) {
      throw new PolicyViolationError(
        `AI Actor cannot modify protected domain: ${parameter}`
      );
    }
  }
}
```

### 2. Actor Model (Audit Trail)

Вводится формальная модель актора для аудита всех изменений.

```typescript
type ActorType = 'AI' | 'HUMAN' | 'SYSTEM';

interface Actor {
  id: string;
  type: ActorType;
  role: string; // 'Orchestrator', 'DataScientist', 'Admin'
}

interface AuditEntry {
  traceId: string;
  actor: Actor;
  action: string;       // 'RETRAIN', 'PROMOTE', 'CHANGE_THRESHOLD'
  domain: 'MODEL' | 'GOVERNANCE' | 'LINEAGE';
  targetId: string;
  timestamp: Date;
}
```

**Правило:** `AuditEntry` является неизменяемым evidence log.

### 3. Escalation Policy (Human-in-the-Loop Trigger)

Если AI систематически не справляется с обновлением (Governance Reject), управление передается человеку.

**Logic:**
```typescript
if (consecutiveFailures > 10 && period < 30_DAYS) {
  // 1. Block AI Autonomy
  system.setMode('MANUAL_ONLY');
  
  // 2. Alert Team
  alert.raise('GOVERNANCE_DRIFT: AI unable to improve model. Human Review Required.');
  
  // 3. Require Governance Review
  // Возможно, пороги устарели или рынок изменился фундаментально.
}
```

---

## Обоснование

1.  **Предсказуемость:** Governance-пороги фиксируют пространство допустимых изменений.
2.  **Аудируемость:** Каждое действие AI полностью трассируемо через `AuditEntry`.
3.  **Безопасность:** Machine-enforced policies гарантируют, что AI не выйдет за рамки дозволенного.
4.  **Масштабируемость:** AI автоматизирует рутину, Escalation Policy подключает человека только при аномалиях.

## Последствия

**Плюсы:**
- Система эволюционирует без ручного вмешательства в пределах governance.
- Полная аудируемость каждого обновления.
- Защита от silent degradation и bias amplification.
- Формальная гарантия (Code Guarantee) того, что критические параметры защищены от AI.

**Минусы:**
- Требует точной калибровки governance-порогов.
- При неверных порогах может блокировать полезные обновления (решается через Escalation Policy).

## Критерии успеха
1.  AI самостоятельно обнаруживает drift и запускает pipeline.
2.  GovernancePolicyGuard выбрасывает исключение при попытке AI изменить пороги.
3.  Escalation Policy срабатывает при зацикливании AI.
4.  Полный audit trail содержит поле `actor: { type: 'AI' }`.
