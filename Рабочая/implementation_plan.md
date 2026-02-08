# Канонический План: Front-Office Data Portal & Asset Registry

## архитектурный статус: ПОДТВЕРЖДЕНО (Расширенный скоп Фазы Бета+)

## 1. Концепция: Front-Office как Портал Данных
Бэк-офис — это "Мозг" (принятие решений на основе моделей).
Фронт-офис (Telegram) — это "Сенсоры" и "Портал наполнения".

### 1.1. Принципы наполнения (AI-Driven Ingestion)
- **Zero-Wizard UI:** Отказ от сложных команд и форм в ТГ. Агроном просто скидывает фото (трактора, мешка химии, накладной) или называет модель голосом.
- **Agentic Recognition:** Backend-агенты (Vision/LLM) распознают объект и извлекают атрибуты (Brand, Model, Type, Quantity).
- **Draft Asset Pattern:** Все распознанные сущности создаются со статусом `PENDING_CONFIRMATION`. Это "черновик", не влияющий на техкарту до подтверждения.
- **Idempotency Gate:** Хеширование входящих медиа-файлов и проверка серийных номеров внутри ClientId для предотвращения дублей ("один трактор — один ассет").
- **Asset Accountability (Canon):** Каждый подтвержденный актив должен содержать `confirmedByUserId` и `confirmedAt`.
- **Archive-First Rejection:** При отказе ("❌ Нет") объект не удаляется, а переводится в статус `REJECTED` с указанием причины, чтобы предотвратить повторное предложение того же объекта.
- **❗ Правило повторного предложения (Repeat Guard):** 
    - Если `idempotencyKey` (хеш медиа) уже в статусе `REJECTED` — полное игнорирование (запрет спама).
    - Если `serialNumber` совпадает с `REJECTED`, но медиа новое — предложение с флагом `[ПОВТОРНОЕ РАСПОЗНАВАНИЕ]`.

---

## 2. Предлагаемые изменения (Implementation)

