# REPORT — TechMap Sprint TM-2: Operations DAG + Validation Engine
Дата: 2026-03-03
Decision-ID: AG-TM-DAG-002
Статус: **READY_FOR_REVIEW**

---

## Что реализовано

### validation/
| Файл | Описание |
|------|----------|
| `dag-validation.service.ts` | DFS-обнаружение циклов, CPM-алгоритм, ресурсные конфликты |
| `dag-validation.service.spec.ts` | 4 теста |
| `techmap-validation.engine.ts` | 7 правил валидации (HARD_STOP / CRITICAL_WARNING / WARNING) |
| `techmap-validation.engine.spec.ts` | 8 тестов |
| `tank-mix-compatibility.service.ts` | Совместимость СЗР в баковой смеси |
| `tank-mix-compatibility.service.spec.ts` | 3 теста |

### calculators/
| Файл | Описание |
|------|----------|
| `seeding-rate.calculator.ts` | Pure function, §3.2.1 |
| `seeding-rate.calculator.spec.ts` | 3 теста |
| `fertilizer-dose.calculator.ts` | Pure function, §3.2.3 |
| `fertilizer-dose.calculator.spec.ts` | 3 теста |
| `gdd-window.calculator.ts` | Pure functions, §3.2.2 |
| `gdd-window.calculator.spec.ts` | 3 теста |

### Интеграция
| Файл | Изменение |
|------|-----------|
| `tech-map.service.ts` | +3 метода (`validateTechMap`, `validateDAG`, `getCalculationContext`), конструктор расширен |
| `tech-map.module.ts` | +3 провайдера |
| `tech-map.concurrency.spec.ts` | Mock обновлён: добавлены `updateMany`, `findFirstOrThrow`, новые DI-провайдеры |

---

## Результаты верификации

### TypeScript
```
pnpm --filter api exec tsc --noEmit
→ PASS (0 ошибок)
```

### validation/ тесты
```
cd apps/api && npx jest --runInBand src/modules/tech-map/validation/
→ Test Suites: 3 passed, 3 total
→ Tests:       15 passed, 15 total
```

### calculators/ тесты
```
cd apps/api && npx jest --runInBand src/modules/tech-map/calculators/
→ Test Suites: 3 passed, 3 total
→ Tests:       9 passed, 9 total
```

### Весь tech-map/ домен
```
cd apps/api && npx jest --runInBand src/modules/tech-map/
→ Test Suites: 17 passed, 17 total
→ Tests:       56 passed, 56 total
```

**Суммарно новых тестов: 24 (≥ 20 по DoD)**

---

## DoD — статус

| Критерий | Статус |
|----------|--------|
| `tsc --noEmit` PASS | ✅ |
| validation/ тесты ≥ 15 PASS | ✅ 15/15 |
| calculators/ тесты ≥ 9 PASS | ✅ 9/9 |
| Новых тестов ≥ 20 суммарно | ✅ 24 |
| Все сервисы принимают `companyId` | ✅ |
| Калькуляторы — pure functions | ✅ |
| Нет изменений вне `apps/api/src/modules/tech-map/` | ✅ |
| Нет изменений Prisma-схемы | ✅ |
| Нет новых контроллеров/endpoints | ✅ |
