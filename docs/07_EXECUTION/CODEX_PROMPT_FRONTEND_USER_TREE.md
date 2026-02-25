# CODEX PROMPT: ПОЛНОЕ ПОЛЬЗОВАТЕЛЬСКОЕ ДЕРЕВО ФРОНТА (RAI ENTERPRISE)

## ВВЕДЕНИЕ ДЛЯ АССИСТЕНТА (CODEX)

Ты выступаешь в роли Senior Full-Stack Engineer (роль: CODER).
Твоя задача — превратить текущий read-only фронтенд в **полноценный рабочий инструмент** для бизнеса.

**Ключевой принцип**: пользователь должен уметь пройти **каждый** бизнес-процесс end-to-end через UI.

---

## ⚠️ АРХИТЕКТУРНОЕ РЕШЕНИЕ: PARTY-FIRST

> **КРИТИЧЕСКИ ВАЖНО!** В системе существуют две модели контрагентов:
> - `Account` (таблица `accounts`) — **LEGACY CRM. ИЗОЛИРОВАН. НЕ ТРОГАТЬ.**
> - `Party` (таблица `commerce_parties`) — **ОСНОВНОЙ ДВИЖОК. ВСЁ СТРОИМ НА НЁМ.**
>
> `Account` остаётся в запасе для будущей миграции. Все новые UI-формы работают ТОЛЬКО с `Party`.
> **НЕТ FK между Account и Party** — это by design.

### Цепочка зависимостей (строгий порядок реализации):
```
1. Jurisdiction (справочник юрисдикций) — CRUD backend + frontend
2. RegulatoryProfile (регуляторные профили) — CRUD backend + frontend  
3. Party (контрагенты/юрлица) — CRUD backend + frontend
4. CommerceContract (договоры) — формы frontend (backend готов)
5. CommerceObligation → Fulfillment → Invoice → Payment (весь бизнес-цикл)
```

---

## ШАГ 0: ОБЯЗАТЕЛЬНОЕ ОЗНАКОМЛЕНИЕ С КОНТЕКСТОМ

1. `docs/01_ARCHITECTURE/PRINCIPLES/UI_DESIGN_CANON.md` (каноничный дизайн)
2. `apps/web/lib/api.ts` (API-клиент — нужно расширить)
3. `apps/web/lib/consulting/navigation-policy.ts` (навигация sidebar)
4. `apps/api/src/modules/commerce/commerce.controller.ts` (Commerce API)
5. `apps/api/src/modules/commerce/dto/*.dto.ts` (все 5 DTO)
6. `packages/prisma-client/schema.prisma` — модели: Party (4159), Jurisdiction (4115), RegulatoryProfile (4135)
7. `apps/web/app/consulting/crm/counterparties/page.tsx` (образец CRUD-страницы)

---

## ШАГ 1: ФУНДАМЕНТАЛЬНЫЕ ПРАВИЛА UI

- Шрифт: `Geist`. Заголовки: `font-medium`. **ЗАПРЕЩЕНО**: `font-bold`, `font-semibold`
- Карточки: `bg-white border border-black/10 rounded-2xl p-6`
- Кнопка primary: `bg-black text-white rounded-2xl px-6 py-3 font-medium`
- Inputs: `border border-black/10 rounded-lg px-4 py-2 font-normal`
- Фон: `bg-gray-50`. **Все тексты на русском языке**
- Формы: `react-hook-form` + `zod`. Запросы: через `api.ts` (axios)
- Состояния: loading, empty (EmptyState + CTA), error (сообщение + retry)

---

## БЛОК 0: PARTY MANAGEMENT (BACKEND + FRONTEND) — БЛОКЕР #1

> **Без этого блока Commerce не работает!** Party CRUD API **не существует** в backend.

### 0.1 Backend: Party CRUD API (NestJS)

Создать `apps/api/src/modules/commerce/party.controller.ts`:

| Endpoint | Метод | Описание |
|---|---|---|
| `/commerce/jurisdictions` | GET | Список юрисдикций компании |
| `/commerce/jurisdictions` | POST | Создать юрисдикцию (code, name) |
| `/commerce/regulatory-profiles` | GET | Список регуляторных профилей |
| `/commerce/regulatory-profiles` | POST | Создать профиль (code, name, jurisdictionId, rulesJson?) |
| `/commerce/parties` | GET | Список контрагентов (Party) компании |
| `/commerce/parties` | POST | Создать контрагента (legalName, jurisdictionId, regulatoryProfileId?) |
| `/commerce/parties/:id` | GET | Детали контрагента |
| `/commerce/parties/:id` | PATCH | Обновить контрагента |
| `/commerce/party-relations` | POST | Создать связь между Party (ownership, affiliation и т.д.) |

**DTO для Party**:
```typescript
// create-party.dto.ts
export class CreatePartyDto {
  @IsString() @IsNotEmpty()
  legalName!: string;

  @IsString() @IsNotEmpty()
  jurisdictionId!: string;

  @IsOptional() @IsString()
  regulatoryProfileId?: string;
}
```

