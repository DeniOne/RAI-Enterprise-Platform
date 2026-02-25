# PARTY MANAGEMENT CONTRACT (INSTITUTIONAL GRADE)

## 0. СТАТУС ДОКУМЕНТА
Данный документ является **жёстким архитектурным контрактом** (Foundation Law) для реализации модуля `Party Management` в рамках RAI Enterprise Platform. Любые изменения в сущностях контрагентов, прав доступа или отношений активов должны строго соответствовать этому контракту. Отклонения запрещены.

---

## 1. БАЗОВЫЕ СУЩНОСТИ (ENTITIES)

Архитектура строго разделяет юридическое лицо (Party), физический актив (Asset) и связи между ними.

### 1.1 `Party` (Юридически значимый узел)
- **Суть:** Базовая независимая сущность.
- **Инвариант:** Не содержит полей иерархии (никаких `parentId`).
- **Поля:**
  - `id` (UUID)
  - `tenantId` / `companyId` (Tenant Isolation)
  - `jurisdictionCode` (Контекст правил: `RU`, `BY` и т.д.)
  - `regulatoryProfileId` (Ссылка на профиль валидации)

### 1.2 `PartyRelation` (Граф отношений юрлиц)
- **Суть:** Ребро направленного графа, определяющее юридические/фактические отношения между узлами.
- **Поля:**
  - `id` (UUID)
  - `tenantId` (Tenant Isolation)
  - `sourcePartyId`
  - `targetPartyId`
  - `relationDomain` (Домен: `OWNERSHIP` | `MANAGEMENT` | `REPRESENTATION` | `RISK` | `BENEFICIAL`)
  - `relationType` (Конкретизация домена, например `SUBSIDIARY_OF`)
  - `jurisdictionCode` (Юрисдикция самой связи)
  - `basisDocumentId` (Ссылка на договор/решение/доверенность)
  - `basisDocumentType` (Тип документа-основания)
  - `weightPct` (0-100%, nullable — доля владения или риска)
  - `controlLevel` (`OPERATOR` | `ADMIN` | `SIGNATORY` — для management-домена)
  - `validFrom` (Начало действия юридической силы, Time-travel)
  - `validTo` (Конец действия)

### 1.3 `Asset` / `Farm` (Физический актив)
- **Суть:** Объект управления/владения (поле, техника, ангар).
- **Инвариант:** Отвязан от прямого жесткого владения в своей таблице. Не содержит единого поля `operatingPartyId`.
- **Поля:**
  - `id` (UUID)
  - `tenantId`
  - `name`, `type` и физические характеристики.

### 1.4 `AssetPartyRole` (Граф прав на активы)
- **Суть:** Резильентная связь, наделяющая `Party` правами на `Asset`.
- **Поля:**
  - `id` (UUID)
  - `assetId`
  - `partyId`
  - `role` (`OWNER` | `OPERATOR` | `LESSEE` | `CUSTODIAN` | `INSURED_BY` | `MANAGED_BY`)
  - `basisDocumentId` (Основание права)
  - `validFrom`
  - `validTo`

---

## 2. ДОМЕНЫ ОТНОШЕНИЙ (`relationDomain`)

Разделение доменов предотвращает смешивание контроля и капитала:

1. **`OWNERSHIP`** — Капитал, долевое участие. Включает `weightPct`. (Например: Владелец, Соучредитель).
2. **`MANAGEMENT`** — Операционный контроль. Включает `controlLevel`. (Например: УК, Генеральный директор).
3. **`REPRESENTATION`** — Юридическое представительство. Строго опирается на `basisDocumentId` (Доверенность).
4. **`RISK`** — Распределение рисков и ответственности (Страхование, поручительство).
5. **`BENEFICIAL`** — Конечные бенефициары (Бенефициарное владение для AML/KYC комплаенса).

---

## 3. 12 АРХИТЕКТУРНЫХ ИНВАРИАНТОВ (ОБЯЗАТЕЛЬНАЯ ВАЛИДАЦИЯ)

Данные инварианты должны проверяться на уровне БД (Constraints/Triggers) и Service Layer (Application logic).

### Граф и структура
1. **Запрет Self-Loop:** `sourcePartyId != targetPartyId`. Party не может ссылаться само на себя.
2. **Ацикличность владения (Ownership Cycle):** В домене `OWNERSHIP` запрещен цикл (A владеет B, B владеет A). Граф капитала должен быть Directed Acyclic Graph (DAG).
3. **Строгая кардинальность (Subsidiary Limit):** В домене `OWNERSHIP` при типе `SUBSIDIARY_OF` (дочерняя компания) сумма `weightPct` всех активных источников для одного `targetPartyId` на момент времени `T` не может превышать 100%.

### Время и Time-travel (ValidFrom / ValidTo)
4. **Запрет инверсии интервалов:** `validFrom < validTo` (если `validTo` не null).
5. **Запрет пересечений (Overlap Restriction):** Для одной и той же кортежи `(source, target, relationDomain, relationType)` не может быть пересекающихся интервалов `[validFrom, validTo]`. Мутации создают новые интервалы с закрытием старых.

### Tenant Isolation (Zero-Trust)
6. **Гомогенность тенанта (Tenant Homogeneity):** `tenantId` у `sourcePartyId` обязан совпадать с `tenantId` у `targetPartyId`.
7. **Когерентность ребра:** `PartyRelation.tenantId` = `Party.tenantId` (для обоих узлов). Cross-tenant связи строго запрещены на уровне БД.

### Юридический контекст (Compliance)
8. **Обоснованность представительства:** В домене `REPRESENTATION` поля `basisDocumentId` и `jurisdictionCode` обязательны (`NOT NULL`).
9. **Консистентность юрисдикции актива:** `jurisdictionCode` документа-основания (`basisDocumentId`) должен соответствовать `jurisdictionCode` участников, если иное не оговорено профилем законов.
10. **Асинхронное закрытие связи:** При разрыве связи (установка `validTo`) зависимые Ledger-операции проверяют контекст "среза на дату". Нельзя удалить связь физически (Delete), только логически (Terminate).

### Физические Активы (Assets)
11. **Обоснованность владения активом:** `AssetPartyRole` с ролью `LESSEE` (Арендатор) обязана иметь `basisDocumentId` (Договор аренды).
12. **Разделение прав на актив:** Один `Asset` в момент времени `T` может иметь разные роли на разных узлах (например: `Party A` - `OWNER`, `Party B` - `OPERATOR`), но конфликтующие роли (два `OWNER`, в сумме дающие более 100%, если введена долевая собственность на актив) запрещены.

---

## 4. ИНТЕРФЕЙСЫ ДОСТУПА ДЛЯ LEDGER

Любое извлечение данных для Ledger и смарт-контрактов должно поддерживать параметр `asOf` (срез на дату).

- `GET /api/v1/parties/:id/graph?asOf=YYYY-MM-DD&domain=OWNERSHIP`
- `GET /api/v1/parties/:id/assets?asOf=YYYY-MM-DD&role=OPERATOR`

Система генерирует организационный или правовой слепок строго на переданную метку времени.
