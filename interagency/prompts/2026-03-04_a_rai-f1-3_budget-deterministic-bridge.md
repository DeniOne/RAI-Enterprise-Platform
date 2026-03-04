# PROMPT — A_RAI Фаза 1.3: BudgetController + AgroDeterministicEngineFacade
Дата: 2026-03-04  
Статус: active  
Приоритет: P0 (продолжение ФАЗЫ 1 A_RAI)  
Decision-ID: AG-ARAI-F1-003  
Зависит от: AG-ARAI-F1-002 (Domain Registries + AgronomAgent Stub)

---

## Цель

Внедрить детерминированные "предохранители" и прозрачность расчётов в систему A_RAI согласно `A_RAI_IMPLEMENTATION_CHECKLIST.md` §1.3 (Bridge) и §1.5 (Budget).

**Три основные задачи:**
1. **AgroDeterministicEngineFacade** — создать типизированный фасад над существующими калькуляторами (`SeedingRate`, `FertilizerDose`, `GDDWindow`), возвращающий `ExplainableResult`.
2. **BudgetController** — реализовать механизм `preCommitCheck`, который блокирует изменения в техкарте, если они нарушают финансовые лимиты.
3. **AgronomAgent Integration** — подключить фасад к агенту-агроному, чтобы его ответы содержали математическое обоснование.

---

## Контекст

- **Архитектура:** `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md`:
  - §8 — Спецификация `ExplainableResult`
  - §9.1 — Роль `BudgetController` как "Hard Guard"
- **Техкарта (домен):**
  - `apps/api/src/modules/tech-map/calculators/` — здесь лежат чистые функции расчётов (реализованы в TM-2).
  - `apps/api/src/modules/tech-map/economics/tech-map-budget.service.ts` — расчёт текущего бюджета.
- **Уже в работе (F1-2):** `AgronomAgentService`.
- **Security канон:** `memory-bank/SECURITY_CANON.md` (раздел о финансовых лимитах).

---

## Ограничения (жёстко)

- **Математика — только детерминированная:** Агент (LLM) никогда не считает норму высева или дозу удобрений сам. Он передаёт параметры в `AgroDeterministicEngineFacade`, который вызывает канонические калькуляторы.
- **Бюджетный лимит:** `BudgetController` должен учитывать `budgetCapRubHa` и `contingencyFundPct` из модели `TechMap`. Превышение лимитов — это `ForbiddenException` или специализированная ошибка `BudgetExceededError`.
- **Чистота кода:** Не дублировать логику калькуляторов. Фасад — это прокси-слой для формирования "объяснений".
- **Multi-tenancy:** Все вызовы `BudgetService` должны включать `companyId`.

---

## Задачи (что сделать)

### 1. AgroDeterministicEngineFacade
- [ ] Создать `apps/api/src/modules/rai-chat/deterministic/agro-deterministic.facade.ts`
- [ ] Реализовать интерфейс `ExplainableResult<T>`:
  ```typescript
  export interface ExplainableResult<T> {
    value: T;
    formula: string;      // человекочитаемая формула (напр. "SeedDensity * 100 / Germination")
    variables: Record<string, number>;
    unit: string;
    explanation: string;  // "Норма высева рассчитана на основе целевой густоты и всхожести..."
  }
  ```
- [ ] Методы фасада (прокси к `tech-map/calculators`):
  - `computeSeedingRate(params): ExplainableResult<number>`
  - `computeFertilizerDose(params): ExplainableResult<number>`
  - `predictGDDWindow(params): ExplainableResult<{ start: Date, end: Date }>`

### 2. BudgetController
- [ ] Создать `apps/api/src/modules/rai-chat/security/budget-controller.service.ts`
- [ ] Метод `validateTransaction(techMapId: string, deltaCost: number, actorContext: RaiToolActorContext)`:
  1. Вызвать `TechMapBudgetService.calculateBudget(techMapId, companyId)`.
  2. Получить `budgetCap` и `contingency` из `TechMap`.
  3. Проверить: `(currentActual + currentPlanned + deltaCost) <= budgetCap * (1 + contingency)`.
  4. Если превышено → выбросить `BudgetExceededError`.
- [ ] Метод `isChangeAllowed(techMapId: string, changeType: ChangeOrderType)`:
  - Например, `CANCEL_OP` разрешен всегда, а `ADD_OP` требует проверки лимита.

### 3. Интеграция в AgronomAgent
- [ ] В `AgronomAgentService`:
  - При обработке намерения `generate_tech_map_draft` — вызвать `AgroDeterministicEngineFacade` для расчёта базовых параметров.
  - Добавить в `AgronomAgentResult` поле `mathBasis: ExplainableResult<any>[]`.
- [ ] В ответе чата (SupervisorAgent):
  - Если есть `mathBasis`, форматировать его как скрытый или разворачиваемый блок в `markdown`.

### 4. Тестирование
- [ ] Unit-тесты для `AgroDeterministicEngineFacade` (верификация правильности сбора переменных в `ExplainableResult`).
- [ ] Unit-тесты для `BudgetController` (случаи: в пределах лимита, превышение лимита, превышение с учетом contingency).

---

## Definition of Done (DoD)

- [ ] `tsc --noEmit` в `apps/api` — PASS
- [ ] Все тесты `rai-chat` и `tech-map` — PASS
- [ ] Новый файл `agro-deterministic.facade.ts` с 3 методами.
- [ ] Новый файл `budget-controller.service.ts` с защитной логикой.
- [ ] `AgronomAgent` возвращает ответ с заполненным `mathBasis`.
- [ ] Smoke: Попытка добавить операцию (через мок или тест), превышающую бюджет на 20%, приводит к ошибке.

---

## Тест-план (минимум)

```bash
# 1. Проверка типов
cd apps/api && pnpm exec tsc -p tsconfig.json --noEmit

# 2. Тесты фасада
pnpm test -- src/modules/rai-chat/deterministic/agro-deterministic.facade.spec.ts

# 3. Тесты бюджета
pnpm test -- src/modules/rai-chat/security/budget-controller.service.spec.ts

# 4. Проверка интеграции в AgronomAgent
pnpm test -- src/modules/rai-chat/agents/agronom-agent.service.spec.ts
```

---

## Что вернуть на ревью (ревью-пак)

1. Список новых файлов.
2. Вывод тестов `budget-controller` и `agro-deterministic.facade`.
3. Фрагмент кода `AgronomAgent`, где вызывается фасад.
4. Пример `JSON` ответа от `AgronomAgent` с заполненным `mathBasis`.
