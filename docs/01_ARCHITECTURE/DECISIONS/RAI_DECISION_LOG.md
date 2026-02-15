---
id: DOC-ARC-GEN-032
type: HLD
layer: Architecture
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

---
id: decision-log-main
type: decision
status: approved
owners: [architects]
aligned_with: [principle-axioms]
---

# RAI Decision Log

## [2026-02-03] ADR-006: Enterprise Identity & Structure Layer (Block 3)
**Статус:** ACCEPTED
**Контекст:** Реализация реестров холдингов и профилей сотрудников.
**Решение:** 
1. Введены модели `Holding`, `EmployeeProfile`, `RoleDefinition`.
2. **Жёсткая граница:** Это пассивные реестры, а не CRM/HR.
3. **Безопасность:** `RoleDefinition` — это организационная должность, а не права доступа.
4. **Изоляция:** Введена обязательная проверка `companyId` (tenant) для всех операций в реестрах.

