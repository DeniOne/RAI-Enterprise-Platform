# Ревью-пак — A_RAI F1-3: BudgetController + AgroDeterministicEngineFacade

**Дата:** 2026-03-04  
**Decision-ID:** AG-ARAI-F1-003  
**Промт:** `interagency/prompts/2026-03-04_a_rai-f1-3_budget-deterministic-bridge.md`

---

## 1. Список изменённых/новых файлов

| Файл | Действие |
|------|----------|
| `apps/api/src/modules/rai-chat/deterministic/explainable-result.types.ts` | добавлен |
| `apps/api/src/modules/rai-chat/deterministic/agro-deterministic.facade.ts` | добавлен |
| `apps/api/src/modules/rai-chat/deterministic/agro-deterministic.facade.spec.ts` | добавлен |
| `apps/api/src/modules/rai-chat/security/budget-exceeded.error.ts` | добавлен |
| `apps/api/src/modules/rai-chat/security/budget-controller.service.ts` | добавлен |
| `apps/api/src/modules/rai-chat/security/budget-controller.service.spec.ts` | добавлен |
| `apps/api/src/modules/rai-chat/agents/agronom-agent.service.ts` | изменён (mathBasis, фасад) |
| `apps/api/src/modules/rai-chat/agents/agronom-agent.service.spec.ts` | изменён (facade, проверка mathBasis) |
| `apps/api/src/modules/rai-chat/rai-chat.module.ts` | изменён (провайдеры facade, BudgetController) |
| `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` | изменён (AgroDeterministicEngineFacade в провайдерах) |
| `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` | изменён (AgroDeterministicEngineFacade в провайдерах) |

---

## 2. Вывод `tsc --noEmit`

```
cd apps/api && pnpm exec tsc -p tsconfig.json --noEmit
# Exit code: 0 — PASS
```

---

## 3. Вывод целевых тестов

```bash
pnpm test -- src/modules/rai-chat/deterministic/agro-deterministic.facade.spec.ts
pnpm test -- src/modules/rai-chat/security/budget-controller.service.spec.ts
pnpm test -- src/modules/rai-chat/agents/agronom-agent.service.spec.ts
```

- **agro-deterministic.facade.spec.ts:** PASS (3 describe, 3 теста).
- **budget-controller.service.spec.ts:** PASS (5 тестов: в пределах лимита, превышение, NotFound, isChangeAllowed CANCEL_OP/ADD_OP).
- **agronom-agent.service.spec.ts:** PASS (в т.ч. проверка `mathBasis` при generate_tech_map_draft).

Полный прогон `rai-chat` + `tech-map`: 39 suites passed; один воркер (rai-chat.service.spec) при параллельном запуске получил SIGKILL; при `--runInBand` все тесты rai-chat проходят.

---

## 4. Фрагмент кода AgronomAgent: вызов фасада

```typescript
// apps/api/src/modules/rai-chat/agents/agronom-agent.service.ts
const mathBasis: ExplainableResult<unknown>[] = [];
try {
  const seeding = this.agroFacade.computeSeedingRate({
    targetDensityMlnHa: 1.2,
    thousandSeedWeightG: 4.5,
    labGerminationPct: 95,
    fieldGerminationPct: 85,
  });
  mathBasis.push(seeding as ExplainableResult<unknown>);
} catch {
  // дефолтные параметры могут не подходить — не ломаем ответ
}
return {
  // ...
  mathBasis: mathBasis.length > 0 ? mathBasis : undefined,
};
```

---

## 5. Пример JSON ответа AgronomAgent с mathBasis

При успешном `generate_tech_map_draft` поле `mathBasis` заполняется одним элементом (норма высева):

```json
{
  "agentName": "AgronomAgent",
  "status": "COMPLETED",
  "data": { "draftId": "tm-1", "status": "DRAFT", "fieldRef": "f1", "seasonRef": "s1", "crop": "rapeseed", "missingMust": [], "tasks": [], "assumptions": [] },
  "confidence": 0.6,
  "missingContext": [],
  "explain": "Черновик создан детерминированно. LLM-агроном не подключён.",
  "toolCallsCount": 1,
  "traceId": "tr1",
  "mathBasis": [
    {
      "value": 6.69,
      "formula": "(targetDensityMlnHa × 1e6 × thousandSeedWeightG / 1000) / (labGerm × fieldGerm / 10000) / 1000 → кг/га",
      "variables": { "targetDensityMlnHa": 1.2, "thousandSeedWeightG": 4.5, "labGerminationPct": 95, "fieldGerminationPct": 85 },
      "unit": "кг/га",
      "explanation": "Норма высева рассчитана по целевой густоте 1.2 млн/га, МТС 4.5 г, всхожесть лаб/полевая 95%/85%. Коэффициент всхожести 0.8075."
    }
  ]
}
```

---

## 6. Smoke: превышение бюджета

В тесте `validateTransaction выбрасывает BudgetExceededError при превышении лимита`:
- Лимит = 10000 ₽/га × 10 га × (1 + 0.1) = 110 000 ₽.
- Текущие planned = 80 000, deltaCost = 50 000 → projected = 130 000 ₽.
- Ожидаемо выбрасывается `BudgetExceededError` с `limitRub ≈ 110000`, `projectedRub = 130000`.

---

## 7. Соответствие ограничениям

- **Математика только детерминированная:** расчёты идут через `AgroDeterministicEngineFacade` → калькуляторы из `tech-map/calculators`.
- **Бюджетный лимит:** `BudgetControllerService.validateTransaction` использует `budgetCapRubHa`, `contingencyFundPct`, area; при превышении — `BudgetExceededError`.
- **companyId:** только из `actorContext`, не из payload.
- **Чистота кода:** фасад не дублирует логику калькуляторов, только оборачивает в `ExplainableResult`.

---

**Статус:** READY_FOR_REVIEW.
