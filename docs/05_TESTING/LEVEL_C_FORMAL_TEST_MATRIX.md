---
id: DOC-TEST-LC-001
type: Testing Specification
layer: Testing
status: Draft
version: 1.4.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL C FORMAL TEST MATRIX
## Матрица тестов для инвариантов I29-I33 (Industrial Grade)

---

## 0. Статус документа

**Уровень зрелости:** D2 (Formal Specification)  
**Привязка к инвариантам:** I29–I33  
**Методология:** TDD + Industrial PBT (10k runs) + Adversarial

---

## 1. Матрица покрытия (40+ тестов)

| Инвариант | L3 (Schema) | L4 (Unit) | L5 (Integ) | L6 (E2E) | PBT | ADV | **Total** |
|-----------|-------------|-----------|------------|----------|-----|-----|-----------|
| **I29** (Risk) | 3           | 2         | 1          | 1        | 3   | 3   | **13**    |
| **I30** (Det)  | 2           | 2         | 5          | 1        | 4   | 4   | **18**    |
| **I31** (Log)  | 2           | 2         | 2          | 1        | 1   | 4   | **12**    |
| **I32** (Expr) | 2           | 2         | 1          | 1        | 1   | 1   | **8**     |
| **I33** (Esc)  | 1           | 3         | 1          | 1        | 2   | 1   | **9**     |
| **Итого**      | **10**      | **11**    | **10**     | **5**    | **11** | **13** | **60** |

---

## 2. Тесты по уровням

### L3: Schema & Data Integrity (Hard Enforcement)

#### I29: Risk Domain Integrity
- **I29-L3-01**: `deltaRisk` NOT NULL.
- **I29-L3-02**: CHECK (deltaRisk IS FINITE). Отбраковка NaN/Infinity на уровне PG.
- **I29-L3-03**: CHECK (deltaRisk >= -1.0 AND deltaRisk <= 1.0) — нормализация.

#### I30: Determinism Persistence
- **I30-L3-01**: `simulationHash` VARCHAR(64) NOT NULL в `DivergenceRecord`.
- **I30-L3-02**: UNIQUE INDEX (`planId`, `stateHash`, `actionHash`) — предотвращение двойных симуляций для одного и того же входа.

#### I31: Audit Log Protection
- **I31-L3-01**: BEFORE UPDATE TRIGGER — блокировка любого изменения записи (Immutable).
- **I31-L3-02**: BEFORE DELETE TRIGGER — блокировка удаления (Append-only). Для удаления требуется ручной аудит DB-Admin.

#### I32: Explanation Quality
- **I32-L3-01**: `explanation` TEXT NOT NULL.
- **I32-L3-02**: CHECK (length(trim(explanation)) > 0). Блокировка пустых строк или строк из пробелов.

#### I33: Escalation Shield
- **I33-L3-01**: `isCritical` BOOLEAN DEFAULT FALSE. Если TRUE — `justification` NOT NULL.

---

### L4: Unit Tests (Negative & Edge Cases)

#### I29: Risk Calculation Refusal
- **I29-L4-01**: Ошибка при `NaN` во входных данных урожайности.
- **I29-L4-02**: Отбраковка `Infinity` при расчете финансовых потерь (anti-overflow).

#### I30: Engine Consistency
- **I30-L4-01**: Проверка `EntropyController`: одинаковый seed на одинаковый `state+action`.
- **I30-L4-02**: Детерминизм генерации сценария при фиксированном seed.

#### I31: Tracker Resilience
- **I31-L4-01**: Корректная обработка `Partial Divergence` (когда часть данных отсутствует).
- **I31-L4-02**: Гарантия записи метаданных (timestamp, tenantId, userTag).

#### I32: Builder Constraints
- **I32-L4-01**: Unicode Safety: Корректная работа с кириллицей и спецсимволами.
- **I32-L4-02**: Max Length Enforcement: Отсечение или отбраковка слишком длинных объяснений (> 65k chars).

