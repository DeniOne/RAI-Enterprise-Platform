# PROMPT — TechMap Sprint TM-3: Evidence + ChangeOrder Protocol
Дата: 2026-03-03
Статус: active
Приоритет: P1

## Цель
Реализовать систему цифровых доказательств исполнения операций (`Evidence`) и протокол изменений техкарты (`ChangeOrder` + `Approval`). Это второй контроль качества исполнения: операция НЕ МОЖЕТ получить статус DONE без цифровых доказательств, любое отклонение от плана оформляется через ChangeOrder с маршрутизацией по ролям.

**Предусловие**: Sprint TM-2 закрыт — существуют `DAGValidationService`, `TechMapValidationEngine`, `TankMixCompatibilityService` и 3 калькулятора в `apps/api/src/modules/tech-map/`.

## Контекст
- Технический базис: `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §4 (Юридическая и операционная модель)
- Мастер-чеклист: `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` (Sprint TM-3)
- Decision-ID будет зарегистрирован Orchestrator при акцепте плана

**Ключевые цитаты из GRAND_SYNTHESIS §4:**

### Протокол ChangeOrder (§4.2)
```
Триггер (Observation/Weather/KPI/AI)
    │
    ▼
Формирование ChangeOrder (автоматически)
    │─── change_type: SHIFT_DATE|CHANGE_INPUT|CHANGE_RATE|CANCEL_OP|ADD_OP
    │─── diff_payload: машиночитаемый diff
    │─── Delta Cost: прогноз финансового влияния
    │
    ▼
Маршрут согласования (по ролям)
    │─── Если Delta ≤ contingency_fund → Агроном утверждает
    │─── Если Delta > contingency_fund → Финансовый директор
    │
    ▼
Применение → Новая версия TechMap (version++)
    │─── Аудитный след: кто/когда/почему/на основании чего
```

Классификация масштаба:
- **Микро** (±3 дня, смена трактора): только Агроном
- **Существенное** (смена СЗР, норма >5%): Агроном + Директор
- **Критическое** (превышение Budget Cap, отмена критической операции): переподписание Contract Core

### Evidence (§4.3)
Операция с `is_critical=true` НЕ МОЖЕТ получить статус DONE без:
1. Телеметрия подтверждает покрытие ≥98% площади (GEO_TRACK)
2. Складская система регистрирует акты списания (INVOICE)
3. Агроном прикрепляет фото пост-чека (PHOTO)

Типы Evidence: `PHOTO, VIDEO, GEO_TRACK, LAB_REPORT, INVOICE, CONTRACT, WEATHER_API_SNAPSHOT, SATELLITE_IMAGE`

**Гарантия целостности**: `Evidence.checksum` — SHA-256 контрольная сумма файла.

## Ограничения (жёстко)
- **Tenant isolation**: все новые модели и сервисы обязательно имеют `companyId`, фильтрация — только через него
- **Не трогать**: UI (`apps/web`), Prisma TM-1 поля, API-контроллеры (только сервисы), домены вне TechMap
- **Не трогать**: FSM (`TechMapStateMachine`) напрямую — добавить hook-методы, а не переписывать FSM
- **Append-only логика**: ChangeOrder и Evidence — только создание; изменение статуса через отдельный метод; нет прямых UPDATE записей после создания
- **Scope**: только `apps/api/src/modules/tech-map/` + `packages/prisma-client/schema.prisma`

## Задачи (что сделать)

### 1. Новая Prisma-модель: `Evidence`

```prisma
model Evidence {
  id              String        @id @default(cuid())
  operationId     String?
  operation       MapOperation? @relation(fields: [operationId], references: [id])
  observationId   String?       // будущая Observation модель
  evidenceType    EvidenceType
  fileUrl         String
  geoPoint        Json?         // { lat, lng }
  capturedAt      DateTime
  capturedByUserId String?
  checksum        String        // SHA-256 файла
  metadata        Json?         // доп.данные (coverage_pct, lab_number и т.д.)
  companyId       String
  company         Company       @relation(fields: [companyId], references: [id])
  createdAt       DateTime      @default(now())

  @@index([operationId])
  @@index([companyId])
  @@map("evidence")
}

enum EvidenceType {
  PHOTO
  VIDEO
  GEO_TRACK
  LAB_REPORT
  INVOICE
  CONTRACT
  WEATHER_API_SNAPSHOT
  SATELLITE_IMAGE
}
```

- Добавить `evidence Evidence[]` в `MapOperation`

### 2. Новые Prisma-модели: `ChangeOrder` + `Approval`

```prisma
enum ChangeOrderType {
  SHIFT_DATE
  CHANGE_INPUT
  CHANGE_RATE
  CANCEL_OP
  ADD_OP
}

