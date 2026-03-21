---
id: DOC-ARV-ARCHIVE-SPEC-AGENT-FIRST-RAI-EP-1FZG
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# RAI_EP — Agent-First / Chat-First Spec (v1)
Дата: 2026-02-28  
Статус: LAW (исполняется как контракт разработки)

---

## 0. Product Law
**RAI — результатный агро-оператор.**  
Главный артефакт системы: **TechMap (Техкарта) по каждому полю** — исполняемая программа сезона (по времени, операциям, экономике, регенеративным корректировкам).  
CRM/контрагенты/склад/финансы/дашборды — обслуживающая инфраструктура вокруг TechMap.

**Цель:** максимизация урожая → максимизация прибыли клиента → performance-доход RAI при минимизации вреда природе.

---

## 1. Interaction Law (2026)
### 1.1 Telegram = Field Terminal (Free Chat)
Telegram — свободный чат + голос + фото/видео.  
**Минимум кнопок и команд.** Пользователь пишет/говорит “как человеку”.

Агент обязан:
1) превращать любой вход в **EventDraft** (структурированный черновик),
2) задавать **только MUST-уточнения** (1–2 вопроса за шаг),
3) фиксировать событие **только через Confirm**.

**Единственные универсальные кнопки:**
- ✅ Confirm (commit)
- ✏️ Fix (уточнить/исправить)
- 🔗 Link (привязать к полю/задаче/хозяйству)

### 1.2 Control Plane Web (Minimal)
Один экран: **Chat + Reactive Panel**  
- Left: chat (полный контекст страницы)
- Right: рендер “ситуативных виджетов” из structured payload агента

UI остаётся только для:
- Map/NDVI (геопространство)
- Mass Import (CSV/Excel)
- External Reports (PDF/таблицы для банков/партнёров)
- Rare Settings / Approvals Inbox

---

## 2. Core Agents (v1)
### 2.1 SupervisorAgent (Orchestrator)
- маршрутизация интентов к под-агентам
- enforcement RBAC + RiskGate
- запуск Quorum/TechCouncil при R3/R4 или критических отклонениях
- единый протокол explainability (Surface/Analytical/Forensic)

### 2.2 Two Pillars (equal importance)
**A_RAI-agronom (Generative Architect)**  
- генерирует/уточняет TechMap, регенеративные корректировки, варианты действий

**A_RAI-controller (Reactive Controller)**  
- real-time план/факт, отклонения, прогнозы, алерты, рекомендации  
- пушит reactive metrics / cards в Control Plane  
- инициирует TechCouncil при критике

### 2.3 Supporting Agents (v1 scope)
- **A_RAI-crm**: регистрация сущностей (Party/Farm/Field/Season) через Draft→Commit
- **A_RAI-economist** (phase later): Δ/маржа/ROI, performance fee
- **A_RAI-logistic** (phase later): СЗР/техника/склад/поставки под TechMap
- **A_RAI-researcher** (phase later): Лаба/WarRoom/улучшение будущих TechMap

---

## 3. Data Model Law: Carcass + Flex (No Anarchy)
### 3.1 Carcass (hard tables, canonical relations)
Минимальный жёсткий каркас (таблицы/модели):
- Party
- Farm
- Field
- Season
- TechMap
- TechMapTask
- Observation/Event
- Deviation
- Alert
- Decision / Approval (Quorum)

### 3.2 Flex Layer (JSONB attributes)
Любые плавающие реквизиты/параметры храним в JSONB (`attrs`), но **под SchemaKey**.

Каждое поле/атрибут имеет metadata:
- `provenance` (source: dadata | user_text | voice_stt | photo_ai | import | system)
- `confidence` (0..1)
- `updatedBy` (userId/agentId)
- `updatedAt`
- `schemaKey`

**Rule:** Carcass хранит identity/связи/статусы, Flex — расширение. MUST-валидация всегда проверяется по SchemaKey.

---

## 4. Jurisdictions / Currency / Crops (MVP)
### 4.1 Jurisdictions
Start: **RU, BY, KZ**

### 4.2 Currencies
**RUB / BYN / KZT / USD / EUR**

### 4.3 Crops (MVP)
**Рапс / Подсолнечник** (дальше расширяем)

---

## 5. Contracts & Validation: 70/30 + Draft→Commit (Hard Gate)
### 5.1 Readiness Rule
- MUST fields = “70%” (операционно-юридический минимум)
- OPTIONAL = “30%” (можно позже)

**Commit запрещён**, пока `missingMust[]` не пуст.

### 5.2 Draft Lifecycle
Любая сущность создаётся через:
- `DRAFT_BLOCKED` (есть missingMust)
- `READY_TO_COMMIT` (missingMust = [])
- `COMMITTED`

Draft хранится с TTL (например 7 дней) и может продолжаться диалогом.