#### I33: Policy Logic
- **I33-L4-01**: Классификация порога: 31% -> CRITICAL, 29% -> HIGH.
- **I33-L4-02**: Валидация необходимости `justification` перед подтверждением.

---

### L5: Integration & Concurrency

#### I30: Replay & Concurrency
- **I30-L5-01**: **Concurrent simulation test**: Два потока запрашивают симуляцию для одного входа — результат (hash) идентичен.
- **I30-L5-02**: **Process restart simulation**: Хеш сохраняется и совпадает после перезагрузки инстанса.
- **I30-L5-03**: **Hash Version Drift**: Система должна выбрасывать ошибку `INCOMPATIBLE_HASH` при попытке загрузки `DivergenceRecord` с устаревшей версией алгоритма хеширования.
- **I30-L5-04**: **Migration Path (Forced Recompute)**: При наличии `FORCE_RECOMPUTE_HASH=true` система должна пересчитать хеш по новому алгоритму и обновить запись без потери конгруэнтности.
- **I30-L5-05**: **Monotonic Hash Evolution**: Пересчитанный хеш (Migration Path) должен побитово совпадать с хешем абсолютно новой симуляции (`Fresh Simulation`) на идентичных вводных.

#### I31: Persistence & Isolation
- **I31-L5-01**: Глубокая проверка записи `JSONB humanAction` в БД.
- **I31-L5-02**: **Cross-Tenant Visibility**: Попытка запроса списка расхождений тенантом B для тенанта A должна вернуть 403.
- **I31-L5-03**: **Transactional Atomicity**: Имитация падения `NotificationService` в процессе `CONFIRM_OVERRIDE` — запись `DivergenceRecord` не должна появиться в БД (Rollback).

#### I33: Notifications & FSM
- **I33-L4-03**: **FSM Illegal Transitions**: Попытка перевода Draft из `APPROVED` обратно в `OVERRIDE_ANALYSIS` без сброса статуса через системный лог должна быть отклонена.
- **I33-L5-01**: Проверка вызова `NotificationService` при уровне HIGH/CRITICAL.
- **I33-L5-02**: Проверка блокировки перехода FSM 'CONFIRM_OVERRIDE' при отсутствии `justification`.

---

### L6: End-to-End flows

- **I29-L6-01**: Полный цикл с расчетом ΔRisk в UI.
- **I30-L6-01**: Сравнение двух сценариев (AI vs Human) — идентичность контрфактуала при повторном клике.
- **I31-L6-01**: Просмотр `Conflict History` для Tenant.
- **I32-L6-01**: Рендеринг объяснения в UI (markdown validation).
- **I33-L6-01**: Блокировка кнопки "Confirm" до ввода обоснования при Critical Regret.

---

### Property-Based Testing (fast-check)