**DTO для Jurisdiction**:
```typescript
// create-jurisdiction.dto.ts
export class CreateJurisdictionDto {
  @IsString() @IsNotEmpty()
  code!: string;  // "RU", "BY", "KZ"

  @IsString() @IsNotEmpty()
  name!: string;  // "Российская Федерация"
}
```

**Сервис**:
```typescript
// party.service.ts
@Injectable()
export class PartyService {
  constructor(private prisma: PrismaService) {}

  async listParties(companyId: string) {
    return this.prisma.party.findMany({
      where: { companyId },
      include: { jurisdiction: true, regulatoryProfile: true },
    });
  }

  async createParty(companyId: string, dto: CreatePartyDto) {
    return this.prisma.party.create({
      data: { companyId, ...dto },
      include: { jurisdiction: true },
    });
  }
  // ... getById, update, listJurisdictions, createJurisdiction, etc.
}
```

### 0.2 Frontend: Расширить `api.ts`

```typescript
// Добавить в api.ts
partyManagement: {
    // Юрисдикции
    jurisdictions: (companyId: string) =>
        apiClient.get(`/commerce/jurisdictions`, { params: { companyId } }),
    createJurisdiction: (data: { code: string; name: string; companyId: string }) =>
        apiClient.post('/commerce/jurisdictions', data),
    
    // Регуляторные профили
    regulatoryProfiles: (companyId: string) =>
        apiClient.get(`/commerce/regulatory-profiles`, { params: { companyId } }),
    createRegulatoryProfile: (data: { code: string; name: string; jurisdictionId: string; companyId: string }) =>
        apiClient.post('/commerce/regulatory-profiles', data),
    
    // Party (контрагенты)
    parties: (companyId: string) =>
        apiClient.get(`/commerce/parties`, { params: { companyId } }),
    createParty: (data: { legalName: string; jurisdictionId: string; regulatoryProfileId?: string; companyId: string }) =>
        apiClient.post('/commerce/parties', data),
    partyDetails: (partyId: string, companyId: string) =>
        apiClient.get(`/commerce/parties/${partyId}`, { params: { companyId } }),
    updateParty: (partyId: string, data: { legalName?: string; companyId: string }) =>
        apiClient.patch(`/commerce/parties/${partyId}`, data),
},
```

### 0.3 Frontend: UI «Контрагенты» (перестроить на Party)

**Секция в sidebar**: «Хозяйства и Контрагенты» → пункт «Контрагенты»
**Путь**: `/consulting/crm/counterparties` (или новый путь — решить)

**Экран «Реестр контрагентов»**:
- Таблица Party: legalName, jurisdiction.name, regulatoryProfile.name
- Кнопка «+ Добавить контрагента» → форма
- Поиск по legalName
- Фильтр по юрисдикции

**Форма создания контрагента (Party)**:
| Поле | Тип | Обязательное | Значения |
|---|---|---|---|
| Юридическое наименование | text | ✅ | свободный ввод |
| Юрисдикция | select | ✅ | из `GET /commerce/jurisdictions` |
| Регуляторный профиль | select | ❌ | из `GET /commerce/regulatory-profiles` |

**Экран настройки справочников** (доступен из настроек или inline):
- Управление юрисдикциями (CRUD)
- Управление регуляторными профилями (CRUD)

---

## БЛОК A: КОММЕРЦИЯ — CRUD ФОРМЫ (после Блока 0)

> **Бизнес-цикл**: Договор → Обязательство → Исполнение → Документ → Оплата
> Теперь select-ы Party заполнены, формы работают.

### Расширить `api.ts` секцию `commerce` (добавить POST/PATCH):

```typescript
commerce: {
    // GET (существуют)
    contracts: () => apiClient.get('/commerce/contracts'),
    fulfillment: () => apiClient.get('/commerce/fulfillment'),
    invoices: () => apiClient.get('/commerce/invoices'),
    payments: () => apiClient.get('/commerce/payments'),
    // POST/PATCH (новые)
    createContract: (data: {
        number: string; type: string; validFrom: string; validTo?: string;
        jurisdictionId: string; regulatoryProfileId?: string;
        roles: Array<{ partyId: string; role: string; isPrimary?: boolean }>;
    }) => apiClient.post('/commerce/contracts', data),
    createObligation: (data: { contractId: string; type: 'DELIVER'|'PAY'|'PERFORM'; dueDate?: string }) =>
        apiClient.post('/commerce/obligations', data),
    createFulfillment: (data: {
        obligationId: string; eventDomain: 'COMMERCIAL'|'PRODUCTION'|'LOGISTICS'|'FINANCE_ADJ';
        eventType: string; eventDate: string; batchId?: string; itemId?: string; uom?: string; qty?: number;
    }) => apiClient.post('/commerce/fulfillment-events', data),
    createInvoice: (data: {
        fulfillmentEventId: string; sellerJurisdiction: string; buyerJurisdiction: string;
        supplyType: 'GOODS'|'SERVICE'|'LEASE'; vatPayerStatus: 'PAYER'|'NON_PAYER'; subtotal: number; productTaxCode?: string;
    }) => apiClient.post('/commerce/invoices/from-fulfillment', data),
    postInvoice: (invoiceId: string) => apiClient.post(`/commerce/invoices/${invoiceId}/post`),
    createPayment: (data: {
        payerPartyId: string; payeePartyId: string; amount: number;
        currency: string; paymentMethod: string; paidAt?: string;
    }) => apiClient.post('/commerce/payments', data),
    confirmPayment: (paymentId: string) => apiClient.post(`/commerce/payments/${paymentId}/confirm`),
    allocatePayment: (data: { paymentId: string; invoiceId: string; allocatedAmount: number }) =>
        apiClient.post('/commerce/payment-allocations', data),
    arBalance: (invoiceId: string) => apiClient.get(`/commerce/invoices/${invoiceId}/ar-balance`),
},
```