### 2.1. Реестры Активов (Prereq for TechMap)
- **[PRISMA] [schema.prisma](file:///f:/RAI_EP/packages/prisma-client/schema.prisma):**
    - `model Machinery`: Техника, оборудование, состояние.
    - `model StockItem`: Остатки (Химия, Семена, Удобрения).
    - `model StockTransaction`: История движений.
- **[ENGINE] [IntegrityGateService](file:///f:/RAI_EP/apps/api/src/modules/integrity/integrity-gate.service.ts#19-311)**:
    - Внедрение `Admission Gate` для активации техкарт: `checkResourceSufficiency()`.

### 2.2. Front-Office Portal (AI Transport)
- **[TELEGRAM] [telegram.update.ts](file:///f:/RAI_EP/apps/api/src/modules/telegram/telegram.update.ts)**:
    - Полный проброс `photo` и `voice` с контекстом `REGISTRATION` (если нет активной задачи).
- **[GATE] [IntegrityGateService](file:///f:/RAI_EP/apps/api/src/modules/integrity/integrity-gate.service.ts#19-311)**:
    - Триггер [RegistryAgentService](file:///f:/RAI_EP/apps/api/src/modules/integrity/registry-agent.service.ts#12-196) при получении неструктурированного контента.
- **[AGENT] [RegistryAgentService](file:///f:/RAI_EP/apps/api/src/modules/integrity/registry-agent.service.ts#12-196) [NEW]**:
    - Обертка над Vision/LLM для идентификации активов.
    - Маппинг распознанных сущностей в [Machinery](file:///f:/RAI_EP/apps/api/src/modules/integrity/registry-agent.service.ts#83-129) или `StockItem`.

---

## 3. Схема данных (Beta+)

```prisma
enum MachineryType {
  TRACTOR
  SPRAYER
  HARVESTER
  ATTACHMENT
  TRUCK
}

enum AssetStatus {
  ACTIVE
  REPAIR
  OFFLINE
  PENDING_CONFIRMATION // [LAW] Статус для объектов, распознанных ИИ
  REJECTED             // [REFINEMENT] Объект отклонен пользователем
  ARCHIVED             // [REFINEMENT] Объект выведен из эксплуатации
}

model Machinery {
  id              String   @id @default(cuid())
  name            String
  brand           String?
  serialNumber    String?  // [IDEMPOTENCY] Ключ для предотвращения дублей
  type            MachineryType
  status          AssetStatus @default(PENDING_CONFIRMATION)
  
  idempotencyKey  String?  @unique // Хеш фото/запроса
  
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  createdAt       DateTime @default(now())
  
  // Accountability & Reject Path
  confirmedByUserId String?
  confirmedByUser   User?    @relation("MachineryConfirmedBy", fields: [confirmedByUserId], references: [id])
  confirmedAt       DateTime?
  
  archivedAt        DateTime?
  rejectionReason   String?
}

enum StockItemType {
  CHEMICAL
  FERTILIZER
  SEED
  FUEL
}

model StockItem {
  id              String   @id @default(cuid())
  name            String
  type            StockItemType
  status          AssetStatus @default(PENDING_CONFIRMATION)
  quantity        Float    @default(0)
  unit            String
  
  idempotencyKey  String?  @unique
  
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])

  // Accountability & Reject Path
  confirmedByUserId String?
  confirmedByUser   User?    @relation("StockItemConfirmedBy", fields: [confirmedByUserId], references: [id])
  confirmedAt       DateTime?
  
  archivedAt        DateTime?
  rejectionReason   String?
}
```

---

---

## 5. Admission Rules: Контроль активации техкарт [NEW]

Для активации техкарты (`DRAFT` -> `ACTIVE`) система обязана проверить физическую готовность ресурсов.

### 5.1. Усиление схемы (Refinement)
- **[PRISMA] `MapOperation`**: Добавить поле `requiredMachineryType: MachineryType?` для связи планирования с реестром техники.

### 5.2. Алгоритм Admission Rules ([IntegrityGateService](file:///f:/RAI_EP/apps/api/src/modules/integrity/integrity-gate.service.ts#19-311))
1. **Проверка Техники (Machinery Readiness):**
    - Для каждой операции, имеющей `requiredMachineryType`, проверить наличие в `MachineryRegistry` хотя бы одного устройства этого типа со статусом `ACTIVE`.
    - Если техника в `REPAIR` или `OFFLINE` -> Блокировка + `CMRRisk (CRITICAL)`.
2. **Проверка ТМЦ (Stock Sufficiency):**
    - Сравнить суммарное количество запланированных ресурсов (`MapResource`) с фактическими остатками в `StockItem`.
    - **Порог 90%:** `SUCCESS`.
    - **Порог 50-90%:** `WARNING` (Активация разрешена + `CMRRisk (MEDIUM)`).
    - **Ниже 50%:** `BLOCK` + `CMRRisk (HIGH)`.

### 5.3. Механика в TechMapService
```typescript
async activate(id: string) {
  const result = await this.integrityGate.validateTechMapAdmission(id);
  if (!result.success) throw new TechMapAdmissionException(result.issues);
  return this.prisma.techMap.update({ where: { id }, data: { status: 'ACTIVE' } });
}
```

## 7. Conversational Confirmation (Паттерн "Логические ответы") [NEW]

В соответствии с принципом **Zero-Wizard UI**, ручное подтверждение ассетов происходит через текстовый диалог, а не через кнопки.

### 7.1. Telegram Bot (Sensory Plane)
- **[MODIFY] [telegram.update.ts](file:///f:/RAI_EP/apps/api/src/modules/telegram/telegram.update.ts)**: Добавить обработчик `@On('text')`.
- **Логика:** Любое текстовое сообщение, если оно не является командой меню, пересылается в [createObservation](file:///f:/RAI_EP/apps/api/src/modules/field-observation/field-observation.service.ts#22-81) с типом `TEXT` (или `CALL_LOG` / `PHOTO` в зависимости от контекста).

### 7.2. Integrity Gate & Registry Agent (Brain)
- **Intent Classifier:** В [IntegrityGateService](file:///f:/RAI_EP/apps/api/src/modules/integrity/integrity-gate.service.ts#19-311) добавить простейший классификатор (RegExp/LLM), который помечает сообщения "ок", "да", "подтверждаю", "согласен" как `ObservationIntent.CONFIRMATION`.
- **Logic Confirmation:**
    - При получении `CONFIRMATION` найти последний ассет в статусе `PENDING_CONFIRMATION` от этого автора/компании.
    - Перевести ассет в `ACTIVE`.
    - Установить `confirmedByUserId` и `confirmedAt`.
    - Отправить уведомление в ТГ: "✅ Актив [Название] успешно добавлен в реестр."

## 8. Clarification: Phase Beta AI Scope

- [x] **Asset Ingestion (Техника/ТМЦ):** Текущий спринт. Фокус на Conversational UI и Registry Integrity.
- [ ] **Vision AI (Болезни/Вредители):** Финал Беты (Sprint B7). Требует интеграции с Vision-моделями для анализа патологий по фото.
