# 🧭 Track 5 — Yield & KPI Engine
## RAI Enterprise Platform — Consulting Core v3

---

# 🎯 Цель

Добавить слой измерения результата производства.

Execution отвечает: "Сделали ли?"
Budget отвечает: "Не перерасходовали ли?"
Yield & KPI отвечает: "Было ли это эффективно?"

UI и Backend должны реализовать Yield Engine + KPI Read Model без нарушения архитектурных принципов:

Service = IO  
Orchestrator = Brain  
UI = Read Model  
Domain Logic не утекает в UI  

---

# 🏗 1️⃣ Database Layer (Prisma)

[MODIFY] schema.prisma

## Новая модель: HarvestResult

model HarvestResult {
  id              String   @id @default(uuid())
  planId          String
  seasonId        String
  companyId       String

  fieldId         String
  crop            String

  plannedYield    Float?   // ц/га
  actualYield     Float?   // ц/га

  harvestedArea   Float?   // га
  totalOutput     Float?   // тонн

  qualityClass    String?
  harvestDate     DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

Индексы:
- planId + seasonId + companyId
- fieldId

---

# 🧠 2️⃣ Backend — YieldService

[NEW] apps/api/src/modules/consulting/yield.service.ts

Методы:

createOrUpdateHarvestResult(dto)
getHarvestResultByPlan(planId)
getCompanyYieldSummary(companyId, seasonId)

Валидация:
- Проверка companyId isolation
- Нельзя сохранять данные для неактивного плана (через DomainRules)

---

# 📊 3️⃣ KPI Engine (Read Model)

[NEW] apps/api/src/modules/consulting/kpi.service.ts

KPI — только вычисления. Никаких мутаций.

Методы:

calculatePlanKPI(planId)
calculateCompanyKPI(companyId, seasonId)

---

## KPI для плана:

- plannedYield
- actualYield
- yieldDelta (%)
- totalBudget
- totalActualCost
- costPerTon
- profitPerHectare
- ROI

---

## Формулы (MVP):

yieldDelta = (actualYield - plannedYield) / plannedYield * 100

costPerTon = totalActualCost / totalOutput

profitPerHectare =
  (totalOutput * marketPrice - totalActualCost) / harvestedArea

ROI =
  (Revenue - Cost) / Cost * 100

---

# 🔗 4️⃣ Интеграция с Execution

KPI не должен напрямую зависеть от ExecutionService.

Источник данных:

- BudgetPlan (actualAmount)
- StockTransaction
- HarvestResult

Никаких прямых вызовов ExecutionService.

---

# 🌐 5️⃣ API

[NEW] routes:

GET /consulting/yield/plan/:id
GET /consulting/kpi/plan/:id
GET /consulting/kpi/company/:id

Все endpoints read-only.

---

# 🖥 6️⃣ Frontend

## [NEW] yield/page.tsx

Форма ввода:

- Плановая урожайность
- Фактическая урожайность
- Площадь
- Валовый сбор
- Класс качества

Сохранение через POST/PUT.

---

## [MODIFY] plans/page.tsx

Добавить новый блок в Cockpit:

### 📊 Yield & KPI

Показывать:

- Урожайность (план/факт)
- Отклонение %
- Себестоимость 1 тонны
- ROI
- Прибыль на гектар

Цветовая семантика:

🟢 Если ROI > 0  
🟡 Если ROI ~ 0  
🔴 Если ROI < 0  

---

# 🎨 UI Правила

- Использовать существующий Status Block Pattern
- Никакого font-bold
- Все тексты на русском
- Tooltip при отсутствии HarvestResult
- Если HarvestResult нет → отображать "Нет данных по урожаю"

---

# 🔐 7️⃣ Domain Protection

HarvestResult нельзя редактировать если:

- План в статусе ARCHIVED
- Сезон закрыт

Проверка через DomainRules.

---

# 🧪 8️⃣ Verification Plan

Automated:

- Создание HarvestResult
- Расчёт KPI при корректных данных
- ROI корректно считается
- Деление на 0 обрабатывается

Manual:

- Ввести урожай
- Проверить изменение KPI
- Проверить цветовую индикацию
- Проверить company isolation

---

# 📈 Definition of Done

- HarvestResult сохраняется корректно
- KPI рассчитывается детерминированно
- UI отображает Yield & KPI в Plan Cockpit
- Нет бизнес-логики в UI
- Нет прямой зависимости KPI от ExecutionService
- Нет нарушения архитектурных аксиом

---

# 🧠 Стратегический результат

После внедрения:

Платформа замыкает полный цикл:

Plan → Production → Budget → Execution → Yield → KPI → Advisory

Система становится:

Операционно + Финансово + Производственно измеримой.

---

END OF TRACK 5 PROMPT
