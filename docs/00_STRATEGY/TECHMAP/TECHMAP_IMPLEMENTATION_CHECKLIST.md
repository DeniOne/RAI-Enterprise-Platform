# TECHMAP IMPLEMENTATION — Мастер-Чеклист

> **Базис**: [GRAND_SYNTHESIS.md](file:///root/RAI_EP/docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md)
> **Дата старта**: 2026-03-03
> **Статус**: ACTIVE

## Рабочий протокол

> Регламент: [CURSOR SOFTWARE FACTORY — STARTER PROMPT](file:///root/RAI_EP/docs/CURSOR%20SOFTWARE%20FACTORY%20%E2%80%94%20STARTER%20PROMPT.md)

```
┌──────────────────────────────────────────────────────────┐
│  1. Orchestrator создаёт ПРОМТ: interagency/prompts/     │
│  2. Coder Agent создаёт ПЛАН: interagency/plans/         │
│  3. Orchestrator АКЦЕПТИРУЕТ план (ACCEPTED/WAITING)      │
│  4. Coder Agent КОДИТ по плану                           │
│  5. Orchestrator РЕВЬЮ по docs/REVIEW & FINALIZE PROMPT  │
│  6. Если ОК → ОТЧЁТ: interagency/reports/ → спринт CLOSED│
└──────────────────────────────────────────────────────────┘
```

---

## Sprint TM-1 — Data Foundation (Фундамент данных)

**Цель**: Привести Prisma-схему в соответствие с GRAND_SYNTHESIS ER-моделью. Добавить недостающие сущности и расширить существующие.

### TM-1.0 Промт и план
- [x] Создать промт: `interagency/prompts/2026-03-03_tm-1_data-foundation.md`
- [x] Кодер создаёт план: `interagency/plans/2026-03-03_tm-1_data-foundation.md`
- [x] Orchestrator акцептирует план → `ACCEPTED`

### TM-1.1 Новая модель: `SoilProfile`
- [x] Prisma: `model SoilProfile` — pH, гумус, NPK, S, B, микро, гранулометрия, provenance, confidence
- [x] Связь: `Field 1:N SoilProfile` (несколько анализов за разные годы)
- [x] Zod DTO: `SoilProfileCreateDto`, `SoilProfileResponseDto`
- [x] Enum: `SoilGranulometricType`
- [x] Unit-тест: Zod-валидация PASS

### TM-1.2 Новая модель: `RegionProfile`
- [x] Prisma: `model RegionProfile` — climate_type, GDD, осадки, индексы рисков, болезни/вредители, htc
- [x] Связь: `Farm.regionProfileId` — заготовлено (компания nullable)
- [x] Enum: `ClimateType`
- [x] Zod DTO — PASS
- [x] Seed: 3 профиля — отложено на пост-спринт (seed-скрипт вне scope TM-1)

### TM-1.3 Новая модель: `InputCatalog`
- [x] Prisma: `model InputCatalog` — все поля из промта
- [x] Enum: `InputType`
- [x] Zod DTO — PASS
- [x] Unit-тест PASS

### TM-1.4 Расширение `Field`
- [x] Добавлены: `slopePercent`, `drainageClass`, `protectedZoneFlags`, relation `soilProfiles`, `cropZones`
- [x] Миграция: db push PASS

### TM-1.5 Расширение `TechMap`
- [x] Добавлены: `budgetCapRubHa`, `contingencyFundPct`, `basePlanHash`, `changeOrderSlaHours`, `cropZoneId`
- [x] Миграция backward compatible PASS

### TM-1.6 Расширение `MapOperation`
- [x] Добавлены: `operationType`, BBCH-окна, `dateWindow*`, `weatherConstraints`, `dependencies`, `isCritical`, `executionProtocol`, `evidenceRequired`

### TM-1.7 Новая модель: `CropZone`
- [x] Prisma: `model CropZone` — все поля, tenant-scoped
- [x] Связь TechMap.cropZoneId PASS, старые fieldId/seasonId сохранены
- [x] Zod DTO PASS

### TM-1.8 Расширение `MapResource`
- [x] Добавлены: `inputCatalogId`, `plannedRateUnit`, `minRate`, `maxRate`, `applicationMethod`, BBCH-ограничения, `tankMixGroupId`

### TM-1.9 Новые enums (сводка)
- [x] `ClimateType`, `InputType`, `OperationType`, `ApplicationMethod`, `SoilGranulometricType` — все в Prisma schema

### TM-1.V Верификация спринта
- [x] `npx prisma validate` — PASS
- [x] `npx prisma db push` — PASS
- [x] `pnpm --filter api test` (адресно) — PASS 8/8 DTO тестов
- [x] `pnpm --filter api exec tsc --noEmit` — PASS
- [x] Orchestrator ревью: схема/типы/безопасность соответствуют GRAND_SYNTHESIS §2

### TM-1.R Результат
- [x] Ревью Orchestrator — **APPROVED**
- [x] Запись в `memory-bank/progress.md`
- [x] Спринт TM-1 — **CLOSED** ✅

---

## Sprint TM-2 — Operations DAG + Validation Engine

**Цель**: Операции как направленный ациклический граф (DAG) с математической валидацией.

### TM-2.0 Промт и план
- [x] Создать промт: `interagency/prompts/2026-03-03_tm-2_dag-validation.md`
- [ ] Кодер создаёт план: `interagency/plans/2026-03-03_tm-2_dag-validation.md`
- [ ] Orchestrator акцептирует план → `ACCEPTED`

### TM-2.1 OperationDependency модель
- [ ] Prisma: `model OperationDependency` — sourceOpId, targetOpId, type (FS/SS/FF), lag_min_days, lag_max_days
- [ ] Или: использовать `MapOperation.dependencies Json` из TM-1.6

### TM-2.2 DAGValidationService
- [ ] Класс: `DAGValidationService` в `modules/tech-map/validation/`
- [ ] Метод: `validateAcyclicity(operations[])` — обнаружение циклов
- [ ] Метод: `calculateCriticalPath(operations[])` — критический путь + буферы
- [ ] Метод: `detectResourceConflicts(operations[], availableMachinery[])` — ресурсные столкновения
- [ ] Unit-тесты: граф без циклов PASS, граф с циклом → ошибка

### TM-2.3 ValidationEngine (7 классов ошибок)
- [ ] Класс: `TechMapValidationEngine` в `modules/tech-map/validation/`
- [ ] Правило 1: `IncompatibleTankMix` → HARD_STOP
- [ ] Правило 2: `RateExceedsMax` → HARD_STOP
- [ ] Правило 3: `BBCHWindowViolation` → HARD_STOP
- [ ] Правило 4: `MissedCriticalOperation` → CRITICAL_WARNING
- [ ] Правило 5: `RegulatoryZoneViolation` → HARD_STOP
- [ ] Правило 6: `ResourceConflict` → WARNING
- [ ] Правило 7: `ActiveSubstanceOverdose` → HARD_STOP
- [ ] Unit-тесты: по 1 тесту на каждый класс ошибки (7 тестов)

### TM-2.4 TankMixCompatibilityService
- [ ] Класс: `TankMixCompatibilityService`
- [ ] Метод: `checkCompatibility(inputIds[])` → COMPATIBLE/CAUTION/INCOMPATIBLE
- [ ] Связка с `InputCatalog.incompatible_with`
- [ ] Unit-тест

### TM-2.5 Расчётные алгоритмы (калькуляторы)
- [ ] `SeedingRateCalculator` — норма высева (формула из GRAND_SYNTHESIS §3.2.1)
- [ ] `FertilizerDoseCalculator` — дозы N/P/K/S (формула из §3.2.3)
- [ ] `GDDWindowCalculator` — окна операций по GDD и RegionProfile (§3.2.2)
- [ ] Unit-тесты с конкретными числовыми примерами

### TM-2.V Верификация спринта
- [ ] Все новые unit-тесты PASS (целевое: ≥15 тестов)
- [ ] Существующие тесты не сломаны
- [ ] `tsc --noEmit` PASS
- [ ] Smoke: создать TechMap с 5 операциями → пропустить через ValidationEngine → 0 Hard Stops

### TM-2.R Результат
- [ ] Ревью Orchestrator — APPROVED
- [ ] Запись в `memory-bank/progress.md`
- [ ] Спринт TM-2 — **CLOSED**

---

## Sprint TM-3 — Evidence + ChangeOrder Protocol

**Цель**: Система доказательств исполнения и протокол изменений техкарты.

### TM-3.0 Промт и план
- [x] Создать промт: `interagency/prompts/2026-03-03_tm-3_evidence-changeorder.md`
- [ ] Кодер создаёт план: `interagency/plans/2026-03-03_tm-3_evidence-changeorder.md`
- [ ] Orchestrator акцептирует план → `ACCEPTED`

### TM-3.1 Evidence модель
- [ ] Prisma: `model Evidence` — observationId?, operationId?, type (enum EvidenceType), fileUrl, geoPoint?, capturedAt, capturedBy, checksum
- [ ] Enum: `EvidenceType` (PHOTO, VIDEO, GEO_TRACK, LAB_REPORT, INVOICE, CONTRACT, WEATHER_API_SNAPSHOT, SATELLITE_IMAGE)
- [ ] Zod DTO
- [ ] Связь: `MapOperation 1:N Evidence`, `FieldObservation 1:N Evidence`

### TM-3.2 ChangeOrder + Approval модели
- [ ] Prisma: `model ChangeOrder` — techMapId, versionFrom, versionTo, reason, changeType (enum), diffPayload, deltaCost, status, createdByUserId
- [ ] Enum: `ChangeOrderType` (SHIFT_DATE, CHANGE_INPUT, CHANGE_RATE, CANCEL_OP, ADD_OP)
- [ ] Enum: `ChangeOrderStatus` (DRAFT, PENDING, APPROVED, REJECTED)
- [ ] Prisma: `model Approval` — entityType, entityId, approverRole, decision, comment, decidedAt
- [ ] Zod DTO
- [ ] Unit-тесты: валидация DTO

### TM-3.3 ChangeOrderService
- [ ] Класс: `ChangeOrderService` в `modules/tech-map/change-order/`
- [ ] Метод: `createChangeOrder(techMapId, changeType, payload)` — создание ЗНИ
- [ ] Метод: `routeForApproval(changeOrderId)` — маршрутизация по ролям (deltaСost vs contingency_fund)
- [ ] Метод: `applyChangeOrder(changeOrderId)` — применение → version++
- [ ] Метод: `rejectChangeOrder(changeOrderId, reason)` — отклонение
- [ ] Интеграция с `TechMapStateMachine` (FSM transitions при ChangeOrder)
- [ ] Unit-тесты: создание → маршрутизация → применение → version увеличился

### TM-3.4 EvidenceService
- [ ] Класс: `EvidenceService`
- [ ] Метод: `attachEvidence(operationId, type, fileUrl, geoPoint?)` — привязка к операции
- [ ] Метод: `validateOperationCompletion(operationId)` — проверка наличия required evidence
- [ ] Поддержка checksum (SHA-256) для целостности файлов
- [ ] Unit-тест: операция без evidence_required → DONE; без evidence → блокировка

### TM-3.V Верификация спринта
- [ ] Все новые тесты PASS
- [ ] E2E flow: создать ChangeOrder → маршрутизация → approve → TechMap.version увеличился
- [ ] `tsc --noEmit` PASS
- [ ] `prisma validate` + `db push` OK

### TM-3.R Результат
- [ ] Ревью Orchestrator — APPROVED
- [ ] Запись в `memory-bank/progress.md`
- [ ] Спринт TM-3 — **CLOSED**

---

## Sprint TM-4 — Adaptive Rules + Regionalization

**Цель**: Второй контур техкарты — триггерно-адаптивная система и привязка к региональным профилям.

### TM-4.0 Промт и план
- [ ] Создать промт: `interagency/prompts/YYYY-MM-DD_tm-4_adaptive-rules.md`
- [ ] Кодер создаёт план: `interagency/plans/YYYY-MM-DD_tm-4_adaptive-rules.md`
- [ ] Orchestrator акцептирует план → `ACCEPTED`

### TM-4.1 AdaptiveRule модель
- [ ] Prisma: `model AdaptiveRule` — techMapId, triggerType, condition (Json), affectedOperationIds, changeTemplate (Json), requiresApprovalRole?
- [ ] Enum: `TriggerType` (WEATHER, NDVI, OBSERVATION, PHENOLOGY, PRICE)
- [ ] Zod DTO

### TM-4.2 TriggerEvaluationService
- [ ] Класс: `TriggerEvaluationService`
- [ ] Метод: `evaluateTriggers(techMapId, currentContext)` — проверка всех правил
- [ ] Метод: `applyTriggeredRule(ruleId)` → автоматическая генерация ChangeOrder
- [ ] Интеграция с `ChangeOrderService` из TM-3
- [ ] Unit-тесты: WEATHER trigger → ChangeOrder создан; PHENOLOGY trigger → окно закрыто

### TM-4.3 RegionProfileService
- [ ] Класс: `RegionProfileService`
- [ ] Метод: `getProfileForField(fieldId)` → RegionProfile
- [ ] Метод: `calculateSowingWindow(profileId, gddTarget)` → dateRange
- [ ] Метод: `suggestOperationsForRegion(profileId, cropType)` → базовый набор операций
- [ ] Unit-тесты

### TM-4.4 HybridPhenologyModel (подготовительная)
- [ ] Модель: `HybridPhenologyModel` — hybridId, gddToStage (Json: {bbch → gdd_required})
- [ ] Или: Json-поле в Rapeseed/CropVariety
- [ ] Метод: `predictBBCH(gddAccumulated, hybridId)` → текущая фаза

### TM-4.V Верификация спринта
- [ ] Тесты PASS
- [ ] Scenario тест: поле с regionProfile=MARITIME_HUMID → правильное окно посева
- [ ] `tsc --noEmit` PASS

### TM-4.R Результат
- [ ] Ревью Orchestrator — APPROVED
- [ ] Запись в `memory-bank/progress.md`
- [ ] Спринт TM-4 — **CLOSED**

---

## Sprint TM-5 — Economics + Contract Core

**Цель**: Финансовая модель техкарты и юридический слой (Contract Core с хэшированием).

### TM-5.0 Промт и план
- [ ] Создать промт: `interagency/prompts/YYYY-MM-DD_tm-5_economics-contract.md`
- [ ] Кодер создаёт план: `interagency/plans/YYYY-MM-DD_tm-5_economics-contract.md`
- [ ] Orchestrator акцептирует план → `ACCEPTED`

### TM-5.1 TechMapBudgetService
- [ ] Класс: `TechMapBudgetService`
- [ ] Метод: `calculateBudget(techMapId)` → BudgetLine[] по категориям (SEEDS, FERTILIZERS, PESTICIDES, FUEL, LABOR, RENT, LOGISTICS, ANALYSES)
- [ ] Метод: `checkOverspend(techMapId)` → перерасходы с автогенерацией ChangeOrder
- [ ] Референсные данные: доли бюджета из GRAND_SYNTHESIS §5.3.1
- [ ] Unit-тесты: бюджет ≤ cap → OK; бюджет > cap → ChangeOrder

### TM-5.2 TechMapKPIService
- [ ] Класс: `TechMapKPIService`
- [ ] Метод: `calculateKPIs(techMapId)` → все KPI из §5.3.2 (C_ha, C_t, margin, variance)
- [ ] Метод: `recalculate(techMapId)` — пересчёт при изменении фактических данных
- [ ] Unit-тесты: корректность формул

### TM-5.3 ContractCoreService
- [ ] Класс: `ContractCoreService`
- [ ] Метод: `generateContractCore(techMapId)` → JSON структура подписываемой части
- [ ] Метод: `hashContractCore(core)` → SHA-256 хэш → `TechMap.base_plan_hash`
- [ ] Метод: `verifyIntegrity(techMapId)` → current hash == stored hash
- [ ] Unit-тесты: hash детерминирован, integrity pass/fail

### TM-5.4 RecalculationEngine
- [ ] Класс: `RecalculationEngine`
- [ ] Метод: `onTrigger(techMapId, event)` — пересчёт C_ha, C_t, Risk-Adjusted Margin в реальном времени
- [ ] Интеграция с `TriggerEvaluationService` из TM-4
- [ ] Unit-тест

### TM-5.V Верификация спринта
- [ ] Тесты PASS
- [ ] E2E: создать TechMap → рассчитать бюджет → hash Contract Core → проверить integrity
- [ ] `tsc --noEmit` PASS

### TM-5.R Результат
- [ ] Ревью Orchestrator — APPROVED
- [ ] Запись в `memory-bank/progress.md`
- [ ] Спринт TM-5 — **CLOSED**

---

## Пост-спринты: Консолидация

### TM-POST.1 Консолидация TechMapService
- [ ] Объединить `modules/tech-map/tech-map.service.ts` и `modules/consulting/tech-map.service.ts`
- [ ] Единый сервис в `modules/tech-map/`, consulting-модуль импортирует
- [ ] Тесты PASS

### TM-POST.2 Миграция Season → CropZone
- [ ] Сделать `Season` глобальным (не привязанным к Field)
- [ ] `CropZone` становится primary связкой для TechMap
- [ ] Миграция данных: существующие Season → CropZone

### TM-POST.3 Rapeseed → CropVariety (мультикультурность)
- [ ] Переименовать/расширить `Rapeseed` → `CropVariety`
- [ ] Поддержка множественных культур через `CropType` enum
- [ ] Миграция данных

### TM-POST.4 UI — TechMap Workbench v2
- [ ] Обновить `TechMapWorkbench.tsx` для работы с DAG операций
- [ ] Визуализация зависимостей между операциями
- [ ] Evidence upload UI
- [ ] ChangeOrder workflow UI

### TM-POST.5 Документация
- [ ] Обновить `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts`
- [ ] Создать API-документацию для новых endpoints
- [ ] Обновить memory-bank

---

## Сводка статусов

| Sprint | Статус | Кол-во задач | Промт | План | Код | Ревью |
|--------|--------|-------------|-------|------|-----|-------|
| TM-1 | ✅ DONE | 11 | ✅ | ✅ | ✅ | ✅ |
| TM-2 | ⬜ TODO | 7 | ✅ | ⬜ | ⬜ | ⬜ |
| TM-3 | ⬜ TODO | 6 | ⬜ | ⬜ | ⬜ | ⬜ |
| TM-4 | ⬜ TODO | 6 | ⬜ | ⬜ | ⬜ | ⬜ |
| TM-5 | ⬜ TODO | 6 | ⬜ | ⬜ | ⬜ | ⬜ |
| POST | ⬜ TODO | 5 | — | — | ⬜ | ⬜ |

**Легенда**: ⬜ TODO | 🔄 IN PROGRESS | ✅ DONE | ❌ BLOCKED
