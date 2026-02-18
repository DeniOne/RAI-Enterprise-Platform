---
id: DOC-ARH-CORE-LC-002
type: Architecture
layer: Core
status: Draft
version: 1.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL C — INVARIANTS SPECIFICATION
## Формальная спецификация инвариантов I29–I33

---

## 0. Статус документа

**Уровень зрелости:** D2 (Formal Specification)  
**Binding:** HARD (блокирующий на уровне Code Review)  
**Enforcement:** Code + Tests + Runtime Guards

---

## 1. Назначение

Данный документ определяет **формальные инварианты Level C**, которые:
1. Расширяют Level B (I15–I28)
2. Не удаляют предыдущие инварианты
3. Добавляют механизмы устойчивости к конфликтам

---

## 2. Инварианты Level C

### I29: Risk Awareness (Осведомленность о рисках)

#### Формальное определение
$$
\forall h \in \text{HumanOverride}: \exists \Delta Risk \in \mathbb{R}: \Delta Risk = \text{Risk}(A'_h) - \text{Risk}(A_{AI})
$$

#### Естественный язык
Любое переопределение решения ИИ человеком **обязано** сопровождаться расчетом разницы рисков.

#### Реализация
```typescript
// Guard на FSM transition
canOverride(draft: Draft, humanAction: Action): boolean {
  const deltaRisk = this.riskAnalyzer.calculate(draft, humanAction);
  
  if (deltaRisk === null || deltaRisk === undefined) {
    throw new InvariantViolationError('I29: ΔRisk calculation mandatory');
  }
  
  return true; // НЕ блокируем, но требуем расчета
}
```

#### Тестируемость
- **L4:** Unit test проверяет выброс ошибки при отсутствии ΔRisk
- **PBT:** Property check: `∀ override: deltaRisk !== null`

---

### I30: Model Reproducibility (Воспроизводимость модели)

#### Формальное определение
$$
\forall S, A': \text{counterfactual}(S, A')_0 = \text{counterfactual}(S, A')_n
$$

#### Естественный язык
Контрфактуальное моделирование **детерминировано**: повторный расчет с теми же входными данными дает тот же результат.

#### Реализация
```typescript
// Наследование детерминизма от Level B
class CounterfactualEngine {
  simulate(state: PlanState, action: Action): Scenario {
    const seed = this.entropyController.generateSeed(state, action);
    const generator = new DeterministicGenerator(seed);
    
    return generator.generateScenario(state, action);
  }
}
```

#### Связь с Level B
Инвариант I30 напрямую зависит от I19 (Determinism B1).

#### Тестируемость
- **L5:** Integration test: 10,000 повторов с одинаковыми входными данными
- **PBT:** Property check: `hash(scenario₀) === hash(scenarioₙ)`

---

### I31: Conflict Tracking (Отслеживание конфликтов)

#### Формальное определение
$$
\forall d \in \text{Divergence}: \exists r \in \text{DivergenceRecord}: r.\text{metadata} = \{aiDraft, humanAction, \Delta Risk, timestamp\}
$$

#### Естественный язык
Каждый факт расхождения между рекомендацией ИИ и действием человека **обязан** быть зафиксирован в иммутабельном логе.

#### Реализация
```typescript
// DivergenceTracker
async recordDivergence(context: OverrideContext): Promise<void> {
  const record = {
    id: cuid(),
    companyId: context.companyId,
    planId: context.planId,
    aiDraftId: context.aiDraft.id,
    humanAction: context.humanAction,
    deltaRisk: context.deltaRisk,
    explanation: context.explanation,
    conflictVector: context.conflictVector,
    timestamp: new Date(),
  };
  
  // Append-only (immutable)
  await this.prisma.divergenceRecord.create({ data: record });
}
```

#### Неизменяемость
После создания `DivergenceRecord` **НЕ может быть изменен** (append-only log).

#### Тестируемость
- **L4:** Unit test проверяет создание записи при каждом override
- **Adversarial:** Попытка UPDATE должна быть заблокирована триггером БД

---

### I32: Explainable Disagreement (Объяснимое расхождение)

#### Формальное определение
$$
\forall d \in \text{DivergenceRecord}: d.\text{explanation} \neq \text{null} \land |d.\text{explanation}| > 0
$$

#### Естественный язык
Каждое зафиксированное расхождение **обязано** иметь объяснение, почему ИИ и человек пришли к разным выводам.

#### Реализация
```typescript
// Расширение ExplainabilityBuilder (Level B)
buildDivergenceExplanation(context: OverrideContext): string {
  const aiFactors = this.extractFactors(context.aiDraft);
  const humanFactors = this.extractFactors(context.humanAction);
  
  const divergentFactors = this.compareFa ctors(aiFactors, humanFactors);
  
  return `
    AI рекомендовал ${context.aiDraft.action} на основе:
    ${aiFactors.map(f => `- ${f.name}: ${f.value}`).join('\n')}
    
    Человек выбрал ${context.humanAction.action} на основе:
    ${humanFactors.map(f => `- ${f.name}: ${f.value}`).join('\n')}
    
    Ключевые расхождения:
    ${divergentFactors.map(f => `- ${f.explanation}`).join('\n')}
  `;
}
```

#### Политика блокировки
Если `explanation === null`, **запрещается** создание `DivergenceRecord`.

#### Тестируемость
- **L4:** Unit test проверяет наличие непустого объяснения
- **PBT:** Property check: `∀ record: record.explanation.length > 0`

---

### I33: High-Regret Escalation (Эскалация при высоком Regret)

#### Формальное определение
$$
\forall \text{override}: \text{Regret}(A') > \text{threshold}_{\text{critical}} \Rightarrow \exists \text{justification} \neq \text{null} \land \text{supervisorNotified} = \text{true}
$$

#### Естественный язык
Если Regret от Human Override превышает критический порог, **обязательно** требуется:
1. Письменное обоснование от пользователя
2. Уведомление supervisor

#### Отличие от I29
- **I29:** Требует расчета ΔRisk для **любого** override
- **I33:** Требует обоснования только при **критическом** уровне Regret (> threshold_critical)

#### Реализация
```typescript
// Guard на FSM transition CONFIRM_OVERRIDE
canConfirmOverride(context: OverrideContext): boolean {
  const regret = this.regretCalculator.calculate(context);
  const escalationLevel = this.escalationPolicy.classify(regret, context.tenantId);
  
  if (escalationLevel === 'CRITICAL') {
    if (!context.justification || context.justification.length === 0) {
      throw new InvariantViolationError(
        'I33: Written justification required for Critical-level Regret override'
      );
    }
    
    // Уведомление supervisor (не блокирует, но обязательно)
    await this.notificationService.notifySupervisor(context);
  }
  
  return true; // НЕ блокируем, но требуем обоснования
}
```

#### Тестируемость
- **L4:** Unit test проверяет выброс ошибки при отсутствии justification при Critical Regret
- **L6:** E2E test: полный flow с Critical Regret требует заполнения поля обоснования
- **Adversarial:** Попытка подтвердить Critical override без justification должна быть заблокирована

#### Конфигурация
```typescript
// Per-tenant, default threshold_critical = 30% от avg profit
const escalationConfig: EscalationConfig = {
  tenantId: 'company-123',
  thresholds: { moderate: 0.05, high: 0.15, critical: 0.30 },
  supervisorNotification: { enabled: true, channels: ['in-app', 'telegram'] }
};
```

---

## 3. Матрица инвариантов и компонентов

| Инвариант | Компонент | Enforcement Layer |
|-----------|-----------|-------------------|
| I29       | OverrideRiskAnalyzer | FSM Guard |
| I30       | CounterfactualEngine | Deterministic Generator |
| I31       | DivergenceTracker | Prisma + Trigger |
| I32       | ExplainabilityBuilder | Domain Rule |
| I33       | EscalationPolicy + NotificationService | FSM Guard + Event |

---

## 4. Связь с Level B Invariants

### Расширяемые инварианты
- **I19 (Determinism B1)** → расширяется для контрфактуального моделирования (I30)
- **I24 (Explainability)** → расширяется для объяснения конфликтов (I32)

### Неизменные инварианты
- **I15–I18, I20–I28** → остаются в силе для всех генеративных процессов

---

## 5. Enforcement Strategy

### Compile-Time
- TypeScript interfaces требуют наличия `deltaRisk` и `explanation` в типах

### Runtime
- Guards на FSM transitions проверяют I29 перед каждым override
- DivergenceTracker проверяет I31 и I32 перед записью

### Database-Level
- Триггеры блокируют UPDATE на `DivergenceRecord` (I31 immutability)
- NOT NULL constraints на `explanation` (I32)

### Test-Level
- Property-Based Testing для всех 4 инвариантов
- Adversarial tests для попыток обхода

---

## 6. Определение нарушения

### I29 нарушен, если:
- Human Override произошел без расчета ΔRisk
- ΔRisk = null или undefined

### I30 нарушен, если:
- `counterfactual(S, A')₀ ≠ counterfactual(S, A')ₙ` при идентичных входах

### I31 нарушен, если:
- Divergence произошел, но запись в логе отсутствует
- DivergenceRecord был изменен после создания

### I33 нарушен, если:
- Regret > threshold_critical, но justification отсутствует или пустое
- Supervisor не был уведомлен при Critical уровне

---

## 7. Связанные документы

- [LEVEL_C_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_ARCHITECTURE.md)
- [FSM_EXTENSION.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/FSM_EXTENSION.md)
- [LEVEL_B_FORMAL_TEST_MATRIX.md](file:///f:/RAI_EP/docs/05_TESTING/LEVEL_B_FORMAL_TEST_MATRIX.md)
- [PROPERTY_BASED_TEST_SPEC.md](file:///f:/RAI_EP/docs/05_TESTING/PROPERTY_BASED_TEST_SPEC.md)
