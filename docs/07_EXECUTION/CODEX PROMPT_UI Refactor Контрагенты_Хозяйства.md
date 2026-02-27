# CODEX PROMPT — UI Refactor “Контрагенты/Хозяйства” (CANONICAL)

## 0) Контекст и цель (НЕ ОБСУЖДАЕТСЯ)

Ты рефакторишь фронтенд так, чтобы:

- **Контрагент** = `Party` (субъект права).
- **Хозяйство** = `Asset` типа `FARM` (операционный актив).
- **Запрещено** создавать/редактировать хозяйство из формы создания контрагента как “встроенный блок” (никаких “Совпадает с юрлицом / отдельное хозяйство”).
- Любое созданное хозяйство всегда отображается в **Реестре хозяйств** (`Assets:FARM`).
- Холдинги/иерархии/управляющие компании РФ реализуются через `PartyRelation` и `AssetPartyRole` с `validFrom`/`validTo`.

**Ожидаемый эффект**: UI перестаёт смешивать сущности → реестры не разъезжаются → связи становятся детерминированными → РФ-сценарии (несколько юрлиц на одно хозяйство, аренда, УК) поддерживаются штатно.

---

## 1) Канонические сущности (UI НЕ ИМЕЕТ ПРАВА ИХ ПЕРЕОПРЕДЕЛЯТЬ)

### Party (Контрагент)
- **Типы**: `HOLDING` | `LEGAL_ENTITY` | `IP` | `KFH` | `MANAGEMENT_CO` | `BANK` | `INSURER` | `PERSON?`
- **Атрибуты профиля (минимум)**: `id`, `type`, `legalName`, `shortName?`, `jurisdictionId`, `status`, `comment?`
- **Реквизиты** — отдельно (динамическая схема по юрисдикции).

### Asset (Актив)
- **Типы**: `FARM` | `FIELD` | `OBJECT`
- **FARM** — реестр хозяйств.

### Связи
- **PartyRelation (Party↔Party)**: `OWNERSHIP` | `MANAGEMENT` | `AFFILIATED` | `AGENCY`
  - **Поля**: `id`, `fromPartyId`, `toPartyId`, `relationType`, `sharePct?`, `validFrom`, `validTo?`, `basisDocId?`
- **AssetPartyRole (Asset↔Party)**: `OWNER` | `OPERATOR` | `LESSEE` | `MANAGER` | `BENEFICIARY`
  - **Поля**: `id`, `assetId`, `partyId`, `role`, `validFrom`, `validTo?`

---

## 2) Негативные требования (СТОП-ЛИСТ, нарушение = провал задачи)

**Запрещено**:
1. Поля хозяйства внутри формы `Party` (“Хозяйство* совпадает/отдельное”, “Группа/холдинг хозяйства” как текст и т.п.).
2. Хранить `holdingName` или `groupName` строкой на `FARM`/`Party` вместо relations.
3. Создавать `FARM` без явной записи в `Assets` реестре.
4. Дублировать “хозяйство” как `Party`.
5. Делать UI-бизнес-логику: любые derived вычисления делай через query/API read-model.

---

## 3) Новая инфоархитектура страниц и роутов (СДЕЛАЙ ТОЧНО)

**Раздел меню: “Хозяйства и Контрагенты”**
- `/parties` — Реестр контрагентов (`Party`)
- `/assets/farms` — Реестр хозяйств (`Asset:FARM`)
- `/assets/fields` — поля (`Asset:FIELD`)
- `/assets/objects` — объекты (`Asset:OBJECT`)

### Страницы Party
- `/parties/new` — мастер создания `Party`
- `/parties/:id` — карточка `Party` с вкладками:
  - Profile
  - Requisites
  - Structure (`PartyRelation` tree)
  - Assets (все `FARM`/`FIELD`/`OBJECT` связанные через `AssetPartyRole`)
  - Contacts
  - BankAccounts
  - Documents (заглушка/подготовка)

### Страницы FARM
- `/assets/farms/new` — мастер создания `FARM`
- `/assets/farms/:id` — карточка хозяйства:
  - Profile
  - Roles (`AssetPartyRole`: `OWNER`/`OPERATOR`/`LESSEE`/`MANAGER`)
  - Fields (список полей в хозяйстве)
  - History/Seasons (если уже есть модуль)

---

## 4) UI Компоненты (НАЗВАНИЯ + ОТВЕТСТВЕННОСТЬ)

### Общие
`PageHeader`, `Tabs`, `DataTable`, `EntityCard`, `SidePanelForm`, `ConfirmDialog`

