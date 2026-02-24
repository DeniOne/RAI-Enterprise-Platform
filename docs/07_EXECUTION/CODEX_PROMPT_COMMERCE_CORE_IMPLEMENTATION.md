# CODEX PROMPT: INSTITUTIONAL COMMERCE & PARTY CORE IMPLEMENTATION (RAI ENTERPRISE)

## ВВЕДЕНИЕ ДЛЯ АССИСТЕНТА (CODEX)
Ты выступаешь в роли Senior Backend/Database Engineer (роль: CODER).
Твоя задача — перевести утвержденный 10/10 Enterprise Architectural Design в конкретный код (Prisma Schema, Types, API Services).

Мы строим **Institutional Core** платформы RAI Enterprise. Это не просто SaaS CRM, это ядро (Ledger + Документооборот), которое связывает воедино Коммерцию, Склады, Финансы и Экономику через строгий конвейер документов.

---

## ШАГ 1: ОБЯЗАТЕЛЬНОЕ ОЗНАКОМЛЕНИЕ С КОНТЕКСТОМ (ЧТЕНИЕ ФАЙЛОВ)
Прежде чем писать хотя бы строчку кода, ты **ОБЯЗАН** прочитать и понять следующие архитектурные контракты:
1. `f:\RAI_EP\docs\01_ARCHITECTURE\PARTY_MANAGEMENT_CONTRACT.md` (Узлы, Иерархии, Роли, Юрисдикции)
2. `f:\RAI_EP\docs\01_ARCHITECTURE\DOCFLOW_AND_BILLING_CONTRACT.md` (5 слоев документооборота и 9 архитектурных императивов)
3. `f:\RAI_EP\docs\10_FRONTEND_MENU_IMPLEMENTATION\18_ARCHITECTURE_COMMERCE_INTEGRATION_MAP.md` (Entity Graph и интеграция с другими модулями ERP)
4. `f:\RAI_EP\docs\10_FRONTEND_MENU_IMPLEMENTATION\17_BUTTON_Коммерция.md` (UX архитектура и 4-компонентное меню)

*Запрещено: додумывать архитектуру, использовать CRM-шаблоны или срезать углы. Если в `schema.prisma` появится поле `sellerId` в таблице `Contract` вместо использования `ContractPartyRole` — это архитектурный провал.*

---

## ШАГ 2: ПРОВЕРКА ФУНДАМЕНТАЛЬНЫХ ИНВАРИАНТОВ (FOUNDATION LAWS)

0. **КРИТИЧЕСКОЕ ПРАВИЛО (NAME COLLISION):**
   - В `schema.prisma` уже существуют legacy-модели `Contract` и `Obligation` (из старого CRM-модуля).
   - **СТРОГО ЗАПРЕЩЕНО** изменять их или пытаться к ним привязаться.
   - Все новые институциональные модели коммерческого ядра **обязаны** иметь префикс `Commerce` (`CommerceContract`, `CommerceObligation`, `CommerceFulfillmentEvent`) для безопасного side-by-side развертывания.

1. **Zero Trust Tenant Isolation (RLS ENFORCEMENT):**
   - В каждой таблице обязательно поле `companyId`.
   - Запрещены простые primary keys: везде `@@unique([companyId, id])`.
   - Foreign keys должны включать `companyId` (`[companyId, obligationId] references [companyId, id]`).
   - На уровне сервиса запрещены cross-tenant связи (`source.companyId == target.companyId`).

2. **Double-Entry Ledger Canon:**
   - CRM и Commerce хранят бизнес-документы. Ledger хранит неизменяемые финансовые контрольные события.
   - В `Invoice`: `ledgerTxId String? @unique`, инвариант `status == POSTED => ledgerTxId != null`.
   - В `Payment`: `ledgerTxId String? @unique`, инвариант `status == CONFIRMED => ledgerTxId != null`.

