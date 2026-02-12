# IMPL PLAN: Track 1 — TechMap Integration (Production Gate)

## Цель
Сделать `TechMap` обязательным производственным контуром для активации `HarvestPlan`. Установить жесткий "Production Gate", где ни один план не может стать ACTIVE без валидной, утвержденной TechMap.

## Требуется ревью пользователя
> [!IMPORTANT]
> **Блокирующее изменение**: Внедрение `ActiveTechMapGuard` предотвратит активацию существующих планов, если у них нет TechMap.
> **Решение**: Мы предполагаем подход "Greenfield" для новых планов, либо потребуется скрипт миграции для старых (уточнить).

## Предлагаемые изменения

### 1. Data Layer (Prisma)
#### [x] [MODIFY] [schema.prisma](file:///f:/RAI_EP/packages/prisma-client/schema.prisma)
- **Enum `TechMapStatus`**: Обновить до `DRAFT`, `REVIEW`, `APPROVED`, `ACTIVE`, `ARCHIVED`.
- **Model `TechMap`**:
  - Проверка: `seasonId` уже `@unique` (1-к-1).
  - Добавить `approvedAt` (DateTime?).
  - Добавить `operationsSnapshot` (Json?) — для иммутабельного хранения утвержденных операционных норм.
  - Добавить `resourceNormsSnapshot` (Json?) — для иммутабельного хранения утвержденных лимитов.
  - *Примечание*: Мы сохраняем связи `MapStage` / `MapOperation` для редактирования (этап Draft/Project), но генерируем Snapshots при утверждении (Approval).

### 2. Domain & FSM
- **Локация**: `apps/api/src/modules/consulting`
#### [x] [NEW] [TechMapStateMachine](file:///f:/RAI_EP/apps/api/src/modules/consulting/fsm/tech-map.fsm.ts)
- Реализовать переходы статусов `TechMapStatus`.
- Внедрить RBAC: `DRAFT->REVIEW` (Manager), `REVIEW->APPROVED` (Agronomist/Admin), `APPROVED->ACTIVE` (CEO/Admin).

#### [x] [MODIFY] [ConsultingDomainRules](file:///f:/RAI_EP/apps/api/src/modules/consulting/domain/consulting.rules.ts)
- Добавить бизнес-правило: `canActivatePlan(harvestPlanId)` требует `TechMap.status === ACTIVE`.
- Добавить бизнес-правило: `ActiveTechMap` требует `approvedAt != null`.

#### [x] [MODIFY] [ConsultingService](file:///f:/RAI_EP/apps/api/src/modules/consulting/consulting.service.ts)
- В методе `activatePlan()`: вызывать `rules.canActivatePlan()`.


### 3. API Layer
#### [x] [NEW] [TechMapController](file:///f:/RAI_EP/apps/api/src/modules/consulting/controllers/tech-map.controller.ts)
- `POST /` (Создать черновик)
- `PATCH /:id/transition` (Переход по FSM)
- `GET /` (По Plan/Season)

## План верификации

### Автоматизированные тесты
- **Unit Tests**:
  - `tech-map.fsm.spec.ts`: Проверка всех переходов статусов и RBAC.
  - `consulting.rules.spec.ts`: Проверка, что `canActivatePlan` выбрасывает исключение, если TechMap отсутствует или не ACTIVE.
- **Integration Tests**:
  - `tech-map.e2e-spec.ts`: Полный поток (Создать Draft -> Рассмотреть -> Утвердить -> Активировать TechMap -> Активировать Plan).
  - Попытка активировать Plan *без* TechMap -> Ожидается 403/400.
  - **Uniqueness Check**: Нельзя иметь 2 ACTIVE TechMap для одного `fieldId + crop + seasonId + companyId`.

### Ручная верификация
1. Открыть Dashboard -> Consulting.
2. Создать новый Harvest Plan.
3. Попытаться нажать "Activate" -> Должно упасть с ошибкой.
4. Создать TechMap -> Утвердить -> Активировать.
5. Попытаться нажать "Activate" Harvest Plan снова -> Должно пройти успешно.
