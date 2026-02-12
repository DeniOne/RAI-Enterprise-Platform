IMPL PLAN: Track 2 — Budget Vertical Slice (Financial Control)
Цель (TECHLEAD Design)
Внедрить финансовый контур управления в Consulting IA. Бизнес-инвариант: Нельзя начать производство (ACTIVE HarvestPlan), пока не заблокирован бюджет (LOCKED BudgetPlan). Это обеспечивает финансовую дисциплину и автоматический мониторинг перерасходов.

Требуется ревью пользователя (Product Owner)
IMPORTANT

Финансовый Гейт: Активация плана уборки требует наличия activeBudgetPlanId, где status === LOCKED. Версионность: При любой корректировке текущий LOCKED бюджет уходит в CLOSED, создается новый version + 1. LOCKED — всегда иммутабелен. Защита от флуда (Threshold Protection): Финансовое отклонение создается единожды при первом пересечении порога. Повторные синхронизации не плодят записи, пока отклонение открыто.

Проектируемые изменения
1. Data Layer (Prisma)
[NEW] 
BudgetPlan & BudgetItem
Model BudgetPlan:
id
, harvestPlanId, version (Int), status, totalPlannedAmount, totalActualAmount
status: DRAFT | APPROVED | LOCKED | CLOSED
techMapSnapshotId: Link to specific 
TechMap
 version used for calculation.
@@unique([harvestPlanId, version])
Model BudgetItem:
id
, budgetPlanId, category (Enum), plannedAmount, actualAmount
Model HarvestPlan:
[NEW] activeBudgetPlanId String? @unique
[RELATION] activeBudgetPlan BudgetPlan? @relation("ActiveBudgetPlan", fields: [activeBudgetPlanId], references: [id])
2. Service Layer (Business Logic)
[NEW] BudgetPlanService (apps/api/src/modules/consulting)
createBudget(planId)
: Создает DRAFT (version 1 или next). Агрегирует стоимости из MapResource привязанной ACTIVE техкарты.
transitionStatus(budgetId, event)
:
APPROVED -> LOCKED: Устанавливает HarvestPlan.activeBudgetPlanId = current.
LOCKED -> CLOSED: (Adjustment Trigger) Сбрасывает ссылку в HarvestPlan, позволяя создать новую версию.
syncActuals(budgetId): Итерирует по BudgetItem. Если actual > planned и нет открытого FINANCIAL_DEVIATION для этого плана -> DeviationService.create().
3. Domain Rules & Deviations
ConsultingDomainRules: Обновить 
canActivate(planId)
 — проверка plan.activeBudgetPlanId != null И status === LOCKED.
DeviationService: Добавить поддержку FINANCIAL_DEVIATION.
План верификации
Автоматизированные тесты
Budget Gate Test: Попытка активировать HarvestPlan с DRAFT бюджетом -> Ожидаем ForbiddenException.
FSM Integrity: Проверка, что после LOCKED нельзя менять plannedAmount.
Auto-Deviation: Имитация превышения бюджета -> Проверка создания записи в DeviationReview.
Ручная проверка
Создать техкарту -> Создать бюджет -> Согласовать -> Активировать план.
[TECHLEAD] Трэк 2 превращает RAI из простого планировщика операций в систему управления активами (Asset Management). Жду подтверждения для старта.