### Parties
- `PartiesPage.tsx` — таблица + фильтры
- `PartyCreateWizard.tsx` — шаги: `Type` → `Jurisdiction` → `Identity/Requisites seed` → `Optional relation attach`
- `PartyDetailsPage.tsx`
- `PartyProfileTab.tsx`
- `PartyRequisitesTab.tsx` — рендер динамики по юрисдикции
- `PartyStructureTab.tsx` — дерево relations
- `PartyStructureTree.tsx`
- `RelationEditorDrawer.tsx` (create/update relation)
- `PartyAssetsTab.tsx`
- `LinkedAssetsTable.tsx` (derived)
- `AssignAssetRoleDrawer.tsx` (создать AssetPartyRole)
- `PartyBankAccountsTab.tsx`
- `PartyContactsTab.tsx`

### Farms
- `FarmsPage.tsx` — таблица + derived колонки
- `FarmCreateWizard.tsx` — шаги: `Farm profile` → `Assign roles` (`OPERATOR` минимум) → `Done`
- `FarmDetailsPage.tsx`
- `FarmProfileTab.tsx`
- `FarmRolesTab.tsx`
- `AssetRolesTable.tsx`
- `AssetRoleEditorDrawer.tsx`
- `FarmFieldsTab.tsx`

---

## 5) DTO/Typescript контракты (СОЗДАЙ И ИСПОЛЬЗУЙ ВО ВСЕХ КОМПОНЕНТАХ)

### Base Types
```typescript
export type PartyType = 'HOLDING'|'LEGAL_ENTITY'|'IP'|'KFH'|'MANAGEMENT_CO'|'BANK'|'INSURER';
export type PartyRelationType = 'OWNERSHIP'|'MANAGEMENT'|'AFFILIATED'|'AGENCY';
export type AssetType = 'FARM'|'FIELD'|'OBJECT';
export type AssetPartyRole = 'OWNER'|'OPERATOR'|'LESSEE'|'MANAGER'|'BENEFICIARY';
```

### Party DTO
```typescript
export interface PartyDto {
  id: string;
  type: PartyType;
  legalName: string;
  shortName?: string;
  jurisdictionId: string;
  status: 'ACTIVE'|'FROZEN';
  comment?: string;
}
```

### PartyRelation DTO
```typescript
export interface PartyRelationDto {
  id: string;
  fromPartyId: string;
  toPartyId: string;
  relationType: PartyRelationType;
  sharePct?: number;            // required for OWNERSHIP
  validFrom: string;            // ISO date
  validTo?: string;             // ISO date
  basisDocId?: string;
}
```

### Asset DTO
```typescript
export interface AssetDto {
  id: string;
  type: AssetType;
  name: string;
  regionCode?: string;
  status: 'ACTIVE'|'ARCHIVED';
}

export interface FarmDto extends AssetDto {
  type: 'FARM';
  holdingDerivedName?: string;  // READ MODEL ONLY (never writable)
}
```

### AssetPartyRole DTO
```typescript
export interface AssetPartyRoleDto {
  id: string;
  assetId: string;
  partyId: string;
  role: AssetPartyRole;
  validFrom: string;
  validTo?: string;
}
```

### Read Models (derived views)
```typescript
export interface PartyListItemVm extends PartyDto {
  holdingDerivedName?: string;
  farmsCount?: number;
}

export interface FarmListItemVm extends FarmDto {
  operatorParty?: { id: string; name: string };
  ownerParty?: { id: string; name: string };
  holdingDerivedName?: string;
  hasLease?: boolean;
}
```

**Правило**: *Derived* поля только read-only, не редактируются формами.

---

## 6) Derived Queries (ОБЯЗАТЕЛЬНО, UI НЕ СЧИТАЕТ “САМ”)

### Parties list
- `GET /api/parties?type=&jurisdictionId=&q=`
- возвращает `PartyListItemVm[]`
- `holdingDerivedName` считается сервером через `PartyRelation asOf=now`

### Party details
- `GET /api/parties/:id` → `PartyDto`
- `GET /api/parties/:id/relations` → `PartyRelationDto[]`
- `GET /api/parties/:id/assets` → `{ assets: AssetDto[], roles: AssetPartyRoleDto[] }` или готовый VM

### Farms list
- `GET /api/assets/farms?q=&holdingId=&operatorId=&hasLease=`
- возвращает `FarmListItemVm[]`
- **derived**: `operator`/`owner`/`hasLease`/`holdingDerivedName` — сервер

### Farm details
- `GET /api/assets/farms/:id` → `FarmDto`
- `GET /api/assets/:id/roles` → `AssetPartyRoleDto[]`
- `GET /api/assets/farms/:id/fields` → `AssetDto[]` (`FIELD`)

---

## 7) Инварианты (ЖЁСТКИЕ ПРАВИЛА, ПРОВЕРКИ НА UI + API)

