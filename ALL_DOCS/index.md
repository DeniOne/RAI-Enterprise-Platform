---
id: DOC-ARC-DECISIONS-INDEX-1X1E
layer: Architecture
type: ADR
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-12
---
# Архитектурные решения (ADR)

Хронологический список всех принятых архитектурных решений.

---

## 📋 Активные решения

| Номер | Название | Статус | Дата | Ссылка |
|-------|----------|--------|------|--------|
| ADR 001 | Модульный Монолит в Monorepo | ✅ Принято | 2026.02.02 | [📄](./ADR_001_MICROSERVICES_VS_MONOLITH.md) |
| ADR 002 | Стратегия хранения событий | ✅ Принято | 2026.02.02 | [📄](./ADR_002_EVENT_STORING_STRATEGY.md) |
| ADR 003 | Стратегия баз данных | ✅ Принято | 2026.02.02 | [📄](./ADR_003_DATABASE_STRATEGY.md) |
| ADR 004 | API Gateway Pattern | ✅ Принято | 2026.02.02 | [📄](./ADR_004_API_GATEWAY_PATTERN.md) |
| ADR 005 | Аутентификация и авторизация | ✅ Принято | 2026.02.02 | [📄](./ADR_005_Аутентификация%20и%20авторизация.md) |
| ADR DB 001 | Tenant vs Company Boundary | 🟡 Proposed | 2026.03.13 | [📄](./ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md) |
| ADR DB 002 | Schema Fragmentation and Ownership | 🟡 Proposed | 2026.03.13 | [📄](./ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md) |
| ADR DB 003 | Enum Governance | 🟡 Proposed | 2026.03.13 | [📄](./ADR_DB_003_ENUM_GOVERNANCE.md) |
| ADR DB 004 | Read Models and Projections Policy | 🟡 Proposed | 2026.03.13 | [📄](./ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md) |
| ADR DB 005 | Index and Query Governance | 🟡 Proposed | 2026.03.13 | [📄](./ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md) |
| ADR 013 | External Front-Office Access for Counterparty Representatives | 🟡 Proposed | 2026.03.12 | [📄](./ADR_013_EXTERNAL_FRONT_OFFICE_ACCESS.md) |

---

## 🏗️ По категориям

### **Архитектурный стиль и структура**
- [ADR 001: Модульный Монолит в Monorepo](./ADR_001_MICROSERVICES_VS_MONOLITH.md)
- [ADR 004: API Gateway Pattern — Unified entry point](./ADR_004_API_GATEWAY_PATTERN.md)

### **Данные и события**
- [ADR 002: Стратегия хранения событий — Hybrid CRUD + Audit](./ADR_002_EVENT_STORING_STRATEGY.md)
- [ADR 003: Стратегия баз данных — Single DB setup](./ADR_003_DATABASE_STRATEGY.md)
- [ADR DB 001: Tenant vs Company Boundary](./ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md)
- [ADR DB 002: Schema Fragmentation and Ownership](./ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md)
- [ADR DB 003: Enum Governance](./ADR_DB_003_ENUM_GOVERNANCE.md)
- [ADR DB 004: Read Models and Projections Policy](./ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md)
- [ADR DB 005: Index and Query Governance](./ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md)

### **Безопасность**
- [ADR 005: Аутентификация и авторизация — JWT + Multi-tenancy](./ADR_005_Аутентификация%20и%20авторизация.md)
- [ADR 013: External Front-Office Access for Counterparty Representatives](./ADR_013_EXTERNAL_FRONT_OFFICE_ACCESS.md)

---

## 📝 Как создавать новые ADR

1. Скопируйте шаблон: `cp ADR_TEMPLATE.md ADR_00X_НАЗВАНИЕ.md`
2. Заполните все секции
3. Обсудите с командой
4. Обновите статус на "Принято"
5. Добавьте в этот индекс

---

## 🔄 Жизненный цикл ADR

1. **Предложено** → Идея записана
2. **В обсуждении** → Команда обсуждает
3. **Принято** → Решение утверждено
4. **Устарело** → Заменено новым ADR
5. **Отклонено** → Не принято

---

*Последнее обновление: 2026.03.12*.