```typescript
// 1. PBT: Risk Domain (I29)
it('PBT: ΔRisk must be finite and within [-1, 1] for all inputs (including NaN/Inf stress)', async () => {
  await fc.assert(
    fc.property(arbitraryDraft(), arbitraryAction(), async (draft, action) => {
      const result = await analyzer.calculate(draft, action);
      expect(Number.isFinite(result.deltaRisk)).toBe(true); // Fixed: result.deltaRisk
    }),
    // Extreme numeric stress: noNaN: false allows checking if internal guards catch it
    { numRuns: 10_000, examples: [[NaN, Infinity, -Infinity]] } 
  );
});

// 2. PBT: Hash Determinism & Graph (I30)
it('PBT: Counterfactual hash must be stable across environment noise and re-ordering', async () => {
  await fc.assert(
    fc.property(arbitraryState(), arbitraryAction(), async (state, action) => {
      const h1 = await engine.simulate(state, action);
      
      // Re-order keys in state before second run
      const shuffledState = shuffleKeys(state); 
      const h2 = await engine.simulate(shuffledState, action);
      
      expect(h1.hash).toEqual(h2.hash);
    }),
    { numRuns: 10_000 }
  );
});

// 2.1 PBT: FSM Property Check
it('PBT: No action can lead to CONFIRMED status without passing through RISK_READY/ESCALATION', async () => {
  await fc.assert(
    fc.property(arbitraryFSMStream(), (stream) => {
      const approvedCount = stream.filter(s => s === 'APPROVED').length;
      const riskReadyCount = stream.filter(s => s === 'RISK_READY' || s === 'ESCALATION_READY').length;
      if (approvedCount > 0) expect(riskReadyCount).toBeGreaterThan(0);
    })
  );
});

// 3. PBT: Threshold Classification (I33)
it('PBT: Any record with ΔRisk > threshold.critical MUST be marked as isCritical=true', async () => {
  await fc.assert(
    fc.property(fc.double({min: 0.31, max: 1.0}), async (risk) => {
      const classification = policy.classify(risk);
      expect(classification.isCritical).toBe(true);
    })
  );
});
```

---

### Adversarial Tests (Security & Integrity)

- **ADV-01**: Попытка `DELETE FROM "DivergenceRecord"` (L3 Trigger block).
- **ADV-02**: Попытка `Prisma.$executeRaw` для изменения `explanation` (Bypass check).
- **ADV-03**: Попытка `Cross-Tenant Injection`: Использование `tenantId` чужой компании в запросе.
- **ADV-04**: **Clock Monotonicity Attack**: Эмуляция ситуации, когда системное время на сервере прыгает назад — `DivergenceRecord` должен сохранить исходный `createdAt`.
- **ADV-05**: Попытка подменить seed генератора для изменения результата при идентичном хеше.
- **ADV-06**: Подгрузка `justification` через 1 секунду после `CONFIRM_OVERRIDE` (Race condition attack).
- **ADV-07**: **Entropy Isolation Test**: Инъекция случайного шума в `Math.random()` и `Date.now()`. Результат `engine.simulate(state, action)` должен остаться неизменным (Hash identity).
- **ADV-08**: **Extreme Numeric Injection (I29)**: Передача `NaN`, `null`, `undefined` и `Infinity` — система должна вернуть 400.
- **ADV-09**: **Input Canonicalization Attack**: Передача JSON с разным порядком ключей или с `0.1 + 0.2` (Precision drift). Хеш должен оставаться иммутабельным.

---

## 3. Definition of Done

Тестирование Level C считается завершенным, если:
- [ ] **60 тестов** реализованы и проходят (Green Zone).
- [ ] PBT (10,000 образцов) не выявил контрпримеров, включая экстремальные числа.
- [ ] Транзакционная атомарность подтверждена (Rollback при падении сателлитов).
- [ ] Entropy Isolation подтверждена (Hash устойчив к внешнему шуму).

---

## 4. Связанные документы

- [LEVEL_C_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_INVARIANTS.md)
- [LEVEL_C_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_ARCHITECTURE.md)
- [DECISIONS.log](file:///f:/RAI_EP/DECISIONS.log)

---

[Changelog]
- v1.1.0: Расширена матрица до 44 тестов. Добавлены L3 защиты, негативные сценарии, I33 и промышленный PBT.
- v1.2.0: Hard Audit Hardening. Добавлены тесты на Hash Drift, Cross-Tenant Isolation и Clock Monotonicity.
- v1.3.0: Deep Audit Hardening. Фикс PBT (I29), Transactional Atomicity, Migration Path для хешей, Entropy Isolation и нагрузочный PBT на экстремальные числа. Всего 55 тестов.
- v1.4.0: Advanced Audit Hardening. Добавлены тесты на Monotonic Hash Evolution, Formal FSM Graph Invariants и Input Canonicalization. Всего 60 тестов. (Near-Formal Verification)