3. **5 слоев коммерции (строгая цепочка):**
   - `CommerceContract -> CommerceObligation -> CommerceFulfillmentEvent -> Invoice -> Payment`.
   - `Invoice.obligationId` **NOT NULL**.
   - `CommerceFulfillmentEvent.obligationId` **NOT NULL**.
   - `CommerceObligation.contractId` **NOT NULL**.

4. **Доменная изоляция (CommerceFulfillmentEvent Enums):**
   - `eventDomain`: `COMMERCIAL | PRODUCTION | LOGISTICS | FINANCE_ADJ`.
   - `eventType` в зависимости от домена:
     - `COMMERCIAL`: `GOODS_SHIPMENT`, `SERVICE_ACT`, `LEASE_USAGE`
     - `PRODUCTION`: `MATERIAL_CONSUMPTION`, `HARVEST`
     - `LOGISTICS`: `INTERNAL_TRANSFER`
     - `FINANCE_ADJ`: `WRITE_OFF`

5. **View-models & Regulatory:**
   - `StockMove`, `PaymentSchedule`, `RevenueRecognitionEvent` являются следствием базовых фактов.

---

## ШАГ 3: CHECKLIST ИМПЛЕМЕНТАЦИИ (ПЛАН ДЕЙСТВИЙ)

### БЛОК A: Имплементация схемы БД (Prisma)
- [x] **Добавить Party Management Models:** `Party`, `Jurisdiction`, `RegulatoryProfile`, `PartyRelation`.
- [x] **Добавить Contract Level 1 & 2:** `CommerceContract`, `CommerceContractPartyRole`, `CommerceObligation`, `BudgetReservation`, `PaymentSchedule`.
- [x] **Добавить Fulfillment Level 3:** `CommerceFulfillmentEvent`, `StockMove`, `RevenueRecognitionEvent`.
- [x] **Добавить Financial Level 4 & 5:** `Invoice`, `Payment`, `PaymentAllocation`.
- [x] **Добавить RegulatoryArtifact Lifecycle:** `RegulatoryArtifact` со статусами и `externalRefId`.
- [x] **Связать с Ledger:** `ledgerTxId` в `Invoice` и `Payment` + runtime-инварианты.
- [x] **Проверка миграций:** `prisma format`, `prisma validate`, миграции созданы и применены.

### БЛОК B: Базовые Domain Services
- [x] Реализована `isIntercompany(sellerPartyId, buyerPartyId, asOf)`.
- [x] Создан `CommerceContractService` (валидация ролей, без дублей).
- [x] Создан `FulfillmentService` (для `COMMERCIAL/GOODS_SHIPMENT` порождает `StockMove`).
- [x] Создан `BillingService` + `TaxEngine` interface.
- [x] Реализованы переходы `Invoice -> POSTED` и `Payment -> CONFIRMED` с `ledgerTxId`.

### БЛОК C: DTO & Validations
- [x] DTO для создания договора (включая массив ролей).
- [x] DTO для Fulfillment с доменной валидацией.

---

## ШАГ 4: КРИТЕРИИ ПРИЕМКИ (DEFINITION OF DONE)
1. База успешно генерируется и мигрируется на PostgreSQL.
2. В `schema.prisma` нет `sellerId/buyerId` в контексте Commerce договора; используются только роли.
3. Код покрыт tenant-изоляцией (`companyId`, композитные ключи, связки по `companyId`).
4. E2E runtime-кейс реализован и проходит:
   - создание `CommerceContract` (3 роли),
   - создание `CommerceObligation` (`DELIVER`),
   - создание `CommerceFulfillmentEvent` (`COMMERCIAL/GOODS_SHIPMENT`),
   - генерация `Invoice` (`taxSnapshotJson`),
   - `POST Invoice` -> создан `ledgerTx`,
   - создание `Payment`,
   - `CONFIRM Payment` -> создан `ledgerTx`,
   - проверка AR balance через `PaymentAllocation`.

---
*Действуй шаг за шагом. Если сомневаешься в домене или маппинге — останавливайся и эскалируй в TECHLEAD.*