### A.1 Договоры (`/commerce/contracts`)

Кнопка «+ Новый договор» → `/commerce/contracts/create`

**Форма**:
| Поле | Тип | Обязательное | Значения |
|---|---|---|---|
| Номер | text | ✅ | — |
| Тип | select | ✅ | SUPPLY, SERVICE, LEASE, AGENCY |
| Действует с / по | date | ✅ / ❌ | — |
| Юрисдикция | select | ✅ | `GET /commerce/jurisdictions` |
| Роли сторон | dynamic list | ✅ (min 1) | Party select + role enum + isPrimary |

Карточка `/commerce/contracts/[id]`: шапка + стороны + обязательства + действия

### A.2–A.5 (Обязательства, Исполнение, Документы, Оплаты)

*(Без изменений — формы и маппинги из предыдущей версии сохраняются)*

Маппинг домен → тип для Fulfillment:
- `COMMERCIAL`: GOODS_SHIPMENT, SERVICE_ACT, LEASE_USAGE
- `PRODUCTION`: MATERIAL_CONSUMPTION, HARVEST
- `LOGISTICS`: INTERNAL_TRANSFER
- `FINANCE_ADJ`: WRITE_OFF

---

## БЛОК B: CRM — ХОЗЯЙСТВА И ПОЛЯ (доработки)

> Legacy Account-based CRM **изолирован**. Хозяйства и поля продолжают работать через существующий API.

- **Реестр хозяйств**: починить 0/0/0/0, подключить `api.crm.farmsRegistry`
- **Поля/Объекты**: проверить `api.crm.fields()`
- **История сезонов**: проверить наличие данных

---

## БЛОК C–E: Финансы, Экономика, Стратегия, GR, Производство, Знания, Настройки

*(Без изменений — дашборды, подроуты, ModuleShell для модулей без API)*

---

## CHECKLIST ИМПЛЕМЕНТАЦИИ (ПРАВИЛЬНЫЙ ПОРЯДОК)

### БЛОК 0: Party Management (БЛОКЕР — ДЕЛАТЬ ПЕРВЫМ)
- [x] **Backend**: Создать `party.controller.ts` + `party.service.ts` + DTO
- [x] **Backend**: CRUD Jurisdiction (GET/POST)
- [x] **Backend**: CRUD RegulatoryProfile (GET/POST)
- [x] **Backend**: CRUD Party (GET/POST/PATCH + GET :id)
- [x] **Backend**: POST PartyRelation
- [x] **Frontend**: Расширить `api.ts` секцией `partyManagement`
- [x] **Frontend**: Перестроить UI «Контрагенты» на Party (вместо Account)
- [x] **Frontend**: Inline-управление справочниками (Jurisdiction, RegulatoryProfile)
- [x] **Seed**: Создать начальные юрисдикции (RU, BY, KZ) через миграцию или seed

### БЛОК A: Commerce CRUD (после Блока 0)
- [x] Расширить `api.ts` секцию `commerce` (POST/PATCH)
- [x] `/commerce/contracts/create` — форма + кнопка
- [x] `/commerce/contracts/[id]` — карточка + обязательства
- [x] `/commerce/fulfillment/create` — форма
- [x] `/commerce/invoices/create` — форма + кнопки «Провести», «AR»
- [x] `/commerce/payments/create` — форма + «Подтвердить» + «Разнести»

### БЛОК B: CRM доработки
- [x] Починить реестр хозяйств (0/0/0/0)
- [x] Проверить поля/объекты и историю сезонов

### БЛОК C–E: Остальные модули
- [x] Finance подроуты (4 страницы)
- [x] Economy подроуты (5 страниц)
- [x] Strategy подроуты (5 страниц)
- [x] GR/Production/Knowledge/Settings подроуты (20 страниц)
- [x] `navigation-policy.ts` обновить если нужно

---

## КРИТЕРИИ ПРИЁМКИ

1. **Party E2E**: Создать юрисдикцию → создать Party → увидеть в реестре
2. **Commerce E2E**: Договор → обязательство → исполнение → документ → проводка → оплата → подтверждение → аллокация → AR
3. **Ноль-404**: Каждый пункт sidebar ведёт на страницу
4. **UI Canon**: Geist, font-medium, нет font-bold, bg-white, русский язык
5. **Все формы**: react-hook-form + zod, loading/success/error

---

*Действуй строго по порядку: БЛОК 0 → A → B → C → D → E.*
