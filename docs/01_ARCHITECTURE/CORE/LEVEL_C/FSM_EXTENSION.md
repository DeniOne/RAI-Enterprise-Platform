---
id: DOC-ARH-CORE-LC-003
type: Architecture
layer: Core
status: Draft
version: 1.6.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL C — FSM EXTENSION
## Расширение конечного автомата для поддержки конфликтов

---

## 0. Статус документа

**Уровень зрелости:** D5++ (Formal Governance)  
**Policy Mapping:** [RiskEscalationPolicy]

---

## 1. Динамическая политика блокировки (I33)

Вместо магических чисел, порог эскалации выносится в системную политику:

### 1.1. RiskEscalationPolicy
- **Thresholds:**
  - `WARN`: 0.1  (Explainability only)
  - `CRITICAL`: 0.3 (Justification required)
  - `BLOCK`: 0.8 (Optional/Configurable - Manager Approval required)
- **Tenant Overrides:** Допускается сужение порогов (напр. `CRITICAL = 0.2`), но не расширение.
- **Versioning:** Политика имеет `version_id`, который фиксируется в `DivergenceRecord`.

### 1.2. FSM Guard Implementation
```typescript
canTransition('CONFIRM_OVERRIDE'): boolean {
  const policy = this.getRiskPolicy(this.draft.companyId);
  
  if (this.deltaRisk > policy.criticalThreshold) {
    if (!this.justification) {
      throw new InvariantViolationError("I33: Justification required by Policy v" + policy.version);
    }
  }
  return true;
}
```

---

[Changelog]
- v1.5.0: D5 Perfection.
- v1.6.0: Governance Hardening. Порог 0.3 вынесен в RiskEscalationPolicy; введено версионирование порогов и мандат на JUSTIFICATION через политику. (D5++)