---

## 6. Intent Contract (Agent Tooling)
### 6.1 Meta-intents (v1)
- `create_entity` (Draft→Commit)
- `update_entity` (DraftUpdate→CommitUpdate)
- `link_entities`
- `search`
- `capture_event` (Telegram intake)
- `dashboard` (situational cards/metrics)
- `explain` (why blocked/recommended)
- `approve` (quorum/techcouncil)
- `open_ui` (map/import/report link token)

### 6.2 Tool Calls (typed)
Agent не вызывает domain напрямую строками. Только типизированные вызовы:
- `draftCreate(entityType, payload)`
- `draftUpdate(entityRef, patch)`
- `validateDraft(draftRef)`
- `commitDraft(draftRef)`
- `search(query, filters)`
- `link(aRef, relation, bRef)`
- `captureEventDraft(input, attachmentsMeta)`
- `commitEvent(eventDraftRef)`
- `computePlanFact(scope)`
- `computeDeviations(scope)`
- `emitAlerts(scope)`
- `requestQuorum(decisionPayload)`
- `renderWidget(widgetPayload)`

---

## 7. Entity Schemas (MVP)
Ниже MUST/OPTIONAL для 3 критических сущностей (Party / Field / TechMap).
Остальные (Farm/Season/Task/Event) — отдельным файлом расширения.

### 7.1 Party (Counterparty) — MUST (Hard Block)
**MUST A: Identity**
- `partyType`: LEGAL_ENTITY | SOLE_PROPRIETOR | INDIVIDUAL
- `jurisdiction`: RU | BY | KZ
- `legalName`
- `displayName`
- `registrationIds[]` (минимум 1, есть `primary=true`)

**Primary ID policy:**
- RU LEGAL_ENTITY: INN + KPP + OGRN (все MUST)
- RU SOLE_PROPRIETOR: INN + OGRNIP (MUST)
- BY: UNP (MUST)
- KZ: BIN (юр) / IIN (физ) (MUST)

**MUST B: Legal address**
- `addresses.legal` (для LEGAL_ENTITY)

**MUST C: Banking (default strict)**
- `bankAccounts[0].accountNumber` (или IBAN)
- `bankAccounts[0].bankId` (BIC/SWIFT/банк-код)
- `bankAccounts[0].beneficiaryName`

**Rule:** `BankRequired=true` по умолчанию.  
Исключение: роль `PROSPECT` → можно без банка, но **финансовые операции запрещены**.

**MUST D: Primary contact**
- `primaryContact.name`
- `primaryContact.phone OR primaryContact.email`

**MUST E: Roles**
- `roles[]` минимум 1: CUSTOMER | SUPPLIER | PARTNER | PROSPECT | OTHER

**OPTIONAL (examples)**
- addresses.fact/delivery/postal
- extra contacts, extra bank accounts
- related parties / holding links
- docs, notes, tags
- regulatory profile (if not required immediately)

### 7.2 Field — MUST
**MUST**
- `farmRef` (привязка к хозяйству)
- `fieldNameOrCode` (например 4Б)
- `areaHa` (число)
- `locationHint` (район/нас.пункт) до появления геометрии
- `cropsAllowed` includes (rapeseed | sunflower) for MVP
- `status` ACTIVE

**OPTIONAL**
- `geometry` (полигон)
- soil params, slope, drainage
- history yields
- remote sensing IDs

### 7.3 TechMap — MUST (Executable Program)
**MUST**
- `fieldRef`
- `seasonRef`
- `crop`: rapeseed | sunflower
- `version`
- `status`: DRAFT | REVIEW | ACTIVE | CLOSED
- `assumptions[]` (ключевые допущения: влажность/окна работ/ресурсы)
- `targets` (минимум: yieldTarget, costCeiling)
- `tasks[]` (минимум 1)
- `economics` (минимум: expectedMargin model stub)
- `regenNotes` (минимум: пустая структура, чтобы было куда добавлять)

**OPTIONAL**
- detailed hourly schedule
- advanced regen practices
- supplier mapping, logistics plan
- attachments (docs)

**State machine**
- DRAFT → REVIEW (human check)
- REVIEW → ACTIVE (approval)
- ACTIVE → CLOSED (harvest closeout)

---

## 8. Telegram Intake → Event System (MVP)
### 8.1 Universal EventDraft
Любой input (text/voice/photo/video) превращается в:
- `eventType` (enum)
- `timestamp` (default now, can be overridden by text)
- `fieldRef?` / `farmRef?` / `taskRef?` (linking cascade)
- `payload` (typed by eventType)
- `evidence[]` (attachments + transcript + hashes)
- `confidence`
- `missingMust[]`