### PartyRelation invariants
- `OWNERSHIP` требует `sharePct` (0 < pct ≤ 100)
- Запрет циклов в графе `OWNERSHIP` и `MANAGEMENT`
- В один момент времени не должно быть двух активных `OWNERSHIP` отношений одного типа, создающих противоречие для одного и того же `toPartyId` (уточни правило, но минимум: не допусти дубли “тот же from->to + type” по пересечению дат)
- `validFrom` < `validTo`, если `validTo` задан

### AssetPartyRole invariants (РФ-дружелюбные)
- Для `FARM` обязателен минимум один активный `OPERATOR` на текущую дату (или блокируй “Publish/Activate” до назначения).
- Разреши несколько ролей одновременно (`OWNER` + `OPERATOR` + `MANAGER` + `LESSEE`).
- Дубликаты одной роли с пересечением дат для пары `assetId`+`partyId`+`role` запрещены.
- `validFrom` < `validTo`, если задано.

### UI invariants
- В `PartyCreateWizard` нет ни одного поля про хозяйство.
- В `FarmCreateWizard` нет полей про “юр. наименование” и реквизиты — только актив и назначение ролей.
- Все “derived” поля отображаются как `badges`/`readonly`.

---

## 8) Рефактор текущего экрана со скрина (ТОЧНОЕ ПРЕОБРАЗОВАНИЕ)

### Было (неправильно)
Новый контрагент содержит блок **Хозяйство*** + “совпадает/отдельное”.

### Станет (правильно)
- `/parties/new` — создаёт только `Party`.
- `/assets/farms/new` — создаёт только `FARM`.
- Связка “какие хозяйства у контрагента” делается через:
  - `/parties/:id` → вкладка **Assets** → `AssignAssetRoleDrawer` (создаёт `AssetPartyRole`)
- В реестре хозяйств `/assets/farms` любая запись `FARM` видна всегда.

---

## 9) Acceptance Criteria (ПРОВЕРКА ГОТОВНОСТИ, СДЕЛАЙ САМ)

Считай задачу выполненной только когда:

### UI
- В меню есть отдельные реестры: **Parties** и **Farms**.
- Создание `Party` не содержит ни одного поля/радиокнопки/блока про хозяйства.
- Создание `Farm` заканчивается тем, что `Farm` появляется в `/assets/farms`.
- В карточке `Party` вкладка **Assets** показывает связанные `FARM` и позволяет назначать роли.
- В карточке `Farm` вкладка **Roles** показывает роли и позволяет добавлять/редактировать сроки.

### Data correctness
- Derived колонки (`Holding`/`Operator`/`Owner`/`HasLease`) в реестре хозяйств корректно отображаются и не редактируются.
- Невозможно создать пересекающиеся по датам дубликаты ролей для одной пары `asset`+`party`+`role`.
- Невозможно создать `OWNERSHIP` relation без `sharePct`.

### Tests (минимальный набор)
Юнит/интеграционные тесты на:
- запрет пересечения ролей по датам
- обязательность `OPERATOR` для `FARM` (на уровне “активации” или на уровне создания — выбери и зафиксируй)
- запрет циклов `OWNERSHIP` (если уже есть сервис — дерни его, иначе заглуши и отметь `TODO`)

---

## 10) План внедрения (чтобы не поломать текущие данные)

1. Оставь существующие API, добавь новые read-model endpoints для derived.
2. Сделай UI refactor страниц и роутов.
3. Добавь миграционный “compat layer”:
   - если раньше `Farm` создавался внутри `Party` — создай миграцию, которая:
     - выделяет `FARM` в `Asset`
     - создаёт `AssetPartyRole` `OPERATOR`/`OWNER` по логике старых полей
     - чистит “group/holding” строковые поля (или помечает deprecated)
4. Проставь редиректы со старых роутов на новые.

---

## 11) Стиль и дисциплина (INSTITUTIONAL UI)

- Никакой бизнес-логики в UI: только формы/валидация/отображение.
- Все сложные вычисления (`holdingDerivedName`, `operatorParty`, `hasLease`, `farmsCount`) — серверные read-models.
- Таблицы, вкладки, дроверы, мягкие границы, consistent spacing. Без “гигантских форм-простыней”.

---

## OUTPUT FORMAT (что ты должен вернуть кодом)

- Новые/обновлённые страницы и роуты.
- Компоненты вкладок и дроверов.
- TS типы `DTO`/`VM`.
- API client функции (`fetchers`/`hooks`).
- Обновление меню/навигации.
- Минимальные тесты на инварианты.
- Миграционный план/скрипт (или заметка `TODO` с точным местом).

---

## Важная финальная инструкция Codex

**Сгенерируй код так, чтобы:**
- `Party` и `Farm` никогда не смешивались,
- реестр хозяйств был источником истины,
- все связи работали через `relations`/`roles` с валидностью во времени,
- `derived` вычисления были read-models.