enum ChangeOrderStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

model ChangeOrder {
  id                  String            @id @default(cuid())
  techMapId           String
  techMap             TechMap           @relation(fields: [techMapId], references: [id])
  versionFrom         Int
  versionTo           Int?
  changeType          ChangeOrderType
  reason              String
  diffPayload         Json              // { before: {...}, after: {...} }
  deltaCostRub        Float?            // прогноз изменения стоимости
  status              ChangeOrderStatus @default(DRAFT)
  triggeredByObsId    String?           // observation_id, если автоматически
  approvals           Approval[]
  createdByUserId     String?
  appliedAt           DateTime?
  companyId           String
  company             Company           @relation(fields: [companyId], references: [id])
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([techMapId])
  @@index([companyId])
  @@index([status])
  @@map("change_orders")
}

enum ApproverRole {
  AGRONOMIST
  DIRECTOR
  LEGAL
  FINANCE
}

enum ApprovalDecision {
  APPROVED
  REJECTED
}

model Approval {
  id              String            @id @default(cuid())
  changeOrderId   String
  changeOrder     ChangeOrder       @relation(fields: [changeOrderId], references: [id])
  approverRole    ApproverRole
  approverUserId  String?
  decision        ApprovalDecision?
  comment         String?
  decidedAt       DateTime?
  companyId       String
  company         Company           @relation(fields: [companyId], references: [id])
  createdAt       DateTime          @default(now())

  @@index([changeOrderId])
  @@index([companyId])
  @@map("approvals")
}
```

- Добавить `changeOrders ChangeOrder[]` в TechMap
- Добавить `changeOrders ChangeOrder[]`, `approvals Approval[]` в Company

### 3. Zod DTO новых моделей
Файлы в `apps/api/src/modules/tech-map/dto/`:
- `evidence.dto.ts` — `EvidenceCreateDto`, `EvidenceResponseDto`
  - `fileUrl`: URL-валидация
  - `checksum`: `z.string().regex(/^[a-f0-9]{64}$/)` (SHA-256 hex)
  - `capturedAt`: `z.coerce.date()`
- `change-order.dto.ts` — `ChangeOrderCreateDto`, `ChangeOrderResponseDto`
  - `deltaCostRub`: optional number
  - `diffPayload`: `z.record(z.unknown())`
- `approval.dto.ts` — `ApprovalCreateDto`, `ApprovalDecisionDto`

С unit-тестами: `*.dto.spec.ts` по 2 теста каждый (happy path + validation error).

### 4. `EvidenceService`
Файл: `apps/api/src/modules/tech-map/evidence/evidence.service.ts`

```typescript
@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  // Прикрепить доказательство к операции
  async attachEvidence(
    dto: EvidenceCreateDto,
    companyId: string,
  ): Promise<Evidence>

  // Проверить наличие обязательных Evidence для операции
  // Возвращает список отсутствующих типов
  async validateOperationCompletion(
    operationId: string,
    companyId: string,
  ): Promise<{
    isComplete: boolean
    missingEvidenceTypes: EvidenceType[]
    presentEvidenceTypes: EvidenceType[]
  }>

  // Получить все Evidence для операции
  async getByOperation(operationId: string, companyId: string): Promise<Evidence[]>
}
```

**Логика `validateOperationCompletion`**:
1. Загрузить `MapOperation.evidenceRequired` (JSON-массив EvidenceType)
2. Загрузить все `Evidence` для этого `operationId`
3. `isComplete = missingTypes.length === 0`
4. Если `evidenceRequired` null или пустой — `isComplete = true` (операция не требует доказательств)

**Unit-тесты** (`evidence.service.spec.ts`):
- [ ] Операция без `evidenceRequired` → `isComplete: true`
- [ ] Операция с `evidenceRequired: ['PHOTO', 'GEO_TRACK']`, только PHOTO прикреплено → `isComplete: false`, missing: ['GEO_TRACK']
- [ ] Все required Evidence прикреплены → `isComplete: true`
- [ ] `attachEvidence` создаёт запись с правильным `companyId`

### 5. `ChangeOrderService`
Файл: `apps/api/src/modules/tech-map/change-order/change-order.service.ts`

```typescript
@Injectable()
export class ChangeOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fsm: TechMapStateMachine,
  ) {}

  // Создать ChangeOrder в статусе DRAFT
  async createChangeOrder(
    techMapId: string,
    dto: ChangeOrderCreateDto,
    companyId: string,
  ): Promise<ChangeOrder>

  // Маршрутизация: определить нужных апруверов и создать Approval-записи
  // Правило: deltaCostRub > contingency_fund → добавить FINANCE; всегда AGRONOMIST
  async routeForApproval(
    changeOrderId: string,
    companyId: string,
  ): Promise<Approval[]>

  // Принять решение по конкретному Approval
  async decideApproval(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    comment: string | undefined,
    approverUserId: string,
    companyId: string,
  ): Promise<Approval>

  // Применить ChangeOrder: check all Approvals = APPROVED → version++ → status APPROVED
  async applyChangeOrder(
    changeOrderId: string,
    companyId: string,
  ): Promise<{ techMapVersion: number }>

  // Отклонить ChangeOrder (если хоть один Approval = REJECTED)
  async rejectChangeOrder(
    changeOrderId: string,
    reason: string,
    companyId: string,
  ): Promise<ChangeOrder>
}
```

**Логика `routeForApproval`**:
```
contingency = TechMap.contingencyFundPct * TechMap.budgetCapRubHa * CropZone.field.area
if (deltaCostRub > contingency) → approvers: [AGRONOMIST, FINANCE]
else → approvers: [AGRONOMIST]
```

**Логика `applyChangeOrder`**:
1. Проверить все `Approval.decision === 'APPROVED'` (нет ни одного REJECTED или null)
2. Инкрементировать `TechMap.version`
3. Установить `ChangeOrder.versionTo = new_version`, `appliedAt = now()`, `status = APPROVED`
4. **Не менять** FSM-статус техкарты напрямую — только версию

**Unit-тесты** (`change-order.service.spec.ts`):
- [ ] `createChangeOrder` создаёт CO со статусом DRAFT
- [ ] `routeForApproval`: delta ≤ contingency → 1 Approval (AGRONOMIST)
- [ ] `routeForApproval`: delta > contingency → 2 Approval (AGRONOMIST + FINANCE)
- [ ] `applyChangeOrder`: все одобрены → version++ 
- [ ] `applyChangeOrder`: есть REJECTED → бросает ошибку
- [ ] `rejectChangeOrder` → статус REJECTED, `appliedAt` остаётся null

### 6. Регистрация в `TechMapModule`
```typescript
providers: [
  TechMapService,
  TechMapStateMachine,
  DAGValidationService,
  TechMapValidationEngine,
  TankMixCompatibilityService,
  EvidenceService,      // NEW
  ChangeOrderService,   // NEW
],
exports: [TechMapService, EvidenceService, ChangeOrderService],
```

### 7. Создать поддиректории
```
apps/api/src/modules/tech-map/evidence/
apps/api/src/modules/tech-map/change-order/
```

## Definition of Done (DoD)
- [ ] `npx prisma validate` — PASS
- [ ] `npx prisma db push` — PASS
- [ ] `pnpm --filter api exec tsc --noEmit` — PASS
- [ ] Новые unit-тесты: ≥ 16 суммарно:
  - EvidenceService: ≥ 4 теста
  - ChangeOrderService: ≥ 6 тестов
  - Zod DTO: ≥ 6 тестов (3 файла × 2)
- [ ] Адресный прогон новых тестов PASS
- [ ] Все новые модели: `companyId` + `@@index([companyId])`
- [ ] Все операции с изменением TechMap.version оставляют аудитный след (appliedAt, createdByUserId)

## Тест-план (минимум)
```bash
# 1. Схема
bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma validate'
bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma db push'

# 2. TypeScript
pnpm --filter api exec tsc --noEmit

# 3. Новые тесты (адресно)
cd apps/api && npx jest --runInBand src/modules/tech-map/evidence/
cd apps/api && npx jest --runInBand src/modules/tech-map/change-order/
cd apps/api && npx jest --runInBand src/modules/tech-map/dto/evidence.dto.spec.ts src/modules/tech-map/dto/change-order.dto.spec.ts src/modules/tech-map/dto/approval.dto.spec.ts

# 4. Регрессия
pnpm --filter api test -- --passWithNoTests
```

## Что вернуть на ревью
**Новые файлы:**
- `packages/prisma-client/schema.prisma` (diff: Evidence, ChangeOrder, Approval, enums)
- `apps/api/src/modules/tech-map/evidence/evidence.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/change-order/change-order.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/dto/evidence.dto.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/dto/change-order.dto.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/dto/approval.dto.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/tech-map.module.ts` (diff)

**Логи:** prisma validate, db push, tsc, jest (адресный + регрессия)
