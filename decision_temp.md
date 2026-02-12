
---

## TRACK5-YIELD-001

**Дата:** 2026-02-12  
**Автор:** TECHLEAD (AI)  
**Статус:** ACCEPTED  

### Решение
Внедрение Yield & KPI Engine для замыкания цикла "Планирование -> Производство -> Результат".
Создание модели `HarvestResult` и сервисов аналитики.

### Scope
- **Phase:** Gamma
- **Sprint:** 7
- **Компоненты:**
  - `packages/prisma-client/schema.prisma` (HarvestResult)
  - `apps/api/src/modules/consulting/yield.service.ts`
  - `apps/api/src/modules/consulting/kpi.service.ts`
  - `apps/web/src/app/consulting/yield/page.tsx`

### Технические ограничения
1. **Multi-tenancy:** `companyId` обязателен и извлекается только из JWT.
2. **Architecture:** `KpiService` — Read Model, без мутаций. `YieldService` — мутации с проверкой через `DomainRules`.
3. **Isolation:** KPI не зависит от `ExecutionService` напрямую.

### Definition of Done
- [x] `HarvestResult` добавлен в схему.
- [ ] ROI и Себестоимость рассчитываются детерминированно.
- [ ] UI Cockpit отображает KPI блок.
- [ ] Тесты на деление на 0 и изоляцию тенантов проходят.

### Связанные документы
- `Рабочая/implementation_plan.md`
- `SECURITY_CANON.md`
- `UI_DESIGN_CANON.md`