### 8.2 Linking Cascade (no commands)
1) explicit mention in text
2) chat context (last active field/farm/task)
3) geo (if available)
4) agent suggests 2–3 candidates → user taps 🔗 Link

### 8.3 MVP Event Types (10)
1) `FIELD_OBSERVATION` (weed/disease/pest/phenology/moisture)
2) `TASK_STARTED`
3) `TASK_COMPLETED`
4) `APPLICATION_DONE` (spray/fertilizer)
5) `SOWING_DONE`
6) `HARVEST_PROGRESS`
7) `INPUT_DELIVERY` (seeds/SZR/fertilizer)
8) `WEATHER_ANOMALY`
9) `NDVI_UPDATE`
10) `INCIDENT` (machine breakdown / safety)

### 8.4 MUST rules (examples)
**FIELD_OBSERVATION MUST**
- `fieldRef`
- `observationKind`
- `timestamp`
- `evidence` (text or media)

**TASK_COMPLETED MUST**
- `taskRef` (или однозначное match)
- `timestamp`

**INPUT_DELIVERY MUST**
- `counterpartyRef OR counterpartyDraft`
- `items[]` (name + qty)
- `timestamp`

### 8.5 Telegram Response Format (hard)
Agent отвечает:
1) 1–2 строки Summary (“Оформил наблюдение…”)  
2) 1 MUST-вопрос (макс 2)  
3) кнопки: ✅ / ✏️ / 🔗

---

## 9. Controller Engine (Plan/Fact → Deviations → Alerts)
### 9.1 Inputs
- committed TechMap + tasks
- committed Events (from Telegram + sensors + imports)
- optional: weather/NDVI feeds

### 9.2 Outputs
- `planFactMetrics` per task/field/farm/season
- `deviations` with severity levels
- `alerts` with recommended actions
- `widgetPayload` for Control Plane (cards/metrics)

### 9.3 Severity & Escalation
- deviation severity: S0..S4
- mapping to RiskGate R0..R4
- S3/S4 → auto `requestTechCouncil` (quorum)

---

## 10. Situational Widgets Contract (Control Plane)
Agent emits structured UI payloads:
- `updateCards[]` (compact cards)
- `newAlerts[]`
- `reactiveMetrics` (timeseries + aggregates)
- `openUiToken` (map/import/report)

Widget types (MVP):
- DeviationList
- FieldStatusCard
- TaskBacklog
- ForecastSummary
- RiskOverview
- Last24hChanges

---

## 11. Phased Delivery Plan (engineering)
### Phase 1 — Contracts + Draft/Commit (week 1)
- Zod/JSON schemas for Party/Field/TechMap + EventDraft
- Jurisdiction policies RU/BY/KZ
- Draft store + TTL + audit metadata

### Phase 2 — Telegram Intake MVP (week 1–2)
- captureEventDraft for text/voice/photo/video
- confirm/fix/link buttons
- linking cascade
- commitEvent + audit/evidence

### Phase 3 — CRM Agent MVP (week 2)
- create Party/Farm/Field via Draft→Commit
- DaData enrichment for Party (RU/BY/KZ where supported)
- BankRequired strict + PROSPECT exception gate

### Phase 4 — TechMap MVP (week 2–3)
- generate TechMap draft (rapeseed/sunflower)
- approval flow DRAFT→REVIEW→ACTIVE
- task fan-out to Telegram

### Phase 5 — Controller MVP (week 3–4)
- plan/fact metrics
- deviation detection
- alerts + escalation to tech council

### Phase 6 — Minimal Web Control Plane (parallel)
- Chat + Reactive Panel
- Approvals Inbox
- Map page token (later)

---

## 12. Test Scenarios (chat-driven acceptance)
### 12.1 Party registration RU (strict)
Input: “Зарегай ООО Ромашка, ИНН 7701234567”
Expected:
- Draft created from DaData
- missingMust includes KPP/OGRN if absent, legal address if absent, bank, contact, role
- commit blocked until all MUST provided
- commit writes Party + provenance

### 12.2 Telegram observation (photo)
Input: photo + “на 4Б жук, жрёт лист”
Expected:
- EventDraft FIELD_OBSERVATION
- field linking via context or 🔗 candidates
- must question only if fieldRef missing
- commit produces event + evidence

### 12.3 Controller deviation
Given: TechMap task planned nitrogen dose X
Event: APPLICATION_DONE dose X*1.07
Expected:
- deviation + severity computed
- alert emitted with recommendation
- if severity high → tech council requested

---

## 13. Non-Negotiables
- No commit without MUST completion (hard gate)
- Telegram remains free chat; commands are optional; buttons minimal (✅✏️🔗)
- Agent actions are typed tool calls only (no “string-execution”)
- Audit/provenance/confidence recorded for every committed field
- TechMap is the center; everything else serves it

---
End of Spec (v1